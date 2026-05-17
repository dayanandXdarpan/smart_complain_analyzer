import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, BarChart3, FileText, Search, Send, Brain, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { BackgroundOrbs, BrandMark, PageShell, SurfaceCard } from '../components/layout';

export function Home() {
  const navigate = useNavigate();

  return (
    <PageShell className="animated-mesh-bg flex flex-col font-body-md">
      <BackgroundOrbs
        orbs={[
          { className: 'w-[500px] h-[500px] bg-primary/[0.03] -top-[150px] -left-[150px]' },
          { className: 'w-[400px] h-[400px] bg-secondary/[0.04] -bottom-[100px] -right-[100px]', style: { animationDelay: '5s' } },
          { className: 'w-[300px] h-[300px] bg-outline/[0.03] top-[40%] left-[60%]', style: { animationDelay: '10s' } },
        ]}
      />

      {/* Header */}
      <header className="relative z-10 flex h-20 w-full items-center justify-between sticky top-0 glass-panel px-6 sm:px-8">
        <BrandMark />
        <nav className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/track')}
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-surface-container"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Track Ticket</span>
          </button>
          <button
            onClick={() => navigate('/admin/login')}
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors px-3 py-2 rounded-lg hover:bg-surface-container"
          >
            Admin
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="page-container page-container--wide relative z-10 flex flex-1 flex-col items-center justify-center py-16 text-center sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-4xl space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 border border-indigo-500/20 font-label-sm text-xs text-indigo-700"
          >
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full pulsating-dot" />
            <span>AI-Powered Routing Engine — Built with LangGraph</span>
          </motion.div>

          <h1 className="text-headline-xl font-headline-xl tracking-tighter text-on-surface leading-[1.05] md:text-[64px] md:leading-[1.05] max-w-4xl mx-auto">
            Resolve issues <br className="hidden md:block"/>
            <span className="gradient-text">at the speed of thought.</span>
          </h1>

          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            ComplainHUB uses advanced LangGraph agents to automatically categorize, prioritize, and route grievances to the right department—eliminating administrative bottlenecks.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/submit')}
              className="bg-primary text-on-primary py-3.5 px-7 font-label-sm text-label-sm rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-glass group"
            >
              Report an Issue
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/track')}
              className="glass-card text-on-surface py-3.5 px-7 font-label-sm text-label-sm rounded-lg hover:bg-white/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Track a Ticket
            </button>
          </div>
        </motion.div>

        {/* Stats banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-card mt-16 flex flex-wrap justify-center gap-6 rounded-2xl px-8 py-6 sm:gap-10 border-t-2 border-t-indigo-500/30"
        >
          <StatItem value="500+" label="Issues Resolved" />
          <div className="w-px bg-outline-variant hidden sm:block" />
          <StatItem value="95%" label="AI Accuracy" />
          <div className="w-px bg-outline-variant hidden sm:block" />
          <StatItem value="<2min" label="Avg. Response" />
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full mt-24"
        >
          <h2 className="text-headline-md font-headline-md text-on-surface mb-3 tracking-tight">How it Works</h2>
          <p className="text-body-md text-on-surface-variant mb-10 w-full max-w-[36rem] mx-auto">Three simple steps to get your issue resolved by the right team.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full">
            {[
              { step: '01', icon: Send, title: 'Submit', desc: 'Fill out a quick form with your issue details. No signup needed.' },
              { step: '02', icon: Brain, title: 'AI Analyzes', desc: 'Our LangGraph agents classify, prioritize, and detect duplicates instantly.' },
              { step: '03', icon: CheckCircle2, title: 'Resolved', desc: 'Your ticket is routed to the right department and tracked in real-time.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.15 }}
                className="glass-card rounded-2xl p-8 text-center relative overflow-hidden group flex flex-col items-center border border-outline-variant/50 hover:border-primary/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <span className="absolute -top-4 -right-2 text-[80px] font-black text-on-surface/[0.03] group-hover:text-primary/[0.05] group-hover:-translate-y-2 transition-all duration-500 select-none pointer-events-none">{item.step}</span>
                
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-surface-container to-surface-container-highest flex items-center justify-center text-on-surface mb-5 group-hover:from-indigo-500 group-hover:to-violet-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-500 relative z-10">
                  <item.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                
                <h3 className="font-headline-sm text-xl text-on-surface mb-2 relative z-10">{item.title}</h3>
                <p className="font-body-md text-on-surface-variant text-sm leading-relaxed relative z-10">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-20 w-full"
        >
          <FeatureCard
            icon={Zap}
            title="Zero-Friction"
            desc="No complicated signups. OTP-based deferred authentication means you report first, verify later."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="AI Triage"
            desc="Automatic priority scoring, sentiment analysis, and duplicate detection before it hits the queue."
          />
          <FeatureCard
            icon={BarChart3}
            title="Deep Analytics"
            desc="Identify trends and bottlenecks with real-time institutional metrics and word-frequency insights."
          />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-outline-variant/50 py-8 px-6 sm:px-8">
        <div className="page-container page-container--wide space-y-8">
          <div className="mx-auto max-w-[44rem] rounded-2xl border border-outline-variant/40 bg-surface-container/40 px-6 py-5 text-center shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Project Report</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-on-surface-variant">
              {`A Project Report
Submitted in Partial Fulfillment of the Requirements for the Award
of the Degree of
Bachelor of Technology
In
Computer Science & Engineering (IoT)
Submitted by
Dayanand
(Registration No. 22155135052)
Anshu Mala
(Registration No. 22155135013)
Neha Bharti
(Registration No. 22155135012)
Sakshi Sinha
(Registration No. 22155135009)
Under the supervision of
Prof. Manoj Kumar sah
(Assistant Professor)`}
            </p>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-on-surface-variant text-sm">
              <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                <FileText className="text-on-primary w-3 h-3" />
              </div>
              <span className="font-medium text-on-surface">ComplainHUB</span>
              <span className="text-outline">·</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-on-surface-variant">
              <button onClick={() => navigate('/submit')} className="hover:text-on-surface transition-colors flex items-center gap-1">
                Report Issue <ArrowUpRight className="w-3 h-3" />
              </button>
              <button onClick={() => navigate('/track')} className="hover:text-on-surface transition-colors flex items-center gap-1">
                Track Ticket <ArrowUpRight className="w-3 h-3" />
              </button>
              <button onClick={() => navigate('/admin/login')} className="hover:text-on-surface transition-colors flex items-center gap-1">
                Admin Portal <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </PageShell>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold tracking-tight text-on-surface">{value}</p>
      <p className="text-xs text-on-surface-variant font-medium mt-0.5">{label}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <SurfaceCard className="surface-card-hover rounded-xl p-6 text-left flex flex-col gap-2 group">
      <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-surface-container to-surface-container-highest flex items-center justify-center text-on-surface mb-1 group-hover:from-indigo-500 group-hover:to-violet-500 group-hover:text-white group-hover:shadow-indigo-500/20 group-hover:shadow-lg transition-all duration-300">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <h3 className="font-headline-sm text-lg text-on-surface">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed">{desc}</p>
    </SurfaceCard>
  );
}
