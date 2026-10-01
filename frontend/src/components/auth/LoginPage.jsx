import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Bot, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  ArrowRight
} from 'lucide-react';

/**
 * Layer 2: Dedicated 3D Background Scene
 * Isolates 3D perspective and transforms to background decorative objects only,
 * preventing any font/border rasterization blur on the actual login form.
 */
function Background3DScene({ parallax }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 perspective-1000">
      {/* Floating 3D Geometric Wireframe 1 (Top-Right) */}
      <div 
        className="absolute top-20 right-20 lg:right-32 w-28 h-28 hidden sm:block animate-float-1"
        style={{
          transform: `translate3d(${parallax.x * 0.8}px, ${parallax.y * 0.8}px, 0)`,
        }}
      >
        <div className="w-full h-full relative rounded-2xl border border-indigo-500/25 bg-indigo-950/10 shadow-[0_0_15px_rgba(99,102,241,0.08)] transform rotate-12">
          <div className="absolute inset-2.5 rounded-xl border border-cyan-400/20 transform -rotate-6" />
        </div>
      </div>

      {/* Floating 3D Geometric Ring 2 (Bottom-Left) */}
      <div 
        className="absolute bottom-20 left-16 lg:left-28 w-32 h-32 hidden sm:block animate-float-2"
        style={{
          transform: `translate3d(${parallax.x * -0.6}px, ${parallax.y * -0.6}px, 0)`,
        }}
      >
        <div className="w-full h-full rounded-full border border-dashed border-cyan-500/20 flex items-center justify-center transform rotate-45">
          <div className="w-20 h-20 rounded-full border border-indigo-400/20" />
        </div>
      </div>

      {/* Minimal subtle ambient depth lighting nodes (Max 4px blur per specification) */}
      <div 
        className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-cyan-400/40 blur-[3px]"
        style={{ transform: `translate3d(${parallax.x * 0.4}px, ${parallax.y * 0.4}px, 0)` }}
      />
      <div 
        className="absolute bottom-1/3 right-1/3 w-4 h-4 rounded-full bg-indigo-500/30 blur-[4px]"
        style={{ transform: `translate3d(${parallax.x * -0.5}px, ${parallax.y * -0.5}px, 0)` }}
      />
    </div>
  );
}

export function LoginPage() {
  const { isAuthenticated, login, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Background scene parallax (Isolated from the text form)
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;
      const xRatio = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const yRatio = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      setParallax({ x: xRatio * 20, y: yRatio * 20 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Destination after login
  const from = location.state?.from?.pathname || '/dashboard';

  // If already authenticated and done checking session, redirect to dashboard
  if (!isLoadingAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@example.com');
    setPassword('');
    setErrorMessage('');
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050811] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* =========================================================================
          LAYER 1: STATIC PAGE BACKGROUND (Clean Radial Gradients, Zero Blur)
         ========================================================================= */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(5,8,17,0))]" 
      />
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_120%,rgba(6,182,212,0.08),rgba(5,8,17,0))]" 
      />
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" 
      />

      {/* =========================================================================
          LAYER 2: 3D DECORATIVE SCENE (Separated to eliminate text blur)
         ========================================================================= */}
      <Background3DScene parallax={parallax} />

      {/* =========================================================================
          LAYER 3: CRISP 3D LOGIN UI (Zero blur, crisp text, sharp inputs & button)
         ========================================================================= */}
      <div className="relative z-10 w-full max-w-[420px]">
        {/* Crisp 3D Glass Form Surface */}
        <div className="glass-3d-card rounded-2xl p-7 sm:p-9">
          
          {/* Header Section */}
          <div className="text-center space-y-3 mb-7">
            
            {/* 3D Physical Brand Element: Metallic/Glass AI Prism with crisp shadow */}
            <div className="inline-flex items-center justify-center mb-1">
              <div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/40 via-slate-900 to-cyan-500/30 border border-indigo-400/50 p-[1px] shadow-[0_4px_12px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] animate-spin-3d"
                title="AI Email Assistant Engine"
              >
                <div className="w-full h-full bg-[#080d1a] rounded-[11px] flex items-center justify-center">
                  <Bot className="w-6 h-6 text-cyan-300 drop-shadow-[0_1px_3px_rgba(6,182,212,0.8)]" />
                </div>
              </div>
            </div>

            {/* Heading: "Welcome Back" (Sharp, high contrast, zero blur) */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              Welcome Back
            </h1>

            {/* Subtitle: "Sign in to your HR automation workspace." */}
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Sign in to your HR automation workspace.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            
            {/* Field: EMAIL */}
            <div className="space-y-1.5">
              <label 
                htmlFor="admin-email" 
                className="block text-[11px] font-bold text-slate-300 tracking-wider uppercase"
              >
                EMAIL
              </label>
              <div className="relative input-recessed-3d rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Field: PASSWORD */}
            <div className="space-y-1.5">
              <label 
                htmlFor="admin-password" 
                className="block text-[11px] font-bold text-slate-300 tracking-wider uppercase"
              >
                PASSWORD
              </label>
              <div className="relative input-recessed-3d rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400 hover:text-white" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400 hover:text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Primary Button: "Sign In →" (Crisp 3D tactile button) */}
            <div className="pt-2">
              <button
                id="login-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="btn-3d-physical w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Error Message for Invalid Credentials (Crisp, No alert()) */}
            {errorMessage && (
              <div 
                id="login-error-message"
                className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 flex items-start gap-2.5 text-xs shadow-sm"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">
                  {errorMessage}
                </div>
              </div>
            )}
          </form>

          {/* Footer Area: Security Section & Credential Helper */}
          <div className="mt-7 pt-5 border-t border-slate-800/80 flex flex-col items-center gap-3">
            
            {/* Security Section: "Secure Admin Access" */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center border border-emerald-400/40">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-slate-300">Secure Admin Access</span>
            </div>

            {/* Admin Credential Helper: Floating 3D Utility Pill */}
            <div className="badge-3d-floating flex items-center gap-2 text-[11px] text-slate-400 px-3.5 py-1.5 rounded-lg">
              <span>Admin: <strong className="text-slate-200 font-mono">admin@example.com</strong></span>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
              >
                Fill Credentials
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;
