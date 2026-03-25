'use client';

import React, { useState } from 'react';
import { useCart } from '@/lib/cart/CartContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/toast/ToastContext';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();
  const { error } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      console.log('POST /order/create -> ', { items, total: cartTotal });
      // Mock API latency
      await new Promise((resolve) => setTimeout(resolve, 2000));
      clearCart();
      setIsSuccess(true);
    } catch (err) {
      console.error('Checkout failed', err);
      error('Order failed to process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center pt-24 pb-20 px-4">
        <div className="bg-green-50 p-6 rounded-full border-4 border-[#1a4073] shadow-[4px_4px_0px_#1a4073] mb-6 animate-bounce">
          <CheckCircle2 size={64} className="text-green-500" />
        </div>
        <h1 className="text-4xl font-black text-[#0c2a50] mb-4 text-center">Order Confirmed!</h1>
        <p className="text-[#1a4073] mb-8 text-center max-w-md text-lg">
          Your miniatures are being prepped. We'll email you the tracking details soon!
        </p>
        <Link href="/">
          <Button variant="primary" size="lg">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  // Redirect to cart if empty
  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center pt-24 pb-20">
        <h1 className="text-3xl font-black text-[#0c2a50] mb-4">No Order to Process</h1>
        <Link href="/shop"><Button variant="primary">Return to Shop</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-8 max-w-6xl mx-auto pt-24">
      <h1 className="text-4xl sm:text-5xl font-black text-[#0c2a50] mb-8 drop-shadow-sm">Checkout</h1>
      
      <form onSubmit={handlePlaceOrder} className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Forms */}
        <div className="flex-1 space-y-8">
          
          {/* Shipping Form */}
          <Card className="shadow-[4px_4px_0px_#1a4073]">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-2xl font-black text-[#0c2a50] mb-6 flex items-center gap-3">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                Shipping Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#1a4073]">First Name</label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" placeholder="John" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#1a4073]">Last Name</label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" placeholder="Doe" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-bold text-[#1a4073]">Email Address</label>
                  <input required type="email" className="w-full px-4 py-3 rounded-xl border border-gray-300 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" placeholder="john@example.com" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-bold text-[#1a4073]">Shipping Address</label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white mb-2" placeholder="123 Creator St" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" placeholder="City" />
                    <input required type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" placeholder="Zip Code" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details (UI Only) */}
          <Card className="shadow-[4px_4px_0px_#1a4073]">
            <CardContent className="p-6 sm:p-8 bg-gradient-to-br from-white to-orange-50/30">
              <h2 className="text-2xl font-black text-[#0c2a50] mb-6 flex items-center gap-3">
                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                Payment Options
              </h2>
              
              <div className="bg-blue-50/50 p-6 rounded-2xl border-2 border-blue-200 mb-6 flex items-center gap-4">
                <CreditCard className="text-blue-500 shrink-0" size={32} />
                <div>
                  <h4 className="font-extrabold text-[#0a2342]">Secure Mock Payment</h4>
                  <p className="text-sm text-[#1a4073]">Payment integration coming soon. Enter dummy data to test flow.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-[#1a4073]">Card Number</label>
                  <input required type="text" maxLength={19} className="w-full px-4 py-3 rounded-xl border border-gray-300 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" placeholder="0000 0000 0000 0000" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-[#1a4073]">Expiry Date</label>
                    <input required type="text" maxLength={5} className="w-full px-4 py-3 rounded-xl border border-gray-300 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-[#1a4073]">CVV</label>
                    <input required type="text" maxLength={4} className="w-full px-4 py-3 rounded-xl border border-gray-300 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" placeholder="123" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Order Recapped */}
        <div className="w-full lg:w-96">
          <Card className="sticky top-24 border-[#cc6200] shadow-[6px_6px_0px_#cc6200]">
            <CardContent className="p-6 sm:p-8 bg-gradient-to-b from-orange-50 to-white">
              <h2 className="text-2xl font-black text-[#0c2a50] mb-6 pb-4 border-b-2 border-orange-200">Your Order</h2>
              
              <div className="space-y-4 mb-6 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm font-bold text-[#1a4073]">
                    <span className="truncate pr-4">{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-2xl font-black text-[#0a2342] mb-8 pt-4 border-t-2 border-orange-200">
                <span>Total</span>
                <span className="text-orange-600">${cartTotal.toFixed(2)}</span>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full h-14 text-lg animate-pulse"
                isLoading={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </div>

      </form>
    </div>
  );
}
