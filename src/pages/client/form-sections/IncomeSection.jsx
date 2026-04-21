import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../../services/api'
import FileUpload from '../../../components/common/FileUpload'
import { formatCurrency } from '../../../utils/format'
import { Save, ChevronRight, DollarSign, Plus, Minus } from 'lucide-react'
import toast from 'react-hot-toast'

function AmountRow({ label, fieldName, register, hint, required }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start py-3 border-b border-brand-gray-border last:border-0">
      <div>
        <p className="text-sm text-white font-medium">{label}</p>
        {hint && <p className="text-xs text-brand-gray mt-0.5">{hint}</p>}
      </div>
      <div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
          <input
            {...register(fieldName)}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="input-field pl-10 text-right font-mono"
          />
        </div>
      </div>
    </div>
  )
}

export default function IncomeSection({ submissionId, documents, onUpload, onDeleteDoc, isReadOnly, onNext, onRefresh }) {
  const qc = useQueryClient()

  // Load existing data
  const queries = {
    local: useQuery({ queryKey: ['income-local', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/local-employment/`).then(r => r.data) }),
    foreign: useQuery({ queryKey: ['income-foreign', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/foreign/`).then(r => r.data) }),
    terminal: useQuery({ queryKey: ['income-terminal', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/terminal-benefit/`).then(r => r.data) }),
    rent: useQuery({ queryKey: ['income-rent', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/rent/`).then(r => r.data) }),
    interest: useQuery({ queryKey: ['income-interest', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/interest/`).then(r => r.data) }),
    dividend: useQuery({ queryKey: ['income-dividend', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/dividend/`).then(r => r.data) }),
    sole: useQuery({ queryKey: ['income-sole', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/sole-proprietorship/`).then(r => r.data) }),
    other: useQuery({ queryKey: ['income-other', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/other/`).then(r => r.data) }),
    qp: useQuery({ queryKey: ['qualifying-payments', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/qualifying-payments/`).then(r => r.data) }),
    tc: useQuery({ queryKey: ['tax-credits', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/tax-credits/`).then(r => r.data) }),
    sa: useQuery({ queryKey: ['self-assessment', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/self-assessment/`).then(r => r.data) }),
  }

  const [saving, setSaving] = useState(false)

  const { register: regIncome, handleSubmit: handleIncome, reset: resetIncome, watch: watchIncome } = useForm()
  const { register: regQP, handleSubmit: handleQP, reset: resetQP } = useForm()
  const { register: regTC, handleSubmit: handleTC, reset: resetTC } = useForm()

  const watchedRentGross = watchIncome('rent_gross')
  const liveRentRelief = Math.round(parseFloat(watchedRentGross || 0) * 0.25 * 100) / 100

  useEffect(() => {
    const d = queries
    resetIncome({
      local_amount: d.local.data?.amount || '',
      employer_name: d.local.data?.employer_name || '',
      foreign_employment_service_fee: d.foreign.data?.employment_service_fee || '',
      foreign_other: d.foreign.data?.other_foreign_income || '',
      terminal_amount: d.terminal.data?.amount || '',
      terminal_benefit_types: d.terminal.data?.benefit_types || '',
      rent_gross: d.rent.data?.gross_amount || '',
      rent_wht: d.rent.data?.wht_deducted || '',
      interest_amount: d.interest.data?.amount || '',
      interest_wht: d.interest.data?.wht_deducted || '',
      dividend_amount: d.dividend.data?.amount || '',
      dividend_exempt_amount: d.dividend.data?.exempt_amount || '',
      sole_amount: d.sole.data?.amount || '',
      sole_business_name: d.sole.data?.business_name || '',
      other_amount: d.other.data?.amount || '',
      other_description: d.other.data?.description || '',
    })
  }, [Object.values(queries).map(q => q.data).join(',')])

  useEffect(() => {
    resetQP({
      donation_charitable: queries.qp.data?.donation_charitable || '',
      donation_government: queries.qp.data?.donation_government || '',
      solar_panels_expenditure: queries.qp.data?.solar_panels_expenditure || '',
    })
  }, [queries.qp.data])

  useEffect(() => {
    resetTC({
      apit_on_salary: queries.tc.data?.apit_on_salary || '',
      wht_rent_interest_service: queries.tc.data?.wht_rent_interest_service || '',
      partnership_tax_credit: queries.tc.data?.partnership_tax_credit || '',
    })
  }, [queries.tc.data])

  async function saveIncome(data) {
    setSaving(true)
    try {
      await Promise.all([
        api.post(`/tax/submissions/${submissionId}/income/local-employment/`, { amount: data.local_amount || 0, employer_name: data.employer_name }),
        api.post(`/tax/submissions/${submissionId}/income/foreign/`, { employment_service_fee: data.foreign_employment_service_fee || 0, other_foreign_income: data.foreign_other || 0 }),
        api.post(`/tax/submissions/${submissionId}/income/terminal-benefit/`, { amount: data.terminal_amount || 0, benefit_types: data.terminal_benefit_types }),
        api.post(`/tax/submissions/${submissionId}/income/rent/`, { gross_amount: data.rent_gross || 0, wht_deducted: data.rent_wht || 0 }),
        api.post(`/tax/submissions/${submissionId}/income/interest/`, { amount: data.interest_amount || 0, wht_deducted: data.interest_wht || 0 }),
        api.post(`/tax/submissions/${submissionId}/income/dividend/`, { amount: data.dividend_amount || 0, exempt_amount: data.dividend_exempt_amount || 0 }),
        api.post(`/tax/submissions/${submissionId}/income/sole-proprietorship/`, { amount: data.sole_amount || 0, business_name: data.sole_business_name }),
        api.post(`/tax/submissions/${submissionId}/income/other/`, { amount: data.other_amount || 0, description: data.other_description }),
      ])
      toast.success('Income data saved')
      onRefresh()
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  async function saveQP(data) {
    setSaving(true)
    try {
      await api.post(`/tax/submissions/${submissionId}/qualifying-payments/`, data)
      toast.success('Qualifying payments saved')
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  async function saveTC(data) {
    setSaving(true)
    try {
      await api.post(`/tax/submissions/${submissionId}/tax-credits/`, data)
      toast.success('Tax credits saved')
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }

  const fileProps = { submissionId, documents, onUpload, onDelete: onDeleteDoc }

  return (
    <div className="space-y-6">
      {/* Income Form */}
      <form onSubmit={handleIncome(saveIncome)} className="form-section">
        <h3 className="section-header">
          <DollarSign size={18} className="text-brand-yellow" />
          Income & Receipts
        </h3>

        {/* Local Employment */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-brand-yellow mb-3 uppercase tracking-wider">Local Employment</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="input-label">Employer Name</label>
              <input {...regIncome('employer_name')} className="input-field" placeholder="Company name" disabled={isReadOnly} />
            </div>
            <div>
              <label className="input-label">Employment Income Amount <span className="text-brand-red">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
                <input {...regIncome('local_amount')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
              </div>
            </div>
          </div>
          <FileUpload label="T10 / Salary Slips" documentType="t10_salary_slip" section="income" {...fileProps} required hint="Required" />
        </div>

        <hr className="border-brand-gray-border my-5" />

        {/* Foreign Income */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-brand-yellow mb-3 uppercase tracking-wider">Foreign Income</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="input-label">Employment Income / Service Fee</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
                <input {...regIncome('foreign_employment_service_fee')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
              </div>
            </div>
            <div>
              <label className="input-label">Other Foreign Source Income</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
                <input {...regIncome('foreign_other')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
              </div>
            </div>
          </div>
          <FileUpload label="Monthly Salary Slips" documentType="monthly_salary_slip" section="income" {...fileProps} hint="Foreign employment evidence" />
        </div>

        <hr className="border-brand-gray-border my-5" />

        {/* Terminal Benefit */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-brand-yellow mb-3 uppercase tracking-wider">Terminal Benefit</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="input-label">Benefit Types (EPF, ETF, Pension, Gratuity etc.)</label>
              <input {...regIncome('terminal_benefit_types')} className="input-field" placeholder="e.g., EPF, ETF" disabled={isReadOnly} />
            </div>
            <div>
              <label className="input-label">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
                <input {...regIncome('terminal_amount')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
              </div>
            </div>
          </div>
          <FileUpload label="Tax Direction Letter / Terminal Benefit Confirmation" documentType="tax_direction_letter" section="income" {...fileProps} hint="One per benefit type" />
        </div>

        <hr className="border-brand-gray-border my-5" />

        {/* Rent, Interest, Dividend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Rent */}
          <div>
            <h4 className="text-sm font-semibold text-brand-yellow mb-3 uppercase tracking-wider">Rent Income</h4>
            <label className="input-label">Gross Amount</label>
            <div className="relative mb-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
              <input {...regIncome('rent_gross')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
            </div>
            {liveRentRelief > 0 && (
              <div className="flex justify-between items-center px-2 py-1 mb-2 bg-brand-success/5 border border-brand-success/20 rounded-lg">
                <span className="text-xs text-brand-success">Rent Relief (25% auto)</span>
                <span className="text-xs font-mono font-semibold text-brand-success">Rs. {liveRentRelief.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <label className="input-label">WHT Deducted</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
              <input {...regIncome('rent_wht')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
            </div>
          </div>

          {/* Interest */}
          <div>
            <h4 className="text-sm font-semibold text-brand-yellow mb-3 uppercase tracking-wider">Interest Income</h4>
            <label className="input-label">Amount</label>
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
              <input {...regIncome('interest_amount')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
            </div>
            <label className="input-label">WHT Deducted</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
              <input {...regIncome('interest_wht')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
            </div>
          </div>

          {/* Dividend */}
          <div>
            <h4 className="text-sm font-semibold text-brand-yellow mb-3 uppercase tracking-wider">Dividend Income</h4>
            <label className="input-label">Taxable Dividends</label>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
              <input {...regIncome('dividend_amount')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
            </div>
            <label className="input-label">
              Exempt Dividends
              <span className="block text-xs text-brand-gray font-normal normal-case tracking-normal mt-0.5">From resident companies subject to 15% WHT — tax exempt</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
              <input {...regIncome('dividend_exempt_amount')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono border-brand-success/40 focus:border-brand-success" placeholder="0.00" disabled={isReadOnly} />
            </div>
          </div>
        </div>

        {/* Document uploads for rent/interest/dividend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <FileUpload label="Rent Agreement / WHT Certificates" documentType="rent_agreement" section="income" {...fileProps} />
          <FileUpload label="WHT Certificates" documentType="bank_balance_confirmation" section="income" {...fileProps} />
          <FileUpload label="Dividend Certificates (Dividend Warrant)" documentType="dividend_certificate" section="income" {...fileProps} />
        </div>

        <hr className="border-brand-gray-border my-5" />

        {/* Sole Proprietorship */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-brand-yellow mb-3 uppercase tracking-wider">Sole Proprietorship / Partnership</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="input-label">Business / Partnership Name</label>
              <input {...regIncome('sole_business_name')} className="input-field" placeholder="Business name" disabled={isReadOnly} />
            </div>
            <div>
              <label className="input-label">Income Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
                <input {...regIncome('sole_amount')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
              </div>
            </div>
          </div>
          <FileUpload label="Receipt & Payment Details / Finalized Partnership Accounts" documentType="partnership_accounts" section="income" {...fileProps} />
        </div>

        <hr className="border-brand-gray-border my-5" />

        {/* Other Income */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-brand-yellow mb-3 uppercase tracking-wider">Other Income</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="input-label">Description</label>
              <input {...regIncome('other_description')} className="input-field" placeholder="Describe the income source" disabled={isReadOnly} />
            </div>
            <div>
              <label className="input-label">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
                <input {...regIncome('other_amount')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
              </div>
            </div>
          </div>
          <FileUpload label="Proof Documents for Other Income" documentType="other_income_proof" section="income" {...fileProps} />
        </div>

        {!isReadOnly && (
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={15} /> {saving ? 'Saving...' : 'Save Income Data'}
            </button>
          </div>
        )}
      </form>

      {/* Qualifying Payments */}
      <form onSubmit={handleQP(saveQP)} className="form-section">
        <h3 className="section-header">
          <span className="text-brand-yellow">%</span>
          Qualifying Payments & Reliefs
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Donation to Approved Charitable Institute</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
                <input {...regQP('donation_charitable')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
              </div>
            </div>
            <div>
              <label className="input-label">Donation to Government of Sri Lanka</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
                <input {...regQP('donation_government')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
              </div>
            </div>
          </div>
          <FileUpload label="Donation Proof Documents" documentType="donation_proof" section="qualifying_payments" {...fileProps} />

          <div>
            <label className="input-label">Solar Panels Expenditure / Loan Repayment <span className="text-brand-gray text-xs">(Max Rs. 600,000)</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
              <input {...regQP('solar_panels_expenditure')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
            </div>
            <p className="text-xs text-brand-gray mt-1">Invoice & Agreement with National Grid required</p>
          </div>
          <FileUpload label="Solar Panel Invoice & Grid Agreement" documentType="solar_invoice" section="qualifying_payments" {...fileProps} />

          <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-brand-gray">Personal Relief <span className="text-xs">(Fixed)</span></span>
              <span className="font-mono font-semibold text-brand-yellow">Rs. 1,800,000.00</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-brand-gray">Rent Relief <span className="text-xs">(25% of Gross Rent — auto)</span></span>
              <span className="font-mono text-brand-success">
                {liveRentRelief > 0
                  ? `Rs. ${liveRentRelief.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex justify-end pt-4">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={15} /> {saving ? 'Saving...' : 'Save Qualifying Payments'}
            </button>
          </div>
        )}
      </form>

      {/* Tax Credits */}
      <form onSubmit={handleTC(saveTC)} className="form-section">
        <h3 className="section-header">
          <span className="text-brand-yellow text-lg font-bold">₹</span>
          Tax Credits
        </h3>

        <div className="space-y-4">
          <SelfAssessmentInstallments submissionId={submissionId} isReadOnly={isReadOnly} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">APIT on Salary</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
                <input {...regTC('apit_on_salary')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
              </div>
            </div>
            <div>
              <label className="input-label">WHT on Rent/Interest/Service Fees</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
                <input {...regTC('wht_rent_interest_service')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
              </div>
            </div>
            <div>
              <label className="input-label">Partnership Tax Credit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono">Rs.</span>
                <input {...regTC('partnership_tax_credit')} type="number" step="0.01" min="0" className="input-field pl-10 text-right font-mono" placeholder="0.00" disabled={isReadOnly} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload label="T10 Certificate (APIT)" documentType="t10_certificate" section="tax_credits" {...fileProps} />
            <FileUpload label="WHT Certificate" documentType="wht_certificate" section="tax_credits" {...fileProps} />
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex justify-end pt-4">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={15} /> {saving ? 'Saving...' : 'Save Tax Credits'}
            </button>
          </div>
        )}
      </form>

      {/* Navigation */}
      <div className="flex justify-end">
        <button type="button" onClick={onNext} className="btn-primary">
          Next: Assets <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

function SelfAssessmentInstallments({ submissionId, isReadOnly }) {
  const qc = useQueryClient()
  const { data: installments = [], refetch } = useQuery({
    queryKey: ['self-assessment', submissionId],
    queryFn: () => api.get(`/tax/submissions/${submissionId}/self-assessment/`).then(r => r.data),
  })

  async function saveInstallment(num, amount) {
    try {
      const existing = installments.find(i => i.installment_number === num)
      if (existing) {
        await api.patch(`/tax/self-assessment/${existing.id}/`, { amount })
      } else {
        await api.post(`/tax/submissions/${submissionId}/self-assessment/`, { installment_number: num, amount })
      }
      refetch()
    } catch { toast.error('Failed to save installment') }
  }

  const INSTALLMENTS = [
    { num: 1, label: '1st Installment' },
    { num: 2, label: '2nd Installment' },
    { num: 3, label: '3rd Installment' },
    { num: 4, label: '4th Installment' },
  ]

  return (
    <div>
      <label className="input-label mb-2 block">Self Assessment Payments</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {INSTALLMENTS.map(({ num, label }) => {
          const inst = installments.find(i => i.installment_number === num)
          return (
            <div key={num}>
              <label className="text-xs text-brand-gray mb-1 block">{label}</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-gray text-xs font-mono">Rs.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={inst?.amount || ''}
                  onBlur={(e) => !isReadOnly && saveInstallment(num, e.target.value || 0)}
                  placeholder="0.00"
                  disabled={isReadOnly}
                  className="input-field pl-8 text-right font-mono text-sm"
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3">
        <FileUpload
          label="Pay-in Slips / Online Payment Receipts"
          documentType="self_assessment_receipt"
          section="tax_credits"
          submissionId={submissionId}
          documents={[]}
          onUpload={async (_, fd) => {
            await api.post(`/documents/submission/${submissionId}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            qc.invalidateQueries(['documents', submissionId])
          }}
        />
      </div>
    </div>
  )
}
