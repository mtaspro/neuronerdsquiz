// Theme management utilities

export const themes = {
  'tech-bg': {
    name: 'Tech Matrix',
    description: 'Digital matrix with flowing code',
    gradient: 'from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900',
    primaryColor: 'blue',
    accentColor: 'purple'
  },
  'tech-bg1': {
    name: 'Cyber Circuit',
    description: 'Futuristic circuit board patterns',
    gradient: 'from-green-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-green-900 dark:to-teal-900',
    primaryColor: 'green',
    accentColor: 'teal'
  },
  'tech-bg2': {
    name: 'Neural Network',
    description: 'Connected nodes and pathways',
    gradient: 'from-purple-50 via-pink-50 to-rose-50 dark:from-gray-900 dark:via-purple-900 dark:to-pink-900',
    primaryColor: 'purple',
    accentColor: 'pink'
  },
  'tech-bg3': {
    name: 'Data Stream',
    description: 'Flowing data visualization',
    gradient: 'from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900',
    primaryColor: 'orange',
    accentColor: 'red'
  },
  'tech-bg4': {
    name: 'Quantum Field',
    description: 'Particle physics simulation',
    gradient: 'from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-indigo-900 dark:to-blue-900',
    primaryColor: 'indigo',
    accentColor: 'blue'
  }
};

export const getTheme = (themeId) => {
  return themes[themeId] || themes['tech-bg'];
};

export const saveTheme = (themeId) => {
  localStorage.setItem('selectedTheme', themeId);
  
  // Dispatch custom event for theme change
  window.dispatchEvent(new CustomEvent('themeChanged', { 
    detail: { themeId, theme: getTheme(themeId) } 
  }));
};

export const loadTheme = () => {
  const savedTheme = localStorage.getItem('selectedTheme');
  return savedTheme && themes[savedTheme] ? savedTheme : 'tech-bg';
};

export const getThemeGradient = (themeId) => {
  return getTheme(themeId).gradient;
};

export const getThemeName = (themeId) => {
  return getTheme(themeId).name;
};

export const getAllThemes = () => {
  return Object.keys(themes).map(id => ({
    id,
    ...themes[id]
  }));
};