import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import Skeleton from '../ui/Skeleton';

const GroupListSkeletonItem = () => {
  return (
    <Card style={styles.card}>
      <Card.Title
        title={<Skeleton width={120} height={16} borderRadius={4} />}
        left={(props) => <Skeleton width={40} height={40} borderRadius={20} />}
      />
      <Card.Content>
        <Skeleton width={150} height={14} borderRadius={4} style={styles.subtitle} />
      </Card.Content>
    </Card>
  );
};

const GroupListSkeleton = ({ count = 3 }) => {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading groups"
    >
      {Array.from({ length: count }).map((_, index) => (
        <GroupListSkeletonItem key={index} />
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
  subtitle: {
    marginTop: 4,
  },
});

export default GroupListSkeleton;
