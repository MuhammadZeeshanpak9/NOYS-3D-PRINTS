'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { ArrowLeft, Package, ShoppingCart, MapPin, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '@/lib/api/client';

interface ShopOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingAddress {
  first_name?: string;
  last_name?: string;
  email?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  country?: string;
}

interface ShopOrder {
  id: string;
  status: string;
  items: ShopOrderItem[];
  total: number;
  shipping_address: ShippingAddress | string | null;
  created_at: string;
  updated_at: string;
}

const STEPS = [
  { key: 'placed',     label: 'Order Placed',  desc: 'We received your order' },
  { key: 'processing', label: 'Processing',     desc: "We're preparing your items" },
  { key: 'shipped',    label: 'Shipped',        desc: 'Your order is on its way' },
  { key: 'delivered',  label: 'Delivered',      desc: 'Enjoy your print!' },
];

function statusToStep(status: string): number {
  switch (status) {
    case 'delivered':      return 3;
    case 'shipped':        return 2;
    case 'processing':     return 1;
    default:               return 0; // awaiting_payment, pending, unknown
  }
}

function formatAddress(addr: ShippingAddress | string | null): string {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  const parts = [
    addr.first_name && addr.last_name ? `${addr.first_name} ${addr.last_name}` : undefined,
    addr.address,
    addr.city,
    addr.zip_code,
    addr.country,
  ].filter(Boolean);
  return parts.join(', ');
}

export default function ShopOrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && params.id) {
      apiClient.get(`/orders/${params.id}`)
        .then((res) => setOrder(res.data))
        .catch(() => setNotFound(true))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, params.id]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 px-4">
        <Package size={64} className="text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-700 mb-2">Order not found</h1>
        <p className="text-slate-500 mb-6">This order doesn't exist or you don't have access to it.</p>
        <Link href="/profile/history" className="text-blue-600 font-semibold hover:underline">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const currentStep = statusToStep(order.status);
  const addressText = formatAddress(order.shipping_address);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-3xl mx-auto">
      <Link href="/profile/history" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors mb-6">
        <ArrowLeft size={16} /> Back to My Orders
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <ShoppingCart size={22} className="text-blue-500" />
          <h1 className="text-2xl font-bold text-slate-900">Order Tracking</h1>
        </div>
        <span className="text-slate-400 font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</span>
        <span className="text-xs text-slate-400 ml-auto">
          Placed {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Progress stepper or cancelled banner */}
      {isCancelled ? (
        <div className="flex items-center gap-4 bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
          <XCircle size={36} className="text-red-400 shrink-0" />
          <div>
            <p className="font-black text-red-700 text-lg">Order Cancelled</p>
            <p className="text-sm text-red-500 mt-0.5">This order has been cancelled. Contact us if you have questions.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="relative flex items-start justify-between">
            {/* Connecting line behind circles */}
            <div className="absolute top-5 left-0 right-0 h-0.5 mx-[10%]" aria-hidden="true">
              <div className="h-full bg-slate-200 relative">
                <div
                  className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>

            {STEPS.map((step, idx) => {
              const isDone    = idx < currentStep;
              const isCurrent = idx === currentStep;
              const isPending = idx > currentStep;

              return (
                <div key={step.key} className="relative flex flex-col items-center flex-1 z-10">
                  {/* Circle */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isDone
                      ? 'bg-blue-500 border-blue-500'
                      : isCurrent
                      ? 'bg-blue-500 border-blue-500 ring-4 ring-blue-100 ring-offset-1'
                      : 'bg-white border-slate-300'
                  }`}>
                    {isDone ? (
                      <CheckCircle size={20} className="text-white" strokeWidth={2.5} />
                    ) : isCurrent ? (
                      <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-slate-300" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-3 text-center px-1">
                    <p className={`text-xs font-bold leading-tight ${
                      isDone || isCurrent ? 'text-blue-700' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 leading-tight hidden sm:block ${
                      isCurrent ? 'text-blue-500' : 'text-slate-400'
                    }`}>
                      {isCurrent ? step.desc : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current status description (mobile) */}
          <p className="mt-6 text-center text-sm text-blue-600 font-semibold sm:hidden">
            {STEPS[currentStep]?.desc}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Items */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Items</h2>
          <ul className="space-y-3">
            {(order.items || []).map((item, i) => (
              <li key={item.id || i} className="flex items-center gap-3">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-100 shrink-0 flex items-center justify-center">
                    <Package size={16} className="text-slate-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm font-bold text-slate-700 shrink-0">
                  £{(item.price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-600">Total</span>
            <span className="text-lg font-black text-orange-500">£{Number(order.total || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <MapPin size={14} /> Shipping Address
          </h2>
          {addressText ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{addressText}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No address on record</p>
          )}
        </div>
      </div>
    </div>
  );
}
