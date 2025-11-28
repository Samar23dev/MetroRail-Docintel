# ⚡ Quick Reference: Model Switching

## Change Model in 2 Steps

### Step 1: Edit `.env`
```bash
# backend/.env

# FOR SPEED & BUDGET (default)
GEMINI_MODEL=flash

# FOR ACCURACY & ADVANCED FEATURES
GEMINI_MODEL=pro
```

### Step 2: Restart Backend
```bash
cd backend
python app.py
```

---

## At a Glance

| Need | Model | Time | Cost |
|------|-------|------|------|
| **Fast processing** | flash ⚡ | 1-2 sec | 💰 Cheap |
| **Handwriting** | pro ⭐ | 3-5 sec | 💰💰💰 Expensive |
| **Charts/Diagrams** | pro ⭐ | 3-5 sec | 💰💰💰 Expensive |
| **High volume** | flash ⚡ | 1-2 sec | 💰 Cheap |
| **Quality mode** | pro ⭐ | 3-5 sec | 💰💰💰 Expensive |

---

## Real Numbers

**Processing 1000 documents:**
- **Flash**: ~30 minutes, ~$0.30 cost
- **Pro**: ~1 hour, ~$10+ cost

---

## Decision Tree

```
Document has handwriting or complex charts?
    ↓
  YES → Use PRO (GEMINI_MODEL=pro)
  NO  → Use FLASH (GEMINI_MODEL=flash)
```

---

## Pro Model Highlights

### ✅ Recognizes:
- 🖊️ Handwritten notes & signatures
- 📊 Complex charts with data extraction
- 📐 Technical drawings & schematics
- 📸 Low-quality/faded documents

### ❌ Not great at:
- Speed (slower than Flash)
- Budget (46x more expensive)

---

## Current Setting in Your Project

**`.env` default:** `GEMINI_MODEL=flash`

To switch to Pro:
```
GEMINI_MODEL=pro
```

That's it! Restart your Flask backend.

---

## Monitor Which Model is Running

When you start `python app.py`, you'll see:

```
⚡ Using GEMINI_1.5_FLASH for fast document analysis
```
or
```
⭐ Using GEMINI_1.5_PRO for advanced document analysis
```

---

## Budget Tip 💡

For KMRL (thousands of documents):
1. Start with **Flash** (default)
2. Only use **Pro** for:
   - Handwritten documents
   - Technical drawings
   - Low-quality scans
   - Critical decisions

**Saves 80-90% on API costs!**
