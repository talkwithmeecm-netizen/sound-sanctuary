// ============================================================================
// authentication form component for login and signup
// provides email/password forms for user authentication
// includes form validation, error display, and loading states
// toggles between login and signup modes
// ============================================================================

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Loader2, Ear, Mail, Lock } from 'lucide-react';

// ============================================================================
// auth form component
// no props - uses auth context for all authentication logic
// ============================================================================
export function AuthForm() {
  // ========== form state ==========
  
  // toggle between login mode (true) and signup mode (false)
  const [isLogin, setIsLogin] = useState(true);
  
  // email input value
  const [email, setEmail] = useState('');
  
  // password input value
  const [password, setPassword] = useState('');
  
  // true while form is submitting to prevent double-submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // error message to display (null if no error)
  const [error, setError] = useState<string | null>(null);
  
  // get auth functions from context
  const { signIn, signUp } = useAuth();

  // ========== form submission handler ==========
  
  // handles both login and signup based on current mode
  const handleSubmit = async (e: React.FormEvent) => {
    // prevent default form submission (page reload)
    e.preventDefault();
    
    // clear any previous error
    setError(null);
    
    // show loading state
    setIsSubmitting(true);

    try {
      // call appropriate auth function based on mode
      const { error: authError } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      // display error if auth failed
      if (authError) {
        setError(authError.message);
      }
      // on success, auth context will update and component will unmount
    } catch (err) {
      // handle unexpected errors
      setError('an unexpected error occurred');
    } finally {
      // always hide loading state
      setIsSubmitting(false);
    }
  };

  // ========== render ==========
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-2 border-border">
        <CardHeader className="text-center space-y-4">
          {/* app logo - ear icon in circle */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <Ear className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
          
          {/* app name */}
          <CardTitle className="text-scaled-3xl font-bold">SoundSense</CardTitle>
          
          {/* mode-specific description */}
          <CardDescription className="text-scaled-lg text-muted-foreground">
            {isLogin 
              ? 'sign in to continue monitoring sounds' 
              : 'create an account to start monitoring sounds'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* email input field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-scaled-base font-bold flex items-center gap-2">
                <Mail className="w-5 h-5 icon-scaled" />
                email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="h-14 text-scaled-lg border-2 focus:ring-4"
                aria-label="email address"
              />
            </div>

            {/* password input field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-scaled-base font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 icon-scaled" />
                password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-14 text-scaled-lg border-2 focus:ring-4"
                aria-label="password"
              />
            </div>

            {/* error message display */}
            {error && (
              <div 
                className="p-4 rounded-lg bg-destructive/20 border-2 border-destructive text-destructive text-scaled-base font-bold"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* submit button with loading state */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 text-scaled-lg font-bold btn-scaled"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  please wait...
                </>
              ) : isLogin ? (
                'sign in'
              ) : (
                'create account'
              )}
            </Button>

            {/* toggle between login and signup modes */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);  // clear error when switching modes
                }}
                className="text-scaled-base text-primary hover:underline font-bold focus:outline-none focus:ring-4 focus:ring-ring rounded px-2 py-1"
              >
                {isLogin 
                  ? "don't have an account? sign up" 
                  : 'already have an account? sign in'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
