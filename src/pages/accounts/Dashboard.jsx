import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import { formatCurrency, formatDate } from '../../utils/format'
import { Banknote, CheckCircle, Clock, AlertCircle, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AccountsDashboard() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['accounts-queue'],
    queryFn: () => api.get('/tax/submissions/accounts-queue/').then(r => r.data),
    refetchInterval: 30000,
  })

  const confirmPayment = useMutation({
    mutationFn: (submissionId) =>
      api.patch(`/tax/submissions/${submissionId}/payment-status/`, { payment_status: 'paid' }),
    onSuccess: () => {
      toast.success('Payment confirmed! Consultant has been notified.')
      qc.invalidateQueries(['accounts-queue'])
    },
    onError: () => toast.error('Failed to confirm payment'),
  })

  const awaitingConfirmation = queue.filter(s => s.status === 'awaiting_confirmation')
  const confirmed = queue.filter(s => s.status === 'confirmed')

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.full_name?.split(' ')[0] || 'Officer'}`}
        subtitle="Accounts Division — Payment Queue"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card hover:border-brand-yellow/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">Total Pending</p>
              <p className="text-3xl font-black text-white">{isLoading ? '—' : queue.length}</p>
            </div>
            <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center">
              <Banknote size={18} className="text-brand-yellow" />
            </div>
          </div>
        </div>
        <div className="card hover:border-blue-400/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">Sent to Client</p>
              <p className="text-3xl font-black text-white">{isLoading ? '—' : awaitingConfirmation.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-blue-400" />
            </div>
          </div>
        </div>
        <div className="card hover:border-brand-success/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">Client Confirmed</p>
              <p className="text-3xl font-black text-white">{isLoading ? '—' : confirmed.length}</p>
            </div>
            <div className="w-10 h-10 bg-brand-success/10 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-brand-success" />
            </div>
          </div>
        </div>
      </div>

      {/* Queue table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-gray-border">
          <h3 className="section-header mb-0">
            <Banknote size={16} className="text-brand-yellow" />
            Payment Confirmation Queue
          </h3>
          <p className="text-xs text-brand-gray mt-1">Confirm payment received for each submission to allow consultant to submit the final return.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle size={40} className="mx-auto text-brand-success mb-3 opacity-50" />
            <p className="text-sm text-brand-gray">No pending payments — all confirmed!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-brand-gray-border">
              <tr>
                <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-6 py-3">Client</th>
                <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Tax Year</th>
                <th className="text-right text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Net Tax Payable</th>
                <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Stage</th>
                <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Sent</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gray-border">
              {queue.map(sub => (
                <tr key={sub.id} className="hover:bg-brand-black-soft transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-brand-yellow" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{sub.client_name}</p>
                        <p className="text-xs text-brand-gray">{sub.client_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-brand-gray">{sub.tax_year_label}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-brand-yellow">
                    {sub.net_tax_payable ? formatCurrency(sub.net_tax_payable) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    {sub.status === 'confirmed' ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} /> Client Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded-full">
                        <Clock size={10} /> Awaiting Client
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-brand-gray">
                    {sub.submitted_at ? formatDate(sub.submitted_at) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        if (window.confirm(`Confirm payment received for ${sub.client_name} — ${formatCurrency(sub.net_tax_payable || 0)}?`)) {
                          confirmPayment.mutate(sub.id)
                        }
                      }}
                      disabled={confirmPayment.isPending}
                      className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                    >
                      <CheckCircle size={13} /> Confirm Payment Received
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {queue.length > 0 && (
        <div className="mt-4 p-4 bg-brand-yellow/5 border border-brand-yellow/20 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="text-brand-yellow flex-shrink-0 mt-0.5" />
            <p className="text-xs text-brand-gray">
              Once you confirm payment, the assigned consultant will be notified and can proceed to submit the final tax return to the client.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
