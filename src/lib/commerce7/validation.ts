import { z } from 'zod'
import { ValidationError } from '@/lib/errors'

export const customerCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  stateCode: z.string().length(2, 'State code must be 2 characters').optional(),
  zipCode: z.string().optional(),
  countryCode: z.string().length(2, 'Country code must be 2 characters').optional(),
  associateName: z.string().optional()
})

export function validateCustomerData(data: unknown) {
  try {
    return customerCreateSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`)
    }
    throw error
  }
}
