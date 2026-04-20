import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import {
  Users, Clock, CheckCircle, Bell, TrendingUp, ArrowRight,
  UserPlus, BarChart3, ShieldCheck, User
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'

export default function SuperAdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: () => api.get('/clients/super-admin/stats/').then(r => r.data),
  })

  const overall = data?.overall || {}
  const consultants = data?.consultants || []

  const overallCards = [
    { label: 'Total Consultants', value: overall.total_consultants || 0, icon: ShieldCheck, color: 'text-brand-yellow', bg: 'bg-brand-yellow/10' },
    { label: 'Total Clients', value: overall.total_clients || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Pending Review', value: overall.pending_review || 0, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Archived', value: overall.archived || 0, icon: CheckCircle, color: 'text-brand-success', bg: 'bg-brand-success/10' },
  ]

  const chartData = consultants.map(c => ({
    name: c.name.split(' ')[0],
    fullName: c.name,
    'Not Started': c.not_started,
    'In Progress': c.in_progress,
    'Pending Review': c.pending_review,
    'Awaiting': c.awaiting_confirmation,
    'Archived': c.archived,
  }))

  const BAR_COLORS = ['#374151', '#3B82F6', '#F59E0B', '#F97316', '#10B981']

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome, ${user?.full_name?.split(' ')[0] || 'Admin'}`}
        subtitle="Super Admin Dashboard — Y/A 2025/2026"
        actions={
          <button onClick={() => navigate('/super-admin/clients/register')} className="btn-primary">
            <UserPlus size={15} /> Register Client
          </button>
        }
      />

      {/* Overall stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overallCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card hover:border-brand-yellow/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">{label}</p>
                <p className="text-3xl font-black text-white">{isLoading ? '—' : value}</p>
              </div>
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={18} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Per-consultant chart */}
      {consultants.length > 0 && (
        <div className="card mb-6">
          <h3 className="section-header">
            <BarChart3 size={16} className="text-brand-yellow" />
            Client Distribution by Consultant
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }}
                cursor={{ fill: 'rgba(245,197,24,0.05)' }}
                formatter={(value, name, props) => [value, name]}
                labelFormatter={(label) => {
                  const item = chartData.find(d => d.name === label)
                  return item?.fullName || label
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
              {['Not Started', 'In Progress', 'Pending Review', 'Awaiting', 'Archived'].map((key, i) => (
                <Bar key={key} dataKey={key} stackId="a" fill={BAR_COLORS[i]} radius={i === 4 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-consultant breakdown table */}
      <div className="card">
        <h3 className="section-header mb-4">
          <Users size={16} className="text-brand-yellow" />
          Consultant Breakdown
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : consultants.length === 0 ? (
          <p className="text-sm text-brand-gray text-center py-8">No consultants found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-gray-border">
                  <th className="text-left text-xs text-brand-gray uppercase tracking-wider pb-3 pr-4">Consultant</th>
                  <th className="text-center text-xs text-brand-gray uppercase tracking-wider pb-3 px-3">Total</th>
                  <th className="text-center text-xs text-brand-gray uppercase tracking-wider pb-3 px-3">Not Started</th>
                  <th className="text-center text-xs text-brand-gray uppercase tracking-wider pb-3 px-3">In Progress</th>
                  <th className="text-center text-xs text-brand-gray uppercase tracking-wider pb-3 px-3">Pending Review</th>
                  <th className="text-center text-xs text-brand-gray uppercase tracking-wider pb-3 px-3">Awaiting</th>
                  <th className="text-center text-xs text-brand-gray uppercase tracking-wider pb-3 pl-3">Archived</th>
                  <th className="pb-3 pl-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-border">
                {consultants.map(c => (
                  <tr key={c.id} className="hover:bg-brand-black-soft transition-colors group">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-brand-yellow" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{c.name}</p>
                          <p className="text-xs text-brand-gray">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-white font-bold">{c.total_clients}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-brand-gray">{c.not_started}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-blue-400">{c.in_progress}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-brand-yellow">{c.pending_review}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-orange-400">{c.awaiting_confirmation}</span>
                    </td>
                    <td className="py-3 pl-3 text-center">
                      <span className="text-brand-success">{c.archived}</span>
                    </td>
                    <td className="py-3 pl-4">
                      <button
                        onClick={() => navigate(`/super-admin/clients?consultant_id=${c.id}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-brand-yellow hover:opacity-80 flex items-center gap-1"
                      >
                        View <ArrowRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
