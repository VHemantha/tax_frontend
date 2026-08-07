import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  async function onSubmit({ email }) {
    setLoading(true)
    try {
      await api.post('/auth/forgot-password/', { email })
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-yellow/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="bg-brand-black-light border border-brand-gray-border rounded-2xl shadow-card overflow-hidden">
          <div className="bg-gradient-to-r from-brand-black to-brand-black-mid px-8 py-8 text-center border-b border-brand-gray-border">
            <img src="/logo.png" alt="DPR - TMS" className="h-16 w-auto object-contain mx-auto mb-4" />
            <p className="text-brand-gray text-sm mt-1">Reset your password</p>
          </div>

          <div className="px-8 py-8">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-brand-success/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={22} className="text-brand-success" />
                </div>
                <h2 className="text-lg font-semibold text-white">Check your email</h2>
                <p className="text-sm text-brand-gray">
                  If an account with that email exists, we've sent a link to reset your password.
                </p>
                <Link to="/login" className="btn-secondary w-full justify-center py-3 text-base mt-2">
                  <ArrowLeft size={15} /> Back to Sign In
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-white mb-2">Forgot your password?</h2>
                <p className="text-sm text-brand-gray mb-6">
                  Enter the email address on your account and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="input-label">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gray" />
                      <input
                        {...register('email', { required: 'Email is required' })}
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={clsx('input-field pl-10', errors.email && 'border-brand-red focus:border-brand-red focus:ring-brand-red')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                        <AlertCircle size={11} />{errors.email.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center py-3 text-base mt-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : 'Send Reset Link'}
                  </button>
                </form>

                <Link
                  to="/login"
                  className="mt-6 flex items-center justify-center gap-1.5 text-xs text-brand-gray hover:text-white transition-colors"
                >
                  <ArrowLeft size={12} /> Back to Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-brand-gray mt-6">
          Secured portal for authorized users only. <br />
          Contact your tax consultant for access.
        </p>
      </div>
    </div>
  )
}
