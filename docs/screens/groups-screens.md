# Groups Screens

## Groups List Screen

### Wireframe Sketch
```
┌─────────────────────────────┐
│ Groups        [�] [➕]     │
│─────────────────────────────│
│                             │
│ ┌─────────────────────┐     │
│ │ Weekend Trip        │     │
│ │ 5 members           │     │
│ │ Last activity: Today│     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ Apartment           │     │
│ │ 3 members           │     │
│ │ Last activity: 2d ago│    │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ Book Club           │     │
│ │ 8 members           │     │
│ │ Last activity: 1w ago│    │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ Create new group    │     │
│ └─────────────────────┘     │
│                             │
│                             │
│                             │
│                             │
│                             │
│ [HOME] [GROUPS] [FRIENDS]   │
└─────────────────────────────┘
```

### Description
Clean groups list with simplified group cards showing name, member count, and last activity. Features search functionality and quick group creation. Removes visual clutter by focusing on essential group information.

### Key Features
- Clean group cards with minimal design
- Search functionality to find specific groups
- Member count and last activity timestamp
- Quick group creation with dedicated button
- Join existing groups functionality
- Recent activity tracking without visual clutter

### Component Breakdown
- **Group Cards**: Simple elevated cards with group name, member count, last activity
- **Search Icon**: Top-right search functionality for finding groups
- **Add Group Icon**: Plus icon for creating new groups or joining existing ones
- **Create New Group**: Prominent button for group creation
- **Clean Layout**: Removes balance information for cleaner interface

### Interactions
- Tap group card to navigate to group details
- Tap search icon to open group search functionality
- Tap plus icon for group creation or joining options
- Pull-to-refresh to update group information
- Long press for quick group management options

## Group Details Screen

### Wireframe Sketch
```
┌─────────────────────────────┐
│ ← Weekend Trip              │
│─────────────────────────────│
│ Weekend Trip                │
│ 5 members • Created Jun 25  │
│                             │
│ ┌─────────────────────┐     │
│ │ You are owed $125   │     │
│ │ [SETTLE UP]         │     │
│ └─────────────────────┘     │
│                             │
│ EXPENSES                    │
│                             │
│ Today                       │
│ ┌─────────────────────┐     │
│ │ Dinner              │     │
│ │ $85 • You paid      │     │
│ │ Split equally (4)   │     │
│ └─────────────────────┘     │
│                             │
│ Yesterday                   │
│ ┌─────────────────────┐     │
│ │ Hotel               │     │
│ │ $350 • John paid    │     │
│ │ Split unequally     │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ Gas                 │     │
│ │ $45 • Sarah paid    │     │
│ │ Split equally (3)   │     │
│ └─────────────────────┘     │
│                             │
│                        [+]  │
└─────────────────────────────┘
```

### Description
Clean group details view focused on expenses with chronological organization. Shows group balance summary with settle up option and expense history organized by date. Features floating action button for adding new expenses.

### Key Features
- Clean header with group name and metadata
- Simplified balance summary with settle up action
- Chronologically organized expense list
- Date section headers for better organization
- Expense cards with essential information only
- Floating Action Button (FAB) for adding expenses
- Streamlined interface focused on expense tracking

### Component Breakdown

#### Header Section
- **Back Button**: Navigation back to groups list
- **Group Name**: Group title with creation date
- **Member Count**: Shows number of active members
- **Creation Date**: When the group was created

#### Balance Summary Card
- **Personal Balance**: User's balance within the group
- **Settle Up Button**: Direct action for balance settlement
- **Clean Design**: Minimal card with essential balance info

#### Expenses Section
- **Section Header**: "EXPENSES" with clear typography
- **Date Headers**: Organize expenses by day (Today, Yesterday, etc.)
- **Expense Cards**: Title, amount, payer, split method summary
- **Split Information**: Shows how expense was divided (equally/unequally)

#### Floating Action Button
- **Add Expense**: Primary action for expense creation
- **Position**: Bottom right corner
- **Clean Design**: Simple plus icon without text

