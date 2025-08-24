const mongoose = require('mongoose');

const lifelineConfigSchema = new mongoose.Schema({
  skip: {
    enabled: { type: Boolean, default: true },
    maxUses: { type: Number, default: 3 },
    availableInBattle: { type: Boolean, default: true }
  },
  help: {
    enabled: { type: Boolean, default: true },
    maxUses: { type: Number, default: 2 },
    penaltyPercentage: { type: Number, default: 50 },
    availableInBattle: { type: Boolean, default: true }
  },
  fiftyFifty: {
    enabled: { type: Boolean, default: true },
    maxUses: { type: Number, default: 2 },
    availableInBattle: { type: Boolean, default: true }
  },
  extraTime: {
    enabled: { type: Boolean, default: true },
    maxUses: { type: Number, default: 1 },
    extraSeconds: { type: Number, default: 10 },
    availableInBattle: { type: Boolean, default: false }
  }
}, { timestamps: true });

export default mongoose.model('LifelineConfig', lifelineConfigSchema);