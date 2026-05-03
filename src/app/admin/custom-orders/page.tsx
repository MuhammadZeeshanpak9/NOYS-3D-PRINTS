'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';
import { Eye, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface CustomOrder {
  id: string;
  order_number: number;
  user_id: string;
  users?: { name: string; email: string };
  size_mm: number;
  finish_name: string;
  total: number;
  status: string;
  review_status: string;
  created_at: string;
  reference_image_url: string | null;
}

const STATUS_COLOURS: Record<string, string> = {
  new_order:   'bg-blue-100 text-blue-700',
  in_review:   'bg-amber-100 text-amber-700',
  printing:    'bg-purple-100 text-purple-700',
  kit_packing: 'bg-indigo-100 text-indigo-700',
  painting:    'bg-pink-100 text-pink-700',
  completed:   'bg-green-100 text-green-700',
  shipped:     'bg-teal-100 text-teal-700',
  cancelled:   'bg-red-100 text-red-700',
};

const REVIEW_COLOURS: Record<string, string> = {
  pending:           'bg-slate-100 text-slate-600',
  approved:          'bg-green-100 text-green-700',
  changes_requested: 'bg-orange-100 text-orange-700',
  rejected:          'bg-red-100 text-red-700',
};

const ALL_STATUSES = ['', 'new_order', 'in_review', 'printing', 'kit_packing', 'painting', 'completed', 'shipped', 'cancelled'];

function fmt(n: number) { return `£${n.toFixed(2)}`; }
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }
function labelStatus(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { error } = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = statusFilter ? `?status=${statusFilter}` : '';
        const res = await apiClient.get(`/admin/custom-orders${params}`);
        setOrders(res.data || []);
      } catch {
        error('Failed to load custom orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Custom Orders</h1>
          <p className="text-slate-500 mt-1">Review and manage all custom model orders</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white shadow-sm"
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{labelStatus(s)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 size={28} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-slate-500 font-medium text-sm">Order #</th>
                  <th className="px-5 py-4 text-slate-500 font-medium text-sm">Customer</th>
                  <th className="px-5 py-4 text-slate-500 font-medium text-sm">Config</th>
                  <th className="px-5 py-4 text-slate-500 font-medium text-sm">Total</th>
                  <th className="px-5 py-4 text-slate-500 font-medium text-sm">Status</th>
                  <th className="px-5 py-4 text-slate-500 font-medium text-sm">Review</th>
                  <th className="px-5 py-4 text-slate-500 font-medium text-sm">Date</th>
                  <th className="px-5 py-4 text-slate-500 font-medium text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-400">No orders found</td>
                  </tr>
                ) : orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-800">#{order.order_number}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{order.users?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{order.users?.email ?? ''}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {order.size_mm}mm · {order.finish_name}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{fmt(order.total)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${STATUS_COLOURS[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {labelStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${REVIEW_COLOURS[order.review_status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {labelStatus(order.review_status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{fmtDate(order.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/custom-orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
