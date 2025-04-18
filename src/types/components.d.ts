declare module '@/components/LegalConsent' {
  export interface LegalConsentProps {
    onAcceptChange: (accepted: boolean) => void
    initialValue?: boolean
    required?: boolean
    color?: 'blue' | 'emerald' | 'green'
    dataProtection?: boolean
    termsAndConditions?: boolean
    cookiesPolicy?: boolean
    showAllPolicies?: boolean
  }

  export function LegalConsent(props: LegalConsentProps): JSX.Element
} 