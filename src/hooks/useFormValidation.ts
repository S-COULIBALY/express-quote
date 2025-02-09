import { useState, useCallback } from 'react'

type ValidationRule<T> = {
  validate: (value: any, formData: T) => boolean
  message: string
}

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>[]
}

interface ValidationErrors<T> {
  [K in keyof T]?: string
}

export function useFormValidation<T extends Record<string, any>>(rules: ValidationRules<T>) {
  const [errors, setErrors] = useState<ValidationErrors<T>>({})

  const validateField = useCallback((name: keyof T, value: any, formData: T) => {
    const fieldRules = rules[name]
    if (!fieldRules) return true

    for (const rule of fieldRules) {
      if (!rule.validate(value, formData)) {
        setErrors(prev => ({ ...prev, [name]: rule.message }))
        return false
      }
    }

    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
    return true
  }, [rules])

  const validateForm = useCallback((formData: T) => {
    const newErrors: ValidationErrors<T> = {}
    let isValid = true

    for (const field in rules) {
      const fieldRules = rules[field]
      if (!fieldRules) continue

      for (const rule of fieldRules) {
        if (!rule.validate(formData[field], formData)) {
          newErrors[field] = rule.message
          isValid = false
          break
        }
      }
    }

    setErrors(newErrors)
    return isValid
  }, [rules])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    errors,
    validateField,
    validateForm,
    clearErrors
  }
}

// Règles de validation prédéfinies
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule<any> => ({
    validate: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0
      if (typeof value === 'number') return true
      return !!value
    },
    message
  }),

  email: (message = 'Invalid email address'): ValidationRule<any> => ({
    validate: (value: string) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    message
  }),

  minLength: (length: number, message = `Minimum length is ${length}`): ValidationRule<any> => ({
    validate: (value: string) => value.length >= length,
    message
  }),

  maxLength: (length: number, message = `Maximum length is ${length}`): ValidationRule<any> => ({
    validate: (value: string) => value.length <= length,
    message
  }),

  numeric: (message = 'Must be a number'): ValidationRule<any> => ({
    validate: (value: string) => !isNaN(Number(value)),
    message
  }),

  min: (min: number, message = `Minimum value is ${min}`): ValidationRule<any> => ({
    validate: (value: number) => Number(value) >= min,
    message
  }),

  max: (max: number, message = `Maximum value is ${max}`): ValidationRule<any> => ({
    validate: (value: number) => Number(value) <= max,
    message
  }),

  match: (fieldName: string, message = 'Fields do not match'): ValidationRule<any> => ({
    validate: (value: string, formData: any) => value === formData[fieldName],
    message
  })
} 