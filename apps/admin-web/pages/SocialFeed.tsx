import React, { useState, useEffect } from 'react';
import { Twitter, MessageCircle, RefreshCw, Sparkles, Facebook, Instagram, Filter, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { analyzeSocialSentiment, filterRelevantPosts } from '../services/geminiService';
import { SocialPost } from '../types';

// Expanded Mock Data containing Noise + Signals
const RAW_SOCIAL_DATA: SocialPost[] = [
  { 
    id: '1', platform: 'Twitter', author: '@coastal_watch', 
    content: 'Huge waves hitting Marina Beach right now! Water entering service road. #ChennaiRains #HighWaves', 
    sentiment: 'Panic', hashtags: ['#ChennaiRains'], timestamp: Date.now() - 100000, likes: 234,
    comments: [{id: 'c1', user: 'raj123', text: 'Stay safe!'}]
  },
  { 
    id: '2', platform: 'Instagram', author: 'chennai_foodie', 
    content: 'Loving this rainy weather! Perfect for hot coffee ☕️🌧️ #MonsoonVibes', 
    sentiment: 'Neutral', hashtags: ['#MonsoonVibes'], timestamp: Date.now() - 500000, likes: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500&auto=format&fit=crop&q=60',
    comments: [] 
  },
  { 
    id: '3', platform: 'Facebook', author: 'Nagapattinam Locals', 
    content: 'URGENT: Water level rising in low lying areas near the port. Please evacuate immediately if you are in Zone B.', 
    sentiment: 'Informative', hashtags: ['#FloodAlert'], timestamp: Date.now() - 50000, likes: 56,
    comments: [{id: 'c2', user: 'priya_s', text: 'Sharing this now.'}, {id: 'c3', user: 'gov_official', text: 'Rescue teams dispatched.'}]
  },
  { 
    id: '4', platform: 'Twitter', author: '@tech_guru', 
    content: 'Just bought the new iPhone! The camera is insane. #Tech #Apple', 
    sentiment: 'Neutral', hashtags: ['#Tech'], timestamp: Date.now() - 800000, likes: 5, comments: []
  },
  { 
    id: '5', platform: 'Reddit', author: 'u/disaster_prepper', 
    content: 'Tsunami warning sirens heard in Cuddalore. Can anyone confirm? Not seeing news yet.', 
    sentiment: 'Panic', hashtags: ['#Tsunami'], timestamp: Date.now() - 20000, likes: 89,
    comments: [{id: 'c4', user: 'local_guy', text: 'I hear it too.'}]
  },
  {
     id: '6', platform: 'Instagram', author: 'nature_clicks',
     content: 'Look at these scary clouds approaching the coast! 🌪️ Never seen anything like this.',
     sentiment: 'Panic', hashtags: ['#Cyclone', '#Nature'], timestamp: Date.now() - 15000, likes: 450,
     imageUrl: 'https://images.unsplash.com/photo-1454789476662-b484353a159e?w=500&auto=format&fit=crop&q=60',
     comments: []
  }
];

export const SocialFeed: React.FC = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<SocialPost[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  const connectSocialAPIs = () => {
    setLoading(true);
    // Simulate API Latency for FB/Insta/Twitter
    setTimeout(() => {
      setPosts(RAW_SOCIAL_DATA);
      setFilteredPosts(RAW_SOCIAL_DATA); // Initially show all
      setApiConnected(true);
      setLoading(false);
    }, 1500);
  };

  const applyAIFilter = async () => {
    if (posts.length === 0) return;
    setFiltering(true);
    
    // Call Gemini to filter IDs
    const relevantIds = await filterRelevantPosts(posts.map(p => ({ id: p.id, text: p.content })));
    
    // Update State
    const relevant = posts.filter(p => relevantIds.includes(p.id));
    setFilteredPosts(relevant);
    
    // Also update sentiment analysis based on filtered posts
    const sentiment = await analyzeSocialSentiment(relevant.map(p => p.content));
    setAnalysis(sentiment);
    
    setFiltering(false);
  };

  const getPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'Twitter': return <Twitter size={18} className="text-sky-400" />;
      case 'Facebook': return <Facebook size={18} className="text-blue-500" />;
      case 'Instagram': return <Instagram size={18} className="text-pink-500" />;
      default: return <MessageCircle size={18} className="text-orange-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white">Social Intelligence Hub</h2>
          <p className="text-slate-400">Real-time ingestion from Facebook, Instagram, X (Twitter) & Reddit.</p>
        </div>
        
        <div className="flex gap-3">
          {!apiConnected ? (
            <button 
              onClick={connectSocialAPIs}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg font-bold"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              {loading ? 'Connecting APIs...' : 'Connect Social Streams'}
            </button>
          ) : (
            <button 
              onClick={applyAIFilter}
              disabled={filtering}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all shadow-lg font-bold border border-white/10 ${
                filtering ? 'bg-slate-700 text-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
              }`}
            >
              {filtering ? <Sparkles size={18} className="animate-spin text-yellow-400" /> : <Filter size={18} />}
              {filtering ? 'AI Filtering Noise...' : 'Apply AI Hazard Filter'}
            </button>
          )}
        </div>
      </div>

      {!apiConnected ? (
        <div className="flex flex-col items-center justify-center h-[400px] bg-midnight-900/50 border border-midnight-800 rounded-3xl border-dashed">
           <div className="flex gap-4 mb-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="bg-blue-600 p-4 rounded-full"><Facebook size={32} className="text-white"/></div>
             <div className="bg-pink-600 p-4 rounded-full"><Instagram size={32} className="text-white"/></div>
             <div className="bg-sky-500 p-4 rounded-full"><Twitter size={32} className="text-white"/></div>
           </div>
           <h3 className="text-xl font-bold text-slate-300">Data Streams Offline</h3>
           <p className="text-slate-500 mt-2 text-center max-w-md">Connect to the Graph API to begin ingesting real-time public posts from social networks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Insight Panel */}
          <div className="lg:col-span-3 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl p-8 shadow-xl border border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 opacity-10">
               <Sparkles size={150} />
             </div>
             <div className="flex justify-between items-start relative z-10">
               <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                    <Sparkles size={24} className="text-yellow-400" />
                    AI Situation Summary
                  </h3>
                  <p className="text-xs text-indigo-200 uppercase tracking-widest font-bold mb-4">Based on {filteredPosts.length} filtered reports</p>
               </div>
               {analysis && (
                 <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/20">
                    LIVE UPDATE
                 </div>
               )}
             </div>
             
             {filtering ? (
               <div className="flex items-center gap-3 text-indigo-300">
                 <RefreshCw className="animate-spin" /> Analyzing content patterns...
               </div>
             ) : (
               <p className="text-indigo-100 leading-relaxed max-w-4xl font-medium text-lg">
                 {analysis || "Waiting for filtered data to generate insights..."}
               </p>
             )}
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-2">
               <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 Live Feed 
                 <span className="text-xs bg-midnight-800 text-slate-400 px-2 py-0.5 rounded-full border border-midnight-700">
                   {filteredPosts.length} posts
                 </span>
               </h3>
               {filteredPosts.length < posts.length && (
                 <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                   <CheckCircle2 size={12} /> Noise Filtered ({posts.length - filteredPosts.length} hidden)
                 </span>
               )}
            </div>

            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-midnight-900 border border-midnight-800 p-5 rounded-2xl hover:border-ocean-600 transition-all group shadow-lg">
                <div className="flex gap-4">
                  {/* Avatar / Platform Icon */}
                  <div className="flex-shrink-0">
                     <div className="w-10 h-10 rounded-full bg-midnight-800 flex items-center justify-center border border-midnight-700">
                        {getPlatformIcon(post.platform)}
                     </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors block">{post.author}</span>
                        <span className="text-xs text-slate-500">{post.platform} • {Math.floor((Date.now() - post.timestamp) / 60000)}m ago</span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border tracking-wide ${
                        post.sentiment === 'Panic' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        post.sentiment === 'Informative' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/30'
                      }`}>
                        {post.sentiment}
                      </span>
                    </div>

                    <p className="text-slate-300 mt-2 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    
                    {post.imageUrl && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-midnight-700 max-h-60 relative">
                        <img src={post.imageUrl} alt="Post content" className="w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-midnight-900/50 to-transparent"></div>
                      </div>
                    )}

                    {/* Hashtags */}
                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.hashtags.map(tag => (
                          <span key={tag} className="text-xs text-ocean-400 hover:text-ocean-300 cursor-pointer">{tag}</span>
                        ))}
                      </div>
                    )}

                    {/* Comments Preview */}
                    {post.comments.length > 0 && (
                      <div className="mt-4 bg-midnight-950/50 rounded-lg p-3 border border-midnight-800/50">
                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Comments</p>
                        {post.comments.map(c => (
                          <div key={c.id} className="text-xs text-slate-400 mb-1 last:mb-0">
                            <span className="font-bold text-slate-300 mr-2">{c.user}:</span>
                            {c.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredPosts.length === 0 && (
               <div className="p-10 text-center text-slate-500 bg-midnight-900/50 border border-dashed border-midnight-800 rounded-2xl">
                 <p>No relevant hazard posts found in current stream.</p>
               </div>
            )}
          </div>

          {/* Right Sidebar: Trends */}
          <div className="space-y-6">
            <div className="bg-midnight-900 border border-midnight-800 rounded-2xl p-6 h-fit shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4">Active Hashtags</h3>
              <div className="space-y-4">
                {[
                  { tag: '#CycloneAlert', count: '12.5k', platform: 'Twitter' },
                  { tag: '#ChennaiFloods', count: '8.1k', platform: 'Instagram' },
                  { tag: '#HelpNeeded', count: '2.2k', platform: 'Facebook' },
                  { tag: '#TsunamiRumor', count: '1.2k', platform: 'Reddit' }
                ].map((item) => (
                  <div key={item.tag} className="flex justify-between items-center group cursor-pointer p-2 hover:bg-midnight-800 rounded-lg transition-colors">
                    <span className="text-slate-400 font-medium group-hover:text-neon-cyan transition-colors">{item.tag}</span>
                    <span className="text-xs bg-midnight-950 px-2 py-1 rounded text-slate-500 font-mono flex items-center gap-1">
                      {item.platform === 'Twitter' ? <Twitter size={10} /> : <MessageCircle size={10} />}
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
               <h4 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
                 <AlertTriangle size={16} /> DATA SOURCE INFO
               </h4>
               <p className="text-xs text-blue-200/70 leading-relaxed">
                 The feed is currently running in <strong>Simulation Mode</strong>. 
                 To ingest real-time data, configure the backend API keys for the Facebook Graph API and Twitter Developer Platform.
               </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};