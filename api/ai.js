// api/ai.js
// POST /api/ai/chat — AI chat, portfolio context injected, quota enforced
import { createProtectedHandler } from '../lib/apiHandler.js'
import { getCache } from '../lib/cache.js'
import { prisma } from '../lib/prisma.js'
import { getPlan } from '../lib/plans.js'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6'
const MAX_TOKENS = 1024

// ─── Build portfolio context for the system prompt ─────────────────────────
function buildPortfolioContext(portfolio, income) {
  const lines = []

  if (portfolio) {
    lines.push(`## User's Portfolio (${portfolio.count} holdings, total value: $${Math.round(portfolio.totalValue).toLocaleString()})`)
    lines.push(`Sources: ${portfolio.sources?.join(', ') || 'none connected'}`)
    lines.push(`Last fetched: ${portfolio.fetchedAt || 'unknown'}`)
    lines.push('')

    if (portfolio.holdings?.length > 0) {
      lines.push('### Holdings:')
      for (const h of portfolio.holdings.slice(0, 50)) {
        const val = h.value ? `$${Math.round(h.value).toLocaleString()}` : 'N/A'
        const yield_ = h.yieldPercent ? ` (${h.yieldPercent.toFixed(1)}% yield)` : ''
        lines.push(`- ${h.ticker} (${h.broker}): ${h.quantity} units @ $${h.price?.toFixed(2) || '0'} = ${val}${yield_} [${h.sector || h.type}]`)
      }
      if (portfolio.holdings.length > 50) {
        lines.push(`... and ${portfolio.holdings.length - 50} more holdings`)
      }
    }
  } else {
    lines.push('## Portfolio: No cached data available. User may not have connected any brokers yet.')
  }

  lines.push('')

  if (income) {
    lines.push(`## Income Events (${income.count} events, total: $${Math.round(income.totalIncome).toLocaleString()})`)
    if (income.events?.length > 0) {
      lines.push('### Recent income:')
      for (const e of income.events.slice(0, 30)) {
        lines.push(`- ${e.date?.split('T')[0]}: ${e.ticker} — $${e.amount?.toFixed(2)} (${e.type}, ${e.broker || e.source})`)
      }
      if (income.events.length > 30) {
        lines.push(`... and ${income.events.length - 30} more events`)
      }
    }
  } else {
    lines.push('## Income: No cached data available.')
  }

  return lines.join('\n')
}

const SYSTEM_PROMPT = `You are Accrue AI, an expert investment advisor embedded in a personal portfolio dashboard. You have full visibility into the user's real portfolio data, which is provided below.

Your role:
- Analyze the user's holdings, income streams, and portfolio composition
- Provide actionable insights about dividend safety, yield optimization, and diversification
- Answer questions about projected income, risk analysis, and portfolio health
- Be specific: reference actual tickers, amounts, and percentages from their portfolio
- Use markdown formatting: **bold** for emphasis, bullet points for lists, numbers for data

Style guidelines:
- Be concise but thorough (2-4 paragraphs typical)
- Lead with the most important insight
- Include specific numbers from their portfolio
- Suggest actionable next steps
- If you don't have enough data, say so honestly

Important:
- All monetary values in the portfolio are in USD
- Do NOT make up holdings or data not in the portfolio context
- If the user has no connected brokers, guide them to connect one first`

// ─── Quota helpers ─────────────────────────────────────────────────────────
function getCurrentMonth() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

async function getUsage(userId, month) {
  return prisma.aiUsage.findUnique({
    where: { userId_month: { userId, month } },
  })
}

async function incrementUsage(userId, month, inputTokens, outputTokens) {
  return prisma.aiUsage.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, queryCount: 1, inputTokens, outputTokens },
    update: {
      queryCount: { increment: 1 },
      inputTokens: { increment: inputTokens },
      outputTokens: { increment: outputTokens },
    },
  })
}

export default createProtectedHandler({
  POST: async (req, res) => {
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured. ANTHROPIC_API_KEY is missing.' })
    }

    const { messages } = req.body || {}
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' })
    }

    // ── Quota check ──────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { plan: true },
    })
    const plan = getPlan(user?.plan)
    const month = getCurrentMonth()
    const usage = await getUsage(req.userId, month)
    const queriesUsed = usage?.queryCount ?? 0

    if (queriesUsed >= plan.aiQueriesPerMonth) {
      return res.status(429).json({
        error: 'AI query limit reached for this month.',
        queriesUsed,
        queriesLimit: plan.aiQueriesPerMonth,
        upgradeUrl: '/billing',
      })
    }

    // Fetch cached portfolio + income data for context
    const [portfolio, income] = await Promise.all([
      getCache(req.userId, 'portfolio'),
      getCache(req.userId, 'income'),
    ])

    const portfolioContext = buildPortfolioContext(portfolio, income)
    const systemPrompt = `${SYSTEM_PROMPT}\n\n---\n\n${portfolioContext}`

    // Build messages for AI API (only user/assistant roles)
    const aiMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: aiMessages,
      }),
    })

    if (!response.ok) {
      let errBody
      try { errBody = await response.json() } catch { errBody = {} }
      const msg = errBody.error?.message || `AI API returned ${response.status}`
      return res.status(502).json({ error: msg })
    }

    const data = await response.json()
    const reply = data.content?.[0]?.text || 'No response generated.'

    // ── Track usage ──────────────────────────────────────────────────────
    const inputTokens = data.usage?.input_tokens ?? 0
    const outputTokens = data.usage?.output_tokens ?? 0
    await incrementUsage(req.userId, month, inputTokens, outputTokens)

    const remaining = Math.max(0, plan.aiQueriesPerMonth - (queriesUsed + 1))
    res.setHeader('X-AI-Queries-Remaining', String(remaining))

    return res.json({
      reply,
      model: data.model,
      usage: data.usage,
      quota: {
        used: queriesUsed + 1,
        limit: plan.aiQueriesPerMonth,
        remaining,
        plan: user?.plan || 'free',
      },
    })
  },
})
