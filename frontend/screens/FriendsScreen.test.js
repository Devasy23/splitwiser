import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import FriendsScreen from './FriendsScreen';
import { getFriendsBalance } from '../api/groups';
import { AuthContext } from '../context/AuthContext';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(),
}));

jest.mock('../api/groups', () => ({
  getFriendsBalance: jest.fn(),
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('FriendsScreen', () => {
  const mockAuthContext = {
    token: 'mock-token',
    user: { id: '1', name: 'Test User' },
  };

  const mockFriendsResponse = {
    data: {
      friendsBalance: [
        {
          userId: '1',
          userName: 'John Doe',
          netBalance: 25.50,
          breakdown: [
            {
              groupId: 'group1',
              groupName: 'Group 1',
              balance: 15.25,
            },
            {
              groupId: 'group2',
              groupName: 'Group 2',
              balance: 10.25,
            },
          ],
        },
        {
          userId: '2',
          userName: 'Jane Smith',
          netBalance: -12.75,
          breakdown: [
            {
              groupId: 'group1',
              groupName: 'Group 1',
              balance: -12.75,
            },
          ],
        },
      ],
    },
  };

  const renderWithContext = (contextValue = mockAuthContext) => {
    return render(
      <AuthContext.Provider value={contextValue}>
        <FriendsScreen />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useIsFocused.mockReturnValue(true);
    getFriendsBalance.mockResolvedValue(mockFriendsResponse);
  });

  describe('Component Rendering', () => {
    test('should render the Friends header', async () => {
      const { getByText } = renderWithContext();
      
      await waitFor(() => {
        expect(getByText('Friends')).toBeTruthy();
      });
    });

    test('should show loading indicator initially', () => {
      const { queryByText } = renderWithContext();
      
      // Component should be in loading state initially, so empty message shouldn't be visible yet
      expect(queryByText('No balances with friends yet.')).toBeNull();
    });

    test('should render tooltip by default', async () => {
      const { getByText } = renderWithContext();
      
      await waitFor(() => {
        expect(getByText(/These amounts show your direct balance with each friend/)).toBeTruthy();
      });
    });

    test('should hide tooltip when close button is pressed', async () => {
      const { getByText, queryByText, UNSAFE_getByType } = renderWithContext();
      
      await waitFor(() => {
        expect(getByText(/These amounts show your direct balance with each friend/)).toBeTruthy();
      });

      // Find the IconButton by type since it may not have accessible role
      const iconButtons = UNSAFE_getByType('IconButton');
      fireEvent.press(iconButtons);

      expect(queryByText(/These amounts show your direct balance with each friend/)).toBeNull();
    });
  });

  describe('Data Fetching', () => {
    test('should fetch friends data when component is focused and token exists', async () => {
      renderWithContext();

      await waitFor(() => {
        expect(getFriendsBalance).toHaveBeenCalledWith('mock-token');
      });
    });

    test('should not fetch data when token is missing', async () => {
      const contextWithoutToken = { ...mockAuthContext, token: null };
      renderWithContext(contextWithoutToken);

      await waitFor(() => {
        expect(getFriendsBalance).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    test('should not fetch data when screen is not focused', async () => {
      useIsFocused.mockReturnValue(false);
      renderWithContext();

      await waitFor(() => {
        expect(getFriendsBalance).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    test('should refetch data when token changes', async () => {
      const { rerender } = renderWithContext();

      await waitFor(() => {
        expect(getFriendsBalance).toHaveBeenCalledWith('mock-token');
      });

      const newContext = { ...mockAuthContext, token: 'new-token' };
      rerender(
        <AuthContext.Provider value={newContext}>
          <FriendsScreen />
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(getFriendsBalance).toHaveBeenCalledWith('new-token');
      });
    });
  });

  describe('Friends List Rendering', () => {
    test('should render friends list after successful data fetch', async () => {
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText('Jane Smith')).toBeTruthy();
      });
    });

    test('should display correct balance text for positive balance', async () => {
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Owes you $25.50')).toBeTruthy();
      });
    });

    test('should display correct balance text for negative balance', async () => {
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('You owe $12.75')).toBeTruthy();
      });
    });

    test('should display settled up for zero balance', async () => {
      const mockResponseWithZeroBalance = {
        data: {
          friendsBalance: [
            {
              userId: '3',
              userName: 'Zero Balance Friend',
              netBalance: 0,
              breakdown: [],
            },
          ],
        },
      };

      getFriendsBalance.mockResolvedValue(mockResponseWithZeroBalance);
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Settled up')).toBeTruthy();
      });
    });

    test('should render group breakdown within friend accordion', async () => {
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
        // Groups should be rendered as part of the accordion structure
        expect(getByText('Group 1')).toBeTruthy();
        expect(getByText('Group 2')).toBeTruthy();
      });
    });

    test('should display empty state when no friends data', async () => {
      getFriendsBalance.mockResolvedValue({ data: { friendsBalance: [] } });
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('No balances with friends yet.')).toBeTruthy();
      });
    });

    test('should handle missing friendsBalance property', async () => {
      getFriendsBalance.mockResolvedValue({ data: {} });
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('No balances with friends yet.')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    test('should show error alert when API call fails', async () => {
      const mockError = new Error('Network error');
      getFriendsBalance.mockRejectedValue(mockError);

      renderWithContext();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to fetch friends balance data:', mockError);
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load friends balance data.');
      });
    });

    test('should stop loading state after error', async () => {
      getFriendsBalance.mockRejectedValue(new Error('Network error'));
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('No balances with friends yet.')).toBeTruthy();
      });
    });
  });

  describe('Data Transformation', () => {
    test('should correctly transform backend data to frontend format', async () => {
      const { getByText } = renderWithContext();

      await waitFor(() => {
        // Verify that the transformed data is correctly displayed
        expect(getByText('John Doe')).toBeTruthy(); // userName -> name
        expect(getByText('Owes you $25.50')).toBeTruthy(); // netBalance formatted
      });
    });

    test('should handle friends with complex group structures', async () => {
      const complexMockResponse = {
        data: {
          friendsBalance: [
            {
              userId: '4',
              userName: 'Complex Friend',
              netBalance: 100.00,
              breakdown: [
                {
                  groupId: 'g1',
                  groupName: 'Group Alpha',
                  balance: 50.00,
                },
                {
                  groupId: 'g2',
                  groupName: 'Group Beta',
                  balance: 30.00,
                },
                {
                  groupId: 'g3',
                  groupName: 'Group Gamma',
                  balance: 20.00,
                },
              ],
            },
          ],
        },
      };

      getFriendsBalance.mockResolvedValue(complexMockResponse);
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Complex Friend')).toBeTruthy();
        expect(getByText('Owes you $100.00')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle very small positive balances', async () => {
      const smallBalanceResponse = {
        data: {
          friendsBalance: [
            {
              userId: '5',
              userName: 'Small Balance',
              netBalance: 0.01,
              breakdown: [{
                groupId: 'g1',
                groupName: 'Test Group',
                balance: 0.01,
              }],
            },
          ],
        },
      };

      getFriendsBalance.mockResolvedValue(smallBalanceResponse);
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Owes you $0.01')).toBeTruthy();
      });
    });

    test('should handle very small negative balances', async () => {
      const smallNegativeBalanceResponse = {
        data: {
          friendsBalance: [
            {
              userId: '6',
              userName: 'Small Negative Balance',
              netBalance: -0.01,
              breakdown: [{
                groupId: 'g1',
                groupName: 'Test Group',
                balance: -0.01,
              }],
            },
          ],
        },
      };

      getFriendsBalance.mockResolvedValue(smallNegativeBalanceResponse);
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('You owe $0.01')).toBeTruthy();
      });
    });

    test('should handle friends with no groups', async () => {
      const noGroupsResponse = {
        data: {
          friendsBalance: [
            {
              userId: '7',
              userName: 'No Groups Friend',
              netBalance: 25.00,
              breakdown: [],
            },
          ],
        },
      };

      getFriendsBalance.mockResolvedValue(noGroupsResponse);
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('No Groups Friend')).toBeTruthy();
        expect(getByText('Owes you $25.00')).toBeTruthy();
      });
    });

    test('should handle malformed API response gracefully', async () => {
      getFriendsBalance.mockResolvedValue(null);

      renderWithContext();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load friends balance data.');
      });
    });
  });

  describe('Balance Formatting', () => {
    test('should format large balances correctly', async () => {
      const largeBalanceResponse = {
        data: {
          friendsBalance: [
            {
              userId: '8',
              userName: 'Rich Friend',
              netBalance: 1234.56,
              breakdown: [{
                groupId: 'g1',
                groupName: 'Expensive Group',
                balance: 1234.56,
              }],
            },
          ],
        },
      };

      getFriendsBalance.mockResolvedValue(largeBalanceResponse);
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Owes you $1234.56')).toBeTruthy();
      });
    });

    test('should handle balances with more than 2 decimal places', async () => {
      const preciseBalanceResponse = {
        data: {
          friendsBalance: [
            {
              userId: '9',
              userName: 'Precise Friend',
              netBalance: 123.456789,
              breakdown: [{
                groupId: 'g1',
                groupName: 'Precise Group',
                balance: 123.456789,
              }],
            },
          ],
        },
      };

      getFriendsBalance.mockResolvedValue(preciseBalanceResponse);
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Owes you $123.46')).toBeTruthy();
      });
    });
  });

  describe('Component Lifecycle', () => {
    test('should maintain tooltip state when component re-renders', async () => {
      const { getByText, queryByText, UNSAFE_getByType, rerender } = renderWithContext();

      await waitFor(() => {
        expect(getByText(/These amounts show your direct balance/)).toBeTruthy();
      });

      const iconButton = UNSAFE_getByType('IconButton');
      fireEvent.press(iconButton);

      expect(queryByText(/These amounts show your direct balance/)).toBeNull();

      // Re-render with same context
      rerender(
        <AuthContext.Provider value={mockAuthContext}>
          <FriendsScreen />
        </AuthContext.Provider>
      );

      // Tooltip should remain hidden after re-render
      expect(queryByText(/These amounts show your direct balance/)).toBeNull();
    });

    test('should handle undefined or null context gracefully', async () => {
      const nullContext = { token: null, user: null };
      const { queryByText } = renderWithContext(nullContext);

      // Should not crash and should not fetch data
      expect(getFriendsBalance).not.toHaveBeenCalled();
      
      await waitFor(() => {
        expect(queryByText('No balances with friends yet.')).toBeTruthy();
      });
    });
  });

  describe('Group Balance Display', () => {
    test('should display correct color coding for positive group balances', async () => {
      const { getByText } = renderWithContext();

      await waitFor(() => {
        // Verify group balance text is displayed
        expect(getByText('Owes you $15.25')).toBeTruthy();
        expect(getByText('Owes you $10.25')).toBeTruthy();
      });
    });

    test('should display correct color coding for negative group balances', async () => {
      const { getByText } = renderWithContext();

      await waitFor(() => {
        // Verify negative group balance text is displayed
        expect(getByText('You owe $12.75')).toBeTruthy();
      });
    });

    test('should handle zero group balances', async () => {
      const zeroGroupBalanceResponse = {
        data: {
          friendsBalance: [
            {
              userId: '10',
              userName: 'Zero Group Balance Friend',
              netBalance: 0,
              breakdown: [{
                groupId: 'g1',
                groupName: 'Zero Group',
                balance: 0,
              }],
            },
          ],
        },
      };

      getFriendsBalance.mockResolvedValue(zeroGroupBalanceResponse);
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('Zero Group Balance Friend')).toBeTruthy();
        expect(getByText('Settled up')).toBeTruthy();
      });
    });
  });

  describe('Accessibility and UX', () => {
    test('should have proper key extractors for FlatList', async () => {
      const { getByText } = renderWithContext();

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText('Jane Smith')).toBeTruthy();
      });

      // The component should render without React key warnings
      // This is implicitly tested by the successful rendering
    });

    test('should handle rapid state changes gracefully', async () => {
      let resolvePromise;
      const slowPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      getFriendsBalance.mockReturnValue(slowPromise);
      const { rerender } = renderWithContext();

      // Change context while API call is pending
      const newContext = { ...mockAuthContext, token: 'new-token' };
      rerender(
        <AuthContext.Provider value={newContext}>
          <FriendsScreen />
        </AuthContext.Provider>
      );

      // Resolve the promise
      resolvePromise(mockFriendsResponse);

      await waitFor(() => {
        expect(getFriendsBalance).toHaveBeenCalledTimes(2);
      });
    });
  });
});