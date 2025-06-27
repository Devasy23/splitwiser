import pytest
from unittest.mock import AsyncMock, patch
from app.expenses.service import ExpenseService
from app.expenses.schemas import ExpenseCreateRequest, ExpenseSplit, SplitType
import asyncio

@pytest.mark.asyncio
async def test_settlement_algorithm_normal():
    """Test normal settlement algorithm with mocked DB"""
    service = ExpenseService()
    group_id = "test_group_123"
    # Mock settlements in DB
    settlements = [
        {"payerId": "user_a", "payeeId": "user_b", "amount": 100, "payerName": "Alice", "payeeName": "Bob"},
        {"payerId": "user_b", "payeeId": "user_a", "amount": 50, "payerName": "Bob", "payeeName": "Alice"},
        {"payerId": "user_a", "payeeId": "user_c", "amount": 75, "payerName": "Alice", "payeeName": "Charlie"},
    ]
    with patch.object(service.settlements_collection, 'find', return_value=AsyncMock(to_list=AsyncMock(return_value=settlements))):
        optimized = await service._calculate_normal_settlements(group_id)
        # Alice owes Bob 50, Alice is owed 75 by Charlie
        assert any(o.fromUserId == "user_a" and o.toUserId == "user_b" and abs(o.amount - 50) < 0.01 for o in optimized)
        assert any(o.fromUserId == "user_c" and o.toUserId == "user_a" and abs(o.amount - 75) < 0.01 for o in optimized)

@pytest.mark.asyncio
async def test_settlement_algorithm_advanced():
    """Test advanced settlement algorithm with mocked DB"""
    service = ExpenseService()
    group_id = "test_group_456"
    settlements = [
        {"payerId": "user_a", "payeeId": "user_b", "amount": 100, "payerName": "A", "payeeName": "B"},
        {"payerId": "user_b", "payeeId": "user_c", "amount": 100, "payerName": "B", "payeeName": "C"},
    ]
    with patch.object(service.settlements_collection, 'find', return_value=AsyncMock(to_list=AsyncMock(return_value=settlements))):
        optimized = await service._calculate_advanced_settlements(group_id)
        # Should result in A pays C $100 directly
        assert len(optimized) == 1
        assert optimized[0].fromUserId == "user_a"
        assert optimized[0].toUserId == "user_c"
        assert abs(optimized[0].amount - 100) < 0.01

def test_expense_split_validation():
    """Test expense split validation"""
    splits = [
        ExpenseSplit(userId="user_a", amount=50.0),
        ExpenseSplit(userId="user_b", amount=50.0)
    ]
    expense_request = ExpenseCreateRequest(
        description="Test expense",
        amount=100.0,
        splits=splits
    )
    assert expense_request.amount == 100.0
    # Invalid split (doesn't sum to total)
    with pytest.raises(ValueError):
        invalid_splits = [
            ExpenseSplit(userId="user_a", amount=40.0),
            ExpenseSplit(userId="user_b", amount=50.0)
        ]
        ExpenseCreateRequest(
            description="Test expense",
            amount=100.0,
            splits=invalid_splits
        )

def test_split_types():
    """Test different split types"""
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
