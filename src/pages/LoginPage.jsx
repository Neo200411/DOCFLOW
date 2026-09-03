import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [error, setError] = useState('');
  const buttonContainerRef = useRef(null);
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setError('VITE_GOOGLE_CLIENT_ID is not set in the environment.');
      return;
    }

    let intervalId;
    
    const initGoogle = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        clearInterval(intervalId);
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ token: response.credential })
              });

              if (res.ok) {
                navigate('/');
              } else {
                const data = await res.json();
                setError(data.detail || 'Authentication failed');
              }
            } catch (err) {
              setError('Failed to connect to the server');
            }
          }
        });

        if (buttonContainerRef.current) {
          window.google.accounts.id.renderButton(
            buttonContainerRef.current,
            { 
              theme: 'outline', 
              size: 'large', 
              width: 340, // Increased width significantly
              shape: 'pill' // Makes it look a bit more modern
            }
          );
        }
      }
    };

    intervalId = setInterval(initGoogle, 100);
    initGoogle(); // try immediately

    return () => clearInterval(intervalId);
  }, [clientId, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements to make it feel premium */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="bg-surface/80 backdrop-blur-xl border border-border/50 rounded-2xl p-10 max-w-[420px] w-full flex flex-col items-center shadow-2xl relative z-10 transition-all hover:border-primary/30">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          {/* A simple placeholder logo icon using an SVG */}
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-100 mb-2 text-center tracking-tight">Welcome to DocFlow</h1>
        <p className="text-base text-gray-400 mb-10 text-center">
          Securely manage and collaborate on your documents. Please sign in to continue.
        </p>
        
        {!clientId ? (
          <div className="text-red-500 text-sm text-center p-4 bg-red-500/10 rounded-lg w-full border border-red-500/20">
            <span className="block font-semibold mb-1">Configuration Error</span>
            VITE_GOOGLE_CLIENT_ID is missing from your environment.
          </div>
        ) : (
          <div ref={buttonContainerRef} className="h-[44px] flex justify-center w-full transform hover:scale-[1.02] transition-transform duration-200"></div>
        )}
        
        {error && (
          <div className="mt-6 text-red-400 text-sm text-center p-3 bg-red-400/10 rounded-lg w-full border border-red-400/20">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
