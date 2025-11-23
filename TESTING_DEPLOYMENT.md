# Testing & Deployment Guide

## Pre-Deployment Checklist

### ✓ Backend Changes
- [x] Pytesseract import removed from `backend/app.py` (line 13)
- [x] Base64 import added for image encoding
- [x] New function `extract_image_text_with_gemini()` created
- [x] Image handling updated to use Gemini API

### ✓ Frontend Changes
- [x] SearchPage.jsx completely rewritten with advanced filters
- [x] Documents.jsx enhanced with status and language filters
- [x] Real-time filtering implemented
- [x] Search tips section added

### ✓ Documentation
- [x] IMPROVEMENTS_SUMMARY.md deleted
- [x] RECENT_UPDATES.md created

---

## Testing Guide

### 1. Image Upload (OCR Testing)

**Test Case 1: JPG Image with Text**
1. Go to Documents tab
2. Click "Upload Document"
3. Select a JPG image with text
4. Verify:
   - Image uploads successfully
   - Backend calls Gemini API (check logs)
   - Text is extracted and searchable
   - No pytesseract errors

**Test Case 2: PNG Image**
1. Repeat with PNG format
2. Verify text extraction works

**Test Case 3: GIF/WebP**
1. Test with GIF and WebP formats if available
2. Verify Gemini handles all formats

**Expected Logs**:
```
INFO - Successfully extracted text from image: filename.jpg
```

### 2. Advanced Search Testing

**Test Case 1: Keyword Search**
1. Go to Search tab
2. Select "Keyword Search"
3. Enter a search term (e.g., "safety")
4. Click "Search"
5. Verify results match keyword

**Test Case 2: Semantic Search**
1. Select "Semantic Search"
2. Enter conceptually related term
3. Click "Semantic Search"
4. Verify conceptually similar documents appear

**Test Case 3: Filters Panel**
1. Click "Filters" button
2. Select Department filter
3. Select Status filter
4. Enter date range
5. Click "Apply Filters"
6. Verify results are filtered
7. Click "Reset" to clear

**Test Case 4: Relevance Threshold**
1. Use Semantic Search
2. Adjust relevance slider
3. Verify stricter matching at higher thresholds

### 3. Document Filters Testing

**Test Case 1: Status Filter**
1. Go to Documents tab
2. Use Status dropdown
3. Select "Urgent"
4. Verify only urgent documents show
5. Check count updates

**Test Case 2: Language Filter**
1. Use Language dropdown
2. Select "Malayalam"
3. Verify only Malayalam documents show

**Test Case 3: Combined Filters**
1. Set Department = "Engineering"
2. Set Status = "Approved"
3. Verify only Engineering + Approved documents show
4. Check count accuracy

---

## Deployment Steps

### Step 1: Backend Setup
```bash
cd backend
# Ensure requirements.txt is updated (pytesseract removed)
pip install -r requirements.txt
```

### Step 2: Environment Variables
Verify `.env` file contains:
```
GEMINI_API_KEY=your_api_key_here
MONGO_URI=your_mongodb_uri
DB_NAME=kmrl_docintel
```

### Step 3: Frontend Setup
```bash
cd ..
npm install
npm run dev  # for development
```

### Step 4: Run Tests
```bash
# Test backend
cd backend
python app.py

# Test frontend (in another terminal)
npm run dev
```

### Step 5: Deploy
```bash
# Production build
npm run build

# Deploy to your server/hosting
```

---

## Troubleshooting

### Issue: Image upload fails with "No text extracted"
**Diagnosis**:
- Check if GEMINI_API_KEY is set correctly
- Verify image contains readable text
- Check backend logs for API errors

**Solution**:
```python
# In backend/app.py, increase timeout
response = requests.post(url, json=payload, headers=headers, timeout=60)
```

### Issue: Search filters not working
**Diagnosis**:
- Check browser console for JavaScript errors
- Verify document data has status/language fields

**Solution**:
- Clear browser cache
- Refresh page
- Check document structure in MongoDB

### Issue: Semantic search not returning results
**Diagnosis**:
- GEMINI_API_KEY might be invalid
- Documents might not have summaries

**Solution**:
- Verify API key in backend logs
- Ensure documents have summaries filled
- Check network requests in browser

---

## Performance Optimization

### For Image OCR
- Consider caching extracted text
- Implement batch processing for multiple images
- Add progress indicators for long uploads

### For Search
- Implement search result pagination
- Cache frequently searched queries
- Consider full-text search indexing in MongoDB

### For Filters
- Use MongoDB aggregation for large datasets
- Implement lazy loading for document lists
- Cache filter options

---

## Monitoring

### Key Metrics to Track
1. **Image Processing Time**: Track average OCR duration
2. **Search Success Rate**: Monitor failed searches
3. **API Usage**: Monitor Gemini API calls and costs
4. **Filter Performance**: Track filtering time for large datasets

### Logging to Monitor
```bash
# Check logs for:
grep "extract_image_text_with_gemini" backend/logs.txt
grep "Error in semantic search" backend/logs.txt
grep "Filter applied" backend/logs.txt
```

---

## Rollback Plan

If issues occur:

### Quick Rollback
```bash
git revert <commit_hash>
```

### Manual Rollback
1. Restore previous version of:
   - backend/app.py (from git history)
   - src/components/SearchPage.jsx (from git history)
   - src/components/Documents.jsx (from git history)

2. Restart backend: `python app.py`
3. Rebuild frontend: `npm run build`

---

## Success Indicators

✅ **System is ready when**:
- Image uploads extract text without errors
- Search tab has keyword/semantic toggle visible
- Advanced filters panel opens/closes smoothly
- Document status filter works
- Document language filter works
- No pytesseract errors in logs
- RECENT_UPDATES.md is present

---

## Performance Benchmarks

| Operation | Expected Time | Actual |
|-----------|---------------|--------|
| Image OCR (JPG) | 2-3 seconds | |
| Keyword Search (100 docs) | <100ms | |
| Semantic Search (100 docs) | 1-2 seconds | |
| Document Filtering | <50ms | |
| Advanced Filter Panel Open | <200ms | |

---

## Support & Documentation

- **Technical Guide**: See RECENT_UPDATES.md
- **API Docs**: Gemini Vision API docs
- **Backend Code**: backend/app.py lines 31-86
- **Frontend Code**: SearchPage.jsx (250 lines)

---

## Version Info
- **Version**: 2.1
- **Last Updated**: November 23, 2025
- **Status**: Ready for Production ✓
