'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Package, Tags, Cuboid, Palette, Layers, Paintbrush, Truck, ClipboardList, ShoppingBag, HelpCircle, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (user?.role !== 'admin') {
        router.replace('/');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 md:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <span className="text-xl font-bold text-slate-800 tracking-tight">Admin<span className="text-primary">Panel</span></span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/admin" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/admin/categories" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Tags size={20} />
            <span className="font-medium">Categories</span>
          </Link>
          <Link href="/admin/products" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Package size={20} />
            <span className="font-medium">Products</span>
          </Link>
          <Link href="/admin/plans" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <FileText size={20} />
            <span className="font-medium">Plans</span>
          </Link>
          <Link href="/admin/users" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Users size={20} />
            <span className="font-medium">Users</span>
          </Link>
          <div className="pt-2 pb-1 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Orders</div>
          <Link href="/admin/orders" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <ShoppingBag size={20} />
            <span className="font-medium">Customer Orders</span>
          </Link>
          <Link href="/admin/custom-orders" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <ClipboardList size={20} />
            <span className="font-medium">Custom Orders</span>
          </Link>
          <div className="pt-2 pb-1 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Configuration</div>
          <Link href="/admin/model-sizes" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Cuboid size={20} />
            <span className="font-medium">Model Sizes</span>
          </Link>
          <Link href="/admin/finish-options" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Layers size={20} />
            <span className="font-medium">Finish Options</span>
          </Link>
          <Link href="/admin/painting-tiers" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Paintbrush size={20} />
            <span className="font-medium">Painting Tiers</span>
          </Link>
          <Link href="/admin/paint-colors" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Palette size={20} />
            <span className="font-medium">Paint Colours</span>
          </Link>
          <Link href="/admin/delivery" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Truck size={20} />
            <span className="font-medium">Delivery Settings</span>
          </Link>
          <Link href="/admin/settings" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </Link>
          <Link href="/admin/help" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
            <HelpCircle size={20} />
            <span className="font-medium">Help & Guide</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-200">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              logout();
              router.push('/login');
            }}
          >
            <LogOut size={20} className="mr-3" />
            <span className="font-medium">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu size={22} className="text-slate-700" />
          </button>
          <span className="font-bold text-slate-800">Admin<span className="text-primary">Panel</span></span>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
