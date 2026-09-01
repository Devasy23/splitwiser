import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from 'react-native-paper';
import Skeleton from '../ui/Skeleton';

const GroupListSkeleton = ({ count = 5 }) => {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading groups list"
    >
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={styles.card}>
          <Card.Title
            title={<Skeleton width={120} height={20} borderRadius={4} />}
            left={(props) => (
              <Skeleton
                width={props.size || 40}
                height={props.size || 40}
                borderRadius={(props.size || 40) / 2}
                style={{ marginLeft: -8 }}
              />
            )}
          />
          <Card.Content>
            <Skeleton width={180} height={16} borderRadius={4} style={{ marginTop: 4 }} />
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
