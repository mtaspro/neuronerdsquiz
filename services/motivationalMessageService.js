import MotivationalMessage, { MotivationalSequence } from '../models/MotivationalMessage.js';

class MotivationalMessageService {
  constructor() {
    this.messages = [];
    this.isInitialized = false;
  }

  // Initialize motivational messages - HSC Exam Survival Countdown
  async initializeMessages() {
    try {
      // Clear existing messages to avoid duplicates
      await MotivationalMessage.deleteMany({});
      
      const motivationalMessages = [
        // July 3
        {
          date: "2026-07-03",
          examsRemaining: 10,
          nextExam: "Bangla 2nd Paper",
          message: "10 exams left. Tomorrow it begins.\nDon't fight the whole war tonight. Just win Bangla.",
          category: 'opening'
        },
        // July 4 – Bangla 2nd
        {
          date: "2026-07-04",
          examsRemaining: 9,
          nextExam: "English 1st Paper",
          message: "1 paper down. 9 to go.\nCelebrate for one hour. Then it's English season.",
          category: 'progress'
        },
        // July 5
        {
          date: "2026-07-05",
          examsRemaining: 9,
          nextExam: "English 1st Paper",
          message: "9 papers left.\nThe best feeling in HSC? Realizing you already survived the first exam.",
          category: 'motivation'
        },
        // July 6 – English 1st
        {
          date: "2026-07-06",
          examsRemaining: 8,
          nextExam: "English 2nd Paper",
          message: "Another paper finished.\nLook at you. Becoming an exam machine.",
          category: 'progress'
        },
        // July 7
        {
          date: "2026-07-07",
          examsRemaining: 8,
          nextExam: "English 2nd Paper",
          message: "8 papers left.\nMomentum is a beautiful thing. Don't lose it.",
          category: 'motivation'
        },
        // July 8 – English 2nd
        {
          date: "2026-07-08",
          examsRemaining: 7,
          nextExam: "ICT",
          message: "English is done.\nNow we enter the kingdom of ICT and random MCQs.",
          category: 'funny'
        },
        // July 9
        {
          date: "2026-07-09",
          examsRemaining: 7,
          nextExam: "ICT",
          message: "7 papers left.\nAt this point you're stronger than you were a week ago.",
          category: 'motivation'
        },
        // July 10
        {
          date: "2026-07-10",
          examsRemaining: 7,
          nextExam: "ICT",
          message: "Tomorrow is ICT.\nMay the diagrams, binary numbers, and short questions be with you.",
          category: 'funny'
        },
        // July 11 – ICT
        {
          date: "2026-07-11",
          examsRemaining: 6,
          nextExam: "Physics 1st Paper",
          message: "ICT survived.\nNow comes Physics. The final boss has appeared.",
          category: 'physics_arc'
        },
        // July 12
        {
          date: "2026-07-12",
          examsRemaining: 6,
          nextExam: "Physics 1st Paper",
          message: "6 papers left.\nPhysics doesn't ask if you're ready. It simply arrives.",
          category: 'funny'
        },
        // July 13 – Physics 1st
        {
          date: "2026-07-13",
          examsRemaining: 5,
          nextExam: "Physics 2nd Paper",
          message: "One Physics paper defeated.\nThe second one is waiting outside.",
          category: 'physics_arc'
        },
        // July 14
        {
          date: "2026-07-14",
          examsRemaining: 5,
          nextExam: "Physics 2nd Paper",
          message: "Physics Paper 2 tomorrow.\nElectricity and magnetism send their regards.",
          category: 'funny'
        },
        // July 15 – Physics 2nd
        {
          date: "2026-07-15",
          examsRemaining: 4,
          nextExam: "Chemistry 1st Paper",
          message: "Physics is finally over.\nHuman happiness has increased significantly.",
          category: 'celebration'
        },
        // July 16–18 (Chemistry prep)
        {
          date: "2026-07-16",
          examsRemaining: 4,
          nextExam: "Chemistry 1st Paper",
          message: "4 papers left.\nAtoms never sleep and neither do HSC students.",
          category: 'chemistry_arc'
        },
        {
          date: "2026-07-17",
          examsRemaining: 4,
          nextExam: "Chemistry 1st Paper",
          message: "Chemistry in two days.\nTrust the equations. Fear the exceptions.",
          category: 'funny'
        },
        {
          date: "2026-07-18",
          examsRemaining: 4,
          nextExam: "Chemistry 1st Paper",
          message: "Tomorrow is Chemistry.\nPeriodic table, don't betray us now.",
          category: 'funny'
        },
        // July 19 – Chemistry 1st
        {
          date: "2026-07-19",
          examsRemaining: 3,
          nextExam: "Chemistry 2nd Paper",
          message: "Another paper conquered.\nThe finish line is getting closer.",
          category: 'motivation'
        },
        // July 22 – Chemistry 2nd
        {
          date: "2026-07-22",
          examsRemaining: 2,
          nextExam: "Biology 1st Paper",
          message: "Chemistry is over.\nYour brain can finally stop balancing equations.",
          category: 'celebration'
        },
        // July 27 – Biology 1st
        {
          date: "2026-07-27",
          examsRemaining: 1,
          nextExam: "Biology 2nd Paper",
          message: "Only two papers remain.\nYou're closer to freedom than ever before.",
          category: 'final_push'
        },
        // July 29 – Biology 2nd
        {
          date: "2026-07-29",
          examsRemaining: 0,
          nextExam: "Higher Math 1st Paper",
          message: "Biology is done.\nOnly mathematics stands between you and freedom.",
          category: 'math_arc'
        },
        // August 1
        {
          date: "2026-08-01",
          examsRemaining: 1,
          nextExam: "Higher Math 1st Paper",
          message: "Tomorrow is Higher Math.\nNo fear. Only formulas.",
          category: 'final_push'
        },
        // August 2 – Higher Math 1st
        {
          date: "2026-08-02",
          examsRemaining: 1,
          nextExam: "Higher Math 2nd Paper",
          message: "One last paper remains.\nYou can almost hear freedom calling.",
          category: 'final_push'
        },
        // August 3
        {
          date: "2026-08-03",
          examsRemaining: 1,
          nextExam: "Higher Math 2nd Paper",
          message: "One day left.\nOne final battle. Finish what you started.",
          category: 'final_push'
        },
        // August 4 – Final Day
        {
          date: "2026-08-04",
          examsRemaining: 0,
          nextExam: null,
          message: "0 exams left.\nAfter months of stress, late nights, and endless revisions—you did it. Welcome back to freedom.",
          category: 'finale'
        }
      ];

      // Insert all messages into database
      await MotivationalMessage.insertMany(motivationalMessages);
      
      this.messages = motivationalMessages;
      this.isInitialized = true;
      
      console.log(`✅ Initialized ${motivationalMessages.length} HSC Exam Survival countdown messages`);
    } catch (error) {
      console.error('❌ Error initializing motivational messages:', error);
    }
  }

