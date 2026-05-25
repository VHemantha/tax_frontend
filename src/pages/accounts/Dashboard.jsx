import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import { formatCurrency, formatDate } from '../../utils/format'
import { Banknote, CheckCircle, Clock, AlertCircle, User, Paperclip, X, Upload, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

/* ── Payment Confirmation Modal ── */
function ConfirmPaymentModal({ submission, onClose, onConfirm, isPending }) {
  const [slip, setSlip] = useState(null)
  const fileRef = useRef()

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(f.type)) {
      toast.error('Only PDF, JPG, PNG or WEBP files are accepted.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB.')
      return
    }
    setSlip(f)
  }

  function handleSubmit() {
    onConfirm(slip)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-brand-black-light border border-brand-gray-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-gray-border">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-brand-success" />
            Confirm Payment Received
          </h3>
          <button onClick={onClose} className="text-brand-gray hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-brand-black rounded-xl p-4 space-y-1">
            <p className="text-sm font-semibold text-white">{submission.client_name}</p>
            <p className="text-xs text-brand-gray">{submission.tax_year_label}</p>
            <p className="text-lg font-black text-brand-yellow font-mono mt-1">
              {formatCurrency(submission.net_tax_payable || 0)}
            </p>
          </div>

          {/* Existing slip link */}
          {submission.payment_slip_url && (
            <div className="flex items-center gap-2 text-xs text-brand-success bg-brand-success/10 border border-brand-success/20 rounded-lg px-3 py-2">
              <Paperclip size={12} />
              <span>Payment slip already attached.</span>
              <a href={submission.payment_slip_url} target="_blank" rel="noreferrer"
                className="underline ml-auto flex items-center gap-1 hover:text-white transition-colors">
                View <ExternalLink size={10} />
              </a>
            </div>
          )}

          {/* File upload */}
          <div>
            <p className="text-xs text-brand-gray mb-2 uppercase tracking-wider">
              Attach Payment Slip <span className="normal-case">(PDF / Image — optional)</span>
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFile}
            />
            {slip ? (
              <div className="flex items-center gap-2 bg-brand-black rounded-lg px-3 py-2 border border-brand-yellow/30">
                <Paperclip size={14} className="text-brand-yellow flex-shrink-0" />
                <span className="text-xs text-white truncate flex-1">{slip.name}</span>
                <button onClick={() => setSlip(null)} className="text-brand-gray hover:text-white">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current.click()}
                className="w-full border border-dashed border-brand-gray-border rounded-lg px-4 py-3 text-xs text-brand-gray hover:border-brand-yellow/40 hover:text-brand-yellow transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={14} /> Click to attach payment slip
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="btn-primary flex-1 text-sm"
            >
              {isPending ? 'Confirming…' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AccountsDashboard() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [modalSub, setModalSub] = useState(null)

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['accounts-queue'],
    queryFn: () => api.get('/tax/submissions/accounts-queue/').then(r => r.data),
    refetchInterval: 30000,
  })

  const confirmPayment = useMutation({
    mutationFn: ({ submissionId, slip }) => {
      const form = new FormData()
      form.append('payment_status', 'paid')
      if (slip) form.append('payment_slip', slip)
      return api.patch(`/tax/submissions/${submissionId}/payment-status/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      toast.success('Payment confirmed! Consultant has been notified.')
      qc.invalidateQueries(['accounts-queue'])
      setModalSub(null)
    },
    onError: () => toast.error('Failed to confirm payment'),
  })

  const awaitingConfirmation = queue.filter(s => s.status === 'awaiting_confirmation')
  const confirmed = queue.filter(s => s.status === 'confirmed')

  return (
    <div className="animate-fade-in">
      {modalSub && (
        <ConfirmPaymentModal
          submission={modalSub}
          onClose={() => setModalSub(null)}
          isPending={confirmPayment.isPending}
          onConfirm={(slip) => confirmPayment.mutate({ submissionId: modalSub.id, slip })}
        />
      )}

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
                <th className="text-left text-xs text-brand-gray uppercase tracking-wider px-4 py-3">Slip</th>
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
                  <td className="px-4 py-4">
                    {sub.payment_slip_url ? (
                      <a href={sub.payment_slip_url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand-success hover:underline">
                        <Paperclip size={11} /> View
                      </a>
                    ) : (
                      <span className="text-xs text-brand-gray/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-brand-gray">
                    {sub.submitted_at ? formatDate(sub.submitted_at) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setModalSub(sub)}
                      disabled={confirmPayment.isPending}
                      className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                    >
                      <CheckCircle size={13} /> Confirm Payment
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
              Once you confirm payment, the assigned consultant will be notified and can proceed to submit the final tax return to the client. You can optionally attach the payment slip for record-keeping.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
