from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class GroupMember(BaseModel):
    userId: str
    role: str = "member"  # "admin" or "member"
    joinedAt: datetime

class GroupCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    currency: Optional[str] = "USD"
    imageUrl: Optional[str] = None

class GroupUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    imageUrl: Optional[str] = None

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

class JoinGroupRequest(BaseModel):
    joinCode: str = Field(..., min_length=1)

class JoinGroupResponse(BaseModel):
    group: GroupResponse

class MemberRoleUpdateRequest(BaseModel):
    role: str = Field(..., pattern="^(admin|member)$")

class LeaveGroupResponse(BaseModel):
    success: bool
    message: str

class DeleteGroupResponse(BaseModel):
    success: bool
    message: str

class RemoveMemberResponse(BaseModel):
    success: bool
    message: str
