// Centralized currency formatting utility
// Future enhancement: make currency code/user preference dynamic (user.profile.currency)

const DEFAULT_CURRENCY_SYMBOL = "₹"; // INR default

export const getCurrencySymbol = () => DEFAULT_CURRENCY_SYMBOL;

export const formatCurrency = (amount) => {
  if (amount == null || isNaN(Number(amount)))
    return `${DEFAULT_CURRENCY_SYMBOL}0.00`;
  const num = Number(amount);
  if (!Number.isFinite(num)) {
    return `${DEFAULT_CURRENCY_SYMBOL}0.00`;
  }
  return `${DEFAULT_CURRENCY_SYMBOL}${num.toFixed(2)}`;
};

export default {
  getCurrencySymbol,
  formatCurrency,
};
