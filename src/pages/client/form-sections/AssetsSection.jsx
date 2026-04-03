import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '../../../services/api'
import { ChevronRight, ChevronLeft, Plus, Trash2, Save, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

function TableSection({ title, columns, rows, onAdd, onDelete, isReadOnly, renderRow, emptyLabel }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-brand-yellow uppercase tracking-wider">{title}</h4>
        {!isReadOnly && (
          <button type="button" onClick={onAdd} className="btn-secondary text-xs px-3 py-1.5">
            <Plus size={13} /> Add Row
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-brand-gray-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-black">
              {columns.map(c => (
                <th key={c} className="table-header text-left whitespace-nowrap">{c}</th>
              ))}
              {!isReadOnly && <th className="table-header w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="table-cell text-center text-brand-gray py-6">{emptyLabel || 'No entries'}</td></tr>
            ) : (
              rows.map((row, idx) => renderRow(row, idx, isReadOnly, onDelete))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AssetsSection({ submissionId, isReadOnly, onNext, onPrev }) {
  const qc = useQueryClient()

  const { data: immovable = [] } = useQuery({ queryKey: ['immovable', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/immovable/`).then(r => r.data) })
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/vehicles/`).then(r => r.data) })
  const { data: bankBalances = [] } = useQuery({ queryKey: ['bankBalances', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/bank-balances/`).then(r => r.data) })
  const { data: shares = [] } = useQuery({ queryKey: ['shares', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/shares/`).then(r => r.data) })
  const { data: cashInHand } = useQuery({ queryKey: ['cash', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/cash/`).then(r => r.data) })
  const { data: loans = [] } = useQuery({ queryKey: ['loans', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/loans-given/`).then(r => r.data) })
  const { data: gold } = useQuery({ queryKey: ['gold', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/gold/`).then(r => r.data) })
  const { data: business = [] } = useQuery({ queryKey: ['business', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/business/`).then(r => r.data) })
  const { data: otherAssets = [] } = useQuery({ queryKey: ['otherAssets', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/other/`).then(r => r.data) })
  const { data: disposals = [] } = useQuery({ queryKey: ['disposals', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/assets/disposals/`).then(r => r.data) })

  const [cashValue, setCashValue] = useState('')
  const [goldValue, setGoldValue] = useState('')
  const [goldDesc, setGoldDesc] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (cashInHand?.amount !== undefined) setCashValue(cashInHand.amount) }, [cashInHand])
  useEffect(() => {
    if (gold?.value !== undefined) setGoldValue(gold.value)
    if (gold?.description !== undefined) setGoldDesc(gold.description)
  }, [gold])

  async function addRow(endpoint, defaults, queryKey) {
    try {
      await api.post(`/tax/submissions/${submissionId}/assets/${endpoint}/`, defaults)
      qc.invalidateQueries([queryKey || endpoint, submissionId])
    } catch { toast.error('Failed to add row') }
  }

  async function deleteRow(endpoint, id, queryKey) {
    try {
      await api.delete(`/tax/assets/${endpoint}/${id}/`)
      qc.invalidateQueries([queryKey, submissionId])
    } catch { toast.error('Failed to delete') }
  }

  async function updateRow(endpoint, id, data, queryKey) {
    try {
      await api.patch(`/tax/assets/${endpoint}/${id}/`, data)
      qc.invalidateQueries([queryKey, submissionId])
    } catch { toast.error('Failed to update') }
  }

  async function saveCashGold() {
    setSaving(true)
    try {
      await api.post(`/tax/submissions/${submissionId}/assets/cash/`, { amount: cashValue || 0 })
      await api.post(`/tax/submissions/${submissionId}/assets/gold/`, { value: goldValue || 0, description: goldDesc })
      toast.success('Saved')
    } catch { toast.error('Failed') }
    setSaving(false)
  }

  function EditableCell({ value, onChange, type = 'text', className = '' }) {
    return (
      <input
        defaultValue={value}
        type={type}
        step={type === 'number' ? '0.01' : undefined}
        onBlur={(e) => onChange(e.target.value)}
        disabled={isReadOnly}
        className={`bg-transparent border-0 text-white text-sm w-full focus:outline-none focus:bg-brand-black-soft rounded px-1 ${type === 'number' ? 'text-right font-mono' : ''} ${className}`}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="form-section">
        <h3 className="section-header">
          <Building2 size={18} className="text-brand-yellow" />
          Assets as at 31st March 2026
        </h3>

        {/* 1. Immovable Properties */}
        <TableSection
          title="1. Immovable Properties"
          columns={['#', 'Situation of Property', 'Date of Acquisition', 'Cost (Rs.)', 'Market Value (Rs.)']}
          rows={immovable}
          isReadOnly={isReadOnly}
          onAdd={() => addRow('immovable', { situation_of_property: '', cost: 0, market_value: 0 })}
          emptyLabel="No immovable properties — click Add Row to enter"
          renderRow={(row, idx, ro, onDel) => (
            <tr key={row.id} className="table-row">
              <td className="table-cell text-brand-gray w-8">{idx + 1}</td>
              <td className="table-cell min-w-[200px]">
                <EditableCell value={row.situation_of_property} onChange={(v) => !ro && updateRow('immovable', row.id, { situation_of_property: v }, 'immovable')} />
              </td>
              <td className="table-cell">
                <EditableCell value={row.date_of_acquisition || ''} type="date" onChange={(v) => !ro && updateRow('immovable', row.id, { date_of_acquisition: v }, 'immovable')} />
              </td>
              <td className="table-cell">
                <EditableCell value={row.cost} type="number" onChange={(v) => !ro && updateRow('immovable', row.id, { cost: v }, 'immovable')} />
              </td>
              <td className="table-cell">
                <EditableCell value={row.market_value} type="number" onChange={(v) => !ro && updateRow('immovable', row.id, { market_value: v }, 'immovable')} />
              </td>
              {!ro && <td className="table-cell"><button onClick={() => onDel(row.id)} className="text-brand-red hover:opacity-80"><Trash2 size={14} /></button></td>}
            </tr>
          )}
          onDelete={(id) => deleteRow('immovable', id, 'immovable')}
        />

        {/* 2. Motor Vehicles */}
        <TableSection
          title="2. Motor Vehicles"
          columns={['#', 'Description', 'Reg. No.', 'Date of Acquisition', 'Cost/Market Value (Rs.)']}
          rows={vehicles}
          isReadOnly={isReadOnly}
          onAdd={() => addRow('vehicles', { description: '', registration_no: '', cost_market_value: 0 })}
          emptyLabel="No motor vehicles"
          renderRow={(row, idx, ro, onDel) => (
            <tr key={row.id} className="table-row">
              <td className="table-cell text-brand-gray w-8">{idx + 1}</td>
              <td className="table-cell"><EditableCell value={row.description} onChange={(v) => !ro && updateRow('vehicles', row.id, { description: v }, 'vehicles')} /></td>
              <td className="table-cell"><EditableCell value={row.registration_no} onChange={(v) => !ro && updateRow('vehicles', row.id, { registration_no: v }, 'vehicles')} /></td>
              <td className="table-cell"><EditableCell value={row.date_of_acquisition || ''} type="date" onChange={(v) => !ro && updateRow('vehicles', row.id, { date_of_acquisition: v }, 'vehicles')} /></td>
              <td className="table-cell"><EditableCell value={row.cost_market_value} type="number" onChange={(v) => !ro && updateRow('vehicles', row.id, { cost_market_value: v }, 'vehicles')} /></td>
              {!ro && <td className="table-cell"><button onClick={() => onDel(row.id)} className="text-brand-red hover:opacity-80"><Trash2 size={14} /></button></td>}
            </tr>
          )}
          onDelete={(id) => deleteRow('vehicles', id, 'vehicles')}
        />

        {/* 3. Bank Balances */}
        <TableSection
          title="3. Bank Balances (incl. Term Deposits) as at 31.03.2026"
          columns={['#', 'Bank/Institution', 'Account No.', 'Amount Invested', 'Interest', 'Balance']}
          rows={bankBalances}
          isReadOnly={isReadOnly}
          onAdd={() => addRow('bank-balances', { bank_name: '', account_no: '', amount_invested: 0, interest: 0, balance: 0 }, 'bankBalances')}
          emptyLabel="No bank balances"
          renderRow={(row, idx, ro, onDel) => (
            <tr key={row.id} className="table-row">
              <td className="table-cell text-brand-gray w-8">{idx + 1}</td>
              <td className="table-cell"><EditableCell value={row.bank_name} onChange={(v) => !ro && updateRow('bank-balances', row.id, { bank_name: v }, 'bankBalances')} /></td>
              <td className="table-cell"><EditableCell value={row.account_no} onChange={(v) => !ro && updateRow('bank-balances', row.id, { account_no: v }, 'bankBalances')} /></td>
              <td className="table-cell"><EditableCell value={row.amount_invested} type="number" onChange={(v) => !ro && updateRow('bank-balances', row.id, { amount_invested: v }, 'bankBalances')} /></td>
              <td className="table-cell"><EditableCell value={row.interest} type="number" onChange={(v) => !ro && updateRow('bank-balances', row.id, { interest: v }, 'bankBalances')} /></td>
              <td className="table-cell"><EditableCell value={row.balance} type="number" onChange={(v) => !ro && updateRow('bank-balances', row.id, { balance: v }, 'bankBalances')} /></td>
              {!ro && <td className="table-cell"><button onClick={() => onDel(row.id)} className="text-brand-red hover:opacity-80"><Trash2 size={14} /></button></td>}
            </tr>
          )}
          onDelete={(id) => deleteRow('bank-balances', id, 'bankBalances')}
        />

        {/* 4. Shares/Stocks */}
        <TableSection
          title="4. Shares / Stocks / Securities"
          columns={['#', 'Description', 'No. of Shares', 'Date Acquired', 'Cost/Mkt Value', 'Net Dividend']}
          rows={shares}
          isReadOnly={isReadOnly}
          onAdd={() => addRow('shares', { description: '', no_of_shares: 0, cost_market_value: 0, net_dividend_income: 0 })}
          emptyLabel="No shares or stocks"
          renderRow={(row, idx, ro, onDel) => (
            <tr key={row.id} className="table-row">
              <td className="table-cell text-brand-gray w-8">{idx + 1}</td>
              <td className="table-cell"><EditableCell value={row.description} onChange={(v) => !ro && updateRow('shares', row.id, { description: v }, 'shares')} /></td>
              <td className="table-cell"><EditableCell value={row.no_of_shares} type="number" onChange={(v) => !ro && updateRow('shares', row.id, { no_of_shares: v }, 'shares')} /></td>
              <td className="table-cell"><EditableCell value={row.date_of_acquisition || ''} type="date" onChange={(v) => !ro && updateRow('shares', row.id, { date_of_acquisition: v }, 'shares')} /></td>
              <td className="table-cell"><EditableCell value={row.cost_market_value} type="number" onChange={(v) => !ro && updateRow('shares', row.id, { cost_market_value: v }, 'shares')} /></td>
              <td className="table-cell"><EditableCell value={row.net_dividend_income} type="number" onChange={(v) => !ro && updateRow('shares', row.id, { net_dividend_income: v }, 'shares')} /></td>
              {!ro && <td className="table-cell"><button onClick={() => onDel(row.id)} className="text-brand-red hover:opacity-80"><Trash2 size={14} /></button></td>}
            </tr>
          )}
          onDelete={(id) => deleteRow('shares', id, 'shares')}
        />

        {/* 5 & 7. Cash in Hand / Gold */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-semibold text-brand-yellow mb-2 uppercase tracking-wider">5. Cash in Hand</h4>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
              <input value={cashValue} onChange={(e) => setCashValue(e.target.value)} type="number" step="0.01" min="0" disabled={isReadOnly} className="input-field pl-10 text-right font-mono" placeholder="0.00" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-brand-yellow mb-2 uppercase tracking-wider">7. Gold, Silver, Gems, Jewellery</h4>
            <input value={goldDesc} onChange={(e) => setGoldDesc(e.target.value)} disabled={isReadOnly} className="input-field mb-2" placeholder="Description of items" />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
              <input value={goldValue} onChange={(e) => setGoldValue(e.target.value)} type="number" step="0.01" min="0" disabled={isReadOnly} className="input-field pl-10 text-right font-mono" placeholder="Estimated value" />
            </div>
          </div>
        </div>

        {/* 6. Loans Given */}
        <TableSection
          title="6. Loans Given & Amounts Receivable"
          columns={['#', 'Borrower Name', 'Amount (Rs.)']}
          rows={loans}
          isReadOnly={isReadOnly}
          onAdd={() => addRow('loans-given', { borrower_name: '', amount: 0 }, 'loans')}
          emptyLabel="No loans given"
          renderRow={(row, idx, ro, onDel) => (
            <tr key={row.id} className="table-row">
              <td className="table-cell text-brand-gray w-8">{idx + 1}</td>
              <td className="table-cell"><EditableCell value={row.borrower_name} onChange={(v) => !ro && updateRow('loans-given', row.id, { borrower_name: v }, 'loans')} /></td>
              <td className="table-cell"><EditableCell value={row.amount} type="number" onChange={(v) => !ro && updateRow('loans-given', row.id, { amount: v }, 'loans')} /></td>
              {!ro && <td className="table-cell"><button onClick={() => onDel(row.id)} className="text-brand-red hover:opacity-80"><Trash2 size={14} /></button></td>}
            </tr>
          )}
          onDelete={(id) => deleteRow('loans-given', id, 'loans')}
        />

        {/* 8. Business Properties */}
        <TableSection
          title="8. Properties / Capital Accounts held as part of Business"
          columns={['#', 'Name of Business', 'Current Account Balance (Rs.)', 'Capital Account Balance (Rs.)']}
          rows={business}
          isReadOnly={isReadOnly}
          onAdd={() => addRow('business', { name_of_business: '', current_account_balance: 0, capital_account_balance: 0 })}
          emptyLabel="No business properties"
          renderRow={(row, idx, ro, onDel) => (
            <tr key={row.id} className="table-row">
              <td className="table-cell text-brand-gray w-8">{idx + 1}</td>
              <td className="table-cell"><EditableCell value={row.name_of_business} onChange={(v) => !ro && updateRow('business', row.id, { name_of_business: v }, 'business')} /></td>
              <td className="table-cell"><EditableCell value={row.current_account_balance} type="number" onChange={(v) => !ro && updateRow('business', row.id, { current_account_balance: v }, 'business')} /></td>
              <td className="table-cell"><EditableCell value={row.capital_account_balance} type="number" onChange={(v) => !ro && updateRow('business', row.id, { capital_account_balance: v }, 'business')} /></td>
              {!ro && <td className="table-cell"><button onClick={() => onDel(row.id)} className="text-brand-red hover:opacity-80"><Trash2 size={14} /></button></td>}
            </tr>
          )}
          onDelete={(id) => deleteRow('business', id, 'business')}
        />

        {/* 9. Other Assets */}
        <TableSection
          title="9. Any Other Assets Acquired / Gifts Received During the Year"
          columns={['#', 'Description', 'Gift/Purchase/Exchange', 'Date of Acquisition', 'Cost/Value (Rs.)']}
          rows={otherAssets}
          isReadOnly={isReadOnly}
          onAdd={() => addRow('other', { description: '', acquisition_type: 'purchase', cost_value: 0 }, 'otherAssets')}
          emptyLabel="No other assets"
          renderRow={(row, idx, ro, onDel) => (
            <tr key={row.id} className="table-row">
              <td className="table-cell text-brand-gray w-8">{idx + 1}</td>
              <td className="table-cell"><EditableCell value={row.description} onChange={(v) => !ro && updateRow('other', row.id, { description: v }, 'otherAssets')} /></td>
              <td className="table-cell">
                {ro ? row.acquisition_type : (
                  <select defaultValue={row.acquisition_type} onChange={(e) => updateRow('other', row.id, { acquisition_type: e.target.value }, 'otherAssets')} className="bg-transparent text-white text-sm border-0 focus:outline-none">
                    <option value="purchase" className="bg-brand-black">Purchase</option>
                    <option value="gift" className="bg-brand-black">Gift</option>
                    <option value="exchange" className="bg-brand-black">Exchange</option>
                  </select>
                )}
              </td>
              <td className="table-cell"><EditableCell value={row.date_of_acquisition || ''} type="date" onChange={(v) => !ro && updateRow('other', row.id, { date_of_acquisition: v }, 'otherAssets')} /></td>
              <td className="table-cell"><EditableCell value={row.cost_value} type="number" onChange={(v) => !ro && updateRow('other', row.id, { cost_value: v }, 'otherAssets')} /></td>
              {!ro && <td className="table-cell"><button onClick={() => onDel(row.id)} className="text-brand-red hover:opacity-80"><Trash2 size={14} /></button></td>}
            </tr>
          )}
          onDelete={(id) => deleteRow('other', id, 'otherAssets')}
        />

        {/* 10. Disposals */}
        <TableSection
          title="10. Disposal of Assets (Sales/Transfer/Gift) During the Year"
          columns={['#', 'Description', 'Date of Disposal', 'Sales Proceed (Rs.)', 'Date Acquired', 'Cost (Rs.)']}
          rows={disposals}
          isReadOnly={isReadOnly}
          onAdd={() => addRow('disposals', { description: '', sales_proceed: 0, cost: 0 })}
          emptyLabel="No disposals during the year"
          renderRow={(row, idx, ro, onDel) => (
            <tr key={row.id} className="table-row">
              <td className="table-cell text-brand-gray w-8">{idx + 1}</td>
              <td className="table-cell"><EditableCell value={row.description} onChange={(v) => !ro && updateRow('disposals', row.id, { description: v }, 'disposals')} /></td>
              <td className="table-cell"><EditableCell value={row.date_of_disposal || ''} type="date" onChange={(v) => !ro && updateRow('disposals', row.id, { date_of_disposal: v }, 'disposals')} /></td>
              <td className="table-cell"><EditableCell value={row.sales_proceed} type="number" onChange={(v) => !ro && updateRow('disposals', row.id, { sales_proceed: v }, 'disposals')} /></td>
              <td className="table-cell"><EditableCell value={row.date_acquired || ''} type="date" onChange={(v) => !ro && updateRow('disposals', row.id, { date_acquired: v }, 'disposals')} /></td>
              <td className="table-cell"><EditableCell value={row.cost} type="number" onChange={(v) => !ro && updateRow('disposals', row.id, { cost: v }, 'disposals')} /></td>
              {!ro && <td className="table-cell"><button onClick={() => onDel(row.id)} className="text-brand-red hover:opacity-80"><Trash2 size={14} /></button></td>}
            </tr>
          )}
          onDelete={(id) => deleteRow('disposals', id, 'disposals')}
        />

        {!isReadOnly && (
          <div className="flex justify-end pt-2">
            <button type="button" onClick={saveCashGold} disabled={saving} className="btn-primary">
              <Save size={15} /> {saving ? 'Saving...' : 'Save Cash & Jewellery'}
            </button>
          </div>
        )}
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
    </div>
  )

}
