import Badge from '../models/Badge.js';
import UserStats from '../models/UserStats.js';
import UserScore from '../models/UserScore.js';
import User from '../models/User.js';

class BadgeService {
  constructor() {
    this.badgeDefinitions = {
      sharpest_mind: {
        displayName: '🎯 Sharpest Mind',
        icon: '🎯',
        description: 'Most total correct answers across all quizzes',
        calculateValue: async (userId) => {
          const stats = await UserStats.findOne({ userId });
          return stats ? stats.totalCorrectAnswers : 0;
        },
        sortOrder: -1 // Descending (highest wins)
      },
      quiz_king: {
        displayName: '🧠 Quiz King/Queen',
        icon: '🧠',
        description: 'Highest average score (minimum 5 quizzes)',
        calculateValue: async (userId) => {
          const stats = await UserStats.findOne({ userId });
          if (!stats || stats.totalQuizzes < 5) return 0;
          return stats.averageScore;
        },
        sortOrder: -1,
        minimumRequirement: 5
      },
      battle_champion: {
        displayName: '⚔️ Battle Champion',
        icon: '⚔️',
        description: 'Most quiz battles won',
        calculateValue: async (userId) => {
          const stats = await UserStats.findOne({ userId });
          return stats ? stats.battlesWon : 0;
        },
        sortOrder: -1
      },
      speed_demon: {
        displayName: '🕒 Speed Demon',
        icon: '🕒',
        description: 'Fastest average quiz time (minimum 5 quizzes)',
        calculateValue: async (userId) => {
          const stats = await UserStats.findOne({ userId });
          if (!stats || stats.totalQuizzes < 5) return Infinity;
          return stats.averageTimePerQuiz;
        },
        sortOrder: 1, // Ascending (fastest wins)
        minimumRequirement: 5
      },
      leader_of_leaders: {
        displayName: '👑 Leader of Leaders',
        icon: '👑',
        description: 'Ranked #1 in leaderboard (live ranking)',
        calculateValue: async (userId) => {
          const user = await User.findById(userId);
          if (!user) return 0;
          
          const leaderboardEntry = await UserScore.findOne({ username: user.username });
          if (!leaderboardEntry) return 0;
          
          // Count how many users have higher scores
          const higherScores = await UserScore.countDocuments({ 
            score: { $gt: leaderboardEntry.score } 
          });
          
          return higherScores === 0 ? leaderboardEntry.score : 0;
        },
        sortOrder: -1
      }
    };
  }

  // Initialize badges in database
  async initializeBadges() {
    try {
      for (const [badgeName, definition] of Object.entries(this.badgeDefinitions)) {
        const existingBadge = await Badge.findOne({ badgeName });
        
        if (!existingBadge) {
          await Badge.create({
            badgeName,
            displayName: definition.displayName,
            icon: definition.icon,
            description: definition.description,
            currentHolderId: null,
            currentHolderUsername: null,
            currentValue: 0,
            previousHolders: []
          });
          console.log(`✅ Initialized badge: ${definition.displayName}`);
        }
      }
    } catch (error) {
      console.error('❌ Error initializing badges:', error);
    }
  }

  // Update user stats after quiz completion
  async updateUserStats(userId, quizData) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const {
        score,
        totalQuestions,
        correctAnswers,
        timeSpent,
        isQuiz = true // true for quiz, false for battle
      } = quizData;

      let userStats = await UserStats.findOne({ userId });
      
      if (!userStats) {
        userStats = new UserStats({
          userId,
          username: user.username
        });
      }

      // Update quiz statistics
      if (isQuiz) {
        userStats.totalQuizzes += 1;
        userStats.totalCorrectAnswers += correctAnswers;
        userStats.totalQuestions += totalQuestions;
        userStats.totalScore += score;
        userStats.averageScore = userStats.totalScore / userStats.totalQuizzes;
        
        // Update time statistics
        userStats.totalTimeSpent += timeSpent;
        userStats.averageTimePerQuiz = userStats.totalTimeSpent / userStats.totalQuizzes;
        
        if (!userStats.fastestQuizTime || timeSpent < userStats.fastestQuizTime) {
          userStats.fastestQuizTime = timeSpent;
        }
      }

