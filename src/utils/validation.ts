export const validateSignup = (data: any) => {
  const { accountType, orgName, email, password, country } = data;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 2. Organization Specific Validations
  if (accountType === 'Organization') {
    if (!orgName || orgName.trim().length === 0) {
      return 'Organization name is required';
    }
    if (!country) {
      return "Please select your organization's country";
    }

    if (!email || !emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters';
    }
  } else {
    if (!email || !emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters';
    }
  }

  return null; // No errors
};
