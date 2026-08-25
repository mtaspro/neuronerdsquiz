import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  provider: {
    type: String,
    enum: ['openrouter', 'groq', 'gemini', 'hcn'],
    required: true
  },
  modelId: { type: String, required: true, trim: true },
  overrideClientModel: { type: Boolean, default: false },
  fallbackEnabled: { type: Boolean, default: true },
  fallbackProvider: {
    type: String,
    enum: ['openrouter', 'groq', 'gemini', 'hcn'],
    default: 'openrouter'
  },
  fallbackModelId: { type: String, default: 'openrouter/free', trim: true }
}, { _id: false });

const aiIntegrationConfigSchema = new mongoose.Schema({
  integrations: {
    neurax: { type: integrationSchema, required: true },
    daily_calendar: { type: integrationSchema, required: true },
    whatsapp_bot: { type: integrationSchema, required: true }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

export default mongoose.model('AiIntegrationConfig', aiIntegrationConfigSchema);
