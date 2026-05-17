import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Bell, Brain, User, Plus, Trash2, Save, Mail, Key, Cpu, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { SurfaceCard } from '../components/layout';
import axios from 'axios';

const API = 'http://localhost:8000/api/admin';

export function AdminSettings() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [agentConfigs, setAgentConfigs] = useState<any[]>([]);
  const [newDept, setNewDept] = useState({ name: '', email: '', description: '' });
  const [newEmail, setNewEmail] = useState({ label: '', email_address: '', smtp_server: 'smtp.gmail.com', smtp_port: 587, smtp_username: '', smtp_password: '' });
  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    emailOnNew: true, emailOnUrgent: true, emailOnReview: false, dailyDigest: true,
  });
  const [threshold, setThreshold] = useState(80);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [deptRes, emailRes, agentRes] = await Promise.all([
          axios.get(`${API}/departments`),
          axios.get(`${API}/email-accounts`),
          axios.get(`${API}/agent-configs`),
        ]);
        setDepartments(deptRes.data);
        setEmailAccounts(emailRes.data);
        setAgentConfigs(agentRes.data);
      } catch {
        // Fallback demo data
        setDepartments([
          { id: '1', name: 'IT Support', email: 'it@example.com', description: 'Technology issues' },
          { id: '2', name: 'Maintenance', email: 'maintenance@example.com', description: 'Building upkeep' },
          { id: '3', name: 'Academics', email: 'academics@example.com', description: 'Course & faculty' },
        ]);
        setAgentConfigs([
          { id: '1', name: 'Classifier Agent', system_prompt: 'You are a classification agent...', model_provider: 'gemini', model_name: 'gemini-pro', temperature: 0 },
          { id: '2', name: 'Priority Agent', system_prompt: 'You are a priority assessment agent...', model_provider: 'gemini', model_name: 'gemini-pro', temperature: 0 },
        ]);
      }
    };
    fetchAll();
  }, []);

  const addDepartment = async () => {
    if (!newDept.name || !newDept.email) { toast.error('Fill in name and email'); return; }
    try {
      const res = await axios.post(`${API}/departments`, newDept);
      setDepartments([...departments, res.data]);
    } catch {
      setDepartments([...departments, { id: Date.now().toString(), ...newDept }]);
    }
    setNewDept({ name: '', email: '', description: '' }); setShowAddDept(false);
    toast.success('Department added');
  };

  const removeDept = async (id: string) => {
    try { await axios.delete(`${API}/departments/${id}`); } catch {}
    setDepartments(departments.filter(d => d.id !== id));
    toast.success('Department removed');
  };

  const addEmailAccount = async () => {
    if (!newEmail.label || !newEmail.email_address) { toast.error('Fill in required fields'); return; }
    try {
      const res = await axios.post(`${API}/email-accounts`, newEmail);
      setEmailAccounts([...emailAccounts, res.data]);
    } catch {
      setEmailAccounts([...emailAccounts, { id: Date.now().toString(), ...newEmail }]);
    }
    setNewEmail({ label: '', email_address: '', smtp_server: 'smtp.gmail.com', smtp_port: 587, smtp_username: '', smtp_password: '' });
    setShowAddEmail(false);
    toast.success('Email account added');
  };

  const removeEmailAccount = async (id: string) => {
    try { await axios.delete(`${API}/email-accounts/${id}`); } catch {}
    setEmailAccounts(emailAccounts.filter(e => e.id !== id));
    toast.success('Email account removed');
  };

  const testEmailAccount = async (id: string) => {
    toast.info('Sending test email...');
    try {
      await axios.post(`${API}/email-accounts/${id}/test`);
      toast.success('Test email sent!');
    } catch {
      toast.error('Test failed — check credentials');
    }
  };

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      {/* Account Info */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <SurfaceCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center"><User className="w-4 h-4 text-on-surface" /></div>
          <h3 className="text-sm font-semibold text-on-surface">Account Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs text-on-surface-variant mb-1">Name</label><input value="Admin User" readOnly className="input-surface text-sm" /></div>
          <div><label className="block text-xs text-on-surface-variant mb-1">Email</label><input value="admin@complainhub.edu" readOnly className="input-surface text-sm" /></div>
          <div><label className="block text-xs text-on-surface-variant mb-1">Role</label><input value="System Administrator" readOnly className="input-surface text-sm" /></div>
          <div><label className="block text-xs text-on-surface-variant mb-1">Organization</label><input value="ComplainHUB Demo" readOnly className="input-surface text-sm" /></div>
        </div>
        </SurfaceCard>
      </motion.div>

      {/* Departments */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SurfaceCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center"><Building2 className="w-4 h-4 text-on-surface" /></div>
            <h3 className="text-sm font-semibold text-on-surface">Departments</h3>
          </div>
          <button onClick={() => setShowAddDept(!showAddDept)} className="text-xs font-medium text-primary hover:bg-surface-container px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {showAddDept && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-4 rounded-lg bg-surface-container/20 border border-outline-variant/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Department name" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} className="input-surface text-sm" />
              <input placeholder="Email address" value={newDept.email} onChange={e => setNewDept({...newDept, email: e.target.value})} className="input-surface text-sm" />
            </div>
            <input placeholder="Description (optional)" value={newDept.description} onChange={e => setNewDept({...newDept, description: e.target.value})} className="input-surface text-sm" />
            <div className="flex gap-2">
              <button onClick={addDepartment} className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-medium hover:opacity-90 transition-all flex items-center gap-1.5"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => setShowAddDept(false)} className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-all">Cancel</button>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          {departments.map(dept => (
            <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-container/20 border border-outline-variant/15 group hover:bg-surface-container/30 transition-colors">
              <div>
                <p className="text-sm font-medium text-on-surface">{dept.name}</p>
                <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{dept.email}</p>
                {dept.description && <p className="text-[11px] text-on-surface-variant mt-0.5">{dept.description}</p>}
              </div>
              <button onClick={() => removeDept(dept.id)} className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-all opacity-0 group-hover:opacity-100">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        </SurfaceCard>
      </motion.div>

      {/* Email Accounts */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <SurfaceCard className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center"><Key className="w-4 h-4 text-on-surface" /></div>
            <div>
              <h3 className="text-sm font-semibold text-on-surface">Email Accounts (SMTP)</h3>
              <p className="text-[11px] text-on-surface-variant">Outbound email credentials for ticket notifications</p>
            </div>
          </div>
          <button onClick={() => setShowAddEmail(!showAddEmail)} className="text-xs font-medium text-primary hover:bg-surface-container px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {showAddEmail && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-4 rounded-lg bg-surface-container/20 border border-outline-variant/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Label (e.g. IT Support)" value={newEmail.label} onChange={e => setNewEmail({...newEmail, label: e.target.value})} className="input-surface text-sm" />
              <input placeholder="Email address" value={newEmail.email_address} onChange={e => setNewEmail({...newEmail, email_address: e.target.value})} className="input-surface text-sm" />
              <input placeholder="SMTP Username" value={newEmail.smtp_username} onChange={e => setNewEmail({...newEmail, smtp_username: e.target.value})} className="input-surface text-sm" />
              <input placeholder="SMTP Password (App Password)" type="password" value={newEmail.smtp_password} onChange={e => setNewEmail({...newEmail, smtp_password: e.target.value})} className="input-surface text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={addEmailAccount} className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-medium hover:opacity-90 transition-all flex items-center gap-1.5"><Save className="w-3 h-3" /> Save</button>
              <button onClick={() => setShowAddEmail(false)} className="px-4 py-2 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-all">Cancel</button>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          {emailAccounts.length > 0 ? emailAccounts.map(ea => (
            <div key={ea.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-container/20 border border-outline-variant/15 group hover:bg-surface-container/30 transition-colors">
              <div>
                <p className="text-sm font-medium text-on-surface">{ea.label}</p>
                <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{ea.email_address}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => testEmailAccount(ea.id)} className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all" title="Send test email">
                  <TestTube className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => removeEmailAccount(ea.id)} className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )) : (
            <p className="text-xs text-on-surface-variant py-3 text-center">No email accounts configured. Using default SMTP settings.</p>
          )}
        </div>
        </SurfaceCard>
      </motion.div>

      {/* AI Agent Configs */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SurfaceCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center"><Cpu className="w-4 h-4 text-on-surface" /></div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">AI Agent Configurations</h3>
            <p className="text-[11px] text-on-surface-variant">System prompts and model settings used by workflow nodes</p>
          </div>
        </div>
        <div className="space-y-2">
          {agentConfigs.map(ac => (
            <div key={ac.id} className="p-3 rounded-lg bg-surface-container/20 border border-outline-variant/15 hover:bg-surface-container/30 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-primary" />{ac.name}
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {ac.model_provider}/{ac.model_name} · temp={ac.temperature}
                  </p>
                </div>
                <button
                  onClick={() => setEditingAgent(editingAgent?.id === ac.id ? null : ac)}
                  className="text-xs font-medium text-primary hover:bg-surface-container px-3 py-1.5 rounded-lg transition-colors"
                >
                  {editingAgent?.id === ac.id ? 'Close' : 'Edit'}
                </button>
              </div>
              {editingAgent?.id === ac.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-3 pt-3 border-t border-outline-variant/20">
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">System Prompt</label>
                    <textarea
                      value={editingAgent.system_prompt}
                      onChange={e => setEditingAgent({...editingAgent, system_prompt: e.target.value})}
                      className="input-surface text-xs min-h-[100px] font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] text-on-surface-variant mb-1">Provider</label>
                      <select value={editingAgent.model_provider} onChange={e => setEditingAgent({...editingAgent, model_provider: e.target.value})} className="input-surface text-xs">
                        <option value="gemini">Gemini</option>
                        <option value="openai">OpenAI</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-on-surface-variant mb-1">Model</label>
                      <input value={editingAgent.model_name} onChange={e => setEditingAgent({...editingAgent, model_name: e.target.value})} className="input-surface text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-on-surface-variant mb-1">Temp</label>
                      <input type="number" step="0.1" min="0" max="2" value={editingAgent.temperature} onChange={e => setEditingAgent({...editingAgent, temperature: parseFloat(e.target.value)})} className="input-surface text-xs" />
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try { await axios.put(`${API}/agent-configs/${editingAgent.id}`, editingAgent); } catch {}
                      setAgentConfigs(agentConfigs.map(a => a.id === editingAgent.id ? editingAgent : a));
                      setEditingAgent(null);
                      toast.success('Agent config updated');
                    }}
                    className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-medium hover:opacity-90 transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-3 h-3" /> Save Changes
                  </button>
                </motion.div>
              )}
            </div>
          ))}
        </div>
        </SurfaceCard>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <SurfaceCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center"><Bell className="w-4 h-4 text-on-surface" /></div>
          <h3 className="text-sm font-semibold text-on-surface">Notification Preferences</h3>
        </div>
        <div className="space-y-3">
          {([
            ['emailOnNew', 'New ticket submitted'],
            ['emailOnUrgent', 'Urgent priority detected'],
            ['emailOnReview', 'Manual review required'],
            ['dailyDigest', 'Daily summary digest'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container/20 transition-colors cursor-pointer">
              <span className="text-sm text-on-surface">{label}</span>
              <button onClick={() => setNotifications({...notifications, [key]: !notifications[key]})}
                className={`w-10 h-6 rounded-full transition-colors relative ${notifications[key] ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${notifications[key] ? 'left-5' : 'left-1'}`} />
              </button>
            </label>
          ))}
        </div>
        </SurfaceCard>
      </motion.div>

      {/* AI Threshold */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <SurfaceCard className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center"><Brain className="w-4 h-4 text-on-surface" /></div>
          <h3 className="text-sm font-semibold text-on-surface">AI Configuration</h3>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-on-surface">Auto-Route Confidence Threshold</span>
            <span className="text-sm font-bold text-on-surface">{threshold}%</span>
          </div>
          <input type="range" min={50} max={95} value={threshold} onChange={e => setThreshold(+e.target.value)}
            className="w-full h-1.5 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary" />
          <p className="text-xs text-on-surface-variant mt-2">Tickets below this threshold are sent to the manual review queue.</p>
        </div>
        </SurfaceCard>
      </motion.div>
    </div>
  );
}
