import pytest
from pydantic import ValidationError
from datetime import datetime

from backend.schemas.expenses_schemas import (
    SplitType,
    SettlementStatus,
    ExpenseSplit,
    ExpenseCreateRequest,
    ExpenseUpdateRequest,
    ExpenseComment,
    ExpenseHistoryEntry,
    ExpenseResponse,
    Settlement,
    OptimizedSettlement,
    GroupSummary,
    ExpenseListResponse,
    SettlementCreateRequest,
    SettlementUpdateRequest,
    SettlementListResponse,
    UserBalance,
    FriendBalanceBreakdown,
    FriendBalance,
    FriendsBalanceResponse,
    BalanceSummaryResponse,
    ExpenseAnalytics,
    AttachmentUploadResponse,
    OptimizedSettlementsResponse
)


class TestSplitType:
    """Test the SplitType enum."""
    
    def test_valid_split_types(self):
        """Test that all valid split types are accepted."""
        assert SplitType.EQUAL == "equal"
        assert SplitType.UNEQUAL == "unequal"
        assert SplitType.PERCENTAGE == "percentage"
        
    def test_split_type_values(self):
        """Test that split type enum has correct values."""
        valid_values = {"equal", "unequal", "percentage"}
        enum_values = {item.value for item in SplitType}
        assert enum_values == valid_values


class TestSettlementStatus:
    """Test the SettlementStatus enum."""
    
    def test_valid_settlement_statuses(self):
        """Test that all valid settlement statuses are accepted."""
        assert SettlementStatus.PENDING == "pending"
        assert SettlementStatus.COMPLETED == "completed"
        assert SettlementStatus.CANCELLED == "cancelled"
        
    def test_settlement_status_values(self):
        """Test that settlement status enum has correct values."""
        valid_values = {"pending", "completed", "cancelled"}
        enum_values = {item.value for item in SettlementStatus}
        assert enum_values == valid_values


