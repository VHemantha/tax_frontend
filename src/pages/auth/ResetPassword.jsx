import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import { Eye, EyeOff, Lock, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverErrors, setServerErrors] = useState({})

  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  async function onSubmit({ new_password, confirm_password }) {
    setServerErrors({})
    setLoading(true)
    try {
      await api.post('/auth/reset-password/', { uid, token, new_password, confirm_password })
      toast.success('Password has been reset successfully. Please sign in.')
      navigate('/login')
    } catch (err) {
      const data = err.response?.data
      if (data?.detail) {
        toast.error(data.detail)
      } else if (data) {
        setServerErrors(data)
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const invalidLink = !uid || !token

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
            <p className="text-brand-gray text-sm mt-1">Choose a new password</p>
          </div>

          <div className="px-8 py-8">
            {invalidLink ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mx-auto">
                  <ShieldAlert size={22} className="text-brand-red" />
                </div>
                <h2 className="text-lg font-semibold text-white">Invalid reset link</h2>
                <p className="text-sm text-brand-gray">
                  This password reset link is missing or malformed. Please request a new one.
                </p>
                <Link to="/forgot-password" className="btn-primary w-full justify-center py-3 text-base mt-2">
                  Request New Link
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-white mb-6">Set a new password</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="input-label">New Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gray" />
                      <input
                        {...register('new_password', { required: 'New password is required' })}
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={clsx('input-field pl-10 pr-10', (errors.new_password || serverErrors.new_password) && 'border-brand-red focus:border-brand-red focus:ring-brand-red')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-gray hover:text-white transition-colors"
                      >
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.new_password && (
                      <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                        <AlertCircle size={11} />{errors.new_password.message}
                      </p>
                    )}
                    {serverErrors.new_password?.map((msg, i) => (
                      <p key={i} className="text-xs text-brand-red mt-1 flex items-center gap-1">
                        <AlertCircle size={11} />{msg}
                      </p>
                    ))}
                  </div>

                  <div>
                    <label className="input-label">Confirm New Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gray" />
                      <input
                        {...register('confirm_password', {
                          required: 'Please confirm your new password',
                          validate: (value) => value === watch('new_password') || 'Passwords do not match',
                        })}
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={clsx('input-field pl-10 pr-10', (errors.confirm_password || serverErrors.confirm_password) && 'border-brand-red focus:border-brand-red focus:ring-brand-red')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-gray hover:text-white transition-colors"
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                        <AlertCircle size={11} />{errors.confirm_password.message}
                      </p>
                    )}
                    {serverErrors.confirm_password?.map((msg, i) => (
                      <p key={i} className="text-xs text-brand-red mt-1 flex items-center gap-1">
                        <AlertCircle size={11} />{msg}
                      </p>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center py-3 text-base mt-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" />
                        Resetting...
                      </>
                    ) : 'Reset Password'}
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
