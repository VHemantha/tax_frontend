import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import { CheckCircle, Banknote, Phone, ArrowLeft, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientConfirmation() {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => api.get(`/tax/submissions/${submissionId}/`).then(r => r.data),
  })

  const acknowledgeMutation = useMutation({
    mutationFn: () => api.post(`/tax/submissions/${submissionId}/client-confirm/`),
    onSuccess: () => {
      toast.success('Acknowledged. Accounts Division will confirm your payment shortly.')
      qc.invalidateQueries(['my-submissions'])
      navigate('/client/dashboard')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (submission?.status === 'confirmed') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Clock size={48} className="text-brand-yellow opacity-60" />
        <p className="text-white text-lg font-semibold">Awaiting Payment Confirmation</p>
        <p className="text-sm text-brand-gray">Accounts Division is confirming your payment. Your consultant will notify you once complete.</p>
        <button onClick={() => navigate('/client/dashboard')} className="btn-primary">Back to Dashboard</button>
      </div>
    )
  }

  if (submission?.status !== 'awaiting_confirmation') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <CheckCircle size={48} className="text-brand-success" />
        <p className="text-white text-lg font-semibold">No pending action</p>
        <button onClick={() => navigate('/client/dashboard')} className="btn-primary">Back to Dashboard</button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button onClick={() => navigate('/client/dashboard')} className="btn-ghost mb-4 text-sm">
        <ArrowLeft size={15} /> Back to Dashboard
      </button>

      <PageHeader
        title="Payment Required"
        subtitle={`Tax Return ${submission?.tax_year_label}`}
      />

      {/* Payment notice card */}
      <div className="card mb-6 border-brand-yellow/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-brand-yellow/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Banknote size={22} className="text-brand-yellow" />
          </div>
          <div>
            <p className="text-base font-bold text-white">Your Tax Return Has Been Processed</p>
            <p className="text-sm text-brand-gray">A payment is required to finalise your submission.</p>
          </div>
        </div>

        <div className="bg-brand-black rounded-xl p-4 space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-yellow mt-1.5 flex-shrink-0" />
            <p className="text-brand-gray">Your tax return for <span className="text-white">{submission?.tax_year_label}</span> has been reviewed and processed by your consultant.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-yellow mt-1.5 flex-shrink-0" />
            <p className="text-brand-gray">Please contact the office to arrange payment. Our Accounts Division will confirm receipt of payment.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-yellow mt-1.5 flex-shrink-0" />
            <p className="text-brand-gray">Once payment is confirmed, your consultant will submit the final return and you will be notified.</p>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="card mb-6 bg-brand-black-soft border-brand-gray-border">
        <div className="flex items-center gap-2 mb-3">
          <Phone size={15} className="text-brand-yellow" />
          <p className="text-sm font-semibold text-white">Contact Accounts Division</p>
        </div>
        <p className="text-sm text-brand-gray">Please reach out to your assigned consultant or the accounts office to make the necessary payment arrangements.</p>
      </div>

      {/* Acknowledge button */}
      <div className="card">
        <p className="text-sm text-brand-gray mb-4">
          Click below to acknowledge that you have received this payment notice. This does not complete your submission — payment confirmation by Accounts Division is still required.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => navigate('/client/dashboard')} className="btn-secondary">
            Later
          </button>
          <button
            onClick={() => acknowledgeMutation.mutate()}
            disabled={acknowledgeMutation.isPending}
            className="btn-primary"
          >
            {acknowledgeMutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <><CheckCircle size={15} /> Acknowledge Payment Notice</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
