'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Check, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/cart/CartContext';
import apiClient from '@/lib/api/client';

function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);

  const isShop = searchParams.get('kind') === 'shop';

  useEffect(() => {
    // Order ID comes from URL param (set by backend success_url) or sessionStorage
    const urlOrderId = searchParams.get('order_id');
    const storedOrderId = sessionStorage.getItem('noys_last_order_id');
    const id = urlOrderId || storedOrderId || null;
    setOrderId(id);
    if (storedOrderId) sessionStorage.removeItem('noys_last_order_id');

    if (isShop) {
      // Webhook-independent safety net: confirm the Stripe session and apply
      // fulfilment even if the webhook is delayed. Idempotent server-side.
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        apiClient.post('/payments/verify-session', { session_id: sessionId }).catch(() => {});
      }
      // Payment succeeded — safe to empty the cart now.
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-10 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-100 border-4 border-green-500 flex items-center justify-center mx-auto shadow-[4px_4px_0px_#16a34a]">
          <Check size={40} className="text-green-600" strokeWidth={3} />
        </div>

        <div>
          <h1 className="text-3xl font-black text-[#0c2a50] mb-2">Payment Successful!</h1>
          <p className="text-gray-600 font-semibold">
            {isShop
              ? "Your order has been placed and paid. We're preparing it now and will email you when it ships."
              : "Your custom model order has been placed. We'll review your image and contact you before production begins."}
          </p>
        </div>

        {orderId && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 text-sm">
            <span className="text-slate-500 font-medium">Order ref: </span>
            <span className="font-bold text-slate-800">{orderId.slice(0, 8).toUpperCase()}</span>
          </div>
        )}

        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-sm font-semibold text-amber-800">
          {isShop
            ? <>Your order is now <strong>Processing</strong>. A confirmation email is on its way.</>
            : <>Your order is now <strong>In Review</strong>. You'll receive a confirmation email shortly.</>}
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/profile/history">
            <Button variant="primary" size="lg" className="w-full">
              View My Orders
            </Button>
          </Link>
          <Link href={isShop ? '/shop' : '/builder'}>
            <Button variant="outline" className="w-full">
              {isShop ? 'Continue Shopping' : 'Place Another Order'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-blue-500" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
