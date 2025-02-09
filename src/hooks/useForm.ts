import { useState, ChangeEvent } from 'react'

export function useForm<T extends Record<string, any>>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState)

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : value
    }))
  }

  const resetForm = () => {
    setFormData(initialState)
  }

  return {
    formData,
    setFormData,
    handleChange,
    resetForm
  }
} 