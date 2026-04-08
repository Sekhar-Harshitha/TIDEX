import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReportStatus, Report, PriorityLevel } from '../types';
import { Check, X, AlertTriangle, Search, Filter, Eye, Siren, WifiOff, MoreHorizontal, ShieldAlert, Trash2, ExternalLink } from 'lucide-react';
import { SmartContextMenu } from '../components/SmartContextMenu';

export const Reports: React.FC = () => {
  const { reports, updateReportStatus, deleteReport, deleteAllReports } = useApp();
  const [filter, setFilter] = useState<'All' | ReportStatus>('All');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const filteredReports = reports
    .filter(r => filter === 'All' || r.status === filter)
    .sort((a, b) => {
      if (a.isSOS && !b.isSOS) return -1;
      if (!a.isSOS && b.isSOS) return 1;
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-display font-bold text-white">Report Management</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-midnight-900 border border-midnight-800 p-1.5 rounded-xl">
            {['All', ReportStatus.PENDING, ReportStatus.VERIFIED, ReportStatus.FAKE].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status 
                    ? 'bg-ocean-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            disabled={reports.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} /> Delete All
          </button>
        </div>
      </div>

      <div className="bg-midnight-900 border border-midnight-800 rounded-2xl overflow-hidden shadow-xl min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-midnight-950 text-slate-400 uppercase text-xs font-bold tracking-wider border-b border-midnight-800">
              <tr>
                <th className="p-5">Time</th>
                <th className="p-5">Category</th>
                <th className="p-5">User</th>
                <th className="p-5">Location</th>
                <th className="p-5">AI Analysis</th>
                <th className="p-5">Priority</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-midnight-800 text-sm">
              {filteredReports.map((report) => (
                <tr key={report.id} className={`hover:bg-midnight-800/50 transition-colors ${report.isSOS ? 'bg-red-500/5 border-l-4 border-red-500' : ''}`}>
                  <td className="p-5 text-slate-300">
                    <div className="flex items-center gap-2 font-mono">
                       {report.isSOS && <Siren size={16} className="text-red-500 animate-pulse" />}
                       {new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(report.timestamp).toLocaleDateString()}</div>
                  </td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${report.isSOS ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                      {report.isSOS ? 'SOS EMERGENCY' : report.category}
                    </span>
                  </td>
                  <td className="p-5 text-white font-medium">{report.userName}</td>
                  <td className="p-5 text-slate-400 text-xs">
                    <div className="font-mono text-slate-300">
                      {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
                    </div>
                    {report.isOfflineSubmission && (
                      <span className="text-[10px] text-amber-500 flex items-center gap-1 mt-1 font-bold">
                        <WifiOff size={10} /> OFFLINE SYNC
                      </span>
                    )}
                  </td>
                  <td className="p-5">
                    {report.aiConfidence ? (
                      <div className="flex flex-col gap-1.5">
                         <div className="flex items-center gap-2">
                           <div className="h-1.5 w-16 bg-midnight-950 rounded-full overflow-hidden">
                             <div 
                               className={`h-full rounded-full ${report.aiConfidence > 80 ? 'bg-emerald-500' : report.aiConfidence > 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                               style={{ width: `${report.aiConfidence}%` }}
                             />
                           </div>
                           <span className="text-xs font-mono text-slate-400">{report.aiConfidence}%</span>
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="text-xs text-slate-500 max-w-[150px] truncate" title={report.aiReasoning}>{report.aiReasoning}</span>
                           {report.crossReferenceStatus && (
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border w-fit ${
                               report.crossReferenceStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                               report.crossReferenceStatus === 'Old News' ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' :
                               'bg-amber-500/10 text-amber-400 border-amber-500/20'
                             }`}>
                               {report.crossReferenceStatus}
                             </span>
                           )}
                         </div>
                      </div>
                    ) : (
                      <span className="text-slate-600 italic text-xs">Processing...</span>
                    )}
                  </td>
                  <td className="p-5">
                    {report.priorityLevel ? (
                      <div className="flex flex-col gap-1">
                        <span className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
                          ${report.priorityLevel === PriorityLevel.CRITICAL ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20 animate-pulse' :
                            report.priorityLevel === PriorityLevel.HIGH ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                            report.priorityLevel === PriorityLevel.MEDIUM ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}
                        `}>
                          {report.priorityLevel}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Score: {report.priorityScore}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-5">
                    <span className={`
                      inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                      ${report.status === ReportStatus.VERIFIED ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        report.status === ReportStatus.FAKE ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        report.status === ReportStatus.SUSPICIOUS ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'}
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                         report.status === ReportStatus.VERIFIED ? 'bg-emerald-400' : 
                         report.status === ReportStatus.FAKE ? 'bg-red-400' :
                         report.status === ReportStatus.SUSPICIOUS ? 'bg-orange-400' :
                         'bg-blue-400'
                      }`}></span>
                      {report.status}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    {/* Smart Context Menu Implementation */}
                    <SmartContextMenu trigger={<MoreHorizontal size={18} />}>
                       <button 
                         onClick={() => setSelectedReport(report)}
                         className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                       >
                         <Eye size={14} /> View Details
                       </button>
                       {report.status === ReportStatus.PENDING && (
                         <>
                           <button 
                             onClick={() => updateReportStatus(report.id, ReportStatus.VERIFIED)}
                             className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors text-left"
                           >
                             <Check size={14} /> Approve Report
                           </button>
                           <button 
                             onClick={() => updateReportStatus(report.id, ReportStatus.FAKE)}
                             className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                           >
                             <ShieldAlert size={14} /> Mark as Fake
                           </button>
                         </>
                       )}
                       <div className="h-px bg-midnight-700 my-1 mx-2"></div>
                       <button 
                         onClick={() => setReportToDelete(report)}
                         className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors text-left"
                       >
                         <Trash2 size={14} /> Delete Report
                       </button>
                    </SmartContextMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredReports.length === 0 && (
          <div className="p-16 text-center text-slate-500">
            <Filter size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No reports found.</p>
            <p className="text-sm">Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-midnight-950/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setReportToDelete(null)}
          ></div>
          <div className="relative z-10 w-full max-w-md bg-midnight-900 border border-midnight-700 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold">Confirm Deletion</h3>
            </div>
            
            <p className="text-slate-300 mb-6 leading-relaxed">
              Are you sure you want to delete the report <span className="text-white font-bold">"{reportToDelete.description}"</span>? This action cannot be undone.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setReportToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deleteReport(reportToDelete.id);
                  setReportToDelete(null);
                }}
                className="px-6 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spotlight Mode Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* Spotlight Overlay */}
          {/* The radial gradient creates a 'hole' of transparency in the center, surrounded by darkness */}
          <div 
            className="absolute inset-0 backdrop-blur-[2px] animate-in fade-in duration-500"
            style={{
              background: 'radial-gradient(circle at center, transparent 0%, #020617 70%)',
              backgroundColor: 'rgba(2, 6, 23, 0.8)' // Fallback / Mix
            }}
            onClick={() => setSelectedReport(null)}
          ></div>

          <div className="relative z-10 w-full max-w-2xl bg-midnight-950 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/10">
            <div className="relative h-72 bg-midnight-900 group">
              <img src={selectedReport.mediaUrl} alt="Report" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-midnight-950/20 to-transparent"></div>
              
              <div className={`absolute top-4 right-4 ${selectedReport.isSOS ? 'bg-red-600 shadow-[0_0_15px_#dc2626]' : 'bg-black/60'} backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-bold border border-white/10 tracking-wide`}>
                {selectedReport.isSOS ? 'SOS EMERGENCY' : selectedReport.category}
              </div>
              
              <button 
                onClick={() => setSelectedReport(null)}
                className="absolute top-4 left-4 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-all border border-white/10 hover:rotate-90 duration-300"
              >
                <X size={20} />
              </button>
              
              <div className="absolute bottom-4 left-6 right-6">
                <h3 className="text-2xl font-bold text-white mb-1 shadow-black drop-shadow-lg">{selectedReport.description}</h3>
                <p className="text-sm text-slate-300 font-medium drop-shadow-md">Reported by {selectedReport.userName} • {new Date(selectedReport.timestamp).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-midnight-800">
                 <div className="flex items-center gap-4">
                    <div className="bg-midnight-900 p-3 rounded-xl border border-midnight-800">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">Coordinates</p>
                      <p className="text-white font-mono">{selectedReport.location.latitude.toFixed(5)}, {selectedReport.location.longitude.toFixed(5)}</p>
                    </div>
                    <div className="bg-midnight-900 p-3 rounded-xl border border-midnight-800">
                       <p className="text-xs text-slate-500 uppercase font-bold mb-1">Status</p>
                       <p className={`font-bold ${
                         selectedReport.status === ReportStatus.VERIFIED ? 'text-emerald-400' : 'text-slate-200'
                       }`}>{selectedReport.status}</p>
                    </div>
                 </div>

                 <div className="text-right">
                   <p className="text-xs text-slate-400 font-bold uppercase">AI Confidence</p>
                   <p className={`text-3xl font-display font-bold ${selectedReport.aiConfidence && selectedReport.aiConfidence > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                     {selectedReport.aiConfidence}%
                   </p>
                </div>
              </div>

              <div className="bg-midnight-900 p-5 rounded-xl border border-midnight-800 mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-600"></div>
                <h4 className="text-sm font-bold text-neon-cyan mb-2 flex items-center gap-2">
                  <AlertTriangle size={16} /> AI REASONING ENGINE
                </h4>
                <p className="text-sm text-slate-300 italic leading-relaxed mb-3">"{selectedReport.aiReasoning || 'Analysis pending...'}"</p>
                
                {selectedReport.crossReferenceStatus && (
                  <div className="mt-4 pt-4 border-t border-midnight-800">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Cross-Reference Result</p>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        selectedReport.crossReferenceStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        selectedReport.crossReferenceStatus === 'Old News' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {selectedReport.crossReferenceStatus}
                      </span>
                      {selectedReport.crossReferenceSource && (
                        <a 
                          href={selectedReport.crossReferenceSource} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-ocean-400 hover:text-ocean-300 flex items-center gap-1 underline"
                        >
                          View Source <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                   onClick={() => setSelectedReport(null)}
                   className="px-6 py-2.5 rounded-xl text-slate-300 hover:text-white font-medium hover:bg-white/5 transition-colors"
                >
                  Close Review
                </button>
                {selectedReport.status === ReportStatus.PENDING && (
                  <>
                    <button 
                      onClick={() => {
                        updateReportStatus(selectedReport.id, ReportStatus.FAKE);
                        setSelectedReport(null);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/50 font-bold transition-colors"
                    >
                      Mark Fake
                    </button>
                    <button 
                      onClick={() => {
                        updateReportStatus(selectedReport.id, ReportStatus.VERIFIED);
                        setSelectedReport(null);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 font-bold transition-all flex items-center gap-2"
                    >
                      <Check size={18} /> Verify & Alert
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-midnight-950/80 backdrop-blur-sm">
          <div className="bg-midnight-900 border border-midnight-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <ShieldAlert size={24} />
              <h3 className="text-xl font-bold">Delete All Reports?</h3>
            </div>
            <p className="text-slate-300 mb-6">
              This action will permanently remove <span className="text-white font-bold">{reports.length}</span> reports from the system. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  deleteAllReports();
                  setShowDeleteAllConfirm(false);
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-bold transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};