class TestExpenseSplit:
    """Test the ExpenseSplit model."""
    
    def test_valid_expense_split(self):
        """Test creating a valid expense split."""
        split = ExpenseSplit(
            userId="user123",
            amount=25.50,
            type=SplitType.EQUAL
        )
        assert split.userId == "user123"
        assert split.amount == 25.50
        assert split.type == SplitType.EQUAL
        
    def test_expense_split_default_type(self):
        """Test that default split type is EQUAL."""
        split = ExpenseSplit(userId="user123", amount=25.50)
        assert split.type == SplitType.EQUAL
        
    def test_expense_split_zero_amount(self):
        """Test that zero amount raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ExpenseSplit(userId="user123", amount=0)
        assert "greater than 0" in str(exc_info.value)
        
    def test_expense_split_negative_amount(self):
        """Test that negative amount raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ExpenseSplit(userId="user123", amount=-10.50)
        assert "greater than 0" in str(exc_info.value)
        
    def test_expense_split_missing_user_id(self):
        """Test that missing userId raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ExpenseSplit(amount=25.50)
        assert "field required" in str(exc_info.value).lower()
        
    def test_expense_split_empty_user_id(self):
        """Test that empty userId is accepted (validation should be done at business logic level)."""
        split = ExpenseSplit(userId="", amount=25.50)
        assert split.userId == ""
        
    def test_expense_split_different_types(self):
        """Test different split types."""
        for split_type in SplitType:
            split = ExpenseSplit(userId="user123", amount=25.50, type=split_type)
            assert split.type == split_type


class TestExpenseCreateRequest:
    """Test the ExpenseCreateRequest model."""
    
    def test_valid_expense_create_request(self):
        """Test creating a valid expense create request."""
        splits = [
            ExpenseSplit(userId="user1", amount=25.00),
            ExpenseSplit(userId="user2", amount=25.00)
        ]
        request = ExpenseCreateRequest(
            description="Dinner at restaurant",
            amount=50.00,
            splits=splits,
            splitType=SplitType.EQUAL,
            tags=["food", "dinner"],
            receiptUrls=["https://example.com/receipt1.jpg"]
        )
        assert request.description == "Dinner at restaurant"
        assert request.amount == 50.00
        assert len(request.splits) == 2
        assert request.splitType == SplitType.EQUAL
        assert request.tags == ["food", "dinner"]
        assert request.receiptUrls == ["https://example.com/receipt1.jpg"]
        
    def test_expense_create_request_defaults(self):
        """Test default values for optional fields."""
        splits = [ExpenseSplit(userId="user1", amount=50.00)]
        request = ExpenseCreateRequest(
            description="Test expense",
            amount=50.00,
            splits=splits
        )
        assert request.splitType == SplitType.EQUAL
        assert request.tags == []
        assert request.receiptUrls == []
        
    def test_expense_create_request_empty_description(self):
        """Test that empty description raises validation error."""
        splits = [ExpenseSplit(userId="user1", amount=50.00)]
        with pytest.raises(ValidationError) as exc_info:
            ExpenseCreateRequest(
                description="",
                amount=50.00,
                splits=splits
            )
        assert "at least 1 character" in str(exc_info.value)
        
    def test_expense_create_request_long_description(self):
        """Test that description longer than 500 characters raises validation error."""
        splits = [ExpenseSplit(userId="user1", amount=50.00)]
        long_description = "a" * 501
        with pytest.raises(ValidationError) as exc_info:
            ExpenseCreateRequest(
                description=long_description,
                amount=50.00,
                splits=splits
            )
        assert "at most 500 characters" in str(exc_info.value)
        
    def test_expense_create_request_zero_amount(self):
        """Test that zero amount raises validation error."""
        splits = [ExpenseSplit(userId="user1", amount=50.00)]
        with pytest.raises(ValidationError) as exc_info:
            ExpenseCreateRequest(
                description="Test",
                amount=0,
                splits=splits
            )
        assert "greater than 0" in str(exc_info.value)
        
    def test_expense_create_request_negative_amount(self):
        """Test that negative amount raises validation error."""
        splits = [ExpenseSplit(userId="user1", amount=50.00)]
        with pytest.raises(ValidationError) as exc_info:
            ExpenseCreateRequest(
                description="Test",
                amount=-10.50,
                splits=splits
            )
        assert "greater than 0" in str(exc_info.value)
        
    def test_expense_create_request_splits_sum_validation_valid(self):
        """Test that splits summing to total amount pass validation."""
        splits = [
            ExpenseSplit(userId="user1", amount=30.00),
            ExpenseSplit(userId="user2", amount=20.00)
        ]
        request = ExpenseCreateRequest(
            description="Test",
            amount=50.00,
            splits=splits
        )
        assert request.amount == 50.00
        
    def test_expense_create_request_splits_sum_validation_invalid(self):
        """Test that splits not summing to total amount raise validation error."""
        splits = [
            ExpenseSplit(userId="user1", amount=30.00),
            ExpenseSplit(userId="user2", amount=15.00)  # Total: 45, but amount is 50
        ]
        with pytest.raises(ValidationError) as exc_info:
            ExpenseCreateRequest(
                description="Test",
                amount=50.00,
                splits=splits
            )
        assert "Split amounts must sum to total expense amount" in str(exc_info.value)
        
    def test_expense_create_request_splits_sum_validation_floating_point_tolerance(self):
        """Test that small floating point differences are tolerated."""
        splits = [
            ExpenseSplit(userId="user1", amount=33.333),
            ExpenseSplit(userId="user2", amount=33.334),
            ExpenseSplit(userId="user3", amount=33.333)
        ]
        # Total: 100.000, but with floating point precision might be 99.999999...
        request = ExpenseCreateRequest(
            description="Test",
            amount=100.00,
            splits=splits
        )
        assert request.amount == 100.00
        
    def test_expense_create_request_empty_splits(self):
        """Test that empty splits list is allowed."""
        request = ExpenseCreateRequest(
            description="Test",
            amount=50.00,
            splits=[]
        )
        assert len(request.splits) == 0
        
    def test_expense_create_request_none_tags(self):
        """Test that None tags defaults to empty list."""
        splits = [ExpenseSplit(userId="user1", amount=50.00)]
        request = ExpenseCreateRequest(
            description="Test",
            amount=50.00,
            splits=splits,
            tags=None
        )
        assert request.tags == []
        
    def test_expense_create_request_none_receipt_urls(self):
        """Test that None receiptUrls defaults to empty list."""
        splits = [ExpenseSplit(userId="user1", amount=50.00)]
        request = ExpenseCreateRequest(
            description="Test",
            amount=50.00,
            splits=splits,
            receiptUrls=None
        )
        assert request.receiptUrls == []


class TestExpenseUpdateRequest:
    """Test the ExpenseUpdateRequest model."""
    
    def test_valid_expense_update_request_full(self):
        """Test creating a valid expense update request with all fields."""
        splits = [
            ExpenseSplit(userId="user1", amount=30.00),
            ExpenseSplit(userId="user2", amount=20.00)
        ]
        request = ExpenseUpdateRequest(
            description="Updated dinner",
            amount=50.00,
            splits=splits,
            tags=["food", "updated"],
            receiptUrls=["https://example.com/updated_receipt.jpg"]
        )
        assert request.description == "Updated dinner"
        assert request.amount == 50.00
        assert len(request.splits) == 2
        assert request.tags == ["food", "updated"]
        assert request.receiptUrls == ["https://example.com/updated_receipt.jpg"]
        
    def test_expense_update_request_partial(self):
        """Test creating a partial expense update request."""
        request = ExpenseUpdateRequest(description="Just updating description")
        assert request.description == "Just updating description"
        assert request.amount is None
        assert request.splits is None
        assert request.tags is None
        assert request.receiptUrls is None
        
    def test_expense_update_request_empty_description(self):
        """Test that empty description raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ExpenseUpdateRequest(description="")
        assert "at least 1 character" in str(exc_info.value)
        
    def test_expense_update_request_long_description(self):
        """Test that description longer than 500 characters raises validation error."""
        long_description = "a" * 501
        with pytest.raises(ValidationError) as exc_info:
            ExpenseUpdateRequest(description=long_description)
        assert "at most 500 characters" in str(exc_info.value)
        
    def test_expense_update_request_zero_amount(self):
        """Test that zero amount raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ExpenseUpdateRequest(amount=0)
        assert "greater than 0" in str(exc_info.value)
        
    def test_expense_update_request_negative_amount(self):
        """Test that negative amount raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ExpenseUpdateRequest(amount=-10.50)
        assert "greater than 0" in str(exc_info.value)
        
    def test_expense_update_request_splits_validation_with_amount(self):
        """Test splits validation when both splits and amount are provided."""
        splits = [
            ExpenseSplit(userId="user1", amount=30.00),
            ExpenseSplit(userId="user2", amount=15.00)  # Total: 45, but amount is 50
        ]
        with pytest.raises(ValidationError) as exc_info:
            ExpenseUpdateRequest(amount=50.00, splits=splits)
        assert "Split amounts must sum to total expense amount" in str(exc_info.value)
        
    def test_expense_update_request_splits_without_amount(self):
        """Test that splits without amount do not trigger validation."""
        splits = [
            ExpenseSplit(userId="user1", amount=30.00),
            ExpenseSplit(userId="user2", amount=15.00)
        ]
        request = ExpenseUpdateRequest(splits=splits)
        assert len(request.splits) == 2
        
    def test_expense_update_request_amount_without_splits(self):
        """Test that amount without splits does not trigger validation."""
        request = ExpenseUpdateRequest(amount=50.00)
        assert request.amount == 50.00
        
    def test_expense_update_request_validate_assignment(self):
        """Test that validate_assignment is enabled."""
        request = ExpenseUpdateRequest()
        assert request.__config__.validate_assignment is True


