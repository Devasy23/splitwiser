import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card } from 'react-native-paper';
import Skeleton from '../ui/Skeleton';

const GroupListSkeleton = () => {
  const renderSkeletonItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title
        title={<Skeleton width={120} height={20} borderRadius={4} />}
        left={(props) => (
          <View style={[props.style, styles.avatarPlaceholder]}>
            <Skeleton width={40} height={40} borderRadius={20} />
          </View>
        )}
      />
      <Card.Content>
        <Skeleton width={180} height={16} borderRadius={4} style={styles.contentSkeleton} />
      </Card.Content>
    </Card>
  );

  // Render 5 placeholder items
  const skeletonData = Array.from({ length: 5 }).map((_, i) => ({ id: `skeleton-${i}` }));

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading groups"
    >
      <FlatList
        data={skeletonData}
        renderItem={renderSkeletonItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        scrollEnabled={false} // Disable scrolling for skeleton list
      />
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
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSkeleton: {
    marginTop: 4,
  },
});

export default GroupListSkeleton;
