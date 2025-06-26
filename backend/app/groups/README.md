# Groups Service Implementation

This document describes the implementation of the Groups Service API endpoints as specified in the [group-service.md](../../docs/group-service.md) documentation.

## Overview

The Groups Service provides 10 endpoints for managing groups, members, and group operations. All endpoints require authentication via Bearer token.

## Implemented Endpoints

### 1. Create Group
- **POST** `/groups`
- Creates a new group with the authenticated user as admin
- Generates a unique 6-character join code
- **Request Body**: `{name: string, currency?: string, imageUrl?: string}`
- **Response**: Full group object with join code

### 2. List User Groups
- **GET** `/groups`
- Returns all groups where the current user is a member
- **Response**: `{groups: GroupResponse[]}`

### 3. Get Group Details
- **GET** `/groups/{group_id}`
- Returns detailed group information including members
- Only accessible to group members
- **Response**: Full group object

### 4. Update Group Metadata
- **PATCH** `/groups/{group_id}`
- Updates group name and/or image URL
- Only accessible to group admins
- **Request Body**: `{name?: string, imageUrl?: string}`
- **Response**: Updated group object

### 5. Delete Group
- **DELETE** `/groups/{group_id}`
- Permanently deletes a group
- Only accessible to group admins
- **Response**: `{success: boolean, message: string}`

### 6. Join Group by Code
- **POST** `/groups/join`
- Join a group using its join code
- **Request Body**: `{joinCode: string}`
- **Response**: `{group: GroupResponse}`

### 7. Leave Group
- **POST** `/groups/{group_id}/leave`
- Leave a group (balance check to be implemented with expense service)
- **Response**: `{success: boolean, message: string}`

### 8. Get Group Members
- **GET** `/groups/{group_id}/members`
- Returns list of all group members with roles
- Only accessible to group members
- **Response**: Array of member objects

### 9. Update Member Role
- **PATCH** `/groups/{group_id}/members/{member_id}`
- Change a member's role between "admin" and "member"
- Only accessible to group admins
- **Request Body**: `{role: "admin" | "member"}`
- **Response**: `{message: string}`

### 10. Remove Member
- **DELETE** `/groups/{group_id}/members/{member_id}`
- Remove a member from the group
- Only accessible to group admins
- Cannot remove yourself (use leave group instead)
- **Response**: `{success: boolean, message: string}`

## File Structure

```
backend/app/groups/
├── __init__.py
├── schemas.py      # Pydantic models for request/response
├── service.py      # Business logic and database operations
└── routes.py       # FastAPI route handlers
```

## Security and Business Logic

### Admin Protection Logic
- **Last Admin Protection**: Prevents the last admin from demoting themselves or leaving the group
- **Self-Removal Prevention**: Admins cannot remove themselves (must use leave group)
- **Role Validation**: Only allows "admin" or "member" roles

### Error Handling Improvements
- **Group Existence Check**: Properly distinguishes between non-existent groups and access denied
- **Member Validation**: Validates member existence before role changes or removal
- **Balance Integration Ready**: TODOs marked for expense service integration

## Key Features

### Security
- All endpoints require authentication
- Role-based access control (admin vs member permissions)
- Users can only access groups they belong to

### Join Code System
- Unique 6-character alphanumeric codes
- Case-insensitive lookup
- Collision detection and retry logic

### Error Handling
- Proper HTTP status codes
- Descriptive error messages
- Graceful handling of invalid ObjectIds

### Database Operations
- Uses MongoDB with proper ObjectId handling
- Optimized queries with user membership filters
- Atomic operations for member management

## Testing

Comprehensive test suites are provided:
- `tests/groups/test_groups_routes.py` - API endpoint tests
- `tests/groups/test_groups_service.py` - Service layer tests

Run tests with:
```bash
cd backend
pytest tests/groups/ -v
```

## Integration Notes

### With Auth Service
- Uses `get_current_user` dependency for authentication
- Requires valid JWT bearer token

### With Expense Service (Future)
- Leave group and remove member operations will check for outstanding balances
- Currently allows operations without balance verification
- TODO comments mark integration points

## API Usage Examples

### Create a Group
```bash
curl -X POST "http://localhost:8000/groups" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Weekend Trip", "currency": "USD"}'
```

### Join a Group
```bash
curl -X POST "http://localhost:8000/groups/join" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"joinCode": "ABC123"}'
```

### Update Member Role
```bash
curl -X PATCH "http://localhost:8000/groups/{group_id}/members/{member_id}" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

## Schema Definitions

All request/response schemas are defined in `schemas.py` with proper validation:
- Field length limits
- Required vs optional fields
- Pattern validation for roles
- Alias support for MongoDB ObjectId fields

The Groups Service is now fully implemented and ready for integration with the frontend and other services.
