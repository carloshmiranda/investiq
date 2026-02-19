import { useState, useRef, useEffect } from 'react';
import { getPortfolioSummary, getPortfolioHealthScore, getAllHoldings } from '../data/mockPortfolio';
import { formatCurrency, formatPercent } from '../utils/formatters';

const SUGGESTED_PROMPTS = [
  'How much passive income will I earn next year?',
  'Is my portfolio income diversified enough?',
  'Which holdings are at risk of a dividend cut?',
  'What is my current portfolio yield vs market average?',
  'Show me my top income-generating assets',
  'How would DRIP affect my income in 10 years?',
];

const MOCK_AI_RESPONSES = {
  'How much passive income will I earn next year?': `Based on your current holdings, here's my projection for next year's passive income:

**Annual Income Breakdown:**
- **Dividends (Stocks/ETFs):** $4,960/year
- **Staking Rewards (ETH, SOL, LINK):** $1,792/year
- **DeFi Yield (USDC on Aave):** $765/year
- **Total Projected:** ~$7,517/year or **$626/month**

This assumes current holdings, no price changes, and typical payout schedules. Key drivers: JEPQ monthly dividends ($97/mo), Realty Income monthly payouts ($30.72/mo), and Ethereum staking via Lido at 4.2% APY.

**Upside scenario (+8.3% growth):** ~$8,140/year
**Conservative scenario (-5% due to rate changes):** ~$7,141/year

💡 *Tip: Enabling DRIP on your monthly dividend ETFs could add ~$340 in compounded income by year-end.*`,

  'Is my portfolio income diversified enough?': `Your income diversification score is **72/100** — Good, with room to improve.

**Current income split:**
- Stocks: 42% ✅
- ETFs: 31% ✅
- Crypto staking: 21% ⚠️
- Stablecoin yield: 6% ✅

**What's working well:**
Your equity exposure is spread across 4 sectors (Tech, Consumer Staples, Healthcare, Real Estate) which provides solid protection against sector-specific downturns.

**Areas of concern:**
1. **AT&T (T)** — 6.53% yield but safety rating C. High payout ratio makes cuts possible.
2. **Crypto concentration** — 21% of income from staking is exposed to APY compression and protocol risk.
3. **Geographic concentration** — 100% US-focused. Consider adding international dividend ETFs like VXUS or SCHY.

**Recommendation:** Adding 2-3 international dividend ETFs would raise your diversification score to ~85.`,

  'Which holdings are at risk of a dividend cut?': `Based on my analysis of your current holdings, here are the risk levels:

**🔴 High Risk:**
- **AT&T (T)** — 6.53% yield, Safety C. Payout ratio ~65%, debt remains elevated post-WarnerMedia spin-off. Watch Q1 2024 earnings.

**🟡 Moderate Watch:**
- **JEPQ** — 10.54% yield relies on options premium income. In low-volatility markets, distributions may compress by 15-20%. Not a "cut" per se, but income may vary.
- **T** — Already mentioned, bears repeating.

**🟢 Very Safe:**
- **AAPL, MSFT, KO, JNJ, PG** — All Dividend Kings or Aristocrats. Payout ratios well below 60%, growing free cash flow. Zero cut risk in near term.
- **O (Realty Income)** — 30+ year dividend growth streak. Monthly payer, rated A.
- **SCHD, VYM** — ETF structure means single-stock cut risk is pooled.

**Overall portfolio dividend safety: A-**`,

  default: `I've analyzed your portfolio and here's my assessment:

Your portfolio consists of **$${Math.round(getPortfolioSummary().totalValue).toLocaleString()}** across stocks, ETFs, and crypto assets, generating approximately **$${Math.round(getPortfolioSummary().annualIncome).toLocaleString()}/year** in passive income.

**Key observations:**
- Your overall portfolio yield is **${getPortfolioSummary().overallYield.toFixed(2)}%**, which is competitive relative to the S&P 500's ~1.5% average
- You have good income frequency (monthly payers via O, JEPQ help smooth cash flow)
- Crypto staking adds alpha but introduces APY volatility risk

**What I'd watch:**
1. Interest rate sensitivity — your REITs and high-yield stocks may face headwinds if rates stay elevated
2. AT&T's debt trajectory in 2024
3. Ethereum staking yield compression as more validators join the network

Feel free to ask me about any specific aspect of your portfolio!`,
};

function getAIResponse(prompt) {
  const key = Object.keys(MOCK_AI_RESPONSES).find((k) =>
    prompt.toLowerCase().includes(k.toLowerCase().slice(0, 20))
  );
  return MOCK_AI_RESPONSES[key] ?? MOCK_AI_RESPONSES.default;
}

