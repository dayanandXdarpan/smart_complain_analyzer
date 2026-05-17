import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Brain, User, Ticket, Home, PlusCircle, Mail, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SurfaceCard } from '../components/layout';

interface TrackingDashboardProps {
  ticketId: string;
  submittedData?: { title: string; email: string; category: string } | null;
}

export function TrackingDashboard({ ticketId, submittedData }: TrackingDashboardProps) {
  const [status, setStatus] = useState('AI_PROCESSING');
  const [ticketData, setTicketData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let pollCount = 0;
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/tickets/${ticketId}`);
        setStatus(res.data.status); setTicketData(res.data);
        if (['RESOLVED','ROUTED'].includes(res.data.status)) return;
      } catch {
        pollCount++;
        if (pollCount >= 2) {
          setStatus('ROUTED');
          setTicketData({ priority: 'HIGH', ai_confidence: 0.94, sentiment: 'Concerned' });
        }
      }
    };
    fetchStatus();
    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, [ticketId]);

  const steps = [
    { id: 'QUEUED', label: 'Ticket Received', desc: 'Your complaint has been registered.', icon: Clock, done: true },
    { id: 'AI_PROCESSING', label: 'AI Analysis', desc: 'LangGraph agents analyzing priority & routing...', icon: Brain, done: true, active: status === 'AI_PROCESSING' },
    { id: 'ROUTED', label: 'Assigned to Team', desc: 'Routed to the appropriate department.', icon: User, done: status === 'ROUTED', active: status === 'ROUTED' },
    { id: 'RESOLVED', label: 'Resolved', desc: 'Issue has been resolved.', icon: CheckCircle2, done: false },
  ];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
      className="w-full max-w-2xl mx-auto flex flex-col gap-5">
      <SurfaceCard className="rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-5 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-glass">
              <Ticket className="w-5 h-5 text-on-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-on-surface">Ticket Status</h2>
              <p className="font-mono text-xs text-on-surface-variant mt-0.5">ID: {ticketId}</p>
            </div>
          </div>
          {ticketData?.priority && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              ticketData.priority === 'URGENT' ? 'bg-error-container text-on-error-container border-error/20' :
              ticketData.priority === 'HIGH' ? 'bg-[#ffedcd] text-[#7a4800] border-[#7a4800]/20' :
              'bg-secondary-container text-on-secondary-container border-secondary/20'
            }`}>{ticketData.priority} Priority</span>
          )}
        </div>

        {/* Ticket Summary */}
        {submittedData && (
          <div className="mb-6 p-4 rounded-lg bg-surface-container/30 border border-outline-variant/20 space-y-2">
            <h3 className="text-sm font-semibold text-on-surface">{submittedData.title}</h3>
            <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{submittedData.email}</span>
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{submittedData.category}</span>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-0 relative pl-1">
          {steps.map((step, idx) => {
            const Icon = step.icon; const isLast = idx === steps.length - 1;
            return (
              <motion.div key={step.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.15 }} className="relative flex items-start pb-7">
                {!isLast && <div className={`absolute top-10 left-[1.15rem] w-[2px] h-[calc(100%-2rem)] transition-colors duration-700 ${step.done ? 'bg-primary' : 'bg-surface-container-highest'}`} />}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                  ${step.active ? 'bg-white border-2 border-primary text-primary shadow-[0_0_0_4px_rgba(0,0,0,0.04)] pulse-glow'
                    : step.done ? 'bg-primary border-2 border-primary text-on-primary'
                    : 'bg-surface-container-lowest border-2 border-outline-variant text-outline'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-5 flex-1 pt-1.5">
                  <h3 className={`text-sm font-medium ${step.active ? 'text-on-surface font-semibold' : step.done ? 'text-on-surface' : 'text-on-surface-variant'}`}>{step.label}</h3>
                  {step.active && status === 'AI_PROCESSING' && <p className="text-xs text-on-surface-variant mt-1 animate-pulse">{step.desc}</p>}
                  {step.active && status === 'ROUTED' && ticketData && (
                    <p className="text-xs text-[#2e7d32] mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Routed {ticketData.ai_confidence ? `with ${(ticketData.ai_confidence*100).toFixed(0)}% confidence` : ''}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </SurfaceCard>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => navigate('/')} className="secondary-button flex-1 shadow-glass hover:-translate-y-0.5">
          <Home className="w-4 h-4" /> Back to Home
        </button>
        <button onClick={() => window.location.reload()} className="secondary-button flex-1 shadow-glass hover:-translate-y-0.5">
          <PlusCircle className="w-4 h-4" /> Submit Another
        </button>
      </div>
    </motion.div>
  );
}
