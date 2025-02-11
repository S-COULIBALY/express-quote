import { useState, ChangeEvent } from 'react'

export function useForm<T extends Record<string, any>>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState)

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  const resetForm = () => setFormData(initialState)

  return {
    formData,
    setFormData,
    handleChange,
    resetForm
  }
} 