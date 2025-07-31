// Form validation utilities

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

// Password validation
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 6,
    requireUppercase = false,
    requireLowercase = false,
    requireNumbers = false,
    requireSpecialChars = false
  } = options;

  if (!password) return 'Password is required';
  if (password.length < minLength) return `Password must be at least ${minLength} characters long`;
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  
  return null;
};

// Username validation
export const validateUsername = (username) => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters long';
  if (username.length > 20) return 'Username must be less than 20 characters';
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, underscores, and hyphens';
  }
  return null;
};

// Confirm password validation
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

// Quiz question validation
export const validateQuizQuestion = (question) => {
  const errors = {};

  if (!question.question?.trim()) {
    errors.question = 'Question text is required';
  }

  if (!question.options || question.options.length < 2) {
    errors.options = 'At least 2 options are required';
  } else {
    const validOptions = question.options.filter(opt => opt?.trim());
    if (validOptions.length < 2) {
      errors.options = 'At least 2 non-empty options are required';
    }
  }

  if (question.correctAnswer === undefined || question.correctAnswer === null || question.correctAnswer === '') {
    errors.correctAnswer = 'Correct answer is required';
  }

  if (!question.chapter?.trim()) {
    errors.chapter = 'Chapter is required';
  }

  if (!question.duration || question.duration < 10) {
    errors.duration = 'Duration must be at least 10 seconds';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Chapter validation
export const validateChapter = (chapter) => {
  const errors = {};

  if (!chapter.name?.trim()) {
    errors.name = 'Chapter name is required';
  } else if (chapter.name.length < 2) {
    errors.name = 'Chapter name must be at least 2 characters long';
  } else if (chapter.name.length > 50) {
    errors.name = 'Chapter name must be less than 50 characters';
  }

  if (chapter.description && chapter.description.length > 200) {
    errors.description = 'Description must be less than 200 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Score validation
export const validateScore = (score, totalQuestions) => {
  if (typeof score !== 'number' || score < 0) {
    return 'Score must be a non-negative number';
  }
  
  if (typeof totalQuestions !== 'number' || totalQuestions <= 0) {
    return 'Total questions must be a positive number';
  }
  
  if (score > totalQuestions) {
    return 'Score cannot be greater than total questions';
  }
  
  return null;
};

// Generic required field validation
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

// Numeric validation
export const validateNumber = (value, fieldName, options = {}) => {
  const { min, max, integer = false } = options;
  
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (integer && !Number.isInteger(num)) {
    return `${fieldName} must be a whole number`;
  }
  
  if (min !== undefined && num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  
  if (max !== undefined && num > max) {
    return `${fieldName} must be at most ${max}`;
  }
  
  return null;
};

// URL validation
export const validateUrl = (url, fieldName = 'URL') => {
  if (!url) return `${fieldName} is required`;
  
  try {
    new URL(url);
    return null;
  } catch {
    return `Please enter a valid ${fieldName.toLowerCase()}`;
  }
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = [],
    required = true
  } = options;

  if (!file) {
    return required ? 'File is required' : null;
  }

  if (file.size > maxSize) {
    return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return `File type must be one of: ${allowedTypes.join(', ')}`;
  }

  return null;
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate form with multiple fields
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];
    
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  validateEmail,
  validatePassword,
  validateUsername,
  validateConfirmPassword,
  validateQuizQuestion,
  validateChapter,
  validateScore,
  validateRequired,
  validateNumber,
  validateUrl,
  validateFile,
  sanitizeInput,
  validateForm
};