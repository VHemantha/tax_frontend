import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../../services/api'
import FileUpload from '../../../components/common/FileUpload'
import {
  Save, ChevronRight, Briefcase, Globe, Gift,
  Home, Landmark, TrendingUp, Store, MoreHorizontal,
  Receipt, CreditCard, Info
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ─── Reusable field row: label left, input right ─── */
function FieldRow({ label, hint, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-brand-gray-border/50 last:border-0">
      <div className="sm:w-56 flex-shrink-0 pt-0.5">
        <p className="text-sm text-white font-medium leading-snug">{label}</p>
        {hint && <p className="text-xs text-brand-gray mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

/* ─── Rs. amount input ─── */
function AmountInput({ registration, disabled, className = '' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm font-mono select-none">Rs.</span>
      <input
        {...registration}
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        disabled={disabled}
        className={`input-field pl-10 text-right font-mono ${className}`}
      />
    </div>
  )
}

/* ─── Sub-section header with left accent bar ─── */
function SubSection({ icon: Icon, title, children }) {
  return (
    <div className="pl-4 border-l-2 border-brand-yellow/40">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-brand-yellow flex-shrink-0" />
        <span className="text-xs font-semibold text-brand-yellow uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  )
}

/* ─── Card wrapper ─── */
function FormCard({ children, className = '' }) {
  return (
    <div className={`bg-brand-black-light border border-brand-gray-border rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

/* ─── Card section header bar ─── */
function CardHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-gray-border bg-brand-black">
      <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-brand-yellow" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-brand-gray mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

/* ─── Divider between sub-sections ─── */
function Divider() {
  return <div className="h-px bg-brand-gray-border/50 my-5" />
}

/* ─── Auto-relief display pill ─── */
function ReliefPill({ label, value }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-brand-success/5 border border-brand-success/20 rounded-lg">
      <div className="flex items-center gap-1.5">
        <Info size={11} className="text-brand-success" />
        <span className="text-xs text-brand-success font-medium">{label}</span>
      </div>
      <span className="text-xs font-mono font-semibold text-brand-success">{value}</span>
    </div>
  )
}

/* ─── Main Component ─── */
export default function IncomeSection({ submissionId, documents, onUpload, onDeleteDoc, isReadOnly, onNext, onRefresh }) {
  const qc = useQueryClient()

  const queries = {
    local:    useQuery({ queryKey: ['income-local',    submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/local-employment/`).then(r => r.data) }),
    foreign:  useQuery({ queryKey: ['income-foreign',  submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/foreign/`).then(r => r.data) }),
    terminal: useQuery({ queryKey: ['income-terminal', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/terminal-benefit/`).then(r => r.data) }),
    rent:     useQuery({ queryKey: ['income-rent',     submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/rent/`).then(r => r.data) }),
    interest: useQuery({ queryKey: ['income-interest', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/interest/`).then(r => r.data) }),
    dividend: useQuery({ queryKey: ['income-dividend', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/dividend/`).then(r => r.data) }),
    sole:     useQuery({ queryKey: ['income-sole',     submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/sole-proprietorship/`).then(r => r.data) }),
    other:    useQuery({ queryKey: ['income-other',    submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/income/other/`).then(r => r.data) }),
    qp:       useQuery({ queryKey: ['qualifying-payments', submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/qualifying-payments/`).then(r => r.data) }),
    tc:       useQuery({ queryKey: ['tax-credits',     submissionId], queryFn: () => api.get(`/tax/submissions/${submissionId}/tax-credits/`).then(r => r.data) }),
  }

  const [saving, setSaving] = useState(false)

  const { register: regIncome, handleSubmit: handleIncome, reset: resetIncome, watch: watchIncome } = useForm()
  const { register: regQP,     handleSubmit: handleQP,     reset: resetQP }     = useForm()
  const { register: regTC,     handleSubmit: handleTC,     reset: resetTC,     setValue: setValueTC } = useForm()

  const watchedRentGross   = watchIncome('rent_gross')
  const watchedRentWHT     = watchIncome('rent_wht')
  const watchedInterestWHT = watchIncome('interest_wht')
  const liveRentRelief     = Math.round(parseFloat(watchedRentGross || 0) * 0.25 * 100) / 100
  const liveWHTTotal       = Math.round((parseFloat(watchedRentWHT || 0) + parseFloat(watchedInterestWHT || 0)) * 100) / 100

  useEffect(() => {
    const d = queries
    resetIncome({
      local_amount:                   d.local.data?.amount || '',
      employer_name:                  d.local.data?.employer_name || '',
      foreign_employment_service_fee: d.foreign.data?.employment_service_fee || '',
      foreign_business_income:        d.foreign.data?.foreign_business_income || '',
      foreign_other:                  d.foreign.data?.other_foreign_income || '',
      terminal_amount:                d.terminal.data?.amount || '',
      terminal_benefit_types:         d.terminal.data?.benefit_types || '',
      rent_gross:                     d.rent.data?.gross_amount || '',
      rent_wht:                       d.rent.data?.wht_deducted || '',
      interest_amount:                d.interest.data?.amount || '',
      interest_wht:                   d.interest.data?.wht_deducted || '',
      dividend_amount:                d.dividend.data?.amount || '',
      dividend_exempt_amount:         d.dividend.data?.exempt_amount || '',
      sole_amount:                    d.sole.data?.amount || '',
      sole_business_name:             d.sole.data?.business_name || '',
      other_amount:                   d.other.data?.amount || '',
      other_description:              d.other.data?.description || '',
    })
  }, [Object.values(queries).map(q => q.data).join(',')])

  useEffect(() => {
    resetQP({
      donation_charitable:     queries.qp.data?.donation_charitable || '',
      donation_government:     queries.qp.data?.donation_government || '',
      solar_panels_expenditure: queries.qp.data?.solar_panels_expenditure || '',
    })
  }, [queries.qp.data])

  useEffect(() => {
    resetTC({
      apit_on_salary:            queries.tc.data?.apit_on_salary || '',
      wht_rent_interest_service: queries.tc.data?.wht_rent_interest_service || '',
      partnership_tax_credit:    queries.tc.data?.partnership_tax_credit || '',
    })
  }, [queries.tc.data])

  /* Auto-populate WHT credit from income section WHT fields */
  useEffect(() => {
    const total = parseFloat(watchedRentWHT || 0) + parseFloat(watchedInterestWHT || 0)
    setValueTC('wht_rent_interest_service', total > 0 ? total.toFixed(2) : '')
  }, [watchedRentWHT, watchedInterestWHT])

  async function saveIncome(data) {
    setSaving(true)
    try {
      await Promise.all([
        api.post(`/tax/submissions/${submissionId}/income/local-employment/`,   { amount: data.local_amount || 0, employer_name: data.employer_name }),
        api.post(`/tax/submissions/${submissionId}/income/foreign/`,            { employment_service_fee: data.foreign_employment_service_fee || 0, foreign_business_income: data.foreign_business_income || 0, other_foreign_income: data.foreign_other || 0 }),
        api.post(`/tax/submissions/${submissionId}/income/terminal-benefit/`,   { amount: data.terminal_amount || 0, benefit_types: data.terminal_benefit_types }),
        api.post(`/tax/submissions/${submissionId}/income/rent/`,               { gross_amount: data.rent_gross || 0, wht_deducted: data.rent_wht || 0 }),
        api.post(`/tax/submissions/${submissionId}/income/interest/`,           { amount: data.interest_amount || 0, wht_deducted: data.interest_wht || 0 }),
        api.post(`/tax/submissions/${submissionId}/income/dividend/`,           { amount: data.dividend_amount || 0, exempt_amount: data.dividend_exempt_amount || 0 }),
        api.post(`/tax/submissions/${submissionId}/income/sole-proprietorship/`,{ amount: data.sole_amount || 0, business_name: data.sole_business_name }),
        api.post(`/tax/submissions/${submissionId}/income/other/`,              { amount: data.other_amount || 0, description: data.other_description }),
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

  const fp = { submissionId, documents, onUpload, onDelete: onDeleteDoc }

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════════════════════════
          CARD 1 — EMPLOYMENT INCOME
      ══════════════════════════════════════════════════════════════ */}
      <form onSubmit={handleIncome(saveIncome)}>
        <FormCard>
          <CardHeader icon={Briefcase} title="Employment Income" subtitle="Salary, foreign earnings and terminal benefits" />

          <div className="px-6 py-5 space-y-6">

            {/* Local Employment */}
            <SubSection icon={Briefcase} title="Local Employment">
              <FieldRow label="Employer Name">
                <input {...regIncome('employer_name')} className="input-field" placeholder="Company / Employer name" disabled={isReadOnly} />
              </FieldRow>
              <FieldRow label="Employment Income" hint="Total gross salary for the year">
                <AmountInput registration={regIncome('local_amount')} disabled={isReadOnly} />
              </FieldRow>
              <div className="pt-2">
                <FileUpload label="T10 / Salary Slips" documentType="t10_salary_slip" section="income" {...fp} hint="Required" />
              </div>
            </SubSection>

            <Divider />

            {/* Foreign Income */}
            <SubSection icon={Globe} title="Foreign Income">
              <FieldRow label="Employment / Service Fee" hint="Foreign employment or contract income">
                <AmountInput registration={regIncome('foreign_employment_service_fee')} disabled={isReadOnly} />
              </FieldRow>
              <FieldRow label="Foreign Business Income" hint="Profit from business carried on outside Sri Lanka">
                <AmountInput registration={regIncome('foreign_business_income')} disabled={isReadOnly} />
              </FieldRow>
              <FieldRow label="Other Foreign Source Income" hint="Rent, interest, dividends from abroad">
                <AmountInput registration={regIncome('foreign_other')} disabled={isReadOnly} />
              </FieldRow>
              <div className="pt-2">
                <FileUpload label="Monthly Salary Slips / Foreign Evidence" documentType="monthly_salary_slip" section="income" {...fp} hint="Foreign employment evidence" />
              </div>
            </SubSection>

            <Divider />

            {/* Terminal Benefit */}
            <SubSection icon={Gift} title="Terminal Benefit">
              <FieldRow label="Benefit Types" hint="EPF, ETF, Pension, Gratuity, etc.">
                <input {...regIncome('terminal_benefit_types')} className="input-field" placeholder="e.g., EPF, ETF, Gratuity" disabled={isReadOnly} />
              </FieldRow>
              <FieldRow label="Total Amount">
                <AmountInput registration={regIncome('terminal_amount')} disabled={isReadOnly} />
              </FieldRow>
              <div className="pt-2">
                <FileUpload label="Tax Direction Letter / Terminal Benefit Confirmation" documentType="tax_direction_letter" section="income" {...fp} hint="One document per benefit type" />
              </div>
            </SubSection>

          </div>

          {/* ── Save button ── */}
          {!isReadOnly && (
            <div className="flex justify-end px-6 py-4 border-t border-brand-gray-border bg-brand-black/40">
              <button type="submit" disabled={saving} className="btn-primary">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Employment Income'}
              </button>
            </div>
          )}
        </FormCard>


        {/* ══════════════════════════════════════════════════════════════
            CARD 2 — PASSIVE INCOME
        ══════════════════════════════════════════════════════════════ */}
        <FormCard className="mt-5">
          <CardHeader icon={Home} title="Passive Income" subtitle="Rent, interest and dividend income received during the year" />

          <div className="px-6 py-5 space-y-6">

            {/* Rent Income */}
            <SubSection icon={Home} title="Rent Income">
              <FieldRow label="Gross Rent Received" hint="Total rent before WHT deduction">
                <AmountInput registration={regIncome('rent_gross')} disabled={isReadOnly} />
              </FieldRow>
              {liveRentRelief > 0 && (
                <div className="py-1">
                  <ReliefPill
                    label="Rent Relief (25% — auto calculated)"
                    value={`Rs. ${liveRentRelief.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  />
                </div>
              )}
              <FieldRow label="WHT Deducted" hint="Withholding tax deducted by tenant">
                <AmountInput registration={regIncome('rent_wht')} disabled={isReadOnly} />
              </FieldRow>
              <div className="pt-2">
                <FileUpload label="Rent Agreement / WHT Deduction Certificates" documentType="rent_agreement" section="income" {...fp} />
              </div>
            </SubSection>

            <Divider />

            {/* Interest Income */}
            <SubSection icon={Landmark} title="Interest Income">
              <FieldRow label="Total Interest Received" hint="Bank interest, fixed deposits, etc.">
                <AmountInput registration={regIncome('interest_amount')} disabled={isReadOnly} />
              </FieldRow>
              <FieldRow label="WHT Deducted" hint="WHT deducted by the bank / institution">
                <AmountInput registration={regIncome('interest_wht')} disabled={isReadOnly} />
              </FieldRow>
              <div className="pt-2">
                <FileUpload label="WHT Certificates" documentType="bank_balance_confirmation" section="income" {...fp} />
              </div>
            </SubSection>

            <Divider />

            {/* Dividend Income */}
            <SubSection icon={TrendingUp} title="Dividend Income">
              <FieldRow label="Taxable Dividends" hint="Dividends not subject to 15% WHT">
                <AmountInput registration={regIncome('dividend_amount')} disabled={isReadOnly} />
              </FieldRow>
              <FieldRow
                label="Exempt Dividends"
                hint="From resident companies subject to 15% WHT — these are tax exempt and excluded from assessable income"
              >
                <AmountInput
                  registration={regIncome('dividend_exempt_amount')}
                  disabled={isReadOnly}
                  className="border-brand-success/40 focus:border-brand-success"
                />
              </FieldRow>
              <div className="pt-2">
                <FileUpload label="Dividend Certificates (Dividend Warrant)" documentType="dividend_certificate" section="income" {...fp} />
              </div>
            </SubSection>

          </div>

          {!isReadOnly && (
            <div className="flex justify-end px-6 py-4 border-t border-brand-gray-border bg-brand-black/40">
              <button type="submit" disabled={saving} className="btn-primary">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Passive Income'}
              </button>
            </div>
          )}
        </FormCard>


        {/* ══════════════════════════════════════════════════════════════
            CARD 3 — BUSINESS & OTHER INCOME
        ══════════════════════════════════════════════════════════════ */}
        <FormCard className="mt-5">
          <CardHeader icon={Store} title="Business & Other Income" subtitle="Sole proprietorship, partnership and any other income sources" />

          <div className="px-6 py-5 space-y-6">

            {/* Sole Proprietorship */}
            <SubSection icon={Store} title="Sole Proprietorship / Partnership">
              <FieldRow label="Business / Partnership Name">
                <input {...regIncome('sole_business_name')} className="input-field" placeholder="Business name" disabled={isReadOnly} />
              </FieldRow>
              <FieldRow label="Net Income Amount" hint="Profit from business for the year">
                <AmountInput registration={regIncome('sole_amount')} disabled={isReadOnly} />
              </FieldRow>
              <div className="pt-2">
                <FileUpload label="Receipt & Payment Details / Finalised Partnership Accounts" documentType="partnership_accounts" section="income" {...fp} />
              </div>
            </SubSection>

            <Divider />

            {/* Other Income */}
            <SubSection icon={MoreHorizontal} title="Other Income">
              <FieldRow label="Description of Income" hint="Describe the nature of the income source">
                <input {...regIncome('other_description')} className="input-field" placeholder="e.g., Royalties, Commission, etc." disabled={isReadOnly} />
              </FieldRow>
              <FieldRow label="Amount">
                <AmountInput registration={regIncome('other_amount')} disabled={isReadOnly} />
              </FieldRow>
              <div className="pt-2">
                <FileUpload label="Supporting Documents for Other Income" documentType="other_income_proof" section="income" {...fp} />
              </div>
            </SubSection>

          </div>

          {!isReadOnly && (
            <div className="flex justify-end px-6 py-4 border-t border-brand-gray-border bg-brand-black/40">
              <button type="submit" disabled={saving} className="btn-primary">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Business & Other Income'}
              </button>
            </div>
          )}
        </FormCard>
      </form>


      {/* ══════════════════════════════════════════════════════════════
          CARD 4 — QUALIFYING PAYMENTS & RELIEFS
      ══════════════════════════════════════════════════════════════ */}
      <form onSubmit={handleQP(saveQP)}>
        <FormCard>
          <CardHeader icon={Receipt} title="Qualifying Payments & Reliefs" subtitle="Deductible donations, solar expenditure and statutory reliefs" />

          <div className="px-6 py-5 space-y-6">

            {/* Donations */}
            <SubSection icon={Receipt} title="Donations">
              <FieldRow label="Donation to Approved Charitable Institution">
                <AmountInput registration={regQP('donation_charitable')} disabled={isReadOnly} />
              </FieldRow>
              <FieldRow label="Donation to Government of Sri Lanka">
                <AmountInput registration={regQP('donation_government')} disabled={isReadOnly} />
              </FieldRow>
              <div className="pt-2">
                <FileUpload label="Donation Proof Documents" documentType="donation_proof" section="qualifying_payments" {...fp} />
              </div>
            </SubSection>

            <Divider />

            {/* Solar Panels */}
            <SubSection icon={TrendingUp} title="Solar Panels">
              <FieldRow label="Solar Panel Expenditure / Loan Repayment" hint="Maximum deductible: Rs. 600,000">
                <AmountInput registration={regQP('solar_panels_expenditure')} disabled={isReadOnly} />
              </FieldRow>
              <div className="pt-2">
                <FileUpload label="Solar Panel Invoice & Grid Agreement" documentType="solar_invoice" section="qualifying_payments" {...fp} />
              </div>
            </SubSection>

            <Divider />

            {/* Auto Reliefs */}
            <SubSection icon={Info} title="Statutory Reliefs (Auto Calculated)">
              <div className="space-y-2 pt-1">
                <ReliefPill label="Personal Relief (Fixed)" value="Rs. 1,800,000.00" />
                <ReliefPill
                  label="Rent Relief (25% of Gross Rent — auto)"
                  value={liveRentRelief > 0
                    ? `Rs. ${liveRentRelief.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : 'Enter Gross Rent above'}
                />
              </div>
            </SubSection>

          </div>

          {!isReadOnly && (
            <div className="flex justify-end px-6 py-4 border-t border-brand-gray-border bg-brand-black/40">
              <button type="submit" disabled={saving} className="btn-primary">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Qualifying Payments'}
              </button>
            </div>
          )}
        </FormCard>
      </form>


      {/* ══════════════════════════════════════════════════════════════
          CARD 5 — TAX CREDITS
      ══════════════════════════════════════════════════════════════ */}
      <form onSubmit={handleTC(saveTC)}>
        <FormCard>
          <CardHeader icon={CreditCard} title="Tax Credits" subtitle="Tax already paid — deducted from your final tax liability" />

          <div className="px-6 py-5 space-y-6">

            {/* Self Assessment */}
            <SubSection icon={Receipt} title="Self Assessment Tax Payments">
              <SelfAssessmentInstallments submissionId={submissionId} isReadOnly={isReadOnly} />
            </SubSection>

            <Divider />

            {/* Tax Deducted at Source */}
            <SubSection icon={CreditCard} title="Tax Deducted at Source">
              <FieldRow label="APIT on Salary" hint="As per T10 certificate from employer">
                <AmountInput registration={regTC('apit_on_salary')} disabled={isReadOnly} />
              </FieldRow>
              <FieldRow label="WHT on Rent / Interest / Service Fees" hint="Auto-calculated from Rent WHT + Interest WHT entered above">
                <div className="space-y-2">
                  <AmountInput registration={regTC('wht_rent_interest_service')} disabled />
                  {liveWHTTotal > 0 && (
                    <ReliefPill
                      label="WHT (Rent + Interest — auto)"
                      value={`Rs. ${liveWHTTotal.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                  )}
                  {liveWHTTotal === 0 && (
                    <p className="text-xs text-brand-gray">Enter WHT amounts in Rent Income and Interest Income above</p>
                  )}
                </div>
              </FieldRow>
              <FieldRow label="Partnership Tax Credit" hint="Tax credit passed through from partnership">
                <AmountInput registration={regTC('partnership_tax_credit')} disabled={isReadOnly} />
              </FieldRow>
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FileUpload label="T10 Certificate (APIT)" documentType="t10_certificate" section="tax_credits" {...fp} />
                <FileUpload label="WHT Certificate" documentType="wht_certificate" section="tax_credits" {...fp} />
              </div>
            </SubSection>

          </div>

          {!isReadOnly && (
            <div className="flex justify-end px-6 py-4 border-t border-brand-gray-border bg-brand-black/40">
              <button type="submit" disabled={saving} className="btn-primary">
                <Save size={14} /> {saving ? 'Saving…' : 'Save Tax Credits'}
              </button>
            </div>
          )}
        </FormCard>
      </form>


      {/* ── Step navigation ── */}
      <div className="flex justify-end pt-2">
        <button type="button" onClick={onNext} className="btn-primary">
          Next: Assets <ChevronRight size={15} />
        </button>
      </div>

    </div>
  )
}


/* ─── Self Assessment Installments sub-component ─── */
function SelfAssessmentInstallments({ submissionId, isReadOnly }) {
  const qc = useQueryClient()
  const { data: installments = [], refetch } = useQuery({
    queryKey: ['self-assessment', submissionId],
    queryFn:  () => api.get(`/tax/submissions/${submissionId}/self-assessment/`).then(r => r.data),
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
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {INSTALLMENTS.map(({ num, label }) => {
          const inst = installments.find(i => i.installment_number === num)
          return (
            <div key={num}>
              <label className="text-xs text-brand-gray mb-1.5 block font-medium">{label}</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-gray text-xs font-mono select-none">Rs.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={inst?.amount || ''}
                  onBlur={e => !isReadOnly && saveInstallment(num, e.target.value || 0)}
                  placeholder="0.00"
                  disabled={isReadOnly}
                  className="input-field pl-9 text-right font-mono text-sm"
                />
              </div>
            </div>
          )
        })}
      </div>
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
  )
}
