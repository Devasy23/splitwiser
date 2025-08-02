// Email validation utility
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Phone number validation (optional field)
export const validatePhone = (phone: string): boolean => {
  if (!phone.trim()) return true; // Optional field
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Password validation
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

// Name validation
export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

// Confirm password validation
export const validateConfirmPassword = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};
