import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Banknote, Check, Copy, DollarSign, Hash, Layers, LogOut, Pencil, PieChart, Plus, Receipt, Settings, Share2, Trash2, UserMinus } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { THEMES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    createExpense,
    createSettlement,
    deleteExpense,
    deleteGroup,
    getExpenses,
    getGroupDetails,
    getGroupMembers,
    getOptimizedSettlements,
    leaveGroup, removeMember,
    updateExpense,
    updateGroup
} from '../services/api';
import { Expense, Group, GroupMember, SplitType } from '../types';

type UnequalMode = 'amount' | 'percentage' | 'shares';

export const GroupDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { style, mode } = useTheme();

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'settlements'>('expenses');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Expense Form State
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [splitType, setSplitType] = useState<SplitType>(SplitType.EQUAL);
  const [unequalMode, setUnequalMode] = useState<UnequalMode>('amount');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [splitValues, setSplitValues] = useState<{[key: string]: string}>({}); 
  const [payerId, setPayerId] = useState('');

  // Payment Form State
  const [paymentPayerId, setPaymentPayerId] = useState('');
  const [paymentPayeeId, setPaymentPayeeId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  // Group Settings State
  const [editGroupName, setEditGroupName] = useState('');
  const [settingsTab, setSettingsTab] = useState<'info' | 'members' | 'danger'>('info');
  const [copied, setCopied] = useState(false);

  // Check if current user is admin
  const isAdmin = useMemo(() => {
    const me = members.find(m => m.userId === user?._id);
    return me?.role === 'admin';
  }, [members, user?._id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    if (members.length > 0) {
        if (!editingExpenseId) {
            setSelectedUsers(new Set(members.map(m => m.userId)));
            if (group?.currency) setCurrency(group.currency);
            if (user && !payerId) setPayerId(user._id);
        }
        
        // Defaults for payment modal
        if (user && !paymentPayerId) setPaymentPayerId(user._id);
        if (members.length > 1 && !paymentPayeeId) {
            const other = members.find(m => m.userId !== user?._id);
            if (other) setPaymentPayeeId(other.userId);
        }
    }
  }, [members, group, user, editingExpenseId]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [groupRes, expRes, memRes, setRes] = await Promise.all([
        getGroupDetails(id),
        getExpenses(id),
        getGroupMembers(id),
        getOptimizedSettlements(id)
      ]);
      setGroup(groupRes.data);
      setExpenses(expRes.data.expenses);
      setMembers(memRes.data);
      setSettlements(setRes.data.optimizedSettlements);
      setEditGroupName(groupRes.data.name);
    } catch (err) {
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (group?.joinCode) {
      navigator.clipboard.writeText(group.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareInvite = async () => {
    if (!group?.joinCode) return;
    const text = `Join my group on Splitwiser! Use code ${group.joinCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Splitwiser group',
          text,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
        navigator.clipboard.writeText(text);
        alert('Invite copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Invite copied to clipboard!');
    }
  };

  const remainingAmount = useMemo(() => {
    const total = parseFloat(amount) || 0;
    if (splitType === SplitType.EQUAL) return 0;

    const values = Object.values(splitValues) as string[];
    
    if (unequalMode === 'amount') {
        const sum = values.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
        return total - sum;
    }
    if (unequalMode === 'percentage') {
        const sum = values.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
        return 100 - sum;
    }
    return 0;
  }, [amount, splitType, unequalMode, splitValues]);

  // --- Handlers ---

  const openAddExpense = () => {
      setEditingExpenseId(null);
      resetExpenseForm();
      setIsExpenseModalOpen(true);
  };

  const openEditExpense = (expense: Expense) => {
      setEditingExpenseId(expense._id);
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setPayerId(expense.paidBy);
      setSplitType(expense.splitType);
      
      // Reconstruction logic
      if (expense.splitType === SplitType.EQUAL) {
          setSelectedUsers(new Set(expense.splits.map(s => s.userId)));
      } else {
          // For unequal, populate amounts. Can't easily restore percentage/shares source of truth without extra data.
          setUnequalMode('amount'); 
          const vals: any = {};
          expense.splits.forEach(s => vals[s.userId] = s.amount.toString());
          setSplitValues(vals);
      }
      setIsExpenseModalOpen(true);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const numAmount = parseFloat(amount);
    let requestSplits: { userId: string; amount: number }[] = [];

    if (splitType === SplitType.EQUAL) {
        const involvedMembers = members.filter(m => selectedUsers.has(m.userId));
        if (involvedMembers.length === 0) return alert("Select at least one person.");
        const splitAmount = numAmount / involvedMembers.length;
        requestSplits = involvedMembers.map(m => ({ userId: m.userId, amount: splitAmount }));
    } else {
        // Handle Unequal
        const splitVals = Object.values(splitValues) as string[];
        if (unequalMode === 'amount') {
            const sum = splitVals.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
            if (Math.abs(sum - numAmount) > 0.01) return alert(`Amounts must match total.`);
            requestSplits = Object.entries(splitValues).map(([uid, val]) => ({ userId: uid, amount: parseFloat(val as string) || 0 }));
        } else if (unequalMode === 'percentage') {
             const sum = splitVals.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
             if (Math.abs(sum - 100) > 0.1) return alert(`Percentages must equal 100%.`);
             requestSplits = Object.entries(splitValues).map(([uid, val]) => ({ userId: uid, amount: (numAmount * (parseFloat(val as string) || 0)) / 100 }));
        } else if (unequalMode === 'shares') {
            const totalShares = splitVals.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
            if (totalShares === 0) return alert("Total shares cannot be zero.");
            requestSplits = Object.entries(splitValues).map(([uid, val]) => ({ userId: uid, amount: (numAmount * (parseFloat(val as string) || 0)) / totalShares }));
        }
    }

    // Filter out 0 amounts
    requestSplits = requestSplits.filter(s => s.amount > 0);

    const payload = {
        description,
        amount: numAmount,
        paidBy: payerId,
        splitType,
        splits: requestSplits,
    };

    try {
      if (editingExpenseId) {
          await updateExpense(id, editingExpenseId, payload);
      } else {
          await createExpense(id, payload);
      }
      setIsExpenseModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving expense');
    }
  };

  const handleDeleteExpense = async () => {
      if (!editingExpenseId || !id) return;
      if (window.confirm("Are you sure you want to delete this expense?")) {
          try {
              await deleteExpense(id, editingExpenseId);
              setIsExpenseModalOpen(false);
              fetchData();
          } catch (err) {
              alert("Failed to delete expense");
          }
      }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id) return;
      try {
          await createSettlement(id, {
              payer_id: paymentPayerId,
              payee_id: paymentPayeeId,
              amount: parseFloat(paymentAmount)
          });
          setIsPaymentModalOpen(false);
          setPaymentAmount('');
          fetchData();
      } catch (err) {
          alert("Failed to record payment");
      }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id) return;
      try {
          await updateGroup(id, { name: editGroupName });
          setIsSettingsModalOpen(false);
          fetchData();
      } catch (err) {
          alert("Failed to update group");
      }
  };

  const handleDeleteGroup = async () => {
      if (!id) return;
      if (window.confirm("Are you sure? This cannot be undone.")) {
          try {
              await deleteGroup(id);
              navigate('/groups');
          } catch (err) {
              alert("Failed to delete group");
          }
      }
  };

  const handleLeaveGroup = async () => {
      if (!id) return;
      if (window.confirm("You can only leave when your balances are settled. Continue?")) {
          try {
              await leaveGroup(id);
              alert('You have left the group');
              navigate('/groups');
          } catch (err: any) {
              alert(err.response?.data?.detail || "Cannot leave - please settle balances first");
          }
      }
  };

  const handleKickMember = async (memberId: string, memberName: string) => {
      if (!id || !isAdmin) return;
      if (memberId === user?._id) return; // Can't kick yourself
      
      if (window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) {
          try {
              // Check if member has unsettled balances
              const hasUnsettled = settlements.some(
                  s => (s.fromUserId === memberId || s.toUserId === memberId) && (s.amount || 0) > 0
              );
              if (hasUnsettled) {
                  alert('Cannot remove: This member has unsettled balances in the group.');
                  return;
              }
              await removeMember(id, memberId);
              fetchData();
          } catch (err: any) {
              alert(err.response?.data?.detail || "Failed to remove member");
          }
      }
  };

  const resetExpenseForm = () => {
    setDescription('');
    setAmount('');
    setSplitValues({});
    setSplitType(SplitType.EQUAL);
    setUnequalMode('amount');
    setSelectedUsers(new Set(members.map(m => m.userId)));
    if (user) setPayerId(user._id);
  };

  if (loading && !group) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  if (!group) return <div className="p-8">Group not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <Card className="relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 relative z-10">
            <div>
                <h1 className="text-4xl font-extrabold">{group.name}</h1>
                <div className="flex items-center gap-2 mt-2 opacity-70">
                    <span className="font-mono bg-black/10 dark:bg-white/10 px-2 py-1 rounded select-all">Code: {group.joinCode}</span>
                    <button onClick={copyToClipboard} className="hover:text-blue-500 transition-colors"><Copy size={16}/></button>
                </div>
            </div>
            <div className="flex flex-col items-end gap-3">
                <Button size="sm" variant="ghost" onClick={() => setIsSettingsModalOpen(true)}>
                    <Settings size={18} /> Settings
                </Button>
                <div className="flex -space-x-2">
                    {members.slice(0, 5).map(m => (
                        <div key={m.userId} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-md" title={m.user?.name}>
                            {m.user?.name?.charAt(0)}
                        </div>
                    ))}
                    {members.length > 5 && (
                        <div className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold shadow-md">
                            +{members.length - 5}
                        </div>
                    )}
                </div>
            </div>
            </div>
        </Card>
      </motion.div>

      {/* Tabs & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center sticky top-0 z-20 py-4 bg-transparent backdrop-blur-none gap-4">
        <div className={`flex gap-1 p-1 rounded-lg ${style === THEMES.NEOBRUTALISM ? 'border-2 border-black bg-white' : 'bg-white/10 backdrop-blur-md'}`}>
            <button 
                className={`px-4 py-2 rounded-md font-bold transition-all ${activeTab === 'expenses' ? (style === THEMES.NEOBRUTALISM ? 'bg-neo-main text-white' : 'bg-white/20 shadow-sm') : 'hover:opacity-70'}`}
                onClick={() => setActiveTab('expenses')}
            >
                Expenses
            </button>
            <button 
                className={`px-4 py-2 rounded-md font-bold transition-all ${activeTab === 'settlements' ? (style === THEMES.NEOBRUTALISM ? 'bg-neo-second text-black' : 'bg-white/20 shadow-sm') : 'hover:opacity-70'}`}
                onClick={() => setActiveTab('settlements')}
            >
                Balances
            </button>
        </div>
        <div className="flex gap-3">
            <Button onClick={() => setIsPaymentModalOpen(true)} variant="secondary" className="shadow-lg">
                <Banknote size={18} /> Record Payment
            </Button>
            <Button onClick={openAddExpense} className="shadow-lg">
                <Plus size={18} /> Add Expense
            </Button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'expenses' ? (
            <motion.div 
                key="expenses"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
                layout
            >
                {loading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />) : 
                expenses.map((expense, idx) => (
                    <motion.div 
                        layout
                        key={expense._id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => openEditExpense(expense)}
                        className={`p-4 flex items-center justify-between group cursor-pointer
                            ${style === THEMES.NEOBRUTALISM 
                                ? 'bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all' 
                                : 'bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-colors'}
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full flex-shrink-0 ${style === THEMES.NEOBRUTALISM ? 'bg-neo-second border-2 border-black' : 'bg-blue-500/20 text-blue-300'}`}>
                                <Receipt size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg leading-tight flex items-center gap-2">
                                    {expense.description}
                                    <Pencil size={12} className="opacity-0 group-hover:opacity-50" />
                                </h4>
                                <p className="text-sm opacity-60 mt-1">
                                    <span className="font-semibold">{members.find(m => m.userId === expense.paidBy)?.user?.name || 'Unknown'}</span> paid <span className="font-bold">{group.currency} {expense.amount.toFixed(2)}</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs opacity-50 mb-1">{new Date(expense.createdAt).toLocaleDateString()}</p>
                            <div className={`font-mono font-bold px-2 py-1 rounded text-xs inline-block uppercase tracking-wider ${style === THEMES.NEOBRUTALISM ? 'bg-black text-white' : 'bg-white/10'}`}>
                                {expense.splitType}
                            </div>
                        </div>
                    </motion.div>
                ))}
                {!loading && expenses.length === 0 && (
                    <div className="text-center py-12 opacity-50 flex flex-col items-center">
                        <Layers size={48} className="mb-4 opacity-50"/>
                        <p className="text-lg">No expenses yet. Add one to get started!</p>
                    </div>
                )}
            </motion.div>
        ) : (
            <motion.div 
                key="settlements"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                <Card title="Suggested Settlements" className="md:col-span-2">
                    <div className="space-y-3">
                        {loading ? <Skeleton className="h-40 w-full" /> : settlements.map((s, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx} 
                                className="flex items-center justify-between p-4 border-b border-gray-200/10 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold">
                                        {s.fromUserName.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-red-600 dark:text-red-400">{s.fromUserName}</span>
                                        <span className="text-xs opacity-60">owes</span>
                                    </div>
                                    <ArrowRight size={16} className="opacity-40" />
                                    <div className="flex flex-col text-right">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{s.toUserName}</span>
                                        <span className="text-xs opacity-60">receives</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                                        {s.toUserName.charAt(0)}
                                    </div>
                                </div>
                                <div className="font-mono font-bold text-xl">
                                    {group.currency} {s.amount.toFixed(2)}
                                </div>
                            </motion.div>
                        ))}
                        {!loading && settlements.length === 0 && (
                            <div className="text-center py-8">
                                <Check size={48} className="mx-auto mb-2 text-emerald-500" />
                                <p className="font-bold text-emerald-500">All settled up!</p>
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODALS --- */}

      {/* Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={editingExpenseId ? 'Edit Expense' : 'Add Expense'}
        footer={
            <div className="flex w-full justify-between gap-3">
                {editingExpenseId ? (
                    <Button variant="danger" type="button" onClick={handleDeleteExpense}>
                        <Trash2 size={16} /> Delete
                    </Button>
                ) : <div />}
                <div className="flex gap-3">
                    <Button variant="ghost" type="button" onClick={() => setIsExpenseModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleExpenseSubmit} disabled={remainingAmount > 0.01 && splitType === SplitType.UNEQUAL && unequalMode !== 'shares'}>
                        {editingExpenseId ? 'Save Changes' : 'Create Expense'}
                    </Button>
                </div>
            </div>
        }
      >
         <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    label="Description" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="e.g. Dinner at Mario's"
                    required 
                    autoFocus
                />
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <Input 
                            label="Amount" 
                            type="number" 
                            step="0.01" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            placeholder="0.00"
                            required 
                        />
                    </div>
                    <div className="w-24 flex flex-col gap-1">
                        <label className="text-sm font-semibold opacity-80">Currency</label>
                        <div className={`w-full p-3 font-bold text-center opacity-80 ${style === THEMES.NEOBRUTALISM ? 'border-2 border-black bg-white' : 'bg-white/10 border border-white/20 rounded-lg'}`}>
                            {currency}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold mb-2 opacity-80">Paid By</label>
                <div className="flex flex-wrap gap-2">
                    {members.map(m => (
                        <button
                            key={m.userId}
                            type="button"
                            onClick={() => setPayerId(m.userId)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                                payerId === m.userId 
                                ? (style === THEMES.NEOBRUTALISM ? 'bg-neo-main text-white border-black' : 'bg-blue-600 border-blue-500 text-white') 
                                : (style === THEMES.NEOBRUTALISM ? 'bg-white text-black border-black hover:bg-gray-100' : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400')
                            }`}
                        >
                            {m.userId === user?._id ? 'You' : m.user?.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`p-4 rounded-xl ${style === THEMES.NEOBRUTALISM ? 'border-2 border-black bg-neo-bg' : 'bg-white/5 border border-white/10'}`}>
                <div className="flex mb-4 border-b border-gray-500/20 pb-4 gap-4">
                    <button 
                        type="button"
                        onClick={() => setSplitType(SplitType.EQUAL)}
                        className={`flex items-center gap-2 font-bold ${splitType === SplitType.EQUAL ? 'text-blue-500' : 'opacity-50 hover:opacity-100'}`}
                    >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${splitType === SplitType.EQUAL ? 'border-blue-500' : 'border-gray-500'}`}>
                            {splitType === SplitType.EQUAL && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                        </div>
                        Split Equally
                    </button>
                    <button 
                        type="button"
                        onClick={() => setSplitType(SplitType.UNEQUAL)}
                        className={`flex items-center gap-2 font-bold ${splitType === SplitType.UNEQUAL ? 'text-blue-500' : 'opacity-50 hover:opacity-100'}`}
                    >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${splitType === SplitType.UNEQUAL ? 'border-blue-500' : 'border-gray-500'}`}>
                            {splitType === SplitType.UNEQUAL && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                        </div>
                        Split Unequally
                    </button>
                </div>

                {splitType === SplitType.EQUAL ? (
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-sm opacity-60">Who is involved?</p>
                            <button 
                                type="button"
                                onClick={() => {
                                    if (selectedUsers.size === members.length) setSelectedUsers(new Set());
                                    else setSelectedUsers(new Set(members.map(m => m.userId)));
                                }}
                                className="text-xs font-bold text-blue-500 hover:underline"
                            >
                                {selectedUsers.size === members.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {members.map(m => {
                                const isSelected = selectedUsers.has(m.userId);
                                return (
                                    <div 
                                        key={m.userId} 
                                        onClick={() => {
                                            const newSet = new Set(selectedUsers);
                                            if (isSelected) newSet.delete(m.userId);
                                            else newSet.add(m.userId);
                                            setSelectedUsers(newSet);
                                        }}
                                        className={`cursor-pointer flex items-center gap-2 p-2 rounded border transition-all ${
                                            isSelected 
                                            ? (style === THEMES.NEOBRUTALISM ? 'bg-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-blue-500/20 border-blue-500/50 text-white') 
                                            : (style === THEMES.NEOBRUTALISM ? 'bg-transparent border-gray-400 opacity-60' : 'bg-transparent border-gray-700 opacity-50')
                                        }`}
                                    >
                                        <div className={`w-4 h-4 flex items-center justify-center rounded border ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-500'}`}>
                                            {isSelected && <Check size={10} strokeWidth={4} />}
                                        </div>
                                        <span className="truncate font-medium text-sm">{m.user?.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="flex gap-2 mb-4">
                            {[
                                { id: 'amount', label: 'Amount', icon: DollarSign },
                                { id: 'percentage', label: 'Percentage', icon: PieChart },
                                { id: 'shares', label: 'Shares', icon: Hash },
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => setUnequalMode(mode.id as UnequalMode)}
                                    className={`flex-1 py-1.5 px-2 rounded text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                                        unequalMode === mode.id 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'bg-gray-200 dark:bg-gray-800 opacity-70 hover:opacity-100 dark:text-gray-300'
                                    }`}
                                >
                                    <mode.icon size={14} /> {mode.label}
                                </button>
                            ))}
                        </div>
                        
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {members.map(m => (
                                <div key={m.userId} className="flex items-center gap-2">
                                    <span className="text-sm w-1/3 truncate font-medium">{m.user?.name}</span>
                                    <div className="relative flex-1">
                                        <input 
                                            type="number" 
                                            className={`w-full p-2 rounded text-right font-mono font-bold outline-none border focus:border-blue-500 ${style === THEMES.NEOBRUTALISM ? 'border-black bg-white' : 'bg-black/20 border-gray-600 text-white'}`}
                                            placeholder="0"
                                            value={splitValues[m.userId] || ''}
                                            onChange={e => setSplitValues({...splitValues, [m.userId]: e.target.value})}
                                        />
                                        <span className="absolute right-8 top-1/2 -translate-y-1/2 opacity-50 text-xs pointer-events-none">
                                            {unequalMode === 'percentage' ? '%' : (unequalMode === 'shares' ? 'shares' : currency)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {(unequalMode === 'amount' || unequalMode === 'percentage') && (
                            <div className={`mt-3 text-right text-sm font-bold ${Math.abs(remainingAmount) < 0.01 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {Math.abs(remainingAmount) < 0.01 ? (
                                    <span className="flex items-center justify-end gap-1"><Check size={14} /> Perfectly distributed</span>
                                ) : (
                                    <span>{remainingAmount > 0 ? `${remainingAmount.toFixed(2)} remaining` : `${Math.abs(remainingAmount).toFixed(2)} over limit`}</span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
         </form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Payment"
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                <Button onClick={handleRecordPayment}>Record</Button>
            </>
        }
      >
          <div className="space-y-4">
              <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold opacity-80">Payer</label>
                  <select 
                    className={`w-full p-3 outline-none font-bold ${style === THEMES.NEOBRUTALISM ? 'border-2 border-black bg-white' : 'bg-white/10 border border-white/20 rounded-lg text-white'}`}
                    value={paymentPayerId}
                    onChange={e => setPaymentPayerId(e.target.value)}
                  >
                      {members.map(m => <option key={m.userId} value={m.userId}>{m.user?.name}</option>)}
                  </select>
              </div>
              <div className="flex justify-center">
                  <ArrowRight className="rotate-90 opacity-50" />
              </div>
              <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold opacity-80">Payee</label>
                  <select 
                    className={`w-full p-3 outline-none font-bold ${style === THEMES.NEOBRUTALISM ? 'border-2 border-black bg-white' : 'bg-white/10 border border-white/20 rounded-lg text-white'}`}
                    value={paymentPayeeId}
                    onChange={e => setPaymentPayeeId(e.target.value)}
                  >
                      {members.filter(m => m.userId !== paymentPayerId).map(m => <option key={m.userId} value={m.userId}>{m.user?.name}</option>)}
                  </select>
              </div>
              <Input 
                  label={`Amount (${group.currency})`}
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  required
              />
          </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
         isOpen={isSettingsModalOpen}
         onClose={() => { setIsSettingsModalOpen(false); setSettingsTab('info'); }}
         title="Group Settings"
      >
          <div className="space-y-4">
              {/* Tabs */}
              <div className={`flex gap-1 p-1 rounded-lg ${style === THEMES.NEOBRUTALISM ? 'border-2 border-black bg-gray-100' : 'bg-white/10'}`}>
                  <button 
                      onClick={() => setSettingsTab('info')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-bold transition-all ${settingsTab === 'info' ? (style === THEMES.NEOBRUTALISM ? 'bg-white border-2 border-black' : 'bg-white/20') : 'opacity-60 hover:opacity-100'}`}
                  >
                      Info
                  </button>
                  <button 
                      onClick={() => setSettingsTab('members')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-bold transition-all ${settingsTab === 'members' ? (style === THEMES.NEOBRUTALISM ? 'bg-white border-2 border-black' : 'bg-white/20') : 'opacity-60 hover:opacity-100'}`}
                  >
                      Members
                  </button>
                  <button 
                      onClick={() => setSettingsTab('danger')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-bold transition-all ${settingsTab === 'danger' ? (style === THEMES.NEOBRUTALISM ? 'bg-red-100 border-2 border-black text-red-600' : 'bg-red-500/20 text-red-400') : 'opacity-60 hover:opacity-100'}`}
                  >
                      Danger
                  </button>
              </div>

              {/* Info Tab */}
              {settingsTab === 'info' && (
                  <div className="space-y-4">
                      <form onSubmit={handleUpdateGroup} className="space-y-4">
                          <Input 
                              label="Group Name"
                              value={editGroupName}
                              onChange={e => setEditGroupName(e.target.value)}
                              disabled={!isAdmin}
                              required
                          />
                          {isAdmin && (
                              <div className="flex justify-end">
                                  <Button type="submit">Save Changes</Button>
                              </div>
                          )}
                      </form>

                      {/* Invite Section */}
                      <div className={`p-4 rounded-lg ${style === THEMES.NEOBRUTALISM ? 'border-2 border-black bg-gray-50' : 'bg-white/5 border border-white/10'}`}>
                          <h4 className="font-bold mb-3">Invite Others</h4>
                          <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm opacity-70">Join Code:</span>
                              <code className={`px-2 py-1 rounded font-mono font-bold ${style === THEMES.NEOBRUTALISM ? 'bg-white border-2 border-black' : 'bg-white/10'}`}>
                                  {group.joinCode}
                              </code>
                              <button 
                                  onClick={copyToClipboard}
                                  className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                  title="Copy code"
                              >
                                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                              </button>
                          </div>
                          <Button variant="secondary" className="w-full" onClick={shareInvite}>
                              <Share2 size={16} /> Share Invite
                          </Button>
                      </div>
                  </div>
              )}

              {/* Members Tab */}
              {settingsTab === 'members' && (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                      {members.map(m => {
                          const isSelf = m.userId === user?._id;
                          const memberImageUrl = m.user?.imageUrl;
                          const isValidImage = memberImageUrl && /^(https?:|data:image)/.test(memberImageUrl);
                          
                          return (
                              <div 
                                  key={m.userId}
                                  className={`flex items-center justify-between p-3 rounded-lg ${style === THEMES.NEOBRUTALISM ? 'border-2 border-black bg-white' : 'bg-white/5 border border-white/10'}`}
                              >
                                  <div className="flex items-center gap-3">
                                      {isValidImage ? (
                                          <img src={memberImageUrl} alt={m.user?.name} className="w-10 h-10 rounded-full object-cover" />
                                      ) : (
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                              {(m.user?.name || '?').charAt(0)}
                                          </div>
                                      )}
                                      <div>
                                          <p className="font-medium">{m.user?.name} {isSelf && <span className="text-xs opacity-50">(You)</span>}</p>
                                          {m.role === 'admin' && (
                                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                                  Admin
                                              </span>
                                          )}
                                      </div>
                                  </div>
                                  {isAdmin && !isSelf && (
                                      <button
                                          onClick={() => handleKickMember(m.userId, m.user?.name || 'Unknown')}
                                          className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                          title="Remove member"
                                      >
                                          <UserMinus size={18} />
                                      </button>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              )}

              {/* Danger Tab */}
              {settingsTab === 'danger' && (
                  <div className="space-y-4">
                      <div className={`p-4 rounded-lg ${style === THEMES.NEOBRUTALISM ? 'border-2 border-black bg-red-50' : 'bg-red-500/10 border border-red-500/30'}`}>
                          <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">Leave Group</h4>
                          <p className="text-sm opacity-70 mb-4">
                              You can leave this group only when your balances are settled.
                          </p>
                          <Button 
                              variant="secondary" 
                              className="w-full border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={handleLeaveGroup}
                          >
                              <LogOut size={16} /> Leave Group
                          </Button>
                      </div>

                      {isAdmin && (
                          <div className={`p-4 rounded-lg ${style === THEMES.NEOBRUTALISM ? 'border-2 border-black bg-red-100' : 'bg-red-500/20 border border-red-500/50'}`}>
                              <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">Delete Group</h4>
                              <p className="text-sm opacity-70 mb-4">
                                  This action is permanent and cannot be undone. Remove all members first.
                              </p>
                              <Button variant="danger" className="w-full" onClick={handleDeleteGroup}>
                                  <Trash2 size={16} /> Delete Group
                              </Button>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </Modal>
    </div>
  );
};
