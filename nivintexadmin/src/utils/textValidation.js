/**
 * Text validation utilities for character and word constraints.
 */

export const countWords = (text) => {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

export const countChars = (text) => {
  if (!text || typeof text !== 'string') return 0;
  return text.length;
};

export const isOverLimit = (value, { maxChars, maxWords } = {}) => {
  const str = (value ?? '').toString();
  const charCount = countChars(str);
  const wordCount = countWords(str);

  if (maxChars && charCount > maxChars) return true;
  if (maxWords && wordCount > maxWords) return true;
  return false;
};

export const validateText = (
  value,
  {
    fieldName = 'Field',
    required = false,
    minChars,
    maxChars,
    minWords,
    maxWords,
  } = {}
) => {
  const str = (value ?? '').toString();
  const trimmed = str.trim();
  const charCount = str.length;
  const wordCount = countWords(str);

  if (required && !trimmed) {
    return `${fieldName} is required.`;
  }

  if (trimmed) {
    if (minChars && charCount < minChars) {
      return `${fieldName} must be at least ${minChars} characters (currently ${charCount}).`;
    }
    if (maxChars && charCount > maxChars) {
      return `${fieldName} cannot exceed ${maxChars} characters (currently ${charCount}).`;
    }
    if (minWords && wordCount < minWords) {
      return `${fieldName} must be at least ${minWords} words (currently ${wordCount}).`;
    }
    if (maxWords && wordCount > maxWords) {
      return `${fieldName} cannot exceed ${maxWords} words (currently ${wordCount}).`;
    }
  }

  return null;
};

/**
 * Validates an array or dictionary of fields. Returns the first error message or null.
 * @param {Array<{ value: any, options: object }> | Record<string, { value: any, ...options }>} fields
 */
export const validateFields = (fields) => {
  const list = Array.isArray(fields) ? fields : Object.values(fields);
  for (const item of list) {
    const error = validateText(item.value, item);
    if (error) return error;
  }
  return null;
};
