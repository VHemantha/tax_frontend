import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import {
  CheckCircle, Banknote, Phone, ArrowLeft, Clock,
  FileText, TrendingUp, Home, Car, Landmark, PieChart,
  Wallet, Package, Building2, AlertTriangle, ChevronDown, ChevronRight, Download
} from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/format'
import toast from 'react-hot-toast'
import { useState } from 'react'

/* ── Collapsible section ── */
function Section({ title, icon: Icon, children, count }) {
  const [open, setOpen] = useState(true)
  if (!count) return null
  return (
    <div className="border border-brand-gray-border rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-brand-black-soft hover:bg-brand-black-mid transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-brand-yellow" />
          <span className="text-sm font-semibold text-white">{title}</span>
          <span className="text-xs bg-brand-yellow/10 text-brand-yellow px-2 py-0.5 rounded-full">{count}</span>
        </div>
        {open ? <ChevronDown size={14} className="text-brand-gray" /> : <ChevronRight size={14} className="text-brand-gray" />}
      </button>
      {open && <div className="px-4 pb-4 pt-2">{children}</div>}
    </div>
  )
}

/* ── Simple KV row ── */
function KVRow({ label, value }) {
  if (!value || value === '0.00' || value === 'Rs. 0.00') return null
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-brand-gray-border/50 last:border-0">
      <span className="text-xs text-brand-gray">{label}</span>
      <span className="text-xs text-white font-medium text-right max-w-[55%]">{value}</span>
    </div>
  )
}

/* ── Asset mini-card ── */
function AssetCard({ children }) {
  return (
    <div className="bg-brand-black rounded-lg p-3 mb-2 last:mb-0 space-y-0.5">
      {children}
    </div>
  )
}

