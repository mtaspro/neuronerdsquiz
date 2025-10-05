import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';
import whatsappService from '../services/whatsappService.js';
import User from '../models/User.js';

const router = express.Router();

// Store active battle room (in production, use Redis or database)
let activeBattleRoom = null;
let battleRoomCreator = null; // Track who created the room

// Create battle room (admin only)
router.post('/create', sessionMiddleware, async (req, res) => {
  try {
    const { roomId, chapter } = req.body;
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can create battle rooms' });
    }
    
    // Set active battle room
    activeBattleRoom = { id: roomId, chapter, status: 'waiting', creatorId: req.user.id };
    battleRoomCreator = req.user.id; // Track the creator
    
    // Broadcast to all connected clients via socket
    if (req.app.get('io')) {
      req.app.get('io').emit('battleRoomCreated', activeBattleRoom);
    }
    
    // Send WhatsApp group notification with quick join link and mentions
    const battleUrl = `https://neuronerdsquiz.vercel.app/battle/${roomId}`;
    const mentionData = await createBattleNotificationWithMentions(roomId, chapter, battleUrl);
    await sendBattleNotificationWithMentions(mentionData);
    
    res.json({ success: true, battleRoom: activeBattleRoom });
  } catch (error) {
    console.error('Error creating battle room:', error);
    res.status(500).json({ error: 'Failed to create battle room' });
  }
});

// Get active battle room with user participation info
router.get('/active', sessionMiddleware, async (req, res) => {
  try {
    // Don't return ended or expired rooms
    if (activeBattleRoom && (activeBattleRoom.status === 'ended' || activeBattleRoom.status === 'expired')) {
      activeBattleRoom = null;
      battleRoomCreator = null;
    }
    
    let userInBattle = false;
    let userProgress = null;
    
    // Check if user is already in the battle room
    if (activeBattleRoom && req.user?.id) {
      try {
        // Get battle service from server.js to check user participation
        const battleService = req.app.get('battleService');
        if (battleService) {
          const room = battleService.getRoom(activeBattleRoom.id);
          if (room && room.users.has(req.user.id)) {
            const user = room.users.get(req.user.id);
            userInBattle = true;
            userProgress = {
              currentQuestion: user.currentQuestion || 0,
              score: user.score || 0,
              hasProgress: user.currentQuestion > 0 || user.hasCompleted
            };
          }
        }
      } catch (error) {
        console.error('Error checking user battle participation:', error);
      }
    }
    
    res.json({ 
      battleRoom: activeBattleRoom,
      userInBattle,
      userProgress
    });
  } catch (error) {
    console.error('Error getting active battle room:', error);
    res.status(500).json({ error: 'Failed to get battle room info' });
  }
});

// Start battle (mark as started)
router.post('/start', sessionMiddleware, async (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (activeBattleRoom && activeBattleRoom.id === roomId) {
      activeBattleRoom.status = 'started';
      
      // Don't emit battleStarted here - let socket handler do it with questions
      // if (req.app.get('io')) {
      //   req.app.get('io').emit('battleStarted', activeBattleRoom);
      // }
      
      // Send WhatsApp notifications with join link
      await sendBattleStartedNotifications(roomId, activeBattleRoom.chapter);
      
      res.json({ success: true, battleRoom: activeBattleRoom });
    } else {
      res.status(404).json({ error: 'Battle room not found' });
    }
  } catch (error) {
    console.error('Error starting battle:', error);
    res.status(500).json({ error: 'Failed to start battle' });
  }
});

