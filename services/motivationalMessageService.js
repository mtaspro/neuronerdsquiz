import MotivationalMessage, { MotivationalSequence } from '../models/MotivationalMessage.js';

class MotivationalMessageService {
  constructor() {
    this.messages = [];
    this.isInitialized = false;
  }

  // Initialize motivational messages from examples
  async initializeMessages() {
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
        },
        {
          dayNumber: 58,
          message: "58 days. Plenty of time, you say.\nYou've been saying that… for a while now.",
          category: 'denial'
        },
        {
          dayNumber: 57,
          message: "57 days. Big comeback planned.\nStill waiting for the first move.",
          category: 'insult'
        },
        {
          dayNumber: 56,
          message: "56 days. You made a schedule. Beautiful schedule.\nFollowing it? Not so beautiful.",
          category: 'mock_praise'
        },
        {
          dayNumber: 55,
          message: "55 days. You watched 3 productivity videos.\nStudied 0 minutes. Incredible balance.",
          category: 'absurd_twist'
        },
        {
          dayNumber: 54,
          message: "54 days. Energy is low. Motivation is low.\nExcuses? Very high. World class.",
          category: 'insult'
        },
        {
          dayNumber: 53,
          message: "53 days. You're thinking about starting seriously.\nThinking… still thinking… amazing thinking.",
          category: 'irony_hit'
        },
        {
          dayNumber: 52,
          message: "52 days. You cleaned your desk.\nNow if only knowledge appeared the same way.",
          category: 'absurd_twist'
        },
        {
          dayNumber: 51,
          message: "51 days. You said 'today is the day.'\nHalf the day gone. No sign of it.",
          category: 'insult'
        },
        {
          dayNumber: 50,
          message: "50 days. Big number. Important number.\nWould be nice if your preparation matched it.",
          category: 'mock_praise'
        },
        {
          dayNumber: 49,
          message: "49 days. You're calm. Very calm.\nAlmost like you forgot what's coming.",
          category: 'confidence_warning'
        },
        {
          dayNumber: 48,
          message: "48 days. You revised… in your head.\nBrain says yes. Reality says no.",
          category: 'irony_hit'
        },
        {
          dayNumber: 47,
          message: "47 days. You opened YouTube for 'one lecture.'\nThree hours later—new expert in nothing.",
          category: 'absurd_twist'
        },
        {
          dayNumber: 46,
          message: "46 days. You compare yourself with toppers.\nThey study. You observe. Big difference.",
          category: 'insult'
        },
        {
          dayNumber: 45,
          message: "45 days. Half panic, half denial.\nVery creative strategy. Never seen before.",
          category: 'irony_hit'
        },
        {
          dayNumber: 44,
          message: "44 days. You feel behind.\nBecause you are. Simple math.",
          category: 'insult'
        },
        {
          dayNumber: 43,
          message: "43 days. You planned a comeback story.\nRight now it's just… a story.",
          category: 'mock_praise'
        },
        {
          dayNumber: 42,
          message: "42 days. You said 'I'll fix everything soon.'\nSoon is doing a lot of work here.",
          category: 'irony_hit'
        },
        {
          dayNumber: 41,
          message: "41 days. Confidence still high.\nEvidence still missing.",
          category: 'confidence_warning'
        },
        {
          dayNumber: 40,
          message: "40 days. Round number. Serious time.\nYou? Still negotiating with yourself.",
          category: 'insult'
        },
        {
          dayNumber: 39,
          message: "39 days. You made another plan.\nThis one will fail… but differently.",
          category: 'absurd_twist'
        },
        {
          dayNumber: 38,
          message: "38 days. You checked syllabus today.\nVery brave. Didn't study it though.",
          category: 'mock_praise'
        },
        {
          dayNumber: 37,
          message: "37 days. Panic starting.\nStill not strong enough to beat laziness.",
          category: 'confidence_warning'
        },
        {
          dayNumber: 36,
          message: "36 days. You said 'no distractions today.'\nPhone says otherwise.",
          category: 'insult'
        },
        {
          dayNumber: 35,
          message: "35 days. You're tired… from not studying.\nVery interesting condition.",
          category: 'absurd_twist'
        },
        {
          dayNumber: 34,
          message: "34 days. You feel pressure now.\nGood. Took you long enough.",
          category: 'insult'
        },
        {
          dayNumber: 33,
          message: "33 days. You started something.\nStopped shortly after. Consistency unmatched.",
          category: 'mock_praise'
        },
        {
          dayNumber: 32,
          message: "32 days. You say 'I work best under pressure.'\nPressure says: we'll see.",
          category: 'irony_hit'
        },
        {
          dayNumber: 31,
          message: "31 days. One month left.\nStill acting like it's vacation.",
          category: 'insult'
        },
        {
          dayNumber: 30,
          message: "30 days. Big moment. Big urgency.\nStill small effort.",
          category: 'contrast'
        },
        {
          dayNumber: 29,
          message: "29 days. You tried studying seriously.\nGot distracted professionally.",
          category: 'absurd_twist'
        },
        {
          dayNumber: 28,
          message: "28 days. You feel the fear.\nFinally something real.",
          category: 'confidence_warning'
        },
        {
          dayNumber: 27,
          message: "27 days. You're rushing now.\nShould've rushed earlier.",
          category: 'insult'
        },
        {
          dayNumber: 26,
          message: "26 days. You regret wasting time.\nRegret doesn't solve questions.",
          category: 'insult'
        },
        {
          dayNumber: 25,
          message: "25 days. You started studying properly.\nWhy does it feel so new?",
          category: 'irony_hit'
        },
        {
          dayNumber: 24,
          message: "24 days. You're trying hard now.\nTime is not impressed.",
          category: 'insult'
        },
        {
          dayNumber: 23,
          message: "23 days. Panic mode activated.\nPreparation still loading.",
          category: 'absurd_twist'
        },
        {
          dayNumber: 22,
          message: "22 days. You believe in miracles.\nExam doesn't.",
          category: 'insult'
        },
        {
          dayNumber: 21,
          message: "21 days. Three weeks left.\nNow it's real. Very real.",
          category: 'pressure'
        },
        {
          dayNumber: 20,
          message: "20 days. You study fast now.\nUnderstanding? Optional.",
          category: 'irony_hit'
        },
        {
          dayNumber: 19,
          message: "19 days. You skip hard topics.\nThey won't skip you.",
          category: 'insult'
        },
        {
          dayNumber: 18,
          message: "18 days. You're exhausted.\nFrom catching up with your past.",
          category: 'absurd_twist'
        },
        {
          dayNumber: 17,
          message: "17 days. You wish for more time.\nTime wishes you used it better.",
          category: 'irony_hit'
        },
        {
          dayNumber: 16,
          message: "16 days. You try everything now.\nExcept going back in time.",
          category: 'absurd_twist'
        },
        {
          dayNumber: 15,
          message: "15 days. Half panic, half studying.\nStill not enough.",
          category: 'insult'
        },
        {
          dayNumber: 14,
          message: "14 days. Two weeks.\nNo more jokes. Only reality.",
          category: 'pressure'
        },
        {
          dayNumber: 13,
          message: "13 days. You are serious now.\nFinally. Very late, but welcome.",
          category: 'mock_praise'
        },
        {
          dayNumber: 12,
          message: "12 days. You revise quickly.\nBrain struggling to keep up.",
          category: 'irony_hit'
        },
        {
          dayNumber: 11,
          message: "11 days. Confidence shaky.\nGood. Means you see reality.",
          category: 'confidence_warning'
        },
        {
          dayNumber: 10,
          message: "10 days. Single digits.\nNo hiding now.",
          category: 'pressure'
        },
        {
          dayNumber: 9,
          message: "9 days. You wish you started earlier.\nClassic move.",
          category: 'insult'
        },
        {
          dayNumber: 8,
          message: "8 days. You study all day.\nRetention says: not so fast.",
          category: 'irony_hit'
        },
        {
          dayNumber: 7,
          message: "7 days. One week.\nThis is it.",
          category: 'pressure'
        },
        {
          dayNumber: 6,
          message: "6 days. You try to stay calm.\nPanic knocking loudly.",
          category: 'confidence_warning'
        },
        {
          dayNumber: 5,
          message: "5 days. You revise everything.\nEverything revises you back.",
          category: 'absurd_twist'
        },
        {
          dayNumber: 4,
          message: "4 days. Sleep? Optional.\nStress? Mandatory.",
          category: 'insult'
        },
        {
          dayNumber: 3,
          message: "3 days. You promise yourself you'll do better.\nBit late for promises.",
          category: 'insult'
        },
        {
          dayNumber: 2,
          message: "2 days. Final preparation.\nReality fully unlocked.",
          category: 'pressure'
        },
        {
          dayNumber: 1,
          message: "1 day. Tomorrow is the exam.\nNo more 'tomorrow' excuses now.",
          category: 'final_warning'
        },
        {
          dayNumber: 0,
          message: "0 days. This is it.\nHope you brought more than confidence.",
          category: 'final_hit'
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

  // Get a motivational message for specific day (based on exam countdown)
  async getMessageForDay(dayNumber) {
    try {
      // Find exact day match (no 'isUsed' check for exam-based consistency)
      let message = await MotivationalMessage.findOne({ 
        dayNumber 
      });

      // If no exact match, find closest message
      if (!message) {
        message = await MotivationalMessage.findOne({ 
          dayNumber: { $lte: dayNumber }
        }).sort({ dayNumber: -1 });
      }

      // If still no message, find any message
      if (!message) {
        message = await MotivationalMessage.findOne().sort({ dayNumber: 1 });
      }
      
      if (message) {
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
