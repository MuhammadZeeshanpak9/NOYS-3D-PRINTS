'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/lib/cart/CartContext';

export default function ShopPage() {
  const { addToCart } = useCart();

  const handleAddToCart = (i: number) => {
    addToCart({
      id: `prod_${i}`,
      name: `Fantasy Miniature Pack ${i}`,
      price: 24.99,
      quantity: 1,
      image: `/placeholder-${i}.jpg`
    });
    alert(`Added Fantasy Miniature Pack ${i} to your cart!`);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-8 max-w-7xl mx-auto pt-24">
      <h1 className="text-4xl font-bold text-[#0c2a50] mb-8 text-center pt-8">Shop Ready-Made Prints</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="flex flex-col h-full hover:scale-105 transition-transform duration-300 border-2 border-transparent hover:border-blue-200">
            <div className="h-48 bg-blue-50 w-full flex items-center justify-center">
              <p className="text-blue-300 font-medium">Product Image {i}</p>
            </div>
            <CardContent className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-gray-800 mb-2 leading-tight">Fantasy Miniature Pack {i}</h3>
              <p className="text-xl font-black text-orange-500 mb-4">$24.99</p>
              
              <div className="mt-auto">
                <Button 
                  variant="primary" 
                  className="w-full relative overflow-hidden group"
                  onClick={() => handleAddToCart(i)}
                >
                  <span className="relative z-10">Add to Cart</span>
                  <div className="absolute inset-0 h-full w-full border-white/20 border-b-4 z-0 pointer-events-none group-active:border-none"></div>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
