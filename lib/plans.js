// lib/plans.js — tier definitions as code constants
export const PLANS = {
  free: {
    name: 'Free',
    aiQueriesPerMonth: 5,
    aiBurstPerMinute: 5,
    csvExport: false,
    autoSync: false,
    incomeHistoryMonths: 12,
  },
  pro: {
    name: 'Pro',
    price: { monthly: 8, yearly: 72 },
    aiQueriesPerMonth: 200, // soft cap — feels unlimited
    aiBurstPerMinute: 5,
    csvExport: true,
    autoSync: true,
    incomeHistoryMonths: Infinity,
  },
}

export function getPlan(planId) {
  return PLANS[planId] || PLANS.free
}
