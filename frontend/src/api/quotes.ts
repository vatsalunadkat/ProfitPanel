import { API_BASE_URL } from './config'

export interface QuoteSubmission {
  name: string
  email: string
  address: string
  monthly_bill: number
}

export interface QuoteResponse {
  id: number
  name: string
  email: string
  address: string
  monthly_bill: string
  estimated_savings: string
  created_at: string
}

export interface ApiError {
  error_code: string
  message: string
  field_errors?: Record<string, string[]>
}

const FRIENDLY_FIELD_MESSAGES: Record<string, Record<string, string>> = {
  email: {
    'Enter a valid email address.': 'Email is invalid.',
    'This field is required.': 'Email is required.',
  },
  name: {
    'This field is required.': 'Please enter your name.',
  },
  address: {
    'This field is required.': 'Please enter your home address so we can assess your solar potential.',
  },
  monthly_bill: {
    'This field is required.': 'Please enter your monthly electricity bill.',
    'A valid number is required.': 'Please enter a number (e.g. 1500).',
  },
}

function humanizeFieldErrors(fieldErrors: Record<string, string[]>): string[] {
  const messages: string[] = []
  for (const [field, errors] of Object.entries(fieldErrors)) {
    for (const error of errors) {
      const friendly = FRIENDLY_FIELD_MESSAGES[field]?.[error]
      if (friendly) {
        messages.push(friendly)
      } else if (field === 'monthly_bill' && error.includes('greater than')) {
        messages.push('Your monthly bill must be a positive number.')
      } else {
        const label = field.replace('_', ' ')
        messages.push(`${label.charAt(0).toUpperCase() + label.slice(1)}: ${error}`)
      }
    }
  }
  return messages
}

export class QuoteApiError extends Error {
  errorCode: string
  friendlyMessages: string[]

  constructor(apiError: ApiError) {
    super(apiError.message)
    this.errorCode = apiError.error_code
    this.friendlyMessages = apiError.field_errors
      ? humanizeFieldErrors(apiError.field_errors)
      : [apiError.message]
  }
}

export async function submitQuote(data: QuoteSubmission): Promise<QuoteResponse> {
  const response = await fetch(`${API_BASE_URL}/api/quotes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    let apiError: ApiError
    try {
      apiError = await response.json()
    } catch {
      apiError = {
        error_code: 'NETWORK_ERROR',
        message: 'Unable to reach the server. Please check your connection and try again.',
      }
    }
    throw new QuoteApiError(apiError)
  }
  return response.json()
}

export async function fetchQuotes(): Promise<QuoteResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/quotes/`)
  if (!response.ok) throw new Error('Failed to fetch quotes')
  return response.json()
}
