import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import { UserPlus, Eye, EyeOff, AlertCircle, Copy, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function RegisterClient() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [success, setSuccess] = useState(null)
  const [copied, setCopied] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: { password: generatePassword() }
  })

  async function onSubmit(data) {
    setLoading(true)
    try {
      const response = await api.post('/clients/register/', data)
      setSuccess({
        email: data.email,
        username: data.username,
        password: data.password,
        name: `${data.first_name} ${data.last_name}`,
      })
      reset({ password: generatePassword() })
      toast.success('Client registered successfully!')
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        Object.values(errors).flat().forEach(msg => toast.error(msg))
      } else {
        toast.error('Registration failed')
      }
    }
    setLoading(false)
  }

  function copyCredentials() {
    if (!success) return
    const text = `Tax Portal Login Credentials\n\nEmail: ${success.email}\nUsername: ${success.username}\nPassword: ${success.password}\n\nPlease log in at https://portal.taxautomation.lk and change your password immediately.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Credentials copied to clipboard')
  }

  function Field({ name, label, required, type = 'text', registerProps, error, children }) {
    return (
      <div>
        <label className="input-label">{label}{required && <span className="text-brand-red ml-0.5">*</span>}</label>
        {children || (
          <input
            {...register(name, registerProps)}
            type={type}
            className={clsx('input-field', error && 'border-brand-red focus:border-brand-red')}
            placeholder={label}
          />
        )}
        {error && (
          <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
            <AlertCircle size={11} />{error.message}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl animate-fade-in">
      <PageHeader
        title="Register New Client"
        subtitle="Create a new client account and generate login credentials"
      />

      {success && (
        <div className="mb-6 bg-brand-success/10 border border-brand-success/30 rounded-xl p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-brand-success" />
            <p className="font-semibold text-white">Client Registered Successfully!</p>
          </div>
          <div className="bg-brand-black rounded-lg p-4 font-mono text-sm space-y-1.5">
            <p><span className="text-brand-gray">Name: </span><span className="text-white">{success.name}</span></p>
            <p><span className="text-brand-gray">Email: </span><span className="text-brand-yellow">{success.email}</span></p>
            <p><span className="text-brand-gray">Username: </span><span className="text-white">{success.username}</span></p>
            <p><span className="text-brand-gray">Password: </span><span className="text-brand-red">{success.password}</span></p>
          </div>
          <div className="flex gap-3 mt-3">
            <button onClick={copyCredentials} className="btn-secondary text-xs">
              {copied ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy Credentials</>}
            </button>
            <button onClick={() => navigate('/consultant/clients')} className="btn-primary text-xs">
              View Client List
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <h3 className="section-header">
          <UserPlus size={18} className="text-brand-yellow" />
          Account Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <Field name="first_name" label="First Name" required registerProps={{ required: 'Required' }} error={errors.first_name} />
          <Field name="last_name" label="Last Name" required registerProps={{ required: 'Required' }} error={errors.last_name} />
          <Field name="email" label="Email Address" required type="email" registerProps={{ required: 'Required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } }} error={errors.email} />
          <Field name="username" label="Username" required registerProps={{ required: 'Required', pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Letters, numbers, underscores only' } }} error={errors.username} />
          <Field name="phone" label="Phone Number" registerProps={{}} error={errors.phone} />

          {/* Password */}
          <div>
            <label className="input-label">Password <span className="text-brand-red">*</span></label>
            <div className="relative">
              <input
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
                type={showPass ? 'text' : 'password'}
                className={clsx('input-field pr-20', errors.password && 'border-brand-red')}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button type="button" onClick={() => setShowPass(v => !v)} className="text-brand-gray hover:text-white p-1">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button type="button" onClick={() => reset({ password: generatePassword() })} className="text-xs text-brand-yellow hover:opacity-80 px-1">
                  Gen
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="text-xs text-brand-red mt-1 flex items-center gap-1">
                <AlertCircle size={11} />{errors.password.message}
              </p>
            )}
            <p className="text-xs text-brand-gray mt-1">Client must change this on first login</p>
          </div>
        </div>

        <hr className="border-brand-gray-border mb-5" />

        <h3 className="section-header">
          Tax Profile Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field name="tin" label="TIN (Taxpayer Identification Number)" registerProps={{}} />
          <Field name="pin" label="PIN" registerProps={{}} />
          <Field name="nic_passport" label="NIC / Passport Number" registerProps={{}} />
          <Field name="telephone" label="Telephone Number" registerProps={{}} />
          <Field name="mobile" label="Mobile Number" registerProps={{}} />
          <div className="md:col-span-2">
            <label className="input-label">Address</label>
            <textarea {...register('address')} rows={2} className="input-field resize-none" placeholder="Full address" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-brand-gray-border">
          <button type="button" onClick={() => navigate('/consultant/clients')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-brand-black border-t-transparent rounded-full animate-spin" /> Registering...</>
            ) : (
              <><UserPlus size={15} /> Register Client</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
