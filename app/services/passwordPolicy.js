// Password policy service
const passwordStrength = require('zxcvbn');

/**
 * Validates a password against the password policy
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with isValid flag and message
 */
function validatePassword(password) {
  // Check if password is at least 8 characters
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
      score: 0
    };
  }

  // Check if password contains uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
      score: 0
    };
  }

  // Check if password contains lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
      score: 0
    };
  }

  // Check if password contains a number
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
      score: 0
    };
  }

  // Check if password contains a special character
  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character',
      score: 0
    };
  }

  // Check password strength using zxcvbn
  const result = passwordStrength(password);
  
  // Score 0-1: Weak, 2: Fair, 3: Good, 4: Strong
  if (result.score < 3) {
    return {
      isValid: false,
      message: 'Password is too weak. Please choose a stronger password.',
      score: result.score,
      feedback: result.feedback
    };
  }

  return {
    isValid: true,
    message: 'Password meets all requirements',
    score: result.score
  };
}

/**
 * Gets a password strength message based on the score
 * @param {number} score - Password strength score (0-4)
 * @returns {string} - Strength message
 */
function getStrengthMessage(score) {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Unknown';
  }
}

module.exports = {
  validatePassword,
  getStrengthMessage
};
