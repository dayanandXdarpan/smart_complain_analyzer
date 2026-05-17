import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, CheckCircle, Clock, Search, LogOut,
  LayoutDashboard, Settings, User, X, BarChart3, Menu, ArrowUpRight, Tag,
  GitBranch, Mail, ShieldCheck, ArrowUp
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminSettings } from './AdminSettings';
import { BrandMark, SurfaceCard } from '../components/layout';

const DEMO_TICKETS = [
  { id: '1a2b3c4d', title: 'Leaking pipe in CS building', description: 'There is a massive puddle forming in the hallway near room 101. It looks like the ceiling pipe is leaking.', submitter_email: 'student@college.edu', department_id: null, priority: 'HIGH', ai_confidence: 0.45, status: 'MANUAL_REVIEW', suggested_category: 'Maintenance', created_at: new Date(Date.now()-3600000*2).toISOString() },
  { id: '4d5e6f7g', title: 'WiFi down in Library', description: 'The eduroam network has been completely unavailable on the second floor of the library for the last two hours.', submitter_email: 'researcher@college.edu', department_id: 'dept-it', priority: 'URGENT', ai_confidence: 0.92, status: 'ROUTED', suggested_category: 'IT Support', created_at: new Date(Date.now()-3600000*5).toISOString() },
  { id: '7g8h9i0j', title: 'Projector broken in Lab 3', description: 'The HDMI cable is severed and the projector is making a weird buzzing noise.', submitter_email: 'prof.smith@college.edu', department_id: 'dept-it', priority: 'MEDIUM', ai_confidence: 0.88, status: 'ROUTED', suggested_category: 'IT Support', created_at: new Date(Date.now()-3600000*8).toISOString() },
  { id: 'a1b2c3d4', title: 'AC not working in Exam Hall', description: 'Temperature is unbearable during afternoon exams. Multiple students have complained.', submitter_email: 'examcell@college.edu', department_id: null, priority: 'URGENT', ai_confidence: 0.38, status: 'MANUAL_REVIEW', suggested_category: 'Maintenance', created_at: new Date(Date.now()-3600000*1).toISOString() },
  { id: 'e5f6g7h8', title: 'Library books missing from shelf', description: 'Several reference books for Computer Networks are missing from Section B.', submitter_email: 'librarian@college.edu', department_id: 'dept-lib', priority: 'LOW', ai_confidence: 0.95, status: 'ROUTED', suggested_category: 'Library', created_at: new Date(Date.now()-3600000*24).toISOString() },
  { id: 'i9j0k1l2', title: 'Cafeteria hygiene issue', description: 'Found insects in the food served at lunch counter 3.', submitter_email: 'angry_student@college.edu', department_id: null, priority: 'HIGH', ai_confidence: 0.52, status: 'MANUAL_REVIEW', suggested_category: 'Cafeteria', created_at: new Date(Date.now()-3600000*0.5).toISOString() },
];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, routed: 0, manual_review: 0, resolved: 0 });
  const [tickets, setTickets] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketActivities, setTicketActivities] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ticketsRes, deptRes] = await Promise.all([
          axios.get('http://localhost:8000/api/admin/analytics'),
          axios.get('http://localhost:8000/api/admin/tickets'),
          axios.get('http://localhost:8000/api/admin/departments'),
        ]);
        setStats(statsRes.data); setTickets(ticketsRes.data); setDepartments(deptRes.data);
      } catch {
        setStats({ total: 145, pending: 12, processing: 5, routed: 80, manual_review: 8, resolved: 40 });
        if (tickets.length === 0) setTickets(DEMO_TICKETS);
        if (departments.length === 0) setDepartments([{id:'1',name:'IT Support'},{id:'2',name:'Maintenance'},{id:'3',name:'Academics'},{id:'4',name:'General'}]);
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleRoute = async (ticketId: string, deptId: string) => {
    try {
      await axios.post(`http://localhost:8000/api/admin/tickets/${ticketId}/route`, { department_id: deptId });
    } catch {}
    const dept = departments.find(d => d.id === deptId);
    toast.success(`Ticket routed to ${dept?.name || 'department'}`);
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: 'ROUTED', department_id: deptId, departments: dept } : t));
    setSelectedTicket(null);
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await axios.patch(`http://localhost:8000/api/admin/tickets/${ticketId}/status`, { status: newStatus });
    } catch {}
    toast.success(`Ticket marked as ${newStatus}`);
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    setSelectedTicket(null);
  };

  const openTicketDetail = async (ticket: any) => {
    setSelectedTicket(ticket);
    try {
      const res = await axios.get(`http://localhost:8000/api/admin/tickets/${ticket.id}`);
      setTicketActivities(res.data.activities || []);
    } catch {
      setTicketActivities([]);
    }
  };

  const handleLogout = () => { toast.info('Logged out'); navigate('/admin/login'); };

  const filteredTickets = useMemo(() => tickets.filter(t => {
    const s = searchQuery.toLowerCase();
    const matchSearch = t.title.toLowerCase().includes(s) || t.id.toLowerCase().includes(s);
    const matchTab = activeTab === 'ALL' || t.status === activeTab;
    return matchSearch && matchTab;
  }), [tickets, searchQuery, activeTab]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'workflows', label: 'Workflows', icon: GitBranch },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface flex font-body-md">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 h-screen z-50 w-64 border-r border-outline-variant bg-surface flex flex-col justify-between
        transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div>
          <div className="h-16 flex items-center gap-3 px-5 border-b border-outline-variant">
            <BrandMark />
            <button onClick={() => setMobileMenuOpen(false)} className="ml-auto md:hidden p-1 text-on-surface-variant"><X className="w-4 h-4" /></button>
          </div>
          <nav className="p-3 space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { 
                if (item.id === 'workflows') { navigate('/admin/workflows'); return; }
                setActiveSection(item.id); setMobileMenuOpen(false); 
              }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${activeSection === item.id ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                <item.icon className="w-4 h-4" /> {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-3 border-t border-outline-variant">
          <div className="flex items-center gap-3 px-4 py-2.5 mb-1">
            <div className="w-8 h-8 bg-surface-container rounded-full flex items-center justify-center"><User className="w-4 h-4 text-on-surface-variant" /></div>
            <div className="flex flex-col"><span className="text-sm font-medium text-on-surface">Admin User</span><span className="text-xs text-on-surface-variant">admin@hub.edu</span></div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-error hover:bg-error-container hover:text-on-error-container rounded-lg text-sm font-medium transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background animated-mesh-bg">
        {/* Top Header */}
        <header className="h-16 border-b border-outline-variant flex items-center justify-between px-4 sm:px-8 glass-panel sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container rounded-lg"><Menu className="w-5 h-5" /></button>
            <h1 className="text-lg font-semibold tracking-tight text-on-surface capitalize">{activeSection === 'dashboard' ? 'Operations Overview' : activeSection}</h1>
            {activeSection === 'dashboard' && stats.total > 0 && (
              <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100">{stats.total} tickets</span>
            )}
          </div>
          {activeSection === 'dashboard' && (
            <div className="relative w-48 sm:w-72">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search tickets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/60 border border-outline-variant rounded-lg text-sm transition-all hover:border-outline shadow-sm" />
            </div>
          )}
        </header>

        <div className="page-container page-container--wide py-4 sm:py-8">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard title="Total Tickets" value={stats.total} icon={Activity} color="bg-secondary-container text-on-secondary-container" />
                <StatCard title="Needs Review" value={stats.manual_review} icon={AlertTriangle} color="bg-[#ffedcd] text-[#7a4800]" />
                <StatCard title="AI Processing" value={stats.processing} icon={Clock} color="bg-[#f3e8ff] text-[#6b21a8]" />
                <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle} color="bg-[#dcfce7] text-[#166534]" />
              </div>

              {/* Tickets Table */}
              <SurfaceCard className="flex flex-col overflow-hidden">
                <div className="p-1.5 border-b border-outline-variant/30 flex items-center gap-1.5 bg-surface-container/30 overflow-x-auto">
                  <TabBtn active={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')}>All</TabBtn>
                  <TabBtn active={activeTab === 'MANUAL_REVIEW'} onClick={() => setActiveTab('MANUAL_REVIEW')}>
                    Review <span className="ml-1.5 bg-[#ffedcd] text-[#7a4800] px-1.5 py-0.5 rounded-full text-[10px] font-bold">{tickets.filter(t => t.status === 'MANUAL_REVIEW').length}</span>
                  </TabBtn>
                  <TabBtn active={activeTab === 'ROUTED'} onClick={() => setActiveTab('ROUTED')}>Routed</TabBtn>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/30">
                        <th className="px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Ticket</th>
                        <th className="px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Title</th>
                        <th className="px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">Priority</th>
                        <th className="px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Age</th>
                        <th className="px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-xs font-medium text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
                        <tr key={ticket.id} className="hover:bg-surface-container/20 transition-colors group">
                          <td className="px-5 py-3.5 font-mono text-xs text-on-surface-variant">{ticket.id.substring(0, 8)}</td>
                          <td className="px-5 py-3.5 text-sm text-on-surface font-medium max-w-[200px] truncate">{ticket.title}</td>
                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <PriorityBadge priority={ticket.priority} />
                          </td>
                          <td className="px-5 py-3.5 text-xs text-on-surface-variant hidden md:table-cell">{ticket.created_at ? timeAgo(ticket.created_at) : '—'}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={ticket.status} /></td>
                          <td className="px-5 py-3.5 text-right">
                            <button onClick={() => openTicketDetail(ticket)}
                              className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-surface-container rounded-lg transition-colors flex items-center gap-1 ml-auto">
                              Review <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="px-5 py-12 text-center text-on-surface-variant text-sm">No tickets found matching your criteria.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </SurfaceCard>
            </div>
          )}

          {activeSection === 'analytics' && <AdminAnalytics />}
          {activeSection === 'settings' && <AdminSettings />}
        </div>
      </main>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card rounded-2xl shadow-glass-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="p-5 border-b border-outline-variant/30 flex justify-between items-start bg-surface-container/20">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs text-on-surface-variant">#{selectedTicket.id.substring(0, 8)}</span>
                    <PriorityBadge priority={selectedTicket.priority} />
                  </div>
                  <h2 className="text-lg font-semibold text-on-surface">{selectedTicket.title}</h2>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"><X className="w-4 h-4" /></button>
              </div>
              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-medium text-on-surface-variant uppercase mb-1.5">Submitter</h3>
                    <p className="text-sm font-medium text-on-surface flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-on-surface-variant" />{selectedTicket.users?.email || 'Unknown'}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-on-surface-variant uppercase mb-1.5">Department</h3>
                    <p className="text-sm font-medium text-on-surface">{selectedTicket.departments?.name || 'Unassigned'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-on-surface-variant uppercase mb-1.5">Description</h3>
                  <div className="bg-surface-container/20 p-4 rounded-lg border border-outline-variant/20 text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{selectedTicket.description || 'No description.'}</div>
                </div>
                <div className="bg-surface-container/20 border border-outline-variant/20 p-4 rounded-lg flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div>
                    <h3 className="text-xs font-medium text-on-surface-variant uppercase mb-1 flex items-center gap-1"><Activity className="w-3 h-3 text-primary" /> AI Analysis</h3>
                    <p className="text-sm font-medium text-on-surface flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-on-surface-variant" />{selectedTicket.departments?.name || selectedTicket.sentiment || 'Pending'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant">Confidence:</span>
                    <div className="w-20 h-1.5 bg-surface-container rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(selectedTicket.ai_confidence || 0)*100}%` }} /></div>
                    <span className="text-xs font-bold text-on-surface">{Math.round((selectedTicket.ai_confidence || 0)*100)}%</span>
                  </div>
                </div>
                {selectedTicket.ai_reasoning && (
                  <div>
                    <h3 className="text-xs font-medium text-on-surface-variant uppercase mb-1.5">AI Reasoning</h3>
                    <p className="text-sm text-on-surface-variant bg-surface-container/20 p-3 rounded-lg border border-outline-variant/20">{selectedTicket.ai_reasoning}</p>
                  </div>
                )}
                {/* Activity Timeline */}
                {ticketActivities.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-on-surface-variant uppercase mb-2">Activity Timeline</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {ticketActivities.map((act: any) => (
                        <div key={act.id} className="flex items-start gap-2 text-xs">
                          <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-primary shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium text-on-surface">{act.activity_type.replace(/_/g, ' ')}</span>
                            <span className="text-on-surface-variant ml-1">by {act.actor || 'System'}</span>
                            <span className="text-outline ml-2">{act.created_at ? new Date(act.created_at).toLocaleString() : ''}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Modal Footer */}
              <div className="p-5 border-t border-outline-variant/30 bg-surface-container/10 flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="text-xs text-on-surface-variant font-medium flex items-center gap-2">Status: <StatusBadge status={selectedTicket.status} /></div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {selectedTicket.status === 'MANUAL_REVIEW' && (
                    <select onChange={e => handleRoute(selectedTicket.id, e.target.value)} defaultValue=""
                      className="bg-white/60 border border-outline-variant rounded-lg px-4 py-2 text-sm font-medium text-on-surface cursor-pointer shadow-sm flex-1 sm:flex-initial">
                      <option value="" disabled>Route to Department…</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  )}
                  {selectedTicket.status === 'ROUTED' && (
                    <button onClick={() => handleStatusChange(selectedTicket.id, 'RESOLVED')}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#dcfce7] text-[#166534] rounded-lg hover:bg-[#bbf7d0] transition-colors">
                      <ShieldCheck className="w-3.5 h-3.5" /> Mark Resolved
                    </button>
                  )}
                  {(selectedTicket.status === 'ROUTED' || selectedTicket.status === 'MANUAL_REVIEW') && (
                    <button onClick={() => handleStatusChange(selectedTicket.id, 'ESCALATED')}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-error-container text-on-error-container rounded-lg hover:opacity-80 transition-colors">
                      <ArrowUp className="w-3.5 h-3.5" /> Escalate
                    </button>
                  )}
                  <button onClick={() => setSelectedTicket(null)} className="px-5 py-2 glass-card rounded-lg text-sm font-medium hover:bg-white/80 transition-all">Close</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <SurfaceCard className="p-4 sm:p-5 flex items-start justify-between relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 accent-gradient" />
      <div>
        <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">{title}</p>
        <p className="text-2xl font-bold tracking-tight text-on-surface">{value}</p>
      </div>
      <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-5 h-5" strokeWidth={1.5} /></div>
      </SurfaceCard>
    </motion.div>
  );
}

