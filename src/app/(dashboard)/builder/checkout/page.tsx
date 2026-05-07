'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';
import { useStore } from '@/lib/store/useStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/components/ui/Button';
import { CheckSquare, Square, ShoppingCart, Check, AlertCircle, Loader2, Package } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaintExtraItem {
  paintColorId: string;
  quantity: number;
  colorName: string;
  hexCode: string;
  unitPrice: number;
}

interface PricingResult {
  size: { id: string; size_mm: number; price: number; is_on_sale: boolean };
  finish: { id: string; name: string; slug: string; price: number; is_on_sale: boolean };
  painting: { tier_id: string; tier_name: string; price: number } | null;
  extras: Array<{
    paint_color_id: string; color_name: string; hex_code: string;
    quantity: number; unit_price: number; line_total: number; is_on_sale: boolean;
  }>;
  extras_total: number;
  subtotal_before_discount: number;
  discount_percentage: number;
  discount_amount: number;
  membership_tier: string | null;
  delivery: { qualifies_free: boolean; price: number; free_threshold: number; amount_to_free: number };
  total: number;
}

interface PendingOrder {
  referenceImageUrl: string;
  imagePreview: string;
  generationId: string | null;
  imageSource: 'upload' | 'ai';
  modelSizeId: string;
  finishOptionId: string;
  finishSlug: string;
  sizeMm: number;
  finishName: string;
  paintExtras: PaintExtraItem[];
  pricing: PricingResult;
}

interface ShippingForm {
  full_name: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
}

// ─── Agreement terms ──────────────────────────────────────────────────────────

const AGREEMENT_TERMS = [
  'This is a custom-made product based on my uploaded image or generated design.',
  'My image will be reviewed before production and may be approved, rejected, or require changes. If unsuitable, I may be asked to upload a new image.',
  'I may request a refund only before my order is approved for production.',
  'Once my order has been approved and production has started, cancellations or refunds may not be possible.',
  'I understand that higher quality images produce better results.',
  'I accept that due to the nature of 3D printing, minor imperfections, layer lines, or surface marks may be visible.',
  'I understand that colours and finishes may vary from what is shown on screen.',
  'I accept that painted models are an artistic interpretation and may not exactly match reference images.',
  'I confirm that I have the right to use any images I upload.',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `£${n.toFixed(2)}`;
}

function getBackendBase() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

