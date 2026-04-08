
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ReportStatus, HazardCategory, LocationForecast, PriorityLevel } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { AlertOctagon, CheckCircle2, XCircle, Map as MapIcon, Siren, Send, Radio, Activity, MessageSquare, CloudSun, Wind, Droplets, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getWeatherForecast } from '../services/geminiService';

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string; borderColor: string }> = ({ title, value, icon, color, borderColor }) => (
  <div className={`bg-midnight-900 border border-midnight-800 rounded-xl p-6 flex items-start justify-between shadow-lg hover:border-${borderColor} transition-all duration-300 group`}>
    <div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-display font-bold text-white mt-1 group-hover:scale-105 transition-transform origin-left">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 border border-white/5`}>
      {icon}
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { reports, broadcastAlert, sendDirectSMS, users } = useApp();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [msgMode, setMsgMode] = useState<'broadcast' | 'direct'>('broadcast');
  const [targetPhone, setTargetPhone] = useState('');
  const [weather, setWeather] = useState<LocationForecast | null>(null);
  const navigate = useNavigate();

  // Load weather on mount
  useEffect(() => {
    getWeatherForecast("Chennai, India").then(data => {
      if (data) setWeather(data);
    });
  }, []);

  // Metrics
  const totalReports = reports.length;
  const verifiedReports = reports.filter(r => r.status === ReportStatus.VERIFIED).length;
  const fakeReports = reports.filter(r => r.status === ReportStatus.FAKE).length;
  const pendingReports = reports.filter(r => r.status === ReportStatus.PENDING).length;

  // Chart Data
  const categoryData = Object.values(HazardCategory).map(cat => ({
    name: cat,
    value: reports.filter(r => r.category === cat).length
  }));

  const statusData = [
    { name: 'Verified', value: verifiedReports, color: '#10b981' },
    { name: 'Pending', value: pendingReports, color: '#f59e0b' },
    { name: 'Fake/Suspicious', value: fakeReports + reports.filter(r => r.status === ReportStatus.SUSPICIOUS).length, color: '#ef4444' },
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsSending(true);
    setTimeout(() => {
      if (msgMode === 'broadcast') {
        broadcastAlert(message);
      } else {
        if (!targetPhone) {
          setIsSending(false);
          return;
        }
        sendDirectSMS(targetPhone, message);
      }
      setMessage('');
      setIsSending(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-display font-bold text-white tracking-tight">Command Center</h2>
          <p className="text-slate-400 mt-1">Real-time hazard monitoring and analysis.</p>
        </div>
        
        {/* Weather Widget (Admin View) */}
        {weather && (
          <div className="bg-gradient-to-r from-ocean-900 to-midnight-900 border border-ocean-800 rounded-xl p-3 flex items-center gap-4 shadow-lg animate-in slide-in-from-right">
             <div className="p-3 bg-ocean-500/20 rounded-full">
               <CloudSun size={24} className="text-yellow-400" />
             </div>
             <div>
               <div className="flex items-end gap-2">
                 <h3 className="text-2xl font-bold text-white">{weather.current.temp}°C</h3>
                 <div className="flex flex-col">
                   <span className="text-xs text-ocean-300 font-bold uppercase tracking-tight">{weather.locationName}</span>
                   {weather.isFallback && (
                     <span className="text-[8px] text-amber-400 font-bold uppercase animate-pulse">Fallback Mode</span>
                   )}
                 </div>
               </div>
               <div className="flex flex-col gap-1">
                 <p className="text-xs text-slate-400 flex gap-3">
                   <span className="flex items-center gap-1"><Wind size={10} /> {weather.current.windSpeed}km/h</span>
                   <span className="flex items-center gap-1"><Droplets size={10} /> {weather.current.humidity}%</span>
                 </p>
                 {weather.sourceUri && (
                    <a href={weather.sourceUri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[9px] text-ocean-400 hover:text-white mt-1 underline">
                       <ExternalLink size={8} /> Source: Google
                    </a>
                 )}
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reports" value={totalReports} icon={<Siren className="text-blue-400" />} color="bg-blue-400" borderColor="blue-500" />
        <StatCard title="Verified Hazards" value={verifiedReports} icon={<CheckCircle2 className="text-emerald-400" />} color="bg-emerald-400" borderColor="emerald-500" />
        <StatCard title="Pending Review" value={pendingReports} icon={<AlertOctagon className="text-amber-400" />} color="bg-amber-400" borderColor="amber-500" />
        <StatCard title="Flagged Fake" value={fakeReports} icon={<XCircle className="text-red-400" />} color="bg-red-400" borderColor="red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Map Visualization Link */}
        <div className="lg:col-span-2 flex flex-col gap-6">
           <div 
             className="bg-midnight-900 border border-midnight-800 rounded-xl p-6 shadow-xl min-h-[300px] flex flex-col relative group cursor-pointer hover:border-cyan-500/50 transition-all"
             onClick={() => navigate('/map')}
           >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapIcon size={18} className="text-neon-cyan" />
                Live Hazard Map Overview
              </h3>
              <div className="flex-1 bg-midnight-950 rounded-lg border border-midnight-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" 
                  style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                </div>
                {/* Simulated Pins */}
                {reports.slice(0, 10).map((report, i) => (
                  <div 
                    key={report.id}
                    className="absolute animate-pulse"
                    style={{ 
                      left: `${((report.location.longitude - 79) * 20)}%`,
                      top: `${((14 - report.location.latitude) * 20)}%`
                    }}
                  >
                    <div className={`w-3 h-3 rounded-full ${report.status === ReportStatus.VERIFIED ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`}></div>
                  </div>
                ))}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors backdrop-blur-[1px]">
                   <button className="bg-ocean-600 hover:bg-ocean-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-cyan-900/50 transition-all transform group-hover:scale-105 border border-white/10">
                     Open Interactive Map
                   </button>
                </div>
              </div>
           </div>

           {/* Live Activity Feed */}
           <div className="bg-midnight-900 border border-midnight-800 rounded-xl p-6 shadow-xl flex-1">
             <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
               <Activity size={18} className="text-emerald-400" />
               Real-Time Ingestion
             </h3>
             <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
               {[...reports].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)).slice(0, 5).map(report => (
                 <div key={report.id} className="flex items-center justify-between p-3.5 bg-midnight-800/50 rounded-lg border border-midnight-700 hover:bg-midnight-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${report.status === 'Verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        <Radio size={16} />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium flex items-center gap-2">
                          {report.category}
                          {report.priorityLevel === PriorityLevel.CRITICAL && (
                            <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse">CRITICAL</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">{report.userName} • {new Date(report.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-mono text-slate-500 bg-midnight-950 px-2 py-1 rounded">
                        {report.location.latitude.toFixed(2)}, {report.location.longitude.toFixed(2)}
                      </span>
                      {report.priorityScore !== undefined && (
                        <span className="text-[10px] text-slate-500 font-mono">P: {report.priorityScore}</span>
                      )}
                    </div>
                 </div>
               ))}
               <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-3 opacity-75">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Listening for incoming reports...
               </div>
             </div>
           </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          
          {/* SMS Broadcast/Direct Panel */}
          <div className="bg-gradient-to-br from-midnight-900 to-indigo-950/50 border border-indigo-500/30 rounded-xl p-6 shadow-xl">
             <div className="flex items-center gap-4 mb-4 border-b border-white/5 pb-2">
                <button 
                  onClick={() => setMsgMode('broadcast')}
                  className={`text-xs font-bold uppercase pb-2 -mb-2.5 transition-colors ${msgMode === 'broadcast' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-indigo-300/50 hover:text-indigo-300'}`}
                >
                  Broadcast All
                </button>
                <button 
                  onClick={() => setMsgMode('direct')}
                  className={`text-xs font-bold uppercase pb-2 -mb-2.5 transition-colors ${msgMode === 'direct' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-indigo-300/50 hover:text-indigo-300'}`}
                >
                  Direct SMS
                </button>
             </div>

             <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
               {msgMode === 'broadcast' ? <Send size={18} className="text-yellow-400" /> : <MessageSquare size={18} className="text-cyan-400" />}
               {msgMode === 'broadcast' ? 'Emergency Broadcast' : 'Direct User SMS'}
             </h3>
             <p className="text-xs text-indigo-200/70 mb-4">
               {msgMode === 'broadcast' 
                 ? 'Send emergency SMS to all active users in hazard zones.' 
                 : 'Send a direct SMS to a specific citizen number.'}
             </p>
             
             <form onSubmit={handleSend} className="space-y-3">
               {msgMode === 'direct' && (
                 <div>
                   <label className="block text-[10px] font-bold text-indigo-300 uppercase mb-1">Target Phone Number</label>
                   <select 
                     className="w-full bg-midnight-950 border border-indigo-500/30 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-cyan-400 outline-none mb-2"
                     onChange={(e) => setTargetPhone(e.target.value)}
                     value={targetPhone}
                   >
                     <option value="">Select User...</option>
                     {users.filter(u => u.role !== 'Admin').map(u => (
                       <option key={u.id} value={u.phoneNumber}>{u.name} ({u.phoneNumber})</option>
                     ))}
                   </select>
                   <input 
                      type="text" 
                      placeholder="Or enter manual number..."
                      value={targetPhone}
                      onChange={(e) => setTargetPhone(e.target.value)}
                      className="w-full bg-midnight-950 border border-indigo-500/30 rounded-lg p-2.5 text-sm text-white placeholder:text-indigo-400/30 focus:ring-1 focus:ring-cyan-400 outline-none"
                   />
                 </div>
               )}

               <textarea 
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 className={`w-full bg-midnight-950 border border-indigo-500/30 rounded-lg p-3 text-sm text-white placeholder:text-indigo-400/30 outline-none resize-none h-24 focus:ring-1 ${msgMode === 'broadcast' ? 'focus:ring-yellow-400' : 'focus:ring-cyan-400'}`}
                 placeholder="Type alert message here..."
               />
               <button 
                 type="submit" 
                 disabled={isSending}
                 className={`w-full font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-lg ${
                   msgMode === 'broadcast' 
                     ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-500/20' 
                     : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20'
                 }`}
               >
                 {isSending ? 'Sending...' : msgMode === 'broadcast' ? 'BROADCAST SMS' : 'SEND SMS'}
                 <Send size={16} />
               </button>
             </form>
          </div>

          {/* Breakdown Charts */}
          <div className="bg-midnight-900 border border-midnight-800 rounded-xl p-6 shadow-xl flex-1 flex flex-col">
             {/* Pie Chart */}
             <div className="h-48 mb-6">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Report Status</h3>
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie 
                     data={statusData} 
                     cx="50%" 
                     cy="50%" 
                     innerRadius={45} 
                     outerRadius={70} 
                     paddingAngle={5} 
                     dataKey="value"
                     stroke="none"
                   >
                     {statusData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <RechartsTooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ color: '#f1f5f9' }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>

             {/* Bar Chart */}
             <div className="h-48 flex-1">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hazards by Category</h3>
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={categoryData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <XAxis dataKey="name" stroke="#64748b" fontSize={10} tick={{fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                   <YAxis stroke="#64748b" fontSize={10} tick={{fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                   <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }} />
                   <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
