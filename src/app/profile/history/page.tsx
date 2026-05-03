'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/useAuth';
import { useCart } from '@/lib/cart/CartContext';
import { useToast } from '@/lib/toast/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Download, ShoppingBag, RefreshCw, Trash2, Wand2, Package, ExternalLink } from 'lucide-react';
import apiClient from '@/lib/api/client';

interface GenerationItem {
  id: string;
  prompt: string;
  image_url: string;
  stl_url: string | null;
  is_saved: boolean;
  credits_used: number;
  created_at: string;
}

interface CustomOrder {
  id: string;
  status: string;
  review_status: string;
  reference_image_url: string | null;
  image_source: string;
  total_price: number;
  size_label: string;
  finish_label: string;
  shipping_address: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  new_order: 'bg-blue-50 text-blue-700 border-blue-200',
  in_review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  printing: 'bg-purple-50 text-purple-700 border-purple-200',
  kit_packing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  painting: 'bg-pink-50 text-pink-700 border-pink-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  shipped: 'bg-teal-50 text-teal-700 border-teal-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  new_order: 'New Order',
  in_review: 'In Review',
  printing: 'Printing',
  kit_packing: 'Kit Packing',
  painting: 'Painting',
  completed: 'Completed',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
};

const REVIEW_STYLES: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  changes_requested: 'bg-orange-50 text-orange-700 border-orange-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

function getApiBase() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

function resolveImageUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${getApiBase()}${url}`;
}

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { addToCart } = useCart();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'designs' | 'orders'>('designs');
  const [generations, setGenerations] = useState<GenerationItem[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAll();
    }
  }, [isAuthenticated]);

  const fetchAll = async () => {
    try {
      const [genRes, ordersRes] = await Promise.allSettled([
        apiClient.get('/generations'),
        apiClient.get('/custom-orders'),
      ]);

      if (genRes.status === 'fulfilled') {
        setGenerations(genRes.value.data || []);
      } else {
        const stored = localStorage.getItem('2dtoy_gallery');
        if (stored) {
          try { setGenerations(JSON.parse(stored)); } catch {}
        }
      }

      if (ordersRes.status === 'fulfilled') {
        setCustomOrders(ordersRes.value.data || []);
      }
    } finally {
      setIsDataLoaded(true);
    }
  };

  const handleOrderPrint = (item: GenerationItem) => {
    addToCart({
      id: `print_${item.id}`,
      name: `Custom Print: ${item.prompt.substring(0, 15)}...`,
      price: 24.99,
      quantity: 1,
      image: item.image_url
    });
    success('Custom Print added to your cart!');
  };

  const handleDownloadSTL = (item: GenerationItem) => {
    if (item.stl_url) {
      window.open(item.stl_url, '_blank');
    } else {
      toastError('STL file not available yet');
    }
  };

  const handleReuse = (prompt: string) => {
    router.push(`/ai-generator?prompt=${encodeURIComponent(prompt)}`);
  };

  const handleDelete = (id: string) => setDeleteTarget(id);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/generations/${deleteTarget}`);
      setGenerations(generations.filter(item => item.id !== deleteTarget));
      const stored = JSON.parse(localStorage.getItem('2dtoy_gallery') || '[]');
      localStorage.setItem('2dtoy_gallery', JSON.stringify(stored.filter((i: any) => i.id !== deleteTarget)));
      setDeleteTarget(null);
      success('Generation deleted successfully.');
    } catch {
      toastError('Failed to delete generation');
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading || !isAuthenticated || !isDataLoaded) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center pt-24 pb-20">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-8 max-w-7xl mx-auto pt-24">
      <div className="flex flex-col mb-8 border-b-2 border-blue-100 pb-6 text-center sm:text-left">
        <h1 className="text-4xl sm:text-5xl font-black text-[#0c2a50] mb-2 drop-shadow-sm">My Account</h1>
        <p className="text-[#1a4073] text-lg font-bold opacity-80">Your designs and custom orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab('designs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeTab === 'designs'
              ? 'bg-[#0c2a50] text-white shadow-md'
              : 'bg-white border-2 border-blue-100 text-[#1a4073] hover:bg-blue-50'
          }`}
        >
          <Wand2 size={16} />
          My Designs
          {generations.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'designs' ? 'bg-white/20' : 'bg-blue-100'}`}>
              {generations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-[#0c2a50] text-white shadow-md'
              : 'bg-white border-2 border-blue-100 text-[#1a4073] hover:bg-blue-50'
          }`}
        >
          <Package size={16} />
          Custom Orders
          {customOrders.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'orders' ? 'bg-white/20' : 'bg-blue-100'}`}>
              {customOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Designs Tab */}
      {activeTab === 'designs' && (
        <>
          {generations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/50 backdrop-blur-sm rounded-[2rem] border-4 border-dashed border-blue-200 max-w-3xl mx-auto shadow-sm">
              <div className="bg-blue-100 p-6 rounded-full mb-6">
                <Wand2 size={48} className="text-blue-400 mx-auto" />
              </div>
              <h2 className="text-3xl font-black text-[#0c2a50] mb-4 text-center">No designs yet</h2>
              <p className="text-[#1a4073] mb-8 text-center max-w-md">
                Head over to our AI generator to sculpt your first custom 3D masterpiece.
              </p>
              <Link href="/ai-generator">
                <Button variant="primary" size="lg" className="animate-pulse shadow-[0_6px_0_#cc6200]">
                  Go to AI Generator
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {generations.map((gen) => (
                <Card key={gen.id} className="flex flex-col h-full hover:scale-105 transition-transform duration-300 border-2 border-transparent hover:border-blue-300 shadow-[6px_6px_0px_#1a4073]">
                  <div className="h-56 bg-gradient-to-tr from-sky-100 to-white w-full border-b-2 border-slate-100 relative overflow-hidden flex items-center justify-center">
                    {gen.image_url ? (
                      <img src={gen.image_url} alt={gen.prompt} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-gray-400 font-bold tracking-widest uppercase">No Image</span>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#0c2a50] text-xs font-black px-3 py-1 rounded-full shadow-sm border border-gray-100">
                      {new Date(gen.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col bg-white">
                    <div className="mb-4 flex-grow">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Prompt</p>
                      <p className="text-[#1a4073] font-semibold text-base line-clamp-3 leading-snug">"{gen.prompt}"</p>
                    </div>
                    <div className="flex flex-col gap-3 mt-auto pt-4 border-t-2 border-blue-50/50 border-dashed">
                      <Button
                        variant="primary"
                        className="w-full justify-between px-5 font-bold shadow-md shadow-orange-500/20"
                        onClick={() => handleOrderPrint(gen)}
                      >
                        <span className="flex items-center gap-2"><ShoppingBag size={18} /> Order Print</span>
                        <span className="bg-orange-600 text-white rounded-md px-2 py-0.5 text-sm">+ Cart</span>
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" className="w-full text-sm py-2 shadow-sm shadow-blue-500/10" onClick={() => handleDownloadSTL(gen)}>
                          <Download size={16} className="mr-2" /> STL
                        </Button>
                        <Button variant="outline" className="w-full text-sm py-2 font-black border-blue-200" onClick={() => handleReuse(gen.prompt)}>
                          <RefreshCw size={16} className="mr-2 text-blue-500" /> Reuse
                        </Button>
                      </div>
                      <button
                        onClick={() => handleDelete(gen.id)}
                        className="flex justify-center flex-row gap-1 items-center mt-2 mx-auto text-xs font-bold text-red-400 hover:text-red-600 active:scale-95 transition-all w-max py-1 px-3 rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={12} /> <span className="uppercase tracking-wider">Delete Model</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Custom Orders Tab */}
      {activeTab === 'orders' && (
        <>
          {customOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/50 backdrop-blur-sm rounded-[2rem] border-4 border-dashed border-blue-200 max-w-3xl mx-auto shadow-sm">
              <div className="bg-blue-100 p-6 rounded-full mb-6">
                <Package size={48} className="text-blue-400 mx-auto" />
              </div>
              <h2 className="text-3xl font-black text-[#0c2a50] mb-4 text-center">No custom orders yet</h2>
              <p className="text-[#1a4073] mb-8 text-center max-w-md">
                Use the builder to configure and order your own custom 3D model print.
              </p>
              <Link href="/builder">
                <Button variant="primary" size="lg" className="shadow-[0_6px_0_#cc6200]">
                  Order a Model
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {customOrders.map((order) => {
                const imageUrl = resolveImageUrl(order.reference_image_url);
                return (
                  <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Reference" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={28} className="text-slate-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${REVIEW_STYLES[order.review_status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          Review: {order.review_status?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {order.size_label || 'Custom Size'} — {order.finish_label || 'Custom Finish'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Placed {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Price + action */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-lg font-black text-orange-500">
                        £{Number(order.total || 0).toFixed(2)}
                      </span>
                      <Link
                        href={`/orders/${order.id}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        View Details <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Deletion">
        <div className="text-center space-y-6">
          <p className="text-[#1a4073] font-bold mb-6 text-lg">
            Are you sure you want to delete this model? This cannot be undone.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" className="w-full font-bold border-gray-300" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="primary"
              className="w-full bg-red-500 hover:bg-red-600 text-white border-red-600"
              onClick={confirmDelete}
              isLoading={deleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
