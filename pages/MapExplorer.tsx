
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HazardCategory, ReportStatus, LocationForecast } from '../types';
import { Layers, Thermometer, Wind, Filter, MapPin, Siren, Flame, Waves, CloudRain, Search, Calendar, Droplets, Sun, Cloud, CloudLightning, CloudFog, Loader2, ExternalLink } from 'lucide-react';
import { getWeatherForecast } from '../services/geminiService';

export const MapExplorer: React.FC = () => {
  const { reports } = useApp();
  const [activeTab, setActiveTab] = useState<'incidents' | 'windy' | 'forecast'>('incidents');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeFilters, setActiveFilters] = useState<HazardCategory[]>(Object.values(HazardCategory));
  
  // Forecast State
  const [searchLocation, setSearchLocation] = useState('Chennai'); // Default
  const [forecastData, setForecastData] = useState<LocationForecast | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 13.0827, lng: 80.2707 }); // Default to Chennai

  const toggleFilter = (cat: HazardCategory) => {
    if (activeFilters.includes(cat)) {
      setActiveFilters(activeFilters.filter(c => c !== cat));
    } else {
      setActiveFilters([...activeFilters, cat]);
    }
  };

  const filteredReports = reports.filter(r => activeFilters.includes(r.category));

  const handleForecastSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim()) return;

    setIsLoadingForecast(true);
    const data = await getWeatherForecast(searchLocation);
    
    if (data) {
      setForecastData(data);
      setMapCenter({ lat: data.latitude, lng: data.longitude });
    }
    setIsLoadingForecast(false);
  };

  // Auto-load forecast if tab is clicked and no data
  const switchTab = (tab: 'incidents' | 'windy' | 'forecast') => {
    setActiveTab(tab);
    if (tab === 'forecast' && !forecastData) {
      // Trigger search for default or current text
      handleForecastSearch({ preventDefault: () => {} } as any);
    }
  };

  // Category Colors
  const getCategoryColor = (cat: HazardCategory) => {
    switch (cat) {
      case HazardCategory.FIRE: return 'bg-orange-500';
      case HazardCategory.TSUNAMI: return 'bg-purple-600';
      case HazardCategory.FLOODING: return 'bg-blue-500';
      case HazardCategory.CYCLONE: return 'bg-cyan-500';
      case HazardCategory.HIGH_WAVES: return 'bg-indigo-500';
      default: return 'bg-slate-500';
    }
  };

  const getCategoryIcon = (cat: HazardCategory) => {
    switch (cat) {
      case HazardCategory.FIRE: return <Flame size={14} />;
      case HazardCategory.TSUNAMI: return <Waves size={14} />;
      case HazardCategory.FLOODING: return <CloudRain size={14} />;
      case HazardCategory.CYCLONE: return <Wind size={14} />;
      default: return <Siren size={14} />;
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny': return <Sun size={32} className="text-yellow-400" />;
      case 'Cloudy': return <Cloud size={32} className="text-slate-400" />;
      case 'Rain': return <CloudRain size={32} className="text-blue-400" />;
      case 'Storm': return <CloudLightning size={32} className="text-purple-400" />;
      case 'Fog': return <CloudFog size={32} className="text-slate-300" />;
      case 'Windy': return <Wind size={32} className="text-cyan-400" />;
      default: return <Sun size={32} />;
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-midnight-900 p-4 rounded-xl border border-midnight-800 shadow-lg">
        <div className="flex flex-wrap gap-2 bg-midnight-950 p-1 rounded-lg border border-midnight-800">
          <button
            onClick={() => switchTab('incidents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'incidents' 
                ? 'bg-ocean-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapPin size={16} /> Live Incidents
          </button>
          <button
            onClick={() => switchTab('windy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'windy' 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wind size={16} /> Windy.com
          </button>
          <button
            onClick={() => switchTab('forecast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'forecast' 
                ? 'bg-cyan-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar size={16} /> 10-Day Forecast
          </button>
        </div>

        {activeTab === 'incidents' && (
          <div className="flex items-center gap-4 overflow-x-auto pb-1 xl:pb-0 w-full xl:w-auto">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${
                showHeatmap 
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                  : 'bg-midnight-950 border-midnight-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <Layers size={14} /> Heatmap Mode
            </button>
            <div className="h-6 w-px bg-midnight-800 hidden xl:block"></div>
            <div className="flex gap-1">
              {Object.values(HazardCategory).map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    activeFilters.includes(cat)
                      ? `${getCategoryColor(cat)} text-white shadow-md`
                      : 'bg-midnight-950 text-slate-500 border border-midnight-800 hover:border-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'forecast' || activeTab === 'windy') && (
           <form onSubmit={handleForecastSearch} className="flex gap-2 w-full xl:w-auto">
             <div className="relative flex-1 xl:w-64">
               <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
               <input 
                 type="text"
                 value={searchLocation}
                 onChange={(e) => setSearchLocation(e.target.value)}
                 placeholder="Enter City (e.g., Chennai)"
                 className="w-full bg-midnight-950 border border-midnight-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:ring-1 focus:ring-cyan-500 outline-none"
               />
             </div>
             <button 
               type="submit"
               disabled={isLoadingForecast}
               className="bg-ocean-600 hover:bg-ocean-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-colors disabled:opacity-50"
             >
               {isLoadingForecast ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
             </button>
           </form>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-midnight-950 rounded-2xl border border-midnight-800 relative overflow-hidden shadow-2xl flex flex-col">
        
        {/* TAB 1: LIVE INCIDENTS MAP */}
        {activeTab === 'incidents' && (
          <div className="w-full h-full relative group bg-[#020617] overflow-hidden">
             {/* Base Map Grid */}
             <div className="absolute inset-0 opacity-20" 
              style={{ 
                backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px)', 
                backgroundSize: '40px 40px' 
              }}>
            </div>
            
            {/* SVG Map Shape (Simplified Coastline) */}
            <svg className="absolute inset-0 w-full h-full text-midnight-800 pointer-events-none" preserveAspectRatio="none">
               <defs>
                 <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" style={{stopColor:'#0f172a', stopOpacity:1}} />
                   <stop offset="100%" style={{stopColor:'#1e293b', stopOpacity:1}} />
                 </linearGradient>
               </defs>
               <path d="M0,0 L0,1000 L1000,1000 Q800,800 600,600 T400,200 L400,0 Z" fill="url(#landGradient)" className="drop-shadow-2xl" />
               <path d="M0,0 Q200,300 400,100 T800,200 T1200,400 L1200,800 L0,800 Z" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="5,5" />
            </svg>

            {/* Pins / Heatmap Points */}
            {filteredReports.map((report) => (
              <div 
                key={report.id}
                className="absolute transition-all duration-700 ease-in-out cursor-pointer"
                style={{ 
                  left: `${((report.location.longitude - 79) * 20)}%`, 
                  top: `${((14 - report.location.latitude) * 20)}%`
                }}
              >
                {showHeatmap ? (
                  // Heatmap Blob
                  <div className={`
                     w-64 h-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px] opacity-60 mix-blend-screen animate-pulse
                     ${getCategoryColor(report.category)}
                  `}></div>
                ) : (
                  // Standard Pin
                  <div className="relative group/pin">
                    <div className={`
                      p-2.5 rounded-full border-2 shadow-xl shadow-black hover:scale-125 transition-transform z-10 relative
                      ${report.status === ReportStatus.VERIFIED ? 'bg-emerald-500 border-emerald-300 shadow-emerald-500/40' : 
                        report.status === ReportStatus.FAKE ? 'bg-red-500 border-red-300' : 
                        getCategoryColor(report.category) + ' border-white/50'}
                    `}>
                      <div className="text-white">
                         {getCategoryIcon(report.category)}
                      </div>
                    </div>
                    {/* Pulse Effect */}
                    <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${getCategoryColor(report.category)}`}></div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 bg-midnight-900/95 backdrop-blur-md border border-midnight-700 text-xs p-4 rounded-xl hidden group-hover/pin:block z-50 shadow-2xl">
                      <p className="font-bold text-white mb-1.5 text-sm">{report.category}</p>
                      <p className="text-slate-300 mb-3 leading-relaxed border-b border-white/10 pb-2">{report.description}</p>
                      <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                         <span>{new Date(report.timestamp).toLocaleTimeString()}</span>
                         <span className={report.status === 'Verified' ? 'text-emerald-400' : 'text-slate-400'}>{report.status}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Legend */}
            {!showHeatmap && (
               <div className="absolute bottom-6 right-6 bg-midnight-900/90 backdrop-blur p-4 rounded-xl border border-midnight-700 shadow-2xl text-xs space-y-2.5 pointer-events-none">
                 <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-3">Hazard Legend</h4>
                 {Object.values(HazardCategory).map(cat => (
                   <div key={cat} className="flex items-center gap-3 text-slate-300">
                     <span className={`w-3 h-3 rounded-full ${getCategoryColor(cat)} shadow-sm`}></span>
                     <span className="font-medium">{cat}</span>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {/* TAB 2: WINDY EMBED */}
        {activeTab === 'windy' && (
           <iframe 
             width="100%" 
             height="100%" 
             src={`https://embed.windy.com/embed2.html?lat=${mapCenter.lat}&lon=${mapCenter.lng}&detailLat=${mapCenter.lat}&detailLon=${mapCenter.lng}&width=650&height=450&zoom=7&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`}
             frameBorder="0"
             className="w-full h-full filter contrast-125 saturate-150"
             title="Windy Map"
           ></iframe>
        )}

        {/* TAB 3: 10-DAY FORECAST */}
        {activeTab === 'forecast' && (
           <div className="w-full h-full p-6 overflow-y-auto">
              {!forecastData && !isLoadingForecast ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Cloud size={64} className="mb-4 opacity-30" />
                    <p>Enter a location above to see the 10-day forecast.</p>
                 </div>
              ) : isLoadingForecast ? (
                 <div className="flex flex-col items-center justify-center h-full text-cyan-400">
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <p className="animate-pulse">Searching Google for {searchLocation}...</p>
                 </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-end justify-between mb-8">
                      <div>
                         <h2 className="text-3xl font-display font-bold text-white mb-1">{forecastData?.locationName}</h2>
                         <p className="text-slate-400 flex items-center gap-2 text-sm">
                           <MapPin size={14} /> {forecastData?.latitude.toFixed(2)}, {forecastData?.longitude.toFixed(2)}
                         </p>
                         {forecastData?.sourceUri && (
                            <a href={forecastData.sourceUri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2">
                               <ExternalLink size={10} /> Source: Google Search
                            </a>
                         )}
                      </div>
                      <div className="text-right">
                         <div className="text-4xl font-bold text-white flex items-center justify-end gap-3">
                           {getWeatherIcon(forecastData?.days[0].condition || 'Sunny')}
                           {forecastData?.days[0].tempMax}°
                         </div>
                         <p className="text-cyan-400 font-bold uppercase text-sm mt-1">{forecastData?.days[0].condition}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {forecastData?.days.map((day) => (
                        <div 
                          key={day.date} 
                          className={`p-4 rounded-2xl border transition-all hover:-translate-y-1 ${
                            day.date === forecastData?.days[0].date 
                              ? 'bg-gradient-to-br from-ocean-900 to-midnight-900 border-ocean-500/50 shadow-lg shadow-ocean-900/20' 
                              : 'bg-midnight-900 border-midnight-800 hover:border-slate-600'
                          }`}
                        >
                           <p className="text-slate-400 text-xs font-bold uppercase mb-1">{day.date === forecastData?.days[0].date ? 'Today' : day.dayName}</p>
                           <p className="text-white text-sm font-medium mb-3">{new Date(day.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                           
                           <div className="flex justify-between items-center mb-4">
                              {getWeatherIcon(day.condition)}
                              <div className="text-right">
                                <span className="block text-xl font-bold text-white">{day.tempMax}°</span>
                                <span className="block text-xs text-slate-500">{day.tempMin}°</span>
                              </div>
                           </div>

                           <div className="space-y-2">
                             <div className="flex items-center justify-between text-xs text-slate-400 bg-black/20 p-1.5 rounded-lg">
                               <span className="flex items-center gap-1"><Wind size={12}/> Wind</span>
                               <span className="font-bold text-slate-300">{day.windSpeed} km/h</span>
                             </div>
                             <div className="flex items-center justify-between text-xs text-slate-400 bg-black/20 p-1.5 rounded-lg">
                               <span className="flex items-center gap-1"><Droplets size={12}/> Rain</span>
                               <span className="font-bold text-slate-300">{day.precipitationChance}%</span>
                             </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
};
