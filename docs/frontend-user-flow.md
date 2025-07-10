# SplitWiser: User Flow & Navigation

## App User Flow Diagram

```plantuml
@startuml
skinparam backgroundColor white
skinparam DefaultFontName "Roboto"
skinparam DefaultFontSize 12
skinparam ArrowColor #6200EE
skinparam ActivityBorderColor #6200EE
skinparam ActivityBackgroundColor #E8DEF8
skinparam ActivityDiamondBackgroundColor #E8DEF8
skinparam ActivityDiamondBorderColor #6200EE

title SplitWiser App User Flow

(*) --> "Login Screen"
"Login Screen" --> "Authenticate" : Login/Google Sign In
"Authenticate" --> "Main Navigation"

"Main Navigation" -right-> "Home Tab"
"Main Navigation" -down-> "Groups Tab"
"Main Navigation" -left-> "Friends Tab"

"Home Tab" --> "Recent Activity Feed"
"Home Tab" --> "Overall Balance"
"Home Tab" --> "Analytics Charts"
"Home Tab" -right-> "Notification Center" : Tap Notification Icon

"Groups Tab" --> "Group List"
"Group List" --> "Create Group" : + Button
"Group List" --> "Join Group" : Join Button
"Group List" --> "Group Detail" : Tap Group

"Group Detail" --> "Group Header" : Group name & members
"Group Detail" --> "Settlement Summary" : Balances owed/to receive
"Group Detail" --> "Expense Feed" : Chronological list
"Group Detail" --> "Add Expense" : FAB

"Add Expense" --> "Basic Info Screen" : Step 1
"Basic Info Screen" --> "Payment Selection" : Step 2
"Payment Selection" --> "Split Options Screen" : Step 3

"Split Options Screen" --> "Equal Split" : Toggle option
"Split Options Screen" --> "Unequal Split" : Toggle option

"Equal Split" --> "Member Selection"
"Unequal Split" --> "Split Method Selection"
"Split Method Selection" --> "By Shares"
"Split Method Selection" --> "By Percentages"
"Split Method Selection" --> "By Exact Values"

"Member Selection" --> "Save Expense"
"By Shares" --> "Save Expense"
"By Percentages" --> "Save Expense"
"By Exact Values" --> "Save Expense"
"Save Expense" --> "Group Detail"

"Friends Tab" --> "Friend List"
"Friend List" --> "Friend Detail" : Tap Friend
"Friend Detail" --> "Settle Up" : Settlement flow
"Settle Up" --> "Payment Method"
"Payment Method" --> "Record Payment"
"Record Payment" --> "Friend Detail"

"Group Detail" --> "Expense Detail" : Tap Expense
"Expense Detail" --> "Edit Expense" : Edit (creator only)
"Expense Detail" --> "Delete Expense" : Delete (creator only)

@enduml
```

## Detailed User Journeys

### 1. Authentication Journey

#### New User Registration
1. **Landing** → User opens app for the first time
2. **Welcome Screen** → Brief app introduction with continue button
3. **Sign Up** → Email, password, confirm password fields
4. **Email Verification** → Verify email address (if required)
5. **Onboarding** → 3-4 screens explaining key features
6. **Profile Setup** → Name, profile picture, currency preference
7. **Main App** → Redirect to home screen

#### Existing User Login
1. **Login Screen** → Email/password or Google Sign-in
2. **Authentication** → Validate credentials
3. **Main App** → Direct to home screen with recent activity

#### Password Recovery
1. **Login Screen** → "Forgot Password" link
2. **Reset Request** → Enter email address
3. **Email Sent** → Confirmation message
4. **Reset Password** → New password form (from email link)
5. **Login** → Return to login with new credentials

### 2. Group Management Journey

#### Creating a Group
1. **Groups List** → Tap "Create new group"
2. **Group Details** → Name, description, group image
3. **Add Members** → Search and invite friends/contacts
4. **Invitation Method** → Email, phone, QR code, or link
5. **Group Created** → Navigate to new group detail screen
6. **First Expense** → Optional prompt to add first expense

#### Joining a Group
1. **Groups List** → Tap "Join Group" button
2. **Join Method** → Choose from QR scan, invite code, or link
3. **Group Preview** → Show group details before joining
4. **Confirm Join** → Accept invitation
5. **Group Detail** → Navigate to joined group

#### Group Settings
1. **Group Detail** → Tap settings icon
2. **Group Settings** → Edit name, description, image
3. **Manage Members** → Add/remove members, change permissions
4. **Leave Group** → Option to leave (with confirmation)
5. **Archive Group** → Archive completed groups

