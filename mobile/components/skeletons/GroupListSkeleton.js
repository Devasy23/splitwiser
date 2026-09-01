import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from 'react-native-paper';
import Skeleton from '../ui/Skeleton';

const GroupListSkeleton = () => {
  return (
    <View
      style={styles.skeletonContainer}
      accessibilityLabel="Loading groups list"
      accessibilityRole="progressbar"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} style={styles.card}>
          <Card.Title
            title={<Skeleton width={150} height={16} borderRadius={4} />}
            left={() => <Skeleton width={40} height={40} borderRadius={20} />}
          />
          <Card.Content>
            <Skeleton width="60%" height={14} borderRadius={4} />
          </Card.Content>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});

export default GroupListSkeleton;
