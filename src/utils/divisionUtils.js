// Division ranking system for quiz leaderboard
export const DIVISIONS = {
  AMATEUR: { name: 'Amateur', stages: ['III', 'II', 'I'], color: '#CD7F32', gradient: 'from-amber-700 via-amber-500 to-amber-800' },
  SEMI_PRO: { name: 'Semi Pro', stages: ['III', 'II', 'I'], color: '#C0C0C0', gradient: 'from-gray-400 via-gray-300 to-gray-500' },
  PRO: { name: 'Pro', stages: ['III', 'II', 'I'], color: '#FFD700', gradient: 'from-yellow-400 via-yellow-300 to-yellow-600' },
  WORLD_CLASS: { name: 'World Class', stages: ['III', 'II', 'I'], color: '#E5E4E2', gradient: 'from-slate-300 via-slate-200 to-slate-400' },
  LEGENDARY: { name: 'Legendary', stages: ['III', 'II', 'I'], color: '#B9F2FF', gradient: 'from-cyan-300 via-blue-300 to-cyan-500' },
  CHAMPION: { name: 'Champion', stages: ['III', 'II', 'I'], color: '#FF6B6B', gradient: 'from-red-400 via-pink-400 to-red-600' }
};

// Calculate division based on user stats
export function calculateDivision(userStats) {
  const { totalQuizzes = 0, averageScore = 0, streak = 0 } = userStats;
  
  // Points system: quizzes * average + streak bonus
  const points = (totalQuizzes * averageScore / 100) + (streak * 2);
  
  // Division thresholds
  if (points >= 500) return { division: 'CHAMPION', stage: Math.min(Math.floor((points - 500) / 100), 2) };
  if (points >= 300) return { division: 'LEGENDARY', stage: Math.min(Math.floor((points - 300) / 67), 2) };
  if (points >= 200) return { division: 'WORLD_CLASS', stage: Math.min(Math.floor((points - 200) / 33), 2) };
  if (points >= 100) return { division: 'PRO', stage: Math.min(Math.floor((points - 100) / 33), 2) };
  if (points >= 50) return { division: 'SEMI_PRO', stage: Math.min(Math.floor((points - 50) / 17), 2) };
  return { division: 'AMATEUR', stage: Math.min(Math.floor(points / 17), 2) };
}

// Get division display info
export function getDivisionInfo(division, stage) {
  const divisionData = DIVISIONS[division];
  if (!divisionData) return { name: 'Amateur', stage: 'III', gradient: DIVISIONS.AMATEUR.gradient };
  
  // Ensure stage is a valid number and within bounds
  const validStage = typeof stage === 'number' && stage >= 0 && stage <= 2 ? stage : 0;
  
  return {
    name: divisionData.name,
    stage: divisionData.stages && divisionData.stages[validStage] ? divisionData.stages[validStage] : 'III',
    gradient: divisionData.gradient,
    color: divisionData.color
  };
}

// Get champion multiplier (for champion divisions beyond stage I)
export function getChampionMultiplier(userStats) {
  const { totalQuizzes = 0, averageScore = 0, streak = 0 } = userStats;
  const points = (totalQuizzes * averageScore / 100) + (streak * 2);
  
  if (points >= 800) return Math.floor((points - 500) / 300) + 1; // 2x, 3x, etc.
  return 1;
}