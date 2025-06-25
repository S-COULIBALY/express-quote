import { useState } from 'react'

type ValidationValue = string | number | boolean | null | undefined
type FormData = Record<string, ValidationValue>
type FormKey = string & keyof FormData

interface ValidationRule<T extends FormData> {
  validate: (value: ValidationValue, formData: T) => boolean
  message: string
}

interface ValidationRules<T extends FormData> {
  [key: string]: ValidationRule<T>[] | undefined;
}

interface ValidationErrors<T extends FormData> {
  [key: string]: string | undefined;
}

interface ValidationResult<T extends FormData> {
  isValid: boolean
  errors: ValidationErrors<T>
}

export function useFormValidation<T extends FormData>(rules: ValidationRules<T>) {
  const [errors, setErrors] = useState<ValidationErrors<T>>({})

  const validateField = (field: keyof T, value: ValidationValue, formData: T): string | undefined => {
    const fieldRules = rules[field as FormKey]
    if (!fieldRules) return undefined

    for (const rule of fieldRules) {
      if (!rule.validate(value, formData)) {
        return rule.message
      }
    }
    return undefined
  }

  const validateForm = (formData: T): ValidationResult<T> => {
    const newErrors: ValidationErrors<T> = {}
    let isValid = true

    Object.keys(rules).forEach((field) => {
      const error = validateField(field as keyof T, formData[field], formData)
      if (error) {
        newErrors[field as FormKey] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return { isValid, errors: newErrors }
  }

  const clearError = (field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field as FormKey]
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

// Règles de validation prédéfinies avec des types plus stricts
export const validationRules = {
  required: (message = 'Ce champ est requis'): ValidationRule<FormData> => ({
    validate: (value: ValidationValue): boolean => {
      if (typeof value === 'string') return value.trim().length > 0
      if (typeof value === 'number') return true
      if (typeof value === 'boolean') return true
      return value != null
    },
    message
  }),

  email: (message = 'Email invalide'): ValidationRule<FormData> => ({
    validate: (value: ValidationValue): boolean => {
      if (typeof value !== 'string') return false
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    message
  }),

  minLength: (min: number, message = `Minimum ${min} caractères`): ValidationRule<FormData> => ({
    validate: (value: ValidationValue): boolean => {
      if (typeof value !== 'string') return false
      return value.length >= min
    },
    message
  }),

  maxLength: (max: number, message = `Maximum ${max} caractères`): ValidationRule<FormData> => ({
    validate: (value: ValidationValue): boolean => {
      if (typeof value !== 'string') return false
      return value.length <= max
    },
    message
  }),

  min: (min: number, message = `La valeur minimum est ${min}`): ValidationRule<FormData> => ({
    validate: (value: ValidationValue): boolean => {
      if (typeof value !== 'number') return false
      return value >= min
    },
    message
  }),

  max: (max: number, message = `La valeur maximum est ${max}`): ValidationRule<FormData> => ({
    validate: (value: ValidationValue): boolean => {
      if (typeof value !== 'number') return false
      return value <= max
    },
    message
  }),

  match: (fieldName: string, message = 'Les champs ne correspondent pas'): ValidationRule<FormData> => ({
    validate: (value: ValidationValue, formData: FormData): boolean => {
      if (typeof value !== 'string') return false
      return value === formData[fieldName]
    },
    message
  })
} 