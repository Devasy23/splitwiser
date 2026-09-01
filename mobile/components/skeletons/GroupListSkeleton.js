import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import Skeleton from '../ui/Skeleton';

const GroupListSkeleton = ({ count = 4 }) => {
  return (
    <View
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading groups"
      style={styles.container}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={`group-skeleton-${index}`} style={styles.card}>
          <Card.Title
            title={<Skeleton width={150} height={20} />}
            left={() => <Skeleton width={40} height={40} borderRadius={20} />}
          />
          <Card.Content>
            <View style={styles.contentRow}>
              <Skeleton width={120} height={16} />
            </View>
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
  contentRow: {
    marginTop: 4,
  },
});

export default GroupListSkeleton;
