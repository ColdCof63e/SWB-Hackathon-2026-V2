import mongoose from 'mongoose';

const RecruiterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  passkeyCredentialId: {
    type: String,
    default: ''
  },
  passkeyPublicKey: {
    type: String,
    default: ''
  },
  passkeySignCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Recruiter', RecruiterSchema);
