require('dotenv').config();
const Document = require('../models/Document');
const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const ExcelJS = require('exceljs');
// const sharp = require('sharp'); // IMPROVEMENT: Removed unused dependency
const tesseract = require('tesseract.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger, documentLogger, createModuleLogger } = require('../config/logger');

// Create module-specific logger
const moduleLogger = createModuleLogger('DocumentController');

// IMPROVEMENT: Fail fast if the API key is not provided
if (!process.env.GEMINI_API_KEY) {
  console.log(process.env.GEMINI_API_KEY);
  throw new Error('GEMINI_API_KEY environment variable not set.');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Document analysis configuration for KMRL (No changes needed here)
const ANALYSIS_CONFIG = {
  departments: [
    { name: 'Safety & Operations', keywords: ['safety', 'accident', 'incident', 'emergency', 'protocol', 'maintenance', 'platform', 'track'] },
    { name: 'Engineering', keywords: ['engineering', 'technical', 'specification', 'drawing', 'design', 'construction', 'signal'] },
    { name: 'Procurement', keywords: ['vendor', 'invoice', 'purchase', 'contract', 'payment', 'supplier', 'tender', 'quotation'] },
    { name: 'Human Resources', keywords: ['hr', 'employee', 'staff', 'training', 'policy', 'recruitment', 'performance', 'leave'] },
    { name: 'Environment', keywords: ['environment', 'environmental', 'impact', 'assessment', 'pollution', 'green', 'sustainability'] },
    { name: 'Finance', keywords: ['finance', 'financial', 'budget', 'cost', 'revenue', 'accounting', 'audit', 'expenditure'] },
    { name: 'Operations', keywords: ['operations', 'service', 'schedule', 'timetable', 'passenger', 'revenue', 'performance'] }
  ],
  documentTypes: [
    { name: 'Safety Circular', keywords: ['circular', 'safety notice', 'alert', 'warning', 'precaution'] },
    { name: 'Invoice', keywords: ['invoice', 'bill', 'payment', 'amount due', 'vendor bill'] },
    { name: 'Policy', keywords: ['policy', 'guideline', 'procedure', 'rule', 'regulation'] },
    { name: 'Engineering Drawing', keywords: ['drawing', 'blueprint', 'schematic', 'plan', 'specification'] },
    { name: 'Maintenance Report', keywords: ['maintenance', 'repair', 'inspection', 'service report'] },
    { name: 'Impact Study', keywords: ['impact', 'assessment', 'study', 'analysis', 'evaluation'] },
    { name: 'Training Material', keywords: ['training', 'manual', 'handbook', 'guide', 'instruction'] },
    { name: 'Board Minutes', keywords: ['minutes', 'meeting', 'board', 'resolution', 'decision'] }
  ],
  urgencyKeywords: ['urgent', 'immediate', 'emergency', 'critical', 'asap', 'priority', 'deadline']
};

// Text extraction functions
async function extractTextFromFile(filePath, mimetype, filename = '') {
  const startTime = Date.now();

  try {
    moduleLogger.info(`Starting text extraction`, {
      filename,
      filePath,
      mimetype,
      action: 'text-extraction-start'
    });

    let extractedText = '';
    let method = '';

    switch (mimetype) {
      case 'application/pdf':
        method = 'PDF Parser';
        moduleLogger.debug(`Using PDF parser for ${filename}`);
        // FIX: Use async readFile to avoid blocking the event loop
        const pdfBuffer = await fs.readFile(filePath);
        const pdfData = await pdf(pdfBuffer);
        extractedText = pdfData.text;

        moduleLogger.debug(`PDF parsing completed`, {
          filename,
          pages: pdfData.numpages || 0,
          textLength: extractedText.length
        });
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        method = 'Mammoth (Word)';
        moduleLogger.debug(`Using Mammoth for Word document: ${filename}`);
        const docResult = await mammoth.extractRawText({ path: filePath });
        extractedText = docResult.value;

        moduleLogger.debug(`Word document parsing completed`, {
          filename,
          textLength: extractedText.length,
          warnings: docResult.messages?.length || 0
        });
        break;

      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        method = 'ExcelJS';
        moduleLogger.debug(`Using ExcelJS for Excel document: ${filename}`);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        let excelText = '';
        let sheetCount = 0;

        workbook.eachSheet((worksheet) => {
          sheetCount++;
          excelText += `Sheet: ${worksheet.name}\n`;
          worksheet.eachRow((row) => {
            const rowValues = row.values.slice(1).map(cell => {
                if (cell && typeof cell === 'object' && cell.richText) {
                    return cell.richText.map(rt => rt.text).join('');
                }
                return cell ? cell.toString() : '';
            });
            if (rowValues.some(val => val.trim())) {
              excelText += rowValues.join(',') + '\n';
            }
          });
          excelText += '\n';
        });
        extractedText = excelText;

        moduleLogger.debug(`Excel parsing completed`, {
          filename,
          sheets: sheetCount,
          textLength: extractedText.length
        });
        break;

      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
        method = 'Tesseract OCR';
        moduleLogger.info(`Starting OCR processing for image: ${filename}`);

        const { data: { text } } = await tesseract.recognize(filePath, 'eng+mal', {
          logger: (m) => {
            if (m.status && m.progress) {
              moduleLogger.debug(`OCR Progress: ${m.status}`, {
                filename,
                progress: `${(m.progress * 100).toFixed(1)}%`,
                step: m.status
              });
            }
          }
        });
        extractedText = text;

        moduleLogger.debug(`OCR processing completed`, {
          filename,
          textLength: extractedText.length,
          language: 'eng+mal'
        });
        break;

      case 'text/plain':
        method = 'Direct file read';
        moduleLogger.debug(`Reading plain text file: ${filename}`);
        extractedText = await fs.readFile(filePath, 'utf8');
        break;

      default:
        const error = new Error(`Unsupported file type: ${mimetype}`);
        moduleLogger.error(`Unsupported file type`, {
          filename,
          mimetype,
          filePath
        });
        throw error;
    }

    const duration = Date.now() - startTime;

    // Log successful extraction
    documentLogger.textExtraction(filename, method, extractedText.length, duration);

    moduleLogger.info(`Text extraction completed successfully`, {
      filename,
      method,
      textLength: extractedText.length,
      duration: `${duration}ms`,
      action: 'text-extraction-complete'
    });

    console.log(`Text extracted successfully from ${filename}, length: ${extractedText.length}`);
    return extractedText;

  } catch (error) {
    const duration = Date.now() - startTime;

    moduleLogger.error(`Text extraction failed`, {
      filename,
      filePath,
      mimetype,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      action: 'text-extraction-error'
    });

    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text from document: ${error.message}`);
  }
}

// AI-powered document analysis using Gemini
async function analyzeDocumentWithGemini(text, filename) {
  const startTime = Date.now();

  moduleLogger.info(`Starting AI analysis with Gemini`, {
    filename,
    textLength: text.length,
    action: 'ai-analysis-start'
  });
  const analysisPrompt = `
You are an AI assistant analyzing documents for KMRL (Kochi Metro Rail Limited). 

Document: ${filename}
Content: ${text.substring(0, 8000)}

Please analyze this document and provide a comprehensive analysis in JSON format. Focus on creating a meaningful, business-oriented summary rather than just listing extracted text.

Return ONLY valid JSON with these exact fields:
{
  "summary": "A professional, meaningful 3-4 sentence summary that explains what this document is about, its purpose, key findings, and business impact. DO NOT just copy extracted text.",
  "keyTopics": ["3-5 main business topics covered"],
  "department": "Most relevant department: Safety & Operations, Engineering, Procurement, Human Resources, Environment, Finance, Operations, or General",
  "documentType": "Document type: Safety Circular, Invoice, Policy, Engineering Drawing, Maintenance Report, Impact Study, Training Material, Board Minutes, or General Document",
  "urgencyLevel": "high/medium/low based on business priority and deadlines",
  "language": "English/Malayalam/Bilingual",
  "entities": {
    "dates": ["important dates found"],
    "amounts": ["monetary amounts with currency"],
    "locations": ["relevant locations/stations"],
    "organizations": ["companies/departments mentioned"]
  },
  "actionItems": ["specific tasks, deadlines, or actions required"],
  "tags": ["5-8 relevant tags for categorization"],
  "sentiment": "positive/negative/neutral",
  "businessImpact": "Brief explanation of how this document impacts KMRL operations",
  "confidence": 0.85
}

For invoices: Focus on vendor, amount, items purchased, payment terms, business impact.
For safety docs: Focus on safety measures, affected areas, compliance requirements.
For policies: Focus on policy changes, affected personnel, implementation timeline.
`;
  try {
    moduleLogger.debug(`Sending analysis request to Gemini`, {
      filename,
      promptLength: analysisPrompt.length,
      textPreview: text.substring(0, 200)
    });

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const analysisText = response.text();

    moduleLogger.debug(`Received response from Gemini`, {
      filename,
      responseLength: analysisText.length,
      responsePreview: analysisText.substring(0, 200)
    });

    const cleanedResponse = analysisText.replace(/```json\n?|```\n?/g, '').trim();

    // IMPROVEMENT: Add a specific try/catch for JSON parsing for more resilience.
    let analysis;
    try {
        analysis = JSON.parse(cleanedResponse);
        moduleLogger.debug(`Successfully parsed Gemini response`, {
          filename,
          department: analysis.department,
          documentType: analysis.documentType,
          confidence: analysis.confidence
        });
    } catch(parseError) {
        moduleLogger.error('Failed to parse JSON from Gemini response', {
          filename,
          error: parseError.message,
          rawResponse: cleanedResponse.substring(0, 500)
        });
        console.error('Failed to parse JSON from Gemini response:', parseError);
        console.log('Raw response was:', cleanedResponse);
        throw new Error('AI model returned invalid JSON.'); // This will trigger the rule-based fallback
    }

    analysis.processedWith = 'gemini-ai';
    analysis.processedAt = new Date();

    const duration = Date.now() - startTime;

    // Log successful analysis
    documentLogger.aiAnalysis(filename, 'gemini-ai', duration, analysis.confidence || 0);

    moduleLogger.info(`AI analysis completed successfully`, {
      filename,
      analysisType: 'gemini-ai',
      department: analysis.department,
      documentType: analysis.documentType,
      duration: `${duration}ms`,
      confidence: analysis.confidence,
      action: 'ai-analysis-complete'
    });

    console.log(`AI analysis completed for ${filename}.`);
    return analysis;

  } catch (error) {
    const duration = Date.now() - startTime;

    moduleLogger.warn(`Gemini AI analysis failed, falling back to rule-based`, {
      filename,
      error: error.message,
      duration: `${duration}ms`,
      fallback: 'rule-based'
    });

    console.error('Gemini AI analysis error:', error);
    console.log('Falling back to rule-based analysis...');
    return performRuleBasedAnalysis(text, filename);
  }
}

// Fallback rule-based analysis and helpers (No changes needed, these are well-written)
function performRuleBasedAnalysis(text, filename) {
    const lowerText = text.toLowerCase();
    const lowerFilename = filename.toLowerCase();
    
    // Determine department
    let department = 'General';
    let maxScore = 0;
    ANALYSIS_CONFIG.departments.forEach(dept => {
      const score = dept.keywords.reduce((acc, keyword) => 
        acc + (lowerText.includes(keyword) || lowerFilename.includes(keyword) ? 1 : 0), 0);
      if (score > maxScore) {
        maxScore = score;
        department = dept.name;
      }
    });
  
    // Determine document type
    let docType = 'General Document';
    maxScore = 0;
    ANALYSIS_CONFIG.documentTypes.forEach(type => {
      const score = type.keywords.reduce((acc, keyword) => 
        acc + (lowerText.includes(keyword) || lowerFilename.includes(keyword) ? 1 : 0), 0);
      if (score > maxScore) {
        maxScore = score;
        docType = type.name;
      }
    });
  
    // Check urgency
    const urgencyScore = ANALYSIS_CONFIG.urgencyKeywords.reduce((acc, keyword) => 
      acc + (lowerText.includes(keyword) ? 1 : 0), 0);
    const urgencyLevel = urgencyScore > 2 ? 'high' : urgencyScore > 0 ? 'medium' : 'low';
  
    // Detect language
    const malayalamPattern = /[\u0D00-\u0D7F]/;
    const hasEnglish = /[a-zA-Z]/.test(text);
    const hasMalayalam = malayalamPattern.test(text);
    
    let language = 'English';
    if (hasEnglish && hasMalayalam) language = 'Bilingual';
    else if (hasMalayalam) language = 'Malayalam';
  
    // Extract basic entities
    const entities = {
      dates: text.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}-\d{2}-\d{2}/g) || [],
      amounts: text.match(/₹[\d,]+|\$[\d,]+|Rs\.?\s*[\d,]+/g) || [],
      locations: extractLocations(text),
      organizations: extractOrganizations(text)
    };
  
    // Generate summary
    const summary = text.length > 300 ? 
      `Document analysis for ${filename}. Contains ${text.length} characters of content related to ${department.toLowerCase()}. ${docType} requiring ${urgencyLevel} priority attention.` :
      text.substring(0, 250) + '...';
  
    // Generate tags
    const tags = generateTags(text, department, docType, filename);
  
    return {
      summary,
      keyTopics: extractKeywords(text),
      department,
      documentType: docType,
      urgencyLevel,
      language,
      entities,
      actionItems: extractActionItems(text),
      tags,
      sentiment: 'neutral',
      businessImpact: `This ${docType.toLowerCase()} affects ${department} operations and requires appropriate follow-up action.`,
      confidence: 0.75,
      processedWith: 'rule-based',
      processedAt: new Date()
    };
}
  
function extractKeywords(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const frequency = {};
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    return Object.entries(frequency).sort(([,a], [,b]) => b - a).slice(0, 8).map(([word]) => word);
}
  
function extractLocations(text) {
    const kmrlLocations = ['aluva', 'kalamassery', 'cusat', 'pathadipalam', 'edapally', 'changampuzha park', 'palarivattom', 'jln stadium', 'kaloor', 'lissie', 'mg road', 'maharajas', 'ernakulam south', 'kadavanthra', 'elamkulam', 'vyttila', 'thaikoodam', 'petta', 'vytilla'];
    const found = new Set();
    const lowerText = text.toLowerCase();
    kmrlLocations.forEach(location => {
        if(lowerText.includes(location)) found.add(location);
    });
    return Array.from(found);
}
  
function extractOrganizations(text) {
    const organizations = ['kmrl', 'kochi metro', 'dmrc', 'kerala government', 'cochin shipyard', 'infopark', 'metro rail'];
    const found = new Set();
    const lowerText = text.toLowerCase();
    organizations.forEach(org => {
        if(lowerText.includes(org)) found.add(org);
    });
    return Array.from(found);
}
  
function extractActionItems(text) {
    const actionWords = ['complete', 'submit', 'review', 'approve', 'implement', 'deadline', 'due', 'action required', 'must', 'shall', 'should'];
    const sentences = text.split(/[.!?]+/);
    return sentences.filter(sentence => 
      actionWords.some(word => sentence.toLowerCase().includes(word))
    ).slice(0, 5).map(sentence => sentence.trim()).filter(s => s.length > 0);
}
  
function generateTags(text, department, docType, filename) {
    const tags = new Set();
    if (department !== 'General') tags.add(department.toLowerCase().replace(/\s+/g, '-'));
    if (docType !== 'General Document') tags.add(docType.toLowerCase().replace(/\s+/g, '-'));
    const ext = path.extname(filename).slice(1).toLowerCase();
    if (ext) tags.add(ext);
    const kmrlTerms = ['metro', 'rail', 'transport', 'kochi', 'kerala', 'station', 'passenger'];
    kmrlTerms.forEach(term => {
      if (text.toLowerCase().includes(term)) tags.add(term);
    });
    if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('emergency')) tags.add('urgent');
    return Array.from(tags);
}

// Controller functions (No major changes needed, logic is sound)
const getDocuments = async (req, res) => {
    try {
      const { department, type, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      let query = {};
  
      if (department && department !== 'all') {
        // Using a regex for case-insensitivity. You might want an exact match depending on needs.
        query.department = { $regex: `^${department}$`, $options: 'i' };
      }
      
      if (type && type !== 'all-types') {
        const typeFormatted = type.replace(/-/g, ' ');
        query.type = { $regex: `^${typeFormatted}$`, $options: 'i' };
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { summary: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
          { 'analysis.keyTopics': { $regex: search, $options: 'i' } }
        ];
      }
  
      const skip = (page - 1) * limit;
      const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
  
      const documents = await Document.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit));
  
      const total = await Document.countDocuments(query);
  
      // Transform documents to match frontend expectations
      const transformedDocuments = documents.map(doc => {
        const docObj = doc.toObject();
        return {
          ...docObj,
          documentType: docObj.type,  // Map type to documentType for frontend
          priority: docObj.status === 'urgent' ? 'High' :
                   docObj.status === 'review' ? 'Medium' : 'Low'  // Map status to priority
        };
      });

      res.json({
        documents: transformedDocuments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const uploadDocument = async (req, res) => {
    const uploadStartTime = Date.now();

    // Note: Ensure your multer setup in the router uses `.any()` or `.array()` for this logic.
    const uploadedFiles = req.files || (req.file ? [req.file] : []);

    moduleLogger.info(`Document upload request received`, {
      fileCount: uploadedFiles.length,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      action: 'upload-request'
    });

    if (!uploadedFiles.length) {
      moduleLogger.warn(`Upload request rejected - no files provided`, {
        ip: req.ip,
        action: 'upload-rejected'
      });
      return res.status(400).json({ message: 'Please upload at least one file.' });
    }

    // Log details about uploaded files
    uploadedFiles.forEach((file, index) => {
      documentLogger.uploadStart(file.originalname, {
        fileSize: file.size,
        mimeType: file.mimetype,
        fileIndex: index + 1,
        totalFiles: uploadedFiles.length,
        uploadPath: file.path
      });
    });

    try {
      // Process all files in parallel using Promise.allSettled
      const fileProcessingPromises = uploadedFiles.map(async (file) => {
        const { originalname, mimetype, path: filePath, size } = file;
        const fileProcessingStart = Date.now();

        moduleLogger.info(`Starting file processing`, {
          filename: originalname,
          mimetype,
          size,
          action: 'file-processing-start'
        });

        documentLogger.uploadProgress(originalname, 'File received and validated');

        try {
          // Step 1: Text Extraction
          documentLogger.uploadProgress(originalname, 'Starting text extraction');
          const extractedText = await extractTextFromFile(filePath, mimetype, originalname);

          if (!extractedText || extractedText.trim().length === 0) {
            moduleLogger.error(`No text content found in document`, {
              filename: originalname,
              filePath,
              action: 'text-extraction-failed'
            });

            // After processing, we should clean up the uploaded file if it's invalid.
            await fs.unlink(filePath);
            throw new Error('No text content found in document');
          }

          documentLogger.uploadProgress(originalname, 'Text extraction completed', {
            textLength: extractedText.length
          });

          // Step 2: AI Analysis
          documentLogger.uploadProgress(originalname, 'Starting AI analysis');
          const analysis = await analyzeDocumentWithGemini(extractedText, originalname);

          documentLogger.uploadProgress(originalname, 'AI analysis completed', {
            department: analysis.department,
            documentType: analysis.documentType,
            confidence: analysis.confidence
          });

          // Step 3: Determine document status
          let status = 'pending';
          if (analysis.urgencyLevel === 'high') status = 'urgent';
          else if (analysis.documentType === 'Policy' || analysis.documentType === 'Safety Circular') status = 'review';
          else if (analysis.documentType === 'Board Minutes') status = 'approved';

          documentLogger.uploadProgress(originalname, 'Creating database document', {
            status,
            department: analysis.department,
            documentType: analysis.documentType
          });

          // Step 4: Create document object
          const newDocument = new Document({
            title: originalname.replace(/\.[^/.]+$/, ''), // More robust extension removal
            department: analysis.department || 'General',
            type: analysis.documentType || 'General Document',
            status: status,
            summary: analysis.summary || `AI-processed document: ${originalname}`,
            tags: analysis.tags || ['ai-processed'],
            language: analysis.language || 'English',
            source: `AI Analysis via ${analysis.processedWith === 'gemini-ai' ? 'Gemini' : 'Rule-based'}`,
            originalFilename: originalname,
            filePath: filePath,
            fileSize: size,
            mimeType: mimetype,
            extractedText: extractedText.substring(0, 10000), // Store more text if needed
            analysis: {
              keyTopics: analysis.keyTopics || [],
              entities: analysis.entities || {},
              actionItems: analysis.actionItems || [],
              sentiment: analysis.sentiment || 'neutral',
              urgencyLevel: analysis.urgencyLevel || 'medium',
              businessImpact: analysis.businessImpact || '',
              confidence: analysis.confidence || 0.75,
              processedAt: analysis.processedAt || new Date(),
              aiModel: analysis.processedWith === 'gemini-ai' ? 'gemini-1.5-flash' : 'rule-based'
            },
            processed: true,
            date: new Date().toISOString().split('T')[0]
          });

          // Step 5: Save to database
          documentLogger.uploadProgress(originalname, 'Saving to database');
          const savedDocument = await newDocument.save();

          // Log successful completion
          const fileProcessingDuration = Date.now() - fileProcessingStart;
          documentLogger.uploadComplete(originalname, savedDocument._id, {
            department: savedDocument.department,
            documentType: savedDocument.type,
            fileSize: savedDocument.fileSize,
            processingDuration: `${fileProcessingDuration}ms`
          });

          moduleLogger.info(`Document processing completed successfully`, {
            filename: originalname,
            documentId: savedDocument._id,
            department: savedDocument.department,
            documentType: savedDocument.type,
            processingDuration: `${fileProcessingDuration}ms`,
            action: 'file-processing-complete'
          });

          console.log(`Document saved to database with ID: ${savedDocument._id}`);

          return {
            success: true,
            document: savedDocument,
            filename: originalname,
            message: 'Document uploaded and analyzed successfully'
          };

        } catch (fileError) {
          console.error(`Error processing ${originalname}:`, fileError);
          // If a file fails, we still need to delete it from the temp uploads folder
          await fs.unlink(filePath).catch(err => console.error(`Failed to delete temp file ${filePath}`, err));

          return {
            success: false,
            filename: originalname,
            error: fileError.message
          };
        }
      });

      // Wait for all file processing to complete (parallel execution)
      const settledResults = await Promise.allSettled(fileProcessingPromises);

      // Extract results from Promise.allSettled format
      const results = settledResults.map(result => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // Handle any unexpected promise rejections
          moduleLogger.error('Unexpected promise rejection in file processing', {
            error: result.reason?.message || 'Unknown error',
            action: 'parallel-processing-error'
          });
          return {
            success: false,
            filename: 'unknown',
            error: result.reason?.message || 'Unknown processing error'
          };
        }
      });

      const totalProcessingDuration = Date.now() - uploadStartTime;

      moduleLogger.info(`Parallel file processing completed`, {
        totalFiles: uploadedFiles.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalDuration: `${totalProcessingDuration}ms`,
        action: 'parallel-processing-complete'
      });
  
      // Respond based on how many files were processed
      if (results.length === 1) {
        const result = results[0];
        if (result.success) {
          const docObj = result.document.toObject();
          const transformedDoc = {
            ...docObj,
            documentType: docObj.type,
            priority: docObj.status === 'urgent' ? 'High' :
                     docObj.status === 'review' ? 'Medium' : 'Low'
          };
          res.status(201).json(transformedDoc);
        } else {
          res.status(400).json({ message: 'Failed to process document', error: result.error });
        }
      } else {
        res.status(207).json({ // 207 Multi-Status is appropriate for bulk operations
          message: `Processed ${results.length} documents`,
          results,
          summary: {
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          }
        });
      }
    } catch (error) {
      console.error('Document processing error:', error);
      res.status(500).json({ 
        message: 'A server error occurred during the upload process.',
        error: error.message,
      });
    }
};

const getDocumentAnalysis = async (req, res) => {
    try {
      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      res.json(document.analysis); // Just send the analysis object
    } catch (error) {
      console.error('Get analysis error:', error);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid document ID format' });
      }
      res.status(500).json({ message: 'Server Error' });
    }
};
  

// ... (keep all your other functions like getDocuments, uploadDocument) ...

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Public (you might want to secure this later)
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // ⭐ IMPROVEMENT: Handle cases where the file might already be deleted
    try {
      // 1. Attempt to delete the physical file
      await fs.unlink(document.filePath);
    } catch (error) {
      // If the error is "file not found", we can safely ignore it.
      // The goal is for the file to be gone, and it already is.
      if (error.code !== 'ENOENT') {
        // If it's a different error (e.g., permissions), throw it
        throw error;
      }
      console.log('File was already deleted from filesystem. Proceeding to delete from DB.');
    }

    // 2. Delete the document record from the database
    await document.deleteOne();

    res.json({ message: 'Document removed successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/documents/stats/dashboard
// @access  Public
const getDashboardStats = async (req, res) => {
  try {
    moduleLogger.info('Dashboard statistics request received', {
      ip: req.ip,
      action: 'dashboard-stats-request'
    });

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const yesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Execute all queries in parallel for better performance
    const [
      documentsToday,
      documentsYesterday,
      urgentDocuments,
      totalDocuments,
      departmentCounts,
      weeklyProcessingTimes,
      languageDistribution
    ] = await Promise.all([
      Document.countDocuments({ createdAt: { $gte: startOfDay } }),
      Document.countDocuments({
        createdAt: { $gte: yesterday, $lt: startOfDay }
      }),
      Document.countDocuments({ status: 'urgent' }),
      Document.countDocuments(),
      Document.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Document.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfWeek },
            'analysis.processedAt': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgProcessingTime: { $avg: '$analysis.confidence' }
          }
        }
      ]),
      Document.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    // Calculate percentage change from yesterday
    const dailyChange = documentsYesterday > 0
      ? ((documentsToday - documentsYesterday) / documentsYesterday * 100).toFixed(1)
      : documentsToday > 0 ? 100 : 0;

    // Mock processing time improvement (in production, calculate from actual processing logs)
    const avgProcessingHours = 2.3;
    const processingImprovement = 15; // percentage

    // Count active departments (those with documents)
    const activeDepartments = departmentCounts.length;

    const stats = {
      documentsToday,
      dailyChange: parseFloat(dailyChange),
      urgentDocuments,
      avgProcessingTime: {
        hours: avgProcessingHours,
        improvement: processingImprovement
      },
      activeUsers: Math.floor(Math.random() * 200) + 100, // Mock data - replace with real user tracking
      activeDepartments,
      totalDocuments,
      departmentDistribution: departmentCounts,
      languageDistribution
    };

    moduleLogger.info('Dashboard statistics computed successfully', {
      documentsToday,
      urgentDocuments,
      totalDocuments,
      activeDepartments,
      action: 'dashboard-stats-success'
    });

    res.json(stats);
  } catch (error) {
    moduleLogger.error('Dashboard statistics error', {
      error: error.message,
      stack: error.stack,
      action: 'dashboard-stats-error'
    });
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get document upload trends over time
// @route   GET /api/documents/stats/upload-trends
// @access  Public
const getUploadTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysCount = parseInt(days);

    moduleLogger.info('Upload trends request received', {
      days: daysCount,
      ip: req.ip,
      action: 'upload-trends-request'
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);

    const trends = await Document.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          departments: { $addToSet: '$department' },
          urgentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'urgent'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          count: 1,
          departmentCount: { $size: '$departments' },
          urgentCount: 1
        }
      }
    ]);

    // Fill in missing dates with zero counts
    const filledTrends = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = trends.find(item =>
        item.date.toISOString().split('T')[0] === dateStr
      );

      filledTrends.push({
        date: dateStr,
        count: existingData ? existingData.count : 0,
        departmentCount: existingData ? existingData.departmentCount : 0,
        urgentCount: existingData ? existingData.urgentCount : 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    moduleLogger.info('Upload trends computed successfully', {
      days: daysCount,
      dataPoints: filledTrends.length,
      totalUploads: filledTrends.reduce((sum, item) => sum + item.count, 0),
      action: 'upload-trends-success'
    });

    res.json({
      period: `${daysCount} days`,
      data: filledTrends
    });
  } catch (error) {
    moduleLogger.error('Upload trends error', {
      error: error.message,
      stack: error.stack,
      action: 'upload-trends-error'
    });
    console.error('Upload trends error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get department-wise document distribution
// @route   GET /api/documents/stats/department-distribution
// @access  Public
const getDepartmentDistribution = async (req, res) => {
  try {
    moduleLogger.info('Department distribution request received', {
      ip: req.ip,
      action: 'department-distribution-request'
    });

    const distribution = await Document.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          urgentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'urgent'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          reviewCount: {
            $sum: { $cond: [{ $eq: ['$status', 'review'] }, 1, 0] }
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          avgConfidence: { $avg: '$analysis.confidence' },
          documentTypes: { $addToSet: '$type' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $project: {
          department: '$_id',
          count: 1,
          urgentCount: 1,
          pendingCount: 1,
          reviewCount: 1,
          approvedCount: 1,
          avgConfidence: { $round: ['$avgConfidence', 3] },
          documentTypeCount: { $size: '$documentTypes' },
          percentage: {
            $multiply: [
              { $divide: ['$count', { $sum: '$count' }] },
              100
            ]
          }
        }
      }
    ]);

    // Calculate total for percentage calculation
    const totalDocs = distribution.reduce((sum, item) => sum + item.count, 0);

    // Add percentage calculation
    const distributionWithPercentage = distribution.map(item => ({
      ...item,
      percentage: totalDocs > 0 ? ((item.count / totalDocs) * 100).toFixed(1) : 0
    }));

    moduleLogger.info('Department distribution computed successfully', {
      departments: distribution.length,
      totalDocuments: totalDocs,
      action: 'department-distribution-success'
    });

    res.json({
      totalDocuments: totalDocs,
      departments: distributionWithPercentage
    });
  } catch (error) {
    moduleLogger.error('Department distribution error', {
      error: error.message,
      stack: error.stack,
      action: 'department-distribution-error'
    });
    console.error('Department distribution error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get processing efficiency metrics
// @route   GET /api/documents/stats/processing-efficiency
// @access  Public
const getProcessingEfficiency = async (req, res) => {
  try {
    moduleLogger.info('Processing efficiency request received', {
      ip: req.ip,
      action: 'processing-efficiency-request'
    });

    const [
      totalProcessed,
      autoProcessedCount,
      languageStats,
      averageConfidence,
      processingTimeStats
    ] = await Promise.all([
      Document.countDocuments({ processed: true }),
      Document.countDocuments({
        processed: true,
        'analysis.aiModel': { $ne: 'rule-based' }
      }),
      Document.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Document.aggregate([
        {
          $group: {
            _id: null,
            avgConfidence: { $avg: '$analysis.confidence' }
          }
        }
      ]),
      Document.aggregate([
        {
          $match: { 'analysis.processedAt': { $exists: true } }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            // Mock processing time calculation - in production, calculate from actual timestamps
            avgProcessingTimeMs: { $avg: 8280000 } // ~2.3 hours in milliseconds
          }
        }
      ])
    ]);

    const autoProcessingRate = totalProcessed > 0
      ? ((autoProcessedCount / totalProcessed) * 100).toFixed(1)
      : 0;

    const avgProcessingTimeHours = processingTimeStats.length > 0
      ? (processingTimeStats[0].avgProcessingTimeMs / (1000 * 60 * 60)).toFixed(1)
      : 2.3;

    const confidence = averageConfidence.length > 0
      ? (averageConfidence[0].avgConfidence * 100).toFixed(1)
      : 75;

    const uniqueLanguages = languageStats.length;

    const efficiency = {
      autoProcessingRate: parseFloat(autoProcessingRate),
      avgProcessingTimeHours: parseFloat(avgProcessingTimeHours),
      complianceRate: 85, // Mock data - calculate from actual compliance checks
      languagesDetected: uniqueLanguages,
      avgConfidence: parseFloat(confidence),
      totalProcessed,
      languageBreakdown: languageStats,
      trends: {
        autoProcessingImprovement: 2.1, // Mock weekly improvement
        processingTimeReduction: 15, // Mock minutes saved
        complianceTarget: 90
      }
    };

    moduleLogger.info('Processing efficiency computed successfully', {
      autoProcessingRate,
      avgProcessingTimeHours,
      languagesDetected: uniqueLanguages,
      totalProcessed,
      action: 'processing-efficiency-success'
    });

    res.json(efficiency);
  } catch (error) {
    moduleLogger.error('Processing efficiency error', {
      error: error.message,
      stack: error.stack,
      action: 'processing-efficiency-error'
    });
    console.error('Processing efficiency error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getDocuments,
  uploadDocument,
  getDocumentAnalysis,
  deleteDocument,
  getDashboardStats,
  getUploadTrends,
  getDepartmentDistribution,
  getProcessingEfficiency
};