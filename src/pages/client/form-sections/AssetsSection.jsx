import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../services/api'
import { ChevronRight, ChevronLeft, Plus, Trash2, Pencil, X, Save, LayoutList } from 'lucide-react'
import toast from 'react-hot-toast'
import NumberInput from '../../../components/common/NumberInput'

const COLOR_MAP = {
  blue:   'bg-blue-900/40 text-blue-300 border border-blue-700/50',
  green:  'bg-green-900/40 text-green-300 border border-green-700/50',
  purple: 'bg-purple-900/40 text-purple-300 border border-purple-700/50',
  orange: 'bg-orange-900/40 text-orange-300 border border-orange-700/50',
  yellow: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50',
  teal:   'bg-teal-900/40 text-teal-300 border border-teal-700/50',
  amber:  'bg-amber-900/40 text-amber-300 border border-amber-700/50',
  pink:   'bg-pink-900/40 text-pink-300 border border-pink-700/50',
  slate:  'bg-slate-700/40 text-slate-300 border border-slate-600/50',
  red:    'bg-red-900/40 text-red-300 border border-red-700/50',
  rose:   'bg-rose-900/40 text-rose-300 border border-rose-700/50',
}

const CATEGORIES = [
  {
    key: 'immovable', label: 'Immovable Property', color: 'blue',
    endpoint: 'immovable', queryKey: 'immovable',
    getDescription: r => r.situation_of_property || '—',
    getDetail: r => r.date_of_acquisition || '—',
    getAmount: r => r.market_value,
    defaults: { situation_of_property: '', cost: '', market_value: '' },
    fields: [
      { key: 'situation_of_property', label: 'Situation of Property', type: 'text' },
      { key: 'date_of_acquisition', label: 'Date of Acquisition', type: 'date' },
      { key: 'cost', label: 'Cost (Rs.)', type: 'number' },
      { key: 'market_value', label: 'Market Value (Rs.)', type: 'number' },
    ],
  },
  {
    key: 'vehicles', label: 'Motor Vehicle', color: 'green',
    endpoint: 'vehicles', queryKey: 'vehicles',
    getDescription: r => r.description || '—',
    getDetail: r => r.registration_no || '—',
    getAmount: r => r.cost_market_value,
    defaults: { description: '', registration_no: '', cost_market_value: '' },
    fields: [
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'registration_no', label: 'Registration No.', type: 'text' },
      { key: 'date_of_acquisition', label: 'Date of Acquisition', type: 'date' },
      { key: 'cost_market_value', label: 'Cost / Market Value (Rs.)', type: 'number' },
    ],
  },
  {
    key: 'bank-balances', label: 'Bank Balance', color: 'purple',
    endpoint: 'bank-balances', queryKey: 'bankBalances',
    getDescription: r => r.bank_name || '—',
    getDetail: r => r.account_no || '—',
    getAmount: r => r.balance,
    defaults: { bank_name: '', account_no: '', amount_invested: '', interest: '', balance: '' },
    fields: [
      { key: 'bank_name', label: 'Bank / Institution', type: 'text' },
      { key: 'account_no', label: 'Account No.', type: 'text' },
      { key: 'amount_invested', label: 'Amount Invested (Rs.)', type: 'number' },
      { key: 'interest', label: 'Interest (Rs.)', type: 'number' },
      { key: 'balance', label: 'Balance (Rs.)', type: 'number' },
    ],
  },
  {
    key: 'shares', label: 'Shares / Stocks', color: 'orange',
    endpoint: 'shares', queryKey: 'shares',
    getDescription: r => r.description || '—',
    getDetail: r => r.no_of_shares ? `${r.no_of_shares} shares` : '—',
    getAmount: r => r.cost_market_value,
    defaults: { description: '', no_of_shares: '', cost_market_value: '', net_dividend_income: '' },
    fields: [
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'no_of_shares', label: 'No. of Shares', type: 'number' },
      { key: 'date_of_acquisition', label: 'Date Acquired', type: 'date' },
      { key: 'cost_market_value', label: 'Cost / Market Value (Rs.)', type: 'number' },
      { key: 'net_dividend_income', label: 'Net Dividend Income (Rs.)', type: 'number' },
    ],
  },
  {
    key: 'cash', label: 'Cash in Hand', color: 'yellow',
    endpoint: 'cash', queryKey: 'cash', isSingle: true,
    getDescription: () => 'Cash in Hand',
    getDetail: () => '—',
    getAmount: r => r?.amount,
    defaults: { amount: '' },
    fields: [
      { key: 'amount', label: 'Amount (Rs.)', type: 'number' },
    ],
  },
  {
    key: 'loans-given', label: 'Loans Given', color: 'teal',
    endpoint: 'loans-given', queryKey: 'loans',
    getDescription: r => r.borrower_name || '—',
    getDetail: () => '—',
    getAmount: r => r.amount,
    defaults: { borrower_name: '', amount: '' },
    fields: [
      { key: 'borrower_name', label: 'Borrower Name', type: 'text' },
      { key: 'amount', label: 'Amount (Rs.)', type: 'number' },
    ],
  },
  {
    key: 'gold', label: 'Gold / Jewellery', color: 'amber',
    endpoint: 'gold', queryKey: 'gold', isSingle: true,
    getDescription: r => r?.description || 'Gold / Silver / Gems / Jewellery',
    getDetail: () => '—',
    getAmount: r => r?.value,
    defaults: { description: '', value: '' },
    fields: [
      { key: 'description', label: 'Description of Items', type: 'text' },
      { key: 'value', label: 'Estimated Value (Rs.)', type: 'number' },
    ],
  },
  {
    key: 'business', label: 'Business Properties', color: 'pink',
    endpoint: 'business', queryKey: 'business',
    getDescription: r => r.name_of_business || '—',
    getDetail: () => '—',
    getAmount: r => parseFloat(r.capital_account_balance || 0),
    defaults: { name_of_business: '', current_account_balance: '', capital_account_balance: '' },
    fields: [
      { key: 'name_of_business', label: 'Name of Business', type: 'text' },
      { key: 'current_account_balance', label: 'Current Account Balance (Rs.)', type: 'number' },
      { key: 'capital_account_balance', label: 'Capital Account Balance (Rs.)', type: 'number' },
    ],
  },
  {
    key: 'other', label: 'Other Assets', color: 'slate',
    endpoint: 'other', queryKey: 'otherAssets',
    getDescription: r => r.description || '—',
    getDetail: r => r.acquisition_type || '—',
    getAmount: r => r.cost_value,
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
  },
  {
    key: 'disposals', label: 'Asset Disposals', color: 'red',
    endpoint: 'disposals', queryKey: 'disposals',
    getDescription: r => r.description || '—',
    getDetail: r => r.date_of_disposal || '—',
    getAmount: r => r.sales_proceed,
    defaults: { description: '', sales_proceed: '', cost: '' },
    fields: [
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'date_of_disposal', label: 'Date of Disposal', type: 'date' },
      { key: 'sales_proceed', label: 'Sales Proceed (Rs.)', type: 'number' },
      { key: 'date_acquired', label: 'Date Acquired', type: 'date' },
      { key: 'cost', label: 'Cost (Rs.)', type: 'number' },
    ],
  },
]

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))

