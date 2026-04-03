import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { formatCurrency } from '../../utils/format'
import PageHeader from '../../components/common/PageHeader'
import { CheckCircle, Download, AlertTriangle, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

function CalcRow({ label, value, indent, bold, highlight }) {
  return (
    <div className={`flex justify-between items-center py-2.5 border-b border-brand-gray-border last:border-0
                     ${highlight ? 'bg-brand-yellow/8 -mx-2 px-2 rounded-lg' : ''}
                     ${indent ? 'pl-6' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-white' : 'text-brand-gray'}`}>{label}</span>
      <span className={`font-mono text-sm ${highlight ? 'text-brand-yellow font-bold text-lg' : bold ? 'text-white font-semibold' : 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}

export default function ClientConfirmation() {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [agreed, setAgreed] = useState(false)

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => api.get(`/tax/submissions/${submissionId}/`).then(r => r.data),
  })

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/tax/submissions/${submissionId}/client-confirm/`),
    onSuccess: () => {
      toast.success('Tax submission confirmed and archived successfully!')
      qc.invalidateQueries(['my-submissions'])
      navigate('/client/dashboard')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Confirmation failed'),
  })

  async function downloadPDF() {
    try {
      const response = await api.get(`/tax/submissions/${submissionId}/pdf/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Tax_Return_${submission?.tax_year_label}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast.error('Failed to download PDF')
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (submission?.status !== 'awaiting_confirmation') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <CheckCircle size={48} className="text-brand-success" />
        <p className="text-white text-lg font-semibold">No pending confirmation</p>
        <button onClick={() => navigate('/client/dashboard')} className="btn-primary">Go to Dashboard</button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title="Review Tax Calculation"
        subtitle="Your consultant has completed the tax calculation. Please review and confirm."
      />

      {/* Consultant notes if any */}
      {submission?.consultant_notes && (
        <div className="card mb-6 border-brand-yellow/30">
          <p className="text-xs text-brand-yellow font-semibold uppercase tracking-wider mb-2">Consultant Notes</p>
          <p className="text-sm text-brand-gray">{submission.consultant_notes}</p>
        </div>
      )}

      {/* Tax Calculation Summary */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-header mb-0">
            <TrendingUp size={18} className="text-brand-yellow" />
            Tax Calculation — {submission?.tax_year_label}
          </h3>
          <button onClick={downloadPDF} className="btn-secondary text-xs px-3 py-1.5">
            <Download size={13} /> Download PDF
          </button>
        </div>

        <div className="space-y-0">
          <CalcRow label="Total Assessable Income" value={formatCurrency(submission?.total_assessable_income)} bold />
          <CalcRow label="Less: Qualifying Payments" value={`(${formatCurrency(submission?.total_qualifying_payments)})`} indent />
          <CalcRow label="Less: Personal Relief" value={`(${formatCurrency(submission?.personal_relief)})`} indent />
          <CalcRow label="Less: Rent Relief (25%)" value={`(${formatCurrency(submission?.rent_relief)})`} indent />
          <CalcRow label="NET TAXABLE INCOME" value={formatCurrency(submission?.net_taxable_income)} bold />

          <div className="py-2" />
          <CalcRow label="Gross Tax" value={formatCurrency(submission?.gross_tax)} />
          <CalcRow label="Less: Total Tax Credits" value={`(${formatCurrency(submission?.total_tax_credits)})`} indent />

          <div className="mt-2 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-white">NET TAX PAYABLE</span>
              <span className="text-2xl font-black text-brand-yellow font-mono">
                {formatCurrency(submission?.net_tax_payable)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle size={16} className="text-brand-yellow flex-shrink-0 mt-0.5" />
        <p className="text-sm text-brand-gray">
          By confirming, you agree that the above tax calculation is accurate. The system will
          <span className="text-white"> automatically archive all documents</span> in the folder:
          <br />
          <code className="text-brand-yellow text-xs mt-1 block">
            {submission?.client_name} / {submission?.tax_year_label} / Final TAX Submission /
          </code>
        </p>
      </div>

      {/* Confirmation */}
      <div className="card">
        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-brand-yellow"
          />
          <span className="text-sm text-brand-gray">
            I have reviewed the tax calculation above and confirm that all information is correct.
            I consent to the archiving of all submitted documents and tax records.
          </span>
        </label>

        <div className="flex gap-3 justify-end">
          <button onClick={() => navigate('/client/dashboard')} className="btn-secondary">
            Review Later
          </button>
          <button
            onClick={() => confirmMutation.mutate()}
            disabled={!agreed || confirmMutation.isPending}
            className="btn-primary"
          >
            {confirmMutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                Confirming...
              </>
            ) : (
              <><CheckCircle size={15} /> Confirm & Archive</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
