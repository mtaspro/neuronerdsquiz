// Utility function to get the correct avatar URL
export const getAvatarUrl = (avatar) => {
  if (!avatar) {
    return 'https://ui-avatars.com/api/?name=User&background=random';
  }
  
  // If it's already a full URL (external avatar), return as is
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // If it's an uploaded file (starts with /uploads/), prepend the API URL
  if (avatar.startsWith('/uploads/')) {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    return `${apiUrl}${avatar}`;
  }
  
  // Fallback for any other case
  return avatar;
};

// Function to check if an avatar is a custom uploaded image
export const isCustomAvatar = (avatar) => {
  return avatar && avatar.startsWith('/uploads/');
};

// Function to get a fallback avatar if the main one fails to load
export const getFallbackAvatar = (username = 'User') => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
};