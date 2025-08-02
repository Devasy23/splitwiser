/**
 * Utility functions for the Splitwiser app
 */

/**
 * Format currency amount with proper symbol and decimals
 */
export const formatCurrency = (amount: number, currency: string = '₹'): string => {
  return `${currency}${amount.toFixed(2)}`;
};

/**
 * Calculate user's net balance for an expense
 */
export const calculateUserBalance = (
  expense: {
    amount: number;
    createdBy: string;
    splits: Array<{ userId: string; amount: number }>;
  },
  userId: string
): number => {
  const userSplit = expense.splits.find(s => s.userId === userId);
  const userShare = userSplit ? userSplit.amount : 0;
  const paidByMe = expense.createdBy === userId;
  
  return paidByMe ? expense.amount - userShare : -userShare;
};

/**
 * Get balance text and color for display
 */
export const getBalanceInfo = (
  net: number,
  formatCurrency: (amount: number) => string
): { text: string; color: string } => {
  if (net > 0) {
    return {
      text: `You are owed ${formatCurrency(net)}`,
      color: '#2e7d32', // Green
    };
  } else if (net < 0) {
    return {
      text: `You borrowed ${formatCurrency(Math.abs(net))}`,
      color: '#d32f2f', // Red
    };
  } else {
    return {
      text: 'You are settled for this expense.',
      color: '#666666', // Gray
    };
  }
};

/**
 * Debounce function for input fields
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Generate a random color for avatars
 */
export const generateAvatarColor = (name: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Get initials from a name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (basic validation)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Today';
  } else if (diffDays === 2) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
