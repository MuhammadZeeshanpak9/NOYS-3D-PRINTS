'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { SectionWrapper } from '@/components/pricing/SectionWrapper';
import { PricingCard } from '@/components/pricing/PricingCard';
import { CreditCard } from '@/components/pricing/CreditCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

// Data Configuration
const MEMBERSHIP_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    features: [
      'Save details for faster checkout',
      'Easy account access',
      'Quick login for future orders',
    ],
    ctaText: 'Get Started',
    isPopular: false,
  },
  {
    id: 'bronze',
    name: 'Bronze',
    price: '£5.00',
    features: [
      '7% off all model costs',
      'Priority access to new designs',
      'Members-only offers',
      'Early stock access',
      '25 AI credits/month',
    ],
    ctaText: 'Subscribe',
    isPopular: false,
  },
  {
    id: 'silver',
    name: 'Silver',
    price: '£9.99',
    features: [
      '10% off',
      'Free delivery',
      'Priority access',
      '3 free colour upgrades/month',
      '50 AI credits/month',
      'Faster custom quote response',
    ],
    ctaText: 'Subscribe',
    isPopular: true,
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '£14.99',
    features: [
      '15% off',
      'Free delivery',
      'Priority queue',
      '6 premium colour upgrades',
      '150 AI credits/month',
      'Exclusive items access',
    ],
    ctaText: 'Subscribe',
    isPopular: false,
  },
];

const CREDIT_PACKS = [
  { id: '10-credits', credits: 10, price: '£2.99' },
  { id: '25-credits', credits: 25, price: '£5.99' },
  { id: '50-credits', credits: 50, price: '£9.99' },
  { id: '100-credits', credits: 100, price: '£17.99' },
  { id: '150-credits', credits: 150, price: '£24.99' },
  { id: '200-credits', credits: 200, price: '£29.99' },
];

export default function PricingPage() {
  const router = useRouter();
  
  // Mock Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  
  // Handlers for interactions
  const handleSubscribe = async (planId: string) => {
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    
    // Push the user to a mock dedicated payment path specifically handling virtual items (Not standard cart)
    router.push(`/payment?type=subscription&id=${planId}`);
  };

  const handleBuyCredits = async (creditPackageId: string) => {
    if (!isLoggedIn) {
      setLoginModalOpen(true);
      return;
    }
    
    // Push checkout flow
    router.push(`/payment?type=credits&id=${creditPackageId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-16 pb-20 px-4 relative overflow-hidden">
      
      {/* Mock Authentication Toggle (for testing) */}
      <div className="fixed top-24 right-4 z-50 bg-white p-4 rounded-xl border-2 border-orange-400 shadow-md">
        <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Dev Auth controls</p>
        <button 
          onClick={() => setIsLoggedIn(!isLoggedIn)}
          className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${isLoggedIn ? 'bg-green-100 text-green-700 border-green-500' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
        >
          {isLoggedIn ? 'Logged In' : 'Logged Out'}
        </button>
      </div>

      {/* Login Modal */}
      <Modal 
        isOpen={isLoginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        title="Welcome Back!"
      >
        <div className="text-center space-y-6">
          <p className="text-gray-600 font-semibold mb-6">
            Please log in to continue with your purchase and access your account.
          </p>
          <div className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => {
                setIsLoggedIn(true);
                setLoginModalOpen(false);
              }}
            >
              Simulate Login
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setLoginModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hero Header matching Home Page Background */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, duration: 0.8 }}
        className="relative w-full max-w-[1000px] mt-8 mb-4 h-[200px]"
      >
        <div className="absolute -top-[500px] left-1/2 -translate-x-1/2 w-[220vw] h-[1200px] bg-sky-50 -z-10" />
        <div className="absolute top-[300px] left-1/2 -translate-x-1/2 w-[180vw] h-[800px] bg-gradient-to-b from-white via-sky-100/30 to-transparent -z-10" />
        <div className="absolute top-[700px] left-1/2 -translate-x-1/2 w-[220vw] h-[250px] bg-gradient-to-b from-sky-50 to-transparent -z-10" />
        
        <div className="flex flex-col items-center justify-center w-full h-full relative z-10 text-center">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl sm:text-7xl font-black text-blue-600 drop-shadow-[0_4px_0_rgba(0,0,0,0.1)] mb-6"
          >
            Plans & Credits
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl sm:text-2xl font-black text-blue-500 drop-shadow-sm px-4"
          >
            Choose how you want to create — flexible credits or monthly plans
          </motion.p>
        </div>
      </motion.div>

      {/* Membership Plans Section */}
      <SectionWrapper title="Membership Plans">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-6">
          {MEMBERSHIP_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              id={plan.id}
              name={plan.name}
              price={plan.price}
              features={plan.features}
              isPopular={plan.isPopular}
              ctaText={plan.ctaText}
              onAction={handleSubscribe}
            />
          ))}
        </div>
      </SectionWrapper>

      {/* Credit Packs Section */}
      <SectionWrapper 
        title="Buy Credits" 
        subtitle="Top up anytime — no subscription required"
        delay={0.4}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 mb-4">
          {CREDIT_PACKS.map((pack) => (
            <CreditCard
              key={pack.id}
              id={pack.id}
              credits={pack.credits}
              price={pack.price}
              onAction={handleBuyCredits}
            />
          ))}
        </div>
        
        {/* UX Notes for credits */}
        <div className="flex flex-col items-center justify-center mt-12 bg-blue-50/80 p-6 rounded-[2rem] border-2 border-blue-200 shadow-sm max-w-3xl mx-auto">
          <p className="text-xl font-black text-[#0c2a50] mb-2 text-center">
            💡 1 credit = 1 AI-generated model
          </p>
          <p className="font-bold text-blue-500 text-center">
            Credits are used when generating custom designs via our AI Generator.
          </p>
        </div>
      </SectionWrapper>

    </div>
  );
}
