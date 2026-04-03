import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import Skeleton from '../ui/Skeleton';

const GroupListSkeleton = ({ count = 3 }) => {
  return (
    <View
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading groups"
      style={styles.container}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={styles.card}>
          <Card.Title
            title={<Skeleton width="60%" height={24} borderRadius={4} />}
            left={() => <Skeleton width={40} height={40} borderRadius={20} />}
          />
          <Card.Content>
            <Skeleton width="40%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
          </Card.Content>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});

export default GroupListSkeleton;
