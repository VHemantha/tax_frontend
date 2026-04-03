import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { formatCurrency, formatDateTime } from '../../utils/format'
import StatusBadge from '../../components/common/StatusBadge'
import PageHeader from '../../components/common/PageHeader'
import {
  Users, FileText, Clock, CheckCircle, AlertCircle, TrendingUp,
  ArrowRight, UserPlus, Bell, BarChart3
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export default function ConsultantDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/clients/dashboard/stats/').then(r => r.data),
  })

  const { data: submissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => api.get('/tax/submissions/').then(r => r.data),
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications/?unread=true').then(r => r.data),
  })

  const statCards = [
    { label: 'Total Clients', value: stats?.total_clients || 0, icon: Users, color: 'text-brand-yellow', bg: 'bg-brand-yellow/10' },
    { label: 'Pending Review', value: stats?.pending_review || 0, icon: Clock, color: 'text-brand-yellow-muted', bg: 'bg-brand-yellow/10' },
    { label: 'Awaiting Confirmation', value: stats?.awaiting_confirmation || 0, icon: Bell, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Archived', value: stats?.archived || 0, icon: CheckCircle, color: 'text-brand-success', bg: 'bg-brand-success/10' },
  ]

  const chartData = [
    { name: 'Not Started', value: stats?.not_started || 0, fill: '#374151' },
    { name: 'In Progress', value: stats?.in_progress || 0, fill: '#3B82F6' },
    { name: 'Pending Review', value: stats?.pending_review || 0, fill: '#F59E0B' },
    { name: 'Awaiting', value: stats?.awaiting_confirmation || 0, fill: '#F97316' },
    { name: 'Archived', value: stats?.archived || 0, fill: '#10B981' },
  ]

  const pendingSubmissions = submissions.filter(s =>
    ['submitted', 'under_review', 'awaiting_confirmation'].includes(s.status)
  ).slice(0, 8)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Good ${getGreeting()}, ${user?.full_name?.split(' ')[0] || 'Consultant'}`}
        subtitle="Tax Consultant Dashboard — Y/A 2025/2026"
        actions={
          <button onClick={() => navigate('/consultant/clients/register')} className="btn-primary">
            <UserPlus size={15} /> Register Client
          </button>
        }
      />

      {/* Unread notifications */}
      {notifications.length > 0 && (
        <div className="mb-6 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-4 flex items-start gap-3">
          <Bell size={16} className="text-brand-yellow flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">{notifications.length} unread notification{notifications.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-brand-gray mt-0.5">{notifications[0]?.message}</p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card hover:border-brand-yellow/30 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">{label}</p>
                <p className="text-3xl font-black text-white">{value}</p>
              </div>
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Chart */}
        <div className="card lg:col-span-2">
          <h3 className="section-header">
            <BarChart3 size={16} className="text-brand-yellow" />
            Client Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
                cursor={{ fill: 'rgba(245,197,24,0.05)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending actions */}
        <div className="card lg:col-span-3">
          <h3 className="section-header flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertCircle size={16} className="text-brand-yellow" />Pending Actions</span>
            <button onClick={() => navigate('/consultant/clients')} className="text-xs text-brand-yellow hover:opacity-80">
              View All <ArrowRight size={12} className="inline" />
            </button>
          </h3>

          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={32} className="mx-auto text-brand-success mb-2 opacity-60" />
              <p className="text-sm text-brand-gray">No pending actions — all caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingSubmissions.map(sub => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between bg-brand-black-soft hover:bg-brand-black-mid rounded-lg px-4 py-3 cursor-pointer transition-colors"
                  onClick={() => navigate(`/consultant/submissions/${sub.id}/calculate`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-yellow/10 rounded-full flex items-center justify-center">
                      <Users size={14} className="text-brand-yellow" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{sub.client_name}</p>
                      <p className="text-xs text-brand-gray">{sub.tax_year_label} · {formatDateTime(sub.submitted_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={sub.status} />
                    <ArrowRight size={14} className="text-brand-gray" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
