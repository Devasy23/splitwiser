# Expense Service

This module implements the Expense Service API endpoints for Splitwiser, handling expense creation, splitting, settlement calculations, and debt optimization.

## Features

### 1. Expense Management
- **Create Expense**: Add new expenses with automatic settlement calculation
- **List Expenses**: Paginated listing with filtering by date range and tags
- **Get Expense**: Retrieve detailed expense information with history and comments
- **Update Expense**: Modify existing expenses (creator only)
- **Delete Expense**: Remove expenses and associated settlements

### 2. Settlement Algorithms

#### Normal Splitting Algorithm
- Simplifies only direct relationships between users
- If A owes B $10 and B owes A $20, it simplifies to B owes A $10
- Does not affect third-party transactions

#### Advanced Simplification Algorithm
- Uses graph optimization to minimize total transactions
- If A owes B $10 and B owes C $10, optimizes to A pays C $10 directly
- Implements two-pointer technique on sorted debtors/creditors

```python
# Algorithm steps:
1. Calculate net balance for each user (indegree - outdegree)
2. Sort users into debtors (positive balance) and creditors (negative balance)
3. Use two-pointer approach to match highest debtor with highest creditor
4. Continue until all balances are settled
```

### 3. Settlement Management
- **Manual Settlements**: Record payments made outside the system
- **Settlement Status**: Track pending/completed/cancelled settlements
- **Settlement History**: Maintain audit trail of all transactions

### 4. Balance Tracking
- **User Balance in Group**: Individual user's financial position within a group
- **Cross-Group Friend Balances**: Aggregated balances across all shared groups
- **Overall Balance Summary**: Complete financial overview for a user

### 5. Analytics
- **Expense Trends**: Daily, monthly, yearly expense patterns
- **Category Analysis**: Spending breakdown by tags/categories
- **Member Contributions**: Individual contribution analysis
- **Spending Insights**: Average expenses, top categories, trends

## API Endpoints

### Expense CRUD
```
POST   /groups/{group_id}/expenses              # Create expense
GET    /groups/{group_id}/expenses              # List expenses
GET    /groups/{group_id}/expenses/{expense_id} # Get single expense
PATCH  /groups/{group_id}/expenses/{expense_id} # Update expense
DELETE /groups/{group_id}/expenses/{expense_id} # Delete expense
```

### Attachments
```
POST /groups/{group_id}/expenses/{expense_id}/attachments     # Upload receipt
GET  /groups/{group_id}/expenses/{expense_id}/attachments/{key} # Download attachment
```

### Settlements
```
POST   /groups/{group_id}/settlements                    # Manual settlement
GET    /groups/{group_id}/settlements                    # List settlements
GET    /groups/{group_id}/settlements/{settlement_id}    # Get settlement
PATCH  /groups/{group_id}/settlements/{settlement_id}    # Update status
DELETE /groups/{group_id}/settlements/{settlement_id}    # Delete settlement
POST   /groups/{group_id}/settlements/optimize           # Calculate optimized settlements
```

### Balance & Analytics
```
GET /users/me/friends-balance                           # Cross-group friend balances
GET /users/me/balance-summary                           # Overall balance summary
GET /groups/{group_id}/users/{user_id}/balance          # User balance in group
GET /groups/{group_id}/analytics                        # Group analytics
```

## Data Models

### Expense
```python
{
  "id": "expense_id",
  "groupId": "group_id",
  "createdBy": "user_id",
  "description": "Dinner at restaurant",
  "amount": 100.0,
  "splits": [
    {"userId": "user_a", "amount": 50.0, "type": "equal"},
    {"userId": "user_b", "amount": 50.0, "type": "equal"}
  ],
  "splitType": "equal",
  "tags": ["dinner", "restaurant"],
  "receiptUrls": ["https://..."],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Settlement
```python
{
  "id": "settlement_id",
  "expenseId": "expense_id",  # null for manual settlements
  "groupId": "group_id",
  "payerId": "user_who_paid",
  "payeeId": "user_who_owes",
  "amount": 50.0,
  "status": "pending",
  "description": "Share for dinner",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Optimized Settlement
```python
{
  "fromUserId": "debtor_id",
  "toUserId": "creditor_id",
  "fromUserName": "Debtor Name",
  "toUserName": "Creditor Name",
  "amount": 75.0,
  "consolidatedExpenses": ["exp1", "exp2"]
}
```

## Split Types

1. **Equal**: Amount divided equally among all participants
2. **Unequal**: Custom amounts specified for each participant
3. **Percentage**: Amount distributed based on percentage shares

## Validation Rules

- Split amounts must sum to total expense amount (±0.01 tolerance)
- All participants must be group members
- Only expense creator can edit/delete expenses
- Settlement amounts must be positive

## Error Handling

- `400 Bad Request`: Invalid expense data or splits
- `401 Unauthorized`: Missing/invalid authentication
- `403 Forbidden`: Not authorized for this action
- `404 Not Found`: Group/expense/settlement not found
- `422 Unprocessable Entity`: Validation errors

## Usage Examples

### Create an Equal Split Expense
```python
expense_data = {
    "description": "Group dinner",
    "amount": 120.0,
    "splits": [
        {"userId": "user_a", "amount": 40.0, "type": "equal"},
        {"userId": "user_b", "amount": 40.0, "type": "equal"},
        {"userId": "user_c", "amount": 40.0, "type": "equal"}
    ],
    "splitType": "equal",
    "tags": ["dinner", "group"]
}
```

### Record Manual Settlement
```python
settlement_data = {
    "payer_id": "user_a",
    "payee_id": "user_b", 
    "amount": 25.0,
    "description": "Cash payment for last week's lunch"
}
```

### Calculate Optimized Settlements
```python
# GET /groups/{group_id}/settlements/optimize?algorithm=advanced
# Returns minimized transaction list
```

## Performance Considerations

- Settlement calculations are cached for 15 minutes per group
- Friend balances cached for 10 minutes
- Analytics cached for 1 hour
- Pagination used for large datasets
- Database indexes on groupId, userId, createdAt

## Testing

Run tests with:
```bash
cd backend
python -m pytest tests/expenses/ -v
```

Test coverage includes:
- Settlement algorithm correctness
- Split validation
- API endpoint functionality
- Edge cases and error conditions
