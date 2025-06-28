from fastapi import APIRouter, Depends, HTTPException, status
from app.user.schemas import UserProfileResponse, UserProfileUpdateRequest, DeleteUserResponse
from app.user.service import user_service
from app.auth.security import get_current_user
from typing import Dict, Any

router = APIRouter(prefix="/users", tags=["User"])

@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    user = await user_service.get_user_by_id(current_user["_id"])
    if not user:
        raise HTTPException(status_code=404, detail={"error": "NotFound", "message": "User not found"})
    return user

@router.patch("/me", response_model=Dict[str, Any])
async def update_user_profile(
    updates: UserProfileUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    update_data = updates.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail={"error": "InvalidInput", "message": "No update fields provided."})
    updated_user = await user_service.update_user_profile(current_user["_id"], update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail={"error": "NotFound", "message": "User not found"})
    return {"user": updated_user}

@router.delete("/me", response_model=DeleteUserResponse)
async def delete_user_account(current_user: Dict[str, Any] = Depends(get_current_user)):
    deleted = await user_service.delete_user(current_user["_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail={"error": "NotFound", "message": "User not found"})
    return DeleteUserResponse(success=True, message="User account scheduled for deletion.")