export default function ClientConfirmation() {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => api.get(`/tax/submissions/${submissionId}/`).then(r => r.data),
  })

  const acknowledgeMutation = useMutation({
    mutationFn: () => api.post(`/tax/submissions/${submissionId}/client-confirm/`),
    onSuccess: () => {
      toast.success('Acknowledged. Accounts Division will confirm your payment shortly.')
      qc.invalidateQueries(['my-submissions'])
      navigate('/client/dashboard')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const finalConfirmMutation = useMutation({
    mutationFn: () => api.post(`/tax/submissions/${submissionId}/client-final-confirm/`),
    onSuccess: () => {
      toast.success('Tax return confirmed. Your consultant has been notified.')
      qc.invalidateQueries(['my-submissions'])
      navigate('/client/dashboard')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ── Payment notice ──
  if (submission?.status === 'awaiting_confirmation') {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button onClick={() => navigate('/client/dashboard')} className="btn-ghost mb-4 text-sm">
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
        <PageHeader title="Payment Required" subtitle={`Tax Return ${submission?.tax_year_label}`} />

        <div className="card mb-6 border-brand-yellow/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-brand-yellow/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Banknote size={22} className="text-brand-yellow" />
            </div>
            <div>
              <p className="text-base font-bold text-white">Your Tax Return Has Been Processed</p>
              <p className="text-sm text-brand-gray">A payment is required to finalise your submission.</p>
            </div>
          </div>
          <div className="bg-brand-black rounded-xl p-4 space-y-3 text-sm">
            {[
              `Your tax return for ${submission?.tax_year_label} has been reviewed and processed by your consultant.`,
              'Please contact the office to arrange payment. Our Accounts Division will confirm receipt of payment.',
              'Once payment is confirmed, your consultant will send you the full tax computation for your review.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-yellow mt-1.5 flex-shrink-0" />
                <p className="text-brand-gray">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card mb-6 bg-brand-black-soft border-brand-gray-border">
          <div className="flex items-center gap-2 mb-3">
            <Phone size={15} className="text-brand-yellow" />
            <p className="text-sm font-semibold text-white">Contact Accounts Division</p>
          </div>
          <p className="text-sm text-brand-gray">Please reach out to your assigned consultant or the accounts office to make the necessary payment arrangements.</p>
        </div>

        <div className="card">
          <p className="text-sm text-brand-gray mb-4">
            Click below to acknowledge that you have received this payment notice. This does not complete your submission — payment confirmation by Accounts Division is still required.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => navigate('/client/dashboard')} className="btn-secondary">Later</button>
            <button onClick={() => acknowledgeMutation.mutate()} disabled={acknowledgeMutation.isPending} className="btn-primary">
              {acknowledgeMutation.isPending
                ? <><span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />Processing...</>
                : <><CheckCircle size={15} /> Acknowledge Payment Notice</>
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Awaiting payment confirmation ──
  if (submission?.status === 'confirmed') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Clock size={48} className="text-brand-yellow opacity-60" />
        <p className="text-white text-lg font-semibold">Awaiting Payment Confirmation</p>
        <p className="text-sm text-brand-gray text-center max-w-sm">Accounts Division is confirming your payment. Your consultant will send you the full tax computation once payment is confirmed.</p>
        <button onClick={() => navigate('/client/dashboard')} className="btn-primary">Back to Dashboard</button>
      </div>
    )
  }

  async function downloadPdf() {
    try {
      const res = await api.get(`/tax/submissions/${submissionId}/pdf/`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `Tax_Return_${submission?.tax_year_label?.replace(/\//g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('PDF is not available yet. Please wait for payment confirmation.')
    }
  }

  // ── Full tax computation + assets & liabilities review ──
  if (submission?.status === 'awaiting_client_review') {
    const s = submission

    const hasAssets = (
      s.immovable_properties?.length ||
      s.motor_vehicles?.length ||
      s.bank_balances?.length ||
      s.shares_stocks?.length ||
      s.cash_in_hand?.amount > 0 ||
      s.loans_given?.length ||
      s.gold_jewellery?.value > 0 ||
      s.business_properties?.length ||
      s.other_assets?.length ||
      s.disposals?.length
    )

    const hasLiabilities = s.liabilities?.length > 0

    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <button onClick={() => navigate('/client/dashboard')} className="btn-ghost mb-4 text-sm">
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <PageHeader
          title="Review Your Tax Return"
          subtitle={`${s.tax_year_label} · Please review all details before confirming`}
        />

        {/* ── Tax Computation ── */}
        <div className="card mb-4 border-brand-yellow/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-yellow/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-brand-yellow" />
            </div>
            <div>
              <p className="text-base font-bold text-white">Tax Computation</p>
              <p className="text-xs text-brand-gray">{s.tax_year_label}</p>
            </div>
          </div>

          <div className="space-y-0">
            {[
              ['Total Assessable Income', s.total_assessable_income, false],
              ['Total Qualifying Payments', s.total_qualifying_payments, false],
              ['Personal Relief', s.personal_relief, false],
              ['Rent Relief', s.rent_relief, false],
              ['Taxable Income', s.net_taxable_income, false],
              ['Gross Tax', s.gross_tax, false],
              ['Total Tax Credits', s.total_tax_credits, false],
            ].map(([label, val]) =>
              parseFloat(val) > 0 ? (
                <div key={label} className="flex justify-between items-center py-2 border-b border-brand-gray-border">
                  <span className="text-sm text-brand-gray">{label}</span>
                  <span className="font-mono text-sm text-white">{formatCurrency(val)}</span>
                </div>
              ) : null
            )}
            <div className="flex justify-between items-center py-3 bg-brand-yellow/5 px-3 rounded-lg -mx-3 mt-2">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp size={14} className="text-brand-yellow" /> Net Tax Payable
              </span>
              <span className="font-mono text-xl text-brand-yellow font-bold">{formatCurrency(s.net_tax_payable)}</span>
            </div>
          </div>
        </div>

        {/* ── Assets ── */}
        {hasAssets && (
          <div className="card mb-4">
            <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Package size={15} className="text-brand-yellow" /> Assets
            </p>

            <Section title="Immovable Properties" icon={Home} count={s.immovable_properties?.length}>
              {s.immovable_properties?.map((p, i) => (
                <AssetCard key={i}>
                  <KVRow label="Property" value={p.situation_of_property} />
                  <KVRow label="Date Acquired" value={formatDate(p.date_of_acquisition)} />
                  <KVRow label="Cost" value={formatCurrency(p.cost)} />
                  <KVRow label="Market Value" value={formatCurrency(p.market_value)} />
                </AssetCard>
              ))}
            </Section>

            <Section title="Motor Vehicles" icon={Car} count={s.motor_vehicles?.length}>
              {s.motor_vehicles?.map((v, i) => (
                <AssetCard key={i}>
                  <KVRow label="Description" value={v.description} />
                  <KVRow label="Reg. No." value={v.registration_no} />
                  <KVRow label="Date Acquired" value={formatDate(v.date_of_acquisition)} />
                  <KVRow label="Cost / Market Value" value={formatCurrency(v.cost_market_value)} />
                </AssetCard>
              ))}
            </Section>

            <Section title="Bank Balances" icon={Landmark} count={s.bank_balances?.length}>
              {s.bank_balances?.map((b, i) => (
                <AssetCard key={i}>
                  <KVRow label="Bank" value={b.bank_name} />
                  <KVRow label="Account No." value={b.account_no} />
                  <KVRow label="Amount Invested" value={formatCurrency(b.amount_invested)} />
                  <KVRow label="Interest" value={formatCurrency(b.interest)} />
                  <KVRow label="Balance" value={formatCurrency(b.balance)} />
                </AssetCard>
              ))}
            </Section>

            <Section title="Shares & Stocks" icon={PieChart} count={s.shares_stocks?.length}>
              {s.shares_stocks?.map((sh, i) => (
                <AssetCard key={i}>
                  <KVRow label="Description" value={sh.description} />
                  <KVRow label="No. of Shares" value={sh.no_of_shares?.toString()} />
                  <KVRow label="Date Acquired" value={formatDate(sh.date_of_acquisition)} />
                  <KVRow label="Cost / Market Value" value={formatCurrency(sh.cost_market_value)} />
                  <KVRow label="Net Dividend Income" value={formatCurrency(sh.net_dividend_income)} />
                </AssetCard>
              ))}
            </Section>

            {parseFloat(s.cash_in_hand?.amount) > 0 && (
              <div className="border border-brand-gray-border rounded-xl overflow-hidden mb-3">
                <div className="flex items-center gap-2 px-4 py-3 bg-brand-black-soft">
                  <Wallet size={15} className="text-brand-yellow" />
                  <span className="text-sm font-semibold text-white">Cash in Hand</span>
                </div>
                <div className="px-4 py-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-brand-gray">Amount</span>
                    <span className="text-xs text-white font-mono">{formatCurrency(s.cash_in_hand?.amount)}</span>
                  </div>
                </div>
              </div>
            )}

            <Section title="Loans Given" icon={Landmark} count={s.loans_given?.length}>
              {s.loans_given?.map((l, i) => (
                <AssetCard key={i}>
                  <KVRow label="Borrower" value={l.borrower_name} />
                  <KVRow label="Amount" value={formatCurrency(l.amount)} />
                </AssetCard>
              ))}
            </Section>

            {parseFloat(s.gold_jewellery?.value) > 0 && (
              <div className="border border-brand-gray-border rounded-xl overflow-hidden mb-3">
                <div className="flex items-center gap-2 px-4 py-3 bg-brand-black-soft">
                  <Package size={15} className="text-brand-yellow" />
                  <span className="text-sm font-semibold text-white">Gold / Silver / Jewellery</span>
                </div>
                <div className="px-4 py-3 space-y-0.5">
                  <KVRow label="Description" value={s.gold_jewellery?.description} />
                  <KVRow label="Value" value={formatCurrency(s.gold_jewellery?.value)} />
                </div>
              </div>
            )}

            <Section title="Business Properties" icon={Building2} count={s.business_properties?.length}>
              {s.business_properties?.map((bp, i) => (
                <AssetCard key={i}>
                  <KVRow label="Business" value={bp.name_of_business} />
                  <KVRow label="Current Account Balance" value={formatCurrency(bp.current_account_balance)} />
                  <KVRow label="Capital Account Balance" value={formatCurrency(bp.capital_account_balance)} />
                </AssetCard>
              ))}
            </Section>

            <Section title="Other Assets" icon={Package} count={s.other_assets?.length}>
              {s.other_assets?.map((a, i) => (
                <AssetCard key={i}>
                  <KVRow label="Description" value={a.description} />
                  <KVRow label="Acquisition Type" value={a.acquisition_type} />
                  <KVRow label="Date Acquired" value={formatDate(a.date_of_acquisition)} />
                  <KVRow label="Cost / Value" value={formatCurrency(a.cost_value)} />
                </AssetCard>
              ))}
            </Section>

            <Section title="Disposal of Assets" icon={Package} count={s.disposals?.length}>
              {s.disposals?.map((d, i) => (
                <AssetCard key={i}>
                  <KVRow label="Description" value={d.description} />
                  <KVRow label="Date of Disposal" value={formatDate(d.date_of_disposal)} />
                  <KVRow label="Sales Proceed" value={formatCurrency(d.sales_proceed)} />
                  <KVRow label="Cost" value={formatCurrency(d.cost)} />
                </AssetCard>
              ))}
            </Section>
          </div>
        )}

        {/* ── Liabilities ── */}
        {hasLiabilities && (
          <div className="card mb-4">
            <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <AlertTriangle size={15} className="text-brand-red" /> Liabilities
            </p>
            {s.liabilities?.map((lib, i) => (
              <div key={i} className="bg-brand-black rounded-lg p-3 mb-2 last:mb-0 space-y-0.5">
                <KVRow label="Description" value={lib.description} />
                <KVRow label="Security" value={lib.security_on_liability} />
                <KVRow label="Date of Commencement" value={formatDate(lib.date_of_commencement)} />
                <KVRow label="Original Amount" value={formatCurrency(lib.original_amount)} />
                <KVRow label="Balance as at Date" value={formatCurrency(lib.amount_as_at_date)} />
                <KVRow label="Repaid During Year" value={formatCurrency(lib.amount_repaid_during_year)} />
              </div>
            ))}
          </div>
        )}

        {/* ── Confirm button ── */}
        <div className="card">
          <p className="text-sm text-brand-gray mb-4">
            By confirming, you acknowledge that the tax computation and all asset/liability details above are correct and authorise your consultant to proceed with the final submission.
          </p>
          <div className="flex gap-3 justify-end flex-wrap">
            <button onClick={() => navigate('/client/dashboard')} className="btn-secondary">Later</button>
            <button onClick={downloadPdf} className="btn-secondary flex items-center gap-2">
              <Download size={14} /> Download PDF
            </button>
            <button
              onClick={() => finalConfirmMutation.mutate()}
              disabled={finalConfirmMutation.isPending}
              className="btn-primary"
            >
              {finalConfirmMutation.isPending
                ? <><span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />Confirming...</>
                : <><CheckCircle size={15} /> Confirm &amp; Authorise</>
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  // client_confirmed / archived — show completion screen with download
  if (['client_confirmed', 'archived'].includes(submission?.status)) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button onClick={() => navigate('/client/dashboard')} className="btn-ghost mb-4 text-sm">
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
        <div className="card text-center py-10">
          <CheckCircle size={52} className="text-brand-success mx-auto mb-4" />
          <p className="text-white text-xl font-bold mb-1">Tax Return Confirmed</p>
          <p className="text-sm text-brand-gray mb-6">
            You have confirmed your tax return for {submission?.tax_year_label}. Your consultant will complete the final filing.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate('/client/dashboard')} className="btn-secondary">
              Back to Dashboard
            </button>
            <button onClick={downloadPdf} className="btn-primary flex items-center gap-2">
              <Download size={15} /> Download Tax Return PDF
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <CheckCircle size={48} className="text-brand-success" />
      <p className="text-white text-lg font-semibold">No pending action</p>
      <button onClick={() => navigate('/client/dashboard')} className="btn-primary">Back to Dashboard</button>
    </div>
  )
}
