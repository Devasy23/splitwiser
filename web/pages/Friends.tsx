import React, { useEffect, useState } from 'react';
import { getFriendsBalance } from '../services/api';
import { Card } from '../components/ui/Card';
import { User } from 'lucide-react';

export const Friends = () => {
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await getFriendsBalance();
        setFriends(res.data.friendsBalance);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFriends();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8">Friends</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {friends.map((friend, idx) => (
          <Card key={idx} className="flex flex-col gap-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-gray-700">
                    <User />
                </div>
                <div>
                    <h3 className="font-bold text-lg">{friend.userName}</h3>
                    <p className={`font-mono font-bold ${friend.netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {friend.netBalance >= 0 ? 'owes you' : 'you owe'} ${Math.abs(friend.netBalance).toFixed(2)}
                    </p>
                </div>
             </div>
             
             {friend.breakdown.length > 0 && (
                 <div className="mt-2 pt-4 border-t border-gray-500/20 text-sm">
                    <p className="opacity-60 mb-2 font-bold uppercase text-xs">Groups</p>
                    {friend.breakdown.map((b: any, i: number) => (
                        <div key={i} className="flex justify-between mb-1">
                            <span>{b.groupName}</span>
                            <span className={b.owesYou ? 'text-emerald-500' : 'text-red-500'}>
                                {b.owesYou ? '+' : '-'}${Math.abs(b.balance).toFixed(2)}
                            </span>
                        </div>
                    ))}
                 </div>
             )}
          </Card>
        ))}
        
        {friends.length === 0 && (
            <div className="col-span-full opacity-50 text-center py-12">
                You don't have any outstanding balances with friends yet.
            </div>
        )}
      </div>
    </div>
  );
};
