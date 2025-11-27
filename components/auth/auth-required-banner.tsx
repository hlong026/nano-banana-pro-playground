"use client"

import { AlertCircle } from "lucide-react"

interface AuthRequiredBannerProps {
  onSignIn: () => void
}

export function AuthRequiredBanner({ onSignIn }: AuthRequiredBannerProps) {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 md:p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm md:text-base font-semibold text-yellow-500 mb-1">
            Sign in required
          </h3>
          <p className="text-xs md:text-sm text-gray-300 mb-3">
            You need to sign in to generate images. Create a free account to get started.
          </p>
          <button
            onClick={onSignIn}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded text-sm transition-colors"
          >
            Sign In / Sign Up
          </button>
        </div>
      </div>
    </div>
  )
}