function fmt(v) {
  const n = parseFloat(v || 0)
  return isNaN(n) ? 'Rs. 0.00' : `Rs. ${n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AssetsSection({ submissionId, isReadOnly, onNext, onPrev }) {
  const qc = useQueryClient()

  const { data: immovable = [] }   = useQuery({ queryKey: ['immovable', submissionId],   queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/immovable/`).then(r => r.data) })
  const { data: vehicles = [] }    = useQuery({ queryKey: ['vehicles', submissionId],    queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/vehicles/`).then(r => r.data) })
  const { data: bankBalances = [] }= useQuery({ queryKey: ['bankBalances', submissionId],queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/bank-balances/`).then(r => r.data) })
  const { data: shares = [] }      = useQuery({ queryKey: ['shares', submissionId],      queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/shares/`).then(r => r.data) })
  const { data: cashInHand }       = useQuery({ queryKey: ['cash', submissionId],        queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/cash/`).then(r => r.data) })
  const { data: loans = [] }       = useQuery({ queryKey: ['loans', submissionId],       queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/loans-given/`).then(r => r.data) })
  const { data: gold }             = useQuery({ queryKey: ['gold', submissionId],        queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/gold/`).then(r => r.data) })
  const { data: business = [] }    = useQuery({ queryKey: ['business', submissionId],    queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/business/`).then(r => r.data) })
  const { data: otherAssets = [] } = useQuery({ queryKey: ['otherAssets', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/other/`).then(r => r.data) })
  const { data: disposals = [] }   = useQuery({ queryKey: ['disposals', submissionId],   queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/disposals/`).then(r => r.data) })
  const [filterCat, setFilterCat] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalCat, setModalCat] = useState('immovable')
  const [formVals, setFormVals] = useState({})
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const allRows = useMemo(() => {
    const rows = []

    const addList = (catKey, data) => {
      const cat = CAT_MAP[catKey]
      data.forEach(r => rows.push({
        id: r.id, category: catKey, catDef: cat, isSingle: false,
        description: cat.getDescription(r),
        detail: cat.getDetail(r),
        amount: cat.getAmount(r),
        raw: r,
      }))
    }

    addList('immovable', immovable)
    addList('vehicles', vehicles)
    addList('bank-balances', bankBalances)
    addList('shares', shares)
    addList('loans-given', loans)
    addList('business', business)
    addList('other', otherAssets)
    addList('disposals', disposals)

    const cashCat = CAT_MAP['cash']
    if (parseFloat(cashInHand?.amount) > 0) {
      rows.push({
        id: 'cash-single', category: 'cash', catDef: cashCat, isSingle: true,
        description: cashCat.getDescription(cashInHand),
        detail: '—',
        amount: cashInHand?.amount,
        raw: cashInHand,
      })
    }

    const goldCat = CAT_MAP['gold']
    if (parseFloat(gold?.value) > 0) {
      rows.push({
        id: 'gold-single', category: 'gold', catDef: goldCat, isSingle: true,
        description: goldCat.getDescription(gold),
        detail: '—',
        amount: gold?.value,
        raw: gold,
      })
    }

    return rows
  }, [immovable, vehicles, bankBalances, shares, loans, business, otherAssets, disposals, cashInHand, gold])

  const visibleRows = filterCat === 'all' ? allRows : allRows.filter(r => r.category === filterCat)

  function openAddModal() {
    setModalCat(CATEGORIES[0].key)
    setFormVals({ ...CATEGORIES[0].defaults })
    setEditTarget(null)
    setModalOpen(true)
  }

  function openEditModal(row) {
    setModalCat(row.category)
    const nv = v => (v == null || v === '' || (!isNaN(parseFloat(v)) && parseFloat(v) === 0)) ? '' : v
    setFormVals(Object.fromEntries(Object.entries(row.raw).map(([k, v]) => [k, typeof v === 'object' ? v : nv(v)])))
    setEditTarget({ catKey: row.category, id: row.id, isSingle: row.isSingle })
    setModalOpen(true)
  }

  function onCategoryChange(key) {
    setModalCat(key)
    // Always reset form values when category changes so stale field keys don't carry over
    setFormVals({ ...CAT_MAP[key].defaults })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const cat = CAT_MAP[modalCat]
      const categoryChanged = editTarget && modalCat !== editTarget.catKey

      if (editTarget) {
        if (categoryChanged) {
          const oldCat = CAT_MAP[editTarget.catKey]
          if (editTarget.isSingle) {
            // Clear the old singleton by posting its defaults
            await api.post(`/tax/submissions/${submissionId}/assets/${oldCat.endpoint}/`, oldCat.defaults)
          } else {
            await api.delete(`/tax/assets/${oldCat.endpoint}/${editTarget.id}/`)
          }
          qc.invalidateQueries([oldCat.queryKey, submissionId])
          await api.post(`/tax/submissions/${submissionId}/assets/${cat.endpoint}/`, formVals)
          toast.success('Moved to new category')
        } else if (cat.isSingle) {
          await api.post(`/tax/submissions/${submissionId}/assets/${cat.endpoint}/`, formVals)
          toast.success('Updated')
        } else {
          await api.patch(`/tax/assets/${cat.endpoint}/${editTarget.id}/`, formVals)
          toast.success('Updated')
        }
      } else {
        await api.post(`/tax/submissions/${submissionId}/assets/${cat.endpoint}/`, formVals)
        toast.success(cat.isSingle ? 'Saved' : 'Added')
      }

      qc.invalidateQueries([cat.queryKey, submissionId])
      setModalOpen(false)
    } catch {
      toast.error('Failed to save')
    }
    setSaving(false)
  }

  async function handleDelete(row) {
    try {
      if (row.isSingle) {
        // Clear singleton by posting its zero defaults
        await api.post(`/tax/submissions/${submissionId}/assets/${row.catDef.endpoint}/`, row.catDef.defaults)
      } else {
        await api.delete(`/tax/assets/${row.catDef.endpoint}/${row.id}/`)
      }
      qc.invalidateQueries([row.catDef.queryKey, submissionId])
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
        <p className="text-sm text-brand-gray mb-5">
          Record all properties, investments, bank accounts, vehicles, and liabilities. Select a category to filter the list.
        </p>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-brand-gray font-medium">Filter by:</label>
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="input-field py-1.5 text-sm min-w-[190px]"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          {!isReadOnly && (
            <button type="button" onClick={openAddModal} className="btn-primary text-sm px-4 py-2">
              <Plus size={14} /> Add Entry
            </button>
          )}
        </div>

        {/* Unified Table */}
        <div className="overflow-x-auto rounded-lg border border-brand-gray-border mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-black">
                <th className="table-header text-left w-8">#</th>
                <th className="table-header text-left">Category</th>
                <th className="table-header text-left">Description</th>
                <th className="table-header text-left">Key Details</th>
                <th className="table-header text-right">Amount (Rs.)</th>
                {!isReadOnly && <th className="table-header w-20 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 5 : 6} className="table-cell text-center text-brand-gray py-10">
                    No entries found — click &quot;Add Entry&quot; to begin
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, idx) => (
                  <tr key={`${row.category}-${row.id}`} className="table-row">
                    <td className="table-cell text-brand-gray">{idx + 1}</td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${COLOR_MAP[row.catDef.color]}`}>
                        {row.catDef.label}
                      </span>
                    </td>
                    <td className="table-cell min-w-[180px] text-white">{row.description}</td>
                    <td className="table-cell text-brand-gray">{row.detail}</td>
                    <td className="table-cell text-right font-mono text-white">{fmt(row.amount)}</td>
                    {!isReadOnly && (
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(row)}
                            className="text-brand-yellow hover:opacity-80 transition-opacity"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            className="text-brand-red hover:opacity-80 transition-opacity"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button type="button" onClick={onPrev} className="btn-secondary">
          <ChevronLeft size={15} /> Previous
        </button>
        <button type="button" onClick={onNext} className="btn-primary">
          Next: Liabilities <ChevronRight size={15} />
        </button>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-black-light border border-brand-gray-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-brand-gray-border sticky top-0 bg-brand-black-light z-10">
              <div>
                <h3 className="text-white font-semibold">
                  {editTarget ? 'Edit Entry' : 'Add New Entry'}
                </h3>
                <p className="text-xs text-brand-gray mt-0.5">
                  {editTarget ? 'Update the details below' : 'Select a category and fill in the details'}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-brand-gray hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Category selector */}
              <div>
                <label className="block text-xs text-brand-gray mb-1.5 font-medium uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={modalCat}
                  onChange={e => onCategoryChange(e.target.value)}
                  className="input-field w-full"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic fields */}
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
                      {field.options.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
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

              {activeCat.isSingle && (
                <p className="text-xs text-brand-gray bg-brand-black rounded p-2">
                  This is a single-record field. Saving will update the existing value.
                </p>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-brand-gray-border">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                <Save size={14} /> {saving ? 'Saving…' : editTarget ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
