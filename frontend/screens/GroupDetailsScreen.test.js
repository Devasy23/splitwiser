import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import GroupDetailsScreen from './GroupDetailsScreen';
import { AuthContext } from '../context/AuthContext';
import { getGroupExpenses, getGroupMembers, getOptimizedSettlements } from '../api/groups';

// Mock the API functions
jest.mock('../api/groups', () => ({
  getGroupExpenses: jest.fn(),
  getGroupMembers: jest.fn(),
  getOptimizedSettlements: jest.fn(),
}));

// Mock React Native components and modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Mock react-native-paper components
jest.mock('react-native-paper', () => ({
  ActivityIndicator: ({ testID }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: testID || 'activity-indicator' });
  },
  Card: Object.assign(
    ({ children, style }) => {
      const React = require('react');
      const { View } = require('react-native');
      return React.createElement(View, { style, testID: 'card' }, children);
    },
    {
      Content: ({ children }) => {
        const React = require('react');
        const { View } = require('react-native');
        return React.createElement(View, { testID: 'card-content' }, children);
      },
    }
  ),
  FAB: ({ onPress, testID, icon }) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      { onPress, testID: testID || 'fab' },
      React.createElement(Text, null, icon)
    );
  },
  Paragraph: ({ children, style }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { style }, children);
  },
  Title: ({ children, style }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { style }, children);
  },
}));

// Mock navigation
const mockNavigation = {
  setOptions: jest.fn(),
  navigate: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    groupId: 'group123',
    groupName: 'Test Group',
    groupIcon: 'group-icon',
  },
};

// Mock AuthContext values
const mockAuthContext = {
  token: 'test-token',
  user: {
    _id: 'user123',
    name: 'Test User',
  },
};

// Helper function to render component with context
const renderWithContext = (authContext = mockAuthContext) => {
  return render(
    <AuthContext.Provider value={authContext}>
      <GroupDetailsScreen route={mockRoute} navigation={mockNavigation} />
    </AuthContext.Provider>
  );
};

