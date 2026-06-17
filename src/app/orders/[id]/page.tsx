'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { ArrowLeft, Package, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '@/lib/api/client';

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

const CUSTOM_STEPS = [
  { key: 'placed',     label: 'Order Placed', desc: 'We received your order' },
  { key: 'in_review',  label: 'In Review',    desc: "We're reviewing your image" },
  { key: 'printing',   label: 'Printing',     desc: 'Your model is being printed' },
  { key: 'finishing',  label: 'Finishing',    desc: 'Painting and final touches' },
  { key: 'shipped',    label: 'Shipped',      desc: 'Your order is on its way' },
];

function customStatusToStep(status: string): number {
  switch (status) {
    case 'shipped':
    case 'completed': return 4;
    case 'kit_packing':
    case 'painting':  return 3;
    case 'printing':  return 2;
    case 'in_review': return 1;
    default:          return 0; // new_order, awaiting_payment
  }
}

function getApiBase() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

function resolveImageUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${getApiBase()}${url}`;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && params.id) {
      fetchOrder();
    }
  }, [isAuthenticated, params.id]);

  const fetchOrder = async () => {
    try {
      const res = await apiClient.get(`/custom-orders/${params.id}`);
      setOrder(res.data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (notFound) {
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

  if (!order) return null;

  const imageUrl = resolveImageUrl(order.reference_image_url);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-4xl mx-auto">
      <Link href="/profile/history" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors mb-6">
        <ArrowLeft size={16} /> Back to My Orders
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Order Details</h1>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[order.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${REVIEW_STYLES[order.review_status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          Review: {order.review_status?.replace('_', ' ')}
        </span>
      </div>

      {/* Progress stepper */}
      {order.status === 'cancelled' ? (
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
            {/* Connecting line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 mx-[8%]" aria-hidden="true">
              <div className="h-full bg-slate-200 relative">
                <div
                  className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${(customStatusToStep(order.status) / (CUSTOM_STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>

            {CUSTOM_STEPS.map((step, idx) => {
              const currentStep = customStatusToStep(order.status);
              const isDone    = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.key} className="relative flex flex-col items-center flex-1 z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isDone
                      ? 'bg-blue-500 border-blue-500'
                      : isCurrent
                      ? 'bg-blue-500 border-blue-500 ring-4 ring-blue-100 ring-offset-1'
                      : 'bg-white border-slate-300'
                  }`}>
                    {isDone ? (
                      <CheckCircle size={18} className="text-white" strokeWidth={2.5} />
                    ) : isCurrent ? (
                      <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-slate-300" />
                    )}
                  </div>
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
          <p className="mt-6 text-center text-sm text-blue-600 font-semibold sm:hidden">
            {CUSTOM_STEPS[customStatusToStep(order.status)]?.desc}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reference image */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Reference Image</h2>
          <div className="w-full aspect-square bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt="Reference" className="w-full h-full object-contain" />
            ) : (
              <Package size={48} className="text-slate-200" />
            )}
          </div>
          {order.image_source && (
            <p className="text-xs text-slate-400 mt-2 capitalize">Source: {order.image_source.replace('_', ' ')}</p>
          )}
        </div>

        {/* Order config */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Configuration</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Size</dt>
                <dd className="font-medium text-slate-800">{order.size_label || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Finish</dt>
                <dd className="font-medium text-slate-800">{order.finish_label || '—'}</dd>
              </div>
              {order.painting_tier_label && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Painting Tier</dt>
                  <dd className="font-medium text-slate-800">{order.painting_tier_label}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">Placed</dt>
                <dd className="font-medium text-slate-800">
                  {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Pricing</h2>
            <dl className="space-y-2 text-sm">
              {order.base_price != null && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Base Price</dt>
                  <dd className="font-medium text-slate-800">£{Number(order.base_price).toFixed(2)}</dd>
                </div>
              )}
              {order.painting_price != null && order.painting_price > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Painting</dt>
                  <dd className="font-medium text-slate-800">£{Number(order.painting_price).toFixed(2)}</dd>
                </div>
              )}
              {order.extras_total != null && order.extras_total > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Extras</dt>
                  <dd className="font-medium text-slate-800">£{Number(order.extras_total).toFixed(2)}</dd>
                </div>
              )}
              {order.discount_amount != null && order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <dt>Discount ({order.discount_percentage}%)</dt>
                  <dd className="font-medium">−£{Number(order.discount_amount).toFixed(2)}</dd>
                </div>
              )}
              {order.delivery_price != null && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">Delivery</dt>
                  <dd className="font-medium text-slate-800">
                    {Number(order.delivery_price) === 0 ? 'Free' : `£${Number(order.delivery_price).toFixed(2)}`}
                  </dd>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <dt className="font-semibold text-slate-700">Total</dt>
                <dd className="font-bold text-orange-500 text-base">£{Number(order.total || 0).toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      {order.shipping_address && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mt-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Shipping Address</h2>
          <p className="text-sm text-slate-700 whitespace-pre-line">{order.shipping_address}</p>
        </div>
      )}

      {/* Notes from admin (customer-facing only) */}
      {order.notes && order.notes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mt-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <MessageSquare size={14} /> Messages from Us
          </h2>
          <ul className="space-y-3">
            {order.notes.map((note: any) => (
              <li key={note.id} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-sm text-slate-700">{note.content}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(note.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
