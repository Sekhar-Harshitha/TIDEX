
import React, { useState, useEffect } from 'react';
import { MapPin, Lock, Navigation, Settings, AlertOctagon, Loader2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';

export const LocationGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setDeviceLocation } = useApp();
  const [status, setStatus] = useState<'idle' | 'requesting' | 'denied' | 'granted'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const requestLocation = () => {
    setStatus('requesting');
    setErrorMsg('');
    
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      setStatus('denied');
      return;
    }

    const options = { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 };
    
    const successCallback = (position: GeolocationPosition) => {
      setDeviceLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
      setStatus('granted');
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.error("Location Error:", error.message);
      
      // If high accuracy timed out, try one more time with low accuracy
      if (error.code === 3 && options.enableHighAccuracy) {
        console.warn("High accuracy timed out, retrying with low accuracy...");
        navigator.geolocation.getCurrentPosition(
          successCallback,
          (secondError) => {
            handleFinalError(secondError);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
        return;
      }

      handleFinalError(error);
    };

    const handleFinalError = (error: GeolocationPositionError) => {
      let message = "Unknown error occurred.";
      switch(error.code) {
        case 1: // PERMISSION_DENIED
          message = "Permission denied. Browsers often block location access in embedded previews. You can use a manual location to continue.";
          break;
        case 2: // POSITION_UNAVAILABLE
          message = "Location signal unavailable.";
          break;
        case 3: // TIMEOUT
          message = "Location request timed out. Please try again or use manual location.";
          break;
        default:
          message = error.message;
      }
      setErrorMsg(message);
      setStatus('denied');
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
  };

  const useDefaultLocation = () => {
    // Default to a central coastal location (e.g., Chennai, India)
    setDeviceLocation({
      latitude: 13.0827,
      longitude: 80.2707,
      accuracy: 1000
    });
    setStatus('granted');
  };

  useEffect(() => {
    // Check if permissions were already denied or if we should just try once
    requestLocation();
  }, []);

  if (status === 'granted') {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-midnight-950 flex items-center justify-center p-6 animate-in fade-in duration-500">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ocean-600/10 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg bg-midnight-900/80 backdrop-blur-xl border border-midnight-700 rounded-3xl p-8 shadow-2xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${status === 'denied' ? 'bg-amber-500/10' : 'bg-ocean-500/10'}`}>
              {status === 'requesting' ? (
                <Loader2 size={40} className="text-ocean-400 animate-spin" />
              ) : status === 'denied' ? (
                <MapPin size={40} className="text-amber-500" />
              ) : (
                <Navigation size={40} className="text-ocean-400" />
              )}
            </div>
            {status === 'requesting' && (
               <span className="absolute top-0 right-0 w-4 h-4 bg-ocean-500 rounded-full animate-ping"></span>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-white mb-3">
          {status === 'denied' ? 'Location Access' : 'Verifying Location'}
        </h2>
        
        <p className="text-slate-400 mb-8 leading-relaxed">
          {status === 'denied' 
            ? "We couldn't access your precise location. This is common in preview environments. You can proceed using a default location or try again."
            : "TideX needs to verify your current location for real-time hazard mapping and emergency SOS services."}
        </p>

        {status === 'denied' ? (
          <div className="bg-midnight-950/50 p-4 rounded-xl border border-amber-900/30 text-left mb-6">
             <div className="flex items-start gap-3">
               <AlertOctagon size={20} className="text-amber-500 shrink-0 mt-0.5" />
               <div className="text-sm text-slate-400">
                 <p className="font-bold text-amber-400 mb-1">Status: {errorMsg}</p>
                 <p className="text-slate-300">You can still use the app with a simulated location.</p>
               </div>
             </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {status === 'denied' ? (
            <>
              <button 
                onClick={useDefaultLocation}
                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg bg-gradient-to-r from-ocean-600 to-cyan-500 hover:from-ocean-500 hover:to-cyan-400 text-white shadow-cyan-500/25"
              >
                Continue with Default Location <ArrowRight size={18} />
              </button>
              <button 
                onClick={requestLocation}
                className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-slate-400 hover:text-white hover:bg-white/5"
              >
                Try Again
              </button>
            </>
          ) : (
            <button 
              disabled
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-slate-800 text-slate-500 cursor-not-allowed"
            >
              <Loader2 size={18} className="animate-spin" /> Requesting Access...
            </button>
          )}
        </div>
        
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-600">
           <Logo size={16} />
           <span className="text-[10px] font-bold tracking-widest uppercase">TideX Security Protocol</span>
        </div>
      </div>
    </div>
  );
};
