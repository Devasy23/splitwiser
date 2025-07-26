# Component Library - Splitwiser Mobile App

## Overview
This document provides a comprehensive analysis of the current component structure, reusable components, and recommendations for building a scalable component library in the Splitwiser mobile application.

## Current Component Architecture

### Component Organization
```
frontend/
├── App.tsx (Root Component)
├── screens/
│   ├── LoginScreen.tsx
│   └── HomeScreen.tsx
└── contexts/
    └── AuthContext.tsx
```

### Component Analysis

## 1. Core Application Components

### 1.1 App Component
- **File**: `App.tsx`
- **Type**: Root Application Component
- **Responsibility**: Navigation and Context Provider Setup

**Structure**:
```typescript
App
├── AuthProvider (Context)
└── NavigationContainer
    └── AppNavigator
        └── Stack.Navigator
            ├── HomeScreen (Authenticated)
            └── LoginScreen (Unauthenticated)
```

**Reusability**: ❌ Application-specific, not reusable
**Props**: None
**State**: None (uses context)

---

### 1.2 AppNavigator Component
- **File**: `App.tsx`
- **Type**: Navigation Component
- **Responsibility**: Route Management Based on Auth State

**Features**:
- Conditional rendering based on authentication
- Stack navigation setup
- Screen configuration

**Reusability**: 🔄 Structure could be abstracted for different navigation patterns

---

## 2. Screen Components

### 2.1 LoginScreen Component
- **File**: `screens/LoginScreen.tsx`
- **Type**: Screen Component
- **Responsibility**: User Authentication Interface

**Component Structure**:
```typescript
LoginScreen
├── KeyboardAvoidingView
└── ScrollView
    ├── Logo Container
    │   ├── App Logo Text
    │   └── Tagline Text
    └── Form Container
        ├── Title Text
        ├── Name Input (Conditional)
        ├── Email Input
        ├── Password Input
        ├── Submit Button
        └── Mode Toggle Button
```

**Reusable Elements Identified**:
- ✅ Input fields could be extracted
- ✅ Button component could be reusable
- ✅ Form container layout
- ✅ Logo/branding component

**State Management**:
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [name, setName] = useState('');
const [isSignUp, setIsSignUp] = useState(false);
```

**Props**: None (uses context for auth functions)

---

### 2.2 HomeScreen Component
- **File**: `screens/HomeScreen.tsx`
- **Type**: Screen Component
- **Responsibility**: Dashboard and User Profile Display

**Component Structure**:
```typescript
HomeScreen
├── SafeAreaView
├── Header
│   ├── Title Text
│   └── Logout Button
└── ScrollView
    ├── Welcome Card
    ├── Profile Info Card
    └── Dummy Content Card
```

**Reusable Elements Identified**:
- ✅ Card components
- ✅ Header component
- ✅ Info row components
- ✅ Button components

**Props**: None (uses context for user data)

---

## 3. Context Components

### 3.1 AuthProvider Component
- **File**: `contexts/AuthContext.tsx`
- **Type**: Context Provider
- **Responsibility**: Authentication State and API Management

**Provided Values**:
```typescript
type AuthContextType = {
  isAuthenticated: boolean;
  user: any;
  accessToken: string | null;
  refreshToken: string | null;
  login: (credentials) => Promise<void>;
  signup: (userData) => Promise<void>;
  logout: () => void;
  loading: boolean;
};
```

**Features**:
- JWT token management
- Automatic token refresh
- Secure token storage
- API interceptor setup

**Reusability**: ✅ Highly reusable authentication pattern

---

## 4. Component Reusability Assessment

### Current Reusable Patterns

#### 4.1 Styling Patterns
**Card Component Pattern**:
```typescript
const cardStyles = {
  backgroundColor: 'white',
  borderRadius: 10,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
};
```

**Button Pattern**:
```typescript
const buttonStyles = {
  backgroundColor: '#2e7d32',
  height: 50,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
};
```

**Input Pattern**:
```typescript
const inputStyles = {
  height: 50,
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  paddingHorizontal: 15,
  fontSize: 16,
  backgroundColor: '#f5f5f5',
};
```

### Component Extraction Opportunities

## 5. Recommended Component Library Structure

### 5.1 Base Components (Atoms)

#### Button Component
```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ ... }) => { ... }
```

#### Input Component
```typescript
interface InputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardType;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
}

