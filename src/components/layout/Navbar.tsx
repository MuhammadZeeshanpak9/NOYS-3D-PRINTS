'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { Button } from '../ui/Button';
import Image from 'next/image';
import logo from '@/assets/logo 2D Toys.png';
import { motion } from 'framer-motion';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'AI Generator', href: '/ai-generator', protected: true },
  { name: 'STL File Upload', href: '/stl-upload', protected: true },
  { name: 'Shop', href: '/shop' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
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
    <nav className="sticky top-0 z-40 w-full bg-[#0a2342]/95 backdrop-blur-md text-white shadow-lg border-b border-[#123968]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20 gap-4 sm:gap-8">
          {/* Logo on most left */}
          <Link href="/" className="flex-shrink-0 group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative w-16 h-16 sm:w-24 sm:h-24 overflow-visible"
            >
              <Image 
                src={logo} 
                alt="Logo" 
                fill 
                className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                priority
              />
            </motion.div>
          </Link>
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-[#123968] focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex flex-1 items-center justify-between">
            <div className="flex space-x-2 lg:space-x-6 items-center flex-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                        ? 'text-primary bg-white/10'
                        : 'text-gray-200 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === '/profile'
                    ? 'text-primary bg-white/10'
                    : 'text-gray-200 hover:text-white hover:bg-white/5'
                  }`}
              >
                My Profile
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">Hello, {user?.name || 'User'}</span>
                  <Button variant="primary" size="sm" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="sm">
                    Sign In / Register
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0c2a50] shadow-xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive
                      ? 'text-primary bg-white/5'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
            >
              My Profile
            </Link>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-red-300 hover:bg-white/5"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-orange-400 hover:text-orange-300 hover:bg-white/5"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
