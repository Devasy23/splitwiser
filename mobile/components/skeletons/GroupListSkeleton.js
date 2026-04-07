import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import Skeleton from '../ui/Skeleton';

const GroupListSkeleton = () => {
  // Array of 5 items to show while loading
  const skeletonItems = Array.from({ length: 5 }, (_, i) => i);

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading groups"
    >
      <ScrollView contentContainerStyle={styles.list}>
        {skeletonItems.map((item) => (
          <Card key={item} style={styles.card}>
            <Card.Title
              title={<Skeleton width={120} height={20} />}
              left={(props) => (
                <View {...props}>
                  <Skeleton width={40} height={40} borderRadius={20} />
                </View>
              )}
            />
            <Card.Content>
              <Skeleton width={150} height={16} style={styles.statusSkeleton} />
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
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
  statusSkeleton: {
    marginTop: 4,
  },
});

export default GroupListSkeleton;
