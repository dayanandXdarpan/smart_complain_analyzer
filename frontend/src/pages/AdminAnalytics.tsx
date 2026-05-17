import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Brain, Clock, CheckCircle2 } from 'lucide-react';
import { SurfaceCard } from '../components/layout';

const priorityData = [
  { name: 'Urgent', value: 12, color: '#ba1a1a' },
  { name: 'High', value: 34, color: '#7a4800' },
  { name: 'Medium', value: 56, color: '#575f6c' },
  { name: 'Low', value: 43, color: '#c5c6c9' },
];

const categoryData = [
  { name: 'IT Support', count: 42 },
  { name: 'Maintenance', count: 38 },
  { name: 'Academic', count: 27 },
  { name: 'Cafeteria', count: 18 },
  { name: 'Hostel', count: 12 },
  { name: 'Library', count: 8 },
];

const weeklyData = [
  { day: 'Mon', tickets: 18 },
  { day: 'Tue', tickets: 24 },
  { day: 'Wed', tickets: 31 },
  { day: 'Thu', tickets: 22 },
  { day: 'Fri', tickets: 28 },
  { day: 'Sat', tickets: 12 },
  { day: 'Sun', tickets: 10 },
];

export function AdminAnalytics() {
  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={TrendingUp} label="Resolution Rate" value="87%" sub="+4% from last week" color="text-[#166534]" />
        <MetricCard icon={Brain} label="Avg. AI Confidence" value="91.3%" sub="Across 145 tickets" color="text-primary" />
        <MetricCard icon={Clock} label="Avg. Response Time" value="1.8h" sub="-22min from last week" color="text-[#7a4800]" />
        <MetricCard icon={CheckCircle2} label="Auto-Routed" value="92%" sub="Without admin intervention" color="text-[#166534]" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
          <SurfaceCard className="p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Priority Distribution</h3>
          <div className="h-[220px] min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} strokeWidth={2} stroke="#f7f9fb">
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid #c5c6c9', borderRadius: '0.5rem', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {priorityData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
          </SurfaceCard>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
          <SurfaceCard className="p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4">Category Breakdown</h3>
          <div className="h-[260px] min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#75777a' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#45474a' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid #c5c6c9', borderRadius: '0.5rem', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#000000" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </SurfaceCard>
        </motion.div>
      </div>

      {/* Weekly trend */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
        <SurfaceCard className="p-6">
        <h3 className="text-sm font-semibold text-on-surface mb-4">Tickets This Week</h3>
        <div className="h-[200px] min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e3e5" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#75777a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#75777a' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid #c5c6c9', borderRadius: '0.5rem', fontSize: '12px' }} />
              <defs>
                <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="tickets" stroke="#000000" strokeWidth={2} fill="url(#colorTickets)" dot={{ r: 3, fill: '#000' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        </SurfaceCard>
      </motion.div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <motion.div whileHover={{ y: -2 }}>
      <SurfaceCard className="p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold tracking-tight text-on-surface">{value}</p>
      <p className="text-xs text-on-surface-variant">{sub}</p>
      </SurfaceCard>
    </motion.div>
  );
}
