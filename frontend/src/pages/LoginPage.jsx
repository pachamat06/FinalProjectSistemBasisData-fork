import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function LoginPage() {
  const [formData, setFormData] = useState({ usernameOrEmail: '', password: '' });
  const { login, guestLogin, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.usernameOrEmail, formData.password);
      navigate('/welcome');
    } catch (err) {
      // Error handled in store
    }
  };

  const handleGuest = async () => {
    try {
      await guestLogin();
      navigate('/welcome');
    } catch (err) {
      // Error handled in store
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-16 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 animate-gradient-shift" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />

      <div className="relative z-10 w-full max-w-lg p-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Jokris99" className="w-24 h-24 mx-auto mb-4 animate-bounce" />
          <h1 className="font-orbitron text-4xl font-black text-white mb-2">JOKRIS99</h1>
          <p className="text-white/80 font-rajdhani">Premium Casino Experience</p>
        </div>

        {/* Login form */}
        <div className="glass border border-white/20 rounded-3xl p-10 backdrop-blur-xl">
          <h2 className="font-orbitron text-2xl font-bold text-white text-center mb-6">LOGIN</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-4">
              <p className="text-red-300 text-sm text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 px-6 flex flex-col items-center">
            <div className="w-full max-w-md mb-4">
              <input
                type="text"
                placeholder="Username or Email"
                value={formData.usernameOrEmail}
                onChange={(e) => setFormData({ ...formData, usernameOrEmail: e.target.value })}
                style={{ paddingLeft: '1rem' }}
                className="w-full max-w-md pl-8 pr-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-yellow-400 transition-colors"
                required
              />
            </div>
            <div className="w-full max-w-md">
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ paddingLeft: '1rem' }}
                className="w-full max-w-md pl-8 pr-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-yellow-400 transition-colors"
                required
              />
            </div>
            <div className="h-4" />
            <div className="w-full max-w-md">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-orbitron font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50"
              >
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleGuest}
              disabled={loading}
              className="w-full max-w-md py-3 rounded-xl border border-white/30 text-white font-rajdhani hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {loading ? 'CREATING GUEST...' : 'CONTINUE AS GUEST'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-white/80 hover:text-white font-rajdhani text-sm">
              Don't have an account? <span className="text-yellow-400">Register</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}