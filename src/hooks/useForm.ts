import { useState, ChangeEvent } from 'react'

type FormValue = string | number | boolean | Record<string, unknown>

export function useForm<T extends Record<string, FormValue>>(initialState: T) {
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