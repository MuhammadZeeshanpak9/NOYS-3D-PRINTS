'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';
import { ArrowLeft, Check, X, MessageSquare, Loader2, AlertCircle, Package } from 'lucide-react';

interface PaintExtra {
  id: string;
  color_name: string;
  hex_code: string;
  quantity: number;
  unit_price: number;
  is_on_sale: boolean;
}

interface OrderNote {
  id: string;
  admin_name: string;
  note: string;
  note_type: string;
  created_at: string;
}

interface CustomOrder {
  id: string;
  order_number: number;
  users?: { name: string; email: string };
  reference_image_url: string | null;
  image_source: string;
  size_mm: number;
  finish_name: string;
  painting_tier_name: string | null;
  size_price: number;
  finish_price: number;
  painting_price: number;
  extras_total: number;
  subtotal_before_discount: number;
  membership_tier: string | null;
  discount_percentage: number;
  discount_amount: number;
  delivery_price: number;
  total: number;
  status: string;
  review_status: string;
  shipping_address: Record<string, string> | null;
  agreement_accepted: boolean;
  created_at: string;
  paint_extras: PaintExtra[];
  notes: OrderNote[];
}

const VALID_STATUSES = ['new_order', 'in_review', 'printing', 'kit_packing', 'painting', 'completed', 'shipped', 'cancelled'];
const STATUS_COLOURS: Record<string, string> = {
  new_order: 'bg-blue-100 text-blue-700',
  in_review: 'bg-amber-100 text-amber-700',
  printing: 'bg-purple-100 text-purple-700',
  kit_packing: 'bg-indigo-100 text-indigo-700',
  painting: 'bg-pink-100 text-pink-700',
  completed: 'bg-green-100 text-green-700',
  shipped: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-red-100 text-red-700',
};

