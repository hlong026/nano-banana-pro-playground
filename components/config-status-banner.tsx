"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, Info } from "lucide-react"

export function ConfigStatusBanner() {
  const [status, setStatus] = useState<{
    supabase: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    const checkConfig = () => {
      const hasSupabase = !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-key"
      )

      if (!hasSupabase) {
        setStatus({
          supabase: false,
          message: "Using local storage for history. Sign in to sync across devices.",
        })
      }
    }

    checkConfig()
  }, [])

  if (!status || status.supabase) {
    return null
  }

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs md:text-sm text-gray-300">
            {status.message}
          </p>
        </div>
      </div>
    </div>
  )
}
