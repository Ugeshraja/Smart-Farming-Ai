import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const hasStoredAuth = Boolean(
    localStorage.getItem('smartfarm_token') && localStorage.getItem('smartfarm_user')
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF8] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-agri-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-gray-600">Verifying Farmer Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !hasStoredAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
