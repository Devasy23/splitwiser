import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Paragraph, Title, useTheme } from 'react-native-paper';

// Functional component to use theme hook
const ErrorFallback = ({ error, resetError }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <Title style={{ color: theme.colors.error, marginBottom: 8 }}>Oops! Something went wrong.</Title>
          <Paragraph style={styles.errorText}>
            {error?.message || "An unexpected error occurred."}
          </Paragraph>
          <Paragraph style={styles.suggestionText}>
            Please try again or restart the application if the problem persists.
          </Paragraph>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            onPress={resetError}
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
          >
            Try Again
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <ErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  suggestionText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.6,
  },
  actions: {
    justifyContent: 'center',
    paddingBottom: 16,
  }
});

export default ErrorBoundary;