function TabBtn({ active, onClick, children }: any) {
  return (
    <button onClick={onClick} className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center whitespace-nowrap
      ${active ? 'bg-white text-on-surface shadow-sm border border-outline-variant/40' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'}`}>{children}</button>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls = priority === 'URGENT' ? 'bg-error-container text-on-error-container border-error/20'
    : priority === 'HIGH' ? 'bg-[#ffedcd] text-[#7a4800] border-[#7a4800]/20'
    : priority === 'MEDIUM' ? 'bg-secondary-container text-on-secondary-container border-secondary/20'
    : 'bg-surface-container text-on-surface-variant border-outline-variant';
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'MANUAL_REVIEW') return <span className="text-[#7a4800] bg-[#ffedcd] px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-max border border-[#7a4800]/20"><AlertTriangle className="w-2.5 h-2.5" /> Review</span>;
  if (status === 'ROUTED') return <span className="text-[#166534] bg-[#dcfce7] px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-max border border-[#166534]/20"><CheckCircle className="w-2.5 h-2.5" /> Routed</span>;
  if (status === 'AI_PROCESSING') return <span className="text-[#6b21a8] bg-[#f3e8ff] px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-max border border-[#6b21a8]/20"><Clock className="w-2.5 h-2.5" /> Processing</span>;
  if (status === 'RESOLVED') return <span className="text-[#065f46] bg-[#d1fae5] px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-max border border-[#065f46]/20"><ShieldCheck className="w-2.5 h-2.5" /> Resolved</span>;
  if (status === 'ESCALATED') return <span className="text-[#991b1b] bg-[#fee2e2] px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-max border border-[#991b1b]/20"><ArrowUp className="w-2.5 h-2.5" /> Escalated</span>;
  if (status === 'IN_PROGRESS') return <span className="text-[#1e40af] bg-[#dbeafe] px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 w-max border border-[#1e40af]/20"><Clock className="w-2.5 h-2.5" /> In Progress</span>;
  return <span className="text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-outline-variant">{status}</span>;
}
