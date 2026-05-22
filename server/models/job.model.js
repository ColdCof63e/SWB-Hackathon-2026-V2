import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  companyInitials: {
    type: String
  },
  location: {
    type: String,
    default: 'Remote'
  },
  salary: {
    type: String,
    default: 'Unspecified'
  },
  postedDate: {
    type: String,
    default: 'Just now'
  },
  trustScore: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Verified', 'Suspicious', 'Scam'],
    default: 'Verified'
  },
  category: {
    type: String,
    default: 'General Remote'
  },
  description: {
    type: String,
    required: true
  },
  aiDetails: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  jdUrl: {
    type: String
  }
}, {
  timestamps: true // This will add createdAt and updatedAt automatically
});

export default mongoose.model('Job', JobSchema);
