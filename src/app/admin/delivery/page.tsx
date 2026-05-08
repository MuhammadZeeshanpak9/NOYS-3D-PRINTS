'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';
import { Loader2, Save, Truck } from 'lucide-react';

interface DeliverySettings {
  id?: string;
  free_delivery_threshold: number;
  standard_delivery_price: number;
}

export default function AdminDeliveryPage() {
  const [settings, setSettings] = useState<DeliverySettings>({ free_delivery_threshold: 50, standard_delivery_price: 4.99 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    apiClient.get('/delivery-settings')
      .then(r => setSettings(r.data))
      .catch(() => error('Failed to load delivery settings'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.put('/delivery-settings', {
        free_delivery_threshold: Number(settings.free_delivery_threshold),
        standard_delivery_price: Number(settings.standard_delivery_price),
      });
      success('Delivery settings saved');
    } catch {
      error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[300px]">
      <Loader2 size={28} className="animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Delivery Settings</h1>
        <p className="text-slate-500 mt-1">Set the free delivery threshold and standard delivery charge.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 text-slate-600 mb-2">
          <Truck size={22} />
          <span className="font-semibold text-slate-700">Delivery Rules</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              Free Delivery Threshold (£)
            </label>
            <p className="text-xs text-slate-400">
              Orders with a subtotal <strong>before discount</strong> at or above this value qualify for free delivery.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.free_delivery_threshold}
                onChange={e => setSettings(prev => ({ ...prev, free_delivery_threshold: Number(e.target.value) }))}
                className={inputCls}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              Standard Delivery Price (£)
            </label>
            <p className="text-xs text-slate-400">
              Applied when the order total does not meet the free delivery threshold.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.standard_delivery_price}
                onChange={e => setSettings(prev => ({ ...prev, standard_delivery_price: Number(e.target.value) }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Current rules:</p>
          <p>• Free delivery when subtotal ≥ <strong>£{Number(settings.free_delivery_threshold).toFixed(2)}</strong></p>
          <p>• Standard delivery charge: <strong>£{Number(settings.standard_delivery_price).toFixed(2)}</strong></p>
          <p>• Membership discounts do <strong>not</strong> apply to delivery</p>
          <p>• Sale items <strong>do</strong> count towards the free delivery threshold</p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-lg transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Settings
        </button>
      </div>
    </div>
  );
}

const inputCls = 'w-40 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white';
