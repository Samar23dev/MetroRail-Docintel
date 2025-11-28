# 🚀 Advanced Gemini Model Configuration Guide

## Overview

Your KMRL Document Intelligence System now supports **switching between Gemini models** based on your needs:

- **🟢 Flash (Default)**: Fast, cheap, good for basic extraction
- **⭐ Pro**: Advanced capabilities for complex documents

---

## Model Comparison

### **Gemini 1.5 Flash** ⚡
| Feature | Capability |
|---------|-----------|
| **Speed** | Ultra-fast (1-2 sec) |
| **Cost** | $0.075 per 1M input tokens |
| **Handwriting** | Basic recognition |
| **Charts** | Basic extraction |
| **Tables** | Good structure parsing |
| **Best For** | High-volume processing |

### **Gemini 1.5 Pro** ⭐
| Feature | Capability |
|---------|-----------|
| **Speed** | Slower (3-5 sec) |
| **Cost** | $3.50 per 1M input tokens |
| **Handwriting** | **Excellent** - reads complex writing |
| **Charts** | **Advanced** - extracts data, trends, patterns |
| **Tables** | **Perfect** - preserves structure |
| **Complex Documents** | **Multi-format support** |
| **Best For** | Accuracy-critical scenarios |

---

## ✅ How to Switch Models

### **Step 1: Update `.env` File**

Open `backend/.env` and change:

```properties
# For FAST processing (cheaper)
GEMINI_MODEL=flash

# For ADVANCED processing (more accurate)
GEMINI_MODEL=pro
```

### **Step 2: Restart Flask Backend**

```bash
cd backend
python app.py
```

You'll see startup message:
```
⭐ Using GEMINI_1.5_PRO for advanced document analysis
```

or

```
⚡ Using GEMINI_1.5_FLASH for fast document analysis
```

---

## 📊 Use Cases

### **Use Flash When:**
- ✅ Processing large document volumes
- ✅ Budget is critical
- ✅ Documents are mostly printed text
- ✅ Quick turnaround needed
- ✅ Standard invoices, policies, circulars

### **Use Pro When:**
- ✅ Document has handwritten notes/signatures
- ✅ Complex charts/diagrams need analysis
- ✅ Mixed text and image content
- ✅ High accuracy required
- ✅ Technical drawings or schematics
- ✅ Low-quality/scanned documents

---

## 💰 Cost Analysis

### For 100 Documents (average 10KB text each):

**Flash Model:**
```
Input tokens: 100 × 8,000 ≈ 800K tokens
Cost: 800K × $0.075/1M = $0.06
Processing time: ~2-3 minutes
```

**Pro Model:**
```
Input tokens: 100 × 8,000 ≈ 800K tokens
Cost: 800K × $3.50/1M = $2.80
Processing time: ~5-10 minutes
```

**Savings with Flash: $2.74** (46x cheaper!)

---

## 🎯 Recommended Strategy

### **Hybrid Approach:**
1. **Start with Flash** (default) for all documents
2. **If accuracy is poor**, switch to Pro
3. **Use Pro selectively** for complex documents only

### **Smart Processing:**
```python
# Future enhancement: Auto-detect and use appropriate model
if contains_handwriting or contains_charts:
    use_pro_model()
else:
    use_flash_model()
```

---

## 🔧 Advanced Features in Pro Mode

When `GEMINI_MODEL=pro`, the system extracts:

### **1. Handwritten Text Recognition**
```json
{
  "handwritten_notes": [
    {
      "location": "margin",
      "text": "Urgent - Review by Friday",
      "legibility": "good"
    }
  ]
}
```

### **2. Chart Analysis**
```json
{
  "charts": [
    {
      "title": "Sales Trend 2024",
      "chart_type": "line",
      "trend": "increasing",
      "data_points": [
        {"label": "Q1", "value": "100K"},
        {"label": "Q2", "value": "150K"}
      ]
    }
  ]
}
```

### **3. Diagram Extraction**
- Circuit diagrams
- Flowcharts
- Technical drawings
- Building plans

### **4. Mathematical Expressions**
- Equations and formulas
- Calculations
- Engineering specs

---

## 📋 Configuration Examples

### **Example 1: Production (Budget-Conscious)**
```properties
GEMINI_MODEL=flash
```
Use for: Daily operations, high-volume processing

---

### **Example 2: Quality Assurance (Accuracy-Critical)**
```properties
GEMINI_MODEL=pro
```
Use for: Important decisions, complex documents

---

### **Example 3: Mixed (Future Feature)**
```javascript
// Auto-select based on document type
if (documentType === 'technical-drawing') {
    GEMINI_MODEL = 'pro';
} else if (documentType === 'invoice') {
    GEMINI_MODEL = 'flash';
}
```

---

## 🔍 Monitoring & Debugging

### **Check Which Model is Active**
Look at Flask startup logs:
```bash
# Start backend
python app.py

# Output will show:
⭐ Using GEMINI_1.5_PRO...
# or
⚡ Using GEMINI_1.5_FLASH...
```

### **Monitor API Calls**
Flask will log each analysis:
```
[Gemini API Call] Model: gemini-1.5-pro, Time: 3.2s, Cost: ~$0.003
```

---

## 🚨 Troubleshooting

### **Pro Model Returns Errors**
- Check API quota in Google Cloud Console
- Ensure `GEMINI_MODEL=pro` in `.env`
- Restart Flask backend

### **Slow Processing**
- Pro is intentionally slower (~3-5 sec per doc)
- For speed, use Flash instead

### **High Costs**
- Switch to Flash (default)
- Use Pro only for specific document types

---

## 📈 Future Enhancements

Planned features:
- [ ] Auto-model selection based on document complexity
- [ ] Cost tracking per model
- [ ] A/B testing (Flash vs Pro)
- [ ] Fallback to Flash if Pro quota exceeded
- [ ] Per-document model override UI

---

## ✨ Summary

| Action | Command |
|--------|---------|
| **Use Flash (Default)** | Set `GEMINI_MODEL=flash` in `.env` |
| **Use Pro (Advanced)** | Set `GEMINI_MODEL=pro` in `.env` |
| **Apply Changes** | Restart Flask: `python app.py` |
| **Check Active Model** | Look at Flask startup logs |

**Recommendation for KMRL:**
- Start with **Flash** (production use)
- Test with **Pro** for handwritten/chart documents
- Switch as needed based on accuracy requirements

---

## 📞 Support

For questions or issues:
1. Check Flask logs for model selection
2. Verify API key is valid
3. Test with small document first
4. Monitor API usage in Google Cloud Console
