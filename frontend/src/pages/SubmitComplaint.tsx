import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, AlertCircle, ChevronDown, FileText, Mail, Tag, AlignLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { PageHeader, SurfaceCard } from '../components/layout';

const CATEGORIES = [
  { value: 'General', label: 'General' },
  { value: 'Infrastructure', label: 'Infrastructure' },
  { value: 'IT Support', label: 'IT Support' },
  { value: 'Academic', label: 'Academic' },
  { value: 'Cafeteria', label: 'Cafeteria & Mess' },
  { value: 'Hostel', label: 'Hostel & Housing' },
  { value: 'Library', label: 'Library' },
  { value: 'Transport', label: 'Transport' },
];

interface SubmitComplaintProps {
  onSubmitted: (ticketId: string, data: { title: string; email: string; category: string }) => void;
}

export function SubmitComplaint({ onSubmitted }: SubmitComplaintProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', email: '', suggested_category: 'General' });
  const MAX_DESC = 1000;

  const filledCount = [formData.title, formData.description, formData.email].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.email) { toast.error('Please fill in all required fields'); return; }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/complaints/soft-submit', formData);
      toast.success('Complaint drafted! Check your email for OTP.');
      onSubmitted(res.data.ticket_id, { title: formData.title, email: formData.email, category: formData.suggested_category });
    } catch {
      await new Promise(r => setTimeout(r, 1200));
      toast.success('Complaint drafted!', { description: 'Demo mode' });
      onSubmitted('demo-' + Math.floor(Math.random()*9000+1000), { title: formData.title, email: formData.email, category: formData.suggested_category });
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }} className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <PageHeader
        showBrand
        backHref="/"
        title="Submit a Grievance"
        description="Fill in the details below. We'll route it to the right team using AI."
      />

      <SurfaceCard className="p-6 sm:p-8 relative overflow-hidden group">
        {/* Subtle top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 accent-gradient rounded-t-[1.25rem]" />

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-7 pt-2">
          <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
            <FileText className="w-3.5 h-3.5" />
            <span>Step 1 of 2 — Complaint Details</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i < filledCount ? 'bg-primary scale-110' : 'bg-surface-container-highest'}`} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant mb-2">
              <FileText className="w-3.5 h-3.5" /> Title <span className="text-error">*</span>
            </label>
            <input type="text" placeholder="e.g. Broken projector in Room 302" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-surface" />
          </div>
          <div>
            <label className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant mb-2">
              <Tag className="w-3.5 h-3.5" /> Category
            </label>
            <div className="relative">
              <select value={formData.suggested_category} onChange={e => setFormData({...formData, suggested_category: e.target.value})} className="select-surface appearance-none cursor-pointer pr-10">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-xs text-on-surface-variant mt-1.5 opacity-70">AI may re-classify automatically based on content.</p>
          </div>
          <div>
            <label className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant mb-2">
              <AlignLeft className="w-3.5 h-3.5" /> Description <span className="text-error">*</span>
            </label>
            <textarea rows={4} maxLength={MAX_DESC} placeholder="Please provide as much detail as possible..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="textarea-surface resize-none" />
            <div className="flex justify-end mt-1">
              <span className={`text-xs transition-colors ${formData.description.length > MAX_DESC*0.9 ? 'text-error font-medium' : 'text-on-surface-variant/60'}`}>{formData.description.length}/{MAX_DESC}</span>
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant mb-2">
              <Mail className="w-3.5 h-3.5" /> Your Email <span className="text-error">*</span>
            </label>
            <input type="email" placeholder="student@college.edu" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-surface" />
            <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> We'll send a 6-digit OTP to verify your identity.</p>
          </div>
          <div className="pt-3 flex justify-end">
            <button type="submit" disabled={loading} className="primary-button w-full sm:w-auto disabled:opacity-50 shadow-glass group">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Submit Report <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
            </button>
          </div>
        </form>
      </SurfaceCard>
    </motion.div>
  );
}

