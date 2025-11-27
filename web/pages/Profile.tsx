import { motion } from 'framer-motion';
import { Camera, ChevronRight, LogOut, Mail, MessageSquare, User, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { updateProfile } from '../services/api';

export const Profile = () => {
  const { user, logout } = useAuth();
  const { style, mode } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [pickedImage, setPickedImage] = useState<{ url: string; base64: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is already in data:image/...;base64,... format
      setPickedImage({ url: result, base64: result });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      alert('Name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const updates: { name?: string; imageUrl?: string } = {};
      if (editName !== user?.name) {
        updates.name = editName;
      }
      if (pickedImage?.base64) {
        updates.imageUrl = pickedImage.base64;
      }

      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
        // Reload page to refresh user data
        window.location.reload();
      }
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setPickedImage(null);
    setIsEditModalOpen(true);
  };

  const handleComingSoon = () => {
    alert('This feature is coming soon!');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine avatar display
  const avatarUrl = pickedImage?.url || user?.imageUrl;
  const isValidImageUrl = avatarUrl && /^(https?:|data:image)/.test(avatarUrl);

  const menuItems = [
    { label: 'Edit Profile', icon: User, onClick: openEditModal },
    { label: 'Email Settings', icon: Mail, onClick: handleComingSoon },
    { label: 'Send Feedback', icon: MessageSquare, onClick: handleComingSoon },
    { label: 'Logout', icon: LogOut, onClick: handleLogout, danger: true },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-4xl font-extrabold mb-8">Account</h1>
      </motion.div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-6">
          <div className="flex flex-col items-center py-6">
            <div className="relative mb-4">
              {isValidImageUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-white shadow-lg`}
                >
                  {user?.name?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            <p className="text-sm opacity-60 mt-1">{user?.email}</p>
          </div>
        </Card>
      </motion.div>

      {/* Menu Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center justify-between px-4 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                  item.danger ? 'text-red-500 hover:text-red-600' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight size={18} className="opacity-40" />
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {pickedImage?.url || (user?.imageUrl && /^(https?:|data:image)/.test(user.imageUrl)) ? (
                <img
                  src={pickedImage?.url || user?.imageUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-blue-500 to-purple-600">
                  {editName?.charAt(0) || user?.name?.charAt(0) || 'A'}
                </div>
              )}
              {pickedImage && (
                <button
                  onClick={() => setPickedImage(null)}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={16} />
              {pickedImage ? 'Change Photo' : 'Add Photo'}
            </Button>
          </div>

          {/* Name Input */}
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
      </Modal>
    </div>
  );
};
