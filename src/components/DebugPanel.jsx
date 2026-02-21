import { useState } from 'react'

const STATUS_COLOR = {
  ok: 'text-emerald-400',
  error: 'text-red-400',
  pending: 'text-amber-400',
}

export default function DebugPanel({ logs, onClear, visible, onToggle }) {
  const [expanded, setExpanded] = useState(null)

  if (!visible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-navy-700/90 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-navy-600 transition-all shadow-lg backdrop-blur-md"
        title="Toggle Debug Panel"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[60vh] flex flex-col rounded-xl bg-[#0d1526]/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="text-xs font-semibold text-white">Debug Panel</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-data">
            {logs.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onClear} className="text-[10px] text-gray-500 hover:text-white px-2 py-0.5 rounded hover:bg-white/5 transition-colors">
            Clear
          </button>
          <button onClick={onToggle} className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-600">No API calls logged yet</div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {logs.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                className="w-full text-left px-3 py-2 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${entry.status === 'ok' ? 'bg-emerald-400' : entry.status === 'error' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider flex-shrink-0">{entry.provider}</span>
                  <span className="text-[10px] text-gray-500 truncate flex-1">{entry.action}</span>
                  <span className={`text-[10px] font-data flex-shrink-0 ${STATUS_COLOR[entry.status] || 'text-gray-500'}`}>
                    {entry.status}
                  </span>
                  {entry.latency != null && (
                    <span className="text-[9px] font-data text-gray-600 flex-shrink-0">{entry.latency}ms</span>
                  )}
                </div>
                {expanded === entry.id && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[9px] text-gray-600 font-data">{entry.ts}</p>
                    {entry.error && (
                      <p className="text-[10px] text-red-400 bg-red-500/5 p-1.5 rounded font-mono break-all">{entry.error}</p>
                    )}
                    {entry.data && (
                      <pre className="text-[9px] text-gray-500 bg-white/[0.02] p-1.5 rounded font-mono break-all whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
