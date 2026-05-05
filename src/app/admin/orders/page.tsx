'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { ArrowRight, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  status: string;
  shipping_address: {
    first_name: string;
    last_name: string;
    email: string;
    address: string;
    city: string;
    zip_code: string;
  };
  created_at: string;
}

const TABS = [
  { key: 'pending',    label: 'New Orders',  icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50',  border: 'border-yellow-200', next: 'processing',  nextLabel: 'Move to Processing' },
  { key: 'processing', label: 'Processing',  icon: Package,      color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',   next: 'shipped',     nextLabel: 'Mark as Shipped' },
  { key: 'shipped',    label: 'Shipped',     icon: Truck,        color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-200', next: 'delivered',   nextLabel: 'Mark as Delivered' },
  { key: 'delivered',  label: 'Delivered',   icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',  next: null,          nextLabel: null },
  { key: 'cancelled',  label: 'Cancelled',   icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    next: null,          nextLabel: null },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [movingId, setMovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get('/admin/orders');
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (newStatus === 'cancelled') {
      setCancellingId(orderId);
    } else {
      setMovingId(orderId);
    }
    try {
      await apiClient.patch(`/admin/orders/${orderId}`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setMovingId(null);
      setCancellingId(null);
    }
  };

  const currentTab = TABS.find(t => t.key === activeTab)!;
  const filtered = orders.filter(o => o.status === activeTab);
  const counts = Object.fromEntries(TABS.map(t => [t.key, orders.filter(o => o.status === t.key).length]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Customer Orders</h1>
        <p className="text-sm text-slate-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                isActive
                  ? `${tab.bg} ${tab.border} ${tab.color}`
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white/70' : 'bg-slate-100'}`}>
                {counts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className={`${currentTab.bg} border-2 ${currentTab.border} rounded-xl p-12 text-center`}>
          <currentTab.icon size={40} className={`${currentTab.color} mx-auto mb-3 opacity-40`} />
          <p className="text-slate-500 font-medium">No {currentTab.label.toLowerCase()} orders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <div key={order.id} className={`bg-white rounded-xl border-2 ${currentTab.border} shadow-sm overflow-hidden`}>
              <div className={`px-6 py-3 ${currentTab.bg} flex flex-wrap items-center justify-between gap-2`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className={`text-xs font-bold uppercase ${currentTab.color}`}>{currentTab.label}</span>
                </div>
                <span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleString()}</span>
              </div>

              <div className="px-6 py-4 flex flex-wrap gap-6 items-start">
                {/* Customer */}
                <div className="min-w-[160px]">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Customer</p>
                  <p className="font-semibold text-slate-800">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                  <p className="text-sm text-slate-500">{order.shipping_address.email}</p>
                </div>

                {/* Items */}
                <div className="flex-1 min-w-[180px]">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Items</p>
                  <ul className="space-y-0.5">
                    {order.items.map((item, i) => (
                      <li key={i} className="text-sm text-slate-700">
                        {item.name} × {item.quantity} — <span className="font-medium">£{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Ship To */}
                <div className="min-w-[140px]">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Ship To</p>
                  <p className="text-sm text-slate-700">{order.shipping_address.address}</p>
                  <p className="text-sm text-slate-700">{order.shipping_address.city}, {order.shipping_address.zip_code}</p>
                </div>

                {/* Total */}
                <div className="text-right min-w-[80px]">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Total</p>
                  <p className="text-xl font-bold text-slate-900">£{order.total.toFixed(2)}</p>
                </div>
              </div>

              {/* Actions */}
              {(currentTab.next || activeTab !== 'cancelled') && (
                <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                  {activeTab !== 'delivered' && activeTab !== 'cancelled' && (
                    <button
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      disabled={cancellingId === order.id}
                      className="px-4 py-2 rounded-lg text-sm font-semibold border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Cancel Order
                    </button>
                  )}
                  {currentTab.next && (
                    <button
                      onClick={() => updateStatus(order.id, currentTab.next!)}
                      disabled={movingId === order.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${currentTab.bg} ${currentTab.color} border-2 ${currentTab.border} hover:opacity-80 transition-opacity disabled:opacity-50`}
                    >
                      {movingId === order.id ? 'Moving...' : currentTab.nextLabel}
                      <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
