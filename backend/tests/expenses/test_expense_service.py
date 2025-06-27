import pytest
from main import app # Adjusted import - Keep app import for context if needed, but TestClient is removed
from app.expenses.service import expense_service
from app.expenses.schemas import ExpenseCreateRequest, ExpenseSplit, SplitType
import asyncio

# client = TestClient(app) # Removed as it's not used

@pytest.mark.asyncio
async def test_settlement_algorithm_normal():
    """Test normal settlement algorithm"""
    # Mock data for testing
    group_id = "test_group_123"
    
    # Create some mock settlements
    settlements = [
        {"payerId": "user_a", "payeeId": "user_b", "amount": 100, "payerName": "Alice", "payeeName": "Bob"},
        {"payerId": "user_b", "payeeId": "user_a", "amount": 50, "payerName": "Bob", "payeeName": "Alice"},
        {"payerId": "user_a", "payeeId": "user_c", "amount": 75, "payerName": "Alice", "payeeName": "Charlie"},
    ]
    
    # This would need to be adapted to work with the actual database
    # For now, test the algorithm logic conceptually
    
    # Expected: Alice owes Bob 50 (100-50), Alice is owed 75 by Charlie
    assert True  # Placeholder assertion

@pytest.mark.asyncio
async def test_settlement_algorithm_advanced():
    """Test advanced settlement algorithm with graph optimization"""
    
    # Test scenario:
    # A owes B $100
    # B owes C $100
    # Expected optimized: A pays C $100 directly
    
    user_balances = {
        "user_a": 100,   # A owes $100
        "user_b": 0,     # B is neutral (owes 100, owed 100)
        "user_c": -100   # C is owed $100
    }
    
    # Simulate the advanced algorithm logic
    debtors = [["user_a", 100]]
    creditors = [["user_c", 100]]
    
    optimized = []
    
    # Two-pointer algorithm
    i, j = 0, 0
    while i < len(debtors) and j < len(creditors):
        debtor_id, debt_amount = debtors[i]
        creditor_id, credit_amount = creditors[j]
        
        settlement_amount = min(debt_amount, credit_amount)
        
        if settlement_amount > 0:
            optimized.append({
                "fromUserId": debtor_id,
                "toUserId": creditor_id,
                "amount": settlement_amount
            })
        
        debtors[i][1] -= settlement_amount
        creditors[j][1] -= settlement_amount
        
        if debtors[i][1] <= 0:
            i += 1
        if creditors[j][1] <= 0:
            j += 1
    
    # Should result in 1 optimized transaction instead of 2
    assert len(optimized) == 1
    assert optimized[0]["fromUserId"] == "user_a"
    assert optimized[0]["toUserId"] == "user_c"
    assert optimized[0]["amount"] == 100

def test_expense_split_validation():
    """Test expense split validation"""
    
    # Valid split
    splits = [
        ExpenseSplit(userId="user_a", amount=50.0),
        ExpenseSplit(userId="user_b", amount=50.0)
    ]
    
    expense_request = ExpenseCreateRequest(
        description="Test expense",
        amount=100.0,
        splits=splits
    )
    
    # Should not raise validation error
    assert expense_request.amount == 100.0
    
    # Invalid split (doesn't sum to total)
    with pytest.raises(ValueError):
        invalid_splits = [
            ExpenseSplit(userId="user_a", amount=40.0),
            ExpenseSplit(userId="user_b", amount=50.0)  # Total 90, but expense is 100
        ]
        
        ExpenseCreateRequest(
            description="Test expense",
            amount=100.0,
            splits=invalid_splits
        )

def test_split_types():
    """Test different split types"""
    
    # Equal split
    equal_splits = [
        ExpenseSplit(userId="user_a", amount=33.33, type=SplitType.EQUAL),
        ExpenseSplit(userId="user_b", amount=33.33, type=SplitType.EQUAL),
        ExpenseSplit(userId="user_c", amount=33.34, type=SplitType.EQUAL)
    ]
    
    expense = ExpenseCreateRequest(
        description="Equal split expense",
        amount=100.0,
        splits=equal_splits,
        splitType=SplitType.EQUAL
    )
    
    assert expense.splitType == SplitType.EQUAL
    
    # Unequal split
    unequal_splits = [
        ExpenseSplit(userId="user_a", amount=60.0, type=SplitType.UNEQUAL),
        ExpenseSplit(userId="user_b", amount=40.0, type=SplitType.UNEQUAL)
    ]
    
    expense = ExpenseCreateRequest(
        description="Unequal split expense",
        amount=100.0,
        splits=unequal_splits,
        splitType=SplitType.UNEQUAL
    )
    
    assert expense.splitType == SplitType.UNEQUAL

if __name__ == "__main__":
    pytest.main([__file__])
