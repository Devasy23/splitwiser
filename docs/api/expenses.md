# Expenses & Settlements API Documentation

This document provides a complete and definitive specification for the API endpoints related to managing expenses, settlements, balances, and analytics within groups. All endpoints require authentication and proper group membership.

---

## 1. Core Concepts & Business Logic

### **Expenses vs. Settlements**

* **Expense**: A single financial event, like "Dinner for $100," detailing who paid and how the cost is split among members.
* **Settlement**: A record of a specific debt created from an expense, such as "Alice owes Bob $50." When an expense is created, a settlement record is generated for each person who owes money. Manual settlements can also be created to record cash payments.

```python
# Algorithm steps:
1. Calculate net balance for each user (indegree - outdegree)
2. Sort users into debtors (positive balance) and creditors (negative balance)
3. Use two-pointer approach to match highest debtor with highest creditor
4. Continue until all balances are settled
```

### **Debt Optimization Algorithms**

The system uses two algorithms to simplify group debts into the minimum number of payments. This is a core feature for settling up.

* **Normal (`algorithm=normal`)**: A basic simplification that only nets out direct debts between two people. If Alice owes Bob $20 and Bob owes Alice $15, it simplifies to "Alice pays Bob $5."
* **Advanced (`algorithm=advanced`)**: A powerful graph-based algorithm that minimizes the total number of transactions for the entire group. It calculates the net balance of every member, separates them into "debtors" and "creditors," and then matches them to clear all debts with the fewest possible payments.

### **Database Collections**

* **`expenses`**: Stores all expense documents, including descriptions, amounts, splits, and history.
* **`settlements`**: Stores all individual debt records generated from expenses or created manually.
* **`groups`** & **`users`**: Used to verify user membership, permissions, and retrieve user details like names for responses.

---

## 2. Expense Management

These endpoints handle the creation, retrieval, updating, and deletion of expenses. All endpoints are prefixed with `/groups/{group_id}`.

### **`POST /expenses`**

Creates a new expense within a specified group.

* **Server-Side Logic**:
    1.  Verifies the user is a member of the group.
    2.  Creates the expense document in the `expenses` collection.
    3.  Generates corresponding `pending` settlement records for each person who owes money.
    4.  Returns the new expense object along with the generated settlements and a group summary.
* **Request Body** (`ExpenseCreateRequest`):

    ### example usage:

    ```json
    {
      "description": "Team Dinner",  // max_length=500
      "amount": 150.75,
      "splits": [
        { "userId": "user_id_1", "amount": 50.25, "type": "equal" },
        { "userId": "user_id_2", "amount": 100.50, "type": "unequal" }
      ],
      "splitType": "unequal",
      "paidBy": "user_id_2", //User ID of who paid for the expense
      "tags": ["food", "social"],
      "receiptUrls": ["https://www.ramacheif.com/receipt/1234567890"]
    }
    ```
* **Response** (`ExpenseCreateResponse`):

    ### example usage:

    ```json
    {
      "expense": { /* ... ExpenseResponse object ... */ },
      "settlements": [ /* ... list of Settlement objects ... */ ],
      "groupSummary": { /* ... GroupSummary object ... */ }
    }
    ```

### **`GET /expenses`**

Lists all expenses for a group with support for pagination and filtering.

* **Query Parameters**:
    * `page`, `limit`, `from`, `to`, `tags`.
* **Response** (`ExpenseListResponse`):
    ```json
    {
      "expenses": [ /* ... list of ExpenseResponse objects ... */ ],
      "pagination": { /* ... pagination details ... */ },
      "summary": { "totalAmount": 1234.56, "expenseCount": 50, "avgExpense": 24.69 }
    }
    ```

### **`GET /expenses/{expense_id}`**

Retrieves the details for a single expense and its related settlements.

* **Response**: A dictionary containing the `ExpenseResponse` object and a list of all `Settlement` objects associated with it.

### **`PATCH /expenses/{expense_id}`**

Updates an existing expense.

* **Server-Side Logic**:
    1.  Verifies that the user attempting the update is the one who originally created the expense.
    2.  Creates a history entry to log the changes.
    3.  If the amount or splits are modified, it deletes all old settlements for that expense and recalculates new ones.
* **Request Body** (`ExpenseUpdateRequest`):
    ```json
    {
      "description": "Updated description for groceries",
      "tags": ["household", "urgent"]
    }
    ```
* **Response** (`ExpenseResponse`): Returns the complete, updated expense object.

### **`DELETE /expenses/{expense_id}`**

Deletes an expense.

* **Server-Side Logic**:
    1.  Verifies the user is the creator of the expense.
    2.  Deletes all associated settlement records.
    3.  Deletes the expense document itself.
* **Successful Response**: `{"success": True}`

---

## 3. Settlement Management

### **`POST /settlements`**

Manually records a payment settlement between two users. This is for tracking payments made outside the app (e.g., cash).

* **Request Body** (`SettlementCreateRequest`):
    ```json
    {
        "payer_id": "user_id_1",
        "payee_id": "user_id_2",
        "amount": 25.00,
        "description": "Paid back for coffee"
    }
    ```
* **Response** (`Settlement`): Returns the newly created `completed` settlement object.

### **`GET /settlements`**

Retrieves a list of both pending and optimized settlements for a group.

* **Response** (`SettlementListResponse`): Contains a list of raw settlements, a list of `OptimizedSettlement` objects, and a summary.

### **`PATCH /settlements/{settlement_id}`**

Updates the status of a settlement (e.g., marks it as paid).

* **Request Body** (`SettlementUpdateRequest`):
    ```json
    {
        "status": "completed",
        "paidAt": "2025-08-13T14:00:00Z"
    }
    ```
* **Response** (`Settlement`): Returns the updated settlement object.

### **`POST /settlements/optimize`**

Calculates and returns the most efficient way to settle all debts in a group.

* **Query Parameters**:
    * `algorithm`: `normal` or `advanced` (default).
* **Response** (`OptimizedSettlementsResponse`):
    ```json
    {
      "optimizedSettlements": [ /* ... list of OptimizedSettlement objects ... */ ],
      "savings": {
        "originalTransactions": 15,
        "optimizedTransactions": 4,
        "reductionPercentage": 73.3
      }
    }
    ```

---

## 4. Balance & Analytics Endpoints

### **User-Centric Balances (prefixed with `/users/me`)**

* **`GET /friends-balance`**: Retrieves the current user's aggregated net balance with every friend across all shared groups.
* **`GET /balance-summary`**: Retrieves the user's overall financial summary: total amount owed to them, total amount they owe, and a breakdown of their balance in each group.

### **Group-Specific Balances & Analytics (prefixed with `/groups/{group_id}`)**

* **`GET /users/{user_id}/balance`**: Gets a specific user's detailed balance within one particular group.
* **`GET /analytics`**: Provides detailed expense analytics for the group over a specified period (`week`, `month`, `year`), including total spend, top categories, member contributions, and daily spending trends.

---

## 5. Expense Attachments

* **`POST /expenses/{expense_id}/attachments`**: Uploads a file (e.g., a receipt) for an expense.
* **`GET /expenses/{expense_id}/attachments/{key}`**: Downloads a previously uploaded file. *(Note: Not fully implemented).*
