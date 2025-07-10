# Settlement Screens

## Settlement Summary Screen

### Wireframe Sketch
```
┌─────────────────────────────┐
│ ← Settle Up                 │
│─────────────────────────────│
│                             │
│ Settlement Summary          │
│                             │
│ ┌─────────────────────┐     │
│ │ Total to settle:    │     │
│ │ $247.50             │     │
│ │                     │     │
│ │ Across 3 groups     │     │
│ └─────────────────────┘     │
│                             │
│ Your balances:              │
│                             │
│ ┌─────────────────────┐     │
│ │ 🏠 Roommates        │     │
│ │ You owe: $45.00     │     │
│ │ to Alex, Sam        │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ ✈️ Weekend Trip     │     │
│ │ You owe: $125.50    │     │
│ │ to Alex             │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ 🍽️ Dinner Club      │     │
│ │ You're owed: $77.00 │     │
│ │ from Mike, Sarah    │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ OPTIMIZE PAYMENTS   │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ SETTLE INDIVIDUAL   │     │
│ └─────────────────────┘     │
│                             │
└─────────────────────────────┘
```

### Description
Overview of all outstanding balances across groups with options for optimized settlements or individual group settlements. Shows total amounts and provides clear settlement pathways.

### Key Features
- Total settlement amount across all groups
- Group-by-group balance breakdown
- Creditor/debtor identification
- Optimized settlement algorithm option
- Individual settlement choices
- Payment method integration

### Component Breakdown

#### Settlement Overview Card
- **Total Amount**: Sum of all outstanding balances
- **Group Count**: Number of groups with pending balances
- **Net Position**: Whether user owes or is owed overall
- **Visual Hierarchy**: Clear emphasis on total settlement amount

#### Group Balance Cards
- **Group Identity**: Name, emoji, visual branding
- **Balance Amount**: Specific amount owed or due
- **Participants**: Who user owes money to or who owes user
- **Settlement Options**: Quick settle for individual groups

#### Settlement Options
- **Optimize Payments**: Algorithm-based minimal transaction settlement
- **Settle Individual**: Group-by-group settlement choices
- **Partial Settlement**: Option to settle specific amounts
- **Payment Methods**: Integration with various payment platforms

#### Action Buttons
- **Primary Actions**: Prominent settlement initiation buttons
- **Secondary Actions**: Export, share, or defer settlement
- **Smart Suggestions**: Recommended settlement strategies

### Interactions
- Tap group cards to see detailed breakdown
- Choose between optimized or individual settlements
- Select payment methods and amounts
- Confirm settlements with secure payment flow

## Optimized Settlement Screen

### Wireframe Sketch
```
┌─────────────────────────────┐
│ ← Optimized Settlement      │
│─────────────────────────────│
│                             │
│ Recommended Payments        │
│                             │
│ ┌─────────────────────┐     │
│ │ Instead of 6 payments   │
│ │ Make only 2 payments    │
│ │ Save time & effort! ✨  │
│ └─────────────────────┘     │
│                             │
│ Payment Plan:               │
│                             │
│ ┌─────────────────────┐     │
│ │ 1. Pay Alex         │     │
│ │    $93.50           │     │
│ │    [💳 Pay Now]     │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ 2. Pay Sam          │     │
│ │    $77.00           │     │
│ │    [💳 Pay Now]     │     │
│ └─────────────────────┘     │
│                             │
│ This will settle:           │
│ • Roommates group           │
│ • Weekend Trip group        │
│ • Your portion in Dinner    │
│                             │
│ ┌─────────────────────┐     │
│ │ Mike owes you $45   │     │
│ │ [Send Reminder]     │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ EXECUTE PLAN        │     │
│ └─────────────────────┘     │
│                             │
└─────────────────────────────┘
```

### Description
Algorithmic settlement optimization showing the minimum number of transactions needed to settle all balances. Displays recommended payment plan with clear benefits and execution options.

### Key Features
- Debt optimization algorithm results
- Clear before/after comparison
- Step-by-step payment plan
- Individual payment execution
- Remaining balance tracking
- Settlement efficiency metrics

### Component Breakdown

