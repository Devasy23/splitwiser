/**
 * Utility functions for calculating friend balances across groups
 * Includes comprehensive null safety checks to prevent runtime errors
 * 
 * Note: Uses 'paidBy' field to determine who actually paid for an expense,
 * with fallback to 'createdBy' for backward compatibility.
 */

/**
 * Safely gets a value from an object with null/undefined protection
 * @param {Object} obj - The object to get value from
 * @param {string} path - Dot notation path (e.g., 'user.name')
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} The value at the path or defaultValue
 */
const safeGet = (obj, path, defaultValue = null) => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current !== null && current !== undefined ? current : defaultValue;
};

/**
 * Safely validates and extracts group details
 * @param {Object} group - Group object with details
 * @returns {Object|null} Validated group data or null if invalid
 */
const validateGroupData = (group) => {
  if (!group || typeof group !== 'object') return null;
  
  const details = safeGet(group, 'details');
  if (!Array.isArray(details) || details.length < 2) return null;
  
  const [membersResponse, expensesResponse] = details;
  
  // Validate members response
  const members = safeGet(membersResponse, 'data');
  if (!Array.isArray(members)) return null;
  
  // Validate expenses response
  const expenses = safeGet(expensesResponse, 'data.expenses');
  if (!Array.isArray(expenses)) return null;
  
  return {
    id: safeGet(group, 'id') || safeGet(group, '_id'),
    name: safeGet(group, 'name', 'Unknown Group'),
    members,
    expenses
  };
};

/**
 * Safely finds a member by userId
 * @param {Array} members - Array of member objects
 * @param {string} userId - User ID to find
 * @returns {string} Member name or 'Unknown'
 */
const getMemberName = (members, userId) => {
  if (!Array.isArray(members) || !userId) return 'Unknown';
  
  const member = members.find(m => safeGet(m, 'userId') === userId);
  return safeGet(member, 'user.name', 'Unknown');
};

/**
 * Processes a single expense and updates balances
 * @param {Object} expense - Expense object
 * @param {Object} balances - Current balances object
 * @param {Array} members - Group members
 * @param {Object} group - Group information
 * @param {string} currentUserId - Current user's ID
 */
const processExpense = (expense, balances, members, group, currentUserId) => {
  if (!expense || typeof expense !== 'object' || !currentUserId) return;
  
  const payerId = safeGet(expense, 'paidBy') || safeGet(expense, 'createdBy');
  const splits = safeGet(expense, 'splits');
  
  if (!payerId || !Array.isArray(splits)) return;
  
  const payerIsMe = payerId === currentUserId;
  
  splits.forEach(split => {
    if (!split || typeof split !== 'object') return;
    
    const memberId = safeGet(split, 'userId');
    const splitAmount = parseFloat(safeGet(split, 'amount', 0));
    
    if (!memberId || isNaN(splitAmount) || splitAmount <= 0) return;
    if (memberId === payerId) return; // Payer doesn't owe themselves
    
    const memberIsMe = memberId === currentUserId;
    
    // Initialize balance structure if needed
    const initializeBalance = (userId) => {
      if (!balances[userId]) {
        balances[userId] = {
          name: getMemberName(members, userId),
          netBalance: 0,
          groups: {}
        };
      }
      if (!balances[userId].groups[group.id]) {
        balances[userId].groups[group.id] = {
          name: group.name,
          balance: 0
        };
      }
    };
    
    if (payerIsMe && !memberIsMe) {
      // I paid, they owe me
      initializeBalance(memberId);
      balances[memberId].netBalance += splitAmount;
      balances[memberId].groups[group.id].balance += splitAmount;
    } else if (!payerIsMe && memberIsMe) {
      // They paid, I owe them
      initializeBalance(payerId);
      balances[payerId].netBalance -= splitAmount;
      balances[payerId].groups[group.id].balance -= splitAmount;
    }
  });
};

/**
 * Formats balance data for UI consumption
 * @param {Object} balances - Raw balances object
 * @returns {Array} Formatted friends array for UI
 */
const formatBalancesForUI = (balances) => {
  if (!balances || typeof balances !== 'object') return [];
  
  return Object.entries(balances).map(([id, data]) => {
    if (!data || typeof data !== 'object') return null;
    
    const groups = safeGet(data, 'groups', {});
    const formattedGroups = Object.entries(groups).map(([groupId, groupData]) => ({
      id: groupId,
      name: safeGet(groupData, 'name', 'Unknown Group'),
      balance: parseFloat(safeGet(groupData, 'balance', 0))
    })).filter(group => group.id && !isNaN(group.balance));
    
    return {
      id,
      name: safeGet(data, 'name', 'Unknown'),
      netBalance: parseFloat(safeGet(data, 'netBalance', 0)),
      groups: formattedGroups
    };
  }).filter(friend => friend !== null && friend.id);
};

/**
 * Main function to calculate friend balances from groups with details
 * @param {Array} groupsWithDetails - Array of groups with their details
 * @param {string} currentUserId - Current user's ID
 * @returns {Array} Formatted array of friends with balance information
 */
export const calculateFriendBalances = (groupsWithDetails, currentUserId) => {
  if (!Array.isArray(groupsWithDetails) || !currentUserId) {
    console.warn('Invalid input to calculateFriendBalances:', { groupsWithDetails, currentUserId });
    return [];
  }
  
  const balances = {};
  
  groupsWithDetails.forEach(group => {
    try {
      const validatedGroup = validateGroupData(group);
      if (!validatedGroup) {
        console.warn('Invalid group data, skipping:', group);
        return;
      }
      
      const { members, expenses } = validatedGroup;
      
      expenses.forEach(expense => {
        try {
          processExpense(expense, balances, members, validatedGroup, currentUserId);
        } catch (error) {
          console.error('Error processing expense:', error, expense);
        }
      });
    } catch (error) {
      console.error('Error processing group:', error, group);
    }
  });
  
  return formatBalancesForUI(balances);
};

export default {
  calculateFriendBalances,
  safeGet,
  validateGroupData,
  getMemberName
};
