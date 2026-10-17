/**
 * Backend text validation utilities for character and word constraints.
 */

function countWords(str) {
  if (!str || typeof str !== 'string') return 0;
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function countChars(str) {
  if (!str || typeof str !== 'string') return 0;
  return str.length;
}

function validateField(value, {
  fieldName = 'Field',
  required = false,
  minChars,
  maxChars,
  minWords,
  maxWords,
} = {}) {
  const str = (value ?? '').toString();
  const trimmed = str.trim();
  const charLen = str.length;
  const wordLen = countWords(str);

  if (required && !trimmed) {
    return `${fieldName} is required.`;
  }

  if (trimmed) {
    if (minChars && charLen < minChars) {
      return `${fieldName} must be at least ${minChars} characters (currently ${charLen}).`;
    }
    if (maxChars && charLen > maxChars) {
      return `${fieldName} cannot exceed ${maxChars} characters (currently ${charLen}).`;
    }
    if (minWords && wordLen < minWords) {
      return `${fieldName} must be at least ${minWords} words (currently ${wordLen}).`;
    }
    if (maxWords && wordLen > maxWords) {
      return `${fieldName} cannot exceed ${maxWords} words (currently ${wordLen}).`;
    }
  }

  return null;
}

function validateFields(fieldList) {
  const list = Array.isArray(fieldList) ? fieldList : Object.values(fieldList);
  for (const item of list) {
    const err = validateField(item.value, item);
    if (err) return err;
  }
  return null;
}

module.exports = {
  countWords,
  countChars,
  validateField,
  validateFields,
};
