import React, { useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Appbar, Avatar, List, Divider, useTheme } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

const AccountScreen = ({ navigation }) => {
    const theme = useTheme();
    const { user, logout } = useContext(AuthContext);

    const handleLogout = () => {
        logout();
    };

    const handleComingSoon = () => {
        Alert.alert('Coming Soon', 'This feature is not yet implemented.');
    };

    const styles = StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          padding: 16,
        },
        profileSection: {
          alignItems: 'center',
          marginBottom: 24,
        },
        name: {
            marginTop: 16,
            color: theme.colors.onSurface,
        },
          email: {
              marginTop: 4,
              color: theme.colors.onSurfaceVariant,
          }
      });

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Account" />
      </Appbar.Header>
      <View style={styles.content}>
        <View style={styles.profileSection}>
            <Avatar.Text size={80} label={user?.name?.charAt(0) || 'A'} />
            <Text variant="headlineSmall" style={styles.name}>{user?.name}</Text>
            <Text variant="bodyLarge" style={styles.email}>{user?.email}</Text>
        </View>

        <List.Section>
            <List.Item
                title="Edit Profile"
                left={() => <List.Icon icon="account-edit" />}
                onPress={() => navigation.navigate('EditProfile')}
            />
            <Divider />
            <List.Item
                title="Email Settings"
                left={() => <List.Icon icon="email-settings" />}
                onPress={handleComingSoon}
            />
            <Divider />
            <List.Item
                title="Send Feedback"
                left={() => <List.Icon icon="feedback" />}
                onPress={handleComingSoon}
            />
             <Divider />
            <List.Item
                title="Logout"
                left={() => <List.Icon icon="logout" />}
                onPress={handleLogout}
            />
        </List.Section>
      </View>
    </View>
  );
};

export default AccountScreen;
