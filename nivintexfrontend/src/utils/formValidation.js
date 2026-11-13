/**
 * Shared client-side form validation & sanitization helpers.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const INDIAN_PINCODE_REGEX = /^[1-9]\d{5}$/;

/**
 * Strip non-digits; if starts with '91' and length > 10 trims leading '91'; caps at 10 digits.
 */
export function sanitizeIndianPhone(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 10);
}

/**
 * Trim and validate email against strict RFC-style regex.
 * Returns '' if valid or a clear error string.
 */
export function validateEmail(email) {
  const trimmed = String(email ?? '').trim();
  if (!trimmed) {
    return 'Please enter your email address.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address.';
  }
  return '';
}

/**
 * Strip formatting and validate 10-digit Indian mobile number starting with 6-9.
 * Returns '' if valid or a clear error string.
 */
export function validateIndianPhone(phone, { required = true } = {}) {
  let digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) {
    return required ? 'Please enter your mobile number.' : '';
  }
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }
  if (!INDIAN_PHONE_REGEX.test(digits)) {
    return 'Enter a valid 10-digit Indian mobile number starting with 6-9.';
  }
  return '';
}

/**
 * Require trimmed name length >= 2.
 * Returns '' if valid or a clear error string.
 */
export function validateName(name, label = 'Name') {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    return `Please enter your ${label.toLowerCase()}.`;
  }
  if (trimmed.length < 2) {
    return `${label} must be at least 2 characters.`;
  }
  return '';
}

/**
 * Validate password length and optional strength (letters + numbers).
 * Returns '' if valid or a clear error string.
 */
export function validatePassword(password, { minLength = 6, requireStrong = false } = {}) {
  const value = String(password ?? '');
  if (!value) {
    return 'Please enter a password.';
  }
  if (value.length < minLength) {
    return `Password must be at least ${minLength} characters long.`;
  }
  if (requireStrong && (!/[A-Za-z]/.test(value) || !/\d/.test(value))) {
    return 'Password must include both letters and numbers.';
  }
  return '';
}

/**
 * Validate 6-digit Indian pincode (/^[1-9]\d{5}$/).
 * Returns '' if valid or a clear error string.
 */
export function validatePincode(zip) {
  const trimmed = String(zip ?? '').trim();
  if (!trimmed) {
    return 'Please enter your 6-digit pincode.';
  }
  if (!INDIAN_PINCODE_REGEX.test(trimmed)) {
    return 'Enter a valid 6-digit Indian pincode.';
  }
  return '';
}
