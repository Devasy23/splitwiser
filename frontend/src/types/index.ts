// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  imageUrl?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// Group Types
export interface Group {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  joinCode?: string;
  members: GroupMember[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  userId: string;
  user: User;
  joinedAt: string;
  role?: 'admin' | 'member';
}

// Expense Types
export interface Expense {
  _id: string;
  description: string;
  amount: number;
  groupId: string;
  createdBy: string;
  category?: string;
  splits: ExpenseSplit[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
  percentage?: number;
}

// Settlement Types
export interface Settlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
}

// Navigation Types
export type RouteParams = {
  GroupDetails: {
    groupId: string;
    groupName: string;
    groupIcon?: string;
  };
  AddExpense: {
    groupId: string;
  };
  JoinGroup: {
    inviteCode?: string;
  };
  [key: string]: any; // Index signature for ParamListBase compatibility
};

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

// Theme Types (Material 3)
export interface ColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

export interface Material3Theme {
  light: {
    colors: ColorScheme;
  };
  dark: {
    colors: ColorScheme;
  };
}
