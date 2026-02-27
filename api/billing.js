// api/billing.js — Stripe billing: checkout, portal, status, webhook
// Routes via vercel.json: /api/billing/:action → /api/billing?action=:action
import { createHandler } from '../lib/apiHandler.js'
import { requireAuth } from '../lib/authMiddleware.js'
import { prisma } from '../lib/prisma.js'
import { getPlan } from '../lib/plans.js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID
const APP_URL = process.env.VITE_APP_URL || 'https://accrue.app'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrentMonth() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

async function getOrCreateCustomer(userId, email, name) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

// ─── Route: POST /api/billing/checkout ───────────────────────────────────────

async function handleCheckout(req, res) {
  if (!(await requireAuth(req, res))) return

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { email: true, name: true, plan: true },
  })

  if (user.plan === 'pro') {
    return res.status(400).json({ error: 'Already on Pro plan' })
  }

  const customerId = await getOrCreateCustomer(req.userId, user.email, user.name)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
    success_url: `${APP_URL}/billing?success=true`,
    cancel_url: `${APP_URL}/billing?canceled=true`,
    metadata: { userId: req.userId },
  })

  return res.json({ url: session.url })
}

// ─── Route: POST /api/billing/portal ─────────────────────────────────────────

async function handlePortal(req, res) {
  if (!(await requireAuth(req, res))) return

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return res.status(400).json({ error: 'No billing account found' })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${APP_URL}/billing`,
  })

  return res.json({ url: session.url })
}

// ─── Route: GET /api/billing/status ──────────────────────────────────────────

async function handleStatus(req, res) {
  if (!(await requireAuth(req, res))) return

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { plan: true, subStatus: true, subCurrentPeriodEnd: true },
  })

  const plan = getPlan(user?.plan)
  const month = getCurrentMonth()

  const usage = await prisma.aiUsage.findUnique({
    where: { userId_month: { userId: req.userId, month } },
  })

  return res.json({
    plan: user?.plan || 'free',
    planName: plan.name,
    subStatus: user?.subStatus,
    currentPeriodEnd: user?.subCurrentPeriodEnd,
    aiQuota: {
      used: usage?.queryCount ?? 0,
      limit: plan.aiQueriesPerMonth,
      remaining: Math.max(0, plan.aiQueriesPerMonth - (usage?.queryCount ?? 0)),
    },
  })
}

// ─── Route: POST /api/billing/webhook ────────────────────────────────────────

async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature']
  if (!sig || !WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Missing signature' })
  }

  let event
  try {
    // Vercel parses JSON by default — we need the raw body for verification
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET)
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.userId
      if (!userId) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription)
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: 'pro',
          stripeCustomerId: session.customer,
          stripeSubId: subscription.id,
          subStatus: subscription.status,
          subCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      const user = await prisma.user.findUnique({
        where: { stripeSubId: sub.id },
        select: { id: true },
      })
      if (!user) break

      const isActive = ['active', 'trialing'].includes(sub.status)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: isActive ? 'pro' : 'free',
          subStatus: sub.status,
          subCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const user = await prisma.user.findUnique({
        where: { stripeSubId: sub.id },
        select: { id: true },
      })
      if (!user) break

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: 'free',
          subStatus: 'canceled',
          stripeSubId: null,
        },
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      if (!invoice.subscription) break

      const user = await prisma.user.findUnique({
        where: { stripeSubId: invoice.subscription },
        select: { id: true },
      })
      if (!user) break

      await prisma.user.update({
        where: { id: user.id },
        data: { subStatus: 'past_due' },
      })
      break
    }
  }

  return res.json({ received: true })
}

// ─── Dispatch ────────────────────────────────────────────────────────────────

export default createHandler({
  GET: async (req, res) => {
    const { action } = req.query
    if (action === 'status') return handleStatus(req, res)
    return res.status(404).json({ error: `Unknown action: ${action}` })
  },
  POST: async (req, res) => {
    const { action } = req.query
    if (action === 'checkout') return handleCheckout(req, res)
    if (action === 'portal')   return handlePortal(req, res)
    if (action === 'webhook')  return handleWebhook(req, res)
    return res.status(404).json({ error: `Unknown action: ${action}` })
  },
})
