import MotivationalMessage from '../models/MotivationalMessage.js';

class MotivationalMessageService {
  constructor() {
    this.messages = [];
    this.isInitialized = false;
  }

  // Initialize motivational messages from examples
  async initializeMessages() {
    if (this.isInitialized) {
      console.log('📝 Motivational messages already initialized');
      return;
    }

    try {
      // Clear existing messages to avoid duplicates
      await MotivationalMessage.deleteMany({});
      
      const motivationalMessages = [
        // Day 68 - Tremendous number style
        {
          dayNumber: 68,
          message: "68 days. Tremendous number, really tremendous.\nPeople are saying you're studying… I'm not seeing it.",
          category: 'mock_praise'
        },
        // Day 67 - Great plan style
        {
          dayNumber: 67,
          message: "67 days left. Great plan, beautiful plan.\nOnly problem? It exists only in your head.",
          category: 'insult'
        },
        // Day 66 - Starting tomorrow style
        {
          dayNumber: 66,
          message: "66 days. You said 'starting tomorrow.'\nThat was—what?—the best tomorrow? The greatest tomorrow? Never came.",
          category: 'insult'
        },
        // Day 65 - Very busy style
        {
          dayNumber: 65,
          message: "65 days. Very busy, very focused—\non everything except studying. Incredible.",
          category: 'insult'
        },
        // Day 64 - Some people improve style
        {
          dayNumber: 64,
          message: "64 days. Some people are improving daily.\nOthers… wow. Just existing. Not good.",
          category: 'insult'
        },
        // Day 63 - Opened the book style
        {
          dayNumber: 63,
          message: "63 days. You opened the book. Fantastic.\nReading? Understanding? Let's not get ahead of ourselves.",
          category: 'mock_praise'
        },
        // Day 62 - Amazing notes style (absurd twist)
        {
          dayNumber: 62,
          message: "62 days. Your notes look amazing. Beautiful notes.\nIf exams were judged by decoration—you'd top the country.",
          category: 'absurd_twist'
        },
        // Day 61 - Confidence high style
        {
          dayNumber: 61,
          message: "61 days. Confidence is high. Preparation is… missing.\nVery dangerous combination.",
          category: 'confidence_warning'
        },
        // Day 60 - Waiting for motivation style (Iran-style irony)
        {
          dayNumber: 60,
          message: "60 days. You're waiting for motivation.\nMotivation is waiting for you. Both of you doing nothing. Perfect.",
          category: 'irony_hit'
        },
        // Day 59 - Pressure makes diamonds style
        {
          dayNumber: 59,
          message: "59 days. You say pressure makes diamonds.\nRight now, it's making excuses.",
          category: 'insult'
        }
      ];

      // Insert all messages into database
      await MotivationalMessage.insertMany(motivationalMessages);
      
      this.messages = motivationalMessages;
      this.isInitialized = true;
      
      console.log(`✅ Initialized ${motivationalMessages.length} motivational messages`);
    } catch (error) {
      console.error('❌ Error initializing motivational messages:', error);
    }
  }

  // Get a motivational message for specific day
  async getMessageForDay(dayNumber) {
    try {
      // First try to find exact day match
      let message = await MotivationalMessage.findOne({ 
        dayNumber, 
        isUsed: false 
      });

      // If no exact match, find closest unused message
      if (!message) {
        message = await MotivationalMessage.findOne({ 
          isUsed: false 
        }).sort({ dayNumber: 1 });
      }

      // If still no message, reset all and get first one
      if (!message) {
        console.log('🔄 Resetting all motivational messages');
        await MotivationalMessage.updateMany({}, { isUsed: false, usedDate: null });
        message = await MotivationalMessage.findOne({ 
          isUsed: false 
        }).sort({ dayNumber: 1 });
      }

      // Mark message as used
      if (message) {
        await MotivationalMessage.findByIdAndUpdate(message._id, {
          isUsed: true,
          usedDate: new Date()
        });
        
        console.log(`📝 Using motivational message for day ${dayNumber}: ${message.category}`);
        return message.message;
      }

      // Fallback message
      return "💡 Stay focused and make today count!";
    } catch (error) {
      console.error('❌ Error getting motivational message:', error);
      return "💡 Stay focused and make today count!";
    }
  }

  // Get random motivational message (fallback)
  async getRandomMessage() {
    try {
      const count = await MotivationalMessage.countDocuments({ isUsed: false });
      if (count === 0) {
        // Reset all messages if all are used
        await MotivationalMessage.updateMany({}, { isUsed: false, usedDate: null });
      }

      const message = await MotivationalMessage.findOne({ 
        isUsed: false 
      }).sort({ dayNumber: 1 });

      if (message) {
        await MotivationalMessage.findByIdAndUpdate(message._id, {
          isUsed: true,
          usedDate: new Date()
        });
        return message.message;
      }

      return "💡 Stay focused and make today count!";
    } catch (error) {
      console.error('❌ Error getting random motivational message:', error);
      return "💡 Stay focused and make today count!";
    }
  }

  // Get statistics
  async getStats() {
    try {
      const total = await MotivationalMessage.countDocuments();
      const used = await MotivationalMessage.countDocuments({ isUsed: true });
      const unused = total - used;

      return {
        total,
        used,
        unused,
        isInitialized: this.isInitialized
      };
    } catch (error) {
      console.error('❌ Error getting motivational message stats:', error);
      return { total: 0, used: 0, unused: 0, isInitialized: false };
    }
  }
}

export default MotivationalMessageService;
