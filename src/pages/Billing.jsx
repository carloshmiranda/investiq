import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import { PLANS } from '../../lib/plans.js';

export default function Billing() {
  const { authAxios, user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setToast({ type: 'ok', text: 'Welcome to Pro! Your subscription is now active.' });
      updateUser({ plan: 'pro' });
    }
    if (searchParams.get('canceled') === 'true') {
      setToast({ type: 'info', text: 'Checkout canceled. No charges were made.' });
    }
  }, [searchParams]);

  useEffect(() => {
    authAxios.get('/api/billing/status')
      .then(({ data }) => setStatus(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authAxios]);

  async function handleUpgrade() {
    setCheckoutLoading(true);
    try {
      const { data } = await authAxios.post('/api/billing/checkout');
      window.location.href = data.url;
    } catch (err) {
      setToast({ type: 'err', text: err.response?.data?.error || 'Failed to start checkout.' });
      setCheckoutLoading(false);
    }
  }

  async function handleManage() {
    try {
      const { data } = await authAxios.post('/api/billing/portal');
      window.location.href = data.url;
    } catch (err) {
      setToast({ type: 'err', text: err.response?.data?.error || 'Failed to open billing portal.' });
    }
  }

  const isPro = status?.plan === 'pro' || user?.plan === 'pro';
  const quota = status?.aiQuota;

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" subtitle="Manage your plan and subscription" />

      {/* Toast */}
      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm border card-reveal ${
          toast.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : toast.type === 'err' ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-[#7C5CFC]/10 border-[#7C5CFC]/20 text-[#a78bfa]'
        }`}>
          {toast.text}
          <button onClick={() => setToast(null)} className="float-right text-white/40 hover:text-white ml-3">&times;</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 card-reveal" style={{ animationDelay: '0.08s' }}>
        {/* Current plan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free tier */}
            <div className={`glass-card rounded-xl p-6 border transition-all ${
              !isPro ? 'border-[#7C5CFC]/30 ring-1 ring-[#7C5CFC]/20' : 'border-white/5'
            }`}>
              {!isPro && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#a78bfa] mb-3 inline-block">
                  CURRENT
                </span>
              )}
              <h3 className="text-lg font-bold text-white font-display">Free</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-white font-display">$0</span>
                <span className="text-sm text-gray-500 ml-1">/month</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-400">
                <PlanFeature text="Dashboard, Holdings, Income, Calendar" included />
                <PlanFeature text="All broker connections" included />
                <PlanFeature text="DRIP Simulator" included />
                <PlanFeature text="Multi-currency" included />
                <PlanFeature text={`${PLANS.free.aiQueriesPerMonth} AI queries/month`} included />
                <PlanFeature text="CSV export" />
                <PlanFeature text="Auto sync (daily)" />
                <PlanFeature text="Full income history" />
              </ul>
            </div>

            {/* Pro tier */}
            <div className={`glass-card rounded-xl p-6 border transition-all ${
              isPro ? 'border-[#7C5CFC]/30 ring-1 ring-[#7C5CFC]/20' : 'border-white/5'
            }`}>
              {isPro && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#a78bfa] mb-3 inline-block">
                  CURRENT
                </span>
              )}
              <h3 className="text-lg font-bold text-white font-display">Pro</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-white font-display">${PLANS.pro.price.monthly}</span>
                <span className="text-sm text-gray-500 ml-1">/month</span>
                <span className="text-[10px] text-gray-600 ml-2">(${PLANS.pro.price.yearly}/yr)</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-400">
                <PlanFeature text="Everything in Free" included />
                <PlanFeature text="Unlimited AI queries" included />
                <PlanFeature text="CSV export" included />
                <PlanFeature text="Auto sync (daily)" included />
                <PlanFeature text="Full income history" included />
                <PlanFeature text="Priority support" included />
              </ul>
              <div className="mt-5">
                {isPro ? (
                  <button
                    onClick={handleManage}
                    className="w-full text-xs font-medium text-white/60 hover:text-white px-4 py-2.5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                  >
                    Manage Subscription
                  </button>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={checkoutLoading}
                    className="w-full text-xs font-medium text-white bg-[#7C5CFC] hover:bg-[#6B4FE0] px-4 py-2.5 rounded-lg transition-all shadow-[0_0_20px_rgba(124,92,252,0.2)] hover:shadow-[0_0_30px_rgba(124,92,252,0.35)] disabled:opacity-50"
                  >
                    {checkoutLoading ? 'Redirecting...' : 'Upgrade to Pro'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Subscription details (Pro only) */}
          {isPro && status && (
            <div className="glass-card rounded-xl p-5 border border-white/5">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Subscription</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Status</p>
                  <p className={`font-medium ${
                    status.subStatus === 'active' ? 'text-emerald-400'
                    : status.subStatus === 'past_due' ? 'text-amber-400'
                    : 'text-gray-400'
                  }`}>
                    {status.subStatus === 'active' ? 'Active' : status.subStatus === 'past_due' ? 'Past due' : status.subStatus || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Next billing</p>
                  <p className="text-white font-data text-xs">
                    {status.currentPeriodEnd ? new Date(status.currentPeriodEnd).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel — usage meter */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5 border border-white/5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">AI Usage This Month</h4>
            {loading ? (
              <div className="h-20 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#7C5CFC]/30 border-t-[#7C5CFC] rounded-full animate-spin" />
              </div>
            ) : quota ? (
              <div>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-bold text-white font-display">{quota.used}</span>
                  <span className="text-xs text-gray-500 font-data">/ {isPro ? '∞' : quota.limit}</span>
                </div>
                {!isPro && (
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        quota.remaining <= 0 ? 'bg-red-500' : quota.remaining <= 2 ? 'bg-amber-500' : 'bg-[#7C5CFC]'
                      }`}
                      style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }}
                    />
                  </div>
                )}
                <p className="text-[10px] text-gray-500 mt-2">
                  {isPro
                    ? `${quota.used} queries used this month`
                    : `${quota.remaining} queries remaining`
                  }
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Unable to load usage data.</p>
            )}
          </div>

          {/* FAQ */}
          <div className="glass-card rounded-xl p-5 border border-white/5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">FAQ</h4>
            <div className="space-y-3">
              <FaqItem q="Can I cancel anytime?" a="Yes — cancel from the Manage Subscription button. You keep Pro until the end of the billing period." />
              <FaqItem q="What happens to my data if I downgrade?" a="All your portfolio data stays intact. You'll just lose access to AI unlimited queries, CSV export, and auto sync." />
              <FaqItem q="Is my payment secure?" a="All payments are processed by Stripe. We never store your card details." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanFeature({ text, included }) {
  return (
    <li className="flex items-center gap-2">
      {included ? (
        <svg className="w-3.5 h-3.5 text-[#7C5CFC] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className={included ? 'text-gray-300' : 'text-gray-600'}>{text}</span>
    </li>
  );
}

function FaqItem({ q, a }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-white">{q}</p>
      <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{a}</p>
    </div>
  );
}
