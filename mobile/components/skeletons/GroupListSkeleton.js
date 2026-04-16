import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from 'react-native-paper';
import Skeleton from '../ui/Skeleton';

const GroupListSkeletonItem = () => (
  <Card style={styles.card}>
    <Card.Title
      title={<Skeleton width={120} height={20} />}
      left={(props) => (
        <View {...props}>
          <Skeleton width={40} height={40} borderRadius={20} />
        </View>
      )}
    />
    <Card.Content>
      <Skeleton width={200} height={16} style={{ marginTop: 4 }} />
    </Card.Content>
  </Card>
);

const GroupListSkeleton = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((key) => (
        <GroupListSkeletonItem key={key} />
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
