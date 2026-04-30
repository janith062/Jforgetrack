import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial session
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        const session = data?.session;
        
        if (error) throw error;

        if (session?.user) {
          setUser(session.user);
          await fetchUserRole(session.user.id, session.user.email);
        } else {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    };

    fetchSession();

    // Listen for auth changes
    const { data: authData } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          setUser(session.user);
          await fetchUserRole(session.user.id, session.user.email);
        } else {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setLoading(false);
      }
    });

    const subscription = authData?.subscription;
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId, userEmail) => {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 3000)
    );

    try {
      // Race the supabase query against a 3s timeout
      const { data, error } = await Promise.race([
        supabase.from('users').select('role').eq('id', userId).single(),
        timeout
      ]);

      if (error) throw error;

      if (data) {
        setRole(data.role);
      } else if (userEmail === 'shreyas@gmail.com' || userEmail === 'nischay@theboringpeople.in') {
        setRole('mentor');
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
      // Immediate fallback for the known mentor email
      if (userEmail === 'shreyas@gmail.com' || userEmail === 'nischay@theboringpeople.in') {
        setRole('mentor');
      } else {
        setRole(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };
  
  const value = {
    user,
    role: (user?.email === 'shreyas@gmail.com' || user?.email === 'nischay@theboringpeople.in') ? 'mentor' : role,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
