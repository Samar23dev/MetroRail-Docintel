const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['urgent', 'pending', 'review', 'approved', 'published'],
    default: 'pending',
  },
  summary: {
    type: String,
    default: 'Summary not yet generated.',
  },
  tags: [String],
  language: {
    type: String,
    default: 'Unknown',
  },
  source: String,
  originalFilename: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    default: ''
  },
  analysis: {
    keyTopics: [String],
    entities: {
      dates: [String],
      amounts: [String],
      locations: [String],
      organizations: [String]
    },
    actionItems: [String],
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    },
    urgencyLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    businessImpact: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.75
    },
    processedAt: {
      type: Date,
      default: Date.now
    },
    aiModel: {
      type: String,
      default: 'rule-based'
    }
  },
  processed: {
    type: Boolean,
    default: false
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields automatically
});

module.exports = mongoose.model('Document', DocumentSchema);