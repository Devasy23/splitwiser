from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class GroupMember(BaseModel):
    userId: str
    role: str = "member"  # "admin" or "member"
    joinedAt: datetime

    model_config = {"populate_by_name": True}

class GroupCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    currency: Optional[str] = "USD"
    imageUrl: Optional[str] = None

    model_config = {"populate_by_name": True}

class GroupUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    imageUrl: Optional[str] = None

    model_config = {"populate_by_name": True}

class GroupResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    currency: str
    joinCode: str
    createdBy: str
    createdAt: datetime
    imageUrl: Optional[str] = None
    members: Optional[List[GroupMember]] = []

    model_config = {"populate_by_name": True}

class GroupListResponse(BaseModel):
    groups: List[GroupResponse]

    model_config = {"populate_by_name": True}

class JoinGroupRequest(BaseModel):
    joinCode: str = Field(..., min_length=1)

    model_config = {"populate_by_name": True}

class JoinGroupResponse(BaseModel):
    group: GroupResponse

    model_config = {"populate_by_name": True}

class MemberRoleUpdateRequest(BaseModel):
    role: str = Field(..., pattern="^(admin|member)$")

    model_config = {"populate_by_name": True}

class LeaveGroupResponse(BaseModel):
    success: bool
    message: str

class DeleteGroupResponse(BaseModel):
    success: bool
    message: str

class RemoveMemberResponse(BaseModel):
    success: bool
    message: str
