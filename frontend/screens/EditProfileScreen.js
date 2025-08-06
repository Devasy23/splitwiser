import React, { useState, useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, TextInput, Appbar, Title, useTheme } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { updateUser } from '../api/auth';

const EditProfileScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user, token, updateUserInContext } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await updateUser(token, { name });
      updateUserInContext(response.data);
      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 16,
    },
    input: {
      marginBottom: 16,
    },
    button: {
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Edit Profile" />
      </Appbar.Header>
      <View style={styles.content}>
        <Title>Edit Your Details</Title>
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <Button
          mode="contained"
          onPress={handleUpdateProfile}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.button}
        >
          Save Changes
        </Button>
      </View>
    </View>
  );
};

export default EditProfileScreen;
