import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { formatCurrency, formatCurrencyInt, formatDate, PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS } from '../../utils/format'
import StatusBadge from '../../components/common/StatusBadge'
import PageHeader from '../../components/common/PageHeader'
import {
  ArrowLeft, Calculator, Send, FileText, Eye, Download,
  CheckCircle, Pencil, Save, X, ChevronDown, ChevronRight,
  User, DollarSign, Home, Banknote, TrendingUp, Trash2, Plus,
  History
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ─── Static display helpers ─── */
function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-brand-gray-border last:border-0">
      <span className="text-xs text-brand-gray">{label}</span>
      <span className="text-sm text-white font-medium text-right max-w-[60%]">{value || '—'}</span>
    </div>
  )
}

function AmountRow({ label, value, highlight, sub }) {
  if (value === null || value === undefined || parseFloat(value) === 0) return null
  return (
    <div className={`flex justify-between items-center py-2 border-b border-brand-gray-border last:border-0 ${sub ? 'pl-4' : ''} ${highlight ? 'bg-brand-yellow/5 px-2 rounded-lg -mx-2 mt-1' : ''}`}>
      <span className={`text-sm ${highlight ? 'font-semibold text-white' : 'text-brand-gray'}`}>{label}</span>
      <span className={`font-mono text-sm ${highlight ? 'text-brand-yellow font-bold' : 'text-white'}`}>{formatCurrency(value)}</span>
    </div>
  )
}

