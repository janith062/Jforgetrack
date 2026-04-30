import React from 'react';
import { useNavigate } from 'react-router-dom';

const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-void text-fg-primary relative p-4">
      <div className="absolute inset-0 bg-cosmic-glow pointer-events-none z-0"></div>

      <div className="card max-w-[480px] z-10 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center text-danger-fg mb-6 text-2xl font-display font-bold">
          403
        </div>
        
        <h1 className="text-display-sm mb-4">Access Denied</h1>
        <p className="text-body-lg text-fg-secondary mb-8">
          You don't have permission to access this page based on your current role. 
          If you believe this is an error, please contact your bootcamp mentor.
        </p>

        <button 
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Forbidden;
