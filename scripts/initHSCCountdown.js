import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MotivationalMessage from '../models/MotivationalMessage.js';

dotenv.config();

const initDUAdmissionMessages = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await MotivationalMessage.deleteMany({});
    console.log('✅ Cleared existing motivational messages');

    console.log('✅ Motivational message system is now AI-generated for DU Admission');
    console.log('   Messages will be generated dynamically for each date');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing DU Admission motivational system:', error);
    process.exit(1);
  }
};

initDUAdmissionMessages();
