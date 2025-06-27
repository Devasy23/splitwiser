import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types/user';

export default function AccountScreen() {
  const { logout, user, accessToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<UserProfile>('/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setProfile(response.data);
      } catch (err: any) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [accessToken]);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#2196F3" />
            </View>
            <Text style={styles.username}>{profile?.name || user?.name || 'User'}</Text>
            <Text style={styles.email}>{profile?.email || user?.email || ''}</Text>
            {profile?.currency && (
              <Text style={styles.email}>Currency: {profile.currency}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#F44336" />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 16,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#F44336',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});
