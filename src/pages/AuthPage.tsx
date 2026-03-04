import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  Eye, EyeOff, AlertTriangle, Mail, CheckCircle,
  Clock, RefreshCw, Info, X, ExternalLink, Copy,
  Shield, Smartphone, Monitor, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../assets/logo.svg';

type Screen = 'auth' | 'confirm' | 'rate_limited' | 'webview_error' | 'google_setup_error';

// ── Particles ─────────────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  size: (i % 4) * 1.5 + 2,
  left: (i * 17 + 5) % 100,
  delay: (i * 0.9) % 10,
  dur: (i % 4) * 2 + 6,
  color: ['rgba(99,102,241,0.5)','rgba(168,85,247,0.4)','rgba(236,72,153,0.3)','rgba(16,185,129,0.3)'][i % 4],
}));

function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLES.map(p => (
        <div key={p.id} className="particle" style={{
          width: p.size, height: p.size,
          left: `${p.left}%`, bottom: '-10px',
          backgroundColor: p.color,
          animationDuration: `${p.dur}s`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}

// ── Copy block ────────────────────────────────────────────────────────────────
function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative mt-2">
      <pre className="bg-black/40 text-green-400 p-3 rounded-xl text-xs overflow-x-auto font-mono whitespace-pre leading-relaxed">{code}</pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-2 right-2 bg-white/10 hover:bg-white/25 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-all"
      >
        <Copy className="w-3 h-3" />{copied ? '✓ Copied!' : 'Copy'}
      </button>
    </div>
  );
}

// ── Admin Help Modal ──────────────────────────────────────────────────────────
function AdminHelpModal({ onClose }: { onClose: () => void }) {
  const steps = [
    { step: 1, color: 'bg-blue-500',   title: 'Set up Supabase & Run SQL Schema',   desc: 'Create a Supabase project and run the full database SQL from the Admin Panel → Database SQL.' },
    { step: 2, color: 'bg-green-500',  title: 'Register a Normal Account First',    desc: "Sign up using your email or Google. You'll start as a regular user — that's expected." },
    { step: 3, color: 'bg-purple-500', title: 'Promote Yourself to Admin via SQL',  desc: 'Go to Supabase → SQL Editor → New Query → paste and run:', code: "UPDATE public.profiles\nSET role = 'admin'\nWHERE email = 'your-email@example.com';" },
    { step: 4, color: 'bg-amber-500',  title: 'Sign Out & Sign Back In',            desc: "Sign out from SpendWise then sign back in. You'll be routed to the Admin Dashboard automatically." },
    { step: 5, color: 'bg-pink-500',   title: 'Used Google to sign up?',            desc: 'Find your exact email in Supabase → Authentication → Users. Use that email in the SQL above.' },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" /> How to Access Admin Dashboard
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          {steps.map(({ step, color, title, desc, code }) => (
            <div key={step} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5 shadow-lg`}>{step}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm mb-1">{title}</p>
                  <p className="text-white/60 text-xs leading-relaxed">{desc}</p>
                  {code && <CopyBlock code={code} />}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg"
        >
          Got it! 🎉
        </button>
      </div>
    </div>
  );
}

// ── WebView Error ─────────────────────────────────────────────────────────────
function WebViewErrorScreen({ onBack, currentUrl }: { onBack: () => void; currentUrl: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4 relative overflow-hidden">
      <Particles />
      <div className="w-full max-w-md z-10 animate-slide-up">
        <div className="glass border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-orange-500/20 border-2 border-orange-400/40 rounded-full flex items-center justify-center mx-auto mb-5 animate-wiggle">
            <Smartphone className="w-8 h-8 text-orange-300" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Open in a Real Browser</h2>
          <p className="text-white/60 mb-6 text-sm leading-relaxed">Google blocks sign-in from in-app browsers. Open in <strong className="text-white">Chrome</strong> or <strong className="text-white">Safari</strong>.</p>
          <div className="space-y-3 text-left mb-6">
            <div className="border rounded-2xl p-4 bg-blue-500/20 border-blue-400/30">
              <p className="font-bold text-sm mb-2 text-blue-300 flex items-center gap-2"><Monitor className="w-4 h-4" />On Android</p>
              <ol className="text-white/60 text-xs space-y-1.5 list-decimal list-inside">
                <li>Tap ⋮ three-dot menu at top right</li>
                <li>Tap "Open in Chrome" or "Open in Browser"</li>
                <li>Try Google Sign-In again</li>
              </ol>
            </div>
            <div className="border rounded-2xl p-4 bg-purple-500/20 border-purple-400/30">
              <p className="font-bold text-sm mb-2 text-purple-300 flex items-center gap-2"><Monitor className="w-4 h-4" />On iPhone / iPad</p>
              <ol className="text-white/60 text-xs space-y-1.5 list-decimal list-inside">
                <li>Tap Share icon (box with arrow) at bottom</li>
                <li>Tap "Open in Safari"</li>
                <li>Try Google Sign-In again</li>
              </ol>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
              <p className="text-white/80 font-bold text-sm mb-2">Or copy & paste the URL:</p>
              <div className="bg-black/30 rounded-xl p-2.5 flex items-center gap-2">
                <p className="text-green-400 text-xs font-mono flex-1 truncate">{currentUrl}</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(currentUrl).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-all flex-shrink-0"
                >
                  <Copy className="w-3 h-3" />{copied ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onBack} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-all">
              <RefreshCw className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(currentUrl).catch(() => {}); setCopied(true); }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Copy URL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Google Setup Error ────────────────────────────────────────────────────────
function GoogleSetupErrorScreen({ onBack, errorMsg }: { onBack: () => void; errorMsg: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4 relative overflow-hidden">
      <Particles />
      <div className="w-full max-w-lg z-10 animate-slide-up">
        <div className="glass border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-500/20 border-2 border-red-400/40 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle className="w-8 h-8 text-red-300" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Google Sign-In Not Configured</h2>
            <p className="text-white/50 text-xs font-mono bg-black/30 rounded-lg px-3 py-1.5 inline-block">{errorMsg}</p>
          </div>
          <div className="space-y-3 mb-6">
            {[
              { title: 'Step 1 — Google Cloud Console', color: 'bg-blue-500/20 border-blue-400/30', tc: 'text-blue-300', steps: ['Go to console.cloud.google.com','Create/select a project','APIs & Services → OAuth consent screen → External','APIs & Services → Credentials → OAuth Client ID → Web app','Add Authorized redirect URI:'], code: 'https://YOUR-PROJECT.supabase.co/auth/v1/callback' },
              { title: 'Step 2 — Enable in Supabase',   color: 'bg-green-500/20 border-green-400/30', tc: 'text-green-300', steps: ['Go to supabase.com → your project','Authentication → Providers → Google','Toggle ON "Enable Google provider"','Paste Client ID & Secret → Save'] },
              { title: 'Step 3 — Add Redirect URLs',    color: 'bg-purple-500/20 border-purple-400/30', tc: 'text-purple-300', steps: ['Supabase → Authentication → URL Configuration','Site URL: http://localhost:5173','Redirect URLs — add both:'], code: 'http://localhost:5173\nhttps://your-app.vercel.app' },
            ].map(({ title, color, tc, steps, code }, i) => (
              <div key={i} className={`border rounded-2xl p-4 ${color}`}>
                <p className={`font-bold text-sm mb-2 ${tc}`}>{title}</p>
                <ol className="text-white/60 text-xs space-y-1 list-decimal list-inside">{steps.map((s, j) => <li key={j}>{s}</li>)}</ol>
                {code && <CopyBlock code={code} />}
              </div>
            ))}
          </div>
          <button onClick={onBack} className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-all">
            <RefreshCw className="w-4 h-4" /> Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Rate Limited ──────────────────────────────────────────────────────────────
function RateLimitedScreen({ onBack, onGoogle }: { onBack: () => void; onGoogle: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4 relative overflow-hidden">
      <Particles />
      <div className="w-full max-w-lg z-10 animate-slide-up">
        <div className="glass border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-400/40 rounded-full flex items-center justify-center mx-auto mb-5 animate-spin-slow">
            <Clock className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Rate Limit Reached</h2>
          <p className="text-white/60 mb-6 text-sm leading-relaxed">Supabase's free tier limits confirmation emails per hour.</p>
          <div className="space-y-3 text-left mb-6">
            {[
              { color: 'bg-green-500/20 border-green-400/30', tc: 'text-green-300', title: '⭐ Best Fix — Disable Email Confirmation', steps: ['Go to supabase.com → your project','Authentication → Providers → Email','Toggle OFF "Confirm email"','Save → sign up again ✅'] },
              { color: 'bg-blue-500/20 border-blue-400/30',   tc: 'text-blue-300',  title: '🔑 Use Google Login Instead',           steps: ['Click "Continue with Google" below','Never rate limited, no email needed'] },
              { color: 'bg-white/10 border-white/20',         tc: 'text-white/80',  title: '⏳ Wait ~1 Hour',                       steps: ['Supabase resets the email limit hourly'] },
            ].map(({ color, tc, title, steps }, i) => (
              <div key={i} className={`border rounded-2xl p-4 ${color}`}>
                <p className={`font-bold text-sm mb-1 ${tc}`}>{title}</p>
                <ul className="text-white/60 text-xs space-y-0.5 list-disc list-inside">{steps.map((s, j) => <li key={j}>{s}</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onBack} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-all">
              <RefreshCw className="w-4 h-4" /> Back
            </button>
            <button onClick={onGoogle} className="flex-1 bg-white text-gray-800 py-3 rounded-xl font-semibold transition-all hover:bg-gray-100 flex items-center justify-center gap-2 shadow-lg">
              <GoogleIcon /> Try Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Email ─────────────────────────────────────────────────────────────
function ConfirmEmailScreen({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4 relative overflow-hidden">
      <Particles />
      <div className="w-full max-w-md text-center z-10 animate-slide-up">
        <div className="glass border border-white/20 rounded-3xl p-10 shadow-2xl">
          <div className="w-16 h-16 bg-green-500/20 border-2 border-green-400/40 rounded-full flex items-center justify-center mx-auto mb-5 animate-float">
            <Mail className="w-8 h-8 text-green-300" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email!</h2>
          <p className="text-white/60 mb-1 text-sm">We sent a confirmation link to</p>
          <p className="text-white font-bold text-base mb-6 break-all">{email}</p>
          <div className="bg-white/10 rounded-2xl p-4 mb-5 text-left space-y-2">
            {['Click the link in the email to confirm your account','Then come back here and sign in',"Check spam/junk if you don't see it"].map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-white/70 text-sm">{t}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-500/20 border border-amber-400/30 rounded-2xl p-3 mb-5 text-left">
            <p className="text-amber-300 text-xs font-semibold mb-1">💡 Skip Email Confirmation Entirely</p>
            <p className="text-amber-200 text-xs">Supabase → <strong>Authentication → Providers → Email</strong> → disable <strong>"Confirm email"</strong>.</p>
          </div>
          <button onClick={onBack} className="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-semibold transition-all">
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Google Icon ───────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ── Main Auth Page ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [mode,          setMode]          = useState<'signin'|'signup'>('signin');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [fullName,      setFullName]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [screen,        setScreen]        = useState<Screen>('auth');
  const [showAdminHelp, setShowAdminHelp] = useState(false);
  const [googleError,   setGoogleError]   = useState('');
  const [currentUrl,    setCurrentUrl]    = useState('');

  const { signIn, signUp, signInWithGoogle } = useAuth();

  useEffect(() => { setCurrentUrl(window.location.href); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) { toast.error('Supabase is not connected. Add environment variables first.'); return; }
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error, notConfirmed } = await signIn(email, password);
        if (notConfirmed) {
          toast.error('Please confirm your email first. Check your inbox.', { duration: 8000 });
        } else if (error) {
          const msg = (error.message || '').toLowerCase();
          if (msg.includes('rate limit') || msg.includes('too many')) {
            setScreen('rate_limited');
          } else if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('wrong password')) {
            toast.error('Incorrect email or password. Please try again.');
          } else {
            toast.error(error.message);
          }
        }
      } else {
        if (!fullName.trim())     { toast.error('Please enter your full name.'); setSubmitting(false); return; }
        if (password.length < 6)  { toast.error('Password must be at least 6 characters.'); setSubmitting(false); return; }
        const { error, needsConfirmation, rateLimited, alreadyExists } = await signUp(email, password, fullName);
        if (rateLimited) {
          setScreen('rate_limited');
        } else if (alreadyExists) {
          toast.error('This email is already registered. Switching to Sign In…');
          setMode('signin');
        } else if (error) {
          const msg = (error.message || '').toLowerCase();
          if (msg.includes('rate limit') || msg.includes('too many')) setScreen('rate_limited');
          else toast.error(error.message);
        } else if (needsConfirmation) {
          setScreen('confirm');
        } else {
          toast.success('Account created! Welcome to SpendWise! 🎉');
        }
      }
    } catch { toast.error('Something went wrong. Please try again.'); }
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    if (!isSupabaseConfigured) { toast.error('Supabase is not connected. Add environment variables first.'); return; }
    setGoogleLoading(true);
    try {
      const { error, webViewDetected } = await signInWithGoogle();
      if (webViewDetected) { setScreen('webview_error'); setGoogleLoading(false); return; }
      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('disallowed_useragent') || msg.includes('403')) {
          setScreen('webview_error'); setGoogleLoading(false); return;
        }
        if (msg.includes('provider') || msg.includes('oauth') || msg.includes('not configured') || msg.includes('unsupported')) {
          setGoogleError(error.message); setScreen('google_setup_error'); setGoogleLoading(false); return;
        }
        toast.error('Google sign-in failed: ' + error.message);
        setGoogleLoading(false);
      }
      // On success, Supabase redirects to Google — googleLoading stays true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  // Screen routing
  if (screen === 'webview_error')      return <WebViewErrorScreen onBack={() => setScreen('auth')} currentUrl={currentUrl} />;
  if (screen === 'google_setup_error') return <GoogleSetupErrorScreen onBack={() => setScreen('auth')} errorMsg={googleError} />;
  if (screen === 'rate_limited')       return <RateLimitedScreen onBack={() => setScreen('auth')} onGoogle={() => { setScreen('auth'); handleGoogle(); }} />;
  if (screen === 'confirm')            return <ConfirmEmailScreen email={email} onBack={() => { setScreen('auth'); setMode('signin'); }} />;

  return (
    <>
      {showAdminHelp && <AdminHelpModal onClose={() => setShowAdminHelp(false)} />}

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-3/4 left-1/4 w-60 h-60 bg-pink-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <Particles />

        {/* Grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.5) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="w-full max-w-md z-10">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in-down">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-4 shadow-2xl animate-float" style={{ filter: 'drop-shadow(0 0 24px rgba(99,102,241,0.7))' }}>
              <img src={logo} alt="SpendWise" className="w-24 h-24" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Spend<span className="gradient-text">Wise</span>
            </h1>
            <p className="text-white/40 mt-1 text-sm flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Smart Expense Tracking
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </p>
          </div>

          {/* Supabase warning */}
          {!isSupabaseConfigured && (
            <div className="bg-amber-500/20 border border-amber-400/40 rounded-2xl p-4 mb-4 flex gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                <strong className="block text-amber-300 mb-0.5">Supabase Not Connected</strong>
                Add <code className="bg-black/20 px-1 rounded text-xs">VITE_SUPABASE_URL</code> and <code className="bg-black/20 px-1 rounded text-xs">VITE_SUPABASE_ANON_KEY</code> to your <code className="bg-black/20 px-1 rounded text-xs">.env</code> file.
              </div>
            </div>
          )}

          {/* Main card */}
          <div className="glass border border-white/20 rounded-3xl p-8 shadow-2xl animate-fade-in-up">
            {/* Mode tabs */}
            <div className="flex bg-white/10 rounded-xl p-1 mb-6 relative">
              <div
                className="absolute inset-1 rounded-lg bg-white shadow-sm transition-transform duration-300"
                style={{ width: 'calc(50% - 4px)', transform: `translateX(${mode === 'signin' ? '0%' : '100%'})` }}
              />
              {(['signin','signup'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors relative z-10 ${mode === m ? 'text-indigo-900' : 'text-white/60 hover:text-white'}`}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={submitting || googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 py-3.5 rounded-xl font-medium hover:bg-gray-50 active:scale-95 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed mb-5 hover:shadow-lg"
            >
              {googleLoading ? (
                <><RefreshCw className="w-5 h-5 animate-spin text-gray-500" /><span>Redirecting to Google…</span></>
              ) : (
                <><GoogleIcon /><span>Continue with Google</span></>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/30 text-xs">or continue with email</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="animate-fade-in">
                  <label className="block text-white/70 text-sm font-medium mb-1.5">Full Name</label>
                  <input
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Juan dela Cruz" autoComplete="name"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-white/70 text-sm font-medium mb-1.5">Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" autoComplete="email"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    required minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signup' && <p className="text-white/30 text-xs mt-1.5">Minimum 6 characters</p>}
              </div>

              <button
                type="submit"
                disabled={submitting || googleLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1 active:scale-95 hover:shadow-indigo-500/40 hover:shadow-xl"
              >
                {submitting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" />{mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Switch mode */}
            <p className="text-center text-white/40 text-sm mt-5">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-indigo-300 hover:text-white font-semibold transition-colors underline underline-offset-2"
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          {/* Admin help */}
          <button
            onClick={() => setShowAdminHelp(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 text-white/25 hover:text-white/50 text-xs transition-colors py-2"
          >
            <Info className="w-3.5 h-3.5" /> How to access the Admin Dashboard?
          </button>

          <p className="text-center text-white/15 text-xs mt-1">
            SpendWise © 2025 · Secured by Supabase
          </p>
        </div>
      </div>
    </>
  );
}
