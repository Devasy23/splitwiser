# SplitWiser: Mobile App Frontend UI Design

## Overview
SplitWiser is a React Native + Expo mobile application built with Material 3 design principles. The app focuses on intuitive expense splitting and settlement optimization with minimal user interface complexity.

## Technology Stack
- **Framework**: React Native + Expo
- **UI Library**: React Native Paper (Material 3)
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation v6
- **Design System**: Material Design 3

## Documentation Structure
This frontend design is organized across multiple documents for better maintainability:

- **[User Flow & Navigation](./frontend-user-flow.md)** - App navigation patterns and user journey
- **[Authentication Screens](./screens/auth-screens.md)** - Login, signup, and onboarding flows
- **[Main Navigation](./screens/main-navigation.md)** - Home screen and overall app navigation
- **[Groups Management](./screens/groups-screens.md)** - Groups list, details, and management
- **[Expense Creation](./screens/expense-creation.md)** - Step-by-step expense addition flow
- **[Friends Management](./screens/friends-screens.md)** - Friends list and individual friend details
- **[Settlement Flow](./screens/settlement-screens.md)** - Debt optimization and payment recording
- **[Material 3 Design System](./design-system.md)** - Colors, typography, and component specifications
- **[Folder Structure](./folder-structure.md)** - React Native + Expo project organization

## Quick Reference

### Key UX Principles
1. **Progressive Disclosure**: Show only relevant information at each step
2. **Smart Defaults**: Pre-fill common values and selections
3. **Real-time Feedback**: Show calculations and validations immediately
4. **Error Prevention**: Validate inputs before allowing progression
5. **Consistent Interactions**: Use same patterns across similar features
6. **Accessibility First**: Support screen readers and large text
7. **Offline Support**: Cache data and sync when connection restored

### Navigation Structure
- **Bottom Navigation**: Home, Groups, Friends (3 main tabs)
- **Authentication Stack**: Login/Signup flow
- **Modal Stacks**: Expense creation, Settlement flows
- **Screen Transitions**: Material motion patterns with smooth animations

### Implementation Notes
- Use `react-native-paper` v5+ for Material 3 components
- Implement dynamic color theming based on system preferences
- Follow Material 3 guidelines for spacing, elevation, and typography
- Support both light and dark modes with automatic switching
- Ensure accessibility compliance with screen readers and large text support