class TestExpenseComment:
    """Test the ExpenseComment model."""
    
    def test_valid_expense_comment(self):
        """Test creating a valid expense comment."""
        now = datetime.now()
        comment = ExpenseComment(
            _id="comment123",
            userId="user123",
            userName="John Doe",
            content="This looks correct",
            createdAt=now
        )
        assert comment.id == "comment123"
        assert comment.userId == "user123"
        assert comment.userName == "John Doe"
        assert comment.content == "This looks correct"
        assert comment.createdAt == now
        
    def test_expense_comment_alias_field(self):
        """Test that _id field maps to id attribute."""
        comment = ExpenseComment(
            _id="comment123",
            userId="user123",
            userName="John Doe",
            content="Test",
            createdAt=datetime.now()
        )
        assert comment.id == "comment123"
        
    def test_expense_comment_populate_by_name(self):
        """Test populate_by_name configuration."""
        data = {
            "id": "comment123",
            "userId": "user123",
            "userName": "John Doe",
            "content": "Test",
            "createdAt": datetime.now()
        }
        comment = ExpenseComment(**data)
        assert comment.id == "comment123"
        
    def test_expense_comment_str_strip_whitespace(self):
        """Test that whitespace is stripped from string fields."""
        comment = ExpenseComment(
            _id="comment123",
            userId=" user123 ",
            userName=" John Doe ",
            content=" This looks correct ",
            createdAt=datetime.now()
        )
        assert comment.userId == "user123"
        assert comment.userName == "John Doe"
        assert comment.content == "This looks correct"
        
    def test_expense_comment_missing_fields(self):
        """Test that missing required fields raise validation error."""
        with pytest.raises(ValidationError) as exc_info:
            ExpenseComment(userId="user123")
        assert "field required" in str(exc_info.value).lower()


class TestExpenseHistoryEntry:
    """Test the ExpenseHistoryEntry model."""
    
    def test_valid_expense_history_entry(self):
        """Test creating a valid expense history entry."""
        now = datetime.now()
        before_data = {"amount": 100.0, "description": "Old description"}
        entry = ExpenseHistoryEntry(
            _id="history123",
            userId="user123",
            userName="John Doe",
            beforeData=before_data,
            editedAt=now
        )
        assert entry.id == "history123"
        assert entry.userId == "user123"
        assert entry.userName == "John Doe"
        assert entry.beforeData == before_data
        assert entry.editedAt == now
        
    def test_expense_history_entry_alias_field(self):
        """Test that _id field maps to id attribute."""
        entry = ExpenseHistoryEntry(
            _id="history123",
            userId="user123",
            userName="John Doe",
            beforeData={},
            editedAt=datetime.now()
        )
        assert entry.id == "history123"
        
    def test_expense_history_entry_empty_before_data(self):
        """Test that empty beforeData is allowed."""
        entry = ExpenseHistoryEntry(
            _id="history123",
            userId="user123",
            userName="John Doe",
            beforeData={},
            editedAt=datetime.now()
        )
        assert entry.beforeData == {}
        
    def test_expense_history_entry_complex_before_data(self):
        """Test that complex beforeData structures are handled."""
        complex_data = {
            "amount": 100.0,
            "description": "Old description",
            "splits": [{"userId": "user1", "amount": 50.0}],
            "nested": {"key": "value", "number": 42}
        }
        entry = ExpenseHistoryEntry(
            _id="history123",
            userId="user123",
            userName="John Doe",
            beforeData=complex_data,
            editedAt=datetime.now()
        )
        assert entry.beforeData == complex_data


class TestExpenseResponse:
    """Test the ExpenseResponse model."""
    
    def test_valid_expense_response(self):
        """Test creating a valid expense response."""
        now = datetime.now()
        splits = [ExpenseSplit(userId="user1", amount=50.0)]
        comments = [ExpenseComment(
            _id="comment1",
            userId="user1",
            userName="User One",
            content="Test comment",
            createdAt=now
        )]
        history = [ExpenseHistoryEntry(
            _id="history1",
            userId="user1",
            userName="User One",
            beforeData={"amount": 40.0},
            editedAt=now
        )]
        
        response = ExpenseResponse(
            _id="expense123",
            groupId="group123",
            createdBy="user123",
            description="Test expense",
            amount=50.0,
            splits=splits,
            splitType=SplitType.EQUAL,
            tags=["test"],
            receiptUrls=["https://example.com/receipt.jpg"],
            comments=comments,
            history=history,
            createdAt=now,
            updatedAt=now
        )
        
        assert response.id == "expense123"
        assert response.groupId == "group123"
        assert response.createdBy == "user123"
        assert response.description == "Test expense"
        assert response.amount == 50.0
        assert len(response.splits) == 1
        assert response.splitType == SplitType.EQUAL
        assert response.tags == ["test"]
        assert response.receiptUrls == ["https://example.com/receipt.jpg"]
        assert len(response.comments) == 1
        assert len(response.history) == 1
        assert response.createdAt == now
        assert response.updatedAt == now
        
    def test_expense_response_defaults(self):
        """Test default values for optional fields."""
        now = datetime.now()
        splits = [ExpenseSplit(userId="user1", amount=50.0)]
        
        response = ExpenseResponse(
            _id="expense123",
            groupId="group123",
            createdBy="user123",
            description="Test expense",
            amount=50.0,
            splits=splits,
            splitType=SplitType.EQUAL,
            createdAt=now,
            updatedAt=now
        )
        
        assert response.tags == []
        assert response.receiptUrls == []
        assert response.comments == []
        assert response.history == []
        
    def test_expense_response_alias_field(self):
        """Test that _id field maps to id attribute."""
        now = datetime.now()
        splits = [ExpenseSplit(userId="user1", amount=50.0)]
        
        response = ExpenseResponse(
            _id="expense123",
            groupId="group123",
            createdBy="user123",
            description="Test expense",
            amount=50.0,
            splits=splits,
            splitType=SplitType.EQUAL,
            createdAt=now,
            updatedAt=now
        )
        
        assert response.id == "expense123"


