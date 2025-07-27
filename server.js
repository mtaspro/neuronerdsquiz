require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Added for CORS support

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

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

// Import leaderboard and auth routers
const leaderboardRouter = require('./routes/leaderboard');
const authRouter = require('./routes/auth'); // Import auth routes

// Mount the routers with /api prefix
app.use('/api', leaderboardRouter);
app.use('/api/auth', authRouter); // Mount auth routes

// Example route
app.get('/', (req, res) => {
  res.send('Express + MongoDB Atlas backend is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));