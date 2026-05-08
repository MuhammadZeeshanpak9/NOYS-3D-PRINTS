'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export default function PreviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[preview] route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0c1a2e] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0f1f35] border border-white/10 rounded-2xl p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-400/30 flex items-center justify-center mx-auto">
          <AlertCircle size={28} className="text-red-300" />
        </div>
        <h2 className="text-xl font-bold text-white">Couldn't open this preview</h2>
        <p className="text-sm text-white/60">
          Something went wrong while loading the 3D model. The signed model link may have expired,
          or your network blocked the asset.
        </p>
        {process.env.NODE_ENV !== 'production' && error?.message && (
          <pre className="text-xs text-red-300 bg-black/30 border border-red-400/20 rounded p-3 text-left overflow-auto max-h-40">
            {error.message}
          </pre>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            <RefreshCw size={16} /> Try again
          </button>
          <button
            onClick={() => router.push('/profile/history')}
            className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/80 font-semibold py-2.5 rounded-lg border border-white/10 transition-colors"
          >
            <ArrowLeft size={16} /> Back to my generations
          </button>
        </div>
      </div>
    </div>
  );
}