/* ─── Editable computation line ─── */
function EditableAmount({ label, value, fieldKey, onSave, indent, highlight }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  return (
    <div className={`flex justify-between items-center py-2.5 border-b border-brand-gray-border last:border-0 ${indent ? 'pl-6' : ''} ${highlight ? 'bg-brand-yellow/5 px-2 rounded-lg -mx-2' : ''}`}>
      {label && <span className={`text-sm ${highlight ? 'font-semibold text-white' : 'text-brand-gray'}`}>{label}</span>}
      <div className="flex items-center gap-2 ml-auto">
        {editing ? (
          <>
            <input value={draft} onChange={e => setDraft(e.target.value)} type="number" step="0.01"
              className="input-field text-right font-mono w-32 py-1 text-sm" autoFocus />
            <button onClick={() => { onSave(fieldKey, draft); setEditing(false) }} className="text-brand-success hover:opacity-80"><Save size={13} /></button>
            <button onClick={() => setEditing(false)} className="text-brand-gray hover:text-white"><X size={13} /></button>
          </>
        ) : (
          <>
            <span className={`font-mono text-sm ${highlight ? 'text-brand-yellow font-bold text-base' : 'text-white'}`}>{formatCurrency(value)}</span>
            <button onClick={() => { setDraft(value); setEditing(true) }} className="text-brand-gray hover:text-brand-yellow"><Pencil size={11} /></button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Collapsible section card ─── */
function Section({ title, icon: Icon, children, defaultOpen = false, badge, onEdit, editing }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 hover:bg-brand-black-soft transition-colors">
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 flex-1 text-left">
          {Icon && <Icon size={16} className="text-brand-yellow" />}
          <span className="font-semibold text-white text-sm">{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="text-xs bg-brand-yellow/10 text-brand-yellow px-2 py-0.5 rounded-full">{badge}</span>
          )}
          {open ? <ChevronDown size={15} className="text-brand-gray ml-1" /> : <ChevronRight size={15} className="text-brand-gray ml-1" />}
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className={`btn-ghost text-xs px-2 py-1 ml-2 ${editing ? 'text-brand-yellow' : 'text-brand-gray'}`}
            title={editing ? 'Cancel edit' : 'Edit section'}
          >
            {editing ? <X size={13} /> : <Pencil size={13} />}
            {editing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>
      {open && <div className="px-5 pb-5 border-t border-brand-gray-border">{children}</div>}
    </div>
  )
}

function SubHeading({ children }) {
  return <p className="text-xs text-brand-yellow font-semibold uppercase tracking-wider mt-4 mb-2 first:mt-3">{children}</p>
}

/* ─── Inline section edit form ─── */
function SectionEditForm({ fields, data, onSave, onCancel, saving }) {
  const [draft, setDraft] = useState(() => {
    const d = {}
    fields.forEach(f => { d[f.key] = data?.[f.key] ?? '' })
    return d
  })
  return (
    <div className="mt-3 bg-brand-black-soft rounded-xl p-4 border border-brand-yellow/20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-xs text-brand-gray mb-1 block">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea value={draft[f.key] || ''} onChange={e => setDraft(p => ({ ...p, [f.key]: e.target.value }))}
                rows={2} className="input-field resize-none text-sm" />
            ) : (
              <input type={f.type || 'text'} value={draft[f.key] || ''} step={f.type === 'number' ? '0.01' : undefined}
                onChange={e => setDraft(p => ({ ...p, [f.key]: e.target.value }))}
                className="input-field text-sm" />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(draft)} disabled={saving} className="btn-primary text-xs py-1.5 px-3">
          <Save size={12} /> {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button onClick={onCancel} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
      </div>
    </div>
  )
}

/* ─── Editable data table for multi-row sections ─── */
function EditableDataTable({ columns, rows, emptyMsg = 'None entered', onEdit, onDelete, onAdd, addLabel = 'Add Row', canEdit }) {
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [saving, setSaving] = useState(false)

  async function handleSave(row) {
    setSaving(true)
    try {
      await onEdit(row.id, editDraft)
      setEditingId(null)
    } catch { /* error handled in caller */ }
    setSaving(false)
  }

  if (!rows || rows.length === 0) {
    return (
      <div>
        <p className="text-xs text-brand-gray py-3 text-center">{emptyMsg}</p>
        {canEdit && <button onClick={onAdd} className="btn-ghost text-xs w-full mt-1"><Plus size={12} /> {addLabel}</button>}
      </div>
    )
  }

  return (
    <div className="mt-2">
      <div className="overflow-x-auto rounded-lg border border-brand-gray-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-brand-black">
              {columns.map(c => <th key={c.key} className={`table-header py-2 text-xs ${c.right ? 'text-right' : 'text-left'}`}>{c.label}</th>)}
              {canEdit && <th className="table-header py-2 w-16 text-center">Edit</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              editingId === row.id ? (
                <tr key={row.id || i} className="bg-brand-yellow/5">
                  {columns.map(c => (
                    <td key={c.key} className="table-cell py-1">
                      <input
                        type={c.right ? 'number' : 'text'}
                        step={c.right ? '0.01' : undefined}
                        value={editDraft[c.key] ?? ''}
                        onChange={e => setEditDraft(p => ({ ...p, [c.key]: e.target.value }))}
                        className="input-field py-1 text-xs w-full"
                      />
                    </td>
                  ))}
                  <td className="table-cell py-1">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => handleSave(row)} disabled={saving} className="text-brand-success hover:opacity-80"><Save size={12} /></button>
                      <button onClick={() => setEditingId(null)} className="text-brand-gray hover:text-white"><X size={12} /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={row.id || i} className="table-row">
                  {columns.map(c => (
                    <td key={c.key} className={`table-cell py-2 text-xs ${c.right ? 'text-right font-mono' : ''}`}>
                      {c.format ? c.format(row[c.key]) : (row[c.key] || '—')}
                    </td>
                  ))}
                  {canEdit && (
                    <td className="table-cell py-2">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => { setEditingId(row.id); setEditDraft({ ...row }) }}
                          className="text-brand-gray hover:text-brand-yellow"><Pencil size={11} /></button>
                        <button onClick={() => onDelete(row.id)} className="text-brand-gray hover:text-brand-red"><Trash2 size={11} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
      {canEdit && (
        <button onClick={onAdd} className="btn-ghost text-xs w-full mt-2"><Plus size={12} /> {addLabel}</button>
      )}
    </div>
  )
}

/* ─── Mapping: section key → {endpoint, label, fields} ─── */
const SECTION_FIELDS = {
  local_employment: {
    endpoint: id => `/tax/submissions/${id}/income/local-employment/`,
    label: 'Local Employment Income',
    fields: [
      { key: 'amount', label: 'Gross Income (Rs.)', type: 'number' },
      { key: 'employer_name', label: 'Employer Name', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  foreign_income: {
    endpoint: id => `/tax/submissions/${id}/income/foreign/`,
    label: 'Foreign Income',
    fields: [
      { key: 'employment_service_fee', label: 'Employment / Service Fee (Rs.)', type: 'number' },
      { key: 'other_foreign_income', label: 'Other Foreign Income (Rs.)', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  terminal_benefit: {
    endpoint: id => `/tax/submissions/${id}/income/terminal-benefit/`,
    label: 'Terminal Benefit',
    fields: [
      { key: 'amount', label: 'Amount (Rs.)', type: 'number' },
      { key: 'benefit_types', label: 'Benefit Types (e.g. EPF, ETF)', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  rent_income: {
    endpoint: id => `/tax/submissions/${id}/income/rent/`,
    label: 'Rent Income',
    fields: [
      { key: 'gross_amount', label: 'Gross Rent (Rs.)', type: 'number' },
      { key: 'wht_deducted', label: 'WHT Deducted (Rs.)', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  interest_income: {
    endpoint: id => `/tax/submissions/${id}/income/interest/`,
    label: 'Interest Income',
    fields: [
      { key: 'amount', label: 'Interest Income (Rs.)', type: 'number' },
      { key: 'wht_deducted', label: 'WHT Deducted (Rs.)', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  dividend_income: {
    endpoint: id => `/tax/submissions/${id}/income/dividend/`,
    label: 'Dividend Income',
    fields: [
      { key: 'amount', label: 'Dividend Income (Rs.)', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  sole_proprietorship: {
    endpoint: id => `/tax/submissions/${id}/income/sole-proprietorship/`,
    label: 'Sole Proprietorship',
    fields: [
      { key: 'amount', label: 'Business Income (Rs.)', type: 'number' },
      { key: 'business_name', label: 'Business Name', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  other_income: {
    endpoint: id => `/tax/submissions/${id}/income/other/`,
    label: 'Other Income',
    fields: [
      { key: 'amount', label: 'Amount (Rs.)', type: 'number' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  qualifying_payments: {
    endpoint: id => `/tax/submissions/${id}/qualifying-payments/`,
    label: 'Qualifying Payments',
    fields: [
      { key: 'donation_charitable', label: 'Charitable Donations (Rs.)', type: 'number' },
      { key: 'donation_government', label: 'Government Donations (Rs.)', type: 'number' },
      { key: 'solar_panels_expenditure', label: 'Solar Panels Expenditure (Rs.)', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  tax_credits: {
    endpoint: id => `/tax/submissions/${id}/tax-credits/`,
    label: 'Tax Credits',
    fields: [
      { key: 'apit_on_salary', label: 'APIT on Salary (Rs.)', type: 'number' },
      { key: 'wht_rent_interest_service', label: 'WHT (Rent/Interest/Service) (Rs.)', type: 'number' },
      { key: 'partnership_tax_credit', label: 'Partnership Tax Credit (Rs.)', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  cash_in_hand: {
    endpoint: id => `/tax/submissions/${id}/assets/cash/`,
    label: 'Cash in Hand',
    fields: [
      { key: 'amount', label: 'Cash in Hand (Rs.)', type: 'number' },
    ],
  },
  gold_jewellery: {
    endpoint: id => `/tax/submissions/${id}/assets/gold/`,
    label: 'Gold & Jewellery',
    fields: [
      { key: 'value', label: 'Value (Rs.)', type: 'number' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  declarant_details: {
    endpoint: id => `/tax/submissions/${id}/declarant/`,
    label: 'Declarant Details',
    fields: [
      { key: 'full_name', label: 'Full Name', type: 'text' },
      { key: 'nic_passport', label: 'NIC / Passport', type: 'text' },
      { key: 'tin', label: 'TIN', type: 'text' },
      { key: 'pin', label: 'PIN', type: 'text' },
      { key: 'telephone', label: 'Telephone', type: 'text' },
      { key: 'mobile', label: 'Mobile', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
    ],
  },
}

/* ─── Main Component ─── */
export default function TaxCalculation() {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [pendingUpdates, setPendingUpdates] = useState({})
  const [saving, setSaving] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [sectionSaving, setSectionSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'log'

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => api.get(`/tax/submissions/${submissionId}/`).then(r => r.data),
  })

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', submissionId],
    queryFn: () => api.get(`/documents/submission/${submissionId}/`).then(r => r.data),
    enabled: !!submissionId,
  })

  const { data: editLogs = [] } = useQuery({
    queryKey: ['edit-logs', submissionId],
    queryFn: () => api.get(`/tax/submissions/${submissionId}/edit-logs/`).then(r => r.data),
    enabled: !!submissionId,
  })

  // Live calculation (Change 5) — shows real-time TAI even before confirming
  const { data: liveCalc } = useQuery({
    queryKey: ['live-calc', submissionId],
    queryFn: () => api.get(`/tax/submissions/${submissionId}/live-calculate/`).then(r => r.data),
    enabled: !!submissionId,
    staleTime: 30000,
  })

  const confirmCalc = useMutation({
    mutationFn: () => api.post(`/tax/submissions/${submissionId}/confirm-calculation/`),
    onSuccess: () => {
      toast.success('Client notified. Accounts Division has been alerted for payment confirmation.')
      qc.invalidateQueries(['submission', submissionId])
      navigate(-1)
    },
    onError: err => toast.error(err.response?.data?.error || 'Failed'),
  })

  const finalSubmit = useMutation({
    mutationFn: () => api.post(`/tax/submissions/${submissionId}/final-submit/`),
    onSuccess: () => {
      toast.success('Tax computation sent to client for review.')
      qc.invalidateQueries(['submission', submissionId])
    },
    onError: err => {
      const data = err.response?.data
      if (data?.payment_not_received) {
        toast.error('Payment has not been received. Please wait for Accounts Division to confirm payment before submitting.', { duration: 6000 })
      } else {
        toast.error(data?.error || 'Failed to submit')
      }
    },
  })

  const archiveSubmission = useMutation({
    mutationFn: () => api.post(`/tax/submissions/${submissionId}/archive/`),
    onSuccess: () => {
      toast.success('Submission archived. Client has been notified.')
      qc.invalidateQueries(['submission', submissionId])
      navigate(-1)
    },
    onError: err => toast.error(err.response?.data?.error || 'Failed to archive'),
  })

  function handleFieldUpdate(field, value) {
    setPendingUpdates(prev => ({ ...prev, [field]: value }))
  }

  async function saveUpdates() {
    if (Object.keys(pendingUpdates).length === 0) return
    setSaving(true)
    try {
      await api.patch(`/tax/submissions/${submissionId}/update-calculation/`, pendingUpdates)
      qc.invalidateQueries(['submission', submissionId])
      qc.invalidateQueries(['edit-logs', submissionId])
      setPendingUpdates({})
      toast.success('Calculation updated')
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  async function saveSection(sectionKey, data) {
    const cfg = SECTION_FIELDS[sectionKey]
    if (!cfg) return
    setSectionSaving(true)
    try {
      await api.post(cfg.endpoint(submissionId), data)
      qc.invalidateQueries(['submission', submissionId])
      qc.invalidateQueries(['edit-logs', submissionId])
      setEditingSection(null)
      toast.success(`${cfg.label} updated`)
    } catch (err) {
      const msg = err.response?.data ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(', ') : 'Failed to save'
      toast.error(msg)
    }
    setSectionSaving(false)
  }

  // Multi-row helpers
  async function patchRow(itemEndpointBase, rowId, data) {
    await api.patch(`/tax/${itemEndpointBase}/${rowId}/`, data)
    qc.invalidateQueries(['submission', submissionId])
    qc.invalidateQueries(['edit-logs', submissionId])
    toast.success('Row updated')
  }

  async function deleteRow(itemEndpointBase, rowId) {
    if (!window.confirm('Delete this row?')) return
    await api.delete(`/tax/${itemEndpointBase}/${rowId}/`)
    qc.invalidateQueries(['submission', submissionId])
    qc.invalidateQueries(['edit-logs', submissionId])
    toast.success('Row deleted')
  }

  async function addRow(listEndpoint, defaults) {
    await api.post(`/tax/submissions/${submissionId}/${listEndpoint}`, defaults)
    qc.invalidateQueries(['submission', submissionId])
    toast.success('Row added')
  }

  async function downloadPDF() {
    try {
      const response = await api.get(`/tax/submissions/${submissionId}/pdf/`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a'); a.href = url
      a.download = `Tax_Return_${submission?.tax_year_label}.pdf`; a.click()
    } catch { toast.error('Failed to download PDF') }
  }

  async function downloadDocument(doc) {
    try {
      const res = await api.get(doc.file_url, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = doc.original_filename; a.click()
    } catch { window.open(doc.file_url, '_blank') }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const s = submission
  const canEdit = s?.status !== 'archived'
  const canConfirm = ['submitted', 'under_review', 'info_requested'].includes(s?.status)
  const canFinalSubmit = s?.status === 'confirmed'
  const paymentReceived = s?.payment_status === 'paid'
  const canArchive = s?.status === 'client_confirmed'
  const awaitingClientReview = s?.status === 'awaiting_client_review'
  // val: pendingUpdates > stored submission > live calculation (Change 5 — TAI fix)
  const val = k => pendingUpdates[k] ?? s?.[k] ?? liveCalc?.[k]
  const liveVal = k => liveCalc?.[k] ?? s?.[k]

  // Doc grouping
  const docsBySection = documents.reduce((acc, doc) => {
    const sec = doc.section || 'general'
    if (!acc[sec]) acc[sec] = []
    acc[sec].push(doc)
    return acc
  }, {})

  const SECTION_LABELS = {
    income: 'Income', qualifying_payments: 'Qualifying Payments', tax_credits: 'Tax Credits',
    assets: 'Assets', liabilities: 'Liabilities', declarant: 'Declarant', general: 'General',
  }

  const totalAssets = (s?.immovable_properties?.length || 0) + (s?.motor_vehicles?.length || 0) +
    (s?.bank_balances?.length || 0) + (s?.shares_stocks?.length || 0) + (s?.loans_given?.length || 0) +
    (s?.business_properties?.length || 0) + (s?.other_assets?.length || 0)

  // Action colour map for edit log
  const actionColor = { update: 'text-brand-yellow', add: 'text-brand-success', delete: 'text-brand-red' }
  const actionIcon = { update: Pencil, add: Plus, delete: Trash2 }

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4 text-sm">
        <ArrowLeft size={15} /> Back
      </button>

      <PageHeader
        title={`Tax Review — ${s?.client_name}`}
        subtitle={`${s?.tax_year_label} · ${s?.client_email}`}
        actions={
          <div className="flex gap-2">
            {Object.keys(pendingUpdates).length > 0 && (
              <button onClick={saveUpdates} disabled={saving} className="btn-secondary">
                <Save size={14} /> {saving ? 'Saving...' : 'Save Edits'}
              </button>
            )}
            <button onClick={downloadPDF} className="btn-secondary"><Download size={14} /> PDF</button>
            {canConfirm && (
              <button onClick={() => confirmCalc.mutate()} disabled={confirmCalc.isPending} className="btn-primary">
                {confirmCalc.isPending
                  ? <><span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />Confirming...</>
                  : <><Send size={14} /> Confirm &amp; Notify Client</>
                }
              </button>
            )}
            {canFinalSubmit && (
              paymentReceived ? (
                <button
                  onClick={() => finalSubmit.mutate()}
                  disabled={finalSubmit.isPending}
                  className="btn-primary bg-brand-success border-brand-success hover:opacity-90"
                >
                  {finalSubmit.isPending
                    ? <><span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />Sending...</>
                    : <><Send size={14} /> Send Tax Form to Client</>
                  }
                </button>
              ) : (
                <button
                  onClick={() => toast.error('Payment has not been received. Accounts Division must confirm payment before you can submit the final return.', { duration: 6000 })}
                  className="btn-secondary border-orange-500/50 text-orange-400 cursor-not-allowed opacity-80"
                >
                  <Send size={14} /> Send Tax Form to Client
                </button>
              )
            )}
            {awaitingClientReview && (
              <button disabled className="btn-secondary border-brand-info/50 text-brand-info cursor-not-allowed opacity-80">
                <CheckCircle size={14} /> Awaiting Client Review
              </button>
            )}
            {canArchive && (
              <button
                onClick={() => archiveSubmission.mutate()}
                disabled={archiveSubmission.isPending}
                className="btn-primary bg-brand-success border-brand-success hover:opacity-90"
              >
                {archiveSubmission.isPending
                  ? <><span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />Archiving...</>
                  : <><CheckCircle size={14} /> Mark Complete &amp; Archive</>
                }
              </button>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-5">
        <StatusBadge status={s?.status} />
        {s?.submitted_at && <span className="text-xs text-brand-gray">Submitted: {formatDate(s.submitted_at)}</span>}
      </div>

      {/* Status banners */}
      {canFinalSubmit && (
        paymentReceived ? (
          <div className="mb-5 flex items-start gap-3 bg-brand-success/10 border border-brand-success/30 rounded-xl p-4">
            <CheckCircle size={16} className="text-brand-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Payment Confirmed by Accounts Division</p>
              <p className="text-xs text-brand-gray mt-0.5">You can now send the final tax return to the client for review.</p>
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-start gap-3 bg-orange-400/10 border border-orange-400/30 rounded-xl p-4">
            <AlertCircle size={16} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Awaiting Payment Confirmation</p>
              <p className="text-xs text-brand-gray mt-0.5">Client acknowledged the payment notice. Accounts Division must confirm payment before you can send the final return.</p>
            </div>
          </div>
        )
      )}
      {awaitingClientReview && (
        <div className="mb-5 flex items-start gap-3 bg-blue-400/10 border border-blue-400/30 rounded-xl p-4">
          <CheckCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">Tax Form Sent — Awaiting Client Review</p>
            <p className="text-xs text-brand-gray mt-0.5">The client has been sent the full tax computation and will confirm once reviewed.</p>
          </div>
        </div>
      )}
      {canArchive && (
        <div className="mb-5 flex items-start gap-3 bg-brand-success/10 border border-brand-success/30 rounded-xl p-4">
          <CheckCircle size={16} className="text-brand-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">Client Has Confirmed the Tax Return</p>
            <p className="text-xs text-brand-gray mt-0.5">Click "Mark Complete &amp; Archive" to finalise and archive the submission.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-brand-black-light border border-brand-gray-border rounded-xl p-1 w-fit">
        {[['overview', 'Overview', FileText], ['log', `Edit Log (${editLogs.length})`, History]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm transition-colors ${activeTab === key ? 'bg-brand-yellow text-brand-black font-semibold' : 'text-brand-gray hover:text-white'}`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* ── Edit Log Tab ── */}
      {activeTab === 'log' && (
        <div className="card">
          <h3 className="section-header"><History size={16} className="text-brand-yellow" />Edit History</h3>
          {editLogs.length === 0 ? (
            <p className="text-sm text-brand-gray text-center py-8">No consultant edits recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {editLogs.map(log => {
                const ActionIcon = actionIcon[log.action] || Pencil
                return (
                  <div key={log.id} className="bg-brand-black-soft rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ActionIcon size={13} className={actionColor[log.action] || 'text-brand-gray'} />
                        <span className="text-sm font-semibold text-white">{log.section}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-brand-black ${actionColor[log.action]}`}>
                          {log.action}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-brand-gray">{log.edited_by_name}</p>
                        <p className="text-xs text-brand-gray">{formatDate(log.edited_at)}</p>
                      </div>
                    </div>
                    {log.description && <p className="text-xs text-brand-gray mt-2">{log.description}</p>}
                    {(log.old_data || log.new_data) && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        {log.old_data && Object.keys(log.old_data).length > 0 && (
                          <div className="bg-brand-black rounded-lg p-2">
                            <p className="text-xs text-brand-red font-semibold mb-1">Before</p>
                            {Object.entries(log.old_data).map(([k, v]) => (
                              <p key={k} className="text-xs text-brand-gray"><span className="text-white">{k}:</span> {v || '—'}</p>
                            ))}
                          </div>
                        )}
                        {log.new_data && Object.keys(log.new_data).length > 0 && (
                          <div className="bg-brand-black rounded-lg p-2">
                            <p className="text-xs text-brand-success font-semibold mb-1">After</p>
                            {Object.entries(log.new_data).map(([k, v]) => (
                              <p key={k} className="text-xs text-brand-gray"><span className="text-white">{k}:</span> {v || '—'}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2/3 */}
          <div className="lg:col-span-2 space-y-4">

            {/* ── Income ── */}
            <Section title="Income" icon={DollarSign} defaultOpen
              onEdit={canEdit ? () => setEditingSection(editingSection ? null : 'income_multi') : null}
              editing={editingSection === 'income_multi'}>

              {/* Local Employment */}
              {(s?.local_employment || canEdit) && (
                <>
                  <SubHeading>Local Employment Income</SubHeading>
                  {s?.local_employment && <>
                    <Row label="Employer Name" value={s.local_employment.employer_name} />
                    <AmountRow label="Gross Income" value={s.local_employment.amount} />
                    {s.local_employment.notes && <Row label="Notes" value={s.local_employment.notes} />}
                  </>}
                  {canEdit && (editingSection === 'local_employment' ? (
                    <SectionEditForm fields={SECTION_FIELDS.local_employment.fields} data={s?.local_employment}
                      onSave={d => saveSection('local_employment', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  ) : (
                    <button onClick={() => setEditingSection('local_employment')} className="btn-ghost text-xs mt-1"><Pencil size={11} /> Edit</button>
                  ))}
                </>
              )}

              {/* Foreign Income */}
              {s?.foreign_income && (
                <>
                  <SubHeading>Foreign Income</SubHeading>
                  <AmountRow label="Employment / Service Fee" value={s.foreign_income.employment_service_fee} />
                  <AmountRow label="Other Foreign Income" value={s.foreign_income.other_foreign_income} />
                  {canEdit && (editingSection === 'foreign_income' ? (
                    <SectionEditForm fields={SECTION_FIELDS.foreign_income.fields} data={s.foreign_income}
                      onSave={d => saveSection('foreign_income', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  ) : (
                    <button onClick={() => setEditingSection('foreign_income')} className="btn-ghost text-xs mt-1"><Pencil size={11} /> Edit</button>
                  ))}
                </>
              )}

              {/* Terminal Benefit */}
              {s?.terminal_benefit?.amount > 0 && (
                <>
                  <SubHeading>Terminal Benefit</SubHeading>
                  <AmountRow label="Amount" value={s.terminal_benefit.amount} />
                  <Row label="Benefit Types" value={s.terminal_benefit.benefit_types} />
                  {canEdit && (editingSection === 'terminal_benefit' ? (
                    <SectionEditForm fields={SECTION_FIELDS.terminal_benefit.fields} data={s.terminal_benefit}
                      onSave={d => saveSection('terminal_benefit', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  ) : (
                    <button onClick={() => setEditingSection('terminal_benefit')} className="btn-ghost text-xs mt-1"><Pencil size={11} /> Edit</button>
                  ))}
                </>
              )}

              {/* Rent Income */}
              {s?.rent_income?.gross_amount > 0 && (
                <>
                  <SubHeading>Rent Income</SubHeading>
                  <AmountRow label="Gross Rent" value={s.rent_income.gross_amount} />
                  <AmountRow label="WHT Deducted" value={s.rent_income.wht_deducted} sub />
                  {canEdit && (editingSection === 'rent_income' ? (
                    <SectionEditForm fields={SECTION_FIELDS.rent_income.fields} data={s.rent_income}
                      onSave={d => saveSection('rent_income', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  ) : (
                    <button onClick={() => setEditingSection('rent_income')} className="btn-ghost text-xs mt-1"><Pencil size={11} /> Edit</button>
                  ))}
                </>
              )}

              {/* Interest Income */}
              {s?.interest_income?.amount > 0 && (
                <>
                  <SubHeading>Interest Income</SubHeading>
                  <AmountRow label="Interest" value={s.interest_income.amount} />
                  <AmountRow label="WHT Deducted" value={s.interest_income.wht_deducted} sub />
                  {canEdit && (editingSection === 'interest_income' ? (
                    <SectionEditForm fields={SECTION_FIELDS.interest_income.fields} data={s.interest_income}
                      onSave={d => saveSection('interest_income', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  ) : (
                    <button onClick={() => setEditingSection('interest_income')} className="btn-ghost text-xs mt-1"><Pencil size={11} /> Edit</button>
                  ))}
                </>
              )}

              {/* Dividend Income */}
              {s?.dividend_income?.amount > 0 && (
                <>
                  <SubHeading>Dividend Income</SubHeading>
                  <AmountRow label="Dividend" value={s.dividend_income.amount} />
                  {canEdit && (editingSection === 'dividend_income' ? (
                    <SectionEditForm fields={SECTION_FIELDS.dividend_income.fields} data={s.dividend_income}
                      onSave={d => saveSection('dividend_income', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  ) : (
                    <button onClick={() => setEditingSection('dividend_income')} className="btn-ghost text-xs mt-1"><Pencil size={11} /> Edit</button>
                  ))}
                </>
              )}

              {/* Sole Proprietorship */}
              {s?.sole_proprietorship?.amount > 0 && (
                <>
                  <SubHeading>Sole Proprietorship</SubHeading>
                  <Row label="Business Name" value={s.sole_proprietorship.business_name} />
                  <AmountRow label="Business Income" value={s.sole_proprietorship.amount} />
                  {canEdit && (editingSection === 'sole_proprietorship' ? (
                    <SectionEditForm fields={SECTION_FIELDS.sole_proprietorship.fields} data={s.sole_proprietorship}
                      onSave={d => saveSection('sole_proprietorship', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  ) : (
                    <button onClick={() => setEditingSection('sole_proprietorship')} className="btn-ghost text-xs mt-1"><Pencil size={11} /> Edit</button>
                  ))}
                </>
              )}

              {/* Other Income */}
              {s?.other_income?.amount > 0 && (
                <>
                  <SubHeading>Other Income</SubHeading>
                  <Row label="Description" value={s.other_income.description} />
                  <AmountRow label="Amount" value={s.other_income.amount} />
                  {canEdit && (editingSection === 'other_income' ? (
                    <SectionEditForm fields={SECTION_FIELDS.other_income.fields} data={s.other_income}
                      onSave={d => saveSection('other_income', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  ) : (
                    <button onClick={() => setEditingSection('other_income')} className="btn-ghost text-xs mt-1"><Pencil size={11} /> Edit</button>
                  ))}
                </>
              )}

              <div className="mt-2">
                <AmountRow label="TOTAL ASSESSABLE INCOME" value={s?.total_assessable_income} highlight />
              </div>
            </Section>

            {/* ── Qualifying Payments ── */}
            <Section title="Qualifying Payments" icon={Calculator}
              onEdit={canEdit ? () => setEditingSection(editingSection === 'qualifying_payments' ? null : 'qualifying_payments') : null}
              editing={editingSection === 'qualifying_payments'}>
              {s?.qualifying_payments ? (
                <div className="pt-3">
                  <AmountRow label="Charitable Donations" value={s.qualifying_payments.donation_charitable} />
                  <AmountRow label="Government Donations" value={s.qualifying_payments.donation_government} />
                  <AmountRow label="Solar Panels" value={s.qualifying_payments.solar_panels_expenditure} />
                  {editingSection === 'qualifying_payments' && (
                    <SectionEditForm fields={SECTION_FIELDS.qualifying_payments.fields} data={s.qualifying_payments}
                      onSave={d => saveSection('qualifying_payments', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  )}
                  <div className="mt-2">
                    <AmountRow label="Total Qualifying Payments" value={s.total_qualifying_payments} highlight />
                  </div>
                </div>
              ) : (
                <div className="pt-3">
                  <p className="text-xs text-brand-gray text-center">No qualifying payments entered</p>
                  {canEdit && editingSection === 'qualifying_payments' && (
                    <SectionEditForm fields={SECTION_FIELDS.qualifying_payments.fields} data={{}}
                      onSave={d => saveSection('qualifying_payments', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  )}
                </div>
              )}
            </Section>

            {/* ── Tax Credits ── */}
            <Section title="Tax Credits" icon={TrendingUp}
              onEdit={canEdit ? () => setEditingSection(editingSection === 'tax_credits' ? null : 'tax_credits') : null}
              editing={editingSection === 'tax_credits'}>
              <div className="pt-3">
                {s?.tax_credits ? (
                  <>
                    <AmountRow label="APIT on Salary" value={s.tax_credits.apit_on_salary} />
                    <AmountRow label="WHT (Rent/Interest/Service)" value={s.tax_credits.wht_rent_interest_service} />
                    <AmountRow label="Partnership Tax Credit" value={s.tax_credits.partnership_tax_credit} />
                  </>
                ) : <p className="text-xs text-brand-gray text-center">No tax credits entered</p>}
                {s?.self_assessment_payments?.length > 0 && (
                  <>
                    <SubHeading>Self-Assessment Installments</SubHeading>
                    {s.self_assessment_payments.map(inst => (
                      <div key={inst.id} className="flex justify-between items-center py-1.5 pl-4 border-b border-brand-gray-border last:border-0">
                        <span className="text-sm text-brand-gray">
                          Installment {inst.installment_number}{inst.payment_date ? ` (${formatDate(inst.payment_date)})` : ''}
                        </span>
                        <span className="font-mono text-sm text-white">{formatCurrency(inst.amount)}</span>
                      </div>
                    ))}
                  </>
                )}
                {editingSection === 'tax_credits' && (
                  <SectionEditForm fields={SECTION_FIELDS.tax_credits.fields} data={s?.tax_credits}
                    onSave={d => saveSection('tax_credits', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                )}
                <div className="mt-2">
                  <AmountRow label="Total Tax Credits" value={s?.total_tax_credits} highlight />
                </div>
              </div>
            </Section>

            {/* ── Assets ── */}
            <Section title="Statement of Assets" icon={Home} badge={totalAssets}>
              <div className="pt-2 space-y-4">

                <div>
                  <SubHeading>Immovable Properties</SubHeading>
                  <EditableDataTable
                    columns={[
                      { key: 'situation_of_property', label: 'Location / Property' },
                      { key: 'date_of_acquisition', label: 'Acquired' },
                      { key: 'cost', label: 'Cost', right: true, format: formatCurrency },
                      { key: 'market_value', label: 'Market Value', right: true, format: formatCurrency },
                    ]}
                    rows={s?.immovable_properties} canEdit={canEdit} emptyMsg="No immovable properties"
                    onEdit={(id, data) => patchRow('assets/immovable', id, data)}
                    onDelete={id => deleteRow('assets/immovable', id)}
                    onAdd={() => addRow('assets/immovable/', { situation_of_property: '', cost: 0, market_value: 0 })}
                  />
                </div>

                <div>
                  <SubHeading>Motor Vehicles</SubHeading>
                  <EditableDataTable
                    columns={[
                      { key: 'description', label: 'Description' },
                      { key: 'registration_no', label: 'Reg. No.' },
                      { key: 'date_of_acquisition', label: 'Acquired' },
                      { key: 'cost_market_value', label: 'Cost / Value', right: true, format: formatCurrency },
                    ]}
                    rows={s?.motor_vehicles} canEdit={canEdit} emptyMsg="No motor vehicles"
                    onEdit={(id, data) => patchRow('assets/vehicles', id, data)}
                    onDelete={id => deleteRow('assets/vehicles', id)}
                    onAdd={() => addRow('assets/vehicles/', { description: '', registration_no: '', cost_market_value: 0 })}
                  />
                </div>

                <div>
                  <SubHeading>Bank Balances</SubHeading>
                  <EditableDataTable
                    columns={[
                      { key: 'bank_name', label: 'Bank / Institution' },
                      { key: 'account_no', label: 'Account No.' },
                      { key: 'amount_invested', label: 'Invested', right: true, format: formatCurrency },
                      { key: 'interest', label: 'Interest', right: true, format: formatCurrency },
                      { key: 'balance', label: 'Balance', right: true, format: formatCurrency },
                    ]}
                    rows={s?.bank_balances} canEdit={canEdit} emptyMsg="No bank balances"
                    onEdit={(id, data) => patchRow('assets/bank-balances', id, data)}
                    onDelete={id => deleteRow('assets/bank-balances', id)}
                    onAdd={() => addRow('assets/bank-balances/', { bank_name: '', account_no: '', balance: 0 })}
                  />
                </div>

                <div>
                  <SubHeading>Shares &amp; Stocks</SubHeading>
                  <EditableDataTable
                    columns={[
                      { key: 'description', label: 'Description' },
                      { key: 'no_of_shares', label: 'Shares' },
                      { key: 'cost_market_value', label: 'Cost / Value', right: true, format: formatCurrency },
                      { key: 'net_dividend_income', label: 'Net Dividend', right: true, format: formatCurrency },
                    ]}
                    rows={s?.shares_stocks} canEdit={canEdit} emptyMsg="No shares or stocks"
                    onEdit={(id, data) => patchRow('assets/shares', id, data)}
                    onDelete={id => deleteRow('assets/shares', id)}
                    onAdd={() => addRow('assets/shares/', { description: '', no_of_shares: 0, cost_market_value: 0 })}
                  />
                </div>

                {/* Cash in Hand */}
                <div>
                  <SubHeading>Cash in Hand</SubHeading>
                  {s?.cash_in_hand && <AmountRow label="Cash in Hand (Rs.)" value={s.cash_in_hand.amount} />}
                  {canEdit && (editingSection === 'cash_in_hand' ? (
                    <SectionEditForm fields={SECTION_FIELDS.cash_in_hand.fields} data={s?.cash_in_hand}
                      onSave={d => saveSection('cash_in_hand', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  ) : (
                    <button onClick={() => setEditingSection('cash_in_hand')} className="btn-ghost text-xs mt-1"><Pencil size={11} /> Edit</button>
                  ))}
                </div>

                {/* Gold & Jewellery */}
                <div>
                  <SubHeading>Gold &amp; Jewellery</SubHeading>
                  {s?.gold_jewellery && <>
                    <AmountRow label="Value (Rs.)" value={s.gold_jewellery.value} />
                    <Row label="Description" value={s.gold_jewellery.description} />
                  </>}
                  {canEdit && (editingSection === 'gold_jewellery' ? (
                    <SectionEditForm fields={SECTION_FIELDS.gold_jewellery.fields} data={s?.gold_jewellery}
                      onSave={d => saveSection('gold_jewellery', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  ) : (
                    <button onClick={() => setEditingSection('gold_jewellery')} className="btn-ghost text-xs mt-1"><Pencil size={11} /> Edit</button>
                  ))}
                </div>

                <div>
                  <SubHeading>Loans Given</SubHeading>
                  <EditableDataTable
                    columns={[
                      { key: 'borrower_name', label: 'Borrower' },
                      { key: 'amount', label: 'Amount', right: true, format: formatCurrency },
                      { key: 'notes', label: 'Notes' },
                    ]}
                    rows={s?.loans_given} canEdit={canEdit} emptyMsg="No loans given"
                    onEdit={(id, data) => patchRow('assets/loans-given', id, data)}
                    onDelete={id => deleteRow('assets/loans-given', id)}
                    onAdd={() => addRow('assets/loans-given/', { borrower_name: '', amount: 0 })}
                  />
                </div>

                <div>
                  <SubHeading>Business Property</SubHeading>
                  <EditableDataTable
                    columns={[
                      { key: 'name_of_business', label: 'Business Name' },
                      { key: 'current_account_balance', label: 'Current A/C', right: true, format: formatCurrency },
                      { key: 'capital_account_balance', label: 'Capital A/C', right: true, format: formatCurrency },
                    ]}
                    rows={s?.business_properties} canEdit={canEdit} emptyMsg="No business property"
                    onEdit={(id, data) => patchRow('assets/business', id, data)}
                    onDelete={id => deleteRow('assets/business', id)}
                    onAdd={() => addRow('assets/business/', { name_of_business: '', current_account_balance: 0 })}
                  />
                </div>

                <div>
                  <SubHeading>Other Assets</SubHeading>
                  <EditableDataTable
                    columns={[
                      { key: 'description', label: 'Description' },
                      { key: 'acquisition_type', label: 'Type' },
                      { key: 'date_of_acquisition', label: 'Acquired' },
                      { key: 'cost_value', label: 'Cost / Value', right: true, format: formatCurrency },
                    ]}
                    rows={s?.other_assets} canEdit={canEdit} emptyMsg="No other assets"
                    onEdit={(id, data) => patchRow('assets/other', id, data)}
                    onDelete={id => deleteRow('assets/other', id)}
                    onAdd={() => addRow('assets/other/', { description: '', cost_value: 0 })}
                  />
                </div>

                {(s?.disposals?.length > 0 || canEdit) && (
                  <div>
                    <SubHeading>Disposals During the Year</SubHeading>
                    <EditableDataTable
                      columns={[
                        { key: 'description', label: 'Description' },
                        { key: 'date_of_disposal', label: 'Disposal Date' },
                        { key: 'sales_proceed', label: 'Proceeds', right: true, format: formatCurrency },
                        { key: 'cost', label: 'Cost', right: true, format: formatCurrency },
                      ]}
                      rows={s?.disposals} canEdit={canEdit} emptyMsg="No disposals"
                      onEdit={(id, data) => patchRow('assets/disposals', id, data)}
                      onDelete={id => deleteRow('assets/disposals', id)}
                      onAdd={() => addRow('assets/disposals/', { description: '', sales_proceed: 0, cost: 0 })}
                    />
                  </div>
                )}
              </div>
            </Section>

            {/* ── Liabilities ── */}
            <Section title="Liabilities" icon={Banknote} badge={s?.liabilities?.length || 0}>
              <div className="pt-3">
                <EditableDataTable
                  columns={[
                    { key: 'description', label: 'Description' },
                    { key: 'security_on_liability', label: 'Security' },
                    { key: 'original_amount', label: 'Original', right: true, format: formatCurrency },
                    { key: 'amount_as_at_date', label: 'Balance 31.03', right: true, format: formatCurrency },
                    { key: 'amount_repaid_during_year', label: 'Repaid', right: true, format: formatCurrency },
                  ]}
                  rows={s?.liabilities} canEdit={canEdit} emptyMsg="No liabilities"
                  onEdit={(id, data) => patchRow('liabilities', id, data)}
                  onDelete={id => deleteRow('liabilities', id)}
                  onAdd={() => addRow('liabilities/', { description: '', original_amount: 0, amount_as_at_date: 0 })}
                />
              </div>
            </Section>

            {/* ── Declarant ── */}
            <Section title="Declarant Details" icon={User}
              onEdit={canEdit ? () => setEditingSection(editingSection === 'declarant_details' ? null : 'declarant_details') : null}
              editing={editingSection === 'declarant_details'}>
              {s?.declarant_details ? (
                <div className="pt-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      ['Full Name', s.declarant_details.full_name],
                      ['NIC / Passport', s.declarant_details.nic_passport],
                      ['TIN', s.declarant_details.tin || '—'],
                      ['PIN', s.declarant_details.pin || '—'],
                      ['Telephone', s.declarant_details.telephone || '—'],
                      ['Mobile', s.declarant_details.mobile || '—'],
                      ['Email', s.declarant_details.email],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs text-brand-gray">{label}</p>
                        <p className="text-sm text-white font-medium break-all">{value}</p>
                      </div>
                    ))}
                  </div>
                  {editingSection === 'declarant_details' && (
                    <SectionEditForm fields={SECTION_FIELDS.declarant_details.fields} data={s.declarant_details}
                      onSave={d => saveSection('declarant_details', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  )}
                </div>
              ) : (
                <div className="pt-3">
                  <p className="text-xs text-brand-gray text-center">No declarant details</p>
                  {editingSection === 'declarant_details' && (
                    <SectionEditForm fields={SECTION_FIELDS.declarant_details.fields} data={{}}
                      onSave={d => saveSection('declarant_details', d)} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
                  )}
                </div>
              )}
            </Section>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-4">
            {/* Tax Computation */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-header mb-0"><Calculator size={15} className="text-brand-yellow" />Tax Computation</h3>
                {Object.keys(pendingUpdates).length > 0 && (
                  <span className="text-xs text-brand-yellow animate-pulse">{Object.keys(pendingUpdates).length} unsaved</span>
                )}
              </div>
              <p className="text-xs text-brand-gray mb-3 flex items-center gap-1"><Pencil size={10} /> Click pencil to edit</p>

              {/* Live TAI badge — shows real value even before confirming (Change 5) */}
              {liveCalc && parseFloat(liveCalc.total_assessable_income) !== parseFloat(s?.total_assessable_income || 0) && (
                <div className="mb-3 px-3 py-2 bg-brand-info/10 border border-brand-info/20 rounded-lg">
                  <p className="text-xs text-brand-info">Live calculation available. Stored value differs from current income data.</p>
                  <p className="text-xs text-white font-mono mt-1">Live TAI: {formatCurrency(liveCalc.total_assessable_income)}</p>
                </div>
              )}

              <EditableAmount label="Assessable Income" value={liveVal('total_assessable_income')} fieldKey="total_assessable_income" onSave={handleFieldUpdate} />
              {/* Exempt dividend income (Change 16) */}
              {parseFloat(liveVal('exempt_dividend_income') || 0) > 0 && (
                <div className="flex justify-between items-center py-1 pl-4">
                  <span className="text-xs text-brand-gray italic">Exempt Dividend Income (15% WHT)</span>
                  <span className="text-xs text-brand-success font-mono">{formatCurrency(liveVal('exempt_dividend_income'))}</span>
                </div>
              )}
              <EditableAmount label="Less: Qualifying Pmts" value={val('total_qualifying_payments')} fieldKey="total_qualifying_payments" onSave={handleFieldUpdate} indent />
              <EditableAmount label="Less: Personal Relief" value={val('personal_relief')} fieldKey="personal_relief" onSave={handleFieldUpdate} indent />
              <EditableAmount label="Less: Rent Relief (25%)" value={liveVal('rent_relief')} fieldKey="rent_relief" onSave={handleFieldUpdate} indent />
              {/* Change 19: renamed from Net Taxable Income → Taxable Income */}
              <EditableAmount label="Taxable Income" value={liveVal('net_taxable_income')} fieldKey="net_taxable_income" onSave={handleFieldUpdate} highlight />
              <div className="h-px bg-brand-gray-border my-3" />

              {/* Slab breakdown (Change 19) */}
              {(liveCalc?.slab_breakdown || s?.slab_breakdown || []).length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">Tax Slab Breakdown</p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-brand-gray-border">
                        <th className="text-left pb-1 text-brand-gray font-medium">Slab</th>
                        <th className="text-right pb-1 text-brand-gray font-medium">Tax (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(liveCalc?.slab_breakdown || s?.slab_breakdown || []).map((row, i) => (
                        <tr key={i} className="border-b border-brand-gray-border/50">
                          <td className="py-1 text-brand-gray">{row.label}</td>
                          <td className="py-1 text-right font-mono text-white">{formatCurrencyInt(row.tax)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <EditableAmount label="Gross Tax" value={val('gross_tax')} fieldKey="gross_tax" onSave={handleFieldUpdate} />
              <EditableAmount label="Less: Tax Credits" value={val('total_tax_credits')} fieldKey="total_tax_credits" onSave={handleFieldUpdate} indent />
              <div className="mt-4 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-4">
                <p className="text-xs text-brand-gray uppercase tracking-wider mb-2">BALANCE TAX PAYABLE</p>
                <EditableAmount label="" value={val('net_tax_payable')} fieldKey="net_tax_payable" onSave={handleFieldUpdate} />
              </div>

              {/* Payment Status (Change 8) */}
              <div className="mt-4 border border-brand-gray-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-brand-gray uppercase tracking-wider">Payment Status</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PAYMENT_STATUS_COLORS[s?.payment_status || 'pending']}`}>
                    {PAYMENT_STATUS_LABELS[s?.payment_status || 'pending']}
                  </span>
                </div>
                {s?.payment_updated_at && (
                  <p className="text-xs text-brand-gray">Updated: {formatDate(s.payment_updated_at)}</p>
                )}
              </div>
            </div>

            {s?.info_request_message && (
              <div className="bg-brand-red/10 border border-brand-red/20 rounded-xl p-4">
                <p className="text-xs text-brand-red font-semibold mb-1">Info Requested from Client</p>
                <p className="text-xs text-brand-gray">{s.info_request_message}</p>
              </div>
            )}

            {/* Documents */}
            <div className="card">
              <h3 className="section-header"><FileText size={16} className="text-brand-yellow" />Documents ({documents.length})</h3>
              {documents.length === 0 ? (
                <p className="text-sm text-brand-gray text-center py-4">No documents uploaded</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(docsBySection).map(([section, docs]) => (
                    <div key={section}>
                      <p className="text-xs text-brand-yellow font-semibold uppercase tracking-wider mb-2">
                        {SECTION_LABELS[section] || section}
                      </p>
                      <div className="space-y-1">
                        {docs.map(doc => (
                          <div key={doc.id} className="flex items-center gap-2 bg-brand-black-soft rounded-lg px-3 py-2">
                            <FileText size={12} className="text-brand-yellow flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-white truncate">{doc.original_filename}</p>
                              <p className="text-xs text-brand-gray">{doc.document_type_display}</p>
                            </div>
                            <div className="flex gap-1 items-center flex-shrink-0">
                              <a href={doc.file_url} target="_blank" rel="noreferrer"
                                className="p-1 text-brand-gray hover:text-brand-yellow rounded" title="View">
                                <Eye size={12} />
                              </a>
                              <button onClick={() => downloadDocument(doc)}
                                className="p-1 text-brand-gray hover:text-brand-yellow rounded" title="Download">
                                <Download size={12} />
                              </button>
                              {doc.is_verified && <CheckCircle size={12} className="text-brand-success" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
