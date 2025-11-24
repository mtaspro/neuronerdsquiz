import mongoose from 'mongoose';

const progressSubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  order: { type: Number, required: true },
  category: { type: String, enum: ['BEI', 'Science'], required: true },
  chapters: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('ProgressSubject', progressSubjectSchema);
