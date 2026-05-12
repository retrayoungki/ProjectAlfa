import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setAuthenticated, systemUsers, setCurrentUser }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay for premium feel
    setTimeout(() => {
      const user = systemUsers.find(u => 
        (u.username === credentials.username || u.email === credentials.username) && 
        u.password === credentials.password &&
        u.status === 'Active'
      );

      if (user) {
        setAuthenticated(true);
        setCurrentUser({
          id: user.id,
          name: user.username,
          role: user.role,
          initials: user.username.substring(0, 2).toUpperCase()
        });
        localStorage.setItem('alfa_authenticated', 'true');
        navigate('/');
      } else {
        setError('Invalid username or password. Please try again.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Background with Blur/Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-50 bg-cover bg-center"
        style={{ backgroundImage: `url('file:///C:/Users/62815/.gemini/antigravity/brain/8b19cfe4-9dfd-4a2e-bdb0-f504570bdbdf/login_background_construction_1777703593191.png')` }}
      ></div>
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary/40 to-slate-900/80"></div>

      {/* Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] z-0 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] z-0"></div>

      {/* Login Card */}
      <div className="relative z-20 w-full max-w-[420px] mx-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="text-center mb-10 flex flex-col items-center">
            <img src="/proman-logo.png" alt="PROMAN" className="w-48 h-auto object-contain mb-4 mix-blend-screen opacity-90 brightness-0 invert" />
            <p className="text-white/60 font-medium">Enterprise Construction Management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-1">Account Identifier</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">person</span>
                <input 
                  type="text" 
                  name="username"
                  value={credentials.username}
                  onChange={handleChange}
                  placeholder="Username or Email"
                  className="w-full bg-white/5 border border-white/10 text-white pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-primary/50 focus:bg-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-white/20 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-1">Access Key</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">lock</span>
                <input 
                  type="password" 
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-primary/50 focus:bg-white/10 focus:border-primary/50 outline-none transition-all placeholder:text-white/20 font-medium"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 animate-shake">
                <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                <p className="text-red-200 text-xs font-bold">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                <>
                  Enter Dashboard
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center space-y-4">
            <a href="#" className="text-white/40 hover:text-white text-xs font-bold transition-colors">Forgot your password?</a>
            <div className="pt-4 border-t border-white/10">
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-black">&copy; 2026 Project Alfa Systems</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
