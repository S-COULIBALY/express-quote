interface FormFieldProps {
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function TextInput({ error, className = '', ...props }: TextInputProps) {
  return (
    <input
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
        error ? 'border-red-300' : 'border-gray-300'
      } ${className}`}
      {...props}
    />
  )
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export function TextArea({ error, className = '', ...props }: TextAreaProps) {
  return (
    <textarea
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
        error ? 'border-red-300' : 'border-gray-300'
      } ${className}`}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>
  error?: string
}

export function Select({ options, error, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
        error ? 'border-red-300' : 'border-gray-300'
      } ${className}`}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
} 