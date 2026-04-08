
import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, Language } from '../types';
import { LayoutDashboard, Radio, Smartphone, Activity, Menu, X, Waves, LogOut, Map, Languages, Zap, ShieldCheck, RefreshCw, User } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Chatbot } from './Chatbot';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, switchUserRole, logout, language, setLanguage, t } = useApp();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) return <>{children}</>;

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Broadcast Dashboard', icon: <LayoutDashboard size={20} />, path: '/', roles: [UserRole.ADMIN] },
    { name: 'User Submissions', icon: <Radio size={20} />, path: '/reports', roles: [UserRole.ADMIN] },
    { name: 'Electrical Grid', icon: <Zap size={20} />, path: '/electrical-admin', roles: [UserRole.ADMIN, UserRole.ELECTRICAL_OFFICER] },
    { name: 'Social Intelligence', icon: <Activity size={20} />, path: '/social', roles: [UserRole.CITIZEN] },
    { name: 'Live Hazard Map', icon: <Map size={20} />, path: '/map', roles: [UserRole.CITIZEN] },
    { name: 'Safety Guide', icon: <ShieldCheck size={20} />, path: '/safety', roles: [UserRole.CITIZEN] },
    { name: 'Mobile Simulator', icon: <Smartphone size={20} />, path: '/mobile-sim', roles: [UserRole.CITIZEN] },
  ];

  // Map Admin to also see Electrical Officer stuff for demo ease
  const userRoles = currentUser.role === UserRole.ADMIN ? [UserRole.ADMIN, UserRole.ELECTRICAL_OFFICER] : [currentUser.role];

  const filteredNav = navItems.filter(item => item.roles.some(r => userRoles.includes(r)));

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'hi', label: 'हिन्दी' },
  ];

  return (
    <div className="flex h-screen bg-midnight-950 text-slate-100 overflow-hidden font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden fixed w-full bg-midnight-900 z-50 p-4 flex justify-between items-center shadow-lg border-b border-midnight-800">
        <div className="flex items-center gap-2">
           <Logo size={28} />
           <h1 className="font-display font-bold text-lg tracking-wider text-white">TideX</h1>
        </div>
        <button onClick={toggleSidebar} className="text-slate-300">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-midnight-900 transform transition-transform duration-300 ease-in-out border-r border-midnight-800 shadow-2xl
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <Logo size={42} />
            <div>
              <h1 className="font-display font-bold text-2xl tracking-wide text-white">TideX</h1>
              <p className="text-[10px] text-ocean-400 tracking-widest uppercase font-bold">Sentinel System</p>
            </div>
          </div>

          {/* Role Switcher at the top */}
          <div className="mb-6 bg-midnight-950 p-3 rounded-xl border border-midnight-800">
            <label className="text-[10px] text-slate-500 font-bold uppercase px-1 mb-2 block tracking-widest">Select Side</label>
            <div className="flex gap-1 p-1 bg-midnight-900 rounded-lg">
              <button 
                onClick={() => switchUserRole(UserRole.ADMIN)}
                className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all ${
                  currentUser.role === UserRole.ADMIN 
                    ? 'bg-ocean-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                ADMIN SIDE
              </button>
              <button 
                onClick={() => switchUserRole(UserRole.CITIZEN)}
                className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all ${
                  currentUser.role === UserRole.CITIZEN 
                    ? 'bg-ocean-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                USER SIDE
              </button>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="mb-6 bg-midnight-950 p-1.5 rounded-xl flex gap-1 border border-midnight-800">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  language === lang.code 
                    ? 'bg-ocean-600 text-white shadow' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
            <div className="mb-2 px-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Switch Features</p>
              <nav className="space-y-1.5">
                {filteredNav.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                      ${isActive 
                        ? 'bg-gradient-to-r from-ocean-600/20 to-cyan-500/10 text-white border border-ocean-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                        : 'text-slate-400 hover:bg-midnight-800 hover:text-cyan-300'}
                    `}
                  >
                    <div className={`transition-colors ${item.path === location.pathname ? 'text-neon-cyan' : 'group-hover:text-neon-cyan'}`}>
                       {item.icon}
                    </div>
                    <span className="font-medium tracking-wide text-sm">{item.name}</span>
                    {item.path === location.pathname && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-neon-cyan rounded-r-full shadow-[0_0_10px_#22d3ee]"></div>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        
          <div className="mt-auto pt-6 border-t border-midnight-800">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 text-slate-400 hover:text-red-400 transition-colors w-full px-4 py-3 hover:bg-red-500/5 rounded-xl group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:pt-0 pt-16 bg-midnight-950 relative">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-ocean-900/20 to-transparent pointer-events-none"></div>
        <div className="p-6 md:p-8 max-w-7xl mx-auto h-full relative z-10">
          {children}
        </div>
        <Chatbot />
      </main>
    </div>
  );
};
