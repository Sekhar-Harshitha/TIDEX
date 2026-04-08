
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HazardCategory, ReportStatus, ElectricalZone } from '../types';
import { Zap, AlertTriangle, Power, MapPin, Check, X, ShieldAlert, CloudLightning, Activity, Radio, Droplets, Wind, Siren, Cpu, ArrowRight, Truck, Navigation } from 'lucide-react';

// Mock Streets for Dispatch Demo
const ZONE_STREETS: Record<string, string[]> = {
  'z1': ['Kamaraj Salai', 'San Thome High Rd', 'Light House Loop', 'Pattinapakkam'],
  'z2': ['RK Salai', 'Luz Church Rd', 'Kutchery Road', 'Mylapore Tank Area'],
  'z3': ['Velachery Main Rd', 'Taramani Link Rd', 'Vijaya Nagar', '100ft Bypass'],
  'z4': ['Rajaji Salai', 'Harbour Main Gate', 'Mannady Street', 'Customs House Ln']
};

export const ElectricalDashboard: React.FC = () => {
  const { reports, updateReportStatus, electricalZones, toggleShutdown, broadcastAlert } = useApp();
  const [selectedZone, setSelectedZone] = useState<ElectricalZone | null>(null);
  
  // Dispatch State
  const [dispatchZoneId, setDispatchZoneId] = useState<string>('');
  const [dispatchStreet, setDispatchStreet] = useState<string>('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Filter only electrical reports
  const electricalReports = reports.filter(r => r.category === HazardCategory.ELECTRICAL);
  
  // Simulated Prediction Engine
  const predictions = [
    { id: 1, message: "Transformer 21 (Zone A) overheating risk high.", time: "10m", severity: "High" },
    { id: 2, message: "Flood waters approaching sub-station B.", time: "30m", severity: "Critical" },
    { id: 3, message: "Wind speed >80km/h in Zone C. Pole collapse likely.", time: "45m", severity: "Medium" }
  ];

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchZoneId || !dispatchStreet) return;
    
    setIsDispatching(true);
    setTimeout(() => {
      broadcastAlert(`DISPATCH: Repair Unit sent to ${dispatchStreet} (Zone ${dispatchZoneId}). Priority: HIGH.`);
      setIsDispatching(false);
      setDispatchStreet('');
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b border-midnight-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/20">
               <Zap size={28} className="text-white fill-white" />
             </div>
             <div>
               <h2 className="text-3xl font-display font-bold text-white tracking-tight leading-none">
                 Grid Command
               </h2>
               <p className="text-orange-400 font-bold text-xs tracking-[0.2em] uppercase mt-1">Electrical Safety Division</p>
             </div>
          </div>
        </div>
        
        {/* Live Telemetry Bar */}
        <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-midnight-900 border border-midnight-800 p-3 rounded-xl flex items-center gap-3">
              <Activity size={20} className="text-emerald-400" />
              <div>
                 <p className="text-[10px] text-slate-500 uppercase font-bold">Grid Frequency</p>
                 <p className="text-lg font-mono font-bold text-white">49.98 Hz</p>
              </div>
           </div>
           <div className="bg-midnight-900 border border-midnight-800 p-3 rounded-xl flex items-center gap-3">
              <Cpu size={20} className="text-cyan-400" />
              <div>
                 <p className="text-[10px] text-slate-500 uppercase font-bold">Total Load</p>
                 <p className="text-lg font-mono font-bold text-white">842 MW</p>
              </div>
           </div>
           <div className="bg-midnight-900 border border-midnight-800 p-3 rounded-xl flex items-center gap-3">
              <Siren size={20} className="text-red-500 animate-pulse" />
              <div>
                 <p className="text-[10px] text-slate-500 uppercase font-bold">Active Faults</p>
                 <p className="text-lg font-mono font-bold text-white">{electricalReports.length}</p>
              </div>
           </div>
           <div className="bg-midnight-900 border border-midnight-800 p-3 rounded-xl flex items-center gap-3">
              <ShieldAlert size={20} className="text-orange-400" />
              <div>
                 <p className="text-[10px] text-slate-500 uppercase font-bold">Grid Status</p>
                 <p className="text-lg font-bold text-orange-400">Stable</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
        
        {/* LEFT COLUMN: VISUALIZER & DISPATCH */}
        <div className="xl:col-span-2 space-y-6">
           
           {/* 1. GRID MAP VISUALIZER */}
           <div className="bg-midnight-950 border border-midnight-800 rounded-2xl relative overflow-hidden group shadow-2xl">
              {/* Grid Background Effect */}
              <div className="absolute inset-0 opacity-20" 
                style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
              </div>
              
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 opacity-50"></div>

              <div className="p-6 relative z-10">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <MapPin className="text-orange-500" /> Chennai Sector Status
                    </h3>
                    <div className="flex gap-2">
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase bg-midnight-900 px-3 py-1 rounded-full border border-midnight-700">
                         <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                       </span>
                       <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase bg-midnight-900 px-3 py-1 rounded-full border border-midnight-700">
                         <span className="w-2 h-2 rounded-full bg-red-500"></span> Shutdown
                       </span>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {electricalZones.map(zone => (
                       <div 
                         key={zone.id}
                         onClick={() => setSelectedZone(zone)}
                         className={`
                           relative border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden group/card
                           ${zone.status === 'Shutdown' 
                              ? 'bg-red-950/20 border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.4)] ring-2 ring-red-500/50 animate-pulse-fast' 
                              : zone.status === 'Partial' 
                                 ? 'bg-yellow-950/20 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.3)] ring-1 ring-yellow-500/40' 
                                 : 'bg-midnight-900/80 border-midnight-700 hover:border-orange-500/50 hover:bg-midnight-800'}
                         `}
                       >
                          {/* Status Line */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${zone.status === 'Shutdown' ? 'bg-red-500' : zone.status === 'Partial' ? 'bg-yellow-500' : 'bg-green-500'} group-hover/card:w-1.5 transition-all`}></div>
                           
                           {/* Maintenance Tooltip */}
                           {zone.lastMaintenance && (
                             <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none z-20">
                               <div className="bg-midnight-950 border border-midnight-700 text-[9px] px-2 py-1 rounded-md shadow-2xl whitespace-nowrap flex items-center gap-1.5">
                                 <Activity size={10} className="text-orange-500" />
                                 <span className="text-slate-400 uppercase font-bold">Maint:</span>
                                 <span className="text-white font-mono">{zone.lastMaintenance}</span>
                               </div>
                             </div>
                           )}
                          
                          <div className="flex justify-between items-start mb-3">
                             <div>
                                <h4 className="font-bold text-lg text-white group-hover/card:text-orange-400 transition-colors">{zone.name}</h4>
                                <p className="text-xs text-slate-400 font-mono">ID: {zone.id.toUpperCase()}</p>
                             </div>
                             <Zap size={24} className={`${zone.status === 'Active' ? 'text-green-500 fill-green-500/20' : zone.status === 'Partial' ? 'text-yellow-500' : 'text-red-500'} transition-colors`} />
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                             <div className="bg-midnight-950/40 p-2 rounded-lg border border-white/5">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Load</p>
                                <p className="text-sm font-mono text-slate-200">{zone.transformers} units</p>
                             </div>
                             <div className={`p-2 rounded-lg transition-all ${zone.status !== 'Active' ? 'bg-red-500/10 border border-red-500/30' : 'bg-midnight-950/40 border border-white/5'}`}>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Connections</p>
                                <p className={`font-mono font-bold ${zone.status !== 'Active' ? 'text-xl text-red-400' : 'text-sm text-slate-200'}`}>
                                   {zone.affectedCustomers}
                                </p>
                                {zone.status !== 'Active' && (
                                  <p className="text-[8px] text-red-500/80 font-bold uppercase mt-0.5">Affected</p>
                                )}
                             </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                             <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                zone.riskLevel === 'Critical' ? 'bg-red-500 text-white animate-pulse' : 
                                zone.riskLevel === 'High' ? 'bg-orange-500/20 text-orange-400' : 
                                'bg-slate-800 text-slate-400'
                             }`}>
                               Risk: {zone.riskLevel}
                             </div>
                             <span className="text-[10px] text-slate-500 flex items-center gap-1 group-hover/card:text-white transition-colors">
                               Manage <ArrowRight size={10} />
                             </span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* 2. RAPID RESPONSE DISPATCH */}
           <div className="bg-midnight-900 border border-midnight-800 rounded-xl p-6 shadow-xl">
              <h3 className="font-bold text-white flex items-center gap-2 mb-6 border-b border-midnight-800 pb-4">
                 <Truck className="text-cyan-400" size={20} />
                 Rapid Response Unit Dispatch
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Target Sector</label>
                    <select 
                      value={dispatchZoneId}
                      onChange={(e) => { setDispatchZoneId(e.target.value); setDispatchStreet(''); }}
                      className="w-full bg-midnight-950 border border-midnight-700 text-white text-sm rounded-lg p-3 outline-none focus:border-cyan-500 transition-colors"
                    >
                      <option value="">Select Zone...</option>
                      {electricalZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Street / Area</label>
                    <select 
                      value={dispatchStreet}
                      onChange={(e) => setDispatchStreet(e.target.value)}
                      disabled={!dispatchZoneId}
                      className="w-full bg-midnight-950 border border-midnight-700 text-white text-sm rounded-lg p-3 outline-none focus:border-cyan-500 transition-colors disabled:opacity-50"
                    >
                      <option value="">Select Street...</option>
                      {dispatchZoneId && ZONE_STREETS[dispatchZoneId]?.map(st => (
                         <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                 </div>

                 <button 
                   onClick={handleDispatch}
                   disabled={!dispatchStreet || isDispatching}
                   className="h-[46px] bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                 >
                    {isDispatching ? <Radio className="animate-spin" size={18}/> : <Navigation size={18} />}
                    {isDispatching ? 'Dispatching...' : 'DEPLOY TEAM'}
                 </button>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: HAZARDS & AI */}
        <div className="space-y-6">
           
           {/* 1. Live Hazard Stream */}
           <div className="bg-midnight-900 border border-midnight-800 rounded-xl flex flex-col h-[500px] overflow-hidden shadow-xl">
             <div className="p-4 bg-midnight-950 border-b border-midnight-800 flex justify-between items-center">
               <h3 className="font-bold text-slate-200 flex items-center gap-2">
                 <Radio size={16} className="text-red-500 animate-pulse" /> Live Hazard Feed
               </h3>
               <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-xs font-bold">{electricalReports.length} Active</span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
               {electricalReports.length === 0 && (
                  <div className="text-center py-20 text-slate-600 text-sm flex flex-col items-center">
                    <Check className="text-green-500 mb-2" size={32} />
                    All systems nominal.
                  </div>
               )}
               {electricalReports.map(report => (
                 <div key={report.id} className="bg-midnight-800/50 border border-midnight-700 rounded-lg p-3 hover:border-orange-500/30 transition-colors group relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500/50"></div>
                    <div className="flex justify-between items-start mb-1 pl-2">
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(report.timestamp).toLocaleTimeString()}</span>
                      <span className={`text-[10px] font-bold uppercase ${
                        report.status === ReportStatus.PENDING ? 'text-orange-400' : 'text-emerald-400'
                      }`}>{report.status}</span>
                    </div>
                    
                    <p className="text-sm text-slate-200 font-medium mb-2 pl-2 leading-snug">{report.description}</p>
                    
                    {report.mediaUrl && (
                      <div className="ml-2 mb-2 h-24 rounded-lg overflow-hidden relative">
                         <img src={report.mediaUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="Hazard" />
                         <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 rounded text-[9px] text-white">Evidence</div>
                      </div>
                    )}

                    <div className="ml-2 flex flex-col gap-1 text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}</span>
                    </div>

                    {report.status === ReportStatus.PENDING && (
                      <div className="flex gap-2 mt-3 ml-2">
                        <button 
                          onClick={() => updateReportStatus(report.id, ReportStatus.ACTION_TAKEN)}
                          className="flex-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/30 py-1.5 rounded text-[10px] font-bold transition-all uppercase"
                        >
                          Verify & Fix
                        </button>
                        <button 
                           onClick={() => updateReportStatus(report.id, ReportStatus.FAKE)}
                           className="flex-1 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 py-1.5 rounded text-[10px] font-bold transition-all uppercase"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                 </div>
               ))}
             </div>
           </div>

           {/* 2. AI Predictions */}
           <div className="bg-gradient-to-br from-indigo-900/50 to-midnight-900 border border-indigo-500/30 rounded-xl p-5 shadow-xl">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4 text-sm uppercase tracking-wider">
                 <CloudLightning size={16} className="text-cyan-400" /> Predictive AI
              </h3>
              <div className="space-y-3">
                 {predictions.map(pred => (
                    <div key={pred.id} className={`p-3 rounded-lg border backdrop-blur-sm flex gap-3 ${getRiskColor(pred.severity)}`}>
                       <Activity size={16} className="shrink-0 mt-0.5" />
                       <div>
                          <p className="text-xs font-bold leading-snug">{pred.message}</p>
                          <div className="flex items-center gap-2 mt-1 opacity-70">
                             <span className="text-[9px] font-mono">T-Minus: {pred.time}</span>
                             <span className="text-[9px] uppercase border px-1 rounded">{pred.severity}</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

        </div>

      </div>

      {/* SHUTDOWN CONTROL MODAL */}
      {selectedZone && (
         <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-midnight-900 border-2 border-orange-500/50 rounded-2xl p-0 w-full max-w-lg shadow-[0_0_50px_rgba(249,115,22,0.15)] overflow-hidden">
               {/* Modal Header */}
               <div className="bg-midnight-950 p-6 border-b border-midnight-800 flex justify-between items-start">
                  <div>
                     <p className="text-xs text-orange-500 font-bold uppercase tracking-widest mb-1">Grid Control Interface</p>
                     <h3 className="text-2xl font-bold text-white">{selectedZone.name}</h3>
                     <p className="text-sm text-slate-400 mt-1 font-mono">Transformers: {selectedZone.transformers} | ID: {selectedZone.id}</p>
                  </div>
                  <button onClick={() => setSelectedZone(null)} className="text-slate-500 hover:text-white transition-colors bg-midnight-800 p-2 rounded-lg"><X size={20}/></button>
               </div>

               {/* Modal Body */}
               <div className="p-6 space-y-4">
                  <button 
                    onClick={() => { toggleShutdown(selectedZone.id, 'Active'); setSelectedZone(null); }}
                    className="w-full p-4 bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 rounded-xl text-left transition-all group"
                  >
                     <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/20 p-3 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform"><Check size={24}/></div>
                        <div>
                           <span className="block font-bold text-white text-lg">System Normal</span>
                           <span className="text-xs text-slate-400">Restore full power. Grid operational.</span>
                        </div>
                     </div>
                  </button>
                  
                  <button 
                     onClick={() => { toggleShutdown(selectedZone.id, 'Partial'); setSelectedZone(null); }}
                     className="w-full p-4 bg-yellow-500/5 border border-yellow-500/20 hover:bg-yellow-500/10 hover:border-yellow-500/50 rounded-xl text-left transition-all group"
                  >
                     <div className="flex items-center gap-4">
                        <div className="bg-yellow-500/20 p-3 rounded-lg text-yellow-400 group-hover:scale-110 transition-transform"><AlertTriangle size={24}/></div>
                        <div>
                           <span className="block font-bold text-white text-lg">Partial Shutdown</span>
                           <span className="text-xs text-slate-400">Isolate hazardous lines only.</span>
                        </div>
                     </div>
                  </button>

                  <button 
                     onClick={() => { toggleShutdown(selectedZone.id, 'Shutdown'); setSelectedZone(null); }}
                     className="w-full p-4 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500 rounded-xl text-left transition-all group relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                     <div className="relative flex items-center gap-4">
                        <div className="bg-red-500 p-3 rounded-lg text-white shadow-lg shadow-red-500/40 group-hover:scale-110 transition-transform"><Power size={24}/></div>
                        <div>
                           <span className="block font-bold text-red-400 text-lg">EMERGENCY SHUTDOWN</span>
                           <span className="text-xs text-slate-300">Cut all power immediately. Broadcast alerts.</span>
                        </div>
                     </div>
                  </button>
               </div>
               
               <div className="bg-midnight-950 p-4 border-t border-midnight-800 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                     <ShieldAlert size={10} className="inline mr-1" /> Authorized Personnel Only
                  </p>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
