/**
 * Format a number as Sri Lankan Rupees
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return 'Rs. 0.00'
  const num = parseFloat(value)
  if (isNaN(num)) return 'Rs. 0.00'
  return `Rs. ${num.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  awaiting_confirmation: 'Awaiting Confirmation',
  archived: 'Archived',
  draft: 'Draft',
  submitted: 'Submitted',
  info_requested: 'Info Requested',
  under_review: 'Under Review',
  calculation_done: 'Calculation Done',
  confirmed: 'Confirmed',
}

export const STATUS_COLORS = {
  not_started: 'bg-brand-black-soft text-brand-gray',
  in_progress: 'bg-brand-info-pale text-brand-info',
  pending_review: 'bg-yellow-900/30 text-brand-yellow',
  awaiting_confirmation: 'bg-orange-900/30 text-orange-400',
  archived: 'bg-brand-success-pale text-brand-success',
  draft: 'bg-brand-black-soft text-brand-gray',
  submitted: 'bg-brand-info-pale text-brand-info',
  info_requested: 'bg-brand-red-pale text-brand-red',
  under_review: 'bg-yellow-900/30 text-brand-yellow',
  calculation_done: 'bg-purple-900/30 text-purple-400',
  confirmed: 'bg-brand-success-pale text-brand-success',
}
