# Navigation Map - Splitwiser Mobile App

## Overview
This document provides a comprehensive analysis of the current navigation structure and user flows in the Splitwiser mobile application, along with recommendations for the complete navigation architecture.

## Current Navigation Implementation

### Navigation Framework
- **Library**: React Navigation v6 (@react-navigation/native v6.1.9)
- **Primary Navigator**: Native Stack Navigator (@react-navigation/native-stack v6.9.17)
- **Pattern**: Conditional rendering based on authentication state

### Current Navigation Structure

```
App (NavigationContainer)
└── AuthProvider
    └── AppNavigator (Stack.Navigator)
        ├── Authenticated Route
        │   └── Home Screen
        │       ├── Header: "Splitwiser"
        │       └── Logout Button
        └── Unauthenticated Route
            └── Login Screen
                ├── Header: Hidden
                └── Toggle: Login/Signup
```

### Navigation Code Analysis

#### App.tsx Structure
```typescript
function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Splitwiser' }} 
        />
      ) : (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
      )}
    </Stack.Navigator>
  );
}
```

## Current User Flows

### 1. Authentication Flow
```
App Launch
├── Check Auth State (AuthContext)
├── If Not Authenticated
│   └── LoginScreen
│       ├── Login Form
│       │   ├── Email Input
│       │   ├── Password Input
│       │   ├── Submit → API Call → Success → Home
│       │   └── Error → Alert Dialog
│       └── Toggle to Signup
│           ├── Name Input
│           ├── Email Input
│           ├── Password Input
│           ├── Submit → API Call → Success → Home
│           └── Error → Alert Dialog
└── If Authenticated
    └── HomeScreen (Dummy)
```

### 2. Home Screen Flow
```
HomeScreen
├── Header
│   ├── Title: "Splitwiser"
│   └── Logout Button → Clear Auth → LoginScreen
├── Welcome Card
│   └── User Greeting
├── Profile Card
│   ├── Name Display
│   ├── Email Display
│   └── User ID Display
└── Dummy Content Card
    └── Placeholder Text
```

## Navigation Strengths

### 1. Authentication Integration
- ✅ Seamless auth state management
- ✅ Automatic route protection
- ✅ Persistent login state with refresh tokens
- ✅ Clean separation of authenticated/unauthenticated flows

### 2. Technical Implementation
- ✅ Modern React Navigation v6
- ✅ TypeScript integration
- ✅ Proper stack navigation setup
- ✅ Context-based state management

### 3. User Experience
- ✅ Intuitive authentication flow
- ✅ No navigation complexity for users
- ✅ Clear visual hierarchy

## Navigation Limitations

### 1. Structural Limitations
- ❌ No tab navigation for main app sections
- ❌ No nested navigation structures
- ❌ Limited to single stack navigator
- ❌ No deep linking support

### 2. Missing Navigation Patterns
- ❌ No modal navigation
- ❌ No drawer/side menu navigation
- ❌ No bottom tab navigation
- ❌ No navigation guards or interceptors

### 3. User Flow Limitations
- ❌ No way to navigate between app sections
- ❌ No back navigation patterns
- ❌ No navigation history management
- ❌ No conditional navigation based on user state

## Recommended Navigation Architecture

### 1. Complete Navigation Structure

```
App (NavigationContainer)
└── AuthProvider
    └── RootNavigator (Stack)
        ├── Auth Stack (Not Authenticated)
        │   ├── LoginScreen
        │   ├── SignupScreen
        │   ├── ForgotPasswordScreen
        │   └── ResetPasswordScreen
        └── Main Stack (Authenticated)
            ├── TabNavigator (Bottom Tabs)
            │   ├── Home Tab (Stack)
            │   │   ├── DashboardScreen
            │   │   ├── NotificationsScreen
            │   │   └── QuickActionsModal
            │   ├── Groups Tab (Stack)
            │   │   ├── GroupsListScreen
            │   │   ├── GroupDetailsScreen
            │   │   ├── CreateGroupScreen
            │   │   ├── EditGroupScreen
            │   │   ├── AddMembersScreen
            │   │   └── GroupSettingsScreen
            │   ├── Expenses Tab (Stack)
            │   │   ├── ExpensesListScreen
            │   │   ├── AddExpenseScreen
            │   │   ├── ExpenseDetailsScreen
            │   │   ├── EditExpenseScreen
            │   │   ├── CategoriesScreen
            │   │   └── ReceiptCameraScreen
            │   ├── Balances Tab (Stack)
            │   │   ├── BalancesOverviewScreen
            │   │   ├── SettlementScreen
            │   │   ├── PaymentRecordScreen
            │   │   └── TransactionHistoryScreen
            │   └── Profile Tab (Stack)
            │       ├── ProfileScreen
            │       ├── EditProfileScreen
            │       ├── SettingsScreen
            │       ├── NotificationSettingsScreen
            │       ├── PrivacySettingsScreen
            │       ├── HelpScreen
            │       └── AboutScreen
            └── Modal Stack (App-wide modals)
                ├── SearchModal
                ├── FilterModal
                ├── ShareModal
                └── ConfirmationModal
```

