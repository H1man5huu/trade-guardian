import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const storedPassword = localStorage.getItem('trmap_password');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storedPassword) {
      // First time - set password
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
      if (isSettingPassword) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        localStorage.setItem('trmap_password', password);
        onLogin();
      } else {
        setIsSettingPassword(true);
      }
    } else {
      // Verify password
      if (password === storedPassword) {
        onLogin();
      } else {
        setError('Incorrect password');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-primary">TRMAP</h1>
          <p className="text-muted-foreground mt-2">Trading Risk Management & Analytics Platform</p>
        </div>

        {/* Login Form */}
        <div className="trading-card">
          <h2 className="text-xl font-semibold mb-6 text-center">
            {!storedPassword 
              ? (isSettingPassword ? 'Confirm Your Password' : 'Create Your Password')
              : 'Enter Password'
            }
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                {isSettingPassword ? 'Confirm Password' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={isSettingPassword ? confirmPassword : password}
                  onChange={(e) => {
                    if (isSettingPassword) {
                      setConfirmPassword(e.target.value);
                    } else {
                      setPassword(e.target.value);
                    }
                    setError('');
                  }}
                  className="trading-input w-full pr-10"
                  placeholder={isSettingPassword ? 'Confirm password' : 'Enter password'}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!storedPassword && !isSettingPassword && (
              <div>
                <label className="block text-sm text-muted-foreground mb-2">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="trading-input w-full"
                  placeholder="Create a password"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button type="submit" className="btn-trading w-full flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              {!storedPassword 
                ? (isSettingPassword ? 'Set Password' : 'Continue')
                : 'Unlock'
              }
            </button>
          </form>

          {!storedPassword && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Your password protects your trading data. Keep it safe!
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Capital Preservation First • Institutional Risk Discipline
        </p>
      </div>
    </div>
  );
}
