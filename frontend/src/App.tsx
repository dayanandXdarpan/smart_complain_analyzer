import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { SubmitComplaint } from './pages/SubmitComplaint';
import { OTPVerification } from './pages/OTPVerification';
import { TrackingDashboard } from './pages/TrackingDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { TicketLookup } from './pages/TicketLookup';
import { WorkflowBuilder } from './pages/WorkflowBuilder';
import { Toaster } from 'sonner';
import { BackgroundOrbs, PageShell } from './components/layout';

function PublicFlow() {
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ title: string; email: string; category: string } | null>(null);

  return (
    <PageShell className="flex w-full bg-background text-on-surface">
      <BackgroundOrbs
        orbs={[
          { className: 'w-100 h-100 -top-25 -left-25 bg-primary/5' },
          { className: 'w-75 h-75 -bottom-20 -right-20 bg-secondary/5', style: { animationDelay: '4s' } },
        ]}
      />

      {/* Background context container for when modal is open */}
      <div className={`flex-1 flex flex-col relative transition-all duration-500 w-full ${!ticketId || isVerified ? '' : 'opacity-30 filter blur-sm pointer-events-none'}`}>
        <main className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8">
          {!ticketId ? (
            <SubmitComplaint onSubmitted={(id, data) => {
              setTicketId(id);
              setSubmittedData(data);
            }} />
          ) : isVerified ? (
            <TrackingDashboard ticketId={ticketId} submittedData={submittedData} />
          ) : (
            <div className="hidden">Background for OTP</div>
          )}
        </main>
      </div>

      {/* Overlay Modal for OTP */}
      {ticketId && !isVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/50 backdrop-blur-md p-4">
          <OTPVerification ticketId={ticketId} onVerified={() => setIsVerified(true)} />
        </div>
      )}
    </PageShell>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/submit" element={<PublicFlow />} />
        <Route path="/track" element={<TicketLookup />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/workflows" element={<WorkflowBuilder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        theme="light"
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(197,198,201,0.5)',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          },
        }}
      />
    </Router>
  );
}

export default App;
