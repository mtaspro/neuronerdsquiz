// Run this script to add MongoDB indexes for better performance
// Usage: node scripts/addIndexes.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function addIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    console.log('Adding indexes...');

    const indexes = [
      { collection: 'quizzes', index: { chapter: 1, createdAt: -1 }, name: 'chapter_createdAt' },
      { collection: 'quizzes', index: { chapter: 1 }, name: 'chapter_1' },
      { collection: 'quizzes', index: { createdBy: 1 }, name: 'createdBy_1' },
      { collection: 'users', index: { createdAt: -1 }, name: 'createdAt_-1' },
      { collection: 'users', index: { phoneNumber: 1 }, name: 'phoneNumber_1' },
      { collection: 'chapters', index: { subject: 1, order: 1 }, name: 'subject_order' },
      { collection: 'chapters', index: { name: 1 }, name: 'name_1' },
      { collection: 'chapters', index: { createdBy: 1 }, name: 'chapters_createdBy' },
      { collection: 'subjects', index: { order: 1, name: 1 }, name: 'order_name' },
      { collection: 'userscores', index: { type: 1, score: -1 }, name: 'type_score' },
      { collection: 'userscores', index: { userId: 1, type: 1 }, name: 'userId_type' }
    ];

    let added = 0;
    let skipped = 0;

    for (const { collection, index, name } of indexes) {
      try {
        await db.collection(collection).createIndex(index, { name });
        console.log(`✅ Added index ${name} on ${collection}`);
        added++;
      } catch (error) {
        if (error.code === 86 || error.codeName === 'IndexKeySpecsConflict') {
          console.log(`⚠️ Index ${name} already exists on ${collection}`);
          skipped++;
        } else {
          console.log(`❌ Failed to add index ${name} on ${collection}:`, error.message);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Added: ${added} indexes`);
    console.log(`⚠️ Skipped: ${skipped} indexes (already exist)`);
    console.log('📈 Query performance optimized!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
}

addIndexes();