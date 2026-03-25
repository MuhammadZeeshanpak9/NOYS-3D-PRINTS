'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard, ShoppingBag, Image as ImageIcon, MessageSquare, Info, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { Button } from '../ui/Button';
import Image from 'next/image';
import logo from '@/assets/New logo brighter.png';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'AI Generator', href: '/ai-generator', protected: true, icon: Star },
  { name: 'STL File Upload', href: '/stl-upload', protected: true, icon: ShoppingBag },
  { name: 'Shop', href: '/shop', icon: ShoppingBag },
  { name: 'Gallery', href: '/gallery', icon: ImageIcon },
  { name: 'About Us', href: '/about', icon: Info },
  { name: 'Contact Us', href: '/contact', icon: MessageSquare },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-10 h-10">
            <Image 
              src={logo} 
              alt="Logo" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-900">NOYS 3D</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Side Navbar (Desktop) */}
      <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-white border-r border-gray-100 hidden md:flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Logo Section - Truly End to End & Curvy */}
        <div className="mb-6 px-1 pt-2">
          <Link href="/" className="group block">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full aspect-square overflow-hidden rounded-[2rem] bg-gray-50/30 border border-gray-100/30 shadow-sm"
            >
              <Image 
                src={logo} 
                alt="Logo" 
                fill 
                className="object-contain p-1 transition-transform duration-500 group-hover:scale-105"
                priority
              />
            </motion.div>
          </Link>
          <div className="mt-4 text-center px-4">
            <h1 className="text-xl font-black tracking-tight text-gray-900 leading-tight">NOYS 3D PRINTS</h1>
            <p className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase mt-1">A World Made in Plastic</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary transition-colors'} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* User Section / Actions at bottom */}
        <div className="p-4 mt-auto border-t border-gray-50 space-y-2">
          {isAuthenticated ? (
            <div className="bg-gray-50 rounded-2xl p-4 mb-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserIcon size={20} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
                  <Link href="/profile" className="text-xs font-medium text-gray-500 hover:text-primary transition-colors">View Profile</Link>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="w-full justify-center gap-2 border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
              >
                <LogOut size={16} />
                Sign Out
              </Button>
            </div>
          ) : (
            <Link href="/login" className="block">
              <Button variant="primary" className="w-full font-black shadow-lg shadow-primary/20">
                Sign In / Register
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 md:hidden flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <Image src={logo} alt="Logo" fill className="object-contain" />
                  </div>
                  <span className="font-black text-xl tracking-tight">NOYS 3D</span>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full bg-gray-100 text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-bold ${
                        isActive
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={22} />
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto pt-6 border-t border-gray-100">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UserIcon size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{user?.name || 'User'}</p>
                        <Link href="/profile" onClick={() => setIsOpen(false)} className="text-sm text-gray-500">My Profile</Link>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => { handleLogout(); setIsOpen(false); }}
                      className="w-full text-red-500 border-red-100 hover:bg-red-50"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="primary" className="w-full font-black">
                      Sign In / Register
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
