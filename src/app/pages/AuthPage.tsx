import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { TypeHuntButton } from '../components/TypeHuntButton';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { login, register, error, clearError, isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
      navigate('/');
    } catch {
      // Error is already set in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
      }}
    >
      <header className="p-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div
            className="p-8 rounded-2xl shadow-2xl backdrop-blur-lg"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <h1 className="text-4xl text-white text-center mb-2">
              {isLogin ? 'Welcome Back' : 'Join TypeHunt'}
            </h1>
            <p className="text-white/70 text-center mb-8">
              {isLogin ? 'Log in to track your progress' : 'Create an account to start typing'}
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg mb-4 text-center"
                style={{ backgroundColor: 'rgba(220, 38, 38, 0.3)', color: '#fca5a5' }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-white outline-none"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: `2px solid rgba(255, 255, 255, 0.2)`,
                  }}
                />
              </div>

              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required={!isLogin}
                    minLength={3}
                    maxLength={20}
                    pattern="[a-zA-Z0-9_]+"
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-white outline-none"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: `2px solid rgba(255, 255, 255, 0.2)`,
                    }}
                  />
                </motion.div>
              )}

              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-white outline-none"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: `2px solid rgba(255, 255, 255, 0.2)`,
                  }}
                />
              </div>

              <TypeHuntButton
                variant="accent"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? 'Please wait...'
                  : isLogin
                  ? 'Log In'
                  : 'Create Account'}
              </TypeHuntButton>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  clearError();
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Log in'}
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AuthPage;
