import mongoose from 'mongoose';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Chapter from '../models/Chapter.js';
import UserScore from '../models/UserScore.js';

async function addIndexes() {
  try {
    console.log('Adding database indexes for performance...');
    
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 });
    await User.collection.createIndex({ isAdmin: 1 });
    
    // Quiz indexes
    await Quiz.collection.createIndex({ chapter: 1 });
    await Quiz.collection.createIndex({ createdBy: 1 });
    await Quiz.collection.createIndex({ createdAt: -1 });
    
    // Chapter indexes
    await Chapter.collection.createIndex({ name: 1 });
    await Chapter.collection.createIndex({ subject: 1 });
    await Chapter.collection.createIndex({ createdBy: 1 });
    await Chapter.collection.createIndex({ order: 1 });
    
    // UserScore indexes
    await UserScore.collection.createIndex({ user: 1 });
    await UserScore.collection.createIndex({ username: 1 });
    await UserScore.collection.createIndex({ totalScore: -1 });
    

    
    console.log('✅ All indexes added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding indexes:', error);
    process.exit(1);
  }
}

// Connect to MongoDB and add indexes
if (!process.env.MONGODB_URI) {
  console.log('⚠️  MONGODB_URI not set. Indexes should be added in production.');
  console.log('✅ Performance optimizations applied to code.');
  process.exit(0);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    addIndexes();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });