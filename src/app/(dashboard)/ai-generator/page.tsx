'use client';

import React, { useState } from 'react';
import { UploadBox } from '@/components/ui/UploadBox';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AlertCircle, Wand2, Link as LinkIcon, Download, Save, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { useAuth } from '@/lib/auth/useAuth';

export default function AIGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated } = useAuth();
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() && images.length === 0) {
      setError("Please provide a prompt or upload at least one image reference.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Build FormData for FastAPI backend
      const formData = new FormData();
      formData.append('prompt', prompt);
      images.forEach((img) => formData.append('images', img));

      // Mock behavior
      await new Promise((r) => setTimeout(r, 2000));
      setResult('/placeholder-3.jpg'); // Provide a fake resulting image representing a 3D model
      setIsSaved(false); // Reset save state for new generation
    } catch (err) {
      setError("Failed to generate model. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      console.log('POST /user/save-generation ->', { prompt, resultUrl: result });
      
      // Save locally to mock the gallery population
      const existingSaved = JSON.parse(localStorage.getItem('2dtoy_gallery') || '[]');
      const newSavedItem = {
        id: Date.now().toString(),
        prompt: prompt || 'Custom Uploaded AI Model',
        imageUrl: result,
        date: new Date().toISOString()
      };
      localStorage.setItem('2dtoy_gallery', JSON.stringify([newSavedItem, ...existingSaved]));

      await new Promise((r) => setTimeout(r, 1000)); // Mock network save
      setIsSaved(true);
      alert('Model saved to your Gallery successfully!');
    } catch (err) {
      console.error('Failed to save', err);
      alert('Failed to save. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-8 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-[#0c2a50]">AI 3D Model Generator</h1>
        <p className="text-[#1a4073] mt-2 max-w-2xl mx-auto text-lg">
          Describe what you want or upload reference photos, and our AI will generate a ready-to-print 3D model.
        </p>
      </div>

      <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex gap-3 items-center max-w-2xl mx-auto mb-8 shadow-sm">
        <AlertCircle className="text-orange-500 shrink-0" size={24} />
        <p className="font-semibold text-sm sm:text-base">
          IMPORTANT: Generates single-colour 3D-printable models only. Intricate textures are simplified for FDM/SLA viability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Inputs */}
        <Card className="shadow-lg border-t-8 border-t-blue-500">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-base font-bold text-[#1a4073]">Describe Your Model</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A miniature gothic castle tower with battlements..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-y shadow-inner min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-base font-bold text-[#1a4073]">Reference Images (Optional)</label>
              <UploadBox 
                files={images} 
                onFilesChange={setImages} 
                accept="image/jpeg, image/png"
                label="Drop reference photos here"
              />
            </div>

            {error && <p className="text-red-500 font-medium text-sm">{error}</p>}

            <Button 
              variant="primary" 
              size="lg" 
              className="w-full shadow-[0_4px_0_#cc6200]" 
              onClick={handleGenerate}
              isLoading={loading}
            >
              <Wand2 className="mr-2 h-5 w-5" />
              Generate 3D Model
            </Button>
          </CardContent>
        </Card>

        {/* Right Side: Results & Preview */}
        <Card className="shadow-lg min-h-[500px] flex flex-col">
          <CardContent className="p-6 flex-1 flex flex-col items-center justify-center relative">
            {loading ? (
              <div className="flex flex-col items-center animate-pulse text-blue-500 space-y-4">
                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <h3 className="text-xl font-bold">Sculpting in the cloud...</h3>
                <p className="text-gray-500 text-sm">This typically takes 30-60 seconds.</p>
              </div>
            ) : result ? (
              <div className="w-full h-full flex flex-col space-y-4">
                <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden relative flex items-center justify-center min-h-[300px] border border-gray-200 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result} alt="Generated 3D Model Preview" className="object-cover h-full w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                    <p className="text-white font-bold text-lg drop-shadow-md">Preview Ready</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex gap-3 w-full">
                    <Button variant="secondary" className="flex-1">Order Print</Button>
                    <Button variant="outline" className="flex-1">Download STL</Button>
                  </div>
                  <Button 
                    variant="primary" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleSave}
                    isLoading={isSaving}
                    disabled={isSaved}
                  >
                    {isSaved ? (
                      <><CheckCircle size={20} /> Saved to Gallery</>
                    ) : (
                      <><Save size={20} /> Save to Gallery</>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center opacity-40">
                <Wand2 size={64} className="mx-auto text-blue-300 mb-4" />
                <h3 className="text-2xl font-bold text-[#1a4073]">Awaiting Generation</h3>
                <p className="text-[#1a4073] mt-2">Your 3D preview will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} title="Login Required">
        <div className="text-center space-y-6">
          <p className="text-gray-600 font-semibold mb-6">
            You must be logged in to save generations to your personal gallery.
          </p>
          <div className="space-y-4">
            <Button className="w-full" onClick={() => setLoginModalOpen(false)}>Okay</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
