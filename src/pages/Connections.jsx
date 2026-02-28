import { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import PageHeader from '../components/PageHeader';
import { useDegiro } from '../context/DegiroContext';
import { useTrading212 } from '../context/Trading212Context';
import { useBinance } from '../context/BinanceContext';
import { useCryptocom } from '../context/CryptocomContext';
import { useDebugContext } from '../context/DebugContext';
import { useAuth } from '../context/AuthContext';
import { DegiroError } from '../services/degiro/auth';
import { timeAgo } from '../utils/formatters';

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════

const Spinner = ({ className = 'w-4 h-4' }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const CheckIcon = ({ className = 'w-7 h-7' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CloseButton = ({ onClick }) => (
  <button onClick={onClick} className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-white/10">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);

function StatusBadge({ connected }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
      connected
        ? 'bg-[#7C5CFC]/10 text-[#a78bfa] border border-[#7C5CFC]/20'
        : 'bg-white/[0.03] text-gray-600 border border-white/5'
    }`}>
      <span className={`relative w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#7C5CFC] status-ping' : 'bg-gray-700'}`} />
      {connected ? 'Live' : 'Off'}
    </div>
  );
}

function BrandIcon({ label, color, bg }) {
  return (
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black tracking-tight transition-transform group-hover:scale-105"
      style={{ background: bg || color + '18', border: `1px solid ${color}30`, color }}
    >
      {label}
    </div>
  );
}

function DataRow({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div className="p-2.5 bg-red-500/[0.06] border border-red-500/15 rounded-lg text-[11px] text-red-400 leading-relaxed">
      {error}
    </div>
  );
}

// ── Test connection ──────────────────────────────────────────────────────────

function useTestConnection() {
  const { authAxios } = useAuth();
  const debug = useDebugContext();
  const [testing, setTesting] = useState({});
  const [results, setResults] = useState({});

  const test = async (provider) => {
    setTesting((p) => ({ ...p, [provider]: true }));
    setResults((p) => ({ ...p, [provider]: null }));
    const start = Date.now();
    try {
      const { data } = await authAxios.get(`/api/${provider}/test`);
      const result = { ...data, latency: data.latency || (Date.now() - start) };
      setResults((p) => ({ ...p, [provider]: result }));
      debug?.log(provider, 'test', { status: result.reachable ? 'ok' : 'error', latency: result.latency, error: result.error });
      return result;
    } catch (err) {
      const result = { reachable: false, error: err.message, latency: Date.now() - start };
      setResults((p) => ({ ...p, [provider]: result }));
      debug?.log(provider, 'test', { status: 'error', latency: result.latency, error: err.message });
      return result;
    } finally {
      setTesting((p) => ({ ...p, [provider]: false }));
    }
  };

  return { test, testing, results };
}

function TestButton({ provider, testing, result, onTest }) {
  return (
    <div className="mt-2.5">
      <button
        onClick={() => onTest(provider)}
        disabled={testing}
        className="w-full py-1.5 text-[10px] font-medium text-gray-500 border border-white/[0.06] rounded-lg hover:text-cyan-400 hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 focus:outline-none"
      >
        {testing ? (
          <><Spinner className="w-3 h-3" /> Testing…</>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Test Connection
          </>
        )}
      </button>
      {result && (
        <div className={`mt-1.5 px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1.5 ${
          result.reachable
            ? 'bg-[#7C5CFC]/[0.06] border border-[#7C5CFC]/15 text-[#a78bfa]'
            : 'bg-red-500/[0.06] border border-red-500/15 text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${result.reachable ? 'bg-[#7C5CFC]' : 'bg-red-400'}`} />
          {result.reachable ? `Reachable — ${result.latency}ms` : (result.error || 'Unreachable')}
        </div>
      )}
    </div>
  );
}

// ── Type config ──────────────────────────────────────────────────────────────

const typeConfig = {
  broker:     { label: 'Broker',     color: 'text-[#a78bfa]', bg: 'bg-[#7C5CFC]/10', border: 'border-[#7C5CFC]/20' },
  exchange:   { label: 'Exchange',   color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
  wallet:     { label: 'Wallet',     color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
  hardware:   { label: 'Hardware',   color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  aggregator: { label: 'Aggregator', color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
};

const brandColors = {
  ibkr: '#d4380d', alpaca: '#ffbc39', coinbase: '#0052ff', binance: '#f0b90b',
  metamask: '#e2761b', ledger: '#142533', phantom: '#ab9ff2', plaid: '#00d64f',
  degiro: '#ff6600',
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL — shared wrapper
// ═══════════════════════════════════════════════════════════════════════════════

function ModalShell({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div className="modal-glass rounded-2xl p-6 w-full max-w-md card-reveal">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ icon, iconColor, title, subtitle, onClose }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <BrandIcon label={icon} color={iconColor} />
        <div>
          <h3 className="text-base font-bold text-white leading-tight">{title}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <CloseButton onClick={onClose} />
    </div>
  );
}

function ModalSuccess({ message, detail, brandColor, syncing, onClose }) {
  return (
    <div className="text-center py-8 space-y-3">
      {syncing ? (
        <>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{ background: brandColor + '20' }}>
            <Spinner className="w-7 h-7" style={{ color: brandColor }} />
          </div>
          <p className="text-white font-semibold">{message}</p>
          <p className="text-xs text-gray-500">Fetching positions and dividend history</p>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full bg-[#7C5CFC]/15 flex items-center justify-center mx-auto border border-[#7C5CFC]/20">
            <CheckIcon className="w-7 h-7 text-[#a78bfa]" />
          </div>
          <p className="text-[#a78bfa] font-semibold text-lg">{message}</p>
          {detail && <p className="text-xs text-gray-500">{detail}</p>}
          <button onClick={onClose}
            className="mt-3 px-8 py-2.5 bg-[#7C5CFC] hover:bg-[#6B4FE0] text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-[#7C5CFC]/20">
            View Portfolio
          </button>
        </>
      )}
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, className = '', ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white
          placeholder-gray-700 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all ${className}`}
        {...props}
      />
    </div>
  );
}

function SubmitButton({ loading, disabled, label, loadingLabel, color = '#10b981', textColor = 'text-white' }) {
  return (
    <button type="submit" disabled={loading || disabled}
      className={`w-full py-2.5 font-semibold rounded-xl transition-all text-sm ${textColor}
        disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2
        hover:brightness-110 active:scale-[0.98]`}
      style={{ background: color }}
    >
      {loading ? <><Spinner className="w-4 h-4" /> {loadingLabel}</> : label}
    </button>
  );
}

function InfoBanner({ children, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-500/[0.05] border-blue-500/15 text-blue-300',
    amber: 'bg-amber-500/[0.05] border-amber-500/15 text-amber-400',
  };
  return (
    <div className={`p-3 rounded-xl border text-xs leading-relaxed ${colors[color]}`}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEGIRO MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function DegiroModal({ onClose }) {
  const { connect, connectTOTP, connectManual, syncing, connected, intAccount, username, positionCount } = useDegiro();
  const [username_, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [manualSessionId, setManualSessionId] = useState('');
  const [step, setStep] = useState('credentials');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wafBlocked, setWafBlocked] = useState(false);
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
        if (err.code === 'WAF_BLOCKED') {
          setWafBlocked(true);
          setError('DeGiro is blocking automated connections from our servers.');
        } else if (err.isMaintenance) {
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
      if (err instanceof DegiroError && err.code === 'WAF_BLOCKED') {
        setWafBlocked(true);
        setError('DeGiro is blocking automated connections from our servers.');
      } else {
        setError(err instanceof DegiroError ? err.message : 'TOTP verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSession = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await connectManual(manualSessionId.trim());
      if (result.success) setStep('done');
    } catch (err) {
      setError(err instanceof DegiroError ? err.message : 'Failed to connect with session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader icon="DG" iconColor="#ff6600" title="Connect DeGiro" subtitle="European broker integration" onClose={onClose} />

      {step === 'credentials' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <InfoBanner>
            <span className="font-semibold">Read-only access.</span>{' '}
            Your credentials are sent directly to DeGiro's servers and never stored by Flolio.
          </InfoBanner>

          <ErrorBanner error={error} />

          {wafBlocked && (
            <button type="button" onClick={() => { setStep('manual'); setError(null); }}
              className="w-full p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-left hover:bg-amber-500/10 transition-colors">
              <p className="text-xs font-semibold text-amber-400 mb-1">Use Manual Session Instead</p>
              <p className="text-[11px] text-amber-400/70">
                Log into DeGiro in your browser and paste your session token. This always works.
              </p>
            </button>
          )}

          <InputField label="DeGiro Username / Email" value={username_}
            onChange={(e) => setUsername(e.target.value)} placeholder="you@example.com"
            autoComplete="username" required />
          <InputField label="Password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
            autoComplete="current-password" required />

          <SubmitButton loading={loading} disabled={!username_ || !password}
            label="Connect Securely" loadingLabel="Connecting…" color="#ff6600" />
        </form>
      )}

      {step === 'totp' && (
        <form onSubmit={handleTOTP} className="space-y-4">
          <div className="text-center py-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white">Two-Factor Authentication</p>
            <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code from your authenticator app</p>
          </div>

          <ErrorBanner error={error} />

          <InputField label="TOTP Code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
            value={totp} onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
            placeholder="000000" autoFocus required
            className="text-xl text-center font-mono tracking-[0.3em]" />

          <SubmitButton loading={loading} disabled={totp.length !== 6}
            label="Verify & Connect" loadingLabel="Verifying…" color="#f59e0b" />
          <button type="button" onClick={() => setStep('credentials')}
            className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors py-1">
            ← Back to login
          </button>
        </form>
      )}

      {step === 'manual' && (
        <form onSubmit={handleManualSession} className="space-y-4">
          <InfoBanner color="amber">
            <p className="font-semibold mb-2">How to get your session token:</p>
            <ol className="list-decimal list-inside space-y-1 opacity-80">
              <li>Open <span className="font-mono">trader.degiro.nl</span> in a new tab</li>
              <li>Log in with your DeGiro credentials normally</li>
              <li>Press <span className="font-mono">F12</span> to open DevTools</li>
              <li>Go to <span className="font-mono">Application</span> → <span className="font-mono">Cookies</span> → <span className="font-mono">trader.degiro.nl</span></li>
              <li>Copy the value of <span className="font-mono">JSESSIONID</span></li>
              <li>Paste it below</li>
            </ol>
          </InfoBanner>

          <ErrorBanner error={error} />

          <InputField label="JSESSIONID" value={manualSessionId}
            onChange={(e) => setManualSessionId(e.target.value)}
            placeholder="Paste your JSESSIONID here…" autoFocus required className="font-mono" />

          <InfoBanner>
            Your session is sent securely to our server, validated with DeGiro, and stored encrypted. Sessions typically last 24 hours.
          </InfoBanner>

          <SubmitButton loading={loading} disabled={!manualSessionId.trim()}
            label="Connect with Session" loadingLabel="Validating Session…" color="#f59e0b" />
          <button type="button" onClick={() => { setStep('credentials'); setError(null); }}
            className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors py-1">
            ← Back to login
          </button>
        </form>
      )}

      {(step === 'done' || syncing) && (
        <ModalSuccess
          syncing={syncing}
          brandColor="#ff6600"
          message={syncing ? 'Syncing your DeGiro portfolio…' : 'DeGiro Connected!'}
          detail={connected && !syncing ? `${username || ''} · Account #${intAccount || '—'} · ${positionCount} positions` : null}
          onClose={onClose}
        />
      )}
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRADING 212 MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function Trading212Modal({ onClose }) {
  const { connect, syncing, connected, positionCount, account } = useTrading212();
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [step, setStep] = useState('credentials');
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
    <ModalShell onClose={onClose}>
      <ModalHeader icon="T2" iconColor="#1a56db" title="Connect Trading 212" subtitle="Official API integration" onClose={onClose} />

      {step === 'credentials' && (
        <form onSubmit={handleConnect} className="space-y-4">
          <InfoBanner>
            <span className="font-semibold">Read-only API.</span>{' '}
            Generate keys from Trading 212 → Settings → API (Beta). Enable read-only permissions only.
          </InfoBanner>

          <ErrorBanner error={error} />

          <InputField label="API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key…" required className="font-mono" />
          <InputField label="API Secret" type="password" value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Enter your API secret…" required className="font-mono" />

          <SubmitButton loading={loading} disabled={!apiKey || !apiSecret}
            label="Connect Securely" loadingLabel="Validating…" color="#1a56db" />
        </form>
      )}

      {(step === 'done' || syncing) && (
        <ModalSuccess
          syncing={syncing}
          brandColor="#1a56db"
          message={syncing ? 'Syncing your Trading 212 portfolio…' : 'Trading 212 Connected!'}
          detail={!syncing && account ? `${positionCount} positions found` : null}
          onClose={onClose}
        />
      )}
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BINANCE MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function BinanceModal({ onClose }) {
  const { connect, syncing, connected, assetCount, account } = useBinance();
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [step, setStep] = useState('credentials');
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
    <ModalShell onClose={onClose}>
      <ModalHeader icon="BN" iconColor="#f0b90b" title="Connect Binance" subtitle="Crypto exchange — direct browser connection" onClose={onClose} />

      {step === 'credentials' && (
        <form onSubmit={handleConnect} className="space-y-4">
          <InfoBanner>
            <span className="font-semibold">Read-only API.</span>{' '}
            Create keys from Binance → API Management. Enable <strong>only</strong> "Enable Reading" — disable trading and withdrawals.
          </InfoBanner>

          <ErrorBanner error={error} />

          <InputField label="API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Binance API key…" required className="font-mono" />
          <InputField label="API Secret" type="password" value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Enter your API secret…" required className="font-mono" />

          <InfoBanner color="amber">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Restrict API key to read-only. IP whitelist recommended.
            </div>
          </InfoBanner>

          <SubmitButton loading={loading} disabled={!apiKey || !apiSecret}
            label="Connect Securely" loadingLabel="Validating…" color="#f0b90b" textColor="text-black" />
        </form>
      )}

      {(step === 'done' || syncing) && (
        <ModalSuccess
          syncing={syncing}
          brandColor="#f0b90b"
          message={syncing ? 'Syncing your Binance portfolio…' : 'Binance Connected!'}
          detail={!syncing && account ? `${assetCount} assets found` : null}
          onClose={onClose}
        />
      )}
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRYPTO.COM MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function CryptocomModal({ onClose }) {
  const { connect, syncing, connected, assetCount, account } = useCryptocom();
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [step, setStep] = useState('credentials');
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
    <ModalShell onClose={onClose}>
      <ModalHeader icon="CC" iconColor="#1199fa" title="Connect Crypto.com" subtitle="Crypto exchange — signed API" onClose={onClose} />

      {step === 'credentials' && (
        <form onSubmit={handleConnect} className="space-y-4">
          <InfoBanner>
            <span className="font-semibold">Read-only API.</span>{' '}
            Create keys from Crypto.com Exchange → Settings → API Keys. Enable read-only permissions only.
          </InfoBanner>

          <ErrorBanner error={error} />

          <InputField label="API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Crypto.com API key…" required className="font-mono" />
          <InputField label="API Secret" type="password" value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Enter your API secret…" required className="font-mono" />

          <InfoBanner color="amber">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Never enable trading or withdrawals on API keys.
            </div>
          </InfoBanner>

          <SubmitButton loading={loading} disabled={!apiKey || !apiSecret}
            label="Connect Securely" loadingLabel="Validating…" color="#1199fa" />
        </form>
      )}

      {(step === 'done' || syncing) && (
        <ModalSuccess
          syncing={syncing}
          brandColor="#1199fa"
          message={syncing ? 'Syncing your Crypto.com portfolio…' : 'Crypto.com Connected!'}
          detail={!syncing && account ? `${assetCount} assets found` : null}
          onClose={onClose}
        />
      )}
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BROKER CARDS — Connected & disconnected states
// ═══════════════════════════════════════════════════════════════════════════════

function CardActions({ connected, syncing, onSync, onDisconnect, onConnect, connectLabel, brand, provider, testing, testResult, onTest }) {
  if (connected) {
    return (
      <div className="pt-3 border-t border-white/[0.04]">
        <div className="flex gap-2">
          <button onClick={onSync} disabled={syncing}
            className="flex-1 py-1.5 text-xs font-medium text-gray-400 border border-white/[0.06] rounded-lg hover:text-white hover:bg-white/[0.04] transition-all disabled:opacity-40 focus:outline-none">
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
          <button onClick={onDisconnect}
            className="px-3 py-1.5 text-xs font-medium text-red-400/70 border border-red-500/10 rounded-lg hover:text-red-400 hover:bg-red-500/[0.06] transition-all focus:outline-none">
            Disconnect
          </button>
        </div>
        <TestButton provider={provider} testing={testing} result={testResult} onTest={onTest} />
      </div>
    );
  }
  return (
    <button onClick={onConnect}
      className="w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:brightness-110 active:scale-[0.98]"
      style={{ background: brand, color: brand === '#f0b90b' ? '#000' : '#fff' }}>
      {connectLabel}
    </button>
  );
}

function DegiroCard({ onOpenModal, onTest, testing, testResult }) {
  const { connected, username, intAccount, positionCount, lastSync, syncing, sync, disconnect, error } = useDegiro();
  const brand = '#ff6600';

  return (
    <div className={`card-accent ${connected ? 'card-accent-connected' : ''} glass-card group rounded-xl p-5 transition-all hover:translate-y-[-2px]`}
      style={{ '--accent': brand }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <BrandIcon label="DG" color={brand} />
          <div>
            <p className="text-sm font-semibold text-white">DeGiro</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#7C5CFC]/10 text-[#a78bfa] border border-[#7C5CFC]/15">
              Broker
            </span>
          </div>
        </div>
        <StatusBadge connected={connected} />
      </div>

      {connected ? (
        <div className="mb-4 space-y-2">
          {username && <DataRow label="Account" value={<span className="truncate max-w-[140px] block">{username}</span>} />}
          <DataRow label="Int. Account" value={<span className="font-mono text-[11px]">{intAccount}</span>} />
          <DataRow label="Positions" value={positionCount} valueClass="text-emerald-400 font-data" />
          <DataRow label="Last sync" value={lastSync ? timeAgo(lastSync) : '—'} valueClass="text-gray-400" />
          <DataRow label="Status" value={
            <span className="flex items-center gap-1.5">
              <span className="relative w-1.5 h-1.5 bg-emerald-400 rounded-full status-ping" />
              {syncing ? 'Syncing…' : 'Active'}
            </span>
          } valueClass="text-emerald-400" />
          <ErrorBanner error={error} />
        </div>
      ) : (
        <div className="mb-4 py-4 text-center">
          <p className="text-xs text-gray-500">Not connected</p>
          <p className="text-[10px] text-gray-500 mt-0.5">European broker — unofficial API</p>
        </div>
      )}

      <CardActions connected={connected} syncing={syncing} onSync={sync} onDisconnect={disconnect}
        onConnect={() => onOpenModal()} connectLabel="Connect DeGiro" brand={brand}
        provider="degiro" testing={testing} testResult={testResult} onTest={onTest} />
    </div>
  );
}

function Trading212Card({ onOpenModal, onTest, testing, testResult }) {
  const { connected, positionCount, lastSync, syncing, sync, disconnect, error, account } = useTrading212();
  const { formatMoney } = useCurrency();
  const brand = '#1a56db';

  return (
    <div className={`card-accent ${connected ? 'card-accent-connected' : ''} glass-card group rounded-xl p-5 transition-all hover:translate-y-[-2px]`}
      style={{ '--accent': brand }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <BrandIcon label="T2" color={brand} />
          <div>
            <p className="text-sm font-semibold text-white">Trading 212</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#7C5CFC]/10 text-[#a78bfa] border border-[#7C5CFC]/15">
              Broker
            </span>
          </div>
        </div>
        <StatusBadge connected={connected} />
      </div>

      {connected ? (
        <div className="mb-4 space-y-2">
          {account && <DataRow label="Portfolio" value={Number.isFinite(account.totalValue) ? formatMoney(account.totalValue, 0) : '—'} valueClass="text-emerald-400 font-data" />}
          <DataRow label="Positions" value={positionCount} valueClass="text-emerald-400 font-data" />
          <DataRow label="Last sync" value={lastSync ? timeAgo(lastSync) : '—'} valueClass="text-gray-400" />
          <DataRow label="Status" value={
            <span className="flex items-center gap-1.5">
              <span className="relative w-1.5 h-1.5 bg-emerald-400 rounded-full status-ping" />
              {syncing ? 'Syncing…' : 'Active'}
            </span>
          } valueClass="text-emerald-400" />
          <ErrorBanner error={error} />
        </div>
      ) : (
        <div className="mb-4 py-4 text-center">
          <p className="text-xs text-gray-500">Not connected</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Official API — read-only access</p>
        </div>
      )}

      <CardActions connected={connected} syncing={syncing} onSync={sync} onDisconnect={disconnect}
        onConnect={() => onOpenModal()} connectLabel="Connect Trading 212" brand={brand}
        provider="trading212" testing={testing} testResult={testResult} onTest={onTest} />
    </div>
  );
}

function BinanceCard({ onOpenModal, onTest, testing, testResult }) {
  const { connected, assetCount, totalValue, lastSync, syncing, sync, disconnect, error } = useBinance();
  const { formatMoney } = useCurrency();
  const brand = '#f0b90b';

  return (
    <div className={`card-accent ${connected ? 'card-accent-connected' : ''} glass-card group rounded-xl p-5 transition-all hover:translate-y-[-2px]`}
      style={{ '--accent': brand }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <BrandIcon label="BN" color={brand} />
          <div>
            <p className="text-sm font-semibold text-white">Binance</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">
              Exchange
            </span>
          </div>
        </div>
        <StatusBadge connected={connected} />
      </div>

      {connected ? (
        <div className="mb-4 space-y-2">
          {totalValue > 0 && <DataRow label="Portfolio" value={formatMoney(totalValue, 0)} valueClass="text-emerald-400 font-data" />}
          <DataRow label="Assets" value={assetCount} valueClass="text-emerald-400 font-data" />
          <DataRow label="Last sync" value={lastSync ? timeAgo(lastSync) : '—'} valueClass="text-gray-400" />
          <DataRow label="Status" value={
            <span className="flex items-center gap-1.5">
              <span className="relative w-1.5 h-1.5 bg-emerald-400 rounded-full status-ping" />
              {syncing ? 'Syncing…' : 'Active'}
            </span>
          } valueClass="text-emerald-400" />
          <ErrorBanner error={error} />
        </div>
      ) : (
        <div className="mb-4 py-4 text-center">
          <p className="text-xs text-gray-500">Not connected</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Crypto exchange — browser-direct API</p>
        </div>
      )}

      <CardActions connected={connected} syncing={syncing} onSync={sync} onDisconnect={disconnect}
        onConnect={() => onOpenModal()} connectLabel="Connect Binance" brand={brand}
        provider="binance" testing={testing} testResult={testResult} onTest={onTest} />
    </div>
  );
}

function CryptocomCard({ onOpenModal, onTest, testing, testResult }) {
  const { connected, assetCount, totalValue, lastSync, syncing, sync, disconnect, error } = useCryptocom();
  const { formatMoney } = useCurrency();
  const brand = '#1199fa';

  return (
    <div className={`card-accent ${connected ? 'card-accent-connected' : ''} glass-card group rounded-xl p-5 transition-all hover:translate-y-[-2px]`}
      style={{ '--accent': brand }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <BrandIcon label="CC" color={brand} bg="#002d7418" />
          <div>
            <p className="text-sm font-semibold text-white">Crypto.com</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">
              Exchange
            </span>
          </div>
        </div>
        <StatusBadge connected={connected} />
      </div>

      {connected ? (
        <div className="mb-4 space-y-2">
          <DataRow label="Portfolio" value={formatMoney(totalValue, 0)} valueClass="text-emerald-400 font-data" />
          <DataRow label="Assets" value={assetCount} valueClass="text-white" />
          <DataRow label="Last sync" value={lastSync ? timeAgo(lastSync) : '—'} valueClass="text-gray-400" />
          <DataRow label="Status" value={
            <span className="flex items-center gap-1.5">
              <span className="relative w-1.5 h-1.5 bg-emerald-400 rounded-full status-ping" />
              {syncing ? 'Syncing…' : 'Active'}
            </span>
          } valueClass="text-emerald-400" />
          <ErrorBanner error={error} />
        </div>
      ) : (
        <div className="mb-4 py-4 text-center">
          <p className="text-xs text-gray-500">Not connected</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Crypto exchange — signed API</p>
        </div>
      )}

      <CardActions connected={connected} syncing={syncing} onSync={sync} onDisconnect={disconnect}
        onConnect={() => onOpenModal()} connectLabel="Connect Crypto.com" brand={brand}
        provider="cryptocom" testing={testing} testResult={testResult} onTest={onTest} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function Connections() {
  const { formatMoney } = useCurrency();
  const { connected: degiroConnected, positionCount } = useDegiro();
  const { connected: t212Connected, positionCount: t212PositionCount, positions: t212Positions } = useTrading212();
  const { connected: binanceConnected, assetCount: binanceAssetCount, totalValue: binanceTotalValue } = useBinance();
  const { connected: cryptocomConnected, assetCount: cryptocomAssetCount, totalValue: cryptocomTotalValue } = useCryptocom();
  const { test: testConn, testing: testingMap, results: testResults } = useTestConnection();
  const [showDegiroModal, setShowDegiroModal] = useState(false);
  const [showT212Modal, setShowT212Modal] = useState(false);
  const [showBinanceModal, setShowBinanceModal] = useState(false);
  const [showCryptocomModal, setShowCryptocomModal] = useState(false);

  const liveSourceCount = (degiroConnected ? 1 : 0) + (t212Connected ? 1 : 0) + (binanceConnected ? 1 : 0) + (cryptocomConnected ? 1 : 0);
  const totalLivePositions = (degiroConnected ? positionCount : 0) + (t212Connected ? t212PositionCount : 0) + (binanceConnected ? binanceAssetCount : 0) + (cryptocomConnected ? cryptocomAssetCount : 0);
  // Compute T212 total from positions (avoids NaN from undefined account.total)
  const t212TotalValue = t212Connected ? t212Positions.reduce((s, p) => s + (p.value || 0), 0) : 0;
  const totalTrackedValue = t212TotalValue + (binanceTotalValue || 0) + (cryptocomTotalValue || 0);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <PageHeader title="Connections" subtitle="Link your brokers, exchanges, and wallets to build a unified portfolio view" />

      {/* ── Status summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5 card-reveal" style={{ animationDelay: '0ms' }}>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Connected Sources</p>
          <p className="text-3xl font-data font-medium text-emerald-400 leading-tight">
            {liveSourceCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">of 4 available</p>
        </div>
        <div className="glass-card rounded-xl p-5 card-reveal" style={{ animationDelay: '60ms' }}>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Tracked Value</p>
          <p className="text-3xl font-data font-medium text-white leading-tight">{totalTrackedValue > 0 ? formatMoney(totalTrackedValue, 0) : '—'}</p>
          <p className="text-xs text-gray-500 mt-1">across connected sources</p>
        </div>
        <div className="glass-card rounded-xl p-5 card-reveal" style={{ animationDelay: '120ms' }}>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Total Positions</p>
          <p className="text-3xl font-data font-medium text-emerald-400 leading-tight">
            {liveSourceCount > 0 ? totalLivePositions : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {liveSourceCount > 0
              ? [degiroConnected && 'DeGiro', t212Connected && 'T212', binanceConnected && 'Binance', cryptocomConnected && 'Crypto.com'].filter(Boolean).join(' + ')
              : 'No sources connected'}
          </p>
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-4">Integrations</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Real integrations first */}
          <div className="card-reveal" style={{ animationDelay: '150ms' }}>
            <DegiroCard onOpenModal={() => setShowDegiroModal(true)} onTest={testConn} testing={testingMap.degiro} testResult={testResults.degiro} />
          </div>
          <div className="card-reveal" style={{ animationDelay: '200ms' }}>
            <Trading212Card onOpenModal={() => setShowT212Modal(true)} onTest={testConn} testing={testingMap.trading212} testResult={testResults.trading212} />
          </div>
          <div className="card-reveal" style={{ animationDelay: '250ms' }}>
            <BinanceCard onOpenModal={() => setShowBinanceModal(true)} onTest={testConn} testing={testingMap.binance} testResult={testResults.binance} />
          </div>
          <div className="card-reveal" style={{ animationDelay: '300ms' }}>
            <CryptocomCard onOpenModal={() => setShowCryptocomModal(true)} onTest={testConn} testing={testingMap.cryptocom} testResult={testResults.cryptocom} />
          </div>
        </div>
      </div>

      {/* ── Security notice ── */}
      <div className="glass-card rounded-xl p-5 border border-amber-500/[0.08] card-reveal" style={{ animationDelay: '400ms' }}>
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-400 mb-1">Read-Only Security</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              All API keys are encrypted at rest (AES-256-GCM). Flolio requests read-only access only —
              no trading or withdrawal permissions are ever used. DeGiro sessions are proxied server-side.
            </p>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showDegiroModal && <DegiroModal onClose={() => setShowDegiroModal(false)} />}
      {showT212Modal && <Trading212Modal onClose={() => setShowT212Modal(false)} />}
      {showBinanceModal && <BinanceModal onClose={() => setShowBinanceModal(false)} />}
      {showCryptocomModal && <CryptocomModal onClose={() => setShowCryptocomModal(false)} />}
    </div>
  );
}
