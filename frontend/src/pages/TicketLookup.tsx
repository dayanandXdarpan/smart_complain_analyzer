import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, Clock, Brain, User, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { BackgroundOrbs, PageHeader, PageShell, SurfaceCard } from '../components/layout';

export function TicketLookup() {
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) { toast.error('Please enter a Ticket ID'); return; }
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/tickets/${ticketId.trim()}`);
      setResult(res.data);
    } catch {
      await new Promise(r => setTimeout(r, 800));
      const statuses = ['QUEUED', 'AI_PROCESSING', 'ROUTED', 'MANUAL_REVIEW'];
      const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      setResult({
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        ai_confidence: +(Math.random() * 0.4 + 0.6).toFixed(2),
      });
      toast.info('Showing demo result');
    } finally { setLoading(false); }
  };

  const allSteps = [
    { id: 'QUEUED', label: 'Ticket Received', icon: Clock },
    { id: 'AI_PROCESSING', label: 'AI Analysis', icon: Brain },
    { id: 'ROUTED', label: 'Assigned to Team', icon: User },
    { id: 'RESOLVED', label: 'Resolved', icon: CheckCircle2 },
  ];
  const statusOrder = ['QUEUED', 'AI_PROCESSING', 'ROUTED', 'RESOLVED'];
  const currentIdx = result ? statusOrder.indexOf(result.status === 'MANUAL_REVIEW' ? 'AI_PROCESSING' : result.status) : -1;

  return (
    <PageShell className="animated-mesh-bg flex flex-col font-body-md text-on-surface">
      <BackgroundOrbs
        orbs={[
          { className: 'w-[400px] h-[400px] bg-primary/[0.03] -top-[120px] -right-[120px]' },
          { className: 'w-[300px] h-[300px] bg-secondary/[0.04] -bottom-20 -left-20', style: { animationDelay: '5s' } },
        ]}
      />

      <main className="page-container flex flex-1 flex-col items-center justify-center py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full flex flex-col gap-6">
          <PageHeader
            showBrand
            backHref="/"
            title="Track Your Ticket"
            description="Enter your ticket ID to check the current status."
          />

          <SurfaceCard className="p-6 sm:p-8 relative overflow-hidden group border border-outline-variant/50 hover:border-primary/20 transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-1 accent-gradient rounded-t-[1.25rem]" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <form onSubmit={handleLookup} className="relative z-10 space-y-5">
              <div>
                <label className="block text-label-sm font-medium text-on-surface-variant mb-2">Ticket ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Ticket className="w-4 h-4 text-on-surface-variant/60" />
                  </div>
                  <input type="text" placeholder="e.g. demo-1234 or UUID" value={ticketId} onChange={e => setTicketId(e.target.value)}
                    className="w-full bg-white/70 border border-outline-variant/60 rounded-xl pl-11 pr-4 py-3.5 text-on-surface font-mono placeholder-outline transition-all hover:border-outline focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-sm" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="primary-button w-full disabled:opacity-50 shadow-glass">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Search className="w-4 h-4" /> Look Up</>}
              </button>
            </form>
          </SurfaceCard>

          {/* Result */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <SurfaceCard className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-on-surface-variant" />
                  <span className="font-mono text-sm text-on-surface-variant">{ticketId}</span>
                </div>
                {result.priority && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    result.priority === 'URGENT' ? 'bg-error-container text-on-error-container border-error/20' :
                    result.priority === 'HIGH' ? 'bg-[#ffedcd] text-[#7a4800] border-[#7a4800]/20' :
                    result.priority === 'MEDIUM' ? 'bg-secondary-container text-on-secondary-container border-secondary/20' :
                    'bg-surface-container text-on-surface-variant border-outline-variant'
                  }`}>{result.priority}</span>
                )}
              </div>
              <div className="space-y-0 pl-1">
                {allSteps.map((step, idx) => {
                  const Icon = step.icon; const isLast = idx === allSteps.length - 1;
                  const done = idx <= currentIdx; const active = idx === currentIdx;
                  return (
                    <div key={step.id} className="relative flex items-start pb-6">
                      {!isLast && <div className={`absolute top-9 left-[1.1rem] w-[2px] h-[calc(100%-1.5rem)] ${done ? 'bg-primary' : 'bg-surface-container-highest'}`} />}
                      <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all
                        ${active ? 'bg-white border-2 border-primary text-primary pulse-glow' : done ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest border-2 border-outline-variant text-outline'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="ml-4 pt-1.5">
                        <h3 className={`text-sm ${active ? 'font-semibold text-on-surface' : done ? 'text-on-surface' : 'text-on-surface-variant'}`}>{step.label}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>
              {result.ai_confidence && (
                <div className="flex items-center gap-3 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/30">
                  <span>AI Confidence:</span>
                  <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${result.ai_confidence*100}%` }} /></div>
                  <span className="font-semibold text-on-surface">{(result.ai_confidence*100).toFixed(0)}%</span>
                </div>
              )}
              </SurfaceCard>
            </motion.div>
          )}
        </motion.div>
      </main>
    </PageShell>
  );
}
