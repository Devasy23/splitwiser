import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeScreen from './HomeScreen';
import { AuthContext } from '../context/AuthContext';
import { createGroup, getGroups, getOptimizedSettlements } from '../api/groups';

// Mock the API functions
jest.mock('../api/groups', () => ({
  createGroup: jest.fn(),
  getGroups: jest.fn(),
  getOptimizedSettlements: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock console.error to avoid noise in test output
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock AuthContext values
const mockAuthContextValue = {
  token: 'mock-token-123',
  logout: jest.fn(),
  user: { _id: 'user123', name: 'Test User' },
};

const renderWithAuthContext = (authValue = mockAuthContextValue) => {
  return render(
    <AuthContext.Provider value={authValue}>
      <HomeScreen navigation={mockNavigation} />
    </AuthContext.Provider>
  );
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert.mockClear();
    mockNavigation.navigate.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('Initial Loading and Data Fetching', () => {
    it('should display loading indicator initially', async () => {
      getGroups.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      const { getByTestId } = renderWithAuthContext();
      
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should fetch groups on mount when token is available', async () => {
      const mockGroups = [
        { _id: 'group1', name: 'Test Group 1', joinCode: 'ABC123', icon: 'T' },
      ];
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      await act(async () => {
        renderWithAuthContext();
      });

      await waitFor(() => {
        expect(getGroups).toHaveBeenCalledWith('mock-token-123');
      });
    });

    it('should not fetch groups when token is not available', () => {
      const authValueWithoutToken = { ...mockAuthContextValue, token: null };
      
      renderWithAuthContext(authValueWithoutToken);
      
      expect(getGroups).not.toHaveBeenCalled();
    });

    it('should handle error when fetching groups fails', async () => {
      getGroups.mockRejectedValue(new Error('Network error'));
      
      await act(async () => {
        renderWithAuthContext();
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to fetch groups.');
      });
    });

    it('should set loading to false after groups are fetched', async () => {
      const mockGroups = [
        { _id: 'group1', name: 'Test Group', joinCode: 'ABC123' },
      ];
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { queryByTestId } = renderWithAuthContext();

      await waitFor(() => {
        expect(queryByTestId('loading-indicator')).toBeNull();
      });
    });
  });

  describe('Settlement Status Calculations', () => {
    it('should calculate settlement status when user owes money', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      const mockSettlements = [
        { fromUserId: 'user123', toUserId: 'user456', amount: 50 },
        { fromUserId: 'user789', toUserId: 'user123', amount: 20 },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: mockSettlements } });

      await act(async () => {
        renderWithAuthContext();
      });

      await waitFor(() => {
        expect(getOptimizedSettlements).toHaveBeenCalledWith('mock-token-123', 'group1');
      });
    });

    it('should calculate settlement status when user is owed money', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      const mockSettlements = [
        { fromUserId: 'user456', toUserId: 'user123', amount: 75 },
        { fromUserId: 'user123', toUserId: 'user789', amount: 25 },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: mockSettlements } });

      await act(async () => {
        renderWithAuthContext();
      });

      await waitFor(() => {
        expect(getOptimizedSettlements).toHaveBeenCalledWith('mock-token-123', 'group1');
      });
    });

    it('should handle settlement calculation error gracefully', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockRejectedValue(new Error('Settlement error'));

      await act(async () => {
        renderWithAuthContext();
      });

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Failed to fetch settlement status for group:',
          'group1',
          expect.any(Error)
        );
      });
    });

    it('should calculate correct net balance for complex settlements', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      const mockSettlements = [
        { fromUserId: 'user123', toUserId: 'user456', amount: 30 },
        { fromUserId: 'user456', toUserId: 'user123', amount: 50 },
        { fromUserId: 'user789', toUserId: 'user123', amount: 25 },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: mockSettlements } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        // Net balance: (50 + 25) - 30 = 45, so user is owed $45
        expect(getByText('You are owed $45.00.')).toBeTruthy();
      });
    });

    it('should handle settlements with undefined amounts', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      const mockSettlements = [
        { fromUserId: 'user123', toUserId: 'user456', amount: undefined },
        { fromUserId: 'user456', toUserId: 'user123', amount: null },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: mockSettlements } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        expect(getByText('✓ You are settled up.')).toBeTruthy();
      });
    });
  });

  describe('Group Rendering and UI', () => {
    it('should render groups list when data is loaded', async () => {
      const mockGroups = [
        { _id: 'group1', name: 'Test Group 1', joinCode: 'ABC123', icon: 'T' },
        { _id: 'group2', name: 'Test Group 2', joinCode: 'XYZ789', icon: 'G' },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        expect(getByText('Test Group 1')).toBeTruthy();
        expect(getByText('Test Group 2')).toBeTruthy();
        expect(getByText('Join Code: ABC123')).toBeTruthy();
        expect(getByText('Join Code: XYZ789')).toBeTruthy();
      });
    });

    it('should display empty state when no groups exist', async () => {
      getGroups.mockResolvedValue({ data: { groups: [] } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        expect(getByText('No groups found. Create or join one!')).toBeTruthy();
      });
    });

    it('should navigate to group details when group card is pressed', async () => {
      const mockGroups = [
        { _id: 'group1', name: 'Test Group', joinCode: 'ABC123', icon: 'T' },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        const groupCard = getByText('Test Group');
        fireEvent.press(groupCard);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('GroupDetails', {
        groupId: 'group1',
        groupName: 'Test Group',
        groupIcon: 'T',
      });
    });

    it('should render group avatar with icon when provided', async () => {
      const mockGroups = [
        { _id: 'group1', name: 'Test Group', joinCode: 'ABC123', icon: '🏠' },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        expect(getByText('🏠')).toBeTruthy();
      });
    });

    it('should render group avatar with first letter when no icon provided', async () => {
      const mockGroups = [
        { _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }, // No icon
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        expect(getByText('T')).toBeTruthy(); // First letter of "Test Group"
      });
    });
  });

  describe('Settlement Status Display', () => {
    it('should display "Calculating balances..." when settlement status is loading', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      // Delay the settlement response to simulate loading
      getOptimizedSettlements.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ data: { optimizedSettlements: [] } }), 100)
      ));

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        expect(getByText('Calculating balances...')).toBeTruthy();
      });
    });

    it('should display settled status correctly', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        expect(getByText('✓ You are settled up.')).toBeTruthy();
      });
    });

    it('should display owed amount with correct formatting', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      const mockSettlements = [
        { fromUserId: 'user456', toUserId: 'user123', amount: 50.755 },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: mockSettlements } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        expect(getByText('You are owed $50.76.')).toBeTruthy(); // Rounded to 2 decimal places
      });
    });

    it('should display owing amount with correct formatting', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      const mockSettlements = [
        { fromUserId: 'user123', toUserId: 'user456', amount: 25.504 },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: mockSettlements } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        expect(getByText('You owe $25.50.')).toBeTruthy(); // Rounded to 2 decimal places
      });
    });

    it('should handle zero net balance as settled', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      const mockSettlements = [
        { fromUserId: 'user123', toUserId: 'user456', amount: 50 },
        { fromUserId: 'user456', toUserId: 'user123', amount: 50 },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: mockSettlements } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        expect(getByText('You are settled up.')).toBeTruthy();
      });
    });
  });

  describe('Create Group Modal', () => {
    it('should show modal when plus icon is pressed', async () => {
      getGroups.mockResolvedValue({ data: { groups: [] } });

      const { getByLabelText, getByText } = renderWithAuthContext();

      await waitFor(() => {
        const plusButton = getByLabelText('plus');
        fireEvent.press(plusButton);
      });

      expect(getByText('Create a New Group')).toBeTruthy();
    });

    it('should update group name input when text changes', async () => {
      getGroups.mockResolvedValue({ data: { groups: [] } });

      const { getByLabelText, getByDisplayValue } = renderWithAuthContext();

      await waitFor(() => {
        fireEvent.press(getByLabelText('plus'));
      });

      const input = getByLabelText('Group Name');
      fireEvent.changeText(input, 'New Test Group');

      expect(getByDisplayValue('New Test Group')).toBeTruthy();
    });

    it('should show error when creating group without name', async () => {
      getGroups.mockResolvedValue({ data: { groups: [] } });

      const { getByLabelText, getByText } = renderWithAuthContext();

      await waitFor(() => {
        fireEvent.press(getByLabelText('plus'));
      });

      fireEvent.press(getByText('Create'));

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a group name.');
    });

    it('should show error when creating group with empty name', async () => {
      getGroups.mockResolvedValue({ data: { groups: [] } });

      const { getByLabelText, getByText } = renderWithAuthContext();

      await waitFor(() => {
        fireEvent.press(getByLabelText('plus'));
      });

      const input = getByLabelText('Group Name');
      fireEvent.changeText(input, '   '); // Whitespace only
      fireEvent.press(getByText('Create'));

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a group name.');
    });

    it('should create group successfully and refresh list', async () => {
      const initialGroups = [];
      const updatedGroups = [{ _id: 'newgroup1', name: 'New Test Group', joinCode: 'NEW123' }];
      
      createGroup.mockResolvedValue({ data: { success: true } });
      getGroups
        .mockResolvedValueOnce({ data: { groups: initialGroups } })
        .mockResolvedValueOnce({ data: { groups: updatedGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByLabelText, getByText, queryByText } = renderWithAuthContext();

      await waitFor(() => {
        fireEvent.press(getByLabelText('plus'));
      });

      const input = getByLabelText('Group Name');
      fireEvent.changeText(input, 'New Test Group');
      
      await act(async () => {
        fireEvent.press(getByText('Create'));
      });

      expect(createGroup).toHaveBeenCalledWith('mock-token-123', 'New Test Group');
      
      // Modal should be hidden
      await waitFor(() => {
        expect(queryByText('Create a New Group')).toBeNull();
      });

      // Groups list should be refreshed
      expect(getGroups).toHaveBeenCalledTimes(2);
    });

    it('should handle group creation error', async () => {
      createGroup.mockRejectedValue(new Error('Creation failed'));
      getGroups.mockResolvedValue({ data: { groups: [] } });

      const { getByLabelText, getByText } = renderWithAuthContext();

      await waitFor(() => {
        fireEvent.press(getByLabelText('plus'));
      });

      const input = getByLabelText('Group Name');
      fireEvent.changeText(input, 'New Test Group');
      
      await act(async () => {
        fireEvent.press(getByText('Create'));
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create group.');
    });

    it('should show loading state while creating group', async () => {
      let resolveCreate;
      createGroup.mockImplementation(() => new Promise(resolve => {
        resolveCreate = resolve;
      }));
      getGroups.mockResolvedValue({ data: { groups: [] } });

      const { getByLabelText, getByText } = renderWithAuthContext();

      await waitFor(() => {
        fireEvent.press(getByLabelText('plus'));
      });

      const input = getByLabelText('Group Name');
      fireEvent.changeText(input, 'New Test Group');
      
      act(() => {
        fireEvent.press(getByText('Create'));
      });

      // Button should be disabled and show loading
      const createButton = getByText('Create');
      expect(createButton.props.disabled).toBeTruthy();

      // Resolve the creation
      act(() => {
        resolveCreate({ data: { success: true } });
      });
    });

    it('should clear input after successful group creation', async () => {
      createGroup.mockResolvedValue({ data: { success: true } });
      getGroups.mockResolvedValue({ data: { groups: [] } });

      const { getByLabelText, getByText, queryByDisplayValue } = renderWithAuthContext();

      await waitFor(() => {
        fireEvent.press(getByLabelText('plus'));
      });

      const input = getByLabelText('Group Name');
      fireEvent.changeText(input, 'New Test Group');
      
      await act(async () => {
        fireEvent.press(getByText('Create'));
      });

      // After successful creation, input should be cleared
      await waitFor(() => {
        expect(queryByDisplayValue('New Test Group')).toBeNull();
      });
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to JoinGroup screen with callback when account-plus icon is pressed', async () => {
      getGroups.mockResolvedValue({ data: { groups: [] } });

      const { getByLabelText } = renderWithAuthContext();

      await waitFor(() => {
        fireEvent.press(getByLabelText('account-plus'));
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('JoinGroup', {
        onGroupJoined: expect.any(Function),
      });
    });

    it('should provide fetchGroups as callback to JoinGroup screen', async () => {
      getGroups.mockResolvedValue({ data: { groups: [] } });

      const { getByLabelText } = renderWithAuthContext();

      await waitFor(() => {
        fireEvent.press(getByLabelText('account-plus'));
      });

      const navigateCall = mockNavigation.navigate.mock.calls[0];
      const callback = navigateCall[1].onGroupJoined;
      
      // Calling the callback should trigger fetchGroups
      await act(async () => {
        await callback();
      });

      // Should have been called twice - once on mount, once from callback
      expect(getGroups).toHaveBeenCalledTimes(2);
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh groups when pull to refresh is triggered', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByTestId } = renderWithAuthContext();

      await waitFor(() => {
        expect(getGroups).toHaveBeenCalledTimes(1);
      });

      // Simulate pull to refresh
      const flatList = getByTestId('groups-flatlist');
      await act(async () => {
        fireEvent(flatList, 'onRefresh');
      });

      expect(getGroups).toHaveBeenCalledTimes(2);
    });

    it('should show refreshing indicator during pull to refresh', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      let resolveRefresh;
      getGroups
        .mockResolvedValueOnce({ data: { groups: mockGroups } })
        .mockImplementationOnce(() => new Promise(resolve => {
          resolveRefresh = resolve;
        }));
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByTestId } = renderWithAuthContext();

      await waitFor(() => {
        expect(getGroups).toHaveBeenCalledTimes(1);
      });

      const flatList = getByTestId('groups-flatlist');
      act(() => {
        fireEvent(flatList, 'onRefresh');
      });

      // Should show refreshing state
      expect(flatList.props.refreshing).toBeTruthy();

      // Resolve the refresh
      act(() => {
        resolveRefresh({ data: { groups: mockGroups } });
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing user ID when calculating settlements', async () => {
      const authValueWithoutUserId = {
        ...mockAuthContextValue,
        user: null,
      };
      
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });

      await act(async () => {
        renderWithAuthContext(authValueWithoutUserId);
      });

      // Should not call getOptimizedSettlements when user ID is not available
      expect(getOptimizedSettlements).not.toHaveBeenCalled();
    });

    it('should handle user object without _id property', async () => {
      const authValueWithIncompleteUser = {
        ...mockAuthContextValue,
        user: { name: 'Test User' }, // Missing _id
      };
      
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });

      await act(async () => {
        renderWithAuthContext(authValueWithIncompleteUser);
      });

      expect(getOptimizedSettlements).not.toHaveBeenCalled();
    });

    it('should handle groups with missing properties gracefully', async () => {
      const mockGroups = [
        { _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }, // No icon
        { _id: 'group2', name: '', joinCode: 'XYZ789', icon: 'T' }, // Empty name
        { _id: 'group3', name: 'Group 3' }, // No joinCode
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText, queryByText } = renderWithAuthContext();

      await waitFor(() => {
        expect(getByText('Test Group')).toBeTruthy();
        expect(getByText('Join Code: ABC123')).toBeTruthy();
        expect(queryByText('Join Code: undefined')).toBeNull();
      });
    });

    it('should handle malformed API response for groups', async () => {
      getGroups.mockResolvedValue({ data: {} }); // Missing groups array

      await act(async () => {
        renderWithAuthContext();
      });

      // Should handle gracefully without crashing
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should handle malformed API response for settlements', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: {} }); // Missing optimizedSettlements

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        expect(getByText('✓ You are settled up.')).toBeTruthy();
      });
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.code = 'ECONNABORTED';
      getGroups.mockRejectedValue(timeoutError);

      await act(async () => {
        renderWithAuthContext();
      });

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to fetch groups.');
    });

    it('should handle empty group names', async () => {
      const mockGroups = [
        { _id: 'group1', name: '', joinCode: 'ABC123' },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        // Should still display something for the group
        expect(getByText('Join Code: ABC123')).toBeTruthy();
      });
    });
  });

  describe('Status Color Logic', () => {
    it('should apply green color for settled status', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: [] } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        const statusText = getByText('✓ You are settled up.');
        expect(statusText.props.style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ color: '#4CAF50' })
          ])
        );
      });
    });

    it('should apply red color when user owes money', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      const mockSettlements = [
        { fromUserId: 'user123', toUserId: 'user456', amount: 25 },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: mockSettlements } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        const statusText = getByText('You owe $25.00.');
        expect(statusText.props.style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ color: '#F44336' })
          ])
        );
      });
    });

    it('should apply green color when user is owed money', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      const mockSettlements = [
        { fromUserId: 'user456', toUserId: 'user123', amount: 25 },
      ];
      
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      getOptimizedSettlements.mockResolvedValue({ data: { optimizedSettlements: mockSettlements } });

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        const statusText = getByText('You are owed $25.00.');
        expect(statusText.props.style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ color: '#4CAF50' })
          ])
        );
      });
    });

    it('should apply default green color for calculating status', async () => {
      const mockGroups = [{ _id: 'group1', name: 'Test Group', joinCode: 'ABC123' }];
      getGroups.mockResolvedValue({ data: { groups: mockGroups } });
      // Don't resolve settlements to keep it in calculating state

      const { getByText } = renderWithAuthContext();

      await waitFor(() => {
        const statusText = getByText('Calculating balances...');
        expect(statusText.props.style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ color: '#4CAF50' })
          ])
        );
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should fetch groups when token changes from null to valid', async () => {
      const { rerender } = render(
        <AuthContext.Provider value={{ ...mockAuthContextValue, token: null }}>
          <HomeScreen navigation={mockNavigation} />
        </AuthContext.Provider>
      );

      expect(getGroups).not.toHaveBeenCalled();

      getGroups.mockResolvedValue({ data: { groups: [] } });

      rerender(
        <AuthContext.Provider value={mockAuthContextValue}>
          <HomeScreen navigation={mockNavigation} />
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(getGroups).toHaveBeenCalledWith('mock-token-123');
      });
    });

    it('should not refetch groups when token changes to same value', async () => {
      getGroups.mockResolvedValue({ data: { groups: [] } });

      const { rerender } = renderWithAuthContext();

      await waitFor(() => {
        expect(getGroups).toHaveBeenCalledTimes(1);
      });

      // Re-render with same token
      rerender(
        <AuthContext.Provider value={mockAuthContextValue}>
          <HomeScreen navigation={mockNavigation} />
        </AuthContext.Provider>
      );

      // Should not call again
      expect(getGroups).toHaveBeenCalledTimes(1);
    });
  });
});