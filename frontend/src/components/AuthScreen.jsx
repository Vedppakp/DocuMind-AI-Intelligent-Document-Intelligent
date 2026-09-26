import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  FileText,
  Bot,
  KeyRound,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDocument } from '../context/DocumentContext';

export default function AuthScreen() {
  const { login, register, forgotPassword, resetPassword } = useAuth();
  const { showToast } = useDocument();

  // 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Password reset state
  const [resetStep, setResetStep] = useState(1); // 1 = request code, 2 = enter code & reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.success) {
          showToast(`Welcome back, ${res.user.name || res.user.email}! Workspace unlocked.`, 'success');
        }
      } else if (mode === 'register') {
        const res = await register(name, email, password);
        if (res.success) {
          showToast(`Account registered successfully! Welcome, ${res.user.name || res.user.email}!`, 'success');
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Authentication failed. Please verify your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const targetEmail = forgotEmail.trim() || email.trim();
      if (!targetEmail) {
        setError('Please enter your registered email address.');
        setLoading(false);
        return;
      }

      const res = await forgotPassword(targetEmail);
      if (res.success) {
        setForgotEmail(targetEmail);
        setResetStep(2);
        setSuccessMessage(res.message);
        if (res.devCode) {
          setDevCode(res.devCode);
        }
        showToast(res.message, 'info');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Could not send verification code. Please check your email address.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your new password.');
      setLoading(false);
      return;
    }

    try {
      const res = await resetPassword(forgotEmail, verificationCode.trim(), newPassword);
      if (res.success) {
        showToast('Password changed successfully! Workspace unlocked.', 'success');
        // Token received & auto-logged in via AuthContext
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Invalid or expired verification code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient glowing gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Auth Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-brand-600/30 ring-1 ring-white/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-[11px] font-semibold tracking-wide uppercase mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              <span>Registered User Access Only</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">DocuMind AI</h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Sign in with your registered email account to access your workspace, documents, and chat history.
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 sm:p-7 backdrop-blur-xl space-y-5">
          {mode !== 'forgot' ? (
            <>
              {/* Method Tabs: Sign In / Create Account */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'login'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'register'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Access Note */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                <span>
                  {mode === 'login'
                    ? 'Only registered users can access DocuMind AI. Enter your registered email and password to continue.'
                    : 'Register your email account below to create a secure personal workspace.'}
                </span>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Sign In / Register Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ved Prakash"
                        autoComplete="name"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 outline-none focus:border-brand-500 text-xs transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 outline-none focus:border-brand-500 text-xs transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium">Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setResetStep(1);
                          setForgotEmail(email);
                          setError('');
                          setSuccessMessage('');
                          setDevCode(null);
                        }}
                        className="text-[11px] text-brand-400 hover:text-brand-300 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 outline-none focus:border-brand-500 text-xs transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create Account & Access Tools'}</span>
                </button>

                {/* Toggle Mode Link */}
                <div className="pt-2 text-center text-xs text-slate-400">
                  {mode === 'login' ? (
                    <span>
                      Don't have a registered account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setError('');
                        }}
                        className="text-brand-400 hover:underline font-semibold"
                      >
                        Create Account
                      </button>
                    </span>
                  ) : (
                    <span>
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError('');
                        }}
                        className="text-brand-400 hover:underline font-semibold"
                      >
                        Sign In
                      </button>
                    </span>
                  )}
                </div>
              </form>
            </>
          ) : (
            /* Forgot / Reset Password Flow */
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center border border-brand-500/30">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Reset Password</h3>
                  <p className="text-[11px] text-slate-400">
                    {resetStep === 1
                      ? 'Receive a 6-digit verification code on your registered email.'
                      : `Enter the code sent to ${forgotEmail} and your new password.`}
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Info Banner */}
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Dev / Testing Code Helper Banner */}
              {devCode && resetStep === 2 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                  <span>
                    Verification Code:{' '}
                    <strong className="font-mono text-sm tracking-widest text-white px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
                      {devCode}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(devCode)}
                    className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-semibold transition-colors"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {resetStep === 1 ? (
                /* Step 1: Request Code */
                <form onSubmit={handleRequestCode} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Registered Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="your.registered@email.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 outline-none focus:border-brand-500 text-xs transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !forgotEmail.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all active:scale-98 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    <span>Send Verification Code</span>
                  </button>

                  <div className="pt-2 text-center text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError('');
                      }}
                      className="text-slate-400 hover:text-white font-medium"
                    >
                      ← Remember your password? <span className="text-brand-400 font-semibold underline">Back to Sign In</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Enter Code & New Password */
                <form onSubmit={handleResetSubmit} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-medium">6-Digit Verification Code</label>
                      <button
                        type="button"
                        onClick={handleRequestCode}
                        disabled={loading}
                        className="text-[10px] text-brand-400 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend Code</span>
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono tracking-widest text-sm outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 outline-none focus:border-brand-500 text-xs transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 outline-none focus:border-brand-500 text-xs transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6 || !newPassword || !confirmPassword}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all active:scale-98 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Verify Code & Reset Password</span>
                  </button>

                  <div className="pt-2 text-center text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError('');
                        setResetStep(1);
                      }}
                      className="text-slate-400 hover:text-white font-medium"
                    >
                      Cancel and <span className="text-brand-400 font-semibold underline">Back to Sign In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400">
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <Lock className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-1" />
            <span className="font-medium text-slate-300">User Isolated</span>
            <p className="text-[9px] text-slate-500 mt-0.5">Private storage</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <FileText className="w-3.5 h-3.5 text-brand-400 mx-auto mb-1" />
            <span className="font-medium text-slate-300">PDF Citations</span>
            <p className="text-[9px] text-slate-500 mt-0.5">Exact page jumps</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <Bot className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
            <span className="font-medium text-slate-300">Chat History</span>
            <p className="text-[9px] text-slate-500 mt-0.5">Saved to account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