class TestSettlement:
    """Test the Settlement model."""
    
    def test_valid_settlement_with_expense(self):
        """Test creating a valid settlement linked to an expense."""
        now = datetime.now()
        settlement = Settlement(
            _id="settlement123",
            expenseId="expense123",
            groupId="group123",
            payerId="user1",
            payeeId="user2",
            payerName="User One",
            payeeName="User Two",
            amount=25.0,
            status=SettlementStatus.PENDING,
            description="Split from dinner expense",
            paidAt=None,
            createdAt=now
        )
        
        assert settlement.id == "settlement123"
        assert settlement.expenseId == "expense123"
        assert settlement.groupId == "group123"
        assert settlement.payerId == "user1"
        assert settlement.payeeId == "user2"
        assert settlement.payerName == "User One"
        assert settlement.payeeName == "User Two"
        assert settlement.amount == 25.0
        assert settlement.status == SettlementStatus.PENDING
        assert settlement.description == "Split from dinner expense"
        assert settlement.paidAt is None
        assert settlement.createdAt == now
        
    def test_valid_manual_settlement(self):
        """Test creating a valid manual settlement (no expenseId)."""
        now = datetime.now()
        settlement = Settlement(
            _id="settlement123",
            expenseId=None,
            groupId="group123",
            payerId="user1",
            payeeId="user2",
            payerName="User One",
            payeeName="User Two",
            amount=100.0,
            status=SettlementStatus.COMPLETED,
            description="Manual payment",
            paidAt=now,
            createdAt=now
        )
        
        assert settlement.expenseId is None
        assert settlement.status == SettlementStatus.COMPLETED
        assert settlement.paidAt == now
        
    def test_settlement_alias_field(self):
        """Test that _id field maps to id attribute."""
        settlement = Settlement(
            _id="settlement123",
            groupId="group123",
            payerId="user1",
            payeeId="user2",
            payerName="User One",
            payeeName="User Two",
            amount=25.0,
            status=SettlementStatus.PENDING,
            createdAt=datetime.now()
        )
        assert settlement.id == "settlement123"
        
    def test_settlement_optional_fields(self):
        """Test that optional fields can be None."""
        settlement = Settlement(
            _id="settlement123",
            groupId="group123",
            payerId="user1",
            payeeId="user2",
            payerName="User One",
            payeeName="User Two",
            amount=25.0,
            status=SettlementStatus.PENDING,
            createdAt=datetime.now()
        )
        assert settlement.expenseId is None
        assert settlement.description is None
        assert settlement.paidAt is None


class TestOptimizedSettlement:
    """Test the OptimizedSettlement model."""
    
    def test_valid_optimized_settlement(self):
        """Test creating a valid optimized settlement."""
        settlement = OptimizedSettlement(
            fromUserId="user1",
            toUserId="user2",
            fromUserName="User One",
            toUserName="User Two",
            amount=75.0,
            consolidatedExpenses=["expense1", "expense2", "expense3"]
        )
        
        assert settlement.fromUserId == "user1"
        assert settlement.toUserId == "user2"
        assert settlement.fromUserName == "User One"
        assert settlement.toUserName == "User Two"
        assert settlement.amount == 75.0
        assert settlement.consolidatedExpenses == ["expense1", "expense2", "expense3"]
        
    def test_optimized_settlement_default_consolidated_expenses(self):
        """Test that consolidatedExpenses defaults to empty list."""
        settlement = OptimizedSettlement(
            fromUserId="user1",
            toUserId="user2",
            fromUserName="User One",
            toUserName="User Two",
            amount=75.0
        )
        assert settlement.consolidatedExpenses == []
        
    def test_optimized_settlement_none_consolidated_expenses(self):
        """Test that None consolidatedExpenses is allowed."""
        settlement = OptimizedSettlement(
            fromUserId="user1",
            toUserId="user2",
            fromUserName="User One",
            toUserName="User Two",
            amount=75.0,
            consolidatedExpenses=None
        )
        assert settlement.consolidatedExpenses is None


class TestGroupSummary:
    """Test the GroupSummary model."""
    
    def test_valid_group_summary(self):
        """Test creating a valid group summary."""
        optimized_settlements = [
            OptimizedSettlement(
                fromUserId="user1",
                toUserId="user2",
                fromUserName="User One",
                toUserName="User Two",
                amount=50.0
            )
        ]
        
        summary = GroupSummary(
            totalExpenses=200.0,
            totalSettlements=3,
            optimizedSettlements=optimized_settlements
        )
        
        assert summary.totalExpenses == 200.0
        assert summary.totalSettlements == 3
        assert len(summary.optimizedSettlements) == 1
        
    def test_group_summary_empty_optimized_settlements(self):
        """Test group summary with empty optimized settlements."""
        summary = GroupSummary(
            totalExpenses=0.0,
            totalSettlements=0,
            optimizedSettlements=[]
        )
        
        assert summary.totalExpenses == 0.0
        assert summary.totalSettlements == 0
        assert len(summary.optimizedSettlements) == 0


