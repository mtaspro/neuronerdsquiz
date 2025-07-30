import mongoose from 'mongoose';
import Chapter from './models/Chapter.js';
import dotenv from 'dotenv';

dotenv.config();

const defaultChapters = [
  {
    name: 'Chapter-1',
    description: 'Introduction to Basics',
    order: 1
  },
  {
    name: 'Chapter-2', 
    description: 'Advanced Concepts',
    order: 2
  },
  {
    name: 'Chapter-3',
    description: 'Practical Applications',
    order: 3
  },
  {
    name: 'Chapter-4',
    description: 'Final Assessment',
    order: 4
  }
];

async function initChapters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing chapters
    await Chapter.deleteMany({});
    console.log('Cleared existing chapters');

    // Insert default chapters
    const chapters = await Chapter.insertMany(defaultChapters);
    console.log('Inserted default chapters:', chapters.map(c => c.name));

    console.log('Chapter initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing chapters:', error);
    process.exit(1);
  }
}

initChapters(); 