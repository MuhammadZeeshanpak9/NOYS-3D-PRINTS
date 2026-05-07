'use client';

import { useState, useEffect, useRef } from 'react';
import { UploadBox } from '@/components/ui/UploadBox';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ModelViewer3D } from '@/components/ui/ModelViewer3D';
import { AlertCircle, Wand2, Download, Save, CheckCircle, ShoppingCart, XCircle, Box, Expand } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { useAuth } from '@/lib/auth/useAuth';
import { useToast } from '@/lib/toast/ToastContext';
import { useRouter } from 'next/navigation';

interface GenerationResult {
  id: string;
  prompt: string;
  image_url: string | null;
  stl_url: string | null;
  is_saved: boolean;
  credits_used: number;
  processing_progress?: number;
}

export default function AIGeneratorPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();

  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const [timedOut, setTimedOut] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isAuthenticated && !authLoading) fetchUserCredits();
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promptParam = params.get('prompt');
    if (promptParam) setPrompt(promptParam);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  const fetchUserCredits = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setCredits(response.data.credits || 0);
    } catch {}
  };

  // Smooth simulated progress — never reaches 100 until generation confirmed
  const startProgressSimulation = () => {
    startTimeRef.current = Date.now();
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);

    progressRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      let estimated: number;
      if (elapsed < 15) estimated = Math.round((elapsed / 15) * 30);
      else if (elapsed < 60) estimated = Math.round(30 + ((elapsed - 15) / 45) * 40);
      else if (elapsed < 120) estimated = Math.round(70 + ((elapsed - 60) / 60) * 20);
      else estimated = Math.min(95, Math.round(90 + ((elapsed - 120) / 60) * 5));
      setProgress(estimated);
    }, 800);
  };

  const stopProgress = (final: number) => {
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
    setProgress(final);
  };

  const startPolling = (generationId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    const startTime = Date.now();
    const TIMEOUT_MS = 4.5 * 60 * 1000; // 4.5 min — backend background task runs 4 min max

    pollRef.current = setInterval(async () => {
      if (Date.now() - startTime > TIMEOUT_MS) {
        clearInterval(pollRef.current!); pollRef.current = null;
        stopProgress(100);
        setLoading(false);
        setTimedOut(true);
        return;
      }

      try {
        const res = await apiClient.get(`/generations/${generationId}`);
        const gen: GenerationResult = res.data;

        // Use real Tripo progress if available
        if (gen.processing_progress && gen.processing_progress > 0) {
          setProgress(Math.min(95, gen.processing_progress));
        }

        // null = still processing, keep waiting
        if (gen.image_url === null) return;

        clearInterval(pollRef.current!); pollRef.current = null;
        stopProgress(100);

        setTimeout(() => {
          setLoading(false);
          // Only treat as failed if BOTH image and 3D model are missing
          if (gen.image_url === '' && !gen.stl_url) {
            setError('3D generation failed. Please try a different prompt or image.');
          } else {
            setResult(gen);
            success('Model generated successfully!');
          }
        }, 400);
      } catch {
        clearInterval(pollRef.current!); pollRef.current = null;
        stopProgress(0);
        setLoading(false);
        setError('Connection error while checking generation status. Please try again.');
      }
    }, 4000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && images.length === 0) {
      setError('Please provide a prompt or upload at least one image reference.');
      return;
    }
    if (!isAuthenticated) { setLoginModalOpen(true); return; }
    if (credits < 1) {
      setError("You don't have enough credits. Please purchase more credits.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setIsSaved(false);
    setTimedOut(false);
    startProgressSimulation();

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      images.forEach((img) => formData.append('images', img));

      const response = await apiClient.post('/generations/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const gen: GenerationResult = response.data;
      setCredits(prev => prev - 1);

      if (gen.image_url) {
        stopProgress(100);
        setTimeout(() => { setResult(gen); setLoading(false); success('Model generated successfully!'); }, 400);
      } else {
        startPolling(gen.id);
      }
    } catch (err: any) {
      stopProgress(0);
      setLoading(false);
      const msg = err.response?.data?.error || 'Failed to generate model. Please try again.';
      setError(msg);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated || !result) { setLoginModalOpen(true); return; }
    setIsSaving(true);
    try {
      await apiClient.post(`/generations/${result.id}/save`);
      setIsSaved(true);
      success('Model saved to your Gallery!');
      const existing = JSON.parse(localStorage.getItem('2dtoy_gallery') || '[]');
      localStorage.setItem('2dtoy_gallery', JSON.stringify([
        { id: result.id, prompt: result.prompt, imageUrl: result.image_url, date: new Date().toISOString() },
        ...existing,
      ]));
    } catch {
      toastError('Failed to save. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-[#0c2a50]">AI 3D Model Generator</h1>
        <p className="text-[#1a4073] mt-2 max-w-2xl mx-auto text-lg">
          Upload a reference photo or describe what you want — our AI will generate a ready-to-print 3D model.
        </p>
        {isAuthenticated && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm font-semibold text-blue-700">
            <span>Your Credits:</span>
            <span className="bg-blue-600 text-white px-3 py-0.5 rounded-full">{credits}</span>
          </div>
        )}
      </div>

      <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex gap-3 items-center max-w-2xl mx-auto mb-8 shadow-sm">
        <AlertCircle className="text-orange-500 shrink-0" size={24} />
        <p className="font-semibold text-sm sm:text-base">
          IMPORTANT: Generates single-colour 3D-printable models only. Intricate textures are simplified for FDM/SLA viability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input panel */}
        <Card className="shadow-lg border-t-8 border-t-blue-500">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-base font-bold text-[#1a4073]">Upload a Reference Photo <span className="text-slate-400 font-normal text-sm">(optional)</span></label>
              <p className="text-xs text-slate-500">Upload your image, check it looks right, then click Generate below.</p>
              <UploadBox
                files={images}
                onFilesChange={setImages}
                accept="image/jpeg, image/png"
                label="Drop a photo here or click to browse"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-semibold uppercase">or describe it</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="space-y-2">
              <label className="text-base font-bold text-[#1a4073]">Describe Your Model <span className="text-slate-400 font-normal text-sm">(optional)</span></label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A miniature gothic castle tower with battlements..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-y shadow-inner min-h-[100px]"
              />
            </div>

            {timedOut && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-sm flex flex-col gap-2">
                <p className="font-semibold">Your model is still being generated in the background.</p>
                <p className="text-xs text-blue-600">It usually completes within a few minutes. Check <strong>My Designs</strong> shortly.</p>
                <button
                  className="text-xs font-bold text-blue-700 underline text-left"
                  onClick={() => router.push('/profile/history')}
                >
                  Go to My Designs →
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                <XCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full shadow-[0_4px_0_#cc6200]"
              onClick={handleGenerate}
              isLoading={loading}
              disabled={(!prompt.trim() && images.length === 0) || loading}
            >
              <Wand2 className="mr-2 h-5 w-5" />
              Generate 3D Model
            </Button>
          </CardContent>
        </Card>

        {/* Preview panel */}
        <Card className="shadow-lg min-h-[500px] flex flex-col">
          <CardContent className="p-6 flex-1 flex flex-col items-center justify-center relative">
            {loading ? (
              <div className="flex flex-col items-center space-y-6 text-center w-full max-w-sm">
                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-slate-600">
                    <span>Sculpting your model...</span>
                    <span className="text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    This typically takes 1–2 minutes. You can stay on this page or check My Designs later.
                  </p>
                </div>
              </div>
            ) : result ? (
              <div className="w-full h-full flex flex-col space-y-4">
                <div className="flex-1 rounded-xl overflow-hidden relative min-h-[350px]">
                  {result.stl_url ? (
                    <>
                      <ModelViewer3D src={result.stl_url} poster={result.image_url ?? undefined} />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none">
                        <Box size={12} />
                        <span>Drag to rotate · Scroll to zoom</span>
                      </div>
                    </>
                  ) : result.image_url ? (
                    <div className="relative w-full h-full bg-gray-100 border border-gray-200 shadow-inner flex items-center justify-center min-h-[300px]">
                      <img src={result.image_url} alt="Generated 3D Model Preview" className="object-cover h-full w-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                        <p className="text-white font-bold text-lg drop-shadow-md">Preview Ready</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 flex items-center justify-center h-full">No preview available</div>
                  )}
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <Button
                    variant="secondary"
                    className="w-full font-bold bg-[#0c2a50] text-white hover:bg-[#1a4073]"
                    onClick={() => router.push(`/preview/${result.id}`)}
                  >
                    <Expand className="mr-2 h-4 w-4" />
                    Full 3D Preview
                  </Button>
                  <Button variant="outline" className="w-full font-bold" disabled={!result.stl_url}
                    onClick={() => result.stl_url && window.open(result.stl_url, '_blank')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download 3D Model
                  </Button>
                  <Button
                    variant="primary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleSave}
                    isLoading={isSaving}
                    disabled={isSaved}
                  >
                    {isSaved ? <><CheckCircle size={20} /> Saved to Gallery</> : <><Save size={20} /> Save to Gallery</>}
                  </Button>
                  {isSaved && (
                    <Button variant="secondary" className="w-full" onClick={() => router.push('/profile/history')}>
                      View in My Designs
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    className="w-full bg-green-600 border-green-800 shadow-[0_6px_0_#166534] hover:shadow-[0_8px_0_#166534]"
                    onClick={() => {
                      sessionStorage.setItem('noys_builder_preselect', JSON.stringify({ generationId: result.id, imageUrl: result.image_url }));
                      router.push('/builder?source=ai');
                    }}
                  >
                    <ShoppingCart size={18} className="mr-2" /> Order this Print
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center opacity-40">
                <Wand2 size={64} className="mx-auto text-blue-300 mb-4" />
                <h3 className="text-2xl font-bold text-[#1a4073]">Awaiting Generation</h3>
                <p className="text-[#1a4073] mt-2">Upload a photo or enter a description to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} title="Login Required">
        <div className="text-center space-y-6">
          <p className="text-gray-600 font-semibold mb-6">
            You must be logged in to generate and save 3D models.
          </p>
          <Button className="w-full" onClick={() => { setLoginModalOpen(false); router.push('/login'); }}>
            Go to Login
          </Button>
        </div>
      </Modal>
    </div>
  );
}
