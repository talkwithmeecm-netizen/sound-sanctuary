// ============================================================================
// authentication context for managing user sessions
// provides authentication state and functions to all components
// uses react context pattern for global state without prop drilling
// handles signup, login, logout, and session persistence
// ============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// context type definition
// defines the shape of the authentication context value
// ============================================================================
interface AuthContextType {
  // the currently logged in user object, or null if not authenticated
  user: User | null;
  // the current session with tokens, or null if not authenticated
  session: Session | null;
  // true while checking for existing session on page load
  isLoading: boolean;
  // function to create a new user account
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  // function to log in with existing credentials
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  // function to log out the current user
  signOut: () => Promise<void>;
}

// ============================================================================
// create the context
// using undefined as default forces consumers to be inside provider
// ============================================================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// auth provider component
// wraps the app to provide authentication state to all children
// ============================================================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ========== state ==========
  
  // the current user object from supabase auth
  const [user, setUser] = useState<User | null>(null);
  
  // the current session (includes access and refresh tokens)
  const [session, setSession] = useState<Session | null>(null);
  
  // loading state while checking for existing session
  const [isLoading, setIsLoading] = useState(true);

  // ========== auth state listener effect ==========
  
  // sets up listener for auth state changes (login, logout, token refresh)
  // also checks for existing session on component mount
  useEffect(() => {
    // set up auth state change listener first (important order!)
    // this catches all auth events: signin, signout, token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // then check for existing session from local storage
    // this restores login state on page refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('initial session check:', session ? 'logged in' : 'no session');
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // cleanup: unsubscribe from auth listener on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ========== sign up function ==========
  
  // creates a new user account with email and password
  // returns error object if signup fails (e.g., email already exists)
  const signUp = async (email: string, password: string) => {
    try {
      console.log('attempting signup for:', email);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // redirect url after email confirmation (if enabled)
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) {
        console.error('signup error:', error.message);
      } else {
        console.log('signup successful');
      }
      
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      console.error('unexpected signup error:', err);
      return { error: err instanceof Error ? err : new Error('sign up failed') };
    }
  };

  // ========== sign in function ==========
  
  // logs in an existing user with email and password
  // returns error object if login fails (e.g., wrong password)
  const signIn = async (email: string, password: string) => {
    try {
      console.log('attempting signin for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('signin error:', error.message);
      } else {
        console.log('signin successful');
      }
      
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      console.error('unexpected signin error:', err);
      return { error: err instanceof Error ? err : new Error('sign in failed') };
    }
  };

  // ========== sign out function ==========
  
  // logs out the current user and clears session
  const signOut = async () => {
    console.log('signing out user');
    await supabase.auth.signOut();
  };

  // ========== context value ==========
  
  // object containing all auth state and functions
  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
  };

  // render provider with children
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// custom hook to use auth context
// throws error if used outside of authprovider (catches bugs early)
// ============================================================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
