'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { useToast } from '@/lib/toast/ToastContext';

interface Preset {
  id: string;
  name: string;
  hex_code: string;
  sort_order: number;
}

export default function ColourPresetsPage() {
  const { success, error: toastError } = useToast();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newHex, setNewHex] = useState('#3b82f6');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHex, setEditHex] = useState('');

  useEffect(() => { fetchPresets(); }, []);

  const fetchPresets = async () => {
    try {
      const res = await apiClient.get('/colour-presets');
      setPresets(res.data || []);
    } catch {
      toastError('Failed to load colour presets');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await apiClient.post('/colour-presets', { name: newName.trim(), hex_code: newHex });
      setNewName('');
      setNewHex('#3b82f6');
      success('Preset added');
      await fetchPresets();
    } catch {
      toastError('Failed to add preset');
    } finally {
      setAdding(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await apiClient.put(`/colour-presets/${id}`, { name: editName.trim(), hex_code: editHex });
      setEditingId(null);
      success('Preset updated');
      await fetchPresets();
    } catch {
      toastError('Failed to update preset');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/colour-presets/${id}`);
      success('Preset deleted');
      await fetchPresets();
    } catch {
      toastError('Failed to delete preset');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Print Colour Presets</h1>
        <p className="text-sm text-slate-500 mt-1">
          Save named colours to reuse across product listings — click a preset swatch on any product page to add it instantly.
        </p>
      </div>

      {/* Add new preset */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Add New Preset</h2>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={newHex}
            onChange={e => setNewHex(e.target.value)}
            className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5 shrink-0"
          />
          <input
            type="text"
            placeholder="Colour name (e.g. Dark Brown)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <span className="text-xs text-slate-400 font-mono w-16 shrink-0">{newHex}</span>
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 shrink-0"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Preset list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Saved Presets</h2>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : presets.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No presets yet — add one above.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {presets.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-6 py-4">
                {editingId === p.id ? (
                  <>
                    <input
                      type="color"
                      value={editHex}
                      onChange={e => setEditHex(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(p.id); if (e.key === 'Escape') setEditingId(null); }}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      autoFocus
                    />
                    <span className="text-xs text-slate-400 font-mono w-16 shrink-0">{editHex}</span>
                    <button onClick={() => handleSaveEdit(p.id)} className="p-1.5 text-green-600 hover:text-green-700 transition-colors" title="Save">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors" title="Cancel">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-200 shadow-sm shrink-0" style={{ backgroundColor: p.hex_code }} />
                    <span className="flex-1 text-sm font-medium text-slate-700">{p.name}</span>
                    <span className="text-xs text-slate-400 font-mono w-16 shrink-0">{p.hex_code}</span>
                    <button
                      onClick={() => { setEditingId(p.id); setEditName(p.name); setEditHex(p.hex_code); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