describe('GroupDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert.mockClear();
  });

  describe('Initial Loading and Setup', () => {
    it('should set navigation title on mount', () => {
      renderWithContext();
      expect(mockNavigation.setOptions).toHaveBeenCalledWith({
        title: 'Test Group',
      });
    });

    it('should show loading indicator initially', () => {
      // Mock all API calls to never resolve to keep loading state
      getGroupMembers.mockImplementation(() => new Promise(() => {}));
      getGroupExpenses.mockImplementation(() => new Promise(() => {}));
      getOptimizedSettlements.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = renderWithContext();
      expect(getByTestId('activity-indicator')).toBeTruthy();
    });

    it('should not fetch data when token is missing', () => {
      renderWithContext({ ...mockAuthContext, token: null });
      expect(getGroupExpenses).not.toHaveBeenCalled();
      expect(getGroupMembers).not.toHaveBeenCalled();
      expect(getOptimizedSettlements).not.toHaveBeenCalled();
    });

    it('should not fetch data when groupId is missing', () => {
      const routeWithoutGroupId = {
        params: {
          groupId: null,
          groupName: 'Test Group',
          groupIcon: 'group-icon',
        },
      };
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <GroupDetailsScreen route={routeWithoutGroupId} navigation={mockNavigation} />
        </AuthContext.Provider>
      );
      expect(getGroupExpenses).not.toHaveBeenCalled();
    });
  });

  describe('Data Fetching', () => {
    const mockMembers = [
      { userId: 'user123', user: { name: 'Test User' } },
      { userId: 'user456', user: { name: 'Jane Doe' } },
    ];

    const mockExpenses = [
      {
        _id: 'expense1',
        description: 'Lunch',
        amount: 100,
        paidBy: 'user123',
        createdBy: 'user123',
        splits: [
          { userId: 'user123', amount: 50 },
          { userId: 'user456', amount: 50 },
        ],
      },
    ];

    const mockSettlements = [
      {
        fromUserId: 'user456',
        toUserId: 'user123',
        amount: 25,
      },
    ];

    it('should fetch all data successfully', async () => {
      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: mockSettlements } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getGroupMembers).toHaveBeenCalledWith('test-token', 'group123');
        expect(getGroupExpenses).toHaveBeenCalledWith('test-token', 'group123');
        expect(getOptimizedSettlements).toHaveBeenCalledWith('test-token', 'group123');
      });

      await waitFor(() => {
        expect(getByText('Settlement Summary')).toBeTruthy();
        expect(getByText('Members')).toBeTruthy();
        expect(getByText('Expenses')).toBeTruthy();
      });
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('Network error');
      getGroupMembers.mockRejectedValue(error);
      getGroupExpenses.mockRejectedValue(error);
      getOptimizedSettlements.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderWithContext();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to fetch group details.');
      });

      consoleSpy.mockRestore();
    });

    it('should handle missing settlements data', async () => {
      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });
      getOptimizedSettlements.mockResolvedValue({ data: {} });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('✓ You are all settled up!')).toBeTruthy();
      });
    });

    it('should fetch data when both token and groupId are present', async () => {
      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: mockSettlements } });

      renderWithContext();

      await waitFor(() => {
        expect(getGroupMembers).toHaveBeenCalledWith('test-token', 'group123');
        expect(getGroupExpenses).toHaveBeenCalledWith('test-token', 'group123');
        expect(getOptimizedSettlements).toHaveBeenCalledWith('test-token', 'group123');
      });
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency with INR symbol and two decimal places', async () => {
      const mockMembers = [{ userId: 'user123', user: { name: 'Test User' } }];
      const mockExpenses = [{
        _id: 'expense1',
        description: 'Test Expense',
        amount: 123.45,
        paidBy: 'user123',
        splits: [{ userId: 'user123', amount: 123.45 }],
      }];

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Amount: ₹123.45')).toBeTruthy();
      });
    });

    it('should format whole numbers with .00', async () => {
      const mockMembers = [{ userId: 'user123', user: { name: 'Test User' } }];
      const mockExpenses = [{
        _id: 'expense1',
        description: 'Test Expense',
        amount: 100,
        paidBy: 'user123',
        splits: [{ userId: 'user123', amount: 100 }],
      }];

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: mockExpenses } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Amount: ₹100.00')).toBeTruthy();
      });
    });
  });

  describe('Member Name Resolution', () => {
    const mockMembers = [
      { userId: 'user123', user: { name: 'Test User' } },
      { userId: 'user456', user: { name: 'Jane Doe' } },
    ];

    it('should resolve member names correctly', async () => {
      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('• Test User')).toBeTruthy();
        expect(getByText('• Jane Doe')).toBeTruthy();
      });
    });

    it('should handle unknown users gracefully', async () => {
      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({
        data: {
          expenses: [{
            _id: 'expense1',
            description: 'Test Expense',
            amount: 100,
            paidBy: 'unknown-user',
            splits: [{ userId: 'user123', amount: 100 }],
          }],
        },
      });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Paid by: Unknown')).toBeTruthy();
      });
    });

    it('should return "Unknown" for non-existent user IDs in settlements', async () => {
      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({
        data: {
          optimizedSettlements: [{
            fromUserId: 'user123',
            toUserId: 'nonexistent-user',
            amount: 50,
          }],
        },
      });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Unknown')).toBeTruthy();
      });
    });
  });

  describe('Expense Rendering', () => {
    const mockMembers = [
      { userId: 'user123', user: { name: 'Test User' } },
      { userId: 'user456', user: { name: 'Jane Doe' } },
    ];

    it('should render expense when user is owed money', async () => {
      const expense = {
        _id: 'expense1',
        description: 'Lunch',
        amount: 100,
        paidBy: 'user123',
        splits: [
          { userId: 'user123', amount: 40 },
          { userId: 'user456', amount: 60 },
        ],
      };

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [expense] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Lunch')).toBeTruthy();
        expect(getByText('Amount: ₹100.00')).toBeTruthy();
        expect(getByText('Paid by: Test User')).toBeTruthy();
        expect(getByText('You are owed ₹60.00')).toBeTruthy();
      });
    });

    it('should render expense when user owes money', async () => {
      const expense = {
        _id: 'expense1',
        description: 'Dinner',
        amount: 100,
        paidBy: 'user456',
        splits: [
          { userId: 'user123', amount: 60 },
          { userId: 'user456', amount: 40 },
        ],
      };

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [expense] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Dinner')).toBeTruthy();
        expect(getByText('You borrowed ₹60.00')).toBeTruthy();
      });
    });

    it('should render expense when user is settled', async () => {
      const expense = {
        _id: 'expense1',
        description: 'Coffee',
        amount: 100,
        paidBy: 'user123',
        splits: [
          { userId: 'user123', amount: 100 },
        ],
      };

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [expense] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Coffee')).toBeTruthy();
        expect(getByText('You are settled for this expense.')).toBeTruthy();
      });
    });

    it('should handle expenses with missing splits', async () => {
      const expense = {
        _id: 'expense1',
        description: 'Test Expense',
        amount: 100,
        paidBy: 'user456',
        splits: [],
      };

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [expense] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Test Expense')).toBeTruthy();
        expect(getByText('You borrowed ₹0.00')).toBeTruthy();
      });
    });

    it('should use createdBy when paidBy is missing', async () => {
      const expense = {
        _id: 'expense1',
        description: 'Test Expense',
        amount: 100,
        createdBy: 'user456',
        splits: [{ userId: 'user123', amount: 50 }],
      };

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [expense] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Paid by: Jane Doe')).toBeTruthy();
      });
    });

    it('should handle expenses with null splits array', async () => {
      const expense = {
        _id: 'expense1',
        description: 'Test Expense',
        amount: 100,
        paidBy: 'user456',
        splits: null,
      };

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [expense] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Test Expense')).toBeTruthy();
        // Should not crash and should show some default behavior
      });
    });
  });

  describe('Settlement Summary', () => {
    const mockMembers = [
      { userId: 'user123', user: { name: 'Test User' } },
      { userId: 'user456', user: { name: 'Jane Doe' } },
      { userId: 'user789', user: { name: 'Bob Smith' } },
    ];

    it('should show settled message when no settlements exist', async () => {
      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('✓ You are all settled up!')).toBeTruthy();
      });
    });

    it('should show amounts user owes', async () => {
      const settlements = [
        { fromUserId: 'user123', toUserId: 'user456', amount: 50 },
        { fromUserId: 'user123', toUserId: 'user789', amount: 30 },
      ];

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: settlements } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('You need to pay: ₹80.00')).toBeTruthy();
        expect(getByText('Jane Doe')).toBeTruthy();
        expect(getByText('Bob Smith')).toBeTruthy();
        expect(getByText('₹50.00')).toBeTruthy();
        expect(getByText('₹30.00')).toBeTruthy();
      });
    });

    it('should show amounts user will receive', async () => {
      const settlements = [
        { fromUserId: 'user456', toUserId: 'user123', amount: 40 },
        { fromUserId: 'user789', toUserId: 'user123', amount: 20 },
      ];

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: settlements } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('You will receive: ₹60.00')).toBeTruthy();
        expect(getByText('Jane Doe')).toBeTruthy();
        expect(getByText('Bob Smith')).toBeTruthy();
      });
    });

    it('should show both owing and receiving sections', async () => {
      const settlements = [
        { fromUserId: 'user123', toUserId: 'user456', amount: 25 },
        { fromUserId: 'user789', toUserId: 'user123', amount: 35 },
      ];

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: settlements } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('You need to pay: ₹25.00')).toBeTruthy();
        expect(getByText('You will receive: ₹35.00')).toBeTruthy();
      });
    });

    it('should handle settlements with unknown users', async () => {
      const settlements = [
        { fromUserId: 'user123', toUserId: 'unknown-user', amount: 25 },
      ];

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: settlements } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Unknown')).toBeTruthy();
      });
    });

    it('should calculate totals correctly for complex settlements', async () => {
      const settlements = [
        { fromUserId: 'user123', toUserId: 'user456', amount: 25.50 },
        { fromUserId: 'user123', toUserId: 'user789', amount: 30.75 },
        { fromUserId: 'user456', toUserId: 'user123', amount: 15.25 },
      ];

      getGroupMembers.mockResolvedValue({ data: mockMembers });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: settlements } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('You need to pay: ₹56.25')).toBeTruthy(); // 25.50 + 30.75
        expect(getByText('You will receive: ₹15.25')).toBeTruthy();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty expenses message', async () => {
      getGroupMembers.mockResolvedValue({ data: [] });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('No expenses recorded yet.')).toBeTruthy();
      });
    });

    it('should show members section even when empty', async () => {
      getGroupMembers.mockResolvedValue({ data: [] });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Members')).toBeTruthy();
      });
    });

    it('should handle empty API responses gracefully', async () => {
      getGroupMembers.mockResolvedValue({ data: [] });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Settlement Summary')).toBeTruthy();
        expect(getByText('Members')).toBeTruthy();
        expect(getByText('Expenses')).toBeTruthy();
        expect(getByText('✓ You are all settled up!')).toBeTruthy();
      });
    });
  });

  describe('FAB Navigation', () => {
    it('should navigate to AddExpense screen when FAB is pressed', async () => {
      getGroupMembers.mockResolvedValue({ data: [] });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByTestId } = renderWithContext();

      await waitFor(() => {
        const fab = getByTestId('fab');
        fireEvent.press(fab);
        expect(mockNavigation.navigate).toHaveBeenCalledWith('AddExpense', {
          groupId: 'group123',
        });
      });
    });

    it('should pass correct groupId to AddExpense screen', async () => {
      const customRoute = {
        params: {
          groupId: 'custom-group-456',
          groupName: 'Custom Group',
          groupIcon: 'custom-icon',
        },
      };

      getGroupMembers.mockResolvedValue({ data: [] });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByTestId } = render(
        <AuthContext.Provider value={mockAuthContext}>
          <GroupDetailsScreen route={customRoute} navigation={mockNavigation} />
        </AuthContext.Provider>
      );

      await waitFor(() => {
        const fab = getByTestId('fab');
        fireEvent.press(fab);
        expect(mockNavigation.navigate).toHaveBeenCalledWith('AddExpense', {
          groupId: 'custom-group-456',
        });
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined values in expenses', async () => {
      const expenseWithNulls = {
        _id: 'expense1',
        description: null,
        amount: null,
        paidBy: null,
        createdBy: null,
        splits: null,
      };

      getGroupMembers.mockResolvedValue({ data: [] });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [expenseWithNulls] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      // Should not crash when rendering
      expect(() => renderWithContext()).not.toThrow();
    });

    it('should handle malformed API responses', async () => {
      getGroupMembers.mockResolvedValue({ data: null });
      getGroupExpenses.mockResolvedValue({ data: null });
      getOptimizedSettlements.mockResolvedValue({ data: null });

      // Should not crash when handling null responses
      expect(() => renderWithContext()).not.toThrow();
    });

    it('should handle very large numbers in currency formatting', async () => {
      const expenseWithLargeAmount = {
        _id: 'expense1',
        description: 'Expensive Item',
        amount: 999999999.99,
        paidBy: 'user123',
        splits: [{ userId: 'user123', amount: 999999999.99 }],
      };

      getGroupMembers.mockResolvedValue({ data: [{ userId: 'user123', user: { name: 'Test User' } }] });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [expenseWithLargeAmount] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Amount: ₹999999999.99')).toBeTruthy();
      });
    });

    it('should handle zero amounts correctly', async () => {
      const zeroAmountExpense = {
        _id: 'expense1',
        description: 'Free Item',
        amount: 0,
        paidBy: 'user123',
        splits: [{ userId: 'user123', amount: 0 }],
      };

      getGroupMembers.mockResolvedValue({ data: [{ userId: 'user123', user: { name: 'Test User' } }] });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [zeroAmountExpense] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Amount: ₹0.00')).toBeTruthy();
        expect(getByText('You are settled for this expense.')).toBeTruthy();
      });
    });

    it('should handle negative amounts gracefully', async () => {
      const negativeAmountExpense = {
        _id: 'expense1',
        description: 'Refund',
        amount: -50,
        paidBy: 'user123',
        splits: [{ userId: 'user123', amount: -50 }],
      };

      getGroupMembers.mockResolvedValue({ data: [{ userId: 'user123', user: { name: 'Test User' } }] });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [negativeAmountExpense] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Amount: ₹-50.00')).toBeTruthy();
      });
    });

    it('should handle missing user in auth context', () => {
      const contextWithoutUser = {
        token: 'test-token',
        user: null,
      };

      expect(() => renderWithContext(contextWithoutUser)).not.toThrow();
    });

    it('should handle API responses with missing data fields', async () => {
      getGroupMembers.mockResolvedValue({});
      getGroupExpenses.mockResolvedValue({});
      getOptimizedSettlements.mockResolvedValue({});

      expect(() => renderWithContext()).not.toThrow();
    });
  });

  describe('Component State Management', () => {
    it('should update loading state correctly during data fetch', async () => {
      let resolvePromises;
      const promises = new Promise(resolve => { resolvePromises = resolve; });
      
      getGroupMembers.mockImplementation(() => promises);
      getGroupExpenses.mockImplementation(() => promises);
      getOptimizedSettlements.mockImplementation(() => promises);

      const { getByTestId, queryByTestId } = renderWithContext();

      // Should show loading initially
      expect(getByTestId('activity-indicator')).toBeTruthy();

      // Resolve promises
      act(() => {
        resolvePromises({ data: [] });
      });

      await waitFor(() => {
        expect(queryByTestId('activity-indicator')).toBeNull();
      });
    });

    it('should maintain state consistency after multiple re-renders', async () => {
      const mockData = {
        members: [{ userId: 'user123', user: { name: 'Test User' } }],
        expenses: [],
        settlements: [],
      };

      getGroupMembers.mockResolvedValue({ data: mockData.members });
      getGroupExpenses.mockResolvedValue({ data: { expenses: mockData.expenses } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: mockData.settlements } });

      const { rerender, getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('• Test User')).toBeTruthy();
      });

      // Re-render with same props
      rerender(
        <AuthContext.Provider value={mockAuthContext}>
          <GroupDetailsScreen route={mockRoute} navigation={mockNavigation} />
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(getByText('• Test User')).toBeTruthy();
      });
    });

    it('should handle concurrent API calls correctly', async () => {
      let resolveMembers, resolveExpenses, resolveSettlements;
      
      getGroupMembers.mockImplementation(() => new Promise(resolve => { resolveMembers = resolve; }));
      getGroupExpenses.mockImplementation(() => new Promise(resolve => { resolveExpenses = resolve; }));
      getOptimizedSettlements.mockImplementation(() => new Promise(resolve => { resolveSettlements = resolve; }));

      renderWithContext();

      // Resolve in different order
      act(() => {
        resolveExpenses({ data: { expenses: [] } });
        resolveSettlements({ data: { optimizedSettlements: [] } });
        resolveMembers({ data: [] });
      });

      await waitFor(() => {
        expect(getGroupMembers).toHaveBeenCalled();
        expect(getGroupExpenses).toHaveBeenCalled();
        expect(getOptimizedSettlements).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility and Performance', () => {
    it('should have proper key extractors for FlatList', async () => {
      const expenses = [
        { _id: 'expense1', description: 'Test 1', amount: 100, paidBy: 'user123', splits: [] },
        { _id: 'expense2', description: 'Test 2', amount: 200, paidBy: 'user123', splits: [] },
      ];

      getGroupMembers.mockResolvedValue({ data: [{ userId: 'user123', user: { name: 'Test User' } }] });
      getGroupExpenses.mockResolvedValue({ data: { expenses } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Test 1')).toBeTruthy();
        expect(getByText('Test 2')).toBeTruthy();
      });
    });

    it('should handle rapid state updates without race conditions', async () => {
      let callCount = 0;
      getGroupMembers.mockImplementation(() => {
        callCount++;
        return Promise.resolve({ data: [{ userId: `user${callCount}`, user: { name: `User ${callCount}` } }] });
      });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { rerender } = renderWithContext();

      // Trigger multiple re-renders quickly
      for (let i = 0; i < 3; i++) {
        rerender(
          <AuthContext.Provider value={{ ...mockAuthContext, token: `token-${i}` }}>
            <GroupDetailsScreen route={mockRoute} navigation={mockNavigation} />
          </AuthContext.Provider>
        );
      }

      await waitFor(() => {
        // Should eventually settle without crashing
        expect(getGroupMembers).toHaveBeenCalled();
      });
    });

    it('should render cards with proper structure', async () => {
      getGroupMembers.mockResolvedValue({ data: [] });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getAllByTestId } = renderWithContext();

      await waitFor(() => {
        const cards = getAllByTestId('card');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Calculation Logic', () => {
    it('should calculate net balance correctly for user who paid', async () => {
      const expense = {
        _id: 'expense1',
        description: 'Shared Lunch',
        amount: 120,
        paidBy: 'user123', // Current user paid
        splits: [
          { userId: 'user123', amount: 60 }, // Current user's share
          { userId: 'user456', amount: 60 }, // Other user's share
        ],
      };

      getGroupMembers.mockResolvedValue({ 
        data: [
          { userId: 'user123', user: { name: 'Test User' } },
          { userId: 'user456', user: { name: 'Jane Doe' } }
        ] 
      });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [expense] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        // Net = 120 (paid) - 60 (share) = 60 (owed)
        expect(getByText('You are owed ₹60.00')).toBeTruthy();
      });
    });

    it('should calculate net balance correctly for user who did not pay', async () => {
      const expense = {
        _id: 'expense1',
        description: 'Shared Dinner',
        amount: 150,
        paidBy: 'user456', // Other user paid
        splits: [
          { userId: 'user123', amount: 75 }, // Current user's share
          { userId: 'user456', amount: 75 }, // Other user's share
        ],
      };

      getGroupMembers.mockResolvedValue({ 
        data: [
          { userId: 'user123', user: { name: 'Test User' } },
          { userId: 'user456', user: { name: 'Jane Doe' } }
        ] 
      });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [expense] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        // Net = 0 (paid) - 75 (share) = -75 (borrowed)
        expect(getByText('You borrowed ₹75.00')).toBeTruthy();
      });
    });

    it('should handle unequal splits correctly', async () => {
      const expense = {
        _id: 'expense1',
        description: 'Unequal Split',
        amount: 100,
        paidBy: 'user123',
        splits: [
          { userId: 'user123', amount: 30 }, // Current user's smaller share
          { userId: 'user456', amount: 70 }, // Other user's larger share
        ],
      };

      getGroupMembers.mockResolvedValue({ 
        data: [
          { userId: 'user123', user: { name: 'Test User' } },
          { userId: 'user456', user: { name: 'Jane Doe' } }
        ] 
      });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [expense] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithContext();

      await waitFor(() => {
        // Net = 100 (paid) - 30 (share) = 70 (owed)
        expect(getByText('You are owed ₹70.00')).toBeTruthy();
      });
    });
  });

  describe('useEffect Dependencies', () => {
    it('should refetch data when token changes', async () => {
      getGroupMembers.mockResolvedValue({ data: [] });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { rerender } = renderWithContext();

      await waitFor(() => {
        expect(getGroupMembers).toHaveBeenCalledTimes(1);
      });

      // Change token
      rerender(
        <AuthContext.Provider value={{ ...mockAuthContext, token: 'new-token' }}>
          <GroupDetailsScreen route={mockRoute} navigation={mockNavigation} />
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(getGroupMembers).toHaveBeenCalledWith('new-token', 'group123');
        expect(getGroupMembers).toHaveBeenCalledTimes(2);
      });
    });

    it('should refetch data when groupId changes', async () => {
      getGroupMembers.mockResolvedValue({ data: [] });
      getGroupExpenses.mockResolvedValue({ data: { expenses: [] } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { rerender } = renderWithContext();

      await waitFor(() => {
        expect(getGroupMembers).toHaveBeenCalledTimes(1);
      });

      // Change groupId
      const newRoute = {
        params: {
          groupId: 'new-group-456',
          groupName: 'New Group',
          groupIcon: 'new-icon',
        },
      };

      rerender(
        <AuthContext.Provider value={mockAuthContext}>
          <GroupDetailsScreen route={newRoute} navigation={mockNavigation} />
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(getGroupMembers).toHaveBeenCalledWith('test-token', 'new-group-456');
        expect(getGroupMembers).toHaveBeenCalledTimes(2);
      });
    });
  });
});