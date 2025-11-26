import React, { useEffect, useState } from 'react';
import { getGroups, createGroup, joinGroup, getBalanceSummary } from '../services/api';
import { Group, BalanceSummary, GroupBalanceSummary } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { Plus, Users, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { THEMES } from '../constants';
import { motion, Variants } from 'framer-motion';

export const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  const navigate = useNavigate();
  const { style, mode } = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsRes, balanceRes] = await Promise.all([
        getGroups(),
        getBalanceSummary()
      ]);
      setGroups(groupsRes.data.groups);
      setBalanceSummary(balanceRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getGroupBalance = (groupId: string): GroupBalanceSummary | undefined => {
    return balanceSummary?.groupsSummary?.find((g: any) => g.groupId === groupId);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGroup({ name: newGroupName });
      setNewGroupName('');
      setIsCreateModalOpen(false);
      loadData();
    } catch (err) {
      alert('Failed to create group');
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinGroup(joinCode);
      setJoinCode('');
      setIsJoinModalOpen(false);
      loadData();
    } catch (err) {
      alert('Failed to join group (Invalid code or already joined)');
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-4xl font-extrabold mb-2">Groups</h1>
          <p className="opacity-70">Manage shared expenses with your squads.</p>
        </motion.div>
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex gap-3">
          <Button onClick={() => setIsJoinModalOpen(true)} variant="secondary">Join via Code</Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={20} /> Create Group
          </Button>
        </motion.div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {loading ? (
           Array(3).fill(0).map((_, i) => (
             <Skeleton key={i} className="h-48 w-full" />
           ))
        ) : (
          groups.map((group) => {
            const groupBalance = getGroupBalance(group._id);
            const balanceAmount = groupBalance?.amount || 0;

            return (
              <motion.div 
                key={group._id} 
                variants={itemVariants}
                whileHover={{ scale: 1.02, rotate: style === THEMES.NEOBRUTALISM ? 1 : 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/groups/${group._id}`)}
                className={`group cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col h-full
                  ${style === THEMES.NEOBRUTALISM 
                    ? `border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${mode === 'dark' ? 'bg-zinc-800' : 'bg-white'}` 
                    : `rounded-2xl border shadow-lg backdrop-blur-md ${mode === 'dark' ? 'border-white/20 bg-white/10 hover:bg-white/15' : 'border-black/10 bg-white/60 hover:bg-white/80'}`}
                `}
              >
                <div className={`h-24 w-full flex items-center px-6 relative overflow-hidden ${style === THEMES.NEOBRUTALISM ? 'bg-neo-main border-b-2 border-black' : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20'}`}>
                    <div className="relative z-10 flex justify-between w-full items-center">
                        <Users size={32} className="text-white opacity-80" />
                        {balanceAmount !== 0 && (
                            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                balanceAmount > 0 
                                ? (style === THEMES.NEOBRUTALISM ? 'bg-white text-green-600 border-2 border-black' : 'bg-green-500/20 text-green-300 border border-green-500/30')
                                : (style === THEMES.NEOBRUTALISM ? 'bg-white text-red-600 border-2 border-black' : 'bg-red-500/20 text-red-300 border border-red-500/30')
                            }`}>
                                {balanceAmount > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                {balanceAmount > 0 ? 'Owed' : 'Owe'} ${Math.abs(balanceAmount).toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                    <h3 className={`text-xl font-bold mb-1 ${style === THEMES.NEOBRUTALISM ? 'text-black' : (mode === 'dark' ? 'text-white' : 'text-gray-900')}`}>{group.name}</h3>
                    <p className="text-sm opacity-50 mb-4 font-mono">Currency: {group.currency}</p>
                    
                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-dashed border-gray-500/30">
                        <span className="text-xs font-mono opacity-60">Created: {new Date(group.createdAt).toLocaleDateString()}</span>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${style === THEMES.NEOBRUTALISM ? 'bg-black text-white group-hover:bg-neo-accent group-hover:text-black' : 'bg-white/10 text-white group-hover:bg-white/20'}`}>
                            <ArrowRight size={16} />
                        </div>
                    </div>
                </div>
              </motion.div>
            );
          })
        )}

        {!loading && groups.length === 0 && (
            <div className="col-span-full py-12 text-center opacity-50 border-2 border-dashed border-gray-400 rounded-xl">
                <h3 className="text-xl font-bold">No groups found</h3>
                <p>Create one or join an existing group to get started.</p>
            </div>
        )}
      </motion.div>

      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Create Group"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup}>Create Group</Button>
          </>
        }
      >
        <form id="createGroupForm" className="space-y-4">
          <Input 
            autoFocus
            label="Group Name" 
            value={newGroupName} 
            onChange={(e) => setNewGroupName(e.target.value)} 
            placeholder="e.g. Hawaii Trip 2024"
            required
          />
        </form>
      </Modal>

      <Modal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
        title="Join Group"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsJoinModalOpen(false)}>Cancel</Button>
            <Button onClick={handleJoinGroup}>Join Group</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input 
            autoFocus
            label="Invite Code" 
            value={joinCode} 
            onChange={(e) => setJoinCode(e.target.value)} 
            placeholder="Paste code here"
            required
          />
        </form>
      </Modal>
    </div>
  );
};