class TestSettlementCreateRequest:
    """Test the SettlementCreateRequest model."""
    
    def test_valid_settlement_create_request(self):
        """Test creating a valid settlement create request."""
        now = datetime.now()
        request = SettlementCreateRequest(
            payer_id="user1",
            payee_id="user2",
            amount=100.0,
            description="Payment for dinner",
            paidAt=now
        )
        
        assert request.payer_id == "user1"
        assert request.payee_id == "user2"
        assert request.amount == 100.0
        assert request.description == "Payment for dinner"
        assert request.paidAt == now
        
    def test_settlement_create_request_minimal(self):
        """Test creating settlement create request with minimal fields."""
        request = SettlementCreateRequest(
            payer_id="user1",
            payee_id="user2",
            amount=100.0
        )
        
        assert request.payer_id == "user1"
        assert request.payee_id == "user2"
        assert request.amount == 100.0
        assert request.description is None
        assert request.paidAt is None
        
    def test_settlement_create_request_zero_amount(self):
        """Test that zero amount raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            SettlementCreateRequest(
                payer_id="user1",
                payee_id="user2",
                amount=0
            )
        assert "greater than 0" in str(exc_info.value)
        
    def test_settlement_create_request_negative_amount(self):
        """Test that negative amount raises validation error."""
        with pytest.raises(ValidationError) as exc_info:
            SettlementCreateRequest(
                payer_id="user1",
                payee_id="user2",
                amount=-50.0
            )
        assert "greater than 0" in str(exc_info.value)


class TestSettlementUpdateRequest:
    """Test the SettlementUpdateRequest model."""
    
    def test_valid_settlement_update_request(self):
        """Test creating a valid settlement update request."""
        now = datetime.now()
        request = SettlementUpdateRequest(
            status=SettlementStatus.COMPLETED,
            paidAt=now
        )
        
        assert request.status == SettlementStatus.COMPLETED
        assert request.paidAt == now
        
    def test_settlement_update_request_pending_status(self):
        """Test settlement update with pending status."""
        request = SettlementUpdateRequest(
            status=SettlementStatus.PENDING
        )
        
        assert request.status == SettlementStatus.PENDING
        assert request.paidAt is None
        
    def test_settlement_update_request_cancelled_status(self):
        """Test settlement update with cancelled status."""
        request = SettlementUpdateRequest(
            status=SettlementStatus.CANCELLED
        )
        
        assert request.status == SettlementStatus.CANCELLED
        assert request.paidAt is None


class TestUserBalance:
    """Test the UserBalance model."""
    
    def test_valid_user_balance(self):
        """Test creating a valid user balance."""
        settlements = [
            Settlement(
                _id="settlement1",
                groupId="group1",
                payerId="user1",
                payeeId="user2",
                payerName="User One",
                payeeName="User Two",
                amount=50.0,
                status=SettlementStatus.PENDING,
                createdAt=datetime.now()
            )
        ]
        
        recent_expenses = [{"id": "expense1", "amount": 100.0}]
        
        balance = UserBalance(
            userId="user123",
            userName="John Doe",
            totalPaid=200.0,
            totalOwed=150.0,
            netBalance=50.0,
            owesYou=True,
            pendingSettlements=settlements,
            recentExpenses=recent_expenses
        )
        
        assert balance.userId == "user123"
        assert balance.userName == "John Doe"
        assert balance.totalPaid == 200.0
        assert balance.totalOwed == 150.0
        assert balance.netBalance == 50.0
        assert balance.owesYou is True
        assert len(balance.pendingSettlements) == 1
        assert len(balance.recentExpenses) == 1
        
    def test_user_balance_defaults(self):
        """Test default values for optional fields."""
        balance = UserBalance(
            userId="user123",
            userName="John Doe",
            totalPaid=200.0,
            totalOwed=150.0,
            netBalance=50.0,
            owesYou=False
        )
        
        assert balance.pendingSettlements == []
        assert balance.recentExpenses == []
        assert balance.owesYou is False
        
    def test_user_balance_negative_amounts(self):
        """Test user balance with negative amounts."""
        balance = UserBalance(
            userId="user123",
            userName="John Doe",
            totalPaid=100.0,
            totalOwed=150.0,
            netBalance=-50.0,
            owesYou=False
        )
        
        assert balance.netBalance == -50.0
        assert balance.owesYou is False


class TestFriendBalance:
    """Test the FriendBalance model."""
    
    def test_valid_friend_balance(self):
        """Test creating a valid friend balance."""
        breakdown = [
            FriendBalanceBreakdown(
                groupId="group1",
                groupName="Group One",
                balance=25.0,
                owesYou=True
            ),
            FriendBalanceBreakdown(
                groupId="group2",
                groupName="Group Two",
                balance=-15.0,
                owesYou=False
            )
        ]
        
        now = datetime.now()
        friend_balance = FriendBalance(
            userId="friend123",
            userName="Friend Name",
            userImageUrl="https://example.com/avatar.jpg",
            netBalance=10.0,
            owesYou=True,
            breakdown=breakdown,
            lastActivity=now
        )
        
        assert friend_balance.userId == "friend123"
        assert friend_balance.userName == "Friend Name"
        assert friend_balance.userImageUrl == "https://example.com/avatar.jpg"
        assert friend_balance.netBalance == 10.0
        assert friend_balance.owesYou is True
        assert len(friend_balance.breakdown) == 2
        assert friend_balance.lastActivity == now
        
    def test_friend_balance_no_image_url(self):
        """Test friend balance without image URL."""
        breakdown = []
        
        friend_balance = FriendBalance(
            userId="friend123",
            userName="Friend Name",
            netBalance=0.0,
            owesYou=False,
            breakdown=breakdown,
            lastActivity=datetime.now()
        )
        
        assert friend_balance.userImageUrl is None
        assert len(friend_balance.breakdown) == 0


class TestFriendBalanceBreakdown:
    """Test the FriendBalanceBreakdown model."""
    
    def test_valid_friend_balance_breakdown(self):
        """Test creating a valid friend balance breakdown."""
        breakdown = FriendBalanceBreakdown(
            groupId="group123",
            groupName="Roommates",
            balance=75.50,
            owesYou=True
        )
        
        assert breakdown.groupId == "group123"
        assert breakdown.groupName == "Roommates"
        assert breakdown.balance == 75.50
        assert breakdown.owesYou is True
        
    def test_friend_balance_breakdown_negative_balance(self):
        """Test friend balance breakdown with negative balance."""
        breakdown = FriendBalanceBreakdown(
            groupId="group123",
            groupName="Roommates",
            balance=-25.0,
            owesYou=False
        )
        
        assert breakdown.balance == -25.0
        assert breakdown.owesYou is False
        
    def test_friend_balance_breakdown_zero_balance(self):
        """Test friend balance breakdown with zero balance."""
        breakdown = FriendBalanceBreakdown(
            groupId="group123",
            groupName="Roommates",
            balance=0.0,
            owesYou=False
        )
        
        assert breakdown.balance == 0.0
        assert breakdown.owesYou is False


class TestBalanceSummaryResponse:
    """Test the BalanceSummaryResponse model."""
    
    def test_valid_balance_summary_response(self):
        """Test creating a valid balance summary response."""
        groups_summary = [
            {"groupId": "group1", "groupName": "Group One", "balance": 50.0},
            {"groupId": "group2", "groupName": "Group Two", "balance": -25.0}
        ]
        
        response = BalanceSummaryResponse(
            totalOwedToYou=100.0,
            totalYouOwe=75.0,
            netBalance=25.0,
            currency="EUR",
            groupsSummary=groups_summary
        )
        
        assert response.totalOwedToYou == 100.0
        assert response.totalYouOwe == 75.0
        assert response.netBalance == 25.0
        assert response.currency == "EUR"
        assert len(response.groupsSummary) == 2
        
    def test_balance_summary_response_default_currency(self):
        """Test default currency value."""
        response = BalanceSummaryResponse(
            totalOwedToYou=100.0,
            totalYouOwe=75.0,
            netBalance=25.0,
            groupsSummary=[]
        )
        
        assert response.currency == "USD"
        
    def test_balance_summary_response_negative_balances(self):
        """Test balance summary with negative values."""
        response = BalanceSummaryResponse(
            totalOwedToYou=50.0,
            totalYouOwe=100.0,
            netBalance=-50.0,
            groupsSummary=[]
        )
        
        assert response.totalOwedToYou == 50.0
        assert response.totalYouOwe == 100.0
        assert response.netBalance == -50.0


class TestExpenseAnalytics:
    """Test the ExpenseAnalytics model."""
    
    def test_valid_expense_analytics(self):
        """Test creating valid expense analytics."""
        top_categories = [
            {"category": "Food", "amount": 500.0, "count": 20},
            {"category": "Transport", "amount": 200.0, "count": 8}
        ]
        
        member_contributions = [
            {"userId": "user1", "userName": "User One", "amount": 300.0},
            {"userId": "user2", "userName": "User Two", "amount": 400.0}
        ]
        
        expense_trends = [
            {"month": "2024-01", "amount": 250.0},
            {"month": "2024-02", "amount": 450.0}
        ]
        
        analytics = ExpenseAnalytics(
            period="monthly",
            totalExpenses=700.0,
            expenseCount=28,
            avgExpenseAmount=25.0,
            topCategories=top_categories,
            memberContributions=member_contributions,
            expenseTrends=expense_trends
        )
        
        assert analytics.period == "monthly"
        assert analytics.totalExpenses == 700.0
        assert analytics.expenseCount == 28
        assert analytics.avgExpenseAmount == 25.0
        assert len(analytics.topCategories) == 2
        assert len(analytics.memberContributions) == 2
        assert len(analytics.expenseTrends) == 2
        
    def test_expense_analytics_zero_values(self):
        """Test expense analytics with zero values."""
        analytics = ExpenseAnalytics(
            period="weekly",
            totalExpenses=0.0,
            expenseCount=0,
            avgExpenseAmount=0.0,
            topCategories=[],
            memberContributions=[],
            expenseTrends=[]
        )
        
        assert analytics.totalExpenses == 0.0
        assert analytics.expenseCount == 0
        assert analytics.avgExpenseAmount == 0.0
        assert len(analytics.topCategories) == 0


class TestAttachmentUploadResponse:
    """Test the AttachmentUploadResponse model."""
    
    def test_valid_attachment_upload_response(self):
        """Test creating a valid attachment upload response."""
        response = AttachmentUploadResponse(
            attachment_key="uploads/receipts/receipt_123.jpg",
            url="https://cdn.example.com/uploads/receipts/receipt_123.jpg"
        )
        
        assert response.attachment_key == "uploads/receipts/receipt_123.jpg"
        assert response.url == "https://cdn.example.com/uploads/receipts/receipt_123.jpg"
        
    def test_attachment_upload_response_empty_strings(self):
        """Test attachment upload response with empty strings."""
        response = AttachmentUploadResponse(
            attachment_key="",
            url=""
        )
        
        assert response.attachment_key == ""
        assert response.url == ""


class TestOptimizedSettlementsResponse:
    """Test the OptimizedSettlementsResponse model."""
    
    def test_valid_optimized_settlements_response(self):
        """Test creating a valid optimized settlements response."""
        optimized_settlements = [
            OptimizedSettlement(
                fromUserId="user1",
                toUserId="user2",
                fromUserName="User One",
                toUserName="User Two",
                amount=75.0
            ),
            OptimizedSettlement(
                fromUserId="user3",
                toUserId="user1",
                fromUserName="User Three",
                toUserName="User One",
                amount=25.0
            )
        ]
        
        savings = {
            "originalTransactions": 5,
            "optimizedTransactions": 2,
            "transactionsSaved": 3,
            "percentageSaved": 60.0
        }
        
        response = OptimizedSettlementsResponse(
            optimizedSettlements=optimized_settlements,
            savings=savings
        )
        
        assert len(response.optimizedSettlements) == 2
        assert response.savings["originalTransactions"] == 5
        assert response.savings["optimizedTransactions"] == 2
        assert response.savings["transactionsSaved"] == 3
        assert response.savings["percentageSaved"] == 60.0
        
    def test_optimized_settlements_response_empty(self):
        """Test optimized settlements response with empty data."""
        response = OptimizedSettlementsResponse(
            optimizedSettlements=[],
            savings={}
        )
        
        assert len(response.optimizedSettlements) == 0
        assert response.savings == {}


class TestComplexScenarios:
    """Test complex scenarios and edge cases across multiple models."""
    
    def test_expense_create_with_multiple_split_types(self):
        """Test creating expense with different split types."""
        splits = [
            ExpenseSplit(userId="user1", amount=30.0, type=SplitType.EQUAL),
            ExpenseSplit(userId="user2", amount=20.0, type=SplitType.UNEQUAL),
            ExpenseSplit(userId="user3", amount=50.0, type=SplitType.PERCENTAGE)
        ]
        
        request = ExpenseCreateRequest(
            description="Mixed split types",
            amount=100.0,
            splits=splits,
            splitType=SplitType.UNEQUAL
        )
        
        assert len(request.splits) == 3
        assert request.splits[0].type == SplitType.EQUAL
        assert request.splits[1].type == SplitType.UNEQUAL
        assert request.splits[2].type == SplitType.PERCENTAGE
        
    def test_expense_response_with_full_data(self):
        """Test expense response with all optional fields populated."""
        now = datetime.now()
        
        # Create splits
        splits = [
            ExpenseSplit(userId="user1", amount=40.0),
            ExpenseSplit(userId="user2", amount=35.0),
            ExpenseSplit(userId="user3", amount=25.0)
        ]
        
        # Create comments
        comments = [
            ExpenseComment(
                _id="comment1",
                userId="user1",
                userName="User One",
                content="Looks good to me",
                createdAt=now
            ),
            ExpenseComment(
                _id="comment2",
                userId="user2",
                userName="User Two",
                content="Thanks for organizing this",
                createdAt=now
            )
        ]
        
        # Create history
        history = [
            ExpenseHistoryEntry(
                _id="history1",
                userId="user1",
                userName="User One",
                beforeData={"amount": 90.0, "description": "Old description"},
                editedAt=now
            )
        ]
        
        response = ExpenseResponse(
            _id="expense123",
            groupId="group123",
            createdBy="user123",
            description="Team lunch",
            amount=100.0,
            splits=splits,
            splitType=SplitType.UNEQUAL,
            tags=["food", "team", "lunch"],
            receiptUrls=[
                "https://example.com/receipt1.jpg",
                "https://example.com/receipt2.jpg"
            ],
            comments=comments,
            history=history,
            createdAt=now,
            updatedAt=now
        )
        
        assert response.id == "expense123"
        assert len(response.splits) == 3
        assert len(response.comments) == 2
        assert len(response.history) == 1
        assert len(response.tags) == 3
        assert len(response.receiptUrls) == 2
        
    def test_floating_point_precision_edge_cases(self):
        """Test edge cases with floating point precision."""
        # Test case where splits sum to slightly different amount due to floating point precision
        splits = [
            ExpenseSplit(userId="user1", amount=33.33),
            ExpenseSplit(userId="user2", amount=33.33),
            ExpenseSplit(userId="user3", amount=33.34)
        ]
        
        # This should pass validation (total = 100.00)
        request = ExpenseCreateRequest(
            description="Precision test",
            amount=100.00,
            splits=splits
        )
        
        assert request.amount == 100.00
        assert sum(split.amount for split in request.splits) == 100.00
        
    def test_very_small_amounts(self):
        """Test handling of very small monetary amounts."""
        splits = [ExpenseSplit(userId="user1", amount=0.01)]
        
        request = ExpenseCreateRequest(
            description="Very small expense",
            amount=0.01,
            splits=splits
        )
        
        assert request.amount == 0.01
        assert request.splits[0].amount == 0.01
        
    def test_large_amounts(self):
        """Test handling of large monetary amounts."""
        large_amount = 999999.99
        splits = [ExpenseSplit(userId="user1", amount=large_amount)]
        
        request = ExpenseCreateRequest(
            description="Large expense",
            amount=large_amount,
            splits=splits
        )
        
        assert request.amount == large_amount
        assert request.splits[0].amount == large_amount
        
    def test_unicode_and_special_characters(self):
        """Test handling of unicode and special characters in text fields."""
        special_description = "Café & Restaurant 🍽️ - Émile's Birthday 🎉"
        special_user_name = "José María Ñoño"
        special_content = "¡Gracias! 謝謝 Спасибо 🙏"
        
        comment = ExpenseComment(
            _id="comment123",
            userId="user123",
            userName=special_user_name,
            content=special_content,
            createdAt=datetime.now()
        )
        
        request = ExpenseCreateRequest(
            description=special_description,
            amount=50.0,
            splits=[ExpenseSplit(userId="user1", amount=50.0)]
        )
        
        assert request.description == special_description
        assert comment.userName == special_user_name
        assert comment.content == special_content
        
    def test_boundary_values_for_string_lengths(self):
        """Test boundary values for string length validations."""
        # Test minimum length (1 character)
        min_description = "a"
        request = ExpenseCreateRequest(
            description=min_description,
            amount=50.0,
            splits=[ExpenseSplit(userId="user1", amount=50.0)]
        )
        assert request.description == min_description
        
        # Test maximum length (500 characters)
        max_description = "a" * 500
        request = ExpenseCreateRequest(
            description=max_description,
            amount=50.0,
            splits=[ExpenseSplit(userId="user1", amount=50.0)]
        )
        assert len(request.description) == 500
        
    def test_complex_nested_data_structures(self):
        """Test complex nested data structures in beforeData and other Dict fields."""
        complex_before_data = {
            "amount": 150.0,
            "description": "Original description",
            "splits": [
                {"userId": "user1", "amount": 75.0, "type": "equal"},
                {"userId": "user2", "amount": 75.0, "type": "equal"}
            ],
            "metadata": {
                "location": {"lat": 40.7128, "lng": -74.0060},
                "weather": {"temp": 22, "condition": "sunny"},
                "participants": ["user1", "user2", "user3"]
            },
            "tags": ["dinner", "birthday", "special"],
            "receipts": [
                {"url": "https://example.com/receipt1.jpg", "type": "image"},
                {"url": "https://example.com/receipt2.pdf", "type": "pdf"}
            ]
        }
        
        history_entry = ExpenseHistoryEntry(
            _id="history123",
            userId="user123",
            userName="Admin User",
            beforeData=complex_before_data,
            editedAt=datetime.now()
        )
        
        assert history_entry.beforeData["amount"] == 150.0
        assert len(history_entry.beforeData["splits"]) == 2
        assert history_entry.beforeData["metadata"]["location"]["lat"] == 40.7128
        assert len(history_entry.beforeData["tags"]) == 3


class TestEdgeCasesAndErrorHandling:
    """Test additional edge cases and error handling scenarios."""
    
    def test_splits_sum_validation_precision_boundary(self):
        """Test the exact boundary of floating point tolerance (0.01)."""
        # Should pass - exactly at tolerance boundary
        splits = [
            ExpenseSplit(userId="user1", amount=25.005),
            ExpenseSplit(userId="user2", amount=24.995)
        ]
        request = ExpenseCreateRequest(
            description="Boundary test",
            amount=50.00,
            splits=splits
        )
        assert request.amount == 50.00
        
        # Should fail - beyond tolerance boundary
        splits_fail = [
            ExpenseSplit(userId="user1", amount=25.02),
            ExpenseSplit(userId="user2", amount=24.97)
        ]
        with pytest.raises(ValidationError) as exc_info:
            ExpenseCreateRequest(
                description="Beyond boundary test",
                amount=50.00,
                splits=splits_fail
            )
        assert "Split amounts must sum to total expense amount" in str(exc_info.value)
        
    def test_model_config_inheritance(self):
        """Test that model configurations are properly applied."""
        # Test ExpenseComment model_config
        comment = ExpenseComment(
            _id="test123",
            userId="user123",
            userName="  Test User  ",
            content="  Test content  ",
            createdAt=datetime.now()
        )
        # str_strip_whitespace should work
        assert comment.userName == "Test User"
        assert comment.content == "Test content"
        
    def test_field_alias_consistency(self):
        """Test that field aliases work consistently across models."""
        models_with_id_alias = [
            (ExpenseComment, {"userId": "user1", "userName": "User", "content": "Test", "createdAt": datetime.now()}),
            (ExpenseHistoryEntry, {"userId": "user1", "userName": "User", "beforeData": {}, "editedAt": datetime.now()}),
            (ExpenseResponse, {
                "groupId": "group1", "createdBy": "user1", "description": "Test", 
                "amount": 50.0, "splits": [], "splitType": SplitType.EQUAL,
                "createdAt": datetime.now(), "updatedAt": datetime.now()
            }),
            (Settlement, {
                "groupId": "group1", "payerId": "user1", "payeeId": "user2",
                "payerName": "User One", "payeeName": "User Two", "amount": 50.0,
                "status": SettlementStatus.PENDING, "createdAt": datetime.now()
            })
        ]
        
        for model_class, kwargs in models_with_id_alias:
            # Test with _id
            instance_with_id = model_class(_id="test123", **kwargs)
            assert instance_with_id.id == "test123"
            
            # Test with id (populate_by_name should work)
            instance_with_alias = model_class(id="test456", **kwargs)
            assert instance_with_alias.id == "test456"
            
    def test_expense_update_request_partial_validation_scenarios(self):
        """Test various partial update scenarios for ExpenseUpdateRequest."""
        # Test updating only description
        request1 = ExpenseUpdateRequest(description="New description")
        assert request1.description == "New description"
        assert request1.amount is None
        
        # Test updating only amount
        request2 = ExpenseUpdateRequest(amount=75.50)
        assert request2.amount == 75.50
        assert request2.description is None
        
        # Test updating only splits (without amount - should not validate)
        splits = [ExpenseSplit(userId="user1", amount=100.0)]
        request3 = ExpenseUpdateRequest(splits=splits)
        assert len(request3.splits) == 1
        assert request3.amount is None
        
        # Test updating splits with mismatched amount (should validate and fail)
        with pytest.raises(ValidationError):
            ExpenseUpdateRequest(
                amount=50.0,
                splits=[ExpenseSplit(userId="user1", amount=75.0)]
            )
            
    def test_enum_string_validation(self):
        """Test that enum fields properly validate string values."""
        # Valid enum string should work
        split = ExpenseSplit(userId="user1", amount=25.0, type="equal")
        assert split.type == SplitType.EQUAL
        
        # Invalid enum string should fail
        with pytest.raises(ValidationError):
            ExpenseSplit(userId="user1", amount=25.0, type="invalid_type")
            
    def test_response_models_with_minimal_data(self):
        """Test response models with minimal required data."""
        
        # Test ExpenseListResponse with minimal data
        list_response = ExpenseListResponse(
            expenses=[],
            pagination={},
            summary={}
        )
        assert list_response.expenses == []
        assert list_response.pagination == {}
        assert list_response.summary == {}
        
        # Test FriendsBalanceResponse with minimal data
        friends_response = FriendsBalanceResponse(
            friendsBalance=[],
            summary={}
        )
        assert friends_response.friendsBalance == []
        assert friends_response.summary == {}
        
        # Test SettlementListResponse with minimal data
        settlement_response = SettlementListResponse(
            settlements=[],
            optimizedSettlements=[],
            summary={},
            pagination={}
        )
        assert settlement_response.settlements == []
        assert settlement_response.optimizedSettlements == []