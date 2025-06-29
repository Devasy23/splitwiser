# Group Service API Documentation
# =========================

## API Endpoint Summary

| Method | Path                                     | Description                         |
| :----: | ---------------------------------------- | ----------------------------------- |
|  POST  | [`/groups`](#1-create-a-new-group)                                | Create group                        |
|   GET  | [`/groups`](#4-crud-endpoints-recap)                                | List groups current user belongs to |
|   GET  | [`/groups/{group_id}`](#4-crud-endpoints-recap)                     | Get group details (incl. members)   |
|  PATCH | [`/groups/{group_id}`](#4-crud-endpoints-recap)                     | Update group metadata               |
| DELETE | [`/groups/{group_id}`](#4-crud-endpoints-recap)                     | Delete group (admin only)           |
|  POST  | [`/groups/join`](#2-invite--join-by-code-or-qrurl)                           | Join by `joinCode`                  |
|  POST  | [`/groups/{group_id}/leave`](#3-prevent-leaving-before-settlement)               | Leave group (if settled)            |
|   GET  | [`/groups/{group_id}/members`](#4-crud-endpoints-recap)             | List members                        |
|  PATCH | [`/groups/{group_id}/members/{member_id}`](#4-crud-endpoints-recap) | Change role (admin/member)          |
| DELETE | [`/groups/{group_id}/members/{member_id}`](#4-crud-endpoints-recap) | Remove a member (admin only)        |

*All endpoints require `Authorization` via [Auth Service](./auth-service.md). Group data is stored as per the [`groups` collection schema](../nonrelational-database-schema.md#2-groups-collection).*

## 1. Create a New Group

1. **Client**

   * User taps “New Group”
   * Enters `{ name, currency?, image_url? }`

2. **API Call**

   ```http
   POST /groups
   Authorization: Bearer <access_token>
   Content-Type: application/json

   {
     "name": "Weekend Trip",
     "currency": "INR"
   }
   ```

3. **Server**

   * Generates a new `group_id`
   * Persists document in MongoDB ([`groups` collection](../nonrelational-database-schema.md#2-groups-collection))
   * Generates a **joinCode** (e.g. short, 6-char alphanumeric) mapped to `group_id`
   * Responds with full group object

4. **Response**

   ```json
   200 OK
   {
     "group": {
       "id": "642f1e4a9b3c2d1f6a1b2c3d",
       "name": "Weekend Trip",
       "currency": "INR",
       "joinCode": "XZ4P7Q",
       "createdBy": "user123",
       "createdAt": "...",
       "imageUrl": null
     }
   }
   ```

5. **Client**

   * Shows “Group created!”
   * Navigates into the group’s dashboard

```plantuml
@startuml CreateGroup
actor User
participant App as "React/Expo UI"
participant API as "FastAPI /groups"
participant DB as "MongoDB ([groups collection](../nonrelational-database-schema.md#2-groups-collection))"

User -> App: Tap “Create Group” + Name
App -> API: POST /groups {name, currency}
API -> DB: insert group doc + generate joinCode
DB --> API: saved group record
API --> App: 200 {group with joinCode}
App --> User: Show “Group created” + navigate in
@enduml
```

---

## 2. Invite & Join by Code (or QR/URL)

### a) Generating an Invite Code/URL

* **Invite Code**: the `joinCode` field we already generated on creation.
* **Invite URL**: e.g. `https://app.splitwiser.com/join/XZ4P7Q` (mobile OS will deep-link into your Expo app).

### b) Joining via Code

1. **Client**

   * User enters code `XZ4P7Q` (or scans QR that embeds it)

2. **API Call**

   ```http
   POST /groups/join
   Authorization: Bearer <access_token>
   Content-Type: application/json

   { "joinCode": "XZ4P7Q" }
   ```

3. **Server**

   * Looks up the [`groups` collection](../nonrelational-database-schema.md#2-groups-collection) for `joinCode = "XZ4P7Q"`
   * If found & user not already a member:

     * Add a new `member` sub-doc in the group: `{ userId, role: "member", joinedAt }`
   * Returns the updated group

4. **Response**

   ```json
   200 OK
   {
     "group": {
       "id": "...",
       "name": "Weekend Trip",
       "members": [
         { "userId": "user123", "role": "admin" },
         { "userId": "user456", "role": "member" }
       ],
       ...
     }
   }
   ```

```plantuml
@startuml JoinGroup
actor User
participant App as "React/Expo UI"
participant API as "FastAPI /groups/join"
participant DB as "MongoDB ([groups collection](../nonrelational-database-schema.md#2-groups-collection))"

User -> App: Enter joinCode "XZ4P7Q"
App -> API: POST /groups/join {joinCode}
API -> DB: find group where joinCode="XZ4P7Q"
DB --> API: group record
API -> DB: insert into group.members {userId,role,joinedAt}
DB --> API: success
API --> App: 200 {group with new member}
App --> User: Show group details
@enduml
```

---

## 3. Prevent Leaving Before Settlement

* **Endpoint**

  ```http
  POST   /groups/{group_id}/leave
  Authorization: Bearer <access_token>
  ```

* **Server Logic**

  1. Before removing the user from `group.members`, run a check against:

     * Outstanding balances (e.g., by calling a relevant endpoint in the [Expense Service](./expense-service.md))
     * Active unsettled expenses or settlements (referencing the [`settlements` collection](../nonrelational-database-schema.md#4-settlements-collection) via the [Expense Service](./expense-service.md))
  2. If **zero** balance: remove member and return `200`.
  3. If **non-zero**: return `400 Bad Request` with:

     ```json
     { "error": "You have unsettled balances of ₹123.45" }
     ```
  **Note**: The check for outstanding balances before allowing a user to leave a group is a **TODO** in the current service implementation. The endpoint will currently allow leaving regardless of balance.

---

## 4. CRUD Endpoints Recap

| Method | Path                                     | Description                         |
| :----: | ---------------------------------------- | ----------------------------------- |
|  POST  | `/groups`                                | Create group                        |
|   GET  | `/groups`                                | List groups current user belongs to |
|   GET  | `/groups/{group_id}`                     | Get group details (incl. members)   |
|  PATCH | `/groups/{group_id}`                     | Update group metadata               |
| DELETE | `/groups/{group_id}`                     | Delete group (admin only)           |
|  POST  | `/groups/join`                           | Join by `joinCode`                  |
|  POST  | `/groups/{group_id}/leave`               | Leave group (if settled)            |
|   GET  | `/groups/{group_id}/members`             | List members                        |
|  PATCH | `/groups/{group_id}/members/{member_id}` | Change role (admin/member)          |
| DELETE | `/groups/{group_id}/members/{member_id}` | Remove a member (admin only)        |

*All require `Authorization: Bearer <token>` (managed by [Auth Service](./auth-service.md)).*
*Interactions with expenses and settlements are handled by the [Expense Service](./expense-service.md).*

---

## 5. List Group Members

Retrieves a list of all members within a specified group, including their user details.

* **Endpoint**: `GET /groups/{group_id}/members`
* **Authorization**: `Bearer <access_token>` (User must be a member of the group)

**Successful Response (200 OK):**
Returns a list of member objects.

```json
[
  {
    "userId": "usr_123abc",
    "role": "admin",
    "joinedAt": "2024-01-15T10:00:00Z",
    "name": "Jane Doe",
    "imageUrl": "https://example.com/profile_jane.jpg"
  },
  {
    "userId": "usr_456def",
    "role": "member",
    "joinedAt": "2024-01-16T11:30:00Z",
    "name": "John Smith",
    "imageUrl": "https://example.com/profile_john.jpg"
  }
]
```

Each object in the list contains:
- `userId`: The unique identifier of the member.
- `role`: The role of the member in the group (e.g., "admin", "member").
- `joinedAt`: The timestamp when the member joined the group.
- `name`: The name of the user (fetched from user profile).
- `imageUrl`: The profile image URL of the user (fetched from user profile).
