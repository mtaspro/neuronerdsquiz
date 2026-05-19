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
          message: "46 days. Some of you are finally locking in.\nOthers still negotiating with the syllabus. Interesting strategy.",
          category: 'balanced'
        },
        {
          dayNumber: 45,
          message: "45 days. Progress is showing now.\nEven small daily wins? Very powerful. Very underrated.",
          category: 'motivation'
        },
        {
          dayNumber: 44,
          message: "44 days. If you're behind—start now.\nIf you're ahead—don't get comfortable. Simple rule.",
          category: 'balanced'
        },
        {
          dayNumber: 43,
          message: "43 days. Your hard work is starting to look real.\nBeautiful thing. Keep going.",
          category: 'motivation'
        },
        {
          dayNumber: 42,
          message: "42 days. Panic won't save you.\nBut consistency? Tremendous results.",
          category: 'inspiration'
        },
        {
          dayNumber: 41,
          message: "41 days. Confidence is good now.\nAs long as it's backed by revision. Important detail.",
          category: 'balanced'
        },
        {
          dayNumber: 40,
          message: "40 days. Big number. Big pressure.\nBut also enough time to seriously improve.",
          category: 'hope'
        },
        {
          dayNumber: 39,
          message: "39 days. Some students are transforming completely.\nVery scary. In a good way.",
          category: 'motivation'
        },
        {
          dayNumber: 38,
          message: "38 days. You're not the same student from 2 months ago.\nHopefully better. Much better.",
          category: 'reflection'
        },
        {
          dayNumber: 37,
          message: "37 days. Effort compounds quietly.\nThen suddenly everyone notices.",
          category: 'inspiration'
        },
        {
          dayNumber: 36,
          message: "36 days. One productive day still matters.\nNever underestimate momentum.",
          category: 'motivation'
        },
        {
          dayNumber: 35,
          message: "35 days. Science students surviving chemistry, physics, math together.\nHonestly? Historic resilience.",
          category: 'science_student'
        },
        {
          dayNumber: 34,
          message: "34 days. You're tired because you're trying.\nThat's a much better problem now.",
          category: 'motivation'
        },
        {
          dayNumber: 33,
          message: "33 days. Some chapters finally make sense.\nMiracles happening everywhere.",
          category: 'absurd_twist'
        },
        {
          dayNumber: 32,
          message: "32 days. Maybe you're behind.\nMaybe one focused month changes everything.",
          category: 'hope'
        },
        {
          dayNumber: 31,
          message: "31 days. One month left.\nThis is where serious students are created.",
          category: 'pressure_motivation'
        },
        {
          dayNumber: 30,
          message: "30 days. The pressure is real now.\nGood. Diamonds, remember?",
          category: 'callback'
        },
        {
          dayNumber: 29,
          message: "29 days. Your future self is watching closely.\nVery judgmental person.",
          category: 'funny_motivation'
        },
        {
          dayNumber: 28,
          message: "28 days. At this point, discipline beats motivation.\nEvery single time.",
          category: 'inspiration'
        },
        {
          dayNumber: 27,
          message: "27 days. You're studying topics you once feared.\nLook at that growth. Incredible.",
          category: 'motivation'
        },
        {
          dayNumber: 26,
          message: "26 days. Revision season.\nWhere confidence and confusion fight daily.",
          category: 'balanced'
        },
        {
          dayNumber: 25,
          message: "25 days. Quarter century left.\nStill enough time for a legendary comeback.",
          category: 'hope'
        },
        {
          dayNumber: 24,
          message: "24 days. Your consistency is becoming dangerous now.\nVery good sign.",
          category: 'motivation'
        },
        {
          dayNumber: 23,
          message: "23 days. Some of you are finally believing in yourselves.\nAbout time.",
          category: 'confidence'
        },
        {
          dayNumber: 22,
          message: "22 days. HSC science students running on stress and determination.\nPowerful combination.",
          category: 'science_student'
        },
        {
          dayNumber: 21,
          message: "21 days. Three weeks left.\nNot time to quit. Time to sharpen.",
          category: 'pressure_motivation'
        },
        {
          dayNumber: 20,
          message: "20 days. You're closer than you think.\nKeep pushing.",
          category: 'motivation'
        },
        {
          dayNumber: 19,
          message: "19 days. Hard topics don't look impossible anymore.\nThat's growth.",
          category: 'reflection'
        },
        {
          dayNumber: 18,
          message: "18 days. Your brain is overloaded.\nMeans it's adapting. Beautiful science.",
          category: 'science_student'
        },
        {
          dayNumber: 17,
          message: "17 days. You're not aiming for perfection now.\nYou're aiming for progress. Smart move.",
          category: 'balanced'
        },
        {
          dayNumber: 16,
          message: "16 days. Even average days matter now.\nKeep stacking them.",
          category: 'motivation'
        },
        {
          dayNumber: 15,
          message: "15 days. Half the battle now is mental.\nStay steady.",
          category: 'inspiration'
        },
        {
          dayNumber: 14,
          message: "14 days. Two weeks.\nYou've come too far to slow down now.",
          category: 'pressure_motivation'
        },
        {
          dayNumber: 13,
          message: "13 days. Imagine giving up after surviving physics numericals.\nCouldn't be you.",
          category: 'funny_motivation'
        },
        {
          dayNumber: 12,
          message: "12 days. Revision hitting differently now.\nSome answers entering permanent memory.",
          category: 'motivation'
        },
        {
          dayNumber: 11,
          message: "11 days. You're stronger than your old excuses.\nVery important development.",
          category: 'confidence'
        },
        {
          dayNumber: 10,
          message: "10 days. Single digits tomorrow.\nLock in. Legendary finish possible.",
          category: 'pressure_motivation'
        },
        {
          dayNumber: 9,
          message: "9 days. The students who kept trying? It's starting to show.",
          category: 'motivation'
        },
        {
          dayNumber: 8,
          message: "8 days. Sleep matters. Revision matters.\nMental stability? Also useful.",
          category: 'balanced'
        },
        {
          dayNumber: 7,
          message: "7 days. One week left.\nNo fear now. Only execution.",
          category: 'final_push'
        },
        {
          dayNumber: 6,
          message: "6 days. You've studied harder than people realize.\nBe proud of that quietly.",
          category: 'reflection'
        },
        {
          dayNumber: 5,
          message: "5 days. The syllabus once looked impossible.\nNow look at you.",
          category: 'motivation'
        },
        {
          dayNumber: 4,
          message: "4 days. Keep calm. Revise smart.\nPanic has terrible marks usually.",
          category: 'funny_motivation'
        },
        {
          dayNumber: 3,
          message: "3 days. You're entering the final stage now.\nTrust the work you've done.",
          category: 'final_push'
        },
        {
          dayNumber: 2,
          message: "2 days. No more overthinking.\nJust focus and finish strong.",
          category: 'final_push'
        },
        {
          dayNumber: 1,
          message: "1 day. Tomorrow changes things.\nWalk in prepared. Walk in proud.",
          category: 'final_push'
        },
        {
          dayNumber: 0,
          message: "0 days. HSC day.\nAfter all the stress, late nights, and effort—you made it here. Now go show them.",
          category: 'finale'
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
