'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/firebase';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin-panel/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent. Please check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8">
            <h2 className="text-3xl font-bold text-white text-center">Admin Portal</h2>
            <p className="text-blue-100 text-center mt-2">
              {showForgotPassword ? 'Reset your password' : 'Enter your credentials to continue'}
            </p>
          </div>
          
          <form onSubmit={showForgotPassword ? handleForgotPassword : handleLogin} className="p-8">
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>
            
            {!showForgotPassword && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-700 text-sm font-semibold" htmlFor="password">
                    Password
                  </label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-lg font-medium text-lg hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-lg disabled:opacity-70"
            >
              {isLoading 
                ? (showForgotPassword ? 'Sending...' : 'Signing in...') 
                : (showForgotPassword ? 'Send Reset Link' : 'Sign In')
              }
            </button>
            
            <div className="mt-6 text-center">
              {showForgotPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ← Back to login
                </button>
              ) : (
                <p className="text-gray-600 text-sm">
                </p>
              )}
            </div>
          </form>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Pawin. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}