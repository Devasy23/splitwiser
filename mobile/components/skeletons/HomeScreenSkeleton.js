import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import Skeleton from '../ui/Skeleton';

const HomeScreenSkeleton = () => {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Loading groups">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} style={styles.card}>
          <Card.Title
            title={<Skeleton width={120} height={18} borderRadius={4} />}
            left={() => <Skeleton width={40} height={40} borderRadius={20} />}
          />
          <Card.Content>
            <Skeleton width={180} height={14} borderRadius={4} style={styles.contentSkeleton} />
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
  contentSkeleton: {
    marginTop: 4,
  },
});

export default HomeScreenSkeleton;
