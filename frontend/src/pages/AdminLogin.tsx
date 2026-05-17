import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, BarChart3, Zap, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { BackgroundOrbs, BrandMark, PageShell, SurfaceCard } from '../components/layout';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter email and password'); setError(true); setTimeout(() => setError(false), 600); return; }
    setLoading(true); setError(false);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    toast.success('Successfully logged in');
    navigate('/admin');
  };

  return (
    <PageShell className="grid lg:grid-cols-2 font-body-md bg-background text-on-surface">
      <BackgroundOrbs
        orbs={[
          { className: 'w-[400px] h-[400px] bg-primary/[0.03] -top-[100px] -right-[100px]' },
          { className: 'w-[300px] h-[300px] bg-secondary/[0.04] -bottom-[50px] -left-[50px]', style: { animationDelay: '6s' } },
        ]}
      />
      {/* Left Panel */}
      <div className="hidden lg:flex animated-mesh-bg relative flex-col justify-between p-12 border-r border-outline-variant overflow-hidden">
        <BrandMark className="relative z-10" />
        <div className="space-y-6 max-w-[36rem] relative z-10">
          <h1 className="text-[44px] font-bold tracking-tighter text-on-surface leading-[1.1]">Institutional<br/>Governance Platform</h1>
          <p className="text-body-lg text-on-surface-variant leading-relaxed">Access the command center to review, triage, and route institutional grievances using AI-powered workflows.</p>
          <div className="pt-6 space-y-4">
            {[
              { icon: ShieldCheck, text: 'Secure Role-Based Access' },
              { icon: Zap, text: 'Real-Time Queue Management' },
              { icon: BarChart3, text: 'Comprehensive Analytics' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-on-surface-variant">
                <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
                <span className="font-medium text-on-surface text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-on-surface-variant text-xs relative z-10">&copy; {new Date().getFullYear()} ComplainHUB Systems.</div>
      </div>

      {/* Right Panel */}
      <div className="flex items-center justify-center p-8 sm:p-12 bg-surface-container-lowest">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }} className="w-full max-w-[32rem]">
          <SurfaceCard className="flex flex-col gap-8 p-8 sm:p-10">
            <BrandMark className="lg:hidden" />
          <div>
            <h2 className="text-headline-lg font-headline-lg tracking-tighter text-on-surface mb-2">Welcome Back</h2>
            <p className="text-sm text-on-surface-variant">Sign in to the administration portal.</p>
          </div>
          <form onSubmit={handleLogin} className={`space-y-5 ${error ? 'animate-shake' : ''}`}>
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-2">Email Address</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(false); }} placeholder="admin@complainhub.edu"
                className={`w-full bg-white/60 border rounded-lg px-4 py-3 text-on-surface placeholder-outline transition-all ${error && !email ? 'border-error' : 'border-outline-variant hover:border-outline'}`} />
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(false); }} placeholder="••••••••"
                  className={`w-full bg-white/60 border rounded-lg px-4 py-3 pr-10 text-on-surface placeholder-outline transition-all ${error && !password ? 'border-error' : 'border-outline-variant hover:border-outline'}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-outline-variant text-primary accent-primary" />
                <span className="text-xs text-on-surface-variant">Remember me</span>
              </label>
              <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
            </div>
            <button type="submit" disabled={loading}
              className="primary-button w-full disabled:opacity-50 shadow-glass group">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
            </button>
          </form>
          <div className="text-center">
            <button onClick={() => navigate('/')} className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">← Back to User Portal</button>
          </div>
          </SurfaceCard>
        </motion.div>
      </div>
    </PageShell>
  );
}
