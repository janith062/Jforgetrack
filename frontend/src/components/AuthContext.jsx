import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();
const MENTOR_EMAILS = new Set(['shreyas@gmail.com', 'nischay@theboringpeople.in']);
const ROLE_CACHE_PREFIX = 'forgetrack-role:';

function getRoleCacheKey(userId, userEmail) {
  return `${ROLE_CACHE_PREFIX}${userId || userEmail || 'anonymous'}`;
}

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
        // #region agent log
        fetch('http://127.0.0.1:7662/ingest/ff34898f-315f-4614-860e-a1a3f01603a4', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '5347d3'
          },
          body: JSON.stringify({
            sessionId: '5347d3',
            runId: 'initial',
            hypothesisId: 'H3',
            location: 'src/components/AuthContext.jsx:fetchSession',
            message: 'Initial session fetched',
            data: {
              hasSessionUser: Boolean(session?.user),
              getSessionErrorMessage: error?.message ?? null,
              getSessionErrorStatus: error?.status ?? null,
              getSessionErrorCode: error?.code ?? null
            },
            timestamp: Date.now()
          })
        }).catch(() => {});
        // #endregion
        
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
        // #region agent log
        fetch('http://127.0.0.1:7662/ingest/ff34898f-315f-4614-860e-a1a3f01603a4', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '5347d3'
          },
          body: JSON.stringify({
            sessionId: '5347d3',
            runId: 'initial',
            hypothesisId: 'H3',
            location: 'src/components/AuthContext.jsx:onAuthStateChange',
            message: 'Auth state changed',
            data: {
              event: _event,
              hasSessionUser: Boolean(session?.user)
            },
            timestamp: Date.now()
          })
        }).catch(() => {});
        // #endregion
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
    const cacheKey = getRoleCacheKey(userId, userEmail);
    const cachedRole = window.localStorage.getItem(cacheKey);
    const normalizedEmail = userEmail?.toLowerCase?.() || '';

    if (MENTOR_EMAILS.has(normalizedEmail)) {
      setRole('mentor');
      window.localStorage.setItem(cacheKey, 'mentor');
      setLoading(false);
      return;
    }

    if (cachedRole) {
      setRole(cachedRole);
      setLoading(false);
    }

    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 8000)
    );

    try {
      // #region agent log
      fetch('http://127.0.0.1:7662/ingest/ff34898f-315f-4614-860e-a1a3f01603a4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '5347d3'
        },
        body: JSON.stringify({
          sessionId: '5347d3',
          runId: 'initial',
          hypothesisId: 'H5',
          location: 'src/components/AuthContext.jsx:fetchUserRole:beforeQuery',
          message: 'Role query started',
          data: {
            hasUserId: Boolean(userId),
            emailDomain: userEmail?.includes('@') ? userEmail.split('@')[1] : null
          },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion
      // Race the supabase query against a 3s timeout
      const { data, error } = await Promise.race([
        supabase.from('users').select('role').eq('id', userId).maybeSingle(),
        timeout
      ]);

      // #region agent log
      fetch('http://127.0.0.1:7662/ingest/ff34898f-315f-4614-860e-a1a3f01603a4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '5347d3'
        },
        body: JSON.stringify({
          sessionId: '5347d3',
          runId: 'initial',
          hypothesisId: 'H5',
          location: 'src/components/AuthContext.jsx:fetchUserRole:afterQuery',
          message: 'Role query completed',
          data: error
            ? {
                hasError: true,
                errorMessage: error.message,
                errorCode: error.code ?? null,
                errorDetails: error.details ?? null
              }
            : {
                hasError: false,
                role: data?.role ?? null
              },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion

      if (error) throw error;

      if (data?.role) {
        setRole(data.role);
        window.localStorage.setItem(cacheKey, data.role);
      } else if (!cachedRole) {
        setRole(null);
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
      if (cachedRole) {
        setRole(cachedRole);
      } else if (MENTOR_EMAILS.has(normalizedEmail)) {
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
    role: MENTOR_EMAILS.has(user?.email?.toLowerCase?.() || '') ? 'mentor' : role,
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
