import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import Skeleton from '../ui/Skeleton';

const GroupListSkeleton = ({ count = 4 }) => {
  // Create an array of length `count`
  const skeletons = Array.from({ length: count }, (_, index) => index);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.list}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading groups"
    >
      {skeletons.map((key) => (
        <Card key={`skeleton-${key}`} style={styles.card}>
          <Card.Title
            title={<Skeleton width={120} height={20} borderRadius={4} />}
            left={(props) => (
              <Skeleton width={props.size} height={props.size} borderRadius={props.size / 2} />
            )}
          />
          <Card.Content>
            <Skeleton width={180} height={16} borderRadius={4} style={styles.contentSkeleton} />
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  contentSkeleton: {
    marginTop: 4,
  },
});

export default GroupListSkeleton;