// Force submission for all participants
router.post('/force-submission', sessionMiddleware, async (req, res) => {
  try {
    const { roomId, creatorId } = req.body;
    
    if (!activeBattleRoom || activeBattleRoom.id !== roomId) {
      return res.status(404).json({ error: 'Battle room not found' });
    }
    
    if (activeBattleRoom.creatorId !== creatorId) {
      return res.status(403).json({ error: 'Only battle creator can force submission' });
    }
    
    // Get battle service and force submission for all users
    const battleService = req.app.get('battleService');
    if (battleService) {
      const io = req.app.get('io');
      const room = battleService.getRoom(roomId);
      
      if (room) {
        console.log(`⚡ Force submission initiated for room ${roomId}`);
        
        // Force complete all users and trigger battle end
        for (const user of room.users.values()) {
          if (!user.hasCompleted) {
            user.currentQuestion = room.questions.length;
            user.hasCompleted = true;
            user.forceSubmitted = true;
          }
        }
        
        // End the battle and get results
        const battleResults = battleService.endBattle(roomId);
        
        // Save results to leaderboard
        const { saveBattleResultsToLeaderboard, sendBattleEndNotification } = await import('../server.js');
        if (saveBattleResultsToLeaderboard) {
          await saveBattleResultsToLeaderboard(battleResults);
        }
        
        // Send WhatsApp notification
        if (sendBattleEndNotification) {
          await sendBattleEndNotification(roomId, battleResults);
        }
        
        // Clear the active battle room
        activeBattleRoom = null;
        battleRoomCreator = null;
        
        // Emit battle ended to all participants
        io.to(roomId).emit('battleEnded', battleResults);
        
        res.json({ success: true, message: 'Force submission completed', results: battleResults });
      } else {
        res.status(404).json({ error: 'Battle room not found in service' });
      }
    } else {
      res.status(500).json({ error: 'Battle service not available' });
    }
  } catch (error) {
    console.error('Error in force submission:', error);
    res.status(500).json({ error: 'Failed to force submission' });
  }
});

// End battle (mark as ended)
router.post('/end', sessionMiddleware, async (req, res) => {
  try {
    const { roomId, reason } = req.body;
    
    if (activeBattleRoom && activeBattleRoom.id === roomId) {
      activeBattleRoom.status = 'ended';
      
      // Broadcast to all connected clients
      if (req.app.get('io')) {
        req.app.get('io').emit('battleEnded', activeBattleRoom);
      }
      
      // Send WhatsApp group notification based on reason
      if (reason === 'stopped') {
        await sendBattleNotification(`🛑 Battle Stopped! 🛑\n\nRoom: ${roomId}\nChapter: ${activeBattleRoom.chapter}\n\nThe battle was stopped by the admin.`);
      } else {
        await sendBattleNotification(`🏁 Battle Ended! 🏁\n\nRoom: ${roomId}\nChapter: ${activeBattleRoom.chapter}\n\nAll participants have finished the battle!`);
      }
      
      // Clear the battle room immediately after ending
      setTimeout(() => {
        activeBattleRoom = null;
        battleRoomCreator = null;
        if (req.app.get('io')) {
          req.app.get('io').emit('battleRoomClosed');
        }
        console.log(`🗑️ Battle room ${roomId} cleared after ending`);
      }, 2000); // Reduced to 2 seconds for faster cleanup
      
      res.json({ success: true, battleRoom: activeBattleRoom });
    } else {
      res.status(404).json({ error: 'Battle room not found' });
    }
  } catch (error) {
    console.error('Error ending battle:', error);
    res.status(500).json({ error: 'Failed to end battle' });
  }
});

// Close battle room
router.post('/close', sessionMiddleware, (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can close battle rooms' });
    }
    
    activeBattleRoom = null;
    battleRoomCreator = null;
    
    // Broadcast to all connected clients
    if (req.app.get('io')) {
      req.app.get('io').emit('battleRoomClosed');
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error closing battle room:', error);
    res.status(500).json({ error: 'Failed to close battle room' });
  }
});

// Expire battle room when creator leaves
router.post('/expire', sessionMiddleware, (req, res) => {
  try {
    const { roomId, userId } = req.body;
    
    // Check if the user leaving is the creator and battle hasn't started
    if (activeBattleRoom && 
        activeBattleRoom.id === roomId && 
        battleRoomCreator === userId && 
        activeBattleRoom.status === 'waiting') {
      
      console.log(`Battle room ${roomId} expired - creator left before starting`);
      
      // Immediately clear the battle room
      activeBattleRoom = null;
      battleRoomCreator = null;
      
      // Broadcast expiration to all connected clients
      if (req.app.get('io')) {
        req.app.get('io').emit('battleRoomExpired', { roomId, reason: 'Creator left' });
        req.app.get('io').emit('battleRoomClosed');
      }
      
      res.json({ success: true, expired: true });
    } else {
      res.json({ success: true, expired: false });
    }
  } catch (error) {
    console.error('Error expiring battle room:', error);
    res.status(500).json({ error: 'Failed to expire battle room' });
  }
});