const Input: React.FC<InputProps> = ({ ... }) => { ... }
```

#### Text Component
```typescript
interface TextProps {
  variant?: 'heading' | 'subheading' | 'body' | 'caption';
  color?: 'primary' | 'secondary' | 'success' | 'error';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

const Text: React.FC<TextProps> = ({ ... }) => { ... }
```

### 5.2 Layout Components (Molecules)

#### Card Component
```typescript
interface CardProps {
  children: React.ReactNode;
  padding?: number;
  margin?: number;
  shadow?: boolean;
}

const Card: React.FC<CardProps> = ({ ... }) => { ... }
```

#### Header Component
```typescript
interface HeaderProps {
  title: string;
  leftAction?: () => void;
  rightAction?: () => void;
  leftIcon?: string;
  rightIcon?: string;
}

const Header: React.FC<HeaderProps> = ({ ... }) => { ... }
```

#### Form Component
```typescript
interface FormProps {
  children: React.ReactNode;
  onSubmit: () => void;
  loading?: boolean;
}

const Form: React.FC<FormProps> = ({ ... }) => { ... }
```

### 5.3 Feature Components (Organisms)

#### UserProfile Component
```typescript
interface UserProfileProps {
  user: User;
  showActions?: boolean;
  onEdit?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ ... }) => { ... }
```

#### ExpenseCard Component
```typescript
interface ExpenseCardProps {
  expense: Expense;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ ... }) => { ... }
```

#### GroupMembersList Component
```typescript
interface GroupMembersListProps {
  members: Member[];
  onAddMember?: () => void;
  onRemoveMember?: (memberId: string) => void;
}

const GroupMembersList: React.FC<GroupMembersListProps> = ({ ... }) => { ... }
```

## 6. Component Design System

### 6.1 Design Tokens
```typescript
export const tokens = {
  colors: {
    primary: '#2e7d32',
    secondary: '#66bb6a',
    background: '#f5f5f5',
    surface: '#ffffff',
    error: '#f44336',
    text: {
      primary: '#333333',
      secondary: '#666666',
      light: '#999999',
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    sizes: {
      small: 14,
      medium: 16,
      large: 18,
      xlarge: 24,
      xxlarge: 32,
    },
    weights: {
      normal: '400',
      medium: '500',
      bold: '600',
      heavy: '700',
    }
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
  }
};
```

### 6.2 Theme Provider
```typescript
interface ThemeContextType {
  colors: typeof tokens.colors;
  spacing: typeof tokens.spacing;
  typography: typeof tokens.typography;
}

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ ... }) => { ... }
const useTheme = () => useContext(ThemeContext);
```

## 7. Component State Management

### Current Patterns
- **Local State**: useState for form inputs and UI state
- **Global State**: Context API for authentication
- **Props**: Direct prop passing (minimal nesting)

### Recommended Patterns
- **Local State**: useState for component-specific state
- **Global State**: Context API for app-wide state
- **Form State**: Consider react-hook-form for complex forms
- **Cache State**: Consider React Query for API state

## 8. Component Testing Strategy

### Current Testing Gaps
- ❌ No component tests
- ❌ No interaction testing
- ❌ No accessibility testing

### Recommended Testing Approach
```typescript
// Example component test
describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button title="Test" onPress={() => {}} />);
    expect(screen.getByText('Test')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    render(<Button title="Test" onPress={onPress} />);
    fireEvent.press(screen.getByText('Test'));
    expect(onPress).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<Button title="Test" onPress={() => {}} loading />);
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });
});
```

## 9. Component Performance Considerations

### Current Performance
- ✅ Minimal component re-renders
- ✅ Simple component structure
- ❌ No memoization strategies

### Optimization Strategies
1. **React.memo**: For expensive components
2. **useMemo**: For expensive calculations
3. **useCallback**: For stable function references
4. **Component Splitting**: Avoid large monolithic components

## 10. Component Documentation

### Recommended Documentation Structure
```typescript
/**
 * Button component for user interactions
 * 
 * @param title - Text displayed on the button
 * @param onPress - Function called when button is pressed
 * @param variant - Visual style variant
 * @param loading - Shows loading spinner when true
 * 
 * @example
 * <Button 
 *   title="Save Changes" 
 *   onPress={handleSave}
 *   variant="primary"
 *   loading={isLoading}
 * />
 */
```

## 11. Next Steps for Component Library

### Phase 1: Extract Core Components
1. Create `components/` directory structure
2. Extract Button, Input, Text components
3. Create Card and Header components
4. Implement basic theme system

### Phase 2: Build Feature Components
1. Create expense-related components
2. Build group management components
3. Add list and detail view components

### Phase 3: Advanced Features
1. Add animation components
2. Implement accessibility features
3. Create complex interaction components
4. Add component documentation

## Conclusion

The current component implementation provides a good foundation but lacks reusability and scalability. Building a proper component library will significantly improve development speed, consistency, and maintainability as the application grows.

**Immediate Priorities**:
1. Extract reusable Button and Input components
2. Create a Card component for consistent layouts
3. Implement a basic theme system
4. Set up component testing infrastructure

---

**Last Updated**: July 2025  
**Current State**: Monolithic components, no component library
