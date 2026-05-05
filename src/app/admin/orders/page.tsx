'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';

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
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await apiClient.patch(`/admin/orders/${orderId}`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

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

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </p>
                  <p className="text-sm text-slate-500">{order.shipping_address.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="flex flex-wrap gap-6">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Items</p>
                    <ul className="space-y-1">
                      {order.items.map((item, i) => (
                        <li key={i} className="text-sm text-slate-700">
                          {item.name} × {item.quantity} — <span className="font-medium">£{(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="min-w-[160px]">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Ship To</p>
                    <p className="text-sm text-slate-700">{order.shipping_address.address}</p>
                    <p className="text-sm text-slate-700">{order.shipping_address.city}, {order.shipping_address.zip_code}</p>
                  </div>
                  <div className="min-w-[100px] text-right">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Total</p>
                    <p className="text-xl font-bold text-slate-900">£{order.total.toFixed(2)}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