### 3. Expense Creation Journey

#### Complete Expense Flow
1. **Group Detail** → Tap FAB (+) button
2. **Step 1: Basic Info**
   - Enter amount with currency formatting
   - Add description (required)
   - Select category from dropdown
   - Optional: Capture receipt photo
   - Tap "Next"

3. **Step 2: Payment Selection**
   - Choose who paid:
     - "I paid" (default selection)
     - "Someone else paid" → Select from group members
     - "Multiple people paid" → Enter amounts for each payer
   - Validate total matches expense amount
   - Tap "Next"

4. **Step 3: Split Options**
   - **Equal Split**:
     - Select members to include in split
     - Real-time calculation of per-person amount
   - **Unequal Split**:
     - Choose method: Shares, Percentages, or Exact Amounts
     - Enter values for each person
     - Real-time validation and calculation
   - Tap "Save"

5. **Confirmation** → Brief success message
6. **Return to Group** → Updated expense feed with new entry

### 4. Settlement Journey

#### Viewing Settlement Summary
1. **Group Detail** → View settlement summary card
2. **Settlement Options**:
   - "No pending payments" (if balanced)
   - "Settle Up" button (if debts exist)
   - Balance amount with color coding

#### Optimized Settlement Flow
1. **Group Detail** → Tap "Settle Up"
2. **Optimized View** → Algorithm shows minimum transactions needed
3. **Settlement List** → Each required payment with clear direction
4. **Record Payments** → Bulk action to record all payments
5. **Individual Recording** → Option to record payments separately

#### Individual Settlement
1. **Friend Detail** → Tap "Settle Up" 
2. **Payment Amount** → Pre-filled with owed amount (editable)
3. **Payment Method** → Select from Cash, Bank Transfer, Venmo, etc.
4. **Payment Note** → Optional reference or memo
5. **Confirmation** → Review payment details
6. **Record Payment** → Update balances across all groups

### 5. Friends Management Journey

#### Adding Friends
1. **Friends List** → Tap "Add friend"
2. **Search Methods**:
   - Search by email/phone
   - Import from contacts
   - QR code scan
   - Share invite link
3. **Send Invitation** → Friend receives notification
4. **Acceptance** → Friend appears in friends list

#### Friend Interaction
1. **Friends List** → View all friends with balance indicators
2. **Friend Detail** → Tap on specific friend
3. **Shared History** → View shared groups and transactions
4. **Direct Settlement** → Settle balances across all groups
5. **Transaction Filter** → Filter by group or date range

### 6. Home Dashboard Journey

#### Daily Usage
1. **App Launch** → Home screen with recent activity
2. **Quick Actions**:
   - View overall balance summary
   - Check recent transactions
   - Access notifications
   - Navigate to active groups

#### Analytics Review
1. **Home Screen** → Scroll to analytics section
2. **Monthly Summary** → Spending breakdown by category
3. **Trend Analysis** → Compare spending across time periods
4. **Group Insights** → Most active groups and frequent expenses

## Navigation Patterns

### Bottom Tab Navigation
- **Home**: Dashboard, recent activity, analytics
- **Groups**: Group list, group details, expense management
- **Friends**: Friends list, individual balances, settlements

### Modal Presentations
- **Expense Creation**: 3-step modal flow
- **Settlement Flow**: Modal for payment recording
- **Group Creation**: Modal for new group setup
- **Profile Actions**: Modal for profile-related actions

### Stack Navigation
- Each tab maintains its own navigation stack
- Deep linking support for shared expenses and group invites
- Proper back navigation with state preservation

## Error Handling & Edge Cases

### Network Issues
- Offline mode with local storage
- Sync when connection restored
- Clear indication of sync status

### Form Validation
- Real-time validation feedback
- Clear error messages
- Prevention of invalid submissions

### Permission Handling
- Camera access for receipt capture
- Contacts access for friend invitations
- Notification permissions for updates

### Conflict Resolution
- Handle concurrent edits to expenses
- Clear indication of outdated data
- Automatic refresh when conflicts detected

## Accessibility Considerations

### Screen Reader Support
- Semantic labels for all interactive elements
- Proper heading hierarchy
- Descriptive button and link text

### Visual Accessibility
- High contrast mode support
- Large text size compatibility
- Color-blind friendly design

### Motor Accessibility
- Minimum touch target sizes (44px)
- Alternative input methods
- Voice control compatibility

This user flow ensures a smooth, intuitive experience while maintaining the app's core functionality and Material 3 design principles.
