import axios from 'axios';
import {
  getGroups,
  getOptimizedSettlements,
  createExpense,
  getGroupDetails,
  getGroupMembers,
  getGroupExpenses,
  createGroup,
  joinGroup,
  getUserBalanceSummary,
  getFriendsBalance
} from './groups';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('Groups API', () => {
  let mockApiClient;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock API client
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn()
    };
    
    // Mock axios.create to return our mock client
    mockedAxios.create.mockReturnValue(mockApiClient);
  });

  describe('API Client Configuration', () => {
    test('should create axios instance with correct base URL and headers', () => {
      // Import the module to trigger axios.create
      require('./groups');
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://splitwiser-production.up.railway.app',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('getGroups', () => {
    test('should fetch groups with valid token', async () => {
      const mockToken = 'valid-token-123';
      const mockResponse = { data: [{ id: 1, name: 'Test Group' }] };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getGroups(mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups', {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
      expect(result).toBe(mockResponse);
    });

    test('should handle empty token', async () => {
      const mockToken = '';
      const mockResponse = { data: [] };
      mockApiClient.get.mockResolvedValue(mockResponse);

      await getGroups(mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups', {
        headers: {
          Authorization: 'Bearer ',
        },
      });
    });

    test('should handle null token', async () => {
      const mockToken = null;
      mockApiClient.get.mockResolvedValue({ data: [] });

      await getGroups(mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups', {
        headers: {
          Authorization: 'Bearer null',
        },
      });
    });

    test('should handle undefined token', async () => {
      const mockToken = undefined;
      mockApiClient.get.mockResolvedValue({ data: [] });

      await getGroups(mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups', {
        headers: {
          Authorization: 'Bearer undefined',
        },
      });
    });

    test('should handle API error', async () => {
      const mockToken = 'valid-token';
      const mockError = new Error('Network Error');
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(getGroups(mockToken)).rejects.toThrow('Network Error');
    });

    test('should handle 401 unauthorized error', async () => {
      const mockToken = 'invalid-token';
      const mockError = { response: { status: 401, data: { message: 'Unauthorized' } } };
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(getGroups(mockToken)).rejects.toEqual(mockError);
    });
  });

  describe('getOptimizedSettlements', () => {
    test('should fetch optimized settlements with valid parameters', async () => {
      const mockToken = 'valid-token-123';
      const mockGroupId = 'group-123';
      const mockResponse = { data: { settlements: [] } };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await getOptimizedSettlements(mockToken, mockGroupId);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/groups/${mockGroupId}/settlements/optimize`,
        {},
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toBe(mockResponse);
    });

    test('should handle numeric group ID', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = 123;
      mockApiClient.post.mockResolvedValue({ data: {} });

      await getOptimizedSettlements(mockToken, mockGroupId);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/groups/123/settlements/optimize',
        {},
        expect.any(Object)
      );
    });

    test('should handle special characters in group ID', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = 'group-with-special-chars@#$';
      mockApiClient.post.mockResolvedValue({ data: {} });

      await getOptimizedSettlements(mockToken, mockGroupId);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/groups/group-with-special-chars@#$/settlements/optimize',
        {},
        expect.any(Object)
      );
    });

    test('should handle API error for settlements', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = 'group-123';
      const mockError = new Error('Settlement calculation failed');
      mockApiClient.post.mockRejectedValue(mockError);

      await expect(getOptimizedSettlements(mockToken, mockGroupId)).rejects.toThrow(
        'Settlement calculation failed'
      );
    });
  });

  describe('createExpense', () => {
    test('should create expense with valid data', async () => {
      const mockToken = 'valid-token-123';
      const mockGroupId = 'group-123';
      const mockExpenseData = {
        description: 'Dinner',
        amount: 50.25,
        paidBy: 'user-123',
        splitBetween: ['user-123', 'user-456']
      };
      const mockResponse = { data: { id: 'expense-123', ...mockExpenseData } };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await createExpense(mockToken, mockGroupId, mockExpenseData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/groups/${mockGroupId}/expenses`,
        mockExpenseData,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toBe(mockResponse);
    });

    test('should handle empty expense data', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = 'group-123';
      const mockExpenseData = {};
      mockApiClient.post.mockResolvedValue({ data: {} });

      await createExpense(mockToken, mockGroupId, mockExpenseData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/groups/${mockGroupId}/expenses`,
        {},
        expect.any(Object)
      );
    });

    test('should handle null expense data', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = 'group-123';
      const mockExpenseData = null;
      mockApiClient.post.mockResolvedValue({ data: {} });

      await createExpense(mockToken, mockGroupId, mockExpenseData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/groups/${mockGroupId}/expenses`,
        null,
        expect.any(Object)
      );
    });

    test('should handle large expense amounts', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = 'group-123';
      const mockExpenseData = { amount: 999999.99 };
      mockApiClient.post.mockResolvedValue({ data: {} });

      await createExpense(mockToken, mockGroupId, mockExpenseData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        mockExpenseData,
        expect.any(Object)
      );
    });

    test('should handle negative expense amounts', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = 'group-123';
      const mockExpenseData = { amount: -50.00 };
      mockApiClient.post.mockResolvedValue({ data: {} });

      await createExpense(mockToken, mockGroupId, mockExpenseData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        mockExpenseData,
        expect.any(Object)
      );
    });
  });

  describe('getGroupDetails', () => {
    test('should fetch both group members and expenses', async () => {
      const mockToken = 'valid-token-123';
      const mockGroupId = 'group-123';
      const mockMembersResponse = { data: [{ id: 'user-1', name: 'John' }] };
      const mockExpensesResponse = { data: [{ id: 'expense-1', amount: 50 }] };
      
      mockApiClient.get
        .mockResolvedValueOnce(mockMembersResponse)
        .mockResolvedValueOnce(mockExpensesResponse);

      const result = await getGroupDetails(mockToken, mockGroupId);

      expect(result).toEqual([mockMembersResponse, mockExpensesResponse]);
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/groups/${mockGroupId}/members`,
        expect.any(Object)
      );
      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/groups/${mockGroupId}/expenses`,
        expect.any(Object)
      );
    });

    test('should handle when one API call fails', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = 'group-123';
      const mockMembersResponse = { data: [] };
      const mockError = new Error('Expenses fetch failed');
      
      mockApiClient.get
        .mockResolvedValueOnce(mockMembersResponse)
        .mockRejectedValueOnce(mockError);

      await expect(getGroupDetails(mockToken, mockGroupId)).rejects.toThrow(
        'Expenses fetch failed'
      );
    });

    test('should handle when both API calls fail', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = 'group-123';
      const mockError1 = new Error('Members fetch failed');
      const mockError2 = new Error('Expenses fetch failed');
      
      mockApiClient.get
        .mockRejectedValueOnce(mockError1)
        .mockRejectedValueOnce(mockError2);

      await expect(getGroupDetails(mockToken, mockGroupId)).rejects.toThrow(
        'Members fetch failed'
      );
    });
  });

  describe('getGroupMembers', () => {
    test('should fetch group members with valid parameters', async () => {
      const mockToken = 'valid-token-123';
      const mockGroupId = 'group-123';
      const mockResponse = { data: [{ id: 'user-1', name: 'John Doe' }] };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getGroupMembers(mockToken, mockGroupId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/groups/${mockGroupId}/members`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toBe(mockResponse);
    });

    test('should handle empty members list', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = 'empty-group';
      const mockResponse = { data: [] };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getGroupMembers(mockToken, mockGroupId);

      expect(result.data).toEqual([]);
    });
  });

  describe('getGroupExpenses', () => {
    test('should fetch group expenses with valid parameters', async () => {
      const mockToken = 'valid-token-123';
      const mockGroupId = 'group-123';
      const mockResponse = { 
        data: [
          { id: 'expense-1', description: 'Lunch', amount: 25.50 },
          { id: 'expense-2', description: 'Dinner', amount: 40.00 }
        ]
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getGroupExpenses(mockToken, mockGroupId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/groups/${mockGroupId}/expenses`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toBe(mockResponse);
    });

    test('should handle group with no expenses', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = 'new-group';
      const mockResponse = { data: [] };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getGroupExpenses(mockToken, mockGroupId);

      expect(result.data).toEqual([]);
    });
  });

  describe('createGroup', () => {
    test('should create group with valid name', async () => {
      const mockToken = 'valid-token-123';
      const mockName = 'My Awesome Group';
      const mockResponse = { data: { id: 'group-123', name: mockName } };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await createGroup(mockToken, mockName);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/groups',
        { name: mockName },
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toBe(mockResponse);
    });

    test('should handle empty group name', async () => {
      const mockToken = 'valid-token';
      const mockName = '';
      mockApiClient.post.mockResolvedValue({ data: {} });

      await createGroup(mockToken, mockName);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/groups',
        { name: '' },
        expect.any(Object)
      );
    });

    test('should handle very long group name', async () => {
      const mockToken = 'valid-token';
      const mockName = 'A'.repeat(1000);
      mockApiClient.post.mockResolvedValue({ data: {} });

      await createGroup(mockToken, mockName);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/groups',
        { name: mockName },
        expect.any(Object)
      );
    });

    test('should handle special characters in group name', async () => {
      const mockToken = 'valid-token';
      const mockName = 'Group @#$%^&*()_+-={}[]|\\:";\'<>?,./';
      mockApiClient.post.mockResolvedValue({ data: {} });

      await createGroup(mockToken, mockName);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/groups',
        { name: mockName },
        expect.any(Object)
      );
    });

    test('should handle unicode characters in group name', async () => {
      const mockToken = 'valid-token';
      const mockName = '🎉 Party Group 🎊';
      mockApiClient.post.mockResolvedValue({ data: {} });

      await createGroup(mockToken, mockName);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/groups',
        { name: mockName },
        expect.any(Object)
      );
    });
  });

  describe('joinGroup', () => {
    test('should join group with valid join code', async () => {
      const mockToken = 'valid-token-123';
      const mockJoinCode = 'ABC123XYZ';
      const mockResponse = { data: { groupId: 'group-123', message: 'Joined successfully' } };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await joinGroup(mockToken, mockJoinCode);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/groups/join',
        { joinCode: mockJoinCode },
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toBe(mockResponse);
    });

    test('should handle invalid join code', async () => {
      const mockToken = 'valid-token';
      const mockJoinCode = 'INVALID';
      const mockError = { response: { status: 404, data: { message: 'Group not found' } } };
      mockApiClient.post.mockRejectedValue(mockError);

      await expect(joinGroup(mockToken, mockJoinCode)).rejects.toEqual(mockError);
    });

    test('should handle empty join code', async () => {
      const mockToken = 'valid-token';
      const mockJoinCode = '';
      mockApiClient.post.mockResolvedValue({ data: {} });

      await joinGroup(mockToken, mockJoinCode);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/groups/join',
        { joinCode: '' },
        expect.any(Object)
      );
    });

    test('should handle null join code', async () => {
      const mockToken = 'valid-token';
      const mockJoinCode = null;
      mockApiClient.post.mockResolvedValue({ data: {} });

      await joinGroup(mockToken, mockJoinCode);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/groups/join',
        { joinCode: null },
        expect.any(Object)
      );
    });

    test('should handle expired join code', async () => {
      const mockToken = 'valid-token';
      const mockJoinCode = 'EXPIRED123';
      const mockError = { response: { status: 410, data: { message: 'Join code expired' } } };
      mockApiClient.post.mockRejectedValue(mockError);

      await expect(joinGroup(mockToken, mockJoinCode)).rejects.toEqual(mockError);
    });
  });

  describe('getUserBalanceSummary', () => {
    test('should fetch user balance summary with valid token', async () => {
      const mockToken = 'valid-token-123';
      const mockResponse = { 
        data: { 
          totalOwed: 150.75, 
          totalOwing: 75.25, 
          netBalance: 75.50 
        } 
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getUserBalanceSummary(mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/users/me/balance-summary',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toBe(mockResponse);
    });

    test('should handle user with no balance data', async () => {
      const mockToken = 'valid-token';
      const mockResponse = { 
        data: { 
          totalOwed: 0, 
          totalOwing: 0, 
          netBalance: 0 
        } 
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getUserBalanceSummary(mockToken);

      expect(result.data.netBalance).toBe(0);
    });

    test('should handle API error for balance summary', async () => {
      const mockToken = 'valid-token';
      const mockError = new Error('Balance calculation error');
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(getUserBalanceSummary(mockToken)).rejects.toThrow(
        'Balance calculation error'
      );
    });
  });

  describe('getFriendsBalance', () => {
    test('should fetch friends balance with valid token', async () => {
      const mockToken = 'valid-token-123';
      const mockResponse = { 
        data: [
          { friendId: 'user-456', name: 'Alice', balance: 25.50 },
          { friendId: 'user-789', name: 'Bob', balance: -15.25 }
        ]
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getFriendsBalance(mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/users/me/friends-balance',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toBe(mockResponse);
    });

    test('should handle user with no friends', async () => {
      const mockToken = 'valid-token';
      const mockResponse = { data: [] };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getFriendsBalance(mockToken);

      expect(result.data).toEqual([]);
    });

    test('should handle API error for friends balance', async () => {
      const mockToken = 'valid-token';
      const mockError = { response: { status: 500, data: { message: 'Internal server error' } } };
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(getFriendsBalance(mockToken)).rejects.toEqual(mockError);
    });
  });

  describe('Error Handling', () => {
    test('should handle network timeouts', async () => {
      const mockToken = 'valid-token';
      const mockError = { code: 'ECONNABORTED', message: 'timeout of 5000ms exceeded' };
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(getGroups(mockToken)).rejects.toEqual(mockError);
    });

    test('should handle connection refused', async () => {
      const mockToken = 'valid-token';
      const mockError = { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED' };
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(getGroups(mockToken)).rejects.toEqual(mockError);
    });

    test('should handle 500 internal server error', async () => {
      const mockToken = 'valid-token';
      const mockError = { 
        response: { 
          status: 500, 
          data: { message: 'Internal Server Error' } 
        } 
      };
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(getGroups(mockToken)).rejects.toEqual(mockError);
    });

    test('should handle 403 forbidden error', async () => {
      const mockToken = 'valid-token';
      const mockError = { 
        response: { 
          status: 403, 
          data: { message: 'Forbidden' } 
        } 
      };
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(getGroups(mockToken)).rejects.toEqual(mockError);
    });

    test('should handle malformed response', async () => {
      const mockToken = 'valid-token';
      const mockResponse = 'not json';
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getGroups(mockToken);

      expect(result).toBe(mockResponse);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long tokens', async () => {
      const mockToken = 'a'.repeat(10000);
      mockApiClient.get.mockResolvedValue({ data: [] });

      await getGroups(mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups', {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });

    test('should handle tokens with special characters', async () => {
      const mockToken = 'token@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      mockApiClient.get.mockResolvedValue({ data: [] });

      await getGroups(mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups', {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });

    test('should handle tokens with unicode characters', async () => {
      const mockToken = 'token🎉🎊';
      mockApiClient.get.mockResolvedValue({ data: [] });

      await getGroups(mockToken);

      expect(mockApiClient.get).toHaveBeenCalledWith('/groups', {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });

    test('should handle boolean values as group IDs', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = true;
      mockApiClient.get.mockResolvedValue({ data: [] });

      await getGroupMembers(mockToken, mockGroupId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/groups/true/members',
        expect.any(Object)
      );
    });

    test('should handle object as group ID', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = { id: 123 };
      mockApiClient.get.mockResolvedValue({ data: [] });

      await getGroupMembers(mockToken, mockGroupId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/groups/[object Object]/members',
        expect.any(Object)
      );
    });
  });

  describe('Concurrent Requests', () => {
    test('should handle multiple concurrent getGroups calls', async () => {
      const mockToken = 'valid-token';
      const mockResponse1 = { data: [{ id: 1, name: 'Group 1' }] };
      const mockResponse2 = { data: [{ id: 2, name: 'Group 2' }] };
      
      mockApiClient.get
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const [result1, result2] = await Promise.all([
        getGroups(mockToken),
        getGroups(mockToken)
      ]);

      expect(result1).toBe(mockResponse1);
      expect(result2).toBe(mockResponse2);
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });

    test('should handle mixed successful and failed concurrent requests', async () => {
      const mockToken = 'valid-token';
      const mockResponse = { data: [] };
      const mockError = new Error('Failed request');
      
      mockApiClient.get
        .mockResolvedValueOnce(mockResponse)
        .mockRejectedValueOnce(mockError);

      const results = await Promise.allSettled([
        getGroups(mockToken),
        getGroups(mockToken)
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[0].value).toBe(mockResponse);
      expect(results[1].status).toBe('rejected');
      expect(results[1].reason).toBe(mockError);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete group workflow', async () => {
      const mockToken = 'valid-token';
      const mockGroupName = 'Test Group';
      const mockGroupId = 'group-123';
      const mockExpenseData = { description: 'Test expense', amount: 100 };
      
      // Mock responses for the complete workflow
      const createGroupResponse = { data: { id: mockGroupId, name: mockGroupName } };
      const getMembersResponse = { data: [{ id: 'user-1', name: 'User 1' }] };
      const getExpensesResponse = { data: [] };
      const createExpenseResponse = { data: { id: 'expense-1', ...mockExpenseData } };
      
      mockApiClient.post
        .mockResolvedValueOnce(createGroupResponse) // createGroup
        .mockResolvedValueOnce(createExpenseResponse); // createExpense
      
      mockApiClient.get
        .mockResolvedValueOnce(getMembersResponse) // getGroupMembers
        .mockResolvedValueOnce(getExpensesResponse); // getGroupExpenses
      
      // Execute workflow
      const groupResult = await createGroup(mockToken, mockGroupName);
      expect(groupResult).toBe(createGroupResponse);
      
      const detailsResult = await getGroupDetails(mockToken, mockGroupId);
      expect(detailsResult).toEqual([getMembersResponse, getExpensesResponse]);
      
      const expenseResult = await createExpense(mockToken, mockGroupId, mockExpenseData);
      expect(expenseResult).toBe(createExpenseResponse);
    });

    test('should handle authentication flow with all endpoints', async () => {
      const mockToken = 'auth-token-123';
      
      // Mock responses for all authenticated endpoints
      mockApiClient.get
        .mockResolvedValueOnce({ data: [] }) // getGroups
        .mockResolvedValueOnce({ data: { totalOwed: 0, totalOwing: 0, netBalance: 0 } }) // getUserBalanceSummary
        .mockResolvedValueOnce({ data: [] }); // getFriendsBalance
      
      // Test all authenticated endpoints
      await getGroups(mockToken);
      await getUserBalanceSummary(mockToken);
      await getFriendsBalance(mockToken);
      
      // Verify all calls used the same token
      expect(mockApiClient.get).toHaveBeenCalledTimes(3);
      mockApiClient.get.mock.calls.forEach(call => {
        expect(call[1].headers.Authorization).toBe(`Bearer ${mockToken}`);
      });
    });
  });

  describe('Performance Tests', () => {
    test('should handle rapid sequential API calls', async () => {
      const mockToken = 'valid-token';
      const numCalls = 10;
      
      // Mock responses for all calls
      for (let i = 0; i < numCalls; i++) {
        mockApiClient.get.mockResolvedValueOnce({ data: [`group-${i}`] });
      }
      
      // Make rapid sequential calls
      const promises = [];
      for (let i = 0; i < numCalls; i++) {
        promises.push(getGroups(mockToken));
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(numCalls);
      expect(mockApiClient.get).toHaveBeenCalledTimes(numCalls);
    });

    test('should maintain correct call order with mixed async operations', async () => {
      const mockToken = 'valid-token';
      const mockGroupId = 'group-123';
      
      // Mock different response times by using different delays
      mockApiClient.get
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({ data: 'first' }), 100)))
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({ data: 'second' }), 50)))
        .mockImplementationOnce(() => new Promise(resolve => 
          setTimeout(() => resolve({ data: 'third' }), 25)));
      
      const [first, second, third] = await Promise.all([
        getGroups(mockToken),
        getGroupMembers(mockToken, mockGroupId),
        getGroupExpenses(mockToken, mockGroupId)
      ]);
      
      // Results should match the order of calls, not completion order
      expect(first.data).toBe('first');
      expect(second.data).toBe('second');
      expect(third.data).toBe('third');
    });
  });
});