# Progress Tracking System

Complete study progress tracking system for Neuronerds Quiz with AI insights, graphs, badges, and WhatsApp reminders.

## Features Implemented

### 1. Progress Tracking Page (`/progress`)
- **Subjects & Chapters**: All HSC subjects (Bangla, English, ICT, Physics, Chemistry, Biology, Higher Math) with checkboxes
- **Real-time Progress Bars**: Instant updates for subject, category (BEI/Science), and total progress
- **Exam Timeline**: Countdown cards showing upcoming exams with dates
- **NeuraX AI Insights**: Smart, context-aware progress insights and motivational messages
- **Progress History Graph**: Line chart showing progress over time (last 30 days)
- **Achievement Badges**: Unlockable badges for milestones (50% complete, subject mastery, streaks)
- **WhatsApp Reminder Toggle**: Enable/disable daily progress reminders
- **Responsive Design**: Beautiful gradient UI with neon blue/purple theme

### 2. Progress Editor (`/progress-editor`)
**SuperAdmin Only** - Manage the entire system:
- Add/Edit/Delete subjects with chapters
- Add/Edit/Delete exams with dates
- Set subject categories (BEI/Science)
- Organize subject order
- Create exam syllabuses

### 3. WhatsApp Reminder Service
- **Automated Daily Reminders**: Sent twice daily (9 AM & 7 PM)
- **Personalized Messages**: Include user's name, progress %, streak days
- **Exam Alerts**: Countdown reminders for upcoming exams
- **Motivational Content**: Context-aware encouragement based on progress
- **User Control**: Toggle on/off from Progress page

### 4. Smart Insights System
AI-powered insights that update based on:
- Overall progress percentage
- Subject-specific completion rates
- Upcoming exam deadlines
- Study streaks
- Low-performing subjects

### 5. Badge System
Automatic badge unlocking for:
- **50% Complete**: Halfway milestone
- **Subject Master**: 100% completion of any subject
- **7 Day Streak**: Consistent daily progress
- More badges can be added easily

### 6. Progress History Tracking
- Automatic daily snapshots of progress
- Stores total, BEI, and Science progress separately
- Visual line chart with Recharts
- Shows last 30 days of progress

## Database Models

### ProgressSubject
```javascript
{
  name: String,           // e.g., "Physics 1st Paper"
  order: Number,          // Display order
  category: String,       // "BEI" or "Science"
  chapters: [String],     // Array of chapter names
  isActive: Boolean
}
```

### ProgressExam
```javascript
{
  name: String,           // e.g., "Test Exam"
  date: Date,             // Exam date
  syllabus: [{
    subjectId: ObjectId,
    chapters: [String]
  }],
  isActive: Boolean
}
```

### UserProgress
```javascript
{
  userId: ObjectId,
  completedChapters: [{
    subjectId: ObjectId,
    chapter: String
  }],
  progressHistory: [{
    date: Date,
    totalProgress: Number,
    beiProgress: Number,
    scienceProgress: Number
  }],
  badges: [String],
  streakDays: Number,
  lastActiveDate: Date,
  whatsappReminder: Boolean
}
```

## API Endpoints

### Public Routes (Authenticated)
- `GET /api/progress/subjects` - Get all subjects
- `GET /api/progress/exams` - Get all exams
- `GET /api/progress/user` - Get user's progress
- `POST /api/progress/update` - Update chapter completion
- `POST /api/progress/reminder-toggle` - Toggle WhatsApp reminders
- `GET /api/progress/insights` - Get AI-generated insights

### SuperAdmin Routes
- `POST /api/progress/admin/subject` - Add/Edit subject
- `DELETE /api/progress/admin/subject/:id` - Delete subject
- `POST /api/progress/admin/exam` - Add/Edit exam
- `DELETE /api/progress/admin/exam/:id` - Delete exam

## Installation & Setup

### 1. Install Dependencies
```bash
npm install recharts node-cron
```

### 2. Initialize Default Subjects
```bash
node scripts/initProgressSubjects.js
```

### 3. Environment Variables
Already configured in existing `.env`:
- `MONGO_URI` - MongoDB connection
- `API_URL` - Backend URL for WhatsApp service

### 4. Server Configuration
Progress routes and reminder service are automatically started in `server.js`

## Usage

### For Students
1. Navigate to **Progress** in navbar
2. Check off completed chapters
3. View real-time progress updates
4. Read AI insights and recommendations
5. Track progress history in graphs
6. Unlock achievement badges
7. Enable WhatsApp reminders for daily updates

### For SuperAdmin
1. Navigate to `/progress-editor`
2. Add subjects with chapter lists
3. Create exams with dates
4. Manage syllabus for each exam
5. Changes reflect immediately for all users

## WhatsApp Reminder Format

**Morning (9 AM) / Evening (7 PM)**:
```
🌅 Good Morning [Name]!

📊 Your Progress Update

✅ Overall Progress: 45%
🔥 Study Streak: 7 days

⚠️ Test Exam in 15 days!

🎯 Great progress! You're more than halfway there!

Track your progress at neuronerdsquiz.vercel.app
```

## Technical Details

### Progress Calculation
- **Subject Progress**: (Completed Chapters / Total Chapters) × 100
- **Category Progress**: Sum of completed chapters in category / Total chapters in category
- **Total Progress**: Total completed chapters / All chapters across subjects

### Streak Tracking
- Increments when user checks a chapter on consecutive days
- Resets if more than 1 day gap
- Stored in `UserProgress.streakDays`

### Badge Unlocking
Badges are automatically awarded when:
- User reaches 50% total progress
- User completes all chapters in a subject
- User maintains 7+ day streak
- New badges trigger UI notification

### Performance Optimizations
- Progress history limited to last 30 days in graph
- Lazy loading for heavy components
- Efficient MongoDB queries with indexes
- Real-time updates without page refresh

## Future Enhancements (Optional)

1. **Exam-Specific Progress**: Track progress per exam syllabus
2. **Study Time Tracking**: Log time spent per subject
3. **Peer Comparison**: Anonymous comparison with other users
4. **Custom Goals**: Set personal completion targets
5. **Export Progress**: Download progress reports as PDF
6. **Subject Notes**: Attach notes to chapters
7. **Revision Reminders**: Smart reminders for completed chapters

## Files Created

### Backend
- `models/ProgressSubject.js`
- `models/ProgressExam.js`
- `models/UserProgress.js`
- `routes/progress.js`
- `services/progressReminderService.js`
- `scripts/initProgressSubjects.js`

### Frontend
- `src/pages/ProgressTracking.jsx`
- `src/pages/ProgressEditor.jsx`

### Modified
- `server.js` - Added progress routes and reminder service
- `src/App.jsx` - Added Progress navigation and routes
- `package.json` - Added recharts dependency

## Support

For issues or questions:
1. Check MongoDB connection
2. Verify WhatsApp service is running
3. Ensure user has phone number for reminders
4. Check browser console for errors
5. Verify API_URL environment variable

---

**Built with ❤️ for Neuronerds Quiz**