// Helper function to create battle notification with member mentions
async function createBattleNotificationWithMentions(roomId, chapter, battleUrl) {
  try {
    const WhatsAppSettings = (await import('../models/WhatsAppSettings.js')).default;
    const setting = await WhatsAppSettings.findOne({ settingKey: 'battleNotificationGroup' });
    
    if (setting?.settingValue) {
      // Get group members
      const groupMembers = await whatsappService.getGroupMembers(setting.settingValue);
      
      // Create mentions string with proper usernames
      let mentions = '';
      if (groupMembers && groupMembers.length > 0) {
        try {
          const groupMetadata = await whatsappService.sock.groupMetadata(setting.settingValue);
          mentions = groupMembers.map(member => {
            const participant = groupMetadata.participants.find(p => p.id === member.id);
            const username = participant?.notify || participant?.name || member.id.split('@')[0];
            return `@${username}`;
          }).join(' ');
        } catch (error) {
          // Fallback to phone numbers
          mentions = groupMembers.map(member => `@${member.id.split('@')[0]}`).join(' ');
        }
      }
      
      const message = `🔥 *BATTLE ROOM CREATED!* 🔥\n\n⚔️ Room ID: ${roomId}\n📚 Chapter: *${chapter}*\n\n🚀 *Quick Join:* ${battleUrl}\n\n📱 Or visit Dashboard → Join Battle\n\n🎯 *Calling all warriors!* 🎯\n${mentions}\n\n⏰ *Join now to test your skills!*\n\n_(যদি কেউ কোনো কারণে Battle থেকে Disconnected হয়ে বের হয়ে যায়, সে উপোরোক্ত Link দিয়ে পুনরায় JOIN করতে পারবে এবং Last Progress থেকে Continue করতে পাবে)_`;
      
      return {
        message,
        mentions: groupMembers.map(member => member.id)
      };
    }
    
    // Fallback without mentions
    return `🔥 Battle Room Created! 🔥\n\nRoom ID: ${roomId}\nChapter: ${chapter}\n\n🚀 Quick Join: ${battleUrl}\n\nOr visit dashboard and join now to test your skills!`;
  } catch (error) {
    console.error('Error creating mention message:', error);
    // Fallback without mentions
    return `🔥 Battle Room Created! 🔥\n\nRoom ID: ${roomId}\nChapter: ${chapter}\n\n🚀 Quick Join: ${battleUrl}\n\nOr visit dashboard and join now to test your skills!`;
  }
}

// Helper function to send battle notifications with mentions
async function sendBattleNotificationWithMentions(mentionData) {
  try {
    const WhatsAppSettings = (await import('../models/WhatsAppSettings.js')).default;
    const setting = await WhatsAppSettings.findOne({ settingKey: 'battleNotificationGroup' });
    
    if (setting?.settingValue) {
      if (typeof mentionData === 'string') {
        await whatsappService.sendGroupMessage(setting.settingValue, mentionData);
      } else {
        await whatsappService.sendGroupMessage(setting.settingValue, mentionData.message, {
          mentions: mentionData.mentions
        });
      }
    }
  } catch (error) {
    console.error('Error sending battle notification:', error);
  }
}

// Helper function to send battle notifications to configured group
async function sendBattleNotification(message) {
  try {
    const WhatsAppSettings = (await import('../models/WhatsAppSettings.js')).default;
    const setting = await WhatsAppSettings.findOne({ settingKey: 'battleNotificationGroup' });
    
    if (setting?.settingValue) {
      await whatsappService.sendGroupMessage(setting.settingValue, message);
    }
  } catch (error) {
    console.error('Error sending battle notification:', error);
  }
}

// Helper function to send battle started notifications (group only)
async function sendBattleStartedNotifications(roomId, chapter) {
  try {
    // Send to configured group only
    const WhatsAppSettings = (await import('../models/WhatsAppSettings.js')).default;
    const setting = await WhatsAppSettings.findOne({ settingKey: 'battleNotificationGroup' });
    
    if (setting?.settingValue) {
      const message = `🔥 *QUIZ BATTLE STARTED!* 🔥\n\n⚔️ Chapter: *${chapter}*\n🎯 The epic battle has begun!\n\n💡 Go to Dashboard → Watch Battle\n\nHurry up! ⚡`;
      await whatsappService.sendGroupMessage(setting.settingValue, message);
    }
  } catch (error) {
    console.error('Error sending battle started notifications:', error);
  }
}

// Export function to clear active battle room
export function clearActiveBattleRoom(roomId) {
  if (activeBattleRoom && activeBattleRoom.id === roomId) {
    console.log(`🗑️ Clearing active battle room: ${roomId}`);
    activeBattleRoom = null;
    battleRoomCreator = null;
    return true;
  }
  return false;
}

export default router;