#### Optimization Summary
- **Transaction Reduction**: Show savings in number of payments
- **Efficiency Metrics**: Time and effort savings visualization
- **Algorithm Explanation**: Simple explanation of optimization benefits

#### Payment Plan
- **Sequential Steps**: Numbered payment instructions
- **Payment Amounts**: Exact amounts for each transaction
- **Recipients**: Clear identification of payment recipients
- **Payment Buttons**: Individual action buttons for each payment

#### Settlement Coverage
- **Affected Groups**: List of groups that will be settled
- **Remaining Balances**: Any amounts that still need separate handling
- **Completion Status**: Track progress through payment plan

#### Outstanding Items
- **Money Owed to User**: Amounts others still need to pay
- **Reminder Options**: Send payment reminders to debtors
- **Expected Timeline**: When user can expect incoming payments

### Interactions
- Execute individual payments in recommended order
- Skip or defer specific payments while maintaining optimization
- Send reminders for amounts owed to user
- View detailed explanation of optimization algorithm

## Record Payment Screen

### Wireframe Sketch
```
┌─────────────────────────────┐
│ ← Record Payment            │
│─────────────────────────────│
│                             │
│ Payment to Alex             │
│                             │
│ ┌─────────────────────┐     │
│ │ Amount              │     │
│ │ $ [93.50_______]    │     │
│ └─────────────────────┘     │
│                             │
│ Payment method              │
│ ┌─────────────────────┐     │
│ │ ○ Cash              │     │
│ │ ● Venmo             │     │
│ │ ○ PayPal            │     │
│ │ ○ Bank Transfer     │     │
│ │ ○ Other             │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ Payment details     │     │
│ │ [Reference/note___] │     │
│ └─────────────────────┘     │
│                             │
│ This payment settles:       │
│ • Roommates: $45.00         │
│ • Weekend Trip: $48.50      │
│                             │
│ ┌─────────────────────┐     │
│ │ ☑️ Mark as paid      │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ RECORD PAYMENT      │     │
│ └─────────────────────┘     │
│                             │
└─────────────────────────────┘
```

### Description
Screen for recording completed payments with payment method selection, amount confirmation, and automatic balance updates across relevant groups.

### Key Features
- Editable payment amount with smart defaults
- Multiple payment method options
- Reference/note field for payment tracking
- Automatic balance calculation and updates
- Integration with external payment platforms
- Confirmation and receipt generation

### Component Breakdown

#### Payment Details
- **Amount Field**: Pre-filled with recommended amount, editable
- **Recipient**: Clear identification of payment recipient
- **Currency**: Appropriate currency formatting and validation

#### Payment Methods
- **Cash**: Manual tracking without external integration
- **Digital Wallets**: Venmo, PayPal, Zelle integration
- **Bank Transfer**: Direct bank account connections
- **Other**: Custom payment method with manual tracking

#### Payment Reference
- **Notes Field**: Optional description or reference number
- **Transaction ID**: Automatic capture from integrated platforms
- **Receipt Upload**: Optional receipt or confirmation attachment

#### Settlement Preview
- **Affected Balances**: Show which group balances will be updated
- **Remaining Balances**: Calculate remaining amounts after payment
- **Confirmation**: Clear summary before finalizing payment

### Interactions
- Adjust payment amount while maintaining settlement logic
- Select payment method with appropriate integration flow
- Add payment notes and references
- Confirm payment with automatic balance updates
- Generate and share payment confirmation

## Payment Confirmation Screen

### Wireframe Sketch
```
┌─────────────────────────────┐
│ ← Payment Confirmed         │
│─────────────────────────────│
│                             │
│          ✅                 │
│                             │
│    Payment Successful!      │
│                             │
│ ┌─────────────────────┐     │
│ │ Payment Details     │     │
│ │                     │     │
│ │ To: Alex            │     │
│ │ Amount: $93.50      │     │
│ │ Method: Venmo       │     │
│ │ Date: Today, 2:15pm │     │
│ │ Ref: VM-123456789   │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ Balances Updated    │     │
│ │                     │     │
│ │ 🏠 Roommates: $0    │     │
│ │ ✈️ Weekend: $0      │     │
│ │                     │     │
│ │ New total owed: $0  │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │   SHARE RECEIPT     │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │   DONE              │     │
│ └─────────────────────┘     │
│                             │
└─────────────────────────────┘
```

