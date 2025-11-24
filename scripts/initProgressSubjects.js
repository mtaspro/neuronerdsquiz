import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProgressSubject from '../models/ProgressSubject.js';

dotenv.config();

const defaultSubjects = [
  {
    name: 'Bangla 1st Paper',
    order: 1,
    category: 'BEI',
    chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5']
  },
  {
    name: 'Bangla 2nd Paper',
    order: 2,
    category: 'BEI',
    chapters: ['Grammar 1', 'Grammar 2', 'Grammar 3', 'Composition']
  },
  {
    name: 'English 1st Paper',
    order: 3,
    category: 'BEI',
    chapters: ['Reading', 'Writing', 'Grammar', 'Vocabulary']
  },
  {
    name: 'English 2nd Paper',
    order: 4,
    category: 'BEI',
    chapters: ['Grammar', 'Composition', 'Translation']
  },
  {
    name: 'ICT',
    order: 5,
    category: 'BEI',
    chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6']
  },
  {
    name: 'Physics 1st Paper',
    order: 6,
    category: 'Science',
    chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6', 'Chapter 7']
  },
  {
    name: 'Physics 2nd Paper',
    order: 7,
    category: 'Science',
    chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6']
  },
  {
    name: 'Chemistry 1st Paper',
    order: 8,
    category: 'Science',
    chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5']
  },
  {
    name: 'Chemistry 2nd Paper',
    order: 9,
    category: 'Science',
    chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6']
  },
  {
    name: 'Biology 1st Paper',
    order: 10,
    category: 'Science',
    chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6']
  },
  {
    name: 'Biology 2nd Paper',
    order: 11,
    category: 'Science',
    chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5']
  },
  {
    name: 'Higher Math 1st Paper',
    order: 12,
    category: 'Science',
    chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6']
  },
  {
    name: 'Higher Math 2nd Paper',
    order: 13,
    category: 'Science',
    chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5']
  }
];

async function initSubjects() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const subject of defaultSubjects) {
      await ProgressSubject.findOneAndUpdate(
        { name: subject.name },
        subject,
        { upsert: true, new: true }
      );
      console.log(`✅ ${subject.name} initialized`);
    }

    console.log('✅ All subjects initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initSubjects();
