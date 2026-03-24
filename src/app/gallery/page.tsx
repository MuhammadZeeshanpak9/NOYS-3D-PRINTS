import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

export default function GalleryPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-[#0c2a50] mb-8 text-center pt-8">Miniature Gallery</h1>
      <p className="text-center text-[#1a4073] mb-12 max-w-2xl mx-auto">
        Browse our collection of custom 3D printed models, tabletop terrain, and hobby pieces.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="h-64 bg-blue-100 w-full flex items-center justify-center">
              <p className="text-blue-400 font-semibold">Gallery Image {i}</p>
            </div>
            <CardContent className="p-4 bg-white/50 backdrop-blur-sm">
              <h3 className="font-bold text-lg text-gray-800">Custom Model {i}</h3>
              <p className="text-sm text-gray-500">High Detail Resin</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