function fmt(n: number) { return `£${Number(n).toFixed(2)}`; }
function fmtDate(d: string) { return d ? new Date(d).toLocaleString('en-GB') : '—'; }
function label(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

function getBackendBase() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '');
}
function resolveImg(url: string | null) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${getBackendBase()}${url}`;
}

export default function AdminCustomOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error } = useToast();

  const [order, setOrder] = useState<CustomOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [reviewNote, setReviewNote] = useState('');
  const [reviewNoteType, setReviewNoteType] = useState('customer');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('internal');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/custom-orders/${id}`);
      setOrder(res.data);
      setNewStatus(res.data.status);
    } catch {
      error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) return;
    setUpdatingStatus(true);
    try {
      await apiClient.put(`/admin/custom-orders/${id}/status`, { status: newStatus });
      setOrder(prev => prev ? { ...prev, status: newStatus } : prev);
      success('Status updated');
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to update status');
      setNewStatus(order.status);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReview = async (reviewStatus: string) => {
    setSubmittingReview(true);
    try {
      await apiClient.put(`/admin/custom-orders/${id}/review`, {
        review_status: reviewStatus,
        note: reviewNote || undefined,
        note_type: reviewNoteType,
      });
      setReviewNote('');
      success(`Order ${label(reviewStatus).toLowerCase()}`);
      load();
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to update review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await apiClient.post(`/admin/custom-orders/${id}/notes`, { note: noteText, note_type: noteType });
      setNoteText('');
      success('Note added');
      load();
    } catch {
      error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 text-slate-400">
        <AlertCircle size={40} className="mx-auto mb-3" />
        <p className="font-semibold">Order not found</p>
      </div>
    );
  }

  const imageUrl = resolveImg(order.reference_image_url);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Order #{order.order_number}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{fmtDate(order.created_at)}</p>
        </div>
        <div className="ml-auto flex gap-2 flex-wrap">
          <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${STATUS_COLOURS[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
            {label(order.status)}
          </span>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
            order.review_status === 'approved' ? 'bg-green-100 text-green-700' :
            order.review_status === 'rejected' ? 'bg-red-100 text-red-700' :
            order.review_status === 'changes_requested' ? 'bg-orange-100 text-orange-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            Review: {label(order.review_status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left col: image + config + pricing */}
        <div className="lg:col-span-2 space-y-6">

          {/* Reference image */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-700">Reference Image</h2>
            </div>
            <div className="p-5">
              {imageUrl ? (
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center aspect-video">
                  <img src={imageUrl} alt="Reference" className="object-contain max-h-64 max-w-full" />
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center aspect-video text-slate-400">
                  <Package size={48} />
                </div>
              )}
              <p className="mt-2 text-xs text-slate-400 font-medium">
                Source: {order.image_source === 'ai' ? 'AI Generation' : 'Customer upload'}
              </p>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-700">Configuration</h2>
            </div>
            <div className="divide-y divide-slate-100">
              <Row label="Size" value={`${order.size_mm}mm`} />
              <Row label="Finish" value={order.finish_name} />
              {order.painting_tier_name && <Row label="Painting Tier" value={order.painting_tier_name} />}
              {order.paint_extras?.length > 0 && (
                <div className="px-5 py-3 flex items-start justify-between">
                  <span className="text-sm text-slate-500 font-medium">Paint Extras</span>
                  <div className="text-sm font-semibold text-slate-800 text-right space-y-1">
                    {order.paint_extras.map(pe => (
                      <div key={pe.id} className="flex items-center gap-2 justify-end">
                        <span className="w-3 h-3 rounded-full border border-slate-300 inline-block" style={{ backgroundColor: pe.hex_code }} />
                        {pe.color_name} ×{pe.quantity} — {fmt(pe.unit_price * pe.quantity)}
                        {pe.is_on_sale && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">SALE</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-700">Pricing Breakdown</h2>
            </div>
            <div className="p-5 space-y-2 text-sm">
              <PRow label={`Size (${order.size_mm}mm)`} value={fmt(order.size_price)} />
              <PRow label={order.finish_name} value={fmt(order.finish_price)} />
              {order.painting_price > 0 && <PRow label={`Painting — ${order.painting_tier_name}`} value={fmt(order.painting_price)} />}
              {order.extras_total > 0 && <PRow label="Paint extras" value={fmt(order.extras_total)} />}
              <div className="border-t border-dashed border-slate-200 pt-2 mt-2">
                <PRow label="Subtotal" value={fmt(order.subtotal_before_discount)} />
              </div>
              {order.discount_amount > 0 && (
                <PRow
                  label={`${order.membership_tier ? label(order.membership_tier) + ' ' : ''}discount (${order.discount_percentage}%)`}
                  value={`-${fmt(order.discount_amount)}`}
                  green
                />
              )}
              <PRow label={order.delivery_price === 0 ? 'Delivery (FREE)' : 'Delivery'} value={fmt(order.delivery_price)} green={order.delivery_price === 0} />
              <div className="border-t-2 border-slate-200 pt-3 mt-2 flex justify-between font-bold text-base">
                <span className="text-slate-900">Total</span>
                <span className="text-slate-900">{fmt(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping */}
          {order.shipping_address && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-slate-700">Shipping Address</h2>
              </div>
              <div className="p-5 text-sm text-slate-700 space-y-1">
                {Object.entries(order.shipping_address).map(([k, v]) => (
                  <p key={k}><span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}:</span> {v}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right col: customer + actions + notes */}
        <div className="space-y-6">

          {/* Customer */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-700">Customer</h2>
            </div>
            <div className="p-5 space-y-1 text-sm">
              <p className="font-semibold text-slate-800">{order.users?.name ?? '—'}</p>
              <p className="text-slate-500">{order.users?.email ?? '—'}</p>
              <p className="text-xs text-slate-400 pt-1">
                Agreement accepted: {order.agreement_accepted ? '✅ Yes' : '❌ No'}
              </p>
            </div>
          </div>

          {/* Status update */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-700">Update Status</h2>
            </div>
            <div className="p-5 space-y-3">
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white"
              >
                {VALID_STATUSES.map(s => (
                  <option key={s} value={s}>{label(s)}</option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={updatingStatus || newStatus === order.status}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Status
              </button>
            </div>
          </div>

          {/* Review actions */}
          {order.review_status === 'pending' || order.review_status === 'changes_requested' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-slate-700">Review Order</h2>
              </div>
              <div className="p-5 space-y-3">
                <textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Optional note to customer..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <select
                  value={reviewNoteType}
                  onChange={e => setReviewNoteType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white"
                >
                  <option value="customer">Visible to customer</option>
                  <option value="internal">Internal only</option>
                </select>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleReview('approved')}
                    disabled={submittingReview}
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {submittingReview ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview('changes_requested')}
                    disabled={submittingReview}
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleReview('rejected')}
                    disabled={submittingReview}
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Add note */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <MessageSquare size={16} /> Add Note
              </h2>
            </div>
            <div className="p-5 space-y-3">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Write a note..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <select
                value={noteType}
                onChange={e => setNoteType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white"
              >
                <option value="internal">Internal only</option>
                <option value="customer">Visible to customer</option>
              </select>
              <button
                onClick={handleAddNote}
                disabled={addingNote || !noteText.trim()}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {addingNote ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                Add Note
              </button>
            </div>
          </div>

          {/* Notes history */}
          {order.notes?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-slate-700">Notes ({order.notes.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {order.notes.map(note => (
                  <div key={note.id} className="p-4 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">{note.admin_name ?? 'Admin'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${note.note_type === 'customer' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                        {note.note_type === 'customer' ? 'Customer' : 'Internal'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{note.note}</p>
                    <p className="text-xs text-slate-400">{fmtDate(note.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-5 py-3 text-sm">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function PRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${green ? 'text-green-600' : 'text-slate-800'}`}>{value}</span>
    </div>
  );
}
