import mongoose from 'mongoose';

const globalSettingsSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true
  },
  settingValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const GlobalSettings = mongoose.model('GlobalSettings', globalSettingsSchema);

export default GlobalSettings;