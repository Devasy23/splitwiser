import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Info, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { THEMES } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { getFriendsBalance, getGroups } from '../services/api';

interface GroupBreakdown {
  groupId: string;
  groupName: string;
  balance: number;
  imageUrl?: string;
}

interface Friend {
  id: string;
  userId: string;
  userName: string;
  userImageUrl?: string;
  netBalance: number;
  breakdown: GroupBreakdown[];
}

export const Friends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFriends, setExpandedFriends] = useState<Set<string>>(new Set());
  const [showTooltip, setShowTooltip] = useState(true);
  const { style } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [friendsRes, groupsRes] = await Promise.all([
          getFriendsBalance(),
          getGroups()
        ]);
        
        const friendsData = friendsRes.data.friendsBalance || [];
        const groups = groupsRes.data.groups || [];
        
        // Create groups map for icons
        const gMap = new Map<string, { name: string; imageUrl?: string }>(
          groups.map((g: any) => [g._id, { name: g.name, imageUrl: g.imageUrl }])
        );

        // Transform friends data
        const transformedFriends = friendsData.map((friend: any) => ({
          id: friend.userId,
          userId: friend.userId,
          userName: friend.userName,
          userImageUrl: friend.userImageUrl,
          netBalance: friend.netBalance,
          breakdown: (friend.breakdown || []).map((group: any) => ({
            groupId: group.groupId,
            groupName: group.groupName,
            balance: group.balance,
            imageUrl: gMap.get(group.groupId)?.imageUrl
          }))
        }));

        setFriends(transformedFriends);
      } catch (err) {
        console.error('Failed to fetch friends balance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleExpand = (friendId: string) => {
    setExpandedFriends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else {
        newSet.add(friendId);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toFixed(2)}`;
  };

  const getAvatarContent = (imageUrl: string | undefined, name: string, size: 'sm' | 'lg' = 'lg') => {
    const sizeClass = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm';
    
    if (imageUrl && /^(https?:|data:image)/.test(imageUrl)) {
      return (
        <img
          src={imageUrl}
          alt={name}
          className={`${sizeClass} rounded-full object-cover`}
        />
      );
    }
    
    // Check for base64 without prefix
    if (imageUrl && /^[A-Za-z0-9+/=]+$/.test(imageUrl.substring(0, 50))) {
      return (
        <img
          src={`data:image/jpeg;base64,${imageUrl}`}
          alt={name}
          className={`${sizeClass} rounded-full object-cover`}
        />
      );
    }

    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white`}>
        {(name || '?').charAt(0)}
      </div>
    );
  };

  // Skeleton loading component
  const SkeletonRow = () => (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8">Friends</h1>
        <Card>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
        <h1 className="text-4xl font-extrabold mb-2">Friends</h1>
        <p className="opacity-70 mb-6">Your balances across all shared groups</p>
      </motion.div>

      {/* Tooltip/Explanation Banner */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              style === THEMES.NEOBRUTALISM
                ? 'bg-blue-100 border-2 border-black'
                : 'bg-blue-500/10 border border-blue-500/30'
            }`}
          >
            <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm flex-1 opacity-80">
              💡 These amounts show your direct balance with each friend across all shared groups. 
              Click on a friend to see the breakdown by group. Check individual group details for 
              optimized settlement suggestions.
            </p>
            <button
              onClick={() => setShowTooltip(false)}
              className="opacity-50 hover:opacity-100 transition-opacity"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friends List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          {friends.length === 0 ? (
            <div className="py-12 text-center opacity-50 flex flex-col items-center">
              <Users size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">No balances with friends yet.</p>
              <p className="text-sm">Join or create a group and add expenses to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {friends.map((friend, index) => {
                const isExpanded = expandedFriends.has(friend.id);
                const balanceColor = friend.netBalance < 0 ? 'text-red-500' : 'text-emerald-500';
                const balanceText = friend.netBalance < 0
                  ? `You owe ${formatCurrency(friend.netBalance)}`
                  : friend.netBalance > 0
                    ? `Owes you ${formatCurrency(friend.netBalance)}`
                    : 'Settled up';

                return (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Friend Row */}
                    <button
                      onClick={() => toggleExpand(friend.id)}
                      className={`w-full flex items-center justify-between p-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5`}
                    >
                      <div className="flex items-center gap-4">
                        {getAvatarContent(friend.userImageUrl, friend.userName)}
                        <div className="text-left">
                          <h3 className="font-bold text-lg">{friend.userName}</h3>
                          <p className={`text-sm font-medium ${friend.netBalance !== 0 ? balanceColor : 'opacity-50'}`}>
                            {balanceText}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {friend.breakdown.length > 0 && (
                          <span className="text-xs opacity-50 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {friend.breakdown.length} group{friend.breakdown.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>

                    {/* Expanded Group Breakdown */}
                    <AnimatePresence>
                      {isExpanded && friend.breakdown.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className={`pl-8 pr-4 pb-4 space-y-2 ${
                            style === THEMES.NEOBRUTALISM
                              ? 'bg-gray-50 dark:bg-gray-800'
                              : 'bg-black/5 dark:bg-white/5'
                          }`}>
                            {friend.breakdown.map((group) => {
                              const groupBalanceColor = group.balance < 0 ? 'text-red-500' : 'text-emerald-500';
                              const groupBalanceText = group.balance < 0
                                ? `You owe ${formatCurrency(group.balance)}`
                                : `Owes you ${formatCurrency(group.balance)}`;

                              return (
                                <div
                                  key={group.groupId}
                                  className={`flex items-center justify-between p-3 rounded-lg ${
                                    style === THEMES.NEOBRUTALISM
                                      ? 'bg-white border-2 border-black'
                                      : 'bg-white/10'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {getAvatarContent(group.imageUrl, group.groupName, 'sm')}
                                    <span className="font-medium">{group.groupName}</span>
                                  </div>
                                  <span className={`font-mono font-bold text-sm ${groupBalanceColor}`}>
                                    {groupBalanceText}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