### Description
Confirmation screen showing successful payment processing with detailed payment information, updated balances, and options to share payment confirmation.

### Key Features
- Success confirmation with visual feedback
- Complete payment details summary
- Automatic balance updates display
- Receipt sharing capabilities
- Navigation back to main screens
- Payment history integration

### Component Breakdown

#### Success Indicator
- **Visual Confirmation**: Checkmark or success animation
- **Success Message**: Clear confirmation of payment completion
- **Positive Feedback**: Encouraging message for successful transaction

#### Payment Summary
- **Transaction Details**: Complete payment information recap
- **Payment Method**: Confirmation of selected payment method
- **Reference Numbers**: Transaction IDs and confirmation codes
- **Timestamp**: Exact payment processing time

#### Balance Updates
- **Before/After**: Clear indication of balance changes
- **Affected Groups**: Groups with updated balances
- **New Totals**: Updated overall balance summary
- **Settlement Status**: Indication of fully settled relationships

#### Action Options
- **Share Receipt**: Send payment confirmation to relevant parties
- **Save to Files**: Export payment confirmation for records
- **Return Home**: Navigate back to main app screens
- **View History**: Access to complete payment history

### Interactions
- Share payment confirmation through various channels
- Save payment details for personal records
- Navigate to updated group or friend details
- Access payment history and analytics

## Payment History Screen

### Wireframe Sketch
```
┌─────────────────────────────┐
│ ← Payment History           │
│─────────────────────────────│
│                             │
│ Your Payment History        │
│                             │
│ Filter: [All ▼] [Dec ▼]     │
│                             │
│ ┌─────────────────────┐     │
│ │ Dec 15 - Paid Alex  │     │
│ │ $93.50 via Venmo    │     │
│ │ Settled 2 groups    │     │
│ │               [📄]  │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ Dec 12 - From Sarah │     │
│ │ $45.00 via PayPal   │     │
│ │ Dinner Club payment │     │
│ │               [📄]  │     │
│ └─────────────────────┘     │
│                             │
│ ┌─────────────────────┐     │
│ │ Dec 10 - Paid Mike  │     │
│ │ $30.00 Cash         │     │
│ │ Weekend trip        │     │
│ │               [📄]  │     │
│ └─────────────────────┘     │
│                             │
│ Monthly Total               │
│ Paid: $123.50               │
│ Received: $45.00            │
│                             │
│ ┌─────────────────────┐     │
│ │   EXPORT HISTORY    │     │
│ └─────────────────────┘     │
│                             │
└─────────────────────────────┘
```

### Description
Comprehensive payment history showing all past transactions with filtering, search, and export capabilities. Provides detailed record keeping for financial tracking.

### Key Features
- Chronological payment history
- Payment direction indicators (paid vs received)
- Payment method tracking
- Group/expense context for each payment
- Monthly and yearly summaries
- Export functionality for tax/accounting purposes

### Component Breakdown

#### Filter Controls
- **Payment Type**: All, sent, received payments
- **Time Period**: Month, year, date range selection
- **Payment Method**: Filter by specific payment methods
- **Group/Person**: Filter by specific relationships

#### Payment History Items
- **Transaction Date**: Clear timestamp for each payment
- **Payment Direction**: Visual distinction between sent/received
- **Amount & Method**: Payment amount and method used
- **Context**: Which groups or expenses were settled
- **Receipt Access**: Link to detailed payment confirmations

#### Summary Statistics
- **Period Totals**: Total amounts paid and received
- **Payment Breakdown**: Analysis by payment method
- **Group Analysis**: Payment activity by group
- **Trends**: Monthly payment patterns and insights

#### Export Options
- **PDF Reports**: Formatted payment history reports
- **CSV Export**: Spreadsheet-compatible data export
- **Tax Summaries**: Annual payment summaries for tax purposes
- **Custom Reports**: Filtered exports for specific needs

### Interactions
- Filter and search payment history by various criteria
- Tap payment items to view detailed receipts
- Export payment data in multiple formats
- View payment trends and analytics
- Access dispute resolution for incorrect payments
