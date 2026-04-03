import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import api from '../../../services/api'
import FileUpload from '../../../components/common/FileUpload'
import toast from 'react-hot-toast'

export default function LiabilitiesSection({ submissionId, documents, onUpload, onDeleteDoc, isReadOnly, onNext, onPrev }) {
  const qc = useQueryClient()

  const { data: liabilities = [] } = useQuery({
    queryKey: ['liabilities', submissionId],
    queryFn: () => api.get(`/tax/submissions/${submissionId}/liabilities/`).then(r => r.data),
  })

  async function addLiability() {
    try {
      await api.post(`/tax/submissions/${submissionId}/liabilities/`, { description: '', original_amount: 0, amount_as_at_date: 0, amount_repaid_during_year: 0 })
      qc.invalidateQueries(['liabilities', submissionId])
    } catch { toast.error('Failed to add') }
  }

  async function deleteLiability(id) {
    try {
      await api.delete(`/tax/liabilities/${id}/`)
      qc.invalidateQueries(['liabilities', submissionId])
    } catch { toast.error('Failed to delete') }
  }

  async function updateLiability(id, field, value) {
    try {
      await api.patch(`/tax/liabilities/${id}/`, { [field]: value })
      qc.invalidateQueries(['liabilities', submissionId])
    } catch { toast.error('Failed to update') }
  }

  function EditCell({ value, onChange, type = 'text' }) {
    return (
      <input
        defaultValue={value}
        type={type}
        step={type === 'number' ? '0.01' : undefined}
        onBlur={(e) => !isReadOnly && onChange(e.target.value)}
        disabled={isReadOnly}
        className={`bg-transparent border-0 text-white text-sm w-full focus:outline-none focus:bg-brand-black-soft rounded px-1 ${type === 'number' ? 'text-right font-mono' : ''}`}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="form-section">
        <h3 className="section-header">
          <span className="text-brand-yellow font-bold">$</span>
          Liabilities as at 31st March 2026
        </h3>

        <p className="text-sm text-brand-gray mb-4">
          Bank Loans, Leasing, Current or Credit Card Account balances etc.
        </p>

        <div className="flex justify-end mb-3">
          {!isReadOnly && (
            <button type="button" onClick={addLiability} className="btn-secondary text-xs px-3 py-1.5">
              <Plus size={13} /> Add Liability
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-brand-gray-border mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-black">
                <th className="table-header text-left">#</th>
                <th className="table-header text-left">Description of Liability</th>
                <th className="table-header text-left">Security</th>
                <th className="table-header text-left">Date of Commencement</th>
                <th className="table-header text-right">Original Amount</th>
                <th className="table-header text-right">Balance as at 31.03.2026</th>
                <th className="table-header text-right">Amount Repaid Y/A</th>
                {!isReadOnly && <th className="table-header w-10" />}
              </tr>
            </thead>
            <tbody>
              {liabilities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-cell text-center text-brand-gray py-8">
                    No liabilities entered — click "Add Liability" to begin
                  </td>
                </tr>
              ) : (
                liabilities.map((lib, idx) => (
                  <tr key={lib.id} className="table-row">
                    <td className="table-cell text-brand-gray w-8">{idx + 1}</td>
                    <td className="table-cell min-w-[200px]">
                      <EditCell value={lib.description} onChange={(v) => updateLiability(lib.id, 'description', v)} />
                    </td>
                    <td className="table-cell min-w-[150px]">
                      <EditCell value={lib.security_on_liability || ''} onChange={(v) => updateLiability(lib.id, 'security_on_liability', v)} />
                    </td>
                    <td className="table-cell">
                      <EditCell value={lib.date_of_commencement || ''} type="date" onChange={(v) => updateLiability(lib.id, 'date_of_commencement', v)} />
                    </td>
                    <td className="table-cell">
                      <EditCell value={lib.original_amount} type="number" onChange={(v) => updateLiability(lib.id, 'original_amount', v)} />
                    </td>
                    <td className="table-cell">
                      <EditCell value={lib.amount_as_at_date} type="number" onChange={(v) => updateLiability(lib.id, 'amount_as_at_date', v)} />
                    </td>
                    <td className="table-cell">
                      <EditCell value={lib.amount_repaid_during_year} type="number" onChange={(v) => updateLiability(lib.id, 'amount_repaid_during_year', v)} />
                    </td>
                    {!isReadOnly && (
                      <td className="table-cell">
                        <button onClick={() => deleteLiability(lib.id)} className="text-brand-red hover:opacity-80">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-brand-gray">
            <span className="text-brand-yellow font-medium">Note:</span> Please attach Confirmation Letters from Bank or Financial Institute for all listed liabilities.
          </p>
        </div>

        <FileUpload
          label="Bank / Financial Institute Confirmation Letters"
          documentType="bank_confirmation_letter"
          section="liabilities"
          submissionId={submissionId}
          documents={documents}
          onUpload={onUpload}
          onDelete={onDeleteDoc}
          required
          hint="Required for all liabilities"
        />
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={onPrev} className="btn-secondary">
          <ChevronLeft size={15} /> Previous
        </button>
        <button type="button" onClick={onNext} className="btn-primary">
          Next: Declarant Details <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