function resolveImageUrl(url: string) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${getBackendBase()}${url}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BuilderCheckoutPage() {
  const router = useRouter();
  const { user } = useStore();

  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [shipping, setShipping] = useState<ShippingForm>({
    full_name: '',
    address: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
  });

  // ── Load pending order from sessionStorage ─────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('noys_pending_order');
    if (!raw) {
      router.replace('/builder');
      return;
    }
    try {
      setOrder(JSON.parse(raw) as PendingOrder);
    } catch {
      router.replace('/builder');
    }
  }, [router]);

  // ── Pre-fill shipping from user profile ────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const nameParts = user.name?.split(' ') ?? [];
    setShipping(prev => ({
      ...prev,
      full_name: user.name ?? '',
    }));
  }, [user]);

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShipping(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isShippingValid = () =>
    shipping.full_name.trim() &&
    shipping.address.trim() &&
    shipping.city.trim() &&
    shipping.postcode.trim() &&
    shipping.country.trim();

  // ── Submit order ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!order || !agreed || !isShippingValid()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const body = {
        model_size_id: order.modelSizeId,
        finish_option_id: order.finishOptionId,
        reference_image_url: order.referenceImageUrl,
        generation_id: order.generationId ?? undefined,
        image_source: order.imageSource,
        paint_extras: order.paintExtras.map(pe => ({
          paint_color_id: pe.paintColorId,
          quantity: pe.quantity,
        })),
        shipping_address: {
          full_name: shipping.full_name,
          address: shipping.address,
          city: shipping.city,
          postcode: shipping.postcode,
          country: shipping.country,
        },
        agreement_accepted: true,
      };

      const res = await apiClient.post('/custom-orders/checkout', body);
      const { checkout_url, order_id } = res.data;

      sessionStorage.removeItem('noys_pending_order');

      if (checkout_url) {
        // Store order_id so success page can read it
        sessionStorage.setItem('noys_last_order_id', order_id);
        window.location.href = checkout_url;
      } else {
        // Stripe not configured (dev mode) — show inline success
        setOrderId(order_id);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading / not found ────────────────────────────────────────────────────
  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <Loader2 size={36} className="animate-spin text-[#1a4073]" />
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-sky-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-10 space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-100 border-4 border-green-500 flex items-center justify-center mx-auto shadow-[4px_4px_0px_#16a34a]">
              <Check size={40} className="text-green-600" strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black text-[#0c2a50]">Order Placed!</h2>
            <p className="text-gray-600 font-semibold">
              Your custom model order has been received. We'll review your image and contact you before production begins.
            </p>
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-sm font-semibold text-amber-800">
              Your order is now <strong>In Review</strong>. You'll be notified once approved.
            </div>
            <div className="flex flex-col gap-3">
              <Button variant="primary" size="lg" onClick={() => router.push('/profile/history')}>
                View My Orders
              </Button>
              <Button variant="outline" onClick={() => router.push('/builder')}>
                Place Another Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { pricing } = order;

  // ── Main checkout UI ───────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] bg-sky-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#0c2a50]">Checkout</h1>
          <p className="text-[#1a4073] mt-2 text-lg">Review your order and confirm before placing.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Left: shipping + agreement ──────────────────────────────── */}
          <div className="space-y-6">

            {/* Shipping */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-black text-[#0c2a50]">Shipping Details</h2>
                <Field label="Full Name">
                  <input
                    name="full_name"
                    value={shipping.full_name}
                    onChange={handleShippingChange}
                    placeholder="Jane Smith"
                    className={inputClass}
                  />
                </Field>
                <Field label="Address">
                  <input
                    name="address"
                    value={shipping.address}
                    onChange={handleShippingChange}
                    placeholder="123 High Street"
                    className={inputClass}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="City">
                    <input
                      name="city"
                      value={shipping.city}
                      onChange={handleShippingChange}
                      placeholder="London"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Postcode">
                    <input
                      name="postcode"
                      value={shipping.postcode}
                      onChange={handleShippingChange}
                      placeholder="SW1A 1AA"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label={<span className="flex items-center gap-2">Country <span className="text-xs font-semibold text-sky-500 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">UK shipping only</span></span>}>
                  <input disabled type="text" value="United Kingdom" className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 text-[#0c2a50] bg-gray-50 font-semibold cursor-not-allowed opacity-80" />
                </Field>
              </CardContent>
            </Card>

            {/* Agreement */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-black text-[#0c2a50]">Order Agreement</h2>
                <p className="text-sm text-gray-500 font-semibold">
                  Please read and confirm the following before placing your order.
                </p>
                <ul className="space-y-3">
                  {AGREEMENT_TERMS.map((term, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-[#1a4073] text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {term}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setAgreed(!agreed)}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 rounded-2xl border-4 transition-all text-left',
                    agreed
                      ? 'bg-green-50 border-green-500 shadow-[4px_4px_0px_#16a34a]'
                      : 'bg-white border-[#1a4073] shadow-[4px_4px_0px_#1a4073] hover:bg-blue-50'
                  )}
                >
                  {agreed ? (
                    <CheckSquare size={22} className="text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square size={22} className="text-[#1a4073] shrink-0 mt-0.5" />
                  )}
                  <span className={cn('font-bold text-sm', agreed ? 'text-green-800' : 'text-[#0c2a50]')}>
                    By placing this order, I confirm that I have read and agree to all of the above terms.
                  </span>
                </button>
              </CardContent>
            </Card>

            {error && (
              <div className="flex gap-3 items-start bg-red-50 border-2 border-red-300 rounded-2xl p-4">
                <AlertCircle size={20} className="text-red-500 shrink-0" />
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={!agreed || !isShippingValid() || isSubmitting}
              isLoading={isSubmitting}
            >
              <ShoppingCart size={20} className="mr-2" />
              {isSubmitting ? 'Redirecting to payment...' : 'Pay Now'}
            </Button>
          </div>

          {/* ── Right: order summary ─────────────────────────────────────── */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-black text-[#0c2a50]">Order Summary</h2>

                {/* Image preview */}
                {order.imagePreview && (
                  <div className="rounded-2xl overflow-hidden border-4 border-[#1a4073] shadow-[4px_4px_0px_#1a4073] aspect-video flex items-center justify-center bg-gray-50">
                    <img
                      src={resolveImageUrl(order.imagePreview)}
                      alt="Reference"
                      className="object-contain max-h-48 max-w-full"
                    />
                  </div>
                )}

                {/* Config */}
                <div className="border-4 border-[#1a4073] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#1a4073]">
                  <div className="bg-[#1a4073] px-4 py-2">
                    <p className="font-black text-white text-sm flex items-center gap-2">
                      <Package size={14} /> Configuration
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <Row label="Source" value={order.imageSource === 'ai' ? 'AI Generation' : 'Uploaded image'} />
                    <Row label="Size" value={`${order.sizeMm}mm`} />
                    <Row label="Finish" value={order.finishName} />
                    {pricing.painting && <Row label="Painting" value={pricing.painting.tier_name} />}
                    {order.paintExtras.length > 0 && (
                      <Row
                        label="Paint extras"
                        value={order.paintExtras.map(pe => `${pe.colorName} ×${pe.quantity}`).join(', ')}
                      />
                    )}
                  </div>
                </div>

                {/* Pricing breakdown */}
                <div className="border-4 border-[#1a4073] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#1a4073]">
                  <div className="bg-[#1a4073] px-4 py-2">
                    <p className="font-black text-white text-sm">Price Breakdown</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <PriceRow label={`Size (${pricing.size.size_mm}mm)`} amount={pricing.size.price} sale={pricing.size.is_on_sale} />
                    <PriceRow label={pricing.finish.name} amount={pricing.finish.price} sale={pricing.finish.is_on_sale} />
                    {pricing.painting && (
                      <PriceRow label={`Painting — ${pricing.painting.tier_name}`} amount={pricing.painting.price} />
                    )}
                    {pricing.extras.map((ex, i) => (
                      <PriceRow key={i} label={`${ex.color_name} ×${ex.quantity}`} amount={ex.line_total} sale={ex.is_on_sale} />
                    ))}
                    <div className="border-t-2 border-dashed border-gray-200 pt-2 mt-2">
                      <PriceRow label="Subtotal" amount={pricing.subtotal_before_discount} />
                    </div>
                    {pricing.discount_amount > 0 && (
                      <PriceRow
                        label={`${pricing.membership_tier ? pricing.membership_tier.charAt(0).toUpperCase() + pricing.membership_tier.slice(1) + ' ' : ''}discount (${pricing.discount_percentage}%)`}
                        amount={-pricing.discount_amount}
                        highlight="green"
                      />
                    )}
                    {pricing.delivery.qualifies_free ? (
                      <PriceRow label="Delivery" amount={0} freeLabel="FREE" highlight="green" />
                    ) : (
                      <div>
                        <PriceRow label="Delivery" amount={pricing.delivery.price} />
                        <p className="text-xs text-orange-600 font-semibold mt-1">
                          Spend {fmt(pricing.delivery.amount_to_free)} more for free delivery
                        </p>
                      </div>
                    )}
                    <div className="border-t-4 border-[#1a4073] pt-3 mt-2 flex justify-between items-center">
                      <span className="font-black text-[#0c2a50] text-lg">Total</span>
                      <span className="font-black text-[#ff7b00] text-2xl">{fmt(pricing.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Free delivery notice if not qualified */}
                {!pricing.delivery.qualifies_free && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 text-sm font-semibold text-amber-800">
                    Add {fmt(pricing.delivery.amount_to_free)} more to qualify for free delivery!
                  </div>
                )}

                {/* Approval notice */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 text-sm font-semibold text-blue-800">
                  <strong>What happens next?</strong> Your order will be reviewed before production begins. You'll be contacted if your image needs updating.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const inputClass = 'w-full px-4 py-3 rounded-xl border-2 border-gray-300 text-[#0c2a50] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-semibold';

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-black text-[#1a4073] flex items-center gap-2">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-gray-500 font-semibold">{label}</span>
      <span className="font-bold text-[#0c2a50] text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function PriceRow({
  label, amount, sale, freeLabel, highlight,
}: {
  label: string;
  amount: number;
  sale?: boolean;
  freeLabel?: string;
  highlight?: 'green';
}) {
  return (
    <div className="flex justify-between text-sm items-center">
      <span className={cn('font-semibold', sale ? 'text-red-500' : 'text-gray-600')}>{label}</span>
      <span className={cn(
        'font-black',
        highlight === 'green' ? 'text-green-600' : sale ? 'text-red-500' : 'text-[#0c2a50]'
      )}>
        {freeLabel ?? (amount < 0 ? `-${fmt(Math.abs(amount))}` : fmt(amount))}
      </span>
    </div>
  );
}
