import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../services/api'
import { ChevronRight, ChevronLeft, Plus, Trash2, Pencil, X, Save, LayoutList } from 'lucide-react'
import toast from 'react-hot-toast'
import NumberInput from '../../../components/common/NumberInput'

const fmtAmt = v => {
  const n = parseFloat(v || 0)
  return isNaN(n) ? '0.00' : n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
const numOrDash = v => { const n = parseFloat(v || 0); return (!isNaN(n) && n !== 0) ? fmtAmt(n) : '—' }
const normVal = v => typeof v === 'object' ? v : (v == null || v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) === 0)) ? '' : v

const CATEGORIES = [
  {
    key: 'immovable', label: 'Immovable Properties as at 31st March 2026',
    endpoint: 'immovable', queryKey: 'immovable',
    defaults: { situation_of_property: '', cost: '', market_value: '' },
    fields: [
      { key: 'situation_of_property', label: 'Situation of Property', type: 'text' },
      { key: 'date_of_acquisition', label: 'Date of Acquisition', type: 'date' },
      { key: 'cost', label: 'Cost (Rs.)', type: 'number' },
      { key: 'market_value', label: 'Market Value (Rs.)', type: 'number' },
    ],
    columns: [
      { key: 'situation_of_property', label: 'Situation of Property' },
      { key: 'date_of_acquisition', label: 'Date of Acquisition' },
      { key: 'cost', label: 'Cost (Rs.)', numeric: true },
      { key: 'market_value', label: 'Market Value (Rs.)', numeric: true },
    ],
    totalCols: ['cost', 'market_value'],
  },
  {
    key: 'vehicles', label: 'Motor Vehicles as at 31st March 2026',
    endpoint: 'vehicles', queryKey: 'vehicles',
    defaults: { description: '', registration_no: '', cost_market_value: '' },
    fields: [
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'registration_no', label: 'Registration No.', type: 'text' },
      { key: 'date_of_acquisition', label: 'Date of Acquisition', type: 'date' },
      { key: 'cost_market_value', label: 'Cost / Market Value (Rs.)', type: 'number' },
    ],
    columns: [
      { key: 'description', label: 'Description' },
      { key: 'registration_no', label: 'Registration No.' },
      { key: 'date_of_acquisition', label: 'Date of Acquisition' },
      { key: 'cost_market_value', label: 'Cost / M. Value (Rs.)', numeric: true },
    ],
    totalCols: ['cost_market_value'],
  },
  {
    key: 'bank-balances', label: 'Bank Balances including Term Deposits as at 31.03.2026',
    endpoint: 'bank-balances', queryKey: 'bankBalances',
    defaults: { bank_name: '', account_no: '', amount_invested: '', interest: '', balance: '' },
    fields: [
      { key: 'bank_name', label: 'Bank / Institution', type: 'text' },
      { key: 'account_no', label: 'Account No.', type: 'text' },
      { key: 'amount_invested', label: 'Amount Invested (Rs.)', type: 'number' },
      { key: 'interest', label: 'Interest (Rs.)', type: 'number' },
      { key: 'balance', label: 'Balance (Rs.)', type: 'number' },
    ],
    columns: [
      { key: 'bank_name', label: 'Name of Bank / Financial Institution' },
      { key: 'account_no', label: 'Account No.' },
      { key: 'amount_invested', label: 'Amount Invested (Rs.)', numeric: true },
      { key: 'interest', label: 'Interest (Rs.)', numeric: true },
      { key: 'balance', label: 'Balance (Rs.)', numeric: true },
    ],
    totalCols: ['amount_invested', 'interest', 'balance'],
  },
  {
    key: 'shares', label: 'Shares / Securities as at 31.03.2026',
    endpoint: 'shares', queryKey: 'shares',
    defaults: { description: '', no_of_shares: '', cost_market_value: '', net_dividend_income: '' },
    fields: [
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'no_of_shares', label: 'No. of Shares', type: 'number' },
      { key: 'date_of_acquisition', label: 'Date Acquired', type: 'date' },
      { key: 'cost_market_value', label: 'Cost / Market Value (Rs.)', type: 'number' },
      { key: 'net_dividend_income', label: 'Net Dividend Income (Rs.)', type: 'number' },
    ],
    columns: [
      { key: 'description', label: 'Description' },
      { key: 'no_of_shares', label: 'No. of Shares / Stocks', numeric: true },
      { key: 'date_of_acquisition', label: 'Date of Acquisition' },
      { key: 'cost_market_value', label: 'Cost / Market Value (Rs.)', numeric: true },
      { key: 'net_dividend_income', label: 'Net Dividend Income (Rs.)', numeric: true },
    ],
    totalCols: ['cost_market_value', 'net_dividend_income'],
  },
  {
    key: 'cash', label: 'Cash in Hand as at 31.03.2026',
    endpoint: 'cash', queryKey: 'cash', isSingle: true,
    defaults: { amount: '' },
    fields: [{ key: 'amount', label: 'Amount (Rs.)', type: 'number' }],
  },
  {
    key: 'loans-given', label: 'Loans Given & Amount Receivable as at 31.03.2026',
    endpoint: 'loans-given', queryKey: 'loans',
    defaults: { borrower_name: '', amount: '' },
    fields: [
      { key: 'borrower_name', label: 'Borrower Name', type: 'text' },
      { key: 'amount', label: 'Amount (Rs.)', type: 'number' },
    ],
    columns: [
      { key: 'borrower_name', label: 'Borrower Name' },
      { key: 'amount', label: 'Amount (Rs.)', numeric: true },
    ],
    totalCols: ['amount'],
  },
  {
    key: 'gold', label: 'Gold, Silver, Gems, Jewellery etc. as at 31.03.2026',
    endpoint: 'gold', queryKey: 'gold', isSingle: true,
    defaults: { description: '', value: '' },
    fields: [
      { key: 'description', label: 'Description of Items', type: 'text' },
      { key: 'value', label: 'Estimated Value (Rs.)', type: 'number' },
    ],
  },
  {
    key: 'business', label: 'Business Properties as at 31.03.2026',
    endpoint: 'business', queryKey: 'business',
    defaults: { name_of_business: '', current_account_balance: '', capital_account_balance: '' },
    fields: [
      { key: 'name_of_business', label: 'Name of Business', type: 'text' },
      { key: 'current_account_balance', label: 'Current Account Balance (Rs.)', type: 'number' },
      { key: 'capital_account_balance', label: 'Capital Account Balance (Rs.)', type: 'number' },
    ],
    columns: [
      { key: 'name_of_business', label: 'Name of Business' },
      { key: 'current_account_balance', label: 'Current Account (Rs.)', numeric: true },
      { key: 'capital_account_balance', label: 'Capital Account Balance (Rs.)', numeric: true },
    ],
    totalCols: ['current_account_balance', 'capital_account_balance'],
  },
  {
    key: 'other', label: 'Other Assets Acquired or Gifts Received During the Year',
    endpoint: 'other', queryKey: 'otherAssets',
    defaults: { description: '', acquisition_type: 'purchase', cost_value: '' },
    fields: [
      { key: 'description', label: 'Description', type: 'text' },
      {
        key: 'acquisition_type', label: 'Acquisition Type', type: 'select',
        options: [
          { value: 'purchase', label: 'Purchase' },
          { value: 'gift', label: 'Gift' },
          { value: 'exchange', label: 'Exchange' },
        ],
      },
      { key: 'date_of_acquisition', label: 'Date of Acquisition', type: 'date' },
      { key: 'cost_value', label: 'Cost / Value (Rs.)', type: 'number' },
    ],
    columns: [
      { key: 'description', label: 'Description of Asset' },
      { key: 'acquisition_type', label: 'Gift / Exchange / Purchase' },
      { key: 'date_of_acquisition', label: 'Date of Acquisition / Receipt' },
      { key: 'cost_value', label: 'Cost / Value (Rs.)', numeric: true },
    ],
    totalCols: ['cost_value'],
  },
  {
    key: 'disposals', label: 'Disposal of Assets including Shares During the Year',
    endpoint: 'disposals', queryKey: 'disposals',
    defaults: { description: '', category: 'other', sales_proceed: '', cost: '' },
    fields: [
      { key: 'description', label: 'Description', type: 'text' },
      {
        key: 'category', label: 'Category', type: 'select',
        options: [
          { value: 'land_building', label: 'Land / Building' },
          { value: 'motor_vehicle', label: 'Motor Vehicle' },
          { value: 'shares', label: 'Shares / Securities' },
          { value: 'other', label: 'Other' },
        ],
      },
      { key: 'date_of_disposal', label: 'Date of Disposal', type: 'date' },
      { key: 'sales_proceed', label: 'Sales Proceed (Rs.)', type: 'number' },
      { key: 'date_acquired', label: 'Date Acquired', type: 'date' },
      { key: 'cost', label: 'Cost (Rs.)', type: 'number' },
    ],
    columns: [
      { key: 'description', label: 'Description' },
      { key: 'category', label: 'Category', render: v => ({ land_building: 'Land/Building', motor_vehicle: 'Motor Vehicle', shares: 'Shares/Securities', other: 'Other' }[v] || v) },
      { key: 'date_of_disposal', label: 'Date of Disposal' },
      { key: 'sales_proceed', label: 'Sales Proceed (Rs.)', numeric: true },
      { key: 'date_acquired', label: 'Date Acquired' },
      { key: 'cost', label: 'Cost (Rs.)', numeric: true },
    ],
    totalCols: ['sales_proceed', 'cost'],
  },
]

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))

