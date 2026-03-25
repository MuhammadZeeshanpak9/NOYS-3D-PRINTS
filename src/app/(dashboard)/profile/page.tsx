'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const { user, login } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Mock GET /user/profile prefill
    if (user) {
      setName(user.name);
      setEmail(user.email);
      
      // Simulate fetching additional data that might not be in the basic Auth token
      const fetchProfile = async () => {
        try {
          // Mock latency
          await new Promise(r => setTimeout(r, 600));
          // Mock DB record lookup
          const savedData = JSON.parse(localStorage.getItem(`2dtoy_profile_${user.id}`) || '{}');
          
          setPhone(savedData.phone || '(555) 123-4567'); // Default mock if none saved
          setAddress1(savedData.address1 || '123 Printing Lane');
          setAddress2(savedData.address2 || 'Suite 404');
          setCity(savedData.city || 'Maker City');
          setPostalCode(savedData.postalCode || '90210');
          setCountry(savedData.country || 'United States');
        } catch(e) {
          console.error(e);
        }
      };
      
      fetchProfile();
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      // Mock PUT /user/profile
      await new Promise(r => setTimeout(r, 1000));
      
      const updatedData = { phone, address1, address2, city, postalCode, country };
      if (user) {
        localStorage.setItem(`2dtoy_profile_${user.id}`, JSON.stringify(updatedData));
        
        const storedToken = window.localStorage.getItem('jwt_token') || 'mock_jwt_token';
        // Update core auth context with core fields
        login(storedToken, { ...user, name });
      }
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-300 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-inner";

  return (
    <div className="min-h-[calc(100vh-64px)] p-8 max-w-5xl mx-auto pt-24">
      <h1 className="text-4xl font-black text-[#0c2a50] mb-8 drop-shadow-sm">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: User Avatar Card */}
        <div className="md:col-span-1 space-y-8">
          <Card className="border-t-8 border-t-orange-500 shadow-xl">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-28 h-28 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-5xl font-black mb-6 shadow-inner border-4 border-white ring-2 ring-blue-200">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <h2 className="text-2xl font-black text-[#0c2a50]">{user?.name}</h2>
              <p className="text-[#1a4073] font-medium">{user?.email}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Edit Form Card */}
        <Card className="md:col-span-2 shadow-xl border-t-8 border-t-blue-500">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-2xl font-black text-[#0c2a50]">Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleUpdate} className="space-y-6">
              {message && (
                <div className={`p-4 rounded-xl text-sm font-bold ${message.includes('successfully') ? 'bg-green-50 text-green-700 border-2 border-green-200' : 'bg-red-50 text-red-600 border-2 border-red-200'}`}>
                  {message}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1a4073]">Full Name</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1a4073]">Email Address</label>
                  <input type="email" value={email} disabled className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed font-medium" />
                  <p className="text-xs text-gray-400 font-medium ml-1">Email cannot be changed</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1a4073]">Phone Number</label>
                <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(555) 000-0000" />
              </div>

              <div className="pt-4 border-t-2 border-dashed border-gray-100 space-y-6">
                <h3 className="text-lg font-black text-[#0c2a50]">Shipping Address</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1a4073]">Address Line 1</label>
                  <input required type="text" value={address1} onChange={(e) => setAddress1(e.target.value)} className={inputClass} placeholder="123 Creator St" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1a4073]">Address Line 2 <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input type="text" value={address2} onChange={(e) => setAddress2(e.target.value)} className={inputClass} placeholder="Apt 4B" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#1a4073]">City</label>
                    <input required type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="New York" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#1a4073]">Postal Code</label>
                    <input required type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} placeholder="10001" />
                  </div>
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <label className="text-sm font-bold text-[#1a4073]">Country</label>
                    <input required type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} placeholder="United States" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <Button type="submit" variant="primary" size="lg" className="px-8 font-black shadow-[4px_4px_0px_#cc6200]" isLoading={loading}>
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
