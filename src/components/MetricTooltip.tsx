'use client'

import { useState } from 'react'

interface MetricTooltipProps {
  title: string
  content: string
  className?: string
}

export default function MetricTooltip({ title, content, className = '' }: MetricTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Help Icon */}
      <button
        type="button"
        className="text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-full"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        aria-label={`Help: ${title}`}
      >
        <svg 
          className="w-4 h-4" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div className="absolute z-50 w-80 p-4 mt-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg border border-gray-700 right-0 top-full transform -translate-x-4">
          <div className="relative">
            {/* Arrow */}
            <div className="absolute -top-2 right-4 w-4 h-4 bg-gray-900 border-l border-t border-gray-700 transform rotate-45"></div>
            
            {/* Content */}
            <div className="relative">
              <h4 className="font-semibold text-blue-300 mb-2">{title}</h4>
              <p className="text-gray-100 leading-relaxed">{content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
