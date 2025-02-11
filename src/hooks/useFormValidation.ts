import { useState } from 'react'

type ValidationValue = string | number | boolean | null | undefined
type FormData = Record<string, ValidationValue>

type ValidationRule<T extends FormData> = {
  validate: (value: ValidationValue, formData: T) => boolean
  message: string
}

type ValidationRules<T extends FormData> = {
  [K in keyof T]?: ValidationRule<T>[]
}

type ValidationErrors<T extends FormData> = {
  [K in keyof T]?: string
}

export function useFormValidation<T extends FormData>(rules: ValidationRules<T>) {
  const [errors, setErrors] = useState<ValidationErrors<T>>({})

  const validateField = (field: keyof T, value: ValidationValue, formData: T): string | undefined => {
    const fieldRules = rules[field]
    if (!fieldRules) return undefined

    for (const rule of fieldRules) {
      if (!rule.validate(value, formData)) {
        return rule.message
      }
    }

    return undefined
  }

  const validateForm = (formData: T): boolean => {
    const newErrors: ValidationErrors<T> = {}
    let isValid = true

    for (const field in rules) {
      if (Object.prototype.hasOwnProperty.call(rules, field)) {
        const error = validateField(field as keyof T, formData[field], formData)
        if (error) {
          newErrors[field as keyof T] = error
          isValid = false
        }
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const clearError = (field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  return {
    errors,
    validateForm,
    validateField,
    clearError
  }
}

// Règles de validation prédéfinies
export const validationRules = {
  required: (message = 'Ce champ est requis'): ValidationRule<FormData> => ({
    validate: (value: ValidationValue) => {
      if (typeof value === 'string') return value.trim().length > 0
      if (typeof value === 'number') return true
      return !!value
    },
    message
  }),

  email: (message = 'Email invalide'): ValidationRule<FormData> => ({
    validate: (value: ValidationValue) => {
      if (typeof value !== 'string') return false
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    message
  }),

  minLength: (min: number, message = `Minimum ${min} caractères`): ValidationRule<FormData> => ({
    validate: (value: ValidationValue) => {
      if (typeof value !== 'string') return false
      return value.length >= min
    },
    message
  }),

  maxLength: (max: number, message = `Maximum ${max} caractères`): ValidationRule<FormData> => ({
    validate: (value: ValidationValue) => {
      if (typeof value !== 'string') return false
      return value.length <= max
    },
    message
  }),

  min: (min: number, message = `La valeur minimum est ${min}`): ValidationRule<FormData> => ({
    validate: (value: ValidationValue) => {
      if (typeof value !== 'number') return false
      return value >= min
    },
    message
  }),

  max: (max: number, message = `La valeur maximum est ${max}`): ValidationRule<FormData> => ({
    validate: (value: ValidationValue) => {
      if (typeof value !== 'number') return false
      return value <= max
    },
    message
  }),

  match: (fieldName: string, message = 'Les champs ne correspondent pas'): ValidationRule<FormData> => ({
    validate: (value: ValidationValue, formData: FormData) => {
      if (typeof value !== 'string') return false
      return value === formData[fieldName]
    },
    message
  })
} 