### 2. Navigation Types Implementation

#### Tab Navigation
```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Groups" component={GroupsStack} />
      <Tab.Screen name="Expenses" component={ExpensesStack} />
      <Tab.Screen name="Balances" component={BalancesStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
```

#### Nested Stack Navigation
```typescript
function GroupsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="GroupsList" component={GroupsListScreen} />
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
    </Stack.Navigator>
  );
}
```

## User Journey Maps

### 1. New User Journey
```
App Launch → Registration → Profile Setup → Tutorial → Dashboard → Create First Group → Add Expense → View Balance
```

### 2. Returning User Journey
```
App Launch → Auto-Login → Dashboard → Recent Activity → Quick Actions
```

### 3. Core User Flows

#### Creating a Group
```
Dashboard → Groups Tab → Groups List → Create Group Button → Form → Member Selection → Group Created → Group Details
```

#### Adding an Expense
```
Group Details → Add Expense → Category Selection → Amount Entry → Split Method → Receipt (Optional) → Save → Updated Balances
```

#### Settling Balances
```
Balances Tab → View Debts → Settlement Suggestions → Record Payment → Confirmation → Updated Balances
```

## Navigation Enhancement Recommendations

### Phase 1: Core Navigation Structure
1. **Implement Bottom Tab Navigation**
   - Add react-navigation/bottom-tabs
   - Create main tab structure
   - Add tab icons and labels

2. **Create Stack Navigators for Each Tab**
   - Home stack for dashboard and notifications
   - Groups stack for group management
   - Expenses stack for expense operations
   - Profile stack for user settings

### Phase 2: Enhanced Navigation Features
1. **Modal Navigation**
   - Add expense modal from any screen
   - Search and filter modals
   - Confirmation dialogs

2. **Deep Linking**
   - Group invitation links
   - Expense sharing links
   - Direct navigation to specific screens

3. **Navigation Guards**
   - Unsaved changes warnings
   - Permission-based navigation
   - Loading states during navigation

### Phase 3: Advanced Navigation
1. **Gesture Navigation**
   - Swipe actions on lists
   - Pull-to-refresh
   - Slide navigation patterns

2. **Context-Aware Navigation**
   - Smart back button behavior
   - Breadcrumb navigation
   - Navigation suggestions

## Navigation Performance Considerations

### Current Performance
- ✅ Minimal navigation overhead (only 2 screens)
- ✅ Fast transitions
- ✅ No memory leaks

### Optimization Strategies for Extended Navigation
1. **Lazy Loading**: Load screens only when needed
2. **Screen Caching**: Cache frequently accessed screens
3. **Animation Optimization**: Use native animations
4. **Memory Management**: Proper cleanup of unused screens

## Accessibility in Navigation

### Current State
- ✅ Basic screen reader support
- ❌ No navigation announcements
- ❌ No keyboard navigation support

### Recommended Improvements
1. **Screen Reader Support**: Proper labels and announcements
2. **Keyboard Navigation**: Tab order and focus management
3. **Voice Navigation**: Voice command support
4. **High Contrast**: Navigation visibility improvements

## Navigation Testing Strategy

### Current Testing Gaps
- ❌ No navigation flow testing
- ❌ No deep linking tests
- ❌ No accessibility navigation tests

### Recommended Testing
1. **Unit Tests**: Individual navigation components
2. **Integration Tests**: Complete user flows
3. **E2E Tests**: Full navigation scenarios
4. **Performance Tests**: Navigation transition times

## Conclusion

The current navigation implementation provides a solid foundation with proper authentication flow management. However, it requires significant expansion to support the full bill-splitting functionality. The recommended navigation architecture uses industry-standard patterns and will provide a scalable foundation for the complete Splitwiser experience.

**Next Steps**:
1. Implement bottom tab navigation
2. Create nested stack navigators for each major section
3. Add modal navigation for quick actions
4. Implement deep linking for sharing features

---

**Last Updated**: July 2025  
**Current Implementation**: Basic Stack Navigation with Auth Flow
