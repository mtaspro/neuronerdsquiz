import DOMPurify from 'dompurify';

// Configure DOMPurify for our use cases
const sanitizeConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span'],
  ALLOWED_ATTR: ['class'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false
};

// Sanitize user input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, sanitizeConfig);
};

// Sanitize HTML content (for rich text)
export const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return html;
  return DOMPurify.sanitize(html, {
    ...sanitizeConfig,
    ALLOWED_TAGS: [...sanitizeConfig.ALLOWED_TAGS, 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li']
  });
};

// Sanitize object properties recursively
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

export default { sanitizeInput, sanitizeHTML, sanitizeObject };