  // Get motivational message for a specific date (or current date if not specified)
  async getMessageForDate(dateString = null) {
    try {
      // Use current date if not provided
      const targetDate = dateString || this.getCurrentDateString();
      
      // Find message for specific date
      let message = await MotivationalMessage.findOne({ date: targetDate });

      // If no message for today, check if countdown is over
      if (!message) {
        // Check if date is after August 4, 2026
        const targetDateObj = new Date(targetDate);
        const finalDateObj = new Date('2026-08-04');
        
        if (targetDateObj > finalDateObj) {
          return {
            message: "HSC is over. Congratulations!",
            examsRemaining: 0,
            nextExam: null,
            category: 'finale'
          };
        }
        
        // If before July 3, return opening message
        const startDateObj = new Date('2026-07-03');
        if (targetDateObj < startDateObj) {
          message = await MotivationalMessage.findOne({ date: "2026-07-03" });
        }
      }

      if (message) {
        console.log(`📝 Using message for date ${targetDate}: ${message.category}`);
        return {
          message: message.message,
          examsRemaining: message.examsRemaining,
          nextExam: message.nextExam,
          category: message.category,
          date: message.date
        };
      }

      // Fallback message
      return {
        message: "Stay focused and keep going!",
        examsRemaining: null,
        nextExam: null,
        category: 'motivation'
      };
    } catch (error) {
      console.error('❌ Error getting motivational message:', error);
      return {
        message: "Stay focused and keep going!",
        examsRemaining: null,
        nextExam: null,
        category: 'motivation'
      };
    }
  }

  // Get motivational message for today
  async getTodayMessage() {
    return this.getMessageForDate();
  }

  // Helper: Get current date string in YYYY-MM-DD format
  getCurrentDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get all messages
  async getAllMessages() {
    try {
      return await MotivationalMessage.find({}).sort({ date: 1 });
    } catch (error) {
      console.error('❌ Error getting all messages:', error);
      return [];
    }
  }

  // Get statistics
  async getStats() {
    try {
      const total = await MotivationalMessage.countDocuments();
      const categories = await MotivationalMessage.distinct('category');

      return {
        total,
        categories,
        isInitialized: this.isInitialized
      };
    } catch (error) {
      console.error('❌ Error getting motivational message stats:', error);
      return { total: 0, categories: [], isInitialized: false };
    }
  }
}

export default MotivationalMessageService;
