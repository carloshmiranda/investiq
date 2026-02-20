import { useState } from 'react';
import { connections } from '../data/mockPortfolio';
import { useCurrency } from '../context/CurrencyContext';
import { useDegiro } from '../context/DegiroContext';
import { useTrading212 } from '../context/Trading212Context';
import { DegiroError } from '../services/degiro/auth';
import { timeAgo } from '../utils/formatters';

// ── Type config ───────────────────────────────────────────────────────────────
const typeConfig = {
  broker: { label: 'Broker', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  exchange: { label: 'Exchange', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  wallet: { label: 'Wallet', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  hardware: { label: 'Hardware', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  aggregator: { label: 'Aggregator', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

const brandColors = {
  ibkr: '#d4380d', alpaca: '#ffbc39', coinbase: '#0052ff', binance: '#f0b90b',
  metamask: '#e2761b', ledger: '#142533', phantom: '#ab9ff2', plaid: '#00d64f',
  degiro: '#ff6600',
};

// ── DeGiro modal ──────────────────────────────────────────────────────────────
function DegiroModal({ onClose }) {
  const { connect, connectTOTP, syncing, connected, intAccount, username, positionCount } = useDegiro();
  const [username_, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [step, setStep] = useState('credentials'); // 'credentials' | 'totp' | 'syncing' | 'done'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  // Temporary store pending creds for TOTP step
  const [pendingCreds, setPendingCreds] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await connect(username_, password);
      if (result.requiresTOTP) {
        setPendingCreds({ username: username_, password });
        setStep('totp');
      } else if (result.success) {
        setStep('done');
      }
    } catch (err) {
      if (err instanceof DegiroError) {
        if (err.isMaintenance) {
          setError('DeGiro is under maintenance. Try again later (Sunday nights are common).');
        } else if (err.isSessionExpired) {
          setError('Session expired. Please try logging in again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Connection failed. Check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await connectTOTP(pendingCreds.username, pendingCreds.password, totp);
      if (result.success) setStep('done');
    } catch (err) {
      setError(err instanceof DegiroError ? err.message : 'TOTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: '#ff660022', border: '1px solid #ff660044', color: '#ff6600' }}>
              DG
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Connect DeGiro</h3>
              <p className="text-[10px] text-gray-500">European broker integration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Step: credentials ── */}
        {step === 'credentials' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300">
              <span className="font-semibold">Read-only access.</span>{' '}
              Your credentials are sent directly to DeGiro's servers and never stored by InvestIQ.
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">DeGiro Username / Email</label>
              <input
                type="text"
                value={username_}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                required
                className="w-full px-3 py-2.5 bg-[#1f2937] border border-white/10 rounded-lg text-sm text-white
                  placeholder-gray-600 focus:outline-none focus:border-[#ff6600]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full px-3 py-2.5 bg-[#1f2937] border border-white/10 rounded-lg text-sm text-white
                  placeholder-gray-600 focus:outline-none focus:border-[#ff6600]/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !username_ || !password}
              className="w-full py-2.5 font-semibold rounded-lg transition-colors text-sm text-white
                bg-[#ff6600] hover:bg-[#e05a00] disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connecting…
                </>
              ) : 'Connect Securely'}
            </button>
          </form>
        )}

        {/* ── Step: TOTP ── */}
        {step === 'totp' && (
          <form onSubmit={handleTOTP} className="space-y-4">
            <div className="text-center py-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white">Two-Factor Authentication</p>
              <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code from your authenticator app</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">TOTP Code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                required
                className="w-full px-3 py-2.5 bg-[#1f2937] border border-white/10 rounded-lg text-xl text-white
                  text-center font-mono tracking-widest placeholder-gray-700
                  focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || totp.length !== 6}
              className="w-full py-2.5 font-semibold rounded-lg transition-colors text-sm text-white
                bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying…
                </>
              ) : 'Verify & Connect'}
            </button>
            <button type="button" onClick={() => setStep('credentials')}
              className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors">
              ← Back to login
            </button>
          </form>
        )}

        {/* ── Step: syncing ── */}
        {(step === 'done' || syncing) && (
          <div className="text-center py-6 space-y-3">
            {syncing ? (
              <>
                <div className="w-14 h-14 rounded-full bg-[#ff6600]/20 flex items-center justify-center mx-auto">
                  <svg className="animate-spin w-7 h-7 text-[#ff6600]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-white font-semibold">Syncing your DeGiro portfolio…</p>
                <p className="text-xs text-gray-500">Fetching positions and dividend history</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-emerald-400 font-semibold">DeGiro Connected!</p>
                {username && <p className="text-sm text-gray-300">{username}</p>}
                {intAccount && (
                  <p className="text-xs text-gray-500">Account #{intAccount} · {positionCount} positions found</p>
                )}
                <button
                  onClick={onClose}
                  className="mt-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  View Portfolio
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── API Key modal (for exchanges) ─────────────────────────────────────────────
function APIKeyModal({ name, onClose, onConnect }) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`[InvestIQ] Connecting ${name}:`, { apiKey });
    setDone(true);
    setTimeout(() => { onConnect(); onClose(); }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Connect {name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-semibold">Connected!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-400">Read-only API credentials for {name}. We never trade on your behalf.</p>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">API Key</label>
              <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter API key…"
                className="w-full px-3 py-2.5 bg-[#1f2937] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 font-mono" required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">API Secret</label>
              <input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} placeholder="Enter API secret…"
                className="w-full px-3 py-2.5 bg-[#1f2937] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 font-mono" required />
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-[11px] text-amber-400">Enable read-only API permissions only.</p>
            </div>
            <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors text-sm">
              Connect Securely
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Wallet modal ──────────────────────────────────────────────────────────────
function WalletModal({ name, onClose, onConnect }) {
  const [address, setAddress] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`[InvestIQ] Connecting wallet ${name}:`, { address });
    setDone(true);
    setTimeout(() => { onConnect(); onClose(); }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Connect {name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-semibold">Wallet Tracked!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-400">Enter your wallet address for read-only balance tracking. We never request private keys.</p>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Wallet Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x… or SOL address"
                className="w-full px-3 py-2.5 bg-[#1f2937] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 font-mono" required />
            </div>
            <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors text-sm">
              Track Wallet
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── DeGiro card ───────────────────────────────────────────────────────────────
function DegiroCard({ onOpenModal }) {
  const { connected, username, intAccount, positionCount, lastSync, syncing, sync, disconnect, error } = useDegiro();
  const brand = '#ff6600';

  return (
    <div className={`glass-card rounded-xl p-5 border transition-all ${connected ? 'border-[#ff6600]/20' : 'border-white/5'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
            style={{ background: brand + '22', border: `1px solid ${brand}44`, color: brand }}>
            DG
          </div>
          <div>
            <p className="text-sm font-semibold text-white">DeGiro</p>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Broker
            </span>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full mt-1 ${connected ? 'bg-emerald-400' : 'bg-gray-600'}`} />
      </div>

      {connected ? (
        <div className="mb-4 space-y-1.5">
          {username && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Account</span>
              <span className="text-white truncate max-w-[140px]">{username}</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Int. Account</span>
            <span className="text-white font-mono">{intAccount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Positions</span>
            <span className="text-emerald-400 font-semibold">{positionCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Last sync</span>
            <span className="text-gray-400">{lastSync ? timeAgo(lastSync) : '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Status</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {syncing ? 'Syncing…' : 'Active'}
            </span>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 py-3 text-center">
          <p className="text-xs text-gray-600">Not connected</p>
          <p className="text-[10px] text-gray-700 mt-0.5">European broker — unofficial API</p>
        </div>
      )}

      {connected ? (
        <div className="flex gap-2">
          <button
            onClick={sync}
            disabled={syncing}
            className="flex-1 py-1.5 text-xs text-gray-400 border border-white/10 rounded-lg hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
          <button
            onClick={disconnect}
            className="px-2.5 py-1.5 text-xs text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={onOpenModal}
          className="w-full py-2 text-xs font-semibold text-white rounded-lg transition-colors"
          style={{ background: brand }}
        >
          Connect DeGiro
        </button>
      )}
    </div>
  );
}

// ── Trading 212 modal ─────────────────────────────────────────────────────────
function Trading212Modal({ onClose }) {
  const { connect, syncing, connected, positionCount, account } = useTrading212();
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [step, setStep] = useState('credentials'); // 'credentials' | 'syncing' | 'done'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConnect = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await connect(apiKey, apiSecret);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: '#1a56db22', border: '1px solid #1a56db44', color: '#1a56db' }}>
              T2
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Connect Trading 212</h3>
              <p className="text-[10px] text-gray-500">Official API integration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'credentials' && (
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300">
              <span className="font-semibold">Read-only API.</span>{' '}
              Generate keys from Trading 212 → Settings → API (Beta). Enable read-only permissions only.
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">API Key</label>
              <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key…" required
                className="w-full px-3 py-2.5 bg-[#1f2937] border border-white/10 rounded-lg text-sm text-white
                  placeholder-gray-600 focus:outline-none focus:border-[#1a56db]/50 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">API Secret</label>
              <input type="password" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your API secret…" required
                className="w-full px-3 py-2.5 bg-[#1f2937] border border-white/10 rounded-lg text-sm text-white
                  placeholder-gray-600 focus:outline-none focus:border-[#1a56db]/50 font-mono" />
            </div>

            <button type="submit" disabled={loading || !apiKey || !apiSecret}
              className="w-full py-2.5 font-semibold rounded-lg transition-colors text-sm text-white
                bg-[#1a56db] hover:bg-[#1649c0] disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Validating…
                </>
              ) : 'Connect Securely'}
            </button>
          </form>
        )}

        {(step === 'done' || syncing) && (
          <div className="text-center py-6 space-y-3">
            {syncing ? (
              <>
                <div className="w-14 h-14 rounded-full bg-[#1a56db]/20 flex items-center justify-center mx-auto">
                  <svg className="animate-spin w-7 h-7 text-[#1a56db]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-white font-semibold">Syncing your Trading 212 portfolio…</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-emerald-400 font-semibold">Trading 212 Connected!</p>
                {account && <p className="text-xs text-gray-500">{positionCount} positions found</p>}
                <button onClick={onClose}
                  className="mt-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors">
                  View Portfolio
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Trading 212 card ──────────────────────────────────────────────────────────
function Trading212Card({ onOpenModal }) {
  const { connected, positionCount, lastSync, syncing, sync, disconnect, error, account } = useTrading212();
  const { formatMoney } = useCurrency();
  const brand = '#1a56db';

  return (
    <div className={`glass-card rounded-xl p-5 border transition-all ${connected ? 'border-[#1a56db]/20' : 'border-white/5'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
            style={{ background: brand + '22', border: `1px solid ${brand}44`, color: brand }}>
            T2
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Trading 212</p>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Broker
            </span>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full mt-1 ${connected ? 'bg-emerald-400' : 'bg-gray-600'}`} />
      </div>

      {connected ? (
        <div className="mb-4 space-y-1.5">
          {account && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Portfolio</span>
              <span className="text-emerald-400 font-semibold">{formatMoney(account.totalValue, 0)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Positions</span>
            <span className="text-emerald-400 font-semibold">{positionCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Last sync</span>
            <span className="text-gray-400">{lastSync ? timeAgo(lastSync) : '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Status</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {syncing ? 'Syncing…' : 'Active'}
            </span>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400">{error}</div>
          )}
        </div>
      ) : (
        <div className="mb-4 py-3 text-center">
          <p className="text-xs text-gray-600">Not connected</p>
          <p className="text-[10px] text-gray-700 mt-0.5">Official API — read-only access</p>
        </div>
      )}

      {connected ? (
        <div className="flex gap-2">
          <button onClick={sync} disabled={syncing}
            className="flex-1 py-1.5 text-xs text-gray-400 border border-white/10 rounded-lg hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40">
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
          <button onClick={disconnect}
            className="px-2.5 py-1.5 text-xs text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors">
            Disconnect
          </button>
        </div>
      ) : (
        <button onClick={onOpenModal}
          className="w-full py-2 text-xs font-semibold text-white rounded-lg transition-colors"
          style={{ background: brand }}>
          Connect Trading 212
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Connections() {
  const { formatMoney } = useCurrency();
  const { connected: degiroConnected, positionCount } = useDegiro();
  const { connected: t212Connected, positionCount: t212PositionCount } = useTrading212();
  const [conns, setConns] = useState(connections);
  const [modal, setModal] = useState(null);
  const [showDegiroModal, setShowDegiroModal] = useState(false);
  const [showT212Modal, setShowT212Modal] = useState(false);

  const toggleConnection = (id) => {
    setConns((prev) => prev.map((c) => c.id === id ? { ...c, connected: !c.connected } : c));
  };

  const openModal = (conn) => {
    const modalType = ['wallet', 'hardware'].includes(conn.type) ? 'wallet' : 'api';
    if (conn.type === 'broker' && conn.id !== 'plaid') {
      console.log(`[InvestIQ] Initiating OAuth for ${conn.name}`);
      setTimeout(() => toggleConnection(conn.id), 800);
      return;
    }
    setModal({ id: conn.id, name: conn.name, modalType });
  };

  const handleConnect = (id) => {
    setConns((prev) => prev.map((c) =>
      c.id === id ? { ...c, connected: true, accounts: 1, totalValue: Math.round(Math.random() * 50000) + 10000 } : c
    ));
  };

  const connectedMock = conns.filter((c) => c.connected);
  const totalConnectedValue = connectedMock.reduce((s, c) => s + c.totalValue, 0);
  const liveSourceCount = (degiroConnected ? 1 : 0) + (t212Connected ? 1 : 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Connections</h1>
        <p className="text-gray-500 text-sm mt-0.5">Link your brokers, exchanges, and wallets</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500">Connected Sources</p>
          <p className="text-2xl font-bold text-emerald-400">
            {connectedMock.length + liveSourceCount}
          </p>
          <p className="text-xs text-gray-500">of {conns.length + 2} available</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Tracked Value</p>
          <p className="text-2xl font-bold text-white">{formatMoney(totalConnectedValue, 0)}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500">DeGiro Positions</p>
          <p className="text-2xl font-bold text-[#ff6600]">
            {degiroConnected ? positionCount : '—'}
          </p>
          <p className="text-xs text-gray-500">{degiroConnected ? 'live positions' : 'Not connected'}</p>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Real integrations first */}
        <DegiroCard onOpenModal={() => setShowDegiroModal(true)} />
        <Trading212Card onOpenModal={() => setShowT212Modal(true)} />

        {conns.map((conn) => {
          const tc = typeConfig[conn.type] ?? typeConfig.broker;
          const brand = brandColors[conn.id] ?? '#6b7280';
          return (
            <div key={conn.id} className={`glass-card rounded-xl p-5 border transition-all ${conn.connected ? 'border-emerald-500/20' : 'border-white/5'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white"
                    style={{ background: brand + '22', border: `1px solid ${brand}44`, color: brand }}>
                    {conn.logo}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{conn.name}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tc.bg} ${tc.color} border ${tc.border}`}>
                      {tc.label}
                    </span>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full mt-1 ${conn.connected ? 'bg-emerald-400' : 'bg-gray-600'}`} />
              </div>

              {conn.connected ? (
                <div className="mb-4 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Accounts</span>
                    <span className="text-white">{conn.accounts}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Portfolio</span>
                    <span className="text-emerald-400 font-semibold">{formatMoney(conn.totalValue, 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Status</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />Active
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 py-3 text-center">
                  <p className="text-xs text-gray-600">Not connected</p>
                </div>
              )}

              {conn.connected ? (
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 text-xs text-gray-400 border border-white/10 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
                    Sync Now
                  </button>
                  <button onClick={() => toggleConnection(conn.id)}
                    className="px-2.5 py-1.5 text-xs text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors">
                    Disconnect
                  </button>
                </div>
              ) : (
                <button onClick={() => openModal(conn)}
                  className="w-full py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors">
                  {conn.type === 'broker' && conn.id !== 'plaid' ? 'Connect via OAuth' :
                    conn.type === 'aggregator' ? 'Connect via Plaid' :
                      ['wallet', 'hardware'].includes(conn.type) ? 'Add Wallet Address' :
                        'Connect with API Key'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Security notice */}
      <div className="glass-card rounded-xl p-4 border border-amber-500/10">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-400 mb-1">Read-Only Security</p>
            <p className="text-xs text-gray-400">
              InvestIQ requests read-only access only. DeGiro credentials are proxied server-side and never stored.
              API keys for exchanges use read-only scopes. Wallet addresses are public — no private keys ever needed.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDegiroModal && <DegiroModal onClose={() => setShowDegiroModal(false)} />}
      {showT212Modal && <Trading212Modal onClose={() => setShowT212Modal(false)} />}
      {modal?.modalType === 'api' && (
        <APIKeyModal name={modal.name} onClose={() => setModal(null)} onConnect={() => handleConnect(modal.id)} />
      )}
      {modal?.modalType === 'wallet' && (
        <WalletModal name={modal.name} onClose={() => setModal(null)} onConnect={() => handleConnect(modal.id)} />
      )}
    </div>
  );
}