      userStats.lastUpdated = new Date();
      await userStats.save();

      console.log(`📊 Updated stats for ${user.username}`);
      
      // Recalculate badges after stats update
      await this.recalculateAllBadges();
      
    } catch (error) {
      console.error('❌ Error updating user stats:', error);
    }
  }

  // Update battle statistics
  async updateBattleStats(userId, battleResult) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      let userStats = await UserStats.findOne({ userId });
      
      if (!userStats) {
        userStats = new UserStats({
          userId,
          username: user.username
        });
      }

      userStats.totalBattles += 1;
      
      if (battleResult.won) {
        userStats.battlesWon += 1;
      } else {
        userStats.battlesLost += 1;
      }
      
      userStats.battleWinRate = userStats.battlesWon / userStats.totalBattles;
      userStats.lastUpdated = new Date();
      
      await userStats.save();
      
      console.log(`⚔️ Updated battle stats for ${user.username}`);
      
      // Recalculate badges after battle stats update
      await this.recalculateAllBadges();
      
    } catch (error) {
      console.error('❌ Error updating battle stats:', error);
    }
  }

  // Recalculate all badges
  async recalculateAllBadges() {
    try {
      const notifications = [];
      
      for (const badgeName of Object.keys(this.badgeDefinitions)) {
        const notification = await this.recalculateBadge(badgeName);
        if (notification) {
          notifications.push(notification);
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('❌ Error recalculating badges:', error);
      return [];
    }
  }

  // Recalculate a specific badge
  async recalculateBadge(badgeName) {
    try {
      const definition = this.badgeDefinitions[badgeName];
      if (!definition) return null;

      const badge = await Badge.findOne({ badgeName });
      if (!badge) return null;

      // Get all users and calculate their values for this badge
      const users = await User.find({});
      const userValues = [];

      for (const user of users) {
        const value = await definition.calculateValue(user._id);
        
        // Skip users who don't meet minimum requirements
        if (definition.minimumRequirement && value === 0) continue;
        if (badgeName === 'speed_demon' && value === Infinity) continue;
        
        userValues.push({
          userId: user._id,
          username: user.username,
          value
        });
      }

      if (userValues.length === 0) return null;

      // Sort users by their values
      userValues.sort((a, b) => {
        return definition.sortOrder === 1 ? a.value - b.value : b.value - a.value;
      });

      const newWinner = userValues[0];
      const currentHolderId = badge.currentHolderId?.toString();
      const newWinnerId = newWinner.userId.toString();

      // Check if badge holder needs to change
      if (currentHolderId !== newWinnerId) {
        const notification = await this.transferBadge(badge, newWinner, currentHolderId);
        return notification;
      }

      return null;
    } catch (error) {
      console.error(`❌ Error recalculating badge ${badgeName}:`, error);
      return null;
    }
  }

  // Transfer badge from one user to another
  async transferBadge(badge, newWinner, previousHolderId) {
    try {
      const notification = {
        badgeName: badge.badgeName,
        displayName: badge.displayName,
        icon: badge.icon,
        newHolder: {
          userId: newWinner.userId,
          username: newWinner.username
        },
        previousHolder: null,
        value: newWinner.value
      };

      // Handle previous holder
      if (previousHolderId) {
        const previousHolder = await User.findById(previousHolderId);
        if (previousHolder) {
          notification.previousHolder = {
            userId: previousHolderId,
            username: previousHolder.username
          };

          // Remove badge from previous holder's stats
          await this.removeBadgeFromUser(previousHolderId, badge.badgeName, newWinner.username);
          
          // Add to previous holders list
          badge.previousHolders.push({
            userId: previousHolderId,
            username: previousHolder.username,
            heldFrom: badge.lastUpdated,
            heldUntil: new Date(),
            value: badge.currentValue
          });
        }
      }

      // Update badge with new holder
      badge.currentHolderId = newWinner.userId;
      badge.currentHolderUsername = newWinner.username;
      badge.currentValue = newWinner.value;
      badge.lastUpdated = new Date();
      await badge.save();

      // Add badge to new holder's stats
      await this.addBadgeToUser(newWinner.userId, badge);

      console.log(`🏆 Badge ${badge.displayName} transferred to ${newWinner.username}`);
      
      return notification;
    } catch (error) {
      console.error('❌ Error transferring badge:', error);
      return null;
    }
  }

  // Add badge to user's stats
  async addBadgeToUser(userId, badge) {
    try {
      let userStats = await UserStats.findOne({ userId });
      
      if (!userStats) {
        const user = await User.findById(userId);
        userStats = new UserStats({
          userId,
          username: user.username
        });
      }

      // Remove existing badge if present (shouldn't happen, but safety check)
      userStats.currentBadges = userStats.currentBadges.filter(
        b => b.badgeName !== badge.badgeName
      );

      // Add new badge
      userStats.currentBadges.push({
        badgeName: badge.badgeName,
        displayName: badge.displayName,
        icon: badge.icon,
        earnedAt: new Date()
      });

      // Add to badge history
      userStats.badgeHistory.push({
        badgeName: badge.badgeName,
        displayName: badge.displayName,
        action: 'earned',
        value: badge.currentValue,
        timestamp: new Date()
      });

      await userStats.save();
    } catch (error) {
      console.error('❌ Error adding badge to user:', error);
    }
  }

  // Remove badge from user's stats
  async removeBadgeFromUser(userId, badgeName, lostToUsername) {
    try {
      const userStats = await UserStats.findOne({ userId });
      if (!userStats) return;

      // Remove from current badges
      const badgeIndex = userStats.currentBadges.findIndex(
        b => b.badgeName === badgeName
      );
      
      if (badgeIndex > -1) {
        const removedBadge = userStats.currentBadges[badgeIndex];
        userStats.currentBadges.splice(badgeIndex, 1);

        // Add to badge history
        userStats.badgeHistory.push({
          badgeName: badgeName,
          displayName: removedBadge.displayName,
          action: 'lost',
          timestamp: new Date(),
          lostTo: lostToUsername
        });

        await userStats.save();
      }
    } catch (error) {
      console.error('❌ Error removing badge from user:', error);
    }
  }

  // Get user's current badges
  async getUserBadges(userId) {
    try {
      const userStats = await UserStats.findOne({ userId });
      return userStats ? userStats.currentBadges : [];
    } catch (error) {
      console.error('❌ Error getting user badges:', error);
      return [];
    }
  }

  // Get all badges with current holders
  async getAllBadges() {
    try {
      return await Badge.find({ isActive: true }).sort({ badgeName: 1 });
    } catch (error) {
      console.error('❌ Error getting all badges:', error);
      return [];
    }
  }

  // Get badge leaderboard for a specific badge
  async getBadgeLeaderboard(badgeName, limit = 10) {
    try {
      const definition = this.badgeDefinitions[badgeName];
      if (!definition) return [];

      const users = await User.find({});
      const userValues = [];

      for (const user of users) {
        const value = await definition.calculateValue(user._id);
        
        if (definition.minimumRequirement && value === 0) continue;
        if (badgeName === 'speed_demon' && value === Infinity) continue;
        
        userValues.push({
          userId: user._id,
          username: user.username,
          avatar: user.avatar,
          value
        });
      }

      // Sort and limit
      userValues.sort((a, b) => {
        return definition.sortOrder === 1 ? a.value - b.value : b.value - a.value;
      });

      return userValues.slice(0, limit);
    } catch (error) {
      console.error(`❌ Error getting badge leaderboard for ${badgeName}:`, error);
      return [];
    }
  }
}

export default BadgeService;