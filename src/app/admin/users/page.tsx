'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, Shield, User, Coins, X } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  credits: number;
  subscription_plan: string;
  created_at: string;
}

type CreditMode = 'set' | 'add' | 'subtract';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, success } = useToast();

  // Credit-edit modal state
  const [creditUser, setCreditUser] = useState<User | null>(null);
  const [creditMode, setCreditMode] = useState<CreditMode>('add');
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [savingCredits, setSavingCredits] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/admin/users');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      success('User deleted successfully');
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await apiClient.put(`/admin/users/${userId}`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      success(`User role updated to ${newRole}`);
    } catch (err) {
      error('Failed to update user role');
    }
  };

  const openCreditModal = (user: User) => {
    setCreditUser(user);
    setCreditMode('add');
    setCreditAmount('');
  };

  const closeCreditModal = () => {
    setCreditUser(null);
    setCreditAmount('');
  };

  const handleSaveCredits = async () => {
    if (!creditUser) return;
    const parsed = Number(creditAmount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      error('Please enter a valid number');
      return;
    }

    const current = creditUser.credits || 0;
    let newCredits = current;
    if (creditMode === 'set') newCredits = parsed;
    else if (creditMode === 'add') newCredits = current + parsed;
    else if (creditMode === 'subtract') newCredits = Math.max(0, current - parsed);

    setSavingCredits(true);
    try {
      await apiClient.put(`/admin/users/${creditUser.id}`, { credits: newCredits });
      setUsers(users.map(u => u.id === creditUser.id ? { ...u, credits: newCredits } : u));
      success(`Credits updated: ${current} → ${newCredits}`);
      closeCreditModal();
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to update credits');
    } finally {
      setSavingCredits(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Users</h1>
          <p className="text-slate-500 mt-1">View and manage all registered users</p>
        </div>
        <span className="text-sm text-slate-500">{users.length} total users</span>
      </div>

      {creditUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={closeCreditModal}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Coins size={20} className="text-amber-500" /> Adjust Credits
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {creditUser.full_name || creditUser.email}
                </p>
              </div>
              <button onClick={closeCreditModal} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <span className="text-slate-600">Current balance: </span>
              <span className="font-bold text-amber-700">{creditUser.credits || 0} credits</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Action</label>
              <div className="grid grid-cols-3 gap-2">
                {(['add', 'subtract', 'set'] as CreditMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setCreditMode(m)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                      creditMode === m
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    {m === 'add' ? 'Add' : m === 'subtract' ? 'Subtract' : 'Set to'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                {creditMode === 'set' ? 'New balance' : 'Amount'}
              </label>
              <input
                type="number"
                min="0"
                value={creditAmount}
                onChange={e => setCreditAmount(e.target.value)}
                placeholder="e.g. 10"
                autoFocus
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none text-slate-900 font-semibold"
              />
              {creditAmount && Number.isFinite(Number(creditAmount)) && (
                <p className="text-xs text-slate-500">
                  New balance will be:{' '}
                  <span className="font-bold text-slate-700">
                    {creditMode === 'set'
                      ? Number(creditAmount)
                      : creditMode === 'add'
                        ? (creditUser.credits || 0) + Number(creditAmount)
                        : Math.max(0, (creditUser.credits || 0) - Number(creditAmount))}{' '}
                    credits
                  </span>
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={closeCreditModal}
                disabled={savingCredits}
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCredits}
                disabled={savingCredits || !creditAmount}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white disabled:opacity-50"
              >
                {savingCredits ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-slate-500 font-medium">User</th>
                <th className="px-6 py-4 text-slate-500 font-medium">Role</th>
                <th className="px-6 py-4 text-slate-500 font-medium">Credits</th>
                <th className="px-6 py-4 text-slate-500 font-medium">Plan</th>
                <th className="px-6 py-4 text-slate-500 font-medium">Joined</th>
                <th className="px-6 py-4 text-slate-500 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                          <Shield size={14} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-sm font-medium">
                          <User size={14} /> User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="font-semibold text-slate-900">{user.credits || 0}</span> credits
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {user.subscription_plan || 'starter'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openCreditModal(user)}
                          className="text-slate-400 hover:text-amber-600 p-1.5 rounded hover:bg-amber-50 transition-colors"
                          title="Adjust credits"
                        >
                          <Coins size={16} />
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleUpdateRole(user.id, 'admin')}
                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50 transition-colors"
                            title="Make Admin"
                          >
                            <Shield size={16} />
                          </button>
                        )}
                        {user.role === 'admin' && (
                          <button
                            onClick={() => handleUpdateRole(user.id, 'user')}
                            className="text-slate-400 hover:text-orange-600 p-1.5 rounded hover:bg-orange-50 transition-colors"
                            title="Remove Admin"
                          >
                            <User size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
