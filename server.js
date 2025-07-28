import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import leaderboardRouter from './routes/leaderboard.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected!'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Mount the routers with /api prefix
app.use('/api', leaderboardRouter);
app.use('/api/auth', authRouter);

// Test route for API connectivity
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Example route
app.get('/', (req, res) => {
  res.send('Express + MongoDB Atlas backend is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));