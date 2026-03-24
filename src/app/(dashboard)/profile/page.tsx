'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import apiClient from '@/lib/api/client';

export default function ProfilePage() {
  const { user, login } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAddress(user.address || '');
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      // Example integration for FastAPI
      // const response = await apiClient.put('/user/profile', { name, address });
      // login(Cookies.get('jwt_token'), response.data);
      
      // Mock behaviour since backend is not yet available
      await new Promise(r => setTimeout(r, 1000));
      
      const storedToken = window.localStorage.getItem('jwt_token') || 'mock_jwt_token';
      if (user) {
          login(storedToken, { ...user, name, address });
      }
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-[#0c2a50] mb-8 pt-4">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="col-span-1 border-t-4 border-t-orange-500 h-fit">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Edit Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              {message && (
                <div className={`p-3 rounded-lg text-sm font-medium ${message.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {message}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 block mt-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  disabled
                  title="Email cannot be changed"
                  className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 block mt-2">Shipping Address</label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-y" 
                  placeholder="123 Printing Lane..."
                ></textarea>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" variant="primary" isLoading={loading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
