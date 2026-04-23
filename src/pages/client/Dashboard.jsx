import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { formatCurrency, formatDateTime, STATUS_LABELS, STATUS_COLORS } from '../../utils/format'
import StatusBadge from '../../components/common/StatusBadge'
import PageHeader from '../../components/common/PageHeader'
import {
  FileText, Plus, Clock, CheckCircle, AlertCircle, ArrowRight,
  TrendingUp, Calendar, Bell, ChevronRight, Lock, Unlock, Download
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => api.get('/tax/submissions/').then(r => r.data),
  })

  const { data: taxYears = [] } = useQuery({
    queryKey: ['tax-years'],
    queryFn: () => api.get('/tax/years/').then(r => r.data),
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications/?unread=true').then(r => r.data),
  })

  const createSubmission = useMutation({
    mutationFn: (taxYearId) => api.post('/tax/submissions/', { tax_year: taxYearId }),
    onSuccess: (data) => {
      qc.invalidateQueries(['my-submissions'])
      navigate(`/client/tax-form/${data.data.id}`)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create submission'),
  })

  // Previous year access requests (Change 13)
  const { data: accessRequests = [] } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => api.get('/tax/access-requests/').then(r => r.data).catch(() => []),
  })

  const requestAccess = useMutation({
    mutationFn: (taxYearId) => api.post('/tax/access-requests/', { tax_year: taxYearId }),
    onSuccess: () => {
      toast.success('Access request submitted. Awaiting admin approval.')
      qc.invalidateQueries(['access-requests'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to submit request'),
  })

  const getAccessStatus = (yearId) => {
    const req = accessRequests.find(r => r.tax_year === yearId)
    return req?.status || null
  }

  const activeYear = taxYears.find(y => y.is_active)
  const currentSubmission = submissions.find(s => s.tax_year === activeYear?.id)

  async function downloadPdf(sub) {
    try {
      const res = await api.get(`/tax/submissions/${sub.id}/pdf/`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `Tax_Return_${sub.tax_year_label?.replace(/\//g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('PDF not available yet. Please wait for payment confirmation.')
    }
  }

  const statusIcon = (status) => {
    const icons = {
      draft: <FileText size={16} className="text-brand-gray" />,
      submitted: <Clock size={16} className="text-brand-info" />,
      info_requested: <AlertCircle size={16} className="text-brand-red" />,
      awaiting_confirmation: <Bell size={16} className="text-brand-yellow" />,
      confirmed: <CheckCircle size={16} className="text-brand-success" />,
      archived: <CheckCircle size={16} className="text-brand-success" />,
    }
    return icons[status] || <FileText size={16} className="text-brand-gray" />
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.full_name?.split(' ')[0] || 'Client'}`}
        subtitle="Manage your personal income tax submissions"
      />

      {/* Info request alert */}
      {currentSubmission?.status === 'info_requested' && (
        <div className="mb-6 bg-brand-red/10 border border-brand-red/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
          <AlertCircle size={18} className="text-brand-red flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Action Required</p>
            <p className="text-sm text-brand-gray mt-0.5">{currentSubmission.info_request_message}</p>
            <button
              onClick={() => navigate(`/client/tax-form/${currentSubmission.id}`)}
              className="btn-danger mt-3 text-xs"
            >
              Update Submission <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Awaiting confirmation — payment notice only, no tax figures */}
      {currentSubmission?.status === 'awaiting_confirmation' && (
        <div className="mb-6 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
          <Bell size={18} className="text-brand-yellow flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Payment Required</p>
            <p className="text-sm text-brand-gray mt-0.5">
              Your tax return for <span className="text-white">{currentSubmission.tax_year_label}</span> has been processed.
              Please contact the office to arrange payment.
            </p>
            <button
              onClick={() => navigate(`/client/confirm/${currentSubmission.id}`)}
              className="btn-primary mt-3 text-xs"
            >
              View Payment Notice <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmed — awaiting accounts payment confirmation */}
      {currentSubmission?.status === 'confirmed' && (
        <div className="mb-6 bg-blue-400/10 border border-blue-400/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
          <Clock size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Awaiting Payment Confirmation</p>
            <p className="text-sm text-brand-gray mt-0.5">
              Your payment notice has been acknowledged. Accounts Division is confirming your payment. Your consultant will notify you once finalised.
            </p>
          </div>
        </div>
      )}

      {/* Awaiting client review — full tax computation ready */}
      {currentSubmission?.status === 'awaiting_client_review' && (
        <div className="mb-6 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
          <FileText size={18} className="text-brand-yellow flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Action Required — Review Your Tax Return</p>
            <p className="text-sm text-brand-gray mt-0.5">
              Your tax computation for <span className="text-white">{currentSubmission.tax_year_label}</span> is ready. Please review and confirm.
            </p>
            <button
              onClick={() => navigate(`/client/confirm/${currentSubmission.id}`)}
              className="btn-primary mt-3 text-xs"
            >
              Review &amp; Confirm <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Client confirmed — waiting for consultant to archive */}
      {currentSubmission?.status === 'client_confirmed' && (
        <div className="mb-6 bg-brand-success/10 border border-brand-success/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
          <CheckCircle size={18} className="text-brand-success flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Tax Return Confirmed</p>
            <p className="text-sm text-brand-gray mt-0.5">
              You have confirmed your tax return. Your consultant will finalise and archive it shortly.
            </p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-yellow/15 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-brand-yellow" />
          </div>
          <div>
            <p className="text-xs text-brand-gray uppercase tracking-wider">Total Submissions</p>
            <p className="text-2xl font-bold text-white">{submissions.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-success/15 rounded-xl flex items-center justify-center">
            <CheckCircle size={20} className="text-brand-success" />
          </div>
          <div>
            <p className="text-xs text-brand-gray uppercase tracking-wider">Archived</p>
            <p className="text-2xl font-bold text-white">
              {submissions.filter(s => s.status === 'archived').length}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-red/15 rounded-xl flex items-center justify-center">
            <Bell size={20} className="text-brand-red" />
          </div>
          <div>
            <p className="text-xs text-brand-gray uppercase tracking-wider">Notifications</p>
            <p className="text-2xl font-bold text-white">{notifications.length}</p>
          </div>
        </div>
      </div>

      {/* Current Year */}
      <div className="card mb-6">
        <div className="section-header">
          <Calendar size={18} className="text-brand-yellow" />
          Current Year of Assessment
        </div>

        {activeYear && (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-white">{activeYear.label}</p>
                <p className="text-sm text-brand-gray">{activeYear.assessment_year_start} — {activeYear.assessment_year_end}</p>
              </div>
              <div>
                {currentSubmission ? (
                  <div className="flex items-center gap-3">
                    <StatusBadge status={currentSubmission.status} />
                    {['draft', 'info_requested'].includes(currentSubmission.status) && (
                      <button
                        onClick={() => navigate(`/client/tax-form/${currentSubmission.id}`)}
                        className="btn-primary"
                      >
                        Continue Form <ArrowRight size={14} />
                      </button>
                    )}
                    {currentSubmission.status === 'awaiting_client_review' && (
                      <button
                        onClick={() => navigate(`/client/confirm/${currentSubmission.id}`)}
                        className="btn-primary"
                      >
                        Review &amp; Confirm <ChevronRight size={14} />
                      </button>
                    )}
                    {['client_confirmed', 'archived'].includes(currentSubmission.status) && (
                      <button
                        onClick={() => downloadPdf(currentSubmission)}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Download size={14} /> Download PDF
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => createSubmission.mutate(activeYear.id)}
                    disabled={createSubmission.isPending}
                    className="btn-primary"
                  >
                    <Plus size={15} /> Start Tax Form
                  </button>
                )}
              </div>
            </div>

            {currentSubmission && !['awaiting_confirmation', 'confirmed'].includes(currentSubmission.status) && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-brand-black-soft rounded-lg p-3">
                  <p className="text-xs text-brand-gray">Total Assessable Income</p>
                  <p className="text-base font-semibold text-white font-mono">
                    {formatCurrency(currentSubmission.total_assessable_income)}
                  </p>
                </div>
                <div className="bg-brand-black-soft rounded-lg p-3">
                  <p className="text-xs text-brand-gray">Net Tax Payable</p>
                  <p className="text-base font-semibold text-brand-yellow font-mono">
                    {formatCurrency(currentSubmission.net_tax_payable)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission History */}
      {submissions.length > 0 && (
        <div className="card">
          <div className="section-header">
            <TrendingUp size={18} className="text-brand-yellow" />
            Submission History
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header rounded-tl-lg text-left">Year</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-right">Income</th>
                  <th className="table-header text-right">Tax Payable</th>
                  <th className="table-header text-right rounded-tr-lg">Submitted</th>
                  <th className="table-header text-center rounded-tr-lg">PDF</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => {
                  const paymentPending = ['awaiting_confirmation', 'confirmed'].includes(sub.status)
                  return (
                    <tr
                      key={sub.id}
                      className="table-row cursor-pointer"
                      onClick={() => {
                        if (['draft', 'info_requested'].includes(sub.status)) navigate(`/client/tax-form/${sub.id}`)
                        else if (['awaiting_confirmation', 'awaiting_client_review'].includes(sub.status)) navigate(`/client/confirm/${sub.id}`)
                      }}
                    >
                      <td className="table-cell font-medium">{sub.tax_year_label}</td>
                      <td className="table-cell"><StatusBadge status={sub.status} /></td>
                      <td className="table-cell text-right font-mono text-brand-gray">
                        {paymentPending ? '—' : formatCurrency(sub.total_assessable_income)}
                      </td>
                      <td className="table-cell text-right font-mono text-brand-yellow">
                        {paymentPending ? '—' : formatCurrency(sub.net_tax_payable)}
                      </td>
                      <td className="table-cell text-right text-brand-gray text-xs">{formatDateTime(sub.submitted_at)}</td>
                      <td className="table-cell text-center">
                        {sub.payment_status === 'paid' && (
                          <button
                            onClick={e => { e.stopPropagation(); downloadPdf(sub) }}
                            className="text-brand-yellow hover:opacity-80 transition-opacity"
                            title="Download PDF"
                          >
                            <Download size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Previous Assessment Years */}
      {taxYears.filter(y => !y.is_active).length > 0 && (
        <div className="mt-6">
          <h2 className="section-header mb-3"><Lock size={15} className="text-brand-gray" />Previous Assessment Years</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {taxYears.filter(y => !y.is_active).map(ty => {
              const existing = submissions.find(s => s.tax_year === ty.id)
              const accessStatus = getAccessStatus(ty.id)
              const isApproved = accessStatus === 'approved'

              return (
                <div key={ty.id} className="card border border-brand-gray-border relative overflow-hidden">

                  {/* Locked — no request yet */}
                  {!existing && !accessStatus && (
                    <div className="absolute inset-0 bg-brand-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                      <Lock size={20} className="text-brand-gray mb-2" />
                      <p className="text-xs text-brand-gray text-center mb-3 px-4">You don't have access to this year's data</p>
                      <button
                        onClick={() => requestAccess.mutate(ty.id)}
                        disabled={requestAccess.isPending}
                        className="btn-primary text-xs py-1.5 px-4"
                      >
                        Request Access
                      </button>
                    </div>
                  )}

                  {/* Pending approval */}
                  {!existing && accessStatus === 'pending' && (
                    <div className="absolute inset-0 bg-brand-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                      <Clock size={20} className="text-brand-yellow mb-2" />
                      <p className="text-xs text-brand-yellow font-semibold">Pending Approval</p>
                      <p className="text-xs text-brand-gray mt-1 text-center px-4">Your access request is being reviewed</p>
                    </div>
                  )}

                  {/* Denied */}
                  {!existing && accessStatus === 'denied' && (
                    <div className="absolute inset-0 bg-brand-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                      <AlertCircle size={20} className="text-brand-red mb-2" />
                      <p className="text-xs text-brand-red font-semibold">Access Denied</p>
                      <button
                        onClick={() => requestAccess.mutate(ty.id)}
                        className="mt-2 btn-ghost text-xs py-1 px-3"
                      >
                        Request Again
                      </button>
                    </div>
                  )}

                  {/* Card content */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white">{ty.label}</p>
                    {(existing || isApproved)
                      ? <Unlock size={14} className="text-brand-success" />
                      : <Lock size={14} className="text-brand-gray" />
                    }
                  </div>

                  {existing ? (
                    /* Submission exists — show status and action */
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <StatusBadge status={existing.status} />
                        {['draft', 'info_requested'].includes(existing.status) && (
                          <button
                            onClick={() => navigate(`/client/tax-form/${existing.id}`)}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            Continue <ArrowRight size={11} />
                          </button>
                        )}
                        {existing.status === 'awaiting_client_review' && (
                          <button
                            onClick={() => navigate(`/client/confirm/${existing.id}`)}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            Review <ChevronRight size={11} />
                          </button>
                        )}
                        {['client_confirmed', 'archived'].includes(existing.status) && (
                          <button
                            onClick={() => downloadPdf(existing)}
                            className="btn-primary text-xs py-1 px-3 flex items-center gap-1"
                          >
                            <Download size={11} /> PDF
                          </button>
                        )}
                      </div>
                      {!['awaiting_confirmation', 'confirmed'].includes(existing.status) && parseFloat(existing.net_tax_payable) > 0 && (
                        <p className="text-xs text-brand-gray">Net Tax: <span className="font-mono text-brand-yellow">{formatCurrency(existing.net_tax_payable)}</span></p>
                      )}
                    </>
                  ) : isApproved ? (
                    /* Approved but no submission yet — let client start */
                    <div className="mt-1">
                      <p className="text-xs text-brand-success mb-2">Access approved — start your submission</p>
                      <button
                        onClick={() => createSubmission.mutate(ty.id)}
                        disabled={createSubmission.isPending}
                        className="btn-primary text-xs py-1.5 w-full justify-center"
                      >
                        <Plus size={12} /> Start Tax Form
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-brand-gray">No submission for this year</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
