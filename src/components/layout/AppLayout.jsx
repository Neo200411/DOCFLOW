import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import TopNav from './TopNav';

const AppLayout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.status === 401) {
          navigate('/login');
        } else if (res.ok) {
          setLoading(false);
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-gray-200">
        Authenticating...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