### Interactions
- Tap back button to return to groups list
- Tap settle up button to initiate settlement process
- Tap expense cards to view detailed breakdown and edit options
- FAB to start expense creation flow
- Pull-to-refresh for latest expense data
- Long press expense for quick actions (edit, delete)

## Group Management Screen

### Wireframe Sketch
```
┌─────────────────────────────┐
│ ← Group Settings            │
│─────────────────────────────│
│                             │
│ Group Details               │
│ ┌─────────────────────┐     │
│ │ Group Name          │     │
│ │ [Roommates_______]  │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ Description         │     │
│ │ [Shared expenses__] │     │
│ └─────────────────────┘     │
│                             │
│ Members                     │
│ ┌─────────────────────┐     │
│ │ 👤 You (Admin)      │     │
│ │ 👤 Alex    [Remove] │     │
│ │ 👤 Sam     [Remove] │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ + INVITE MEMBER     │     │
│ └─────────────────────┘     │
│                             │
│ Group Actions               │
│ ┌─────────────────────┐     │
│ │ Share Group Link    │     │
│ │ Export Expenses     │     │
│ │ Settle All Debts    │     │
│ │ Delete Group        │     │
│ └─────────────────────┘     │
│                             │
└─────────────────────────────┘
```

### Description
Group administration interface for editing group details, managing members, and performing group-level actions. Only accessible to group admins with appropriate permissions.

### Key Features
- Editable group name and description
- Member management with role indicators
- Invite system with shareable links
- Group-level actions (export, settle, delete)
- Permission-based access control

### Component Breakdown

#### Group Details Section
- **Name Field**: Editable text input for group name
- **Description Field**: Optional group description
- **Group Icon**: Selectable emoji or image for group identification

#### Members Management
- **Member List**: Current members with avatars and roles
- **Role Indicators**: Admin, member, or invited status
- **Remove Buttons**: For admins to remove members
- **Invite Button**: Generate invite links or QR codes

#### Group Actions
- **Share Link**: Generate shareable group invitation
- **Export Data**: Download expense history as CSV/PDF
- **Settle All**: Initiate group-wide settlement process
- **Delete Group**: Permanently remove group (with confirmation)

### Interactions
- Edit group name and description with real-time saving
- Remove members with confirmation dialog
- Generate and share invite links
- Export expense data in multiple formats
- Delete group with multi-step confirmation

## Join Group Screen

### Wireframe Sketch
```
┌─────────────────────────────┐
│ ← Join Group                │
│─────────────────────────────│
│                             │
│        Join a Group         │
│                             │
│ Enter Group Code            │
│ ┌─────────────────────┐     │
│ │ [ABC123_________]   │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │     JOIN GROUP      │     │
│ └─────────────────────┘     │
│                             │
│        or                   │
│                             │
│ ┌─────────────────────┐     │
│ │   SCAN QR CODE      │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ [QR Camera Preview] │     │
│ │                     │     │
│ │  ┌─────────────┐    │     │
│ │  │    [ ]      │    │     │
│ │  └─────────────┘    │     │
│ │                     │     │
│ └─────────────────────┘     │
│                             │
│ Point camera at QR code     │
│                             │
└─────────────────────────────┘
```

### Description
Screen for joining existing groups through group codes or QR code scanning. Provides two input methods with clear instructions and visual feedback.

### Key Features
- Text input for manual group code entry
- QR code scanner with camera preview
- Input validation and error handling
- Success feedback upon joining
- Clear instructions for both methods

### Component Breakdown

#### Group Code Input
- **Text Field**: 6-character group code input with formatting
- **Join Button**: Primary action to join with entered code
- **Validation**: Real-time code format checking

#### QR Scanner
- **Camera Preview**: Live camera feed for QR scanning
- **Scan Overlay**: Visual guide for QR code positioning
- **Auto-Detection**: Automatic group joining upon successful scan
- **Manual Controls**: Flashlight toggle, camera switch

#### Instructions
- **Helper Text**: Clear guidance for each input method
- **Error Messages**: Specific feedback for invalid codes
- **Success States**: Confirmation of successful group joining

### Interactions
- Type or paste group code with auto-formatting
- Camera permission request for QR scanning
- Automatic navigation to group details upon successful join
- Error handling for invalid codes or network issues
