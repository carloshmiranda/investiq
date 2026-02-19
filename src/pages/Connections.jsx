import { useState } from 'react';
import { connections } from '../data/mockPortfolio';
import { formatCurrency } from '../utils/formatters';

const typeConfig = {
  broker: { label: 'Broker', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  exchange: { label: 'Exchange', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  wallet: { label: 'Wallet', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  hardware: { label: 'Hardware', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  aggregator: { label: 'Aggregator', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

const brandColors = {
  ibkr: '#d4380d',
  alpaca: '#ffbc39',
  coinbase: '#0052ff',
  binance: '#f0b90b',
  metamask: '#e2761b',
  ledger: '#142533',
  phantom: '#ab9ff2',
  plaid: '#00d64f',
};

function APIKeyModal({ name, onClose, onConnect }) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [connected, setConnected] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`[InvestIQ] Connecting ${name}:`, { apiKey, apiSecret });
    setConnected(true);
    setTimeout(() => {
      onConnect();
      onClose();
    }, 1000);
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
        {connected ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-semibold">Successfully Connected!</p>
            <p className="text-gray-500 text-sm mt-1">Syncing your portfolio data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-400">Enter your {name} API credentials. We use read-only access — we never trade on your behalf.</p>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key..."
                className="w-full px-3 py-2.5 bg-[#1f2937] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter API secret..."
                className="w-full px-3 py-2.5 bg-[#1f2937] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                required
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-[11px] text-amber-400">Enable read-only API permissions. Never grant withdrawal rights.</p>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Connect Securely
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function WalletModal({ name, onClose, onConnect }) {
  const [address, setAddress] = useState('');
  const [connected, setConnected] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`[InvestIQ] Connecting wallet ${name}:`, { address });
    setConnected(true);
    setTimeout(() => {
      onConnect();
      onClose();
    }, 1000);
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
        {connected ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-semibold">Wallet Connected!</p>
            <p className="text-gray-500 text-sm mt-1">Reading on-chain data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-400">Enter your {name} wallet address for read-only balance tracking. We never request private keys.</p>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Wallet Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x... or SOL address"
                className="w-full px-3 py-2.5 bg-[#1f2937] border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Track Wallet
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Connections() {
  const [conns, setConns] = useState(connections);
  const [modal, setModal] = useState(null); // { id, name, modalType }

  const toggleConnection = (id) => {
    setConns((prev) => prev.map((c) => c.id === id ? { ...c, connected: !c.connected } : c));
  };

  const openModal = (conn) => {
    const modalType = ['wallet', 'hardware'].includes(conn.type) ? 'wallet' : 'api';
    if (conn.type === 'broker' && conn.id !== 'plaid') {
      // OAuth mock
      console.log(`[InvestIQ] Initiating OAuth for ${conn.name}`);
      setTimeout(() => toggleConnection(conn.id), 800);
      return;
    }
    setModal({ id: conn.id, name: conn.name, modalType });
  };

  const handleConnect = (id) => {
    setConns((prev) => prev.map((c) => c.id === id ? { ...c, connected: true, accounts: 1, totalValue: Math.round(Math.random() * 50000) + 10000 } : c));
  };

  const connected = conns.filter((c) => c.connected);
  const totalConnectedValue = connected.reduce((s, c) => s + c.totalValue, 0);

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
          <p className="text-2xl font-bold text-emerald-400">{connected.length}</p>
          <p className="text-xs text-gray-500">of {conns.length} available</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Tracked Value</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalConnectedValue, 0)}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500">Last Sync</p>
          <p className="text-2xl font-bold text-cyan-400">Live</p>
          <p className="text-xs text-gray-500">Auto-refreshing</p>
        </div>
      </div>

      {/* Connection cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {conns.map((conn) => {
          const tc = typeConfig[conn.type] ?? typeConfig.broker;
          const brand = brandColors[conn.id] ?? '#6b7280';

          return (
            <div key={conn.id} className={`glass-card rounded-xl p-5 border transition-all ${conn.connected ? 'border-emerald-500/20' : 'border-white/5'}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white"
                    style={{ background: brand + '22', border: `1px solid ${brand}44`, color: brand }}
                  >
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

              {/* Stats */}
              {conn.connected ? (
                <div className="mb-4 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Accounts</span>
                    <span className="text-white">{conn.accounts}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Portfolio</span>
                    <span className="text-emerald-400 font-semibold">{formatCurrency(conn.totalValue, 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Status</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 py-3 text-center">
                  <p className="text-xs text-gray-600">Not connected</p>
                </div>
              )}

              {/* Action button */}
              {conn.connected ? (
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 text-xs text-gray-400 border border-white/10 rounded-lg hover:text-white hover:bg-white/5 transition-colors">
                    Sync Now
                  </button>
                  <button
                    onClick={() => toggleConnection(conn.id)}
                    className="px-2.5 py-1.5 text-xs text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openModal(conn)}
                  className="w-full py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                >
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
              InvestIQ only requests read-only access. We never store API secrets unencrypted, never execute trades,
              and never request withdrawal permissions. All connections use industry-standard OAuth or read-only API scopes.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal && modal.modalType === 'api' && (
        <APIKeyModal
          name={modal.name}
          onClose={() => setModal(null)}
          onConnect={() => handleConnect(modal.id)}
        />
      )}
      {modal && modal.modalType === 'wallet' && (
        <WalletModal
          name={modal.name}
          onClose={() => setModal(null)}
          onConnect={() => handleConnect(modal.id)}
        />
      )}
    </div>
  );
}