function CategoryTable({ cat, data, isReadOnly, onAdd, onEdit, onDelete }) {
  const total = colKey => data.reduce((s, r) => s + parseFloat(r[colKey] || 0), 0)
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-brand-yellow uppercase tracking-wider">{cat.label}</h4>
        {!isReadOnly && (
          <button type="button" onClick={() => onAdd(cat.key)} className="btn-primary text-xs px-3 py-1.5">
            <Plus size={11} /> Add
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-brand-gray-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-black">
              {cat.columns.map(col => (
                <th key={col.key} className={`table-header ${col.numeric ? 'text-right' : 'text-left'}`}>{col.label}</th>
              ))}
              {!isReadOnly && <th className="table-header w-16 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={cat.columns.length + (isReadOnly ? 0 : 1)}
                    className="table-cell text-center text-brand-gray py-3 text-xs italic">
                  No entries
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr key={row.id} className="table-row">
                  {cat.columns.map(col => (
                    <td key={col.key} className={`table-cell ${col.numeric ? 'text-right font-mono text-white' : 'text-brand-gray'}`}>
                      {col.numeric ? numOrDash(row[col.key]) : col.render ? col.render(row[col.key]) : (row[col.key] || '—')}
                    </td>
                  ))}
                  {!isReadOnly && (
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onEdit(row, cat.key)} className="text-brand-yellow hover:opacity-80" title="Edit"><Pencil size={12} /></button>
                        <button onClick={() => onDelete(row, cat)} className="text-brand-red hover:opacity-80" title="Delete"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
            {cat.totalCols && data.length > 0 && (
              <tr className="border-t border-brand-gray-border bg-brand-black/40">
                {cat.columns.map((col, i) => (
                  <td key={col.key} className={`table-cell font-semibold ${col.numeric ? 'text-right font-mono text-brand-yellow' : 'text-white'}`}>
                    {i === 0 ? 'Total' : (cat.totalCols.includes(col.key) ? fmtAmt(total(col.key)) : '')}
                  </td>
                ))}
                {!isReadOnly && <td className="table-cell" />}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SingleSection({ cat, data, isReadOnly, onEdit }) {
  const amountField = cat.fields.find(f => f.type === 'number')
  const descField = cat.fields.find(f => f.type === 'text')
  const amount = amountField ? parseFloat(data?.[amountField.key] || 0) : 0
  const desc = descField ? data?.[descField.key] : null
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-brand-gray-border bg-brand-black-light">
        <div>
          <span className="text-xs font-semibold text-brand-yellow uppercase tracking-wider">{cat.label}</span>
          {desc && <p className="text-xs text-brand-gray mt-0.5">{desc}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-white">Rs.&nbsp;{amount > 0 ? fmtAmt(amount) : '—'}</span>
          {!isReadOnly && (
            <button onClick={onEdit} className="text-brand-yellow hover:opacity-80" title="Edit"><Pencil size={13} /></button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AssetsSection({ submissionId, isReadOnly, onNext, onPrev }) {
  const qc = useQueryClient()

  const { data: immovable = [] }    = useQuery({ queryKey: ['immovable', submissionId],    queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/immovable/`).then(r => r.data) })
  const { data: vehicles = [] }     = useQuery({ queryKey: ['vehicles', submissionId],     queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/vehicles/`).then(r => r.data) })
  const { data: bankBalances = [] } = useQuery({ queryKey: ['bankBalances', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/bank-balances/`).then(r => r.data) })
  const { data: shares = [] }       = useQuery({ queryKey: ['shares', submissionId],       queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/shares/`).then(r => r.data) })
  const { data: cashInHand }        = useQuery({ queryKey: ['cash', submissionId],         queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/cash/`).then(r => r.data) })
  const { data: loans = [] }        = useQuery({ queryKey: ['loans', submissionId],        queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/loans-given/`).then(r => r.data) })
  const { data: gold }              = useQuery({ queryKey: ['gold', submissionId],         queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/gold/`).then(r => r.data) })
  const { data: business = [] }     = useQuery({ queryKey: ['business', submissionId],     queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/business/`).then(r => r.data) })
  const { data: otherAssets = [] }  = useQuery({ queryKey: ['otherAssets', submissionId],  queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/other/`).then(r => r.data) })
  const { data: disposals = [] }    = useQuery({ queryKey: ['disposals', submissionId],    queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/disposals/`).then(r => r.data) })

  const dataMap = {
    'immovable': immovable, 'vehicles': vehicles, 'bank-balances': bankBalances,
    'shares': shares, 'cash': cashInHand, 'loans-given': loans,
    'gold': gold, 'business': business, 'other': otherAssets, 'disposals': disposals,
  }

  const [modalOpen, setModalOpen] = useState(false)
  const [modalCat, setModalCat] = useState('immovable')
  const [formVals, setFormVals] = useState({})
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  function openAddModal(catKey) {
    setModalCat(catKey)
    setFormVals({ ...CAT_MAP[catKey].defaults })
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEditModal(row, catKey) {
    setModalCat(catKey)
    setFormVals(Object.fromEntries(Object.entries(row).map(([k, v]) => [k, normVal(v)])))
    setEditTarget({ catKey, id: row.id, isSingle: false })
    setModalOpen(true)
  }

  function openSingleEditModal(catKey) {
    const existing = dataMap[catKey]
    setModalCat(catKey)
    if (existing?.id) {
      setFormVals(Object.fromEntries(Object.entries(existing).map(([k, v]) => [k, normVal(v)])))
    } else {
      setFormVals({ ...CAT_MAP[catKey].defaults })
    }
    setEditTarget({ catKey, id: existing?.id, isSingle: true })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const cat = CAT_MAP[modalCat]
      if (cat.isSingle || editTarget?.isSingle) {
        await api.post(`/tax/submissions/${submissionId}/assets/${cat.endpoint}/`, formVals)
        toast.success('Saved')
      } else if (editTarget) {
        await api.patch(`/tax/assets/${cat.endpoint}/${editTarget.id}/`, formVals)
        toast.success('Updated')
      } else {
        await api.post(`/tax/submissions/${submissionId}/assets/${cat.endpoint}/`, formVals)
        toast.success('Added')
      }
      qc.invalidateQueries([cat.queryKey, submissionId])
      setModalOpen(false)
    } catch {
      toast.error('Failed to save')
    }
    setSaving(false)
  }

  async function handleDelete(row, cat) {
    try {
      await api.delete(`/tax/assets/${cat.endpoint}/${row.id}/`)
      qc.invalidateQueries([cat.queryKey, submissionId])
      toast.success('Removed')
    } catch {
      toast.error('Failed to remove')
    }
  }

  const activeCat = CAT_MAP[modalCat]

  return (
    <div className="space-y-6">
      <div className="form-section">
        <h3 className="section-header">
          <LayoutList size={18} className="text-brand-yellow" />
          Assets &amp; Liabilities as at 31st March 2026
        </h3>
        <p className="text-sm text-brand-gray mb-6">
          Record all properties, investments, bank accounts, vehicles, and other assets.
        </p>

        {CATEGORIES.map(cat =>
          cat.isSingle ? (
            <SingleSection
              key={cat.key}
              cat={cat}
              data={dataMap[cat.key]}
              isReadOnly={isReadOnly}
              onEdit={() => openSingleEditModal(cat.key)}
            />
          ) : (
            <CategoryTable
              key={cat.key}
              cat={cat}
              data={dataMap[cat.key] || []}
              isReadOnly={isReadOnly}
              onAdd={openAddModal}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          )
        )}
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={onPrev} className="btn-secondary">
          <ChevronLeft size={15} /> Previous
        </button>
        <button type="button" onClick={onNext} className="btn-primary">
          Next: Liabilities <ChevronRight size={15} />
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-black-light border border-brand-gray-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-brand-gray-border sticky top-0 bg-brand-black-light z-10">
              <div>
                <h3 className="text-white font-semibold">
                  {editTarget && !editTarget.isSingle ? 'Edit Entry' : activeCat.isSingle ? 'Update' : 'Add Entry'}
                </h3>
                <p className="text-xs text-brand-gray mt-0.5">{activeCat.label}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-brand-gray hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {activeCat.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-brand-gray mb-1.5 font-medium uppercase tracking-wider">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formVals[field.key] ?? ''}
                      onChange={e => setFormVals(v => ({ ...v, [field.key]: e.target.value }))}
                      className="input-field w-full"
                    >
                      {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : field.type === 'number' ? (
                    <NumberInput
                      value={formVals[field.key] ?? ''}
                      onChange={e => setFormVals(v => ({ ...v, [field.key]: e.target.value }))}
                      className="input-field w-full text-right font-mono"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formVals[field.key] ?? ''}
                      onChange={e => setFormVals(v => ({ ...v, [field.key]: e.target.value }))}
                      className="input-field w-full"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-brand-gray-border">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                <Save size={14} /> {saving ? 'Saving…' : (editTarget && !editTarget.isSingle) ? 'Update' : activeCat.isSingle ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
