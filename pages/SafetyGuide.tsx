
import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, XCircle, Info, Flame, Waves, Wind, Activity, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface SafetySectionProps {
  title: string;
  icon: React.ReactNode;
  image: string;
  actionImage: string;
  dos: string[];
  donts: string[];
  color: string;
}

const SafetySection: React.FC<SafetySectionProps> = ({ title, icon, image, actionImage, dos, donts, color }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-midnight-900/50 border border-midnight-800 rounded-[32px] overflow-hidden backdrop-blur-sm group hover:border-ocean-500/30 transition-all duration-500 shadow-2xl"
  >
    <div className="grid lg:grid-cols-12 gap-0">
      <div className="lg:col-span-5 relative h-80 lg:h-auto overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-midnight-950/20 to-transparent"></div>
        <div className="absolute bottom-8 left-8 flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-midnight-900/90 border border-white/10 backdrop-blur-md text-${color}-400 shadow-2xl`}>
            {icon}
          </div>
          <div>
            <h3 className="text-3xl font-display font-bold text-white tracking-tight">{title}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] text-${color}-400`}>Emergency Protocol</span>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-7 p-8 lg:p-10 space-y-10 bg-midnight-900/20">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h4 className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-5">
                <CheckCircle2 size={16} /> Critical Do's
              </h4>
              <ul className="space-y-4">
                {dos.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_#10b981]"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 border-t border-midnight-800">
              <h4 className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest mb-5">
                <XCircle size={16} /> Critical Don'ts
              </h4>
              <ul className="space-y-4">
                {donts.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300 text-sm leading-relaxed">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_#ef4444]"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Zap size={12} className="text-amber-400" /> 3D Visual Action Guide
            </h4>
            <div className="relative rounded-2xl overflow-hidden border border-white/5 aspect-square bg-midnight-950 group/action">
              <img 
                src={actionImage} 
                alt="Action Illustration" 
                className="w-full h-full object-cover opacity-80 group-hover/action:opacity-100 transition-opacity duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 to-transparent opacity-60"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[10px] font-bold text-white/70 bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/5 text-center">
                  Recommended Safety Posture
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

export const SafetyGuide: React.FC = () => {
  const guides = [
    {
      title: "Flood Safety",
      icon: <Waves size={24} />,
      image: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=800",
      actionImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
      color: "blue",
      dos: [
        "Move to higher ground immediately if there is any possibility of a flash flood.",
        "Listen to radio or TV for information and follow evacuation orders.",
        "Disconnect electrical appliances and turn off gas valves.",
        "Keep a survival kit ready with water, food, and medicines."
      ],
      donts: [
        "Do not walk or drive through flowing water. Just 6 inches of water can knock you down.",
        "Do not touch electrical equipment if you are wet or standing in water.",
        "Do not ignore evacuation orders; they are issued for your safety.",
        "Do not swim in flood waters; they may be contaminated or hide debris."
      ]
    },
    {
      title: "Earthquake Protocol",
      icon: <Activity size={24} />,
      image: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&q=80&w=800",
      actionImage: "https://images.unsplash.com/photo-1585822797357-6a44bb249570?auto=format&fit=crop&q=80&w=800",
      color: "amber",
      dos: [
        "DROP, COVER, and HOLD ON. Get under a sturdy table or desk.",
        "If outdoors, move to an open area away from buildings, trees, and power lines.",
        "If in a vehicle, stop as quickly as safety permits and stay inside.",
        "Be prepared for aftershocks which can happen anytime."
      ],
      donts: [
        "Do not use elevators during or after an earthquake.",
        "Do not stand near windows, glass partitions, or heavy furniture.",
        "Do not run outside while the shaking is happening.",
        "Do not light matches or use lighters in case of gas leaks."
      ]
    },
    {
      title: "Fire Emergency",
      icon: <Flame size={24} />,
      image: "https://images.unsplash.com/photo-1542353436-312f02c16299?auto=format&fit=crop&q=80&w=800",
      actionImage: "https://images.unsplash.com/photo-1542353436-312f0ee594cd?auto=format&fit=crop&q=80&w=800",
      color: "red",
      dos: [
        "Stay low to the ground to avoid smoke inhalation.",
        "Test doors for heat with the back of your hand before opening.",
        "Use the stairs, never the elevator.",
        "Call emergency services immediately once you are safe."
      ],
      donts: [
        "Do not stop to gather personal belongings.",
        "Do not open a door if it feels hot; use an alternative exit.",
        "Do not hide in closets or under beds.",
        "Do not re-enter a burning building for any reason."
      ]
    },
    {
      title: "Cyclone / Hurricane",
      icon: <Wind size={24} />,
      image: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&q=80&w=800",
      actionImage: "https://images.unsplash.com/photo-1516912481808-34061f8e630a?auto=format&fit=crop&q=80&w=800",
      color: "cyan",
      dos: [
        "Board up windows and secure loose outdoor items.",
        "Stay in a reinforced room or basement during the peak.",
        "Keep your phone charged and have a power bank ready.",
        "Store enough clean water in containers for several days."
      ],
      donts: [
        "Do not go outside during the 'eye' of the storm; it's temporary.",
        "Do not park your car under trees or near power lines.",
        "Do not use candles; use flashlights instead to avoid fire risk.",
        "Do not spread rumors; follow only official weather bulletins."
      ]
    },
    {
      title: "Tsunami Warning",
      icon: <Info size={24} />,
      image: "https://images.unsplash.com/photo-1502933691298-84fa146c07a8?auto=format&fit=crop&q=80&w=800",
      actionImage: "https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&q=80&w=800",
      color: "indigo",
      dos: [
        "Move inland and to high ground immediately if you feel an earthquake near the coast.",
        "Follow all evacuation signs and routes.",
        "Stay away from the beach until officials declare it safe.",
        "If you see the ocean receding unusually, run to high ground immediately."
      ],
      donts: [
        "Do not go to the coast to watch a tsunami; you cannot outrun it.",
        "Do not stay in low-lying coastal areas after a warning is issued.",
        "Do not return to the coast after the first wave; more waves may follow.",
        "Do not wait for an official warning if you see natural signs."
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      <header className="relative py-12 px-8 rounded-[40px] bg-midnight-900 border border-midnight-800 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-ocean-500/10 to-transparent"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-ocean-500/20 text-ocean-400 border border-ocean-500/30">
              <ShieldCheck size={20} />
            </div>
            <span className="text-xs font-bold text-ocean-400 uppercase tracking-[0.2em]">Survival Protocol</span>
          </div>
          <h1 className="text-5xl font-display font-bold text-white mb-6 leading-tight">
            Disaster Response <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean-400 to-cyan-300">Safety Guide</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Critical instructions and survival protocols for major natural disasters. 
            Knowledge is your first line of defense. Stay informed, stay safe.
          </p>
        </div>
      </header>

      <div className="grid gap-8">
        {guides.map((guide, idx) => (
          <SafetySection key={idx} {...guide} />
        ))}
      </div>

      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">3D Visual Tips Gallery</h2>
            <p className="text-slate-500 text-sm">Quick visual references for emergency situations</p>
          </div>
          <div className="flex gap-2">
            <div className="h-1 w-12 rounded-full bg-ocean-500"></div>
            <div className="h-1 w-4 rounded-full bg-midnight-800"></div>
            <div className="h-1 w-4 rounded-full bg-midnight-800"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: "Survival Kit", img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400", label: "Essentials" },
            { title: "First Aid", img: "https://images.unsplash.com/photo-1583324113626-70df0f4deaab?auto=format&fit=crop&q=80&w=400", label: "Medical" },
            { title: "Radio", img: "https://images.unsplash.com/photo-1593115057322-e94b77572f20?auto=format&fit=crop&q=80&w=400", label: "Comms" },
            { title: "Flashlight", img: "https://images.unsplash.com/photo-1554734867-bf3c00a49371?auto=format&fit=crop&q=80&w=400", label: "Light" },
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.05 }}
              className="relative group rounded-2xl overflow-hidden border border-midnight-800 aspect-square"
            >
              <img 
                src={item.img} 
                alt={item.title} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-xs font-bold text-white">{item.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="bg-midnight-900/30 border border-midnight-800 p-8 rounded-[32px] text-center">
        <div className="inline-flex items-center gap-2 text-amber-400 font-bold mb-4">
          <AlertCircle size={20} />
          <span>EMERGENCY CONTACTS</span>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-midnight-900/50 border border-midnight-800">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Police / Fire</p>
            <p className="text-2xl font-display font-bold text-white tracking-widest">100 / 101</p>
          </div>
          <div className="p-4 rounded-2xl bg-midnight-900/50 border border-midnight-800">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Ambulance</p>
            <p className="text-2xl font-display font-bold text-white tracking-widest">102</p>
          </div>
          <div className="p-4 rounded-2xl bg-midnight-900/50 border border-midnight-800">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Disaster Mgmt</p>
            <p className="text-2xl font-display font-bold text-white tracking-widest">108</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
