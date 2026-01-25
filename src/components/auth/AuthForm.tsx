// authentication form component for login and signup
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Ear, Mail, Lock } from 'lucide-react';

export function AuthForm() {
  // form state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn, signUp } = useAuth();

  // handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: authError } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (authError) {
        setError(authError.message);
      }
    } catch (err) {
      setError('an unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-2 border-border">
        <CardHeader className="text-center space-y-4">
          {/* app logo and title */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <Ear className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
          <CardTitle className="text-scaled-3xl font-bold">SoundSense</CardTitle>
          <CardDescription className="text-scaled-lg text-muted-foreground">
            {isLogin 
              ? 'sign in to continue monitoring sounds' 
              : 'create an account to start monitoring sounds'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* email input */}
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

            {/* password input */}
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

            {/* error message */}
            {error && (
              <div 
                className="p-4 rounded-lg bg-destructive/20 border-2 border-destructive text-destructive text-scaled-base font-bold"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* submit button */}
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

            {/* toggle between login and signup */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
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
