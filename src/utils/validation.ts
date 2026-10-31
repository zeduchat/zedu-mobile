// One "@", no spaces. The dot in the domain is checked separately: a single regex like
// /^[^\s@]+@[^\s@]+\.[^\s@]+$/ backtracks quadratically on long malformed input (ReDoS).
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+$/;

export const isValidEmail = (email?: string | null) => {
  if (!email || !EMAIL_SHAPE.test(email)) {
    return false;
  }
  const domain = email.slice(email.indexOf('@') + 1);
  // Needs a dot with at least one character on each side.
  return domain.length > 2 && domain.slice(1, -1).includes('.');
};

export const validateSignup = (data: any) => {
  const { accountType, orgName, email, password, country } = data;

  // 2. Organization Specific Validations
  if (accountType === 'Organization') {
    if (!orgName || orgName.trim().length === 0) {
      return 'Organisation name is required';
    }
    if (!country) {
      return "Please select your organisation's country";
    }

    if (!isValidEmail(email)) {
      return 'Please enter a valid email address';
    }
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters';
    }
  } else {
    if (!isValidEmail(email)) {
      return 'Please enter a valid email address';
    }
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters';
    }
  }

  return null; // No errors
};
