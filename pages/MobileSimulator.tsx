
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { HazardCategory, ReportStatus, Report, MeshLog, LocationForecast, UserRole, ConnectivityMode, PriorityLevel } from '../types';
import { Camera, MapPin, Upload, AlertTriangle, CheckCircle, Smartphone, Wifi, WifiOff, Siren, X, MessageSquare, Loader2, Send, Radio, Bluetooth, Share2, Shield, Activity, RefreshCw, User, CloudSun, Wind, Droplets, Thermometer, Sun, ExternalLink, Search, Zap, Battery, Signal, ShieldCheck, CheckCircle2, XCircle, Flame, Waves, Mountain, Info, Phone, Check, Network, Link, Map, Navigation, Building2, Hospital as HospitalIcon, ShieldAlert, Layers } from 'lucide-react';
import { verifyHazardReport, getWeatherForecast, getSafeZones } from '../services/geminiService';
import { MeshService } from '../services/meshNetwork';
import { Logo } from '../components/Logo';

export const MobileSimulator: React.FC = () => {
  const { 
    addReport, 
    currentUser, 
    users, 
    isOnline, 
    toggleNetworkStatus, 
    offlineQueue, 
    triggerSOS,
    latestNotification,
    clearNotification,
    t,
    reports,
    electricalZones,
    toggleShutdown,
    broadcastAlert,
    sendDirectSMS,
    // Connectivity
    connectivityMode,
    setConnectivityMode,
    // Safe Zones
    safeZones,
    setSafeZones,
    // Mesh
    isMeshActive,
    toggleMeshNetwork,
    meshPeers,
    meshLogs,
    sendMeshMessage,
    messages
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'weather' | 'report' | 'safety' | 'connectivity' | 'map' | 'social' | 'grid' | 'profile' | 'more'>('dashboard');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isSOSConfirming, setIsSOSConfirming] = useState(false);
  const [sosProgress, setSosProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const sosIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [category, setCategory] = useState<HazardCategory>(HazardCategory.OTHER);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'locked'>('idle');
  const [currentGPS, setCurrentGPS] = useState<{lat: number, lng: number} | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [mapMode, setMapMode] = useState<'standard' | 'heatmap'>('standard');
  const [nearbyAlerts, setNearbyAlerts] = useState<any[]>([]);
  
  // Weather State
  const [weather, setWeather] = useState<LocationForecast | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState('Chennai');
  
  // Mesh Chat State
  const [meshInput, setMeshInput] = useState('');
  const [selectedPeerId, setSelectedPeerId] = useState<string>(MeshService.BROADCAST_ID);
  
  // Map State
  const [mapSearchQuery, setMapSearchQuery] = useState('Chennai');
  const [loadingSafeZones, setLoadingSafeZones] = useState(false);
  const [showQuickCheck, setShowQuickCheck] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sirenContextRef = useRef<AudioContext | null>(null);
  const myself = users.find(u => u.id === currentUser?.id);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeTab === 'connectivity') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  useEffect(() => {
    if (activeTab === 'weather' && !weather) {
      handleWeatherSearch();
    }
    if (activeTab === 'map' && safeZones.length <= 5) {
      handleMapSearch();
    }
  }, [activeTab]);

  // Initial load
  useEffect(() => {
    handleWeatherSearch();
    handleMapSearch();
  }, []);

  const handleRefreshWeather = () => {
    handleWeatherSearch();
  };

  const handleMapSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mapSearchQuery.trim()) return;
    
    setLoadingSafeZones(true);
    try {
      const zones = await getSafeZones(mapSearchQuery);
      if (zones && zones.length > 0) {
        setSafeZones(zones);
        // Update map center mock
        if (zones[0].location) {
          setCurrentGPS({
            lat: zones[0].location.latitude,
            lng: zones[0].location.longitude
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSafeZones(false);
    }
  };

  const handleWeatherSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!weatherLocation.trim()) return;
    
    setLoadingWeather(true);
    const data = await getWeatherForecast(weatherLocation);
    if (data) {
      setWeather(data);
    }
    setLoadingWeather(false);
  };

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio generation failed:", e);
    }
  };

  const startSiren = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      sirenContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = 600; 

      lfo.type = 'sawtooth';
      lfo.frequency.value = 2; 
      lfoGain.gain.value = 300; 

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.value = 0.2; 

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      lfo.start();
      osc.start();
    } catch (e) {
      console.error("Siren generation failed:", e);
    }
  };

  const stopSiren = () => {
    if (sirenContextRef.current) {
      sirenContextRef.current.close().catch(e => console.error(e));
      sirenContextRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Instead of alert, we'll just set an error state or log it
      setSuccessMessage("Camera access denied. Please check browser permissions.");
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Resize to max 800px for faster submission
      const maxDim = 800;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        // Use 0.7 quality for JPEG to reduce payload size significantly
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    let interval: any;
    if (locationStatus === 'locating') {
      interval = setInterval(() => {
        setCurrentGPS({
          lat: 13.08 + (Math.random() * 0.002),
          lng: 80.27 + (Math.random() * 0.002)
        });
      }, 1000);
      
      setTimeout(() => {
        setLocationStatus('locked');
        clearInterval(interval);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [locationStatus]);

  useEffect(() => {
    setLocationStatus('locating');
  }, []);

  useEffect(() => {
    if (latestNotification) {
      if (latestNotification.targetPhoneNumber && latestNotification.targetPhoneNumber !== currentUser?.phoneNumber) {
        return;
      }
      setShowNotification(true);
      playNotificationSound();
      
      const timer = setTimeout(() => {
        setShowNotification(false);
        clearNotification();
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      setShowNotification(false);
    }
  }, [latestNotification, clearNotification, currentUser]);

  const handleMeshSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meshInput.trim()) return;
    sendMeshMessage(meshInput, selectedPeerId);
    setMeshInput('');
  };

  const getFilteredMessages = () => {
    return messages.filter(m => 
      m.receiverId === 'Broadcast' || m.senderId === 'me' || m.receiverId === 'me'
    ).slice(-20);
  };

  if (myself?.isBanned) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-red-500/10 p-6 rounded-full mb-4">
          <AlertTriangle size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-red-500 mb-2">Account Suspended</h2>
        <p className="text-slate-400">Your account has been flagged for submitting multiple fake reports.</p>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const img = new Image();
        img.src = base64;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setImage(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSOS = () => {
    if (!currentGPS || sosActive) return;
    setIsSOSConfirming(true);
    setSosProgress(0);
    setCountdown(3);
  };

  const startSOSConfirm = () => {
    if (sosIntervalRef.current) return;
    
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    const startTime = Date.now();
    sosIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setSosProgress(progress);
      
      const currentCountdown = Math.max(Math.ceil((3000 - elapsed) / 1000), 1);
      setCountdown(currentCountdown);
      
      if (progress >= 100) {
        cancelSOSConfirm();
        triggerFinalSOS();
      }
    }, 50);
  };

  const cancelSOSConfirm = () => {
    if (sosIntervalRef.current) {
      clearInterval(sosIntervalRef.current);
      sosIntervalRef.current = null;
    }
    setSosProgress(0);
    setCountdown(3);
  };

  const triggerFinalSOS = () => {
    if (!currentGPS || sosActive) return;
    setSosActive(true);
    
    // Intelligent SOS Feedback
    if (isOnline) {
      setSuccessMessage("CONTACTING EMERGENCY SERVICES...");
    } else {
      setSuccessMessage("BROADCASTING MESH SOS...");
    }
    
    startSiren();
    
    setTimeout(() => {
      setIsSOSConfirming(false);
      triggerSOS(currentGPS);
      
      if (isOnline) {
        setSuccessMessage("SOS SENT VIA NETWORK");
      } else {
        setSuccessMessage("SOS BROADCASTED VIA MESH");
      }
      
      if (window.navigator.vibrate) {
        window.navigator.vibrate([200, 100, 200]);
      }

      setTimeout(() => {
        stopSiren();
        setSuccessMessage(null);
      }, 5000);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let initialStatus = ReportStatus.PENDING;
    let aiResult = null;

    if (isOnline) {
      try {
        const base64Data = image ? image.split(',')[1] : undefined;
        aiResult = await verifyHazardReport(description, base64Data);
        if (aiResult.isFake) initialStatus = ReportStatus.FAKE;
        else if (aiResult.isHazard && aiResult.confidence > 80) initialStatus = ReportStatus.VERIFIED;
        else if (!aiResult.isHazard) initialStatus = ReportStatus.SUSPICIOUS;
      } catch (err) {
        console.error(err);
      }
    }

    const newReport: Report = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: currentUser!.id,
      userName: currentUser!.name,
      category,
      description,
      location: { 
        latitude: currentGPS?.lat || 13.0827,
        longitude: currentGPS?.lng || 80.2707,
        accuracy: 5
      },
      timestamp: Date.now(),
      status: initialStatus,
      mediaUrl: image || 'https://picsum.photos/400/300',
      aiConfidence: aiResult?.confidence,
      aiReasoning: aiResult?.reasoning,
      priorityScore: aiResult?.priorityScore,
      priorityLevel: aiResult?.severity as any,
      crossReferenceStatus: aiResult?.isAiGenerated ? 'AI Generated' : (aiResult?.isStockPhoto ? 'Stock Photo' : (aiResult?.isOldNews ? 'Old News' : (aiResult?.isFake ? 'Potential Duplicate' : 'Verified'))),
      crossReferenceSource: aiResult?.sourceUrl
    };

    addReport(newReport);
    setIsSubmitting(false);
    setSuccessMessage(isOnline ? "Report Sent" : "Saved Offline");
    
    setTimeout(() => {
      setSuccessMessage(null);
      setDescription('');
      setImage(null);
      setCategory(HazardCategory.OTHER);
    }, 3000);
  };

  if (successMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-white rounded-xl shadow-2xl max-w-sm mx-auto p-8 border border-slate-300 relative overflow-hidden">
        {successMessage.includes("SOS") ? (
           <div className="flex flex-col items-center animate-pulse-fast">
             <div className="bg-red-100 p-6 rounded-full mb-4">
               <Siren size={64} className="text-red-600 animate-bounce" />
             </div>
             <h3 className="text-2xl font-black text-red-600 text-center uppercase tracking-wider">{t('sosActive')}</h3>
             <p className="text-slate-500 text-center text-sm">Help is on the way.</p>
           </div>
        ) : (
          <div className="flex flex-col items-center animate-in zoom-in duration-300">
             <CheckCircle size={64} className="text-green-500 mb-4" />
             <h3 className="text-xl font-bold text-slate-800 text-center">{successMessage}</h3>
             {successMessage.includes("Offline") && <p className="text-slate-500 text-center mt-2 text-sm">Will auto-sync when online.</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start min-h-screen pt-4 pb-10">
      {/* Simulator Controls - Keeping purely functional controls side by side */}
      <div className="absolute top-24 left-10 hidden xl:block bg-midnight-900 p-4 rounded-xl border border-midnight-800 w-64 shadow-2xl">
         <h3 className="text-white font-display font-bold mb-3 border-b border-midnight-800 pb-2 tracking-wide">{t('simulatorControls')}</h3>
         <button 
           onClick={toggleNetworkStatus}
           className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2.5 ${
             isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
           }`}
         >
           {isOnline ? <Wifi size={16}/> : <WifiOff size={16}/>}
           {isOnline ? t('networkOnline') : t('networkOffline')}
         </button>
         <div className="text-xs text-slate-400 mt-2">
           Offline Queue: <span className="text-neon-cyan font-bold">{offlineQueue.length}</span> reports
         </div>
      </div>

      {/* Generic Mobile Screen Container - Premium Look */}
      <div className="bg-slate-50 w-[380px] h-[800px] rounded-[3.5rem] border-[12px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col mx-auto ring-4 ring-slate-800/20">
        
        {/* Modern Status Bar */}
        <div className="h-10 bg-ocean-600 w-full flex justify-between items-center px-8 shadow-sm z-20 relative">
           <div className="absolute left-1/2 -translate-x-1/2 top-0 w-32 h-6 bg-slate-900 rounded-b-2xl z-30" />
           <span className="text-[11px] text-white font-bold tracking-tight">
             {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </span>
           <div className="flex items-center gap-2.5 text-white/90">
             <Signal size={12} className={isOnline ? 'text-white' : 'text-white/30'} />
             {isOnline ? <Wifi size={12} /> : <WifiOff size={12} className="text-red-300" />}
             <div className="flex items-center gap-1">
               <span className="text-[10px] font-bold">88%</span>
               <Battery size={14} className="text-white" />
             </div>
           </div>
        </div>

        {showNotification && latestNotification && (
          <div className="absolute top-10 left-2 right-2 z-50 animate-in slide-in-from-top-4 duration-500">
             <div className="bg-midnight-900/95 backdrop-blur text-white p-4 rounded-xl shadow-2xl border border-midnight-700 flex gap-4 items-start ring-1 ring-neon-cyan/50">
                <div className="bg-green-500 p-2.5 rounded-full shrink-0">
                  <MessageSquare size={20} fill="white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm tracking-wide">MESSAGES • Now</h4>
                  </div>
                  <p className="font-bold text-sm mb-1 truncate text-white">{latestNotification.title}</p>
                  <p className="text-xs text-slate-300 leading-snug">{latestNotification.message}</p>
                </div>
                <button onClick={() => { setShowNotification(false); clearNotification(); }} className="text-slate-400 hover:text-white shrink-0"><X size={16}/></button>
             </div>
          </div>
        )}

        {isCameraOpen && (
          <div className="absolute inset-0 bg-black z-40 flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-10 left-0 w-full flex justify-center items-center gap-8">
               <button onClick={stopCamera} className="bg-white/20 p-4 rounded-full text-white backdrop-blur">
                 <X size={24} />
               </button>
               <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 shadow-lg active:scale-95 transition-transform"></button>
            </div>
          </div>
        )}

        {/* App Header */}
        <div className="bg-gradient-to-b from-ocean-600 to-ocean-700 p-6 pt-6 pb-4 shadow-lg z-10 relative">
          <div className="flex justify-between items-start mb-6">
             <div className="flex flex-col text-white">
               <div className="flex items-center gap-2 mb-1">
                 <h2 className="font-display font-bold tracking-wide text-xl">Citizen Sentinel</h2>
                 <div className={`flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full border ${isOnline ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                   {isOnline ? <Wifi size={8} /> : <WifiOff size={8} />}
                   {isOnline ? 'ONLINE' : 'OFFLINE'}
                 </div>
               </div>
               <p className="text-[10px] text-ocean-100 opacity-80">Report Hazards • Save Lives</p>
             </div>
             <div className="text-[10px] text-ocean-100 bg-ocean-800/50 px-3 py-1 rounded-full border border-ocean-500/30 font-mono">
               {currentUser?.phoneNumber || "No SIM"}
             </div>
          </div>
          
          <div className="flex justify-center -mb-12">
            <button 
                onClick={handleSOS}
                disabled={sosActive}
                className={`
                  group relative w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 shadow-2xl transition-all duration-300
                  ${sosActive ? 'bg-red-700 scale-95' : 'bg-gradient-to-b from-red-500 to-red-700 hover:scale-105 active:scale-95'}
                  border-4 border-white/20
                `}
            >
                <span className={`absolute inset-0 rounded-full bg-red-500 opacity-50 animate-ping ${sosActive ? 'block' : 'hidden'}`}></span>
                <Siren size={28} className="text-white drop-shadow-md" />
                <span className="text-white font-black text-[10px] tracking-widest">{t('sos')}</span>
            </button>
          </div>
        </div>

        {/* Emergency SOS Overlay */}
        {isSOSConfirming && (
          <div className="absolute inset-0 z-[100] bg-white flex flex-col items-center justify-between p-8 animate-in fade-in duration-300">
            {/* Top Section */}
            <div className="text-center mt-12">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Emergency SOS</h2>
              <p className="text-slate-500 font-medium mb-6">Immediate assistance will be requested</p>
            </div>

            {/* Center Button */}
            <div className="relative flex items-center justify-center">
              {/* Circular Progress Ring */}
              <svg className="absolute w-64 h-64 -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-100"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 110}
                  strokeDashoffset={2 * Math.PI * 110 * (1 - sosProgress / 100)}
                  className="text-red-600 transition-all duration-75"
                  strokeLinecap="round"
                />
              </svg>

              {/* Main Button */}
              <button
                onMouseDown={startSOSConfirm}
                onMouseUp={cancelSOSConfirm}
                onMouseLeave={cancelSOSConfirm}
                onTouchStart={startSOSConfirm}
                onTouchEnd={cancelSOSConfirm}
                className={`
                  relative w-48 h-48 rounded-full flex flex-col items-center justify-center p-6 text-center transition-all duration-300
                  ${sosProgress > 0 
                    ? 'scale-95 bg-red-50 shadow-[0_0_40px_rgba(220,38,38,0.3)]' 
                    : 'scale-100 bg-white hover:bg-red-50 shadow-[0_0_20px_rgba(220,38,38,0.1)]'}
                  border-4 border-red-600
                `}
              >
                {/* Pulsing background for SOS */}
                <div className="absolute inset-0 rounded-full bg-red-600 opacity-5 animate-ping" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-red-600 font-black text-7xl mb-1 drop-shadow-sm">{countdown}</span>
                  <div className="h-1 w-12 bg-red-600/20 rounded-full mb-3" />
                  <span className="text-red-600 font-extrabold text-[10px] leading-tight uppercase tracking-[0.15em] max-w-[120px]">
                    Hold to Send Emergency SOS
                  </span>
                </div>
              </button>
            </div>

            {/* Bottom Cancel Bar - Slide to Cancel */}
            <div className="w-full max-w-xs relative h-16 bg-slate-100 rounded-full p-1 overflow-hidden select-none mb-4 border border-slate-200/50">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.span 
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] ml-8"
                >
                  Slide to Cancel
                </motion.span>
              </div>
              
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 240 }}
                dragElastic={0.05}
                dragMomentum={false}
                onDragEnd={(event, info) => {
                  // If slid more than 70% of the way
                  if (info.offset.x > 180) {
                    cancelSOSConfirm();
                    setIsSOSConfirming(false);
                    if (window.navigator.vibrate) {
                      window.navigator.vibrate(30);
                    }
                  }
                }}
                className="h-14 w-14 bg-white rounded-full shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing z-10 border border-slate-200 group"
                whileTap={{ scale: 0.95 }}
              >
                <div className="bg-slate-100 p-2 rounded-full group-hover:bg-red-50 transition-colors">
                  <X className="text-red-600" size={20} />
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 px-5 pb-24 overflow-y-auto bg-slate-50 scrollbar-hide relative mt-12">
          
          {activeTab === 'report' && (
            <div className="space-y-4 pt-2">
              {/* Quick Weather Widget on Report Tab */}
              {weather && (
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      {weather.current.condition.includes('Rain') ? <Droplets size={20} /> : 
                       weather.current.condition.includes('Cloud') ? <CloudSun size={20} /> :
                       <Sun size={20} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Current Weather</p>
                      <p className="text-sm font-black">{weather.current.temp}°C • {weather.current.condition}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('weather')}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              )}

              {/* Quick Flood Question */}
              {showQuickCheck && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Waves size={16} className="text-blue-600" />
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Quick Check</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Is there flooding in your current area?</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setCategory(HazardCategory.FLOODING);
                          setDescription("Quick report: Flooding observed in this area.");
                          // We'll trigger a simplified submit
                          const quickReport: Report = {
                            id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                            userId: currentUser!.id,
                            userName: currentUser!.name,
                            category: HazardCategory.FLOODING,
                            description: "Quick report: Flooding observed in this area.",
                            location: { 
                              latitude: currentGPS?.lat || 13.0827,
                              longitude: currentGPS?.lng || 80.2707,
                              accuracy: 5
                            },
                            timestamp: Date.now(),
                            status: ReportStatus.VERIFIED,
                            mediaUrl: 'https://picsum.photos/seed/flood/400/300',
                            priorityLevel: PriorityLevel.HIGH as any,
                            priorityScore: 85
                          };
                          addReport(quickReport);
                          setShowQuickCheck(false);
                        }}
                        className="py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Check size={14} /> YES
                      </button>
                      <button
                        onClick={() => {
                          setShowQuickCheck(false);
                        }}
                        className="py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <X size={14} /> NO
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
              <div className={`p-3 rounded-xl flex items-center gap-3 border transition-colors shadow-sm ${
                locationStatus === 'locked' ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'
              }`}>
                <div className={`p-2 rounded-full text-white shadow-sm ${locationStatus === 'locked' ? 'bg-blue-500' : 'bg-amber-500'}`}>
                  {locationStatus === 'locating' ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                    {locationStatus === 'locating' ? t('locating') : t('locationLocked')}
                  </p>
                  {currentGPS ? (
                    <p className="text-sm font-mono font-semibold text-slate-700">
                      {currentGPS.lat.toFixed(6)}, {currentGPS.lng.toFixed(6)}
                    </p>
                  ) : <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>}
                </div>
                {locationStatus === 'locked' && <CheckCircle size={16} className="text-blue-500" />}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{t('hazardType')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(HazardCategory).filter(c => c !== HazardCategory.OTHER).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`p-2.5 rounded-xl text-[10px] font-bold border transition-all text-center leading-tight flex flex-col items-center justify-center gap-1 ${
                        category === cat 
                          ? 'bg-ocean-600 text-white border-ocean-600 shadow-md shadow-ocean-500/20' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-ocean-300'
                      }`}
                    >
                      {cat === HazardCategory.ELECTRICAL && <Zap size={14} className={category === cat ? "text-white" : "text-orange-500"} />}
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{t('evidence')}</label>
                <div className="grid grid-cols-2 gap-2">
                   <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl h-28 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-ocean-400 transition-all cursor-pointer bg-white overflow-hidden relative group"
                   >
                    {image ? (
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="p-3 bg-slate-100 rounded-full mb-2 group-hover:scale-110 transition-transform">
                           <Upload size={20} className="text-slate-500" />
                        </div>
                        <span className="text-[10px] font-medium text-center px-2">{t('uploadFile')}</span>
                      </>
                    )}
                   </div>
                   
                   <div 
                     onClick={startCamera}
                     className="border-2 border-dashed border-slate-300 rounded-xl h-28 flex flex-col items-center justify-center text-ocean-500 hover:bg-ocean-50 hover:border-ocean-400 transition-all cursor-pointer bg-white group"
                   >
                      <div className="p-3 bg-ocean-100 rounded-full mb-2 group-hover:scale-110 transition-transform">
                         <Camera size={20} className="text-ocean-600" />
                      </div>
                      <span className="text-[10px] font-medium text-center px-2">{t('openCamera')}</span>
                   </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,video/*"
                  onChange={handleImageUpload}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">{t('description')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={category === HazardCategory.ELECTRICAL ? "Describe spark color, wire position..." : t('describeSituation')}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:ring-2 focus:ring-ocean-400 focus:border-transparent outline-none h-20 resize-none shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || locationStatus === 'locating'}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                  isSubmitting ? 'bg-slate-400' : 'bg-gradient-to-r from-ocean-600 to-cyan-500 hover:from-ocean-500 hover:to-cyan-400 shadow-cyan-500/30'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Upload size={18} />
                    <span>{isOnline ? t('submitReport') : t('saveOffline')}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

          {activeTab === 'connectivity' && (
            <div className="space-y-6 pt-4">
              <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
                <div className="relative z-10">
                  <h3 className="text-indigo-800 font-bold text-lg flex items-center gap-2 mb-1">
                    <Network size={22} className="text-indigo-600" /> Connectivity
                  </h3>
                  <p className="text-xs text-indigo-600/80 leading-relaxed">Choose your communication protocol based on current network availability.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: ConnectivityMode.ONLINE, name: 'Standard Online', icon: <Wifi size={18} />, subtext: 'Uses cellular or Wi-Fi data' },
                  { id: ConnectivityMode.MESH, name: 'Mesh Network', icon: <Bluetooth size={18} />, subtext: 'Peer-to-peer (No internet)' },
                  { id: ConnectivityMode.LORA, name: 'LoRa Mode', icon: <Radio size={18} />, subtext: 'Long-range low-power' }
                ].map((mode) => (
                  <button 
                    key={mode.id}
                    onClick={() => setConnectivityMode(mode.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                      connectivityMode === mode.id 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]' 
                        : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${connectivityMode === mode.id ? 'bg-white/20' : 'bg-slate-50 text-indigo-600'}`}>
                      {mode.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-bold text-sm leading-tight">{mode.name}</h4>
                      <p className={`text-[10px] mt-0.5 ${connectivityMode === mode.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {mode.subtext}
                      </p>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      connectivityMode === mode.id ? 'border-white bg-white' : 'border-slate-200'
                    }`}>
                      {connectivityMode === mode.id && <Check size={12} className="text-indigo-600" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-5 bg-slate-900 rounded-[2rem] text-white/90 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Active Protocol</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-[9px] font-bold rounded-full border border-indigo-500/30">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                    {connectivityMode.toUpperCase()}
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Configured for <span className="font-bold text-white">{connectivityMode}</span>. Fallback protocols are ready if the primary link fails.
                </p>
              </div>

              {connectivityMode === ConnectivityMode.MESH && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden flex flex-col h-[350px] shadow-2xl shadow-slate-200/50">
                    <div className="bg-slate-50/80 backdrop-blur-md p-4 border-b border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mesh Network</span>
                      </div>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-3 py-0.5 rounded-full font-bold">{meshPeers.length} Peers</span>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                      {getFilteredMessages().length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                          <MessageSquare size={32} />
                          <p className="text-[10px] font-bold mt-2 uppercase tracking-widest">No Active Comms</p>
                        </div>
                      ) : (
                        getFilteredMessages().map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.senderId === 'me' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[11px] font-medium shadow-sm ${
                              msg.senderId === 'me' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                            }`}>
                              {msg.text}
                            </div>
                            <span className="text-[8px] text-slate-400 mt-1 px-1">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
                      <input 
                        value={meshInput}
                        onChange={(e) => setMeshInput(e.target.value)}
                        placeholder="Broadcast message..."
                        className="flex-1 bg-slate-100 rounded-2xl px-4 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                      />
                      <button 
                        onClick={handleMeshSend}
                        className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 active:scale-90 transition-transform"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Satellite Broadcast (Admin/Officer Feature) */}
              <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Radio size={20} className="text-amber-400" />
                  <h4 className="text-sm font-bold">Satellite Broadcast</h4>
                </div>
                <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">Send high-priority alerts to all devices in this sector via satellite link.</p>
                <div className="space-y-3">
                  <textarea 
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Enter emergency broadcast message..."
                    className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-amber-500 h-20 resize-none"
                  />
                  <button 
                    onClick={() => {
                      if (!broadcastMessage.trim()) return;
                      setIsBroadcasting(true);
                      setTimeout(() => {
                        broadcastAlert(broadcastMessage);
                        setBroadcastMessage('');
                        setIsBroadcasting(false);
                        setSuccessMessage("Broadcast Sent Successfully");
                      }, 1500);
                    }}
                    disabled={isBroadcasting}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    {isBroadcasting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {isBroadcasting ? 'Broadcasting...' : 'SEND SATELLITE ALERT'}
                  </button>
                </div>
              </div>

              {/* Direct SMS Panel */}
              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={20} className="text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-800">Direct SMS Link</h4>
                </div>
                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">Send a direct encrypted SMS to a specific responder or field unit.</p>
                <div className="space-y-3">
                  <input 
                    type="tel"
                    placeholder="Recipient Phone Number..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <textarea 
                    placeholder="Enter private message..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 h-20 resize-none"
                  />
                  <button 
                    onClick={() => {
                      setSuccessMessage("Direct SMS Sent");
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    <Send size={16} />
                    SEND DIRECT SMS
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6 pt-4">
              {/* Welcome Header */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Hello, {currentUser?.name.split(' ')[0]}!</h3>
                  <p className="text-xs text-slate-500 font-medium">Stay alert, stay safe today.</p>
                </div>
                <div className="bg-ocean-50 p-2 rounded-2xl border border-ocean-100">
                  <Activity size={20} className="text-ocean-600" />
                </div>
              </div>

              {/* Weather Quick View */}
              {weather && (
                <div 
                  onClick={() => setActiveTab('weather')}
                  className="bg-gradient-to-br from-blue-500 to-ocean-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Local Weather</p>
                      <h4 className="text-3xl font-black">{weather.current.temp}°C</h4>
                      <p className="text-sm font-bold">{weather.current.condition} in {weather.locationName}</p>
                    </div>
                    <div className="text-right">
                      {weather.current.condition.includes('Rain') ? <Droplets size={48} className="text-blue-200" /> : 
                       weather.current.condition.includes('Cloud') ? <CloudSun size={48} className="text-white" /> :
                       <Sun size={48} className="text-yellow-300" />}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="bg-emerald-50 w-10 h-10 rounded-2xl flex items-center justify-center mb-3">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Reports</p>
                  <p className="text-xl font-black text-slate-800">{reports.filter(r => r.userId === currentUser?.id).length}</p>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="bg-red-50 w-10 h-10 rounded-2xl flex items-center justify-center mb-3">
                    <ShieldAlert size={20} className="text-red-600" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trust Strikes</p>
                  <p className="text-xl font-black text-slate-800">{currentUser?.strikes || 0}</p>
                </div>
              </div>

              {/* Recent Hazards in Area */}
              <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-black uppercase tracking-widest">Nearby Hazards</h4>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">LIVE</span>
                </div>
                <div className="space-y-4">
                  {reports.filter(r => r.status === ReportStatus.VERIFIED).slice(0, 3).map(report => (
                    <div key={report.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                      <div className="bg-red-500/20 p-2 rounded-xl">
                        <AlertTriangle size={16} className="text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{report.description}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">{report.category} • {new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                  ))}
                  {reports.filter(r => r.status === ReportStatus.VERIFIED).length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">No verified hazards nearby.</p>
                  )}
                </div>
                <button 
                  onClick={() => setActiveTab('map')}
                  className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  View Full Hazard Map
                </button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4 pb-4">
                <button 
                  onClick={() => setActiveTab('report')}
                  className="flex flex-col items-center gap-2 p-4 bg-ocean-50 text-ocean-600 rounded-[2rem] border border-ocean-100 font-black text-[10px] uppercase tracking-widest hover:bg-ocean-100 transition-all"
                >
                  <Radio size={24} />
                  Report Hazard
                </button>
                <button 
                  onClick={() => setActiveTab('safety')}
                  className="flex flex-col items-center gap-2 p-4 bg-emerald-50 text-emerald-600 rounded-[2rem] border border-emerald-100 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all"
                >
                  <ShieldCheck size={24} />
                  Safety Guide
                </button>
              </div>
            </div>
          )}

          {activeTab === 'weather' && (
            <div className="pt-2 h-full flex flex-col">
               <form onSubmit={handleWeatherSearch} className="mb-4 flex gap-2">
                 <div className="relative flex-1">
                   <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     value={weatherLocation}
                     onChange={(e) => setWeatherLocation(e.target.value)}
                     className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 pl-9 pr-10 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all shadow-sm"
                     placeholder="Enter City..."
                   />
                   <button 
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-cyan-500 rounded-lg text-white hover:bg-cyan-600 transition-colors"
                   >
                     <Search size={12} />
                   </button>
                 </div>
                 <button 
                   type="button"
                   onClick={handleRefreshWeather}
                   disabled={loadingWeather}
                   className="bg-white border border-slate-200 text-slate-600 p-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center"
                 >
                   <RefreshCw size={14} className={loadingWeather ? 'animate-spin' : ''} />
                 </button>
               </form>

               {!weather && loadingWeather ? (
                  <div className="flex flex-col items-center justify-center h-full text-ocean-500">
                    <Loader2 size={32} className="animate-spin mb-3" />
                    <p className="text-xs font-bold animate-pulse">Fetching Satellite Data...</p>
                  </div>
               ) : weather ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     {!isOnline && (
                       <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-center gap-3 mb-2">
                         <WifiOff size={16} className="text-amber-500" />
                         <p className="text-[10px] font-bold text-amber-700">Offline Mode: Showing Cached Satellite Data</p>
                       </div>
                     )}
                     <div className="bg-gradient-to-br from-blue-500 to-ocean-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/30">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">Current Location</p>
                              <h3 className="text-xl font-bold flex items-center gap-1"><MapPin size={16} /> {weather.locationName}</h3>
                              {weather.sourceUri && (
                                <a href={weather.sourceUri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-white/70 hover:text-white mt-1 underline">
                                  <ExternalLink size={10} /> Source: Google
                                </a>
                              )}
                           </div>
                           <Sun size={32} className="text-yellow-300 animate-pulse-fast" />
                        </div>
                        
                        <div className="flex items-end gap-2 mb-6">
                           <span className="text-6xl font-display font-bold tracking-tighter">{weather.current.temp}°</span>
                           <span className="text-lg font-medium opacity-80 mb-2">{weather.current.condition}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                           <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
                              <Wind size={16} className="mx-auto mb-1 opacity-80" />
                              <p className="text-[10px] font-bold">{weather.current.windSpeed} km/h</p>
                           </div>
                           <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
                              <Droplets size={16} className="mx-auto mb-1 opacity-80" />
                              <p className="text-[10px] font-bold">{weather.current.humidity}%</p>
                           </div>
                           <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
                              <Thermometer size={16} className="mx-auto mb-1 opacity-80" />
                              <p className="text-[10px] font-bold">Feels {weather.current.feelsLike}°</p>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">7-Day Forecast</h4>
                        <div className="space-y-4">
                           {weather.days.slice(0, 7).map((day, i) => (
                              <div key={i} className="flex items-center justify-between group">
                                 <div className="w-16">
                                    <p className="text-xs font-bold text-slate-700">{i === 0 ? 'Today' : day.dayName}</p>
                                    <p className="text-[10px] text-slate-400">{new Date(day.date).getDate()}th</p>
                                 </div>
                                 
                                 <div className="flex items-center gap-2 flex-1 justify-center text-slate-500">
                                    {day.condition.includes('Rain') ? <Droplets size={16} className="text-blue-400" /> : 
                                     day.condition.includes('Cloud') ? <CloudSun size={16} className="text-slate-400" /> :
                                     <Sun size={16} className="text-yellow-400" />}
                                    <span className="text-xs font-medium w-16 text-center">{day.condition}</span>
                                 </div>
                                 
                                 <div className="text-right w-16">
                                    <span className="text-sm font-bold text-slate-800">{day.tempMax}°</span>
                                    <span className="text-xs text-slate-400 ml-1">{day.tempMin}°</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               ) : null}
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-6 pt-4">
              <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16" />
                <div className="relative z-10">
                  <h3 className="text-emerald-800 font-bold text-lg flex items-center gap-2 mb-1">
                    <ShieldCheck size={22} className="text-emerald-600" /> Safety Guide
                  </h3>
                  <p className="text-xs text-emerald-600/80 leading-relaxed">Essential protocols to keep you and your loved ones safe during emergencies.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 pb-8">
                {[
                  {
                    title: 'Flood Safety',
                    icon: <Waves size={24} className="text-blue-600" />,
                    image: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=800',
                    actionImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
                    dos: ['Move to higher ground immediately.', 'Turn off main switches and gas valves.', 'Keep emergency kit ready.'],
                    donts: ['Don\'t walk or drive through floodwaters.', 'Don\'t touch electrical equipment if you are wet.', 'Don\'t consume flood-contaminated food.'],
                    color: 'blue'
                  },
                  {
                    title: 'Tsunami Protocol',
                    icon: <Waves size={24} className="text-cyan-600" />,
                    image: 'https://images.unsplash.com/photo-1502933691298-84fa146c07a8?auto=format&fit=crop&q=80&w=800',
                    actionImage: 'https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&q=80&w=800',
                    dos: ['Move inland or to high ground immediately.', 'Follow evacuation signs.', 'Stay away from the beach until safe.'],
                    donts: ['Don\'t go to the beach to watch the wave.', 'Don\'t wait for an official warning if water recedes.', 'Don\'t return until all-clear is given.'],
                    color: 'cyan'
                  },
                  {
                    title: 'Cyclone/Storm',
                    icon: <Wind size={24} className="text-slate-600" />,
                    image: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&q=80&w=800',
                    actionImage: 'https://images.unsplash.com/photo-1516912481808-34061f8e630a?auto=format&fit=crop&q=80&w=800',
                    dos: ['Stay indoors and away from windows.', 'Listen to local radio for updates.', 'Secure loose outdoor items.'],
                    donts: ['Don\'t go outside during the "eye" of the storm.', 'Don\'t park under trees or power lines.', 'Don\'t ignore evacuation orders.'],
                    color: 'slate'
                  },
                  {
                    title: 'Earthquake',
                    icon: <Mountain size={24} className="text-amber-700" />,
                    image: 'https://images.unsplash.com/photo-1585822797357-6a44bb249570?auto=format&fit=crop&q=80&w=800',
                    actionImage: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&q=80&w=800',
                    dos: ['Drop, Cover, and Hold On.', 'Stay away from glass and heavy furniture.', 'If outside, move to an open area.'],
                    donts: ['Don\'t use elevators.', 'Don\'t run outside while shaking.', 'Don\'t stand near buildings or power lines.'],
                    color: 'amber'
                  },
                  {
                    title: 'Fire Accident',
                    icon: <Flame size={24} className="text-red-600" />,
                    image: 'https://images.unsplash.com/photo-1542353436-312f0ee594cd?auto=format&fit=crop&q=80&w=800',
                    actionImage: 'https://images.unsplash.com/photo-1542353436-312f02c16299?auto=format&fit=crop&q=80&w=800',
                    dos: ['Stay low to avoid smoke.', 'Use stairs, never elevators.', 'Feel doors for heat before opening.'],
                    donts: ['Don\'t stop to collect belongings.', 'Don\'t open a door if it feels hot.', 'Don\'t hide in closets or under beds.'],
                    color: 'red'
                  }
                ].map((guide, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
                  >
                    <div className="relative h-56">
                      <img 
                        src={guide.image} 
                        alt={guide.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-6">
                        <div className="flex items-center gap-4 text-white">
                          <div className="p-3.5 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
                            {guide.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-2xl leading-tight tracking-tight">{guide.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="h-1 w-4 bg-white/40 rounded-full" />
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">Safety Protocol</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-100 shadow-inner">
                          <img src={guide.actionImage} alt="Action" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full border border-white/30">
                              <Activity size={14} className="text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center">
                          <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">"Visual cues help you react faster in high-stress situations."</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="h-px flex-1 bg-emerald-100" />
                           <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">The Do's</h5>
                           <div className="h-px flex-1 bg-emerald-100" />
                        </div>
                        <ul className="space-y-3">
                          {guide.dos.map((item, i) => (
                            <li key={i} className="text-xs font-medium text-slate-600 flex items-start gap-3 group/item">
                              <div className="p-1 bg-emerald-50 rounded-full mt-0.5 group-hover/item:bg-emerald-500 transition-colors">
                                <Check size={10} className="text-emerald-500 group-hover/item:text-white" />
                              </div>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="h-px flex-1 bg-red-100" />
                           <h5 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">The Don'ts</h5>
                           <div className="h-px flex-1 bg-red-100" />
                        </div>
                        <ul className="space-y-3">
                          {guide.donts.map((item, i) => (
                            <li key={i} className="text-xs font-medium text-slate-600 flex items-start gap-3 group/item">
                              <div className="p-1 bg-red-50 rounded-full mt-0.5 group-hover/item:bg-red-500 transition-colors">
                                <X size={10} className="text-red-500 group-hover/item:text-white" />
                              </div>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-6 bg-slate-900 rounded-[2.5rem] text-center mb-10">
                <Shield size={32} className="text-amber-400 mx-auto mb-3" />
                <p className="text-xs text-slate-300 font-medium leading-relaxed">Always follow instructions from local emergency services and authorities. Your safety is our priority.</p>
              </div>
            </div>
          )}
          {activeTab === 'map' && (
            <div className="pt-2 h-full flex flex-col space-y-4">
              <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 flex justify-between items-center">
                <div>
                  <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-1">
                    <Map size={18} /> Hazard Map
                  </h3>
                  <p className="text-[10px] text-amber-600">Real-time risk zones and safe havens.</p>
                </div>
                <button 
                  onClick={() => setMapMode(mapMode === 'standard' ? 'heatmap' : 'standard')}
                  className={`p-2 rounded-xl transition-all ${mapMode === 'heatmap' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-amber-600 border border-amber-200'}`}
                >
                  <Layers size={18} />
                </button>
              </div>

              {/* Location Search */}
              <form onSubmit={handleMapSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  placeholder="Search location..."
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-12 text-sm focus:ring-2 focus:ring-amber-400 outline-none shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={loadingSafeZones}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors disabled:opacity-50"
                >
                  {loadingSafeZones ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                </button>
              </form>

              {/* Mock Map View */}
              <div className="relative aspect-[3/4] bg-slate-200 rounded-[2.5rem] overflow-hidden border border-slate-300 shadow-inner group">
                {/* Map Background (Grid) */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                
                {/* Map Content (Dynamic Mockup) */}
                <div className="absolute inset-0 p-4">
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[9px] font-black text-slate-500 border border-slate-200 uppercase tracking-widest shadow-sm">
                    {mapSearchQuery || 'Current Area'}
                  </div>

                  {/* Heatmap Layer */}
                  {mapMode === 'heatmap' && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-red-500/30 rounded-full blur-3xl animate-pulse" />
                      <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl" />
                      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-red-600/20 rounded-full blur-[40px]" />
                    </div>
                  )}

                  {/* User Location */}
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                  >
                    <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-xl" />
                    <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
                  </motion.div>

                  {/* Safe Zones on Map */}
                  {safeZones.map((zone, idx) => (
                    <motion.div
                      key={zone.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      style={{ 
                        top: `${50 + (zone.location.latitude - 13.08) * 500}%`, 
                        left: `${50 + (zone.location.longitude - 80.27) * 500}%` 
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group/pin"
                    >
                      <div className={`p-2 rounded-full shadow-lg border-2 border-white transition-transform group-hover/pin:scale-125 ${
                        zone.type === 'Shelter' ? 'bg-emerald-500' : 
                        zone.type === 'Hospital' ? 'bg-red-500' : 
                        zone.type === 'Police Station' ? 'bg-blue-600' : 'bg-amber-500'
                      }`}>
                        {zone.type === 'Shelter' ? <Building2 size={14} className="text-white" /> : 
                         zone.type === 'Hospital' ? <HospitalIcon size={14} className="text-white" /> : 
                         zone.type === 'Police Station' ? <ShieldAlert size={14} className="text-white" /> : <Navigation size={14} className="text-white" />}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-2xl border border-slate-200 shadow-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm" /> SHELTER
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm" /> HOSPITAL
                  </div>
                  {mapMode === 'heatmap' && (
                    <div className="flex items-center gap-2 text-[9px] font-black text-red-600 uppercase tracking-tighter animate-pulse">
                      <div className="w-2.5 h-2.5 bg-red-600/50 rounded-full shadow-sm" /> RISK ZONE
                    </div>
                  )}
                </div>
              </div>

              {/* Safe Zones List */}
              <div className="space-y-3 pb-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nearby Havens</h4>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{safeZones.length} Found</span>
                </div>
                {safeZones.map((zone) => (
                  <div key={zone.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-amber-200 transition-all hover:shadow-md">
                    <div className={`p-4 rounded-2xl ${
                      zone.type === 'Shelter' ? 'bg-emerald-50 text-emerald-600' : 
                      zone.type === 'Hospital' ? 'bg-red-50 text-red-600' : 
                      zone.type === 'Police Station' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {zone.type === 'Shelter' ? <Building2 size={22} /> : 
                       zone.type === 'Hospital' ? <HospitalIcon size={22} /> : 
                       zone.type === 'Police Station' ? <ShieldAlert size={22} /> : <Navigation size={22} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-black text-sm text-slate-800 tracking-tight">{zone.name}</h5>
                        <div className={`w-2 h-2 rounded-full ${zone.status === 'Available' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mb-2 leading-tight">{zone.address}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <User size={12} className="text-slate-300" /> {zone.occupancy}/{zone.capacity}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <Phone size={12} className="text-slate-300" /> {zone.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="pt-2 h-full flex flex-col space-y-6">
              <div className="bg-indigo-50 p-5 rounded-[2.5rem] border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
                <h3 className="text-indigo-800 font-black text-lg flex items-center gap-2 mb-1">
                  <Share2 size={22} className="text-indigo-600" /> Social Intelligence
                </h3>
                <p className="text-xs text-indigo-600/80 font-medium">Crowdsourced insights and local intelligence.</p>
              </div>

              {/* Nearby Alerts */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nearby Alerts</h4>
                <div className="space-y-3">
                  {[
                    { id: 1, type: 'Flood', location: 'Marina Beach', time: '5m ago', intensity: 'High', reports: 12 },
                    { id: 2, type: 'Power Cut', location: 'Mylapore', time: '12m ago', intensity: 'Total', reports: 45 }
                  ].map(alert => (
                    <div key={alert.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-black text-sm text-slate-800">{alert.type} Alert</h5>
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <MapPin size={10} /> {alert.location} • {alert.time}
                          </p>
                        </div>
                        <span className="bg-red-50 text-red-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                          {alert.intensity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px]">
                              <User size={8} />
                            </div>
                          ))}
                        </div>
                        <span>+{alert.reports} people reported this</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reports Feed */}
              <div className="space-y-4 pb-10">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Recent Reports</h4>
                <div className="space-y-4">
                  {reports.slice(0, 5).map(report => (
                    <div key={report.id} className="flex gap-4 p-2">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                        <img src={report.mediaUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-bold text-xs text-slate-800 truncate">{report.userName}</h5>
                          <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(report.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{report.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">{report.category}</span>
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400">
                            <ShieldCheck size={10} className="text-emerald-500" /> Verified
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grid' && (
            <div className="space-y-6 pt-4">
              <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16" />
                <div className="relative z-10">
                  <h3 className="text-orange-800 font-bold text-lg flex items-center gap-2 mb-1">
                    <Zap size={22} className="text-orange-600" /> Electrical Grid
                  </h3>
                  <p className="text-xs text-orange-600/80 leading-relaxed">Monitor and control power distribution in hazard zones.</p>
                </div>
              </div>

              <div className="space-y-4">
                {electricalZones.map(zone => (
                  <div key={zone.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800">{zone.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{zone.transformers} Transformers • {zone.affectedCustomers} Customers</p>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        zone.riskLevel === 'Critical' ? 'bg-red-100 text-red-600' :
                        zone.riskLevel === 'High' ? 'bg-orange-100 text-orange-600' :
                        'bg-emerald-100 text-emerald-600'
                      }`}>
                        {zone.riskLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {(['Active', 'Partial', 'Shutdown'] as const).map(level => (
                        <button
                          key={level}
                          onClick={() => toggleShutdown(zone.id, level)}
                          className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                            zone.status === level
                              ? level === 'Active' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' :
                                level === 'Partial' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' :
                                'bg-red-500 text-white shadow-md shadow-red-200'
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

          {activeTab === 'profile' && (
            <div className="space-y-6 pt-4">
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-ocean-600 to-indigo-600" />
                <div className="relative z-10">
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl mx-auto mb-4 overflow-hidden bg-slate-100 flex items-center justify-center">
                    {currentUser?.profile_image_url ? (
                      <img src={currentUser.profile_image_url} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-slate-300" />
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-800">{currentUser?.name}</h3>
                  <p className="text-xs font-bold text-ocean-600 uppercase tracking-widest">{currentUser?.role}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="bg-indigo-50 p-3 rounded-2xl">
                    <Phone size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                    <p className="text-sm font-bold text-slate-700">{currentUser?.phone || 'Not Linked'}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="bg-amber-50 p-3 rounded-2xl">
                    <Shield size={20} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trust Score</p>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{100 - (currentUser?.strikes || 0) * 20}%</p>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${100 - (currentUser?.strikes || 0) * 20}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="bg-emerald-50 p-3 rounded-2xl">
                    <Award size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
                    <p className="text-sm font-bold text-slate-700">March 2026</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-red-50 text-red-600 rounded-[2rem] border border-red-100 font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sign Out / Reset
              </button>
            </div>
          )}
        </div>

          {activeTab === 'more' && (
            <div className="space-y-6 pt-4">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full -mr-16 -mt-16" />
                <div className="relative z-10">
                  <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2 mb-1">
                    <Layers size={22} className="text-slate-600" /> More Features
                  </h3>
                  <p className="text-xs text-slate-600/80 leading-relaxed">Access additional tools and community features.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setActiveTab('safety')}
                  className="flex flex-col items-center gap-3 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
                >
                  <div className="bg-emerald-50 p-3 rounded-2xl group-hover:bg-emerald-100 transition-colors">
                    <ShieldCheck size={24} className="text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Safety Guide</span>
                </button>

                <button 
                  onClick={() => setActiveTab('social')}
                  className="flex flex-col items-center gap-3 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:bg-indigo-50 hover:border-indigo-100 transition-all group"
                >
                  <div className="bg-indigo-50 p-3 rounded-2xl group-hover:bg-indigo-100 transition-colors">
                    <Share2 size={24} className="text-indigo-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Social Feed</span>
                </button>

                <button 
                  onClick={() => setActiveTab('connectivity')}
                  className="flex flex-col items-center gap-3 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:bg-cyan-50 hover:border-cyan-100 transition-all group"
                >
                  <div className="bg-cyan-50 p-3 rounded-2xl group-hover:bg-cyan-100 transition-colors">
                    <Network size={24} className="text-cyan-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Connectivity</span>
                </button>

                {currentUser?.role === UserRole.ADMIN && (
                  <button 
                    onClick={() => setActiveTab('grid')}
                    className="flex flex-col items-center gap-3 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:bg-orange-50 hover:border-orange-100 transition-all group"
                  >
                    <div className="bg-orange-50 p-3 rounded-2xl group-hover:bg-orange-100 transition-colors">
                      <Zap size={24} className="text-orange-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Grid Control</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-md border-t border-slate-100 flex items-center justify-around px-1 pb-2 z-30">
          {[
            { id: 'dashboard', label: 'Home', icon: <Building2 size={16} />, color: 'text-slate-800', bg: 'bg-slate-100' },
            { id: 'weather', label: 'Weather', icon: <CloudSun size={16} />, color: 'text-cyan-600', bg: 'bg-cyan-50' },
            { id: 'report', label: 'Report', icon: <Radio size={16} />, color: 'text-ocean-600', bg: 'bg-ocean-50' },
            { id: 'map', label: 'Map', icon: <Map size={16} />, color: 'text-amber-600', bg: 'bg-amber-50' },
            { id: 'profile', label: 'Profile', icon: <User size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { id: 'more', label: 'More', icon: <Layers size={16} />, color: 'text-slate-600', bg: 'bg-slate-50' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative group`}
            >
              <div className={`
                p-1.5 rounded-xl transition-all duration-300 mb-0.5
                ${activeTab === tab.id ? `${tab.bg} ${tab.color} scale-110 shadow-sm` : 'text-slate-400 group-hover:text-slate-600'}
              `}>
                {tab.icon}
              </div>
              <span className={`text-[7px] font-black uppercase tracking-tighter transition-all duration-300 ${
                activeTab === tab.id ? tab.color : 'text-slate-400'
              }`}>
                {tab.label}
              </span>
              
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className={`absolute -top-px left-1/4 right-1/4 h-0.5 rounded-full ${
                    tab.id === 'dashboard' ? 'bg-slate-800' :
                    tab.id === 'weather' ? 'bg-cyan-500' : 
                    tab.id === 'report' ? 'bg-ocean-500' : 
                    tab.id === 'grid' ? 'bg-orange-500' : 
                    tab.id === 'safety' ? 'bg-emerald-500' :
                    tab.id === 'connectivity' ? 'bg-indigo-500' : 
                    tab.id === 'map' ? 'bg-amber-500' : 
                    tab.id === 'profile' ? 'bg-indigo-500' :
                    tab.id === 'more' ? 'bg-slate-500' :
                    'bg-indigo-500'
                  }`}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
