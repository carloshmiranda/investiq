import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import PageHeader from '../components/PageHeader';

const SUGGESTED_PROMPTS = [
  'How much passive income will I earn next year?',
  'Is my portfolio income diversified enough?',
  'Which holdings are at risk of a dividend cut?',
  'What is my current portfolio yield vs market average?',
  'Show me my top income-generating assets',
  'How would DRIP affect my income in 10 years?',
];

function MarkdownText({ text }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        const renderBold = (str) => {
          const parts = str.split(/\*\*(.*?)\*\*/g);
          return parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{p}</strong> : p);
        };

        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-white font-bold">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ')) {
          return <p key={i} className="text-gray-300 pl-3 flex gap-2"><span className="text-[#a78bfa] flex-shrink-0">•</span><span>{renderBold(line.slice(2))}</span></p>;
        }
        if (/^\d+\./.test(line)) {
          return <p key={i} className="text-gray-300 pl-3">{renderBold(line)}</p>;
        }
        if (line.startsWith('#')) {
          return <p key={i} className="text-white font-bold text-base">{line.replace(/^#+\s/, '')}</p>;
        }
        return <p key={i} className="text-gray-300">{renderBold(line)}</p>;
      })}
    </div>
  );
}

const insightCards = [
  {
    type: 'opportunity',
    title: 'Income Opportunity',
    content: 'Ask AI to analyze your highest-yield positions and find opportunities to increase your passive income.',
    tag: 'Growth',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    iconColor: 'from-emerald-500 to-emerald-600',
    iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
  {
    type: 'risk',
    title: 'Risk Analysis',
    content: 'Ask AI to identify holdings at risk of dividend cuts or significant drawdowns based on your portfolio.',
    tag: 'Watch',
    tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    iconColor: 'from-amber-500 to-orange-500',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  {
    type: 'diversification',
    title: 'Diversification Check',
    content: 'Ask AI to evaluate your income diversification and suggest improvements across sectors and geographies.',
    tag: 'Optimize',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    iconColor: 'from-cyan-500 to-blue-500',
    iconPath: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
];

export default function AIInsights() {
  const { authAxios, user } = useAuth();
  const { formatMoney } = useCurrency();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your Flolio AI advisor powered by Claude. I can analyze your connected portfolios across all brokers and exchanges.\n\nWhat would you like to know about your investments?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quota, setQuota] = useState(null);
  const messagesEndRef = useRef(null);

  const isPro = user?.plan === 'pro';
  const isExhausted = quota && quota.remaining <= 0 && !isPro;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isExhausted) return;
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data } = await authAxios.post('/api/ai/chat', {
        messages: chatHistory,
      });

      if (data.quota) setQuota(data.quota);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      if (err.response?.status === 429 && err.response?.data?.queriesUsed != null) {
        setQuota({
          used: err.response.data.queriesUsed,
          limit: err.response.data.queriesLimit,
          remaining: 0,
          plan: user?.plan || 'free',
        });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `**Query limit reached.** You've used all ${err.response.data.queriesLimit} AI queries for this month. Upgrade to Pro for unlimited AI insights.`,
          },
        ]);
      } else {
        const errorMsg = err.response?.data?.error || 'Failed to get AI response. Please try again.';
        setMessages((prev) => [...prev, { role: 'assistant', content: `**Error:** ${errorMsg}` }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="AI Insights" subtitle="Your intelligent investment advisor powered by Claude" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 card-reveal" style={{ animationDelay: '0.08s' }}>
        {/* Chat interface */}
        <div className="xl:col-span-2 flex flex-col glass-card rounded-xl overflow-hidden" style={{ height: 'min(600px, calc(100vh - 12rem))' }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C5CFC] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#7C5CFC]/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Flolio AI</p>
              <p className="text-[10px] text-[#a78bfa] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFC] animate-pulse" />
                Online — portfolio context loaded
              </p>
            </div>
            {/* Quota counter */}
            <div className="ml-auto flex items-center gap-2">
              {quota && (
                <span className={`text-[10px] font-data px-2 py-0.5 rounded-full border ${
                  quota.remaining <= 0
                    ? 'text-red-400 bg-red-500/10 border-red-500/20'
                    : quota.remaining <= 2
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      : 'text-gray-400 bg-white/5 border-white/10'
                }`}>
                  {quota.used}/{quota.limit} queries
                </span>
              )}
              <span className="text-[10px] font-data text-gray-500">claude-sonnet-4-6</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fadeIn`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-md ${msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-[#7C5CFC] to-[#a78bfa] text-white shadow-[#7C5CFC]/20'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-purple-500/20'
                  }`}>
                  {msg.role === 'assistant' ? 'AI' : 'U'}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all ${msg.role === 'assistant'
                  ? 'bg-white/[0.04] border border-white/5 rounded-tl-sm border-l-2 border-l-[#7C5CFC]/70'
                  : 'bg-[#7C5CFC]/15 border border-[#7C5CFC]/20 rounded-tr-sm'
                  }`}>
                  <MarkdownText text={msg.content} />
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 animate-fadeIn">
                <div className="w-7 h-7 rounded-full flex-shrink-0 bg-gradient-to-br from-[#7C5CFC] to-[#a78bfa] flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-[#7C5CFC]/20">AI</div>
                <div className="bg-white/[0.04] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 border-l-2 border-l-[#7C5CFC]/70">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-[#7C5CFC]/60 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Suggested prompts — anchored below welcome message */}
            {messages.length < 3 && !isExhausted && (
              <div className="animate-fadeIn">
                <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider">Suggested questions</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] border border-white/5 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/30"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Upgrade CTA when exhausted */}
          {isExhausted && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20">
                <svg className="w-5 h-5 text-[#7C5CFC] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">Monthly AI limit reached</p>
                  <p className="text-[10px] text-gray-400">Upgrade to Pro for unlimited AI queries, CSV export, and more.</p>
                </div>
                <Link
                  to="/billing"
                  className="text-[11px] font-medium text-white bg-[#7C5CFC] hover:bg-[#6B4FE0] px-4 py-1.5 rounded-lg transition-colors"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-white/5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isExhausted ? 'AI query limit reached — upgrade to Pro' : 'Ask about your portfolio...'}
              className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7C5CFC]/50 focus:ring-2 focus:ring-[#7C5CFC]/20 transition-all duration-200 disabled:opacity-50"
              disabled={isTyping || isExhausted}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping || isExhausted}
              className="p-2.5 bg-[#7C5CFC] hover:bg-[#6B4FE0] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40 hover:shadow-lg hover:shadow-[#7C5CFC]/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Insight cards */}
          {insightCards.map((card, i) => (
            <div key={i} className="glass-card rounded-xl p-4 border border-white/5 transition-all duration-300 hover:border-white/10 group card-reveal" style={{ animationDelay: `${0.12 + i * 0.06}s` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${card.iconColor} flex items-center justify-center`}>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.iconPath} />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-white">{card.title}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${card.tagColor}`}>{card.tag}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{card.content}</p>
              <button
                onClick={() => sendMessage(card.title)}
                disabled={isExhausted}
                className="mt-3 text-[11px] text-[#a78bfa] hover:text-[#7C5CFC] transition-colors group-hover:underline focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ask AI about this →
              </button>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
