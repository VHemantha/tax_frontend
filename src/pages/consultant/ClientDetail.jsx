import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { formatCurrency, formatDateTime } from '../../utils/format'
import StatusBadge from '../../components/common/StatusBadge'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import {
  ArrowLeft, Calculator, MessageSquare, FileText, Download,
  CheckCircle, Eye, ExternalLink, Send, Archive
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientDetail() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [infoModal, setInfoModal] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => api.get(`/clients/${clientId}/`).then(r => r.data),
  })

  const { data: submissions = [] } = useQuery({
    queryKey: ['client-submissions', clientId, client?.user_id],
    queryFn: () => api.get('/tax/submissions/').then(r => r.data.filter(s => s.client === client?.user_id)),
    enabled: !!client?.user_id,
  })

  const latestSubmission = submissions[0]

  const requestInfo = useMutation({
    mutationFn: () => api.post(`/tax/submissions/${latestSubmission.id}/request-info/`, { message: infoMessage }),
    onSuccess: () => {
      toast.success('Information request sent to client')
      setInfoModal(false)
      setInfoMessage('')
      qc.invalidateQueries(['client-submissions', clientId])
    },
    onError: () => toast.error('Failed to send request'),
  })

  async function downloadPDF(submissionId) {
    try {
      const response = await api.get(`/tax/submissions/${submissionId}/pdf/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `Tax_Return_${latestSubmission?.tax_year_label}.pdf`
      a.click()
    } catch { toast.error('Failed to download PDF') }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <button onClick={() => navigate('/consultant/clients')} className="btn-ghost text-sm mb-4">
          <ArrowLeft size={15} /> Back to Clients
        </button>
        <PageHeader
          title={client?.full_name || 'Client'}
          subtitle={client?.email}
          actions={
            <div className="flex gap-2">
              {latestSubmission && ['submitted', 'under_review'].includes(latestSubmission.status) && (
                <button onClick={() => setInfoModal(true)} className="btn-secondary">
                  <MessageSquare size={15} /> Request Info
                </button>
              )}
              {latestSubmission && ['submitted', 'under_review', 'info_requested'].includes(latestSubmission.status) && (
                <button
                  onClick={() => navigate(`/consultant/submissions/${latestSubmission.id}/calculate`)}
                  className="btn-primary"
                >
                  <Calculator size={15} /> Calculate Tax
                </button>
              )}
              {latestSubmission?.status === 'confirmed' && latestSubmission?.payment_status === 'paid' && (
                <button
                  onClick={() => navigate(`/consultant/submissions/${latestSubmission.id}/calculate`)}
                  className="btn-primary bg-brand-success border-brand-success hover:opacity-90"
                >
                  <Send size={15} /> Send Tax Form to Client
                </button>
              )}
              {latestSubmission?.status === 'confirmed' && latestSubmission?.payment_status !== 'paid' && (
                <button
                  onClick={() => navigate(`/consultant/submissions/${latestSubmission.id}/calculate`)}
                  className="btn-secondary border-orange-500/50 text-orange-400"
                >
                  <Eye size={15} /> Awaiting Payment
                </button>
              )}
              {latestSubmission?.status === 'awaiting_client_review' && (
                <button
                  onClick={() => navigate(`/consultant/submissions/${latestSubmission.id}/calculate`)}
                  className="btn-secondary border-blue-400/50 text-blue-400"
                >
                  <Eye size={15} /> Awaiting Client Review
                </button>
              )}
              {latestSubmission?.status === 'client_confirmed' && (
                <button
                  onClick={() => navigate(`/consultant/submissions/${latestSubmission.id}/calculate`)}
                  className="btn-primary bg-brand-success border-brand-success hover:opacity-90"
                >
                  <Archive size={15} /> Mark Complete &amp; Archive
                </button>
              )}
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="card">
          <h3 className="section-header">Client Profile</h3>
          <div className="space-y-3">
            {[
              ['Status', <StatusBadge status={client?.status} />],
              ['TIN', client?.tin || '—'],
              ['PIN', client?.pin || '—'],
              ['NIC/Passport', client?.nic_passport || '—'],
              ['Telephone', client?.telephone || '—'],
              ['Mobile', client?.mobile || '—'],
              ['Registered', formatDateTime(client?.created_at)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-start">
                <span className="text-xs text-brand-gray">{label}</span>
                <span className="text-sm text-white font-medium text-right max-w-[60%]">
                  {typeof value === 'string' ? value : value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Submissions */}
        <div className="lg:col-span-2 space-y-4">
          {submissions.length === 0 ? (
            <div className="card text-center py-12">
              <FileText size={32} className="mx-auto text-brand-gray mb-3 opacity-40" />
              <p className="text-brand-gray">No submissions yet</p>
            </div>
          ) : (
            submissions.map(sub => (
              <div key={sub.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-white">{sub.tax_year_label}</h4>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div className="flex gap-2">
                    {['calculation_done', 'awaiting_confirmation', 'confirmed', 'archived'].includes(sub.status) && (
                      <button onClick={() => downloadPDF(sub.id)} className="btn-secondary text-xs px-3 py-1.5">
                        <Download size={13} /> PDF
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/consultant/submissions/${sub.id}/calculate`)}
                      className="btn-ghost text-xs"
                    >
                      <Eye size={13} /> View
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['Assessable Income', formatCurrency(sub.total_assessable_income)],
                    ['Net Taxable', formatCurrency(sub.net_taxable_income)],
                    ['Tax Credits', formatCurrency(sub.total_tax_credits)],
                    ['Net Tax Payable', formatCurrency(sub.net_tax_payable)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-brand-black-soft rounded-lg p-3">
                      <p className="text-xs text-brand-gray">{label}</p>
                      <p className="text-sm font-semibold text-white font-mono mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {sub.info_request_message && (
                  <div className="mt-3 bg-brand-red/10 border border-brand-red/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-brand-red font-medium">Info Requested:</p>
                    <p className="text-xs text-brand-gray mt-0.5">{sub.info_request_message}</p>
                  </div>
                )}
                {sub.status === 'confirmed' && sub.payment_status !== 'paid' && (
                  <div className="mt-3 bg-orange-400/10 border border-orange-400/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-orange-400 font-medium">⏳ Awaiting payment confirmation from Accounts Division</p>
                  </div>
                )}
                {sub.status === 'confirmed' && sub.payment_status === 'paid' && (
                  <div className="mt-3 bg-brand-success/10 border border-brand-success/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-brand-success font-medium">✓ Payment confirmed — Send the tax form to client for review</p>
                  </div>
                )}
                {sub.status === 'awaiting_client_review' && (
                  <div className="mt-3 bg-blue-400/10 border border-blue-400/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-blue-400 font-medium">⏳ Tax form sent — Awaiting client review and confirmation</p>
                  </div>
                )}
                {sub.status === 'client_confirmed' && (
                  <div className="mt-3 bg-brand-success/10 border border-brand-success/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-brand-success font-medium">✓ Client confirmed — Ready to mark complete and archive</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Request Info Modal */}
      <Modal isOpen={infoModal} onClose={() => setInfoModal(false)} title="Request Additional Information">
        <div className="space-y-4">
          <p className="text-sm text-brand-gray">
            Specify what information or documents you need from{' '}
            <span className="text-white">{client?.full_name}</span>.
          </p>
          <div>
            <label className="input-label">Message to Client <span className="text-brand-red">*</span></label>
            <textarea
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              rows={4}
              placeholder="e.g., Please provide the T10 certificate from your employer..."
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setInfoModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => requestInfo.mutate()}
              disabled={!infoMessage.trim() || requestInfo.isPending}
              className="btn-primary"
            >
              <MessageSquare size={14} /> Send Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