function MarkdownText({ text }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        // Bold (**text**)
        const renderBold = (str) => {
          const parts = str.split(/\*\*(.*?)\*\*/g);
          return parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{p}</strong> : p);
        };

        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-white font-bold">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ')) {
          return <p key={i} className="text-gray-300 pl-3 flex gap-2"><span className="text-emerald-400 flex-shrink-0">•</span><span>{renderBold(line.slice(2))}</span></p>;
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
    icon: '💡',
    title: 'Income Opportunity',
    content: 'SCHD has increased its dividend for 12 consecutive years. Adding 50 more shares at current prices would add ~$131/year in income at 3.45% yield.',
    tag: 'Growth',
    tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    type: 'risk',
    icon: '⚠️',
    title: 'Risk Alert',
    content: "AT&T's Q4 earnings showed FCF below dividend coverage threshold. Monitor February 2024 earnings call for guidance on dividend sustainability.",
    tag: 'Watch',
    tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    type: 'diversification',
    icon: '⚖️',
    title: 'Diversification Tip',
    content: 'Your portfolio has zero international exposure. Adding SCHY (Schwab International Dividend) would improve geographic diversification and add 4.1% yield.',
    tag: 'Optimize',
    tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
];

const newsFeed = [
  { headline: 'Realty Income completes Spirit Realty merger, expanding monthly dividend base', time: '2h ago', sentiment: 'Bullish', ticker: 'O' },
  { headline: 'Federal Reserve signals rates to remain elevated through mid-2024', time: '4h ago', sentiment: 'Bearish', ticker: 'MACRO' },
  { headline: 'Ethereum staking ratio reaches 25%, Lido maintains 4.2% APY guidance', time: '6h ago', sentiment: 'Neutral', ticker: 'ETH' },
  { headline: 'JEPQ hits $10B AUM milestone, JPMorgan confirms distribution strategy unchanged', time: '1d ago', sentiment: 'Bullish', ticker: 'JEPQ' },
  { headline: 'AT&T reaffirms $1.11 annual dividend, debt reduction on track', time: '2d ago', sentiment: 'Neutral', ticker: 'T' },
  { headline: 'Solana network activity surges 340% YoY, staking demand increases', time: '2d ago', sentiment: 'Bullish', ticker: 'SOL' },
];

const sentimentColors = {
  Bullish: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Bearish: 'text-red-400 bg-red-500/10 border-red-500/20',
  Neutral: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

export default function AIInsights() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your InvestIQ AI advisor. I have full visibility into your portfolio — **${formatCurrency(getPortfolioSummary().totalValue, 0)}** across stocks, ETFs, and crypto assets generating **${formatCurrency(getPortfolioSummary().annualIncome, 0)}/year** in passive income.\n\nWhat would you like to know about your investments?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const response = getAIResponse(text);
    setIsTyping(false);
    setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Insights</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your intelligent investment advisor powered by Claude</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chat interface */}
        <div className="xl:col-span-2 flex flex-col glass-card rounded-xl overflow-hidden" style={{ height: '600px' }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">InvestIQ AI</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online — portfolio context loaded
              </p>
            </div>
            <div className="ml-auto text-xs text-gray-600">claude-sonnet-4</div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-cyan-500 to-emerald-500 text-white'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                  }`}>
                  {msg.role === 'assistant' ? 'AI' : 'U'}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'assistant'
                  ? 'bg-[#1f2937] border border-white/5 rounded-tl-sm'
                  : 'bg-emerald-500/20 border border-emerald-500/20 rounded-tr-sm'
                  }`}>
                  <MarkdownText text={msg.content} />
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full flex-shrink-0 bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-white">AI</div>
                <div className="bg-[#1f2937] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts */}
          {messages.length < 3 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-gray-600 mb-1.5 uppercase tracking-wider">Suggested questions</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5 transition-colors text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-white/5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your portfolio..."
              className="flex-1 px-4 py-2.5 bg-[#1f2937] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
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
            <div key={i} className="glass-card rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{card.icon}</span>
                  <span className="text-xs font-semibold text-white">{card.title}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${card.tagColor}`}>{card.tag}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{card.content}</p>
              <button
                onClick={() => sendMessage(card.title)}
                className="mt-2 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Ask AI about this →
              </button>
            </div>
          ))}

          {/* All suggested prompts */}
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Quick Questions</p>
            <div className="space-y-1.5">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="w-full text-left text-[11px] px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                >
                  → {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* News feed */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Portfolio News Feed</h3>
          <span className="text-xs text-gray-500">AI-analyzed sentiment</span>
        </div>
        <div className="space-y-2">
          {newsFeed.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/3 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0">
                {item.ticker.slice(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 leading-tight group-hover:text-white transition-colors">{item.headline}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{item.time}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${sentimentColors[item.sentiment]}`}>
                {item.sentiment}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
