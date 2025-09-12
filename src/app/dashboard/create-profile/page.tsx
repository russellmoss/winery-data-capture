'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { C7Associate } from '@/lib/commerce7/types'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  stateCode: z.string().optional(),
  zipCode: z.string().optional(),
  associateName: z.string().optional()
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function CreateProfilePage() {
  const [associates, setAssociates] = useState<C7Associate[]>([])
  const [associatesLoading, setAssociatesLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  })

  useEffect(() => {
    fetchAssociates()
  }, [])

  const fetchAssociates = async () => {
    try {
      setAssociatesLoading(true)
      
      // Check if we have cached associates (less than 1 hour old)
      const cached = localStorage.getItem('associates_cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds
        if (Date.now() - timestamp < oneHour) {
          console.log('Using cached associates')
          // Sort cached data alphabetically by name
          const sortedCachedAssociates = data.sort((a: C7Associate, b: C7Associate) => a.name.localeCompare(b.name))
          setAssociates(sortedCachedAssociates)
          setAssociatesLoading(false)
          return
        }
      }
      
      // Fetch fresh data
      console.log('Fetching fresh associates from API')
      const response = await fetch('/api/associates')
      const data = await response.json()
      const associates = data.associates || []
      
      // Sort associates alphabetically by name
      const sortedAssociates = associates.sort((a: C7Associate, b: C7Associate) => a.name.localeCompare(b.name))
      
      // Cache the results
      localStorage.setItem('associates_cache', JSON.stringify({
        data: sortedAssociates,
        timestamp: Date.now()
      }))
      
      setAssociates(sortedAssociates)
    } catch (error) {
      console.error('Error fetching associates:', error)
    } finally {
      setAssociatesLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true)
      setMessage(null)

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create profile')
      }

      setMessage({
        type: 'success',
        text: 'Profile created successfully!'
      })
      reset()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred while creating the profile'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Create Customer Profile</h1>
      <p className="mt-2 text-sm text-gray-700">
        Enter customer information to create a new profile in Commerce7.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6 max-w-2xl">
        {message && (
          <div
            className={`rounded-md p-4 ${
              message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <input
              {...register('firstName')}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name *
            </label>
            <input
              {...register('lastName')}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              {...register('address')}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              {...register('city')}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="stateCode" className="block text-sm font-medium text-gray-700">
              State
            </label>
            <input
              {...register('stateCode')}
              type="text"
              maxLength={2}
              placeholder="NY"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
              ZIP Code
            </label>
            <input
              {...register('zipCode')}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="associateName" className="block text-sm font-medium text-gray-700">
              Associate
            </label>
            <select
              {...register('associateName')}
              disabled={associatesLoading}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {associatesLoading ? 'Loading associates...' : 'Select Associate (Optional)'}
              </option>
              {!associatesLoading && associates.map((associate) => (
                <option key={associate.id} value={associate.name}>
                  {associate.name}
                </option>
              ))}
            </select>
            {associatesLoading && (
              <div className="mt-1 text-sm text-gray-500 animate-pulse">
                🔄 Loading associates from Commerce7...
              </div>
            )}
          </div>
        </div>

        <div className="pt-5">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
