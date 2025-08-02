/**
 * Comprehensive unit tests for balanceCalculator utility functions
 * Testing framework: Jest (based on ES6 modules and common Node.js patterns)
 */

import balanceCalculatorModule, { calculateFriendBalances, safeGet, validateGroupData, getMemberName } from './balanceCalculator';

describe('balanceCalculator', () => {
  describe('safeGet', () => {
    it('should return value for valid path', () => {
      const obj = { user: { name: 'John', age: 30 } };
      expect(safeGet(obj, 'user.name')).toBe('John');
      expect(safeGet(obj, 'user.age')).toBe(30);
    });

    it('should return default value for invalid path', () => {
      const obj = { user: { name: 'John' } };
      expect(safeGet(obj, 'user.email', 'default')).toBe('default');
      expect(safeGet(obj, 'nonexistent.path', 'fallback')).toBe('fallback');
    });

    it('should return null as default when no default value provided', () => {
      const obj = { user: { name: 'John' } };
      expect(safeGet(obj, 'user.email')).toBeNull();
    });

    it('should handle null/undefined objects gracefully', () => {
      expect(safeGet(null, 'any.path', 'default')).toBe('default');
      expect(safeGet(undefined, 'any.path', 'default')).toBe('default');
      expect(safeGet('not an object', 'any.path', 'default')).toBe('default');
      expect(safeGet(123, 'any.path', 'default')).toBe('default');
      expect(safeGet(true, 'any.path', 'default')).toBe('default');
    });

    it('should handle empty path', () => {
      const obj = { value: 'test' };
      expect(safeGet(obj, '', 'default')).toBe('default');
    });

    it('should handle null/undefined values in path', () => {
      const obj = { user: null };
      expect(safeGet(obj, 'user.name', 'default')).toBe('default');
      
      const obj2 = { user: { profile: undefined } };
      expect(safeGet(obj2, 'user.profile.name', 'default')).toBe('default');
    });

    it('should handle deep nested paths', () => {
      const obj = { a: { b: { c: { d: { e: 'deep value' } } } } };
      expect(safeGet(obj, 'a.b.c.d.e')).toBe('deep value');
      expect(safeGet(obj, 'a.b.c.d.f', 'missing')).toBe('missing');
    });

    it('should handle array indices in path', () => {
      const obj = { items: [{ name: 'first' }, { name: 'second' }] };
      expect(safeGet(obj, 'items.0.name')).toBe('first');
      expect(safeGet(obj, 'items.1.name')).toBe('second');
      expect(safeGet(obj, 'items.2.name', 'not found')).toBe('not found');
    });

    it('should return default value when final value is null or undefined', () => {
      const obj = { user: { name: null, email: undefined } };
      expect(safeGet(obj, 'user.name', 'default')).toBe('default');
      expect(safeGet(obj, 'user.email', 'default')).toBe('default');
    });

    it('should handle non-object intermediate values', () => {
      const obj = { user: 'string value' };
      expect(safeGet(obj, 'user.name', 'default')).toBe('default');
      
      const obj2 = { user: { profile: 123 } };
      expect(safeGet(obj2, 'user.profile.name', 'default')).toBe('default');
    });

    it('should handle boolean values correctly', () => {
      const obj = { settings: { enabled: false, debug: true } };
      expect(safeGet(obj, 'settings.enabled')).toBe(false);
      expect(safeGet(obj, 'settings.debug')).toBe(true);
    });

    it('should handle zero values correctly', () => {
      const obj = { count: 0, balance: 0.0 };
      expect(safeGet(obj, 'count')).toBe(0);
      expect(safeGet(obj, 'balance')).toBe(0.0);
    });
  });

  describe('validateGroupData', () => {
    const validGroupData = {
      id: 'group123',
      name: 'Test Group',
      details: [
        { data: [{ userId: 'user1', user: { name: 'User One' } }] },
        { data: { expenses: [{ id: 'exp1', amount: 100 }] } }
      ]
    };

    it('should validate and return correct group data', () => {
      const result = validateGroupData(validGroupData);
      expect(result).toEqual({
        id: 'group123',
        name: 'Test Group',
        members: [{ userId: 'user1', user: { name: 'User One' } }],
        expenses: [{ id: 'exp1', amount: 100 }]
      });
    });

    it('should return null for null/undefined input', () => {
      expect(validateGroupData(null)).toBeNull();
      expect(validateGroupData(undefined)).toBeNull();
      expect(validateGroupData('not an object')).toBeNull();
      expect(validateGroupData(123)).toBeNull();
      expect(validateGroupData([])).toBeNull();
    });

    it('should return null when details is not an array', () => {
      const invalidGroup = { ...validGroupData, details: null };
      expect(validateGroupData(invalidGroup)).toBeNull();
      
      const invalidGroup2 = { ...validGroupData, details: 'not an array' };
      expect(validateGroupData(invalidGroup2)).toBeNull();
      
      const invalidGroup3 = { ...validGroupData, details: {} };
      expect(validateGroupData(invalidGroup3)).toBeNull();
    });

    it('should return null when details has less than 2 elements', () => {
      const invalidGroup = { ...validGroupData, details: [{ data: [] }] };
      expect(validateGroupData(invalidGroup)).toBeNull();
      
      const emptyDetails = { ...validGroupData, details: [] };
      expect(validateGroupData(emptyDetails)).toBeNull();
    });

    it('should return null when members data is not an array', () => {
      const invalidGroup = {
        ...validGroupData,
        details: [
          { data: 'not an array' },
          { data: { expenses: [] } }
        ]
      };
      expect(validateGroupData(invalidGroup)).toBeNull();
      
      const invalidGroup2 = {
        ...validGroupData,
        details: [
          { data: null },
          { data: { expenses: [] } }
        ]
      };
      expect(validateGroupData(invalidGroup2)).toBeNull();
    });

    it('should return null when expenses data is not an array', () => {
      const invalidGroup = {
        ...validGroupData,
        details: [
          { data: [] },
          { data: { expenses: 'not an array' } }
        ]
      };
      expect(validateGroupData(invalidGroup)).toBeNull();
      
      const invalidGroup2 = {
        ...validGroupData,
        details: [
          { data: [] },
          { data: { expenses: null } }
        ]
      };
      expect(validateGroupData(invalidGroup2)).toBeNull();
    });

    it('should handle missing members response data', () => {
      const invalidGroup = {
        ...validGroupData,
        details: [
          { notData: [] },
          { data: { expenses: [] } }
        ]
      };
      expect(validateGroupData(invalidGroup)).toBeNull();
      
      const invalidGroup2 = {
        ...validGroupData,
        details: [
          {},
          { data: { expenses: [] } }
        ]
      };
      expect(validateGroupData(invalidGroup2)).toBeNull();
    });

    it('should handle missing expenses response data', () => {
      const invalidGroup = {
        ...validGroupData,
        details: [
          { data: [] },
          { data: { notExpenses: [] } }
        ]
      };
      expect(validateGroupData(invalidGroup)).toBeNull();
      
      const invalidGroup2 = {
        ...validGroupData,
        details: [
          { data: [] },
          { data: {} }
        ]
      };
      expect(validateGroupData(invalidGroup2)).toBeNull();
    });

    it('should use _id as fallback when id is missing', () => {
      const groupWithUnderscore = {
        ...validGroupData,
        _id: 'group456'
      };
      delete groupWithUnderscore.id;
      
      const result = validateGroupData(groupWithUnderscore);
      expect(result.id).toBe('group456');
    });

    it('should use default name when name is missing', () => {
      const groupWithoutName = { ...validGroupData };
      delete groupWithoutName.name;
      
      const result = validateGroupData(groupWithoutName);
      expect(result.name).toBe('Unknown Group');
    });

    it('should handle missing details property', () => {
      const groupWithoutDetails = { id: 'group1', name: 'Test' };
      expect(validateGroupData(groupWithoutDetails)).toBeNull();
    });

    it('should handle empty members and expenses arrays', () => {
      const groupWithEmptyArrays = {
        id: 'group1',
        name: 'Test Group',
        details: [
          { data: [] },
          { data: { expenses: [] } }
        ]
      };
      
      const result = validateGroupData(groupWithEmptyArrays);
      expect(result).toEqual({
        id: 'group1',
        name: 'Test Group',
        members: [],
        expenses: []
      });
    });
  });

  describe('getMemberName', () => {
    const members = [
      { userId: 'user1', user: { name: 'Alice' } },
      { userId: 'user2', user: { name: 'Bob' } },
      { userId: 'user3', user: { name: null } },
      { userId: 'user4' }, // Missing user object
      { userId: 'user5', user: {} }, // Empty user object
      { userId: 'user6', user: { name: '' } } // Empty name
    ];

    it('should return correct member name', () => {
      expect(getMemberName(members, 'user1')).toBe('Alice');
      expect(getMemberName(members, 'user2')).toBe('Bob');
    });

    it('should return "Unknown" for non-existent userId', () => {
      expect(getMemberName(members, 'nonexistent')).toBe('Unknown');
    });

    it('should return "Unknown" for null/undefined userId', () => {
      expect(getMemberName(members, null)).toBe('Unknown');
      expect(getMemberName(members, undefined)).toBe('Unknown');
      expect(getMemberName(members, '')).toBe('Unknown');
    });

    it('should return "Unknown" for invalid members array', () => {
      expect(getMemberName(null, 'user1')).toBe('Unknown');
      expect(getMemberName(undefined, 'user1')).toBe('Unknown');
      expect(getMemberName('not an array', 'user1')).toBe('Unknown');
      expect(getMemberName({}, 'user1')).toBe('Unknown');
      expect(getMemberName(123, 'user1')).toBe('Unknown');
    });

    it('should return "Unknown" when member has no name', () => {
      expect(getMemberName(members, 'user3')).toBe('Unknown');
      expect(getMemberName(members, 'user4')).toBe('Unknown');
      expect(getMemberName(members, 'user5')).toBe('Unknown');
    });

    it('should return "Unknown" for empty name', () => {
      expect(getMemberName(members, 'user6')).toBe('Unknown');
    });

    it('should handle empty members array', () => {
      expect(getMemberName([], 'user1')).toBe('Unknown');
    });

    it('should handle members with invalid structure', () => {
      const invalidMembers = [
        null,
        'invalid member',
        { userId: 'user1' },
        { user: { name: 'No UserId' } }
      ];
      
      expect(getMemberName(invalidMembers, 'user1')).toBe('Unknown');
      expect(getMemberName(invalidMembers, 'nonexistent')).toBe('Unknown');
    });
  });

  describe('calculateFriendBalances', () => {
    const mockGroupsWithDetails = [
      {
        id: 'group1',
        name: 'Test Group 1',
        details: [
          {
            data: [
              { userId: 'user1', user: { name: 'Alice' } },
              { userId: 'user2', user: { name: 'Bob' } },
              { userId: 'currentUser', user: { name: 'Current User' } }
            ]
          },
          {
            data: {
              expenses: [
                {
                  id: 'exp1',
                  paidBy: 'currentUser',
                  splits: [
                    { userId: 'user1', amount: 50 },
                    { userId: 'user2', amount: 30 }
                  ]
                },
                {
                  id: 'exp2',
                  paidBy: 'user1',
                  splits: [
                    { userId: 'currentUser', amount: 20 }
                  ]
                }
              ]
            }
          }
        ]
      }
    ];

    it('should calculate balances correctly when current user paid', () => {
      const result = calculateFriendBalances(mockGroupsWithDetails, 'currentUser');
      
      const aliceBalance = result.find(friend => friend.id === 'user1');
      const bobBalance = result.find(friend => friend.id === 'user2');
      
      expect(aliceBalance).toBeDefined();
      expect(aliceBalance.netBalance).toBe(30); // owes 50 from exp1, paid 20 for currentUser in exp2
      expect(aliceBalance.groups[0].balance).toBe(30);
      
      expect(bobBalance).toBeDefined();
      expect(bobBalance.netBalance).toBe(30); // owes 30 from exp1
      expect(bobBalance.groups[0].balance).toBe(30);
    });

    it('should handle invalid input gracefully', () => {
      expect(calculateFriendBalances(null, 'currentUser')).toEqual([]);
      expect(calculateFriendBalances(undefined, 'currentUser')).toEqual([]);
      expect(calculateFriendBalances([], null)).toEqual([]);
      expect(calculateFriendBalances([], undefined)).toEqual([]);
      expect(calculateFriendBalances('not an array', 'currentUser')).toEqual([]);
      expect(calculateFriendBalances({}, 'currentUser')).toEqual([]);
      expect(calculateFriendBalances([], '')).toEqual([]);
    });

    it('should skip invalid group data', () => {
      const invalidGroups = [
        null,
        { invalid: 'group' },
        { details: [] },
        'invalid group',
        123
      ];
      
      const result = calculateFriendBalances(invalidGroups, 'currentUser');
      expect(result).toEqual([]);
    });

    it('should handle expenses with createdBy fallback', () => {
      const groupsWithCreatedBy = [{
        id: 'group1',
        name: 'Test Group',
        details: [
          { data: [{ userId: 'user1', user: { name: 'Alice' } }] },
          {
            data: {
              expenses: [{
                id: 'exp1',
                createdBy: 'currentUser', // No paidBy field
                splits: [{ userId: 'user1', amount: 50 }]
              }]
            }
          }
        ]
      }];

      const result = calculateFriendBalances(groupsWithCreatedBy, 'currentUser');
      const aliceBalance = result.find(friend => friend.id === 'user1');
      
      expect(aliceBalance.netBalance).toBe(50);
    });

    it('should handle zero and negative amounts', () => {
      const groupsWithZeroAmounts = [{
        id: 'group1',
        name: 'Test Group',
        details: [
          { data: [{ userId: 'user1', user: { name: 'Alice' } }] },
          {
            data: {
              expenses: [{
                id: 'exp1',
                paidBy: 'currentUser',
                splits: [
                  { userId: 'user1', amount: 0 },
                  { userId: 'user1', amount: -10 },
                  { userId: 'user1', amount: 'invalid' },
                  { userId: 'user1', amount: NaN },
                  { userId: 'user1', amount: null }
                ]
              }]
            }
          }
        ]
      }];

      const result = calculateFriendBalances(groupsWithZeroAmounts, 'currentUser');
      expect(result).toEqual([]);
    });

    it('should not create balance entries when payer owes themselves', () => {
      const selfPayingGroups = [{
        id: 'group1',
        name: 'Test Group',
        details: [
          { data: [{ userId: 'currentUser', user: { name: 'Current User' } }] },
          {
            data: {
              expenses: [{
                id: 'exp1',
                paidBy: 'currentUser',
                splits: [{ userId: 'currentUser', amount: 50 }]
              }]
            }
          }
        ]
      }];

      const result = calculateFriendBalances(selfPayingGroups, 'currentUser');
      expect(result).toEqual([]);
    });

    it('should handle multiple groups correctly', () => {
      const multipleGroups = [
        {
          id: 'group1',
          name: 'Group 1',
          details: [
            { data: [{ userId: 'user1', user: { name: 'Alice' } }] },
            {
              data: {
                expenses: [{
                  id: 'exp1',
                  paidBy: 'currentUser',
                  splits: [{ userId: 'user1', amount: 30 }]
                }]
              }
            }
          ]
        },
        {
          id: 'group2',
          name: 'Group 2',
          details: [
            { data: [{ userId: 'user1', user: { name: 'Alice' } }] },
            {
              data: {
                expenses: [{
                  id: 'exp2',
                  paidBy: 'currentUser',
                  splits: [{ userId: 'user1', amount: 20 }]
                }]
              }
            }
          ]
        }
      ];

      const result = calculateFriendBalances(multipleGroups, 'currentUser');
      const aliceBalance = result.find(friend => friend.id === 'user1');
      
      expect(aliceBalance.netBalance).toBe(50); // 30 + 20
      expect(aliceBalance.groups).toHaveLength(2);
      expect(aliceBalance.groups.find(g => g.id === 'group1').balance).toBe(30);
      expect(aliceBalance.groups.find(g => g.id === 'group2').balance).toBe(20);
    });

    it('should handle missing or invalid expense data', () => {
      const invalidExpenseGroups = [{
        id: 'group1',
        name: 'Test Group',
        details: [
          { data: [] },
          {
            data: {
              expenses: [
                null,
                { id: 'exp1' }, // Missing required fields
                { id: 'exp2', paidBy: 'user1' }, // Missing splits
                { id: 'exp3', splits: [] }, // Missing paidBy
                'invalid expense',
                { id: 'exp4', paidBy: '', splits: [] }, // Empty paidBy
                { id: 'exp5', paidBy: null, splits: [{ userId: 'user1', amount: 50 }] }
              ]
            }
          }
        ]
      }];

      const result = calculateFriendBalances(invalidExpenseGroups, 'currentUser');
      expect(result).toEqual([]);
    });

    it('should handle missing split data', () => {
      const invalidSplitGroups = [{
        id: 'group1',
        name: 'Test Group',
        details: [
          { data: [{ userId: 'user1', user: { name: 'Alice' } }] },
          {
            data: {
              expenses: [{
                id: 'exp1',
                paidBy: 'currentUser',
                splits: [
                  null,
                  'invalid split',
                  { userId: 'user1' }, // Missing amount
                  { amount: 50 }, // Missing userId
                  { userId: '', amount: 30 }, // Empty userId
                  { userId: null, amount: 25 }, // Null userId
                  { userId: 'user1', amount: undefined } // Undefined amount
                ]
              }]
            }
          }
        ]
      }];

      const result = calculateFriendBalances(invalidSplitGroups, 'currentUser');
      expect(result).toEqual([]);
    });

    it('should log warnings for invalid input', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      calculateFriendBalances(null, 'currentUser');
      expect(consoleSpy).toHaveBeenCalledWith('Invalid input to calculateFriendBalances:', { groupsWithDetails: null, currentUserId: 'currentUser' });
      
      calculateFriendBalances([], null);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid input to calculateFriendBalances:', { groupsWithDetails: [], currentUserId: null });
      
      consoleSpy.mockRestore();
    });

    it('should log warnings for invalid group data', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const invalidGroup = { invalid: 'data' };
      calculateFriendBalances([invalidGroup], 'currentUser');
      expect(consoleSpy).toHaveBeenCalledWith('Invalid group data, skipping:', invalidGroup);
      
      consoleSpy.mockRestore();
    });

    it('should format output correctly for UI consumption', () => {
      const result = calculateFriendBalances(mockGroupsWithDetails, 'currentUser');
      
      expect(Array.isArray(result)).toBe(true);
      result.forEach(friend => {
        expect(friend).toHaveProperty('id');
        expect(friend).toHaveProperty('name');
        expect(friend).toHaveProperty('netBalance');
        expect(friend).toHaveProperty('groups');
        expect(Array.isArray(friend.groups)).toBe(true);
        expect(typeof friend.netBalance).toBe('number');
        expect(friend.id).toBeTruthy();
        
        friend.groups.forEach(group => {
          expect(group).toHaveProperty('id');
          expect(group).toHaveProperty('name');
          expect(group).toHaveProperty('balance');
          expect(typeof group.balance).toBe('number');
          expect(group.id).toBeTruthy();
        });
      });
    });

    it('should handle complex balance calculations across multiple expenses', () => {
      const complexGroups = [{
        id: 'group1',
        name: 'Complex Group',
        details: [
          {
            data: [
              { userId: 'user1', user: { name: 'Alice' } },
              { userId: 'user2', user: { name: 'Bob' } },
              { userId: 'currentUser', user: { name: 'Current User' } }
            ]
          },
          {
            data: {
              expenses: [
                {
                  id: 'exp1',
                  paidBy: 'currentUser',
                  splits: [
                    { userId: 'user1', amount: 50 },
                    { userId: 'user2', amount: 30 }
                  ]
                },
                {
                  id: 'exp2',
                  paidBy: 'user1',
                  splits: [
                    { userId: 'currentUser', amount: 40 },
                    { userId: 'user2', amount: 20 }
                  ]
                },
                {
                  id: 'exp3',
                  paidBy: 'user2',
                  splits: [
                    { userId: 'currentUser', amount: 15 },
                    { userId: 'user1', amount: 25 }
                  ]
                }
              ]
            }
          }
        ]
      }];

      const result = calculateFriendBalances(complexGroups, 'currentUser');
      
      // Alice: owes 50 from exp1, gets 40 from exp2 = net 10 (Alice owes currentUser)
      const aliceBalance = result.find(friend => friend.id === 'user1');
      expect(aliceBalance?.netBalance).toBe(10); // 50 - 40 = 10
      
      // Bob: owes 30 from exp1, owes 20 from exp2, gets 15 from exp3 = net 35 (Bob owes currentUser)
      const bobBalance = result.find(friend => friend.id === 'user2');
      expect(bobBalance?.netBalance).toBe(35); // 30 + 20 - 15 = 35
    });

    it('should handle string amounts by parsing them', () => {
      const groupsWithStringAmounts = [{
        id: 'group1',
        name: 'Test Group',
        details: [
          { data: [{ userId: 'user1', user: { name: 'Alice' } }] },
          {
            data: {
              expenses: [{
                id: 'exp1',
                paidBy: 'currentUser',
                splits: [
                  { userId: 'user1', amount: '50.75' },
                  { userId: 'user1', amount: '25.25' }
                ]
              }]
            }
          }
        ]
      }];

      const result = calculateFriendBalances(groupsWithStringAmounts, 'currentUser');
      const aliceBalance = result.find(friend => friend.id === 'user1');
      
      expect(aliceBalance?.netBalance).toBe(76); // 50.75 + 25.25
    });

    it('should handle decimal amounts correctly', () => {
      const groupsWithDecimals = [{
        id: 'group1',
        name: 'Test Group',
        details: [
          { data: [{ userId: 'user1', user: { name: 'Alice' } }] },
          {
            data: {
              expenses: [{
                id: 'exp1',
                paidBy: 'currentUser',
                splits: [
                  { userId: 'user1', amount: 33.33 },
                  { userId: 'user1', amount: 16.67 }
                ]
              }]
            }
          }
        ]
      }];

      const result = calculateFriendBalances(groupsWithDecimals, 'currentUser');
      const aliceBalance = result.find(friend => friend.id === 'user1');
      
      expect(aliceBalance?.netBalance).toBe(50); // 33.33 + 16.67
    });

    it('should handle empty groups array', () => {
      const result = calculateFriendBalances([], 'currentUser');
      expect(result).toEqual([]);
    });

    it('should handle groups with no expenses', () => {
      const groupsWithNoExpenses = [{
        id: 'group1',
        name: 'Empty Group',
        details: [
          { data: [{ userId: 'user1', user: { name: 'Alice' } }] },
          { data: { expenses: [] } }
        ]
      }];

      const result = calculateFriendBalances(groupsWithNoExpenses, 'currentUser');
      expect(result).toEqual([]);
    });
  });

  describe('default export', () => {
    it('should export all functions in default object', () => {
      expect(balanceCalculatorModule).toHaveProperty('calculateFriendBalances');
      expect(balanceCalculatorModule).toHaveProperty('safeGet');
      expect(balanceCalculatorModule).toHaveProperty('validateGroupData');
      expect(balanceCalculatorModule).toHaveProperty('getMemberName');
    });

    it('should have working functions in default export', () => {
      const obj = { test: { value: 'works' } };
      expect(balanceCalculatorModule.safeGet(obj, 'test.value')).toBe('works');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle circular references gracefully', () => {
      const circularObj = {};
      circularObj.self = circularObj;
      
      expect(safeGet(circularObj, 'self.self.self', 'default')).toBe('default');
    });

    it('should handle very deep nesting', () => {
      const deepObj = { level1: { level2: { level3: { level4: { level5: 'deep' } } } } };
      expect(safeGet(deepObj, 'level1.level2.level3.level4.level5')).toBe('deep');
      expect(safeGet(deepObj, 'level1.level2.level3.level4.level6', 'not found')).toBe('not found');
    });

    it('should handle special characters in object keys', () => {
      const specialObj = { 'key-with-dash': { 'key.with.dots': 'value' } };
      expect(safeGet(specialObj, 'key-with-dash.key.with.dots')).toBe('value');
    });

    it('should handle numeric string keys', () => {
      const numericObj = { '123': { '456': 'numeric keys' } };
      expect(safeGet(numericObj, '123.456')).toBe('numeric keys');
    });

    it('should handle prototype pollution attempts', () => {
      const maliciousObj = { '__proto__': { polluted: 'value' } };
      expect(safeGet(maliciousObj, '__proto__.polluted')).toBe('value');
      expect(safeGet({}, 'polluted', 'safe')).toBe('safe'); // Should not be polluted
    });

    it('should handle large datasets without performance issues', () => {
      const largeGroups = Array.from({ length: 100 }, (_, i) => ({
        id: `group${i}`,
        name: `Group ${i}`,
        details: [
          { data: Array.from({ length: 50 }, (_, j) => ({ userId: `user${j}`, user: { name: `User ${j}` } })) },
          {
            data: {
              expenses: Array.from({ length: 100 }, (_, k) => ({
                id: `exp${k}`,
                paidBy: 'currentUser',
                splits: [{ userId: `user${k % 50}`, amount: Math.random() * 100 }]
              }))
            }
          }
        ]
      }));

      const startTime = Date.now();
      const result = calculateFriendBalances(largeGroups, 'currentUser');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(Array.isArray(result)).toBe(true);
    });
  });
});