from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class GroupMember(BaseModel):
    userId: str = Field(..., alias="userId")
    role: str = Field(default="member", alias="role")  # "admin" or "member"
    joinedAt: datetime = Field(..., alias="joinedAt")

    model_config = ConfigDict(populate_by_name=True)


class GroupMemberWithDetails(BaseModel):
    userId: str = Field(..., alias="userId")
    role: str = Field(default="member", alias="role")  # "admin" or "member"
    joinedAt: datetime = Field(..., alias="joinedAt")
    user: Optional[dict] = Field(
        default=None, alias="user")  # Contains user details

    model_config = ConfigDict(populate_by_name=True)


class GroupCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, alias="name")
    currency: Optional[str] = Field(default="USD", alias="currency")
    imageUrl: Optional[str] = Field(default=None, alias="imageUrl")

    model_config = ConfigDict(populate_by_name=True)


class GroupUpdateRequest(BaseModel):
    name: Optional[str] = Field(
        default=None, min_length=1, max_length=100, alias="name"
    )
    imageUrl: Optional[str] = Field(default=None, alias="imageUrl")

    model_config = ConfigDict(populate_by_name=True)


class GroupResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str = Field(..., alias="name")
    currency: str = Field(..., alias="currency")
    joinCode: str = Field(..., alias="joinCode")
    createdBy: str = Field(..., alias="createdBy")
    createdAt: datetime = Field(..., alias="createdAt")
    imageUrl: Optional[str] = Field(default=None, alias="imageUrl")
    members: Optional[List[GroupMemberWithDetails]] = Field(
        default_factory=list, alias="members"
    )

    model_config = ConfigDict(populate_by_name=True)


class GroupListResponse(BaseModel):
    groups: List[GroupResponse] = Field(..., alias="groups")

    model_config = ConfigDict(populate_by_name=True)


class JoinGroupRequest(BaseModel):
    joinCode: str = Field(..., min_length=1, alias="joinCode")

    model_config = ConfigDict(populate_by_name=True)


class JoinGroupResponse(BaseModel):
    group: GroupResponse = Field(..., alias="group")

    model_config = ConfigDict(populate_by_name=True)


class MemberRoleUpdateRequest(BaseModel):
    role: str = Field(..., pattern="^(admin|member)$", alias="role")

    model_config = ConfigDict(populate_by_name=True)


class LeaveGroupResponse(BaseModel):
    success: bool = Field(..., alias="success")
    message: str = Field(..., alias="message")

    model_config = ConfigDict(populate_by_name=True)


class DeleteGroupResponse(BaseModel):
    success: bool = Field(..., alias="success")
    message: str = Field(..., alias="message")

    model_config = ConfigDict(populate_by_name=True)


class RemoveMemberResponse(BaseModel):
    success: bool = Field(..., alias="success")
    message: str = Field(..., alias="message")

    model_config = ConfigDict(populate_by_name=True)
