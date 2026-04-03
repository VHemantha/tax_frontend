import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { formatCurrency, formatDateTime, STATUS_LABELS, STATUS_COLORS } from '../../utils/format'
import StatusBadge from '../../components/common/StatusBadge'
import PageHeader from '../../components/common/PageHeader'
import {
  FileText, Plus, Clock, CheckCircle, AlertCircle, ArrowRight,
  TrendingUp, Calendar, Bell, ChevronRight
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

  const activeYear = taxYears.find(y => y.is_active)
  const currentSubmission = submissions.find(s => s.tax_year === activeYear?.id)

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

      {/* Awaiting confirmation alert */}
      {currentSubmission?.status === 'awaiting_confirmation' && (
        <div className="mb-6 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
          <Bell size={18} className="text-brand-yellow flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Tax Calculation Ready</p>
            <p className="text-sm text-brand-gray mt-0.5">
              Your consultant has completed the tax calculation. Net Tax Payable:{' '}
              <span className="text-white font-semibold">{formatCurrency(currentSubmission.net_tax_payable)}</span>
            </p>
            <button
              onClick={() => navigate(`/client/confirm/${currentSubmission.id}`)}
              className="btn-primary mt-3 text-xs"
            >
              Review & Confirm <ChevronRight size={12} />
            </button>
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

            {currentSubmission && (
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
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr
                    key={sub.id}
                    className="table-row cursor-pointer"
                    onClick={() => ['draft', 'info_requested'].includes(sub.status)
                      ? navigate(`/client/tax-form/${sub.id}`)
                      : sub.status === 'awaiting_confirmation'
                      ? navigate(`/client/confirm/${sub.id}`)
                      : null
                    }
                  >
                    <td className="table-cell font-medium">{sub.tax_year_label}</td>
                    <td className="table-cell"><StatusBadge status={sub.status} /></td>
                    <td className="table-cell text-right font-mono">{formatCurrency(sub.total_assessable_income)}</td>
                    <td className="table-cell text-right font-mono text-brand-yellow">{formatCurrency(sub.net_tax_payable)}</td>
                    <td className="table-cell text-right text-brand-gray text-xs">{formatDateTime(sub.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
