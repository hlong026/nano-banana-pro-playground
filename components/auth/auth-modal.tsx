"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithGithub, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      if (mode === "signin") {
        const { error } = await signInWithEmail(email, password)
        if (error) throw error
        onOpenChange(false)
      } else if (mode === "signup") {
        const { error } = await signUpWithEmail(email, password)
        if (error) throw error
        setMessage("Check your email to confirm your account!")
      } else if (mode === "forgot") {
        const { error } = await resetPassword(email)
        if (error) throw error
        setMessage("Check your email for password reset link!")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true)
    setError("")
    try {
      let result
      if (provider === "google") {
        result = await signInWithGoogle()
      } else {
        result = await signInWithGithub()
      }
      
      if (result.error) {
        // 检查是否是提供商未启用的错误
        if (result.error.message?.includes("provider is not enabled") || 
            result.error.message?.includes("Unsupported provider")) {
          setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not configured yet. Please use email/password to sign in.`)
        } else {
          setError(result.error.message || "An error occurred")
        }
        setLoading(false)
      }
      // OAuth 会重定向，所以不需要在这里处理成功情况
    } catch (err: any) {
      setError(err.message || "An error occurred")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/95 border-gray-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {mode === "signin" && "Sign In"}
            {mode === "signup" && "Create Account"}
            {mode === "forgot" && "Reset Password"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-black/50 border-gray-600 text-white"
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-black/50 border-gray-600 text-white"
              />
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {message && <p className="text-green-400 text-sm">{message}</p>}

          <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-gray-200">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signin" && "Sign In"}
            {mode === "signup" && "Create Account"}
            {mode === "forgot" && "Send Reset Link"}
          </Button>
        </form>

        {mode !== "forgot" && process.env.NEXT_PUBLIC_ENABLE_OAUTH !== "false" && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-2 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuth("google")}
                disabled={loading}
                className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuth("github")}
                disabled={loading}
                className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
              >
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </Button>
            </div>
          </>
        )}

        <div className="mt-4 text-center text-sm text-gray-400">
          {mode === "signin" && (
            <>
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-gray-300 hover:text-white underline mr-4"
              >
                Forgot password?
              </button>
              <span>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-white hover:underline"
                >
                  Sign up
                </button>
              </span>
            </>
          )}
          {mode === "signup" && (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-white hover:underline"
              >
                Sign in
              </button>
            </span>
          )}
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-white hover:underline"
            >
              Back to sign in
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
