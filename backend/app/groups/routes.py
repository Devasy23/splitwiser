from fastapi import APIRouter, Depends, HTTPException, status
from app.groups.schemas import (
    GroupCreateRequest, GroupResponse, GroupListResponse, GroupUpdateRequest,
    JoinGroupRequest, JoinGroupResponse, MemberRoleUpdateRequest,
    LeaveGroupResponse, DeleteGroupResponse, RemoveMemberResponse
)
from app.groups.service import group_service
from app.auth.security import get_current_user
from typing import Dict, Any, List

router = APIRouter(prefix="/groups", tags=["Groups"])

@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new group"""
    group = await group_service.create_group(
        group_data.model_dump(exclude_unset=True),
        current_user["_id"]
    )
    if not group:
        raise HTTPException(status_code=500, detail="Failed to create group")
    return group

@router.get("", response_model=GroupListResponse)
async def list_user_groups(current_user: Dict[str, Any] = Depends(get_current_user)):
    """List all groups the current user belongs to"""
    groups = await group_service.get_user_groups(current_user["_id"])
    return {"groups": groups}

@router.get("/{group_id}", response_model=GroupResponse)
async def get_group_details(
    group_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get group details including members"""
    group = await group_service.get_group_by_id(group_id, current_user["_id"])
    if not group:
        raise HTTPException(status_code=404, detail="Group not found or access denied")
    return group

@router.patch("/{group_id}", response_model=GroupResponse)
async def update_group_metadata(
    group_id: str,
    updates: GroupUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update group metadata (admin only)"""
    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No update fields provided")
    
    updated_group = await group_service.update_group(group_id, update_data, current_user["_id"])
    if not updated_group:
        raise HTTPException(status_code=404, detail="Group not found or access denied")
    return updated_group

@router.delete("/{group_id}", response_model=DeleteGroupResponse)
async def delete_group(
    group_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a group (admin only)"""
    deleted = await group_service.delete_group(group_id, current_user["_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Group not found or access denied")
    return DeleteGroupResponse(success=True, message="Group deleted successfully")

@router.post("/join", response_model=JoinGroupResponse)
async def join_group_by_code(
    join_data: JoinGroupRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Join a group using a join code"""
    group = await group_service.join_group_by_code(join_data.joinCode, current_user["_id"])
    if not group:
        raise HTTPException(status_code=404, detail="Invalid join code")
    return {"group": group}

@router.post("/{group_id}/leave", response_model=LeaveGroupResponse)
async def leave_group(
    group_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Leave a group (only if no outstanding balances)"""
    left = await group_service.leave_group(group_id, current_user["_id"])
    if not left:
        raise HTTPException(status_code=400, detail="Failed to leave group")
    return LeaveGroupResponse(success=True, message="Successfully left the group")

@router.get("/{group_id}/members", response_model=List[Dict[str, Any]])
async def get_group_members(
    group_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get list of group members"""
    members = await group_service.get_group_members(group_id, current_user["_id"])
    return members

@router.patch("/{group_id}/members/{member_id}", response_model=Dict[str, str])
async def update_member_role(
    group_id: str,
    member_id: str,
    role_update: MemberRoleUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Change member role (admin only)"""
    updated = await group_service.update_member_role(
        group_id, member_id, role_update.role, current_user["_id"]
    )
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update member role")
    return {"message": f"Member role updated to {role_update.role}"}

@router.delete("/{group_id}/members/{member_id}", response_model=RemoveMemberResponse)
async def remove_group_member(
    group_id: str,
    member_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Remove a member from the group (admin only)"""
    removed = await group_service.remove_member(group_id, member_id, current_user["_id"])
    if not removed:
        raise HTTPException(status_code=400, detail="Failed to remove member")
    return RemoveMemberResponse(success=True, message="Member removed successfully")
