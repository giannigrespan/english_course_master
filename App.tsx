import React, { useState, useEffect } from 'react';
import { AppView, Topic } from './types';
import { TOPICS, LEVEL_LABELS, RANK_THRESHOLDS } from './constants';
import LessonView from './components/LessonView';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  // State with persistence initialization
  const [userXP, setUserXP] = useState(() => {
    const saved = localStorage.getItem('linguaquest_xp');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('linguaquest_completed');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [masterEmail, setMasterEmail] = useState(() => {
    return localStorage.getItem('linguaquest_master_email') || '';
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('linguaquest_xp', userXP.toString());
  }, [userXP]);

  useEffect(() => {
    localStorage.setItem('linguaquest_completed', JSON.stringify(Array.from(completedTopics)));
  }, [completedTopics]);

  useEffect(() => {
    localStorage.setItem('linguaquest_master_email', masterEmail);
  }, [masterEmail]);

  const currentRank = RANK_THRESHOLDS.slice().reverse().find(r => userXP >= r.xp) || RANK_THRESHOLDS[0];
  const nextRank = RANK_THRESHOLDS.find(r => r.xp > userXP);
  const progressToNext = nextRank 
    ? ((userXP - currentRank.xp) / (nextRank.xp - currentRank.xp)) * 100 
    : 100;

  const handleStartLesson = (topic: Topic) => {
    setSelectedTopic(topic);
    setView(AppView.LESSON);
  };

  const handleCompleteLesson = (score: number) => {
    let earnedXP = score * 50; 
    
    if (selectedTopic && !completedTopics.has(selectedTopic.id) && score >= 2) {
      earnedXP += 200; 
      setCompletedTopics(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedTopic.id);
        return newSet;
      });
    }

    setUserXP(prev => prev + earnedXP);
    setView(AppView.DASHBOARD);
    setSelectedTopic(null);
  };

  const sendReport = () => {
    if (!masterEmail) {
      alert("Per favore inserisci prima l'email del Master!");
      return;
    }

    const subject = `LinguaQuest Report: ${new Date().toLocaleDateString()}`;
    const completedList = TOPICS.filter(t => completedTopics.has(t.id)).map(t => `- ${t.title}`).join('\n');
    
    const body = `Hello Master,

Here is the progress report for the student.

🏆 Current Rank: ${currentRank.title}
⚡ Total XP: ${userXP}
📚 Completed Lessons (${completedTopics.size}):
${completedList || '(None yet)'}

Keep up the good work!
LinguaQuest App`;

    window.location.href = `mailto:${masterEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const renderProfile = () => (
    <div className="max-w-2xl mx-auto animate-fade-in-up pb-20">
      <h1 className="text-3xl font-bold text-white mb-8">Profilo Studente 👤</h1>

      {/* Stats Card */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="text-6xl">{currentRank.emoji}</div>
          <div>
            <h2 className="text-2xl font-bold text-white">{currentRank.title}</h2>
            <p className="text-slate-400">Livello attuale</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-xl">
            <div className="text-3xl font-bold text-yellow-400">{userXP}</div>
            <div className="text-xs text-slate-500 uppercase font-bold">Total XP</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl">
            <div className="text-3xl font-bold text-green-400">{completedTopics.size}</div>
            <div className="text-xs text-slate-500 uppercase font-bold">Lezioni Completate</div>
          </div>
        </div>
      </div>

      {/* Master Email Config */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          📧 Master Report
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          Inserisci l'email del genitore o dell'insegnante. Potrai inviare un report dettagliato dei progressi con un click.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Master Email</label>
            <input 
              type="email" 
              value={masterEmail}
              onChange={(e) => setMasterEmail(e.target.value)}
              placeholder="genitore@esempio.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <button 
            onClick={sendReport}
            className="w-full py-3 bg-white text-indigo-900 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <span>📤</span> Invia Report Generale
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <button 
          onClick={() => {
            if(confirm('Sei sicuro di voler cancellare tutti i progressi?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="text-red-400 text-sm hover:text-red-300 underline"
        >
          Reset Progressi (Cancellare Dati)
        </button>
      </div>
    </div>
  );

  const renderDashboard = () => {
    const topicsByLevel = TOPICS.reduce((acc, topic) => {
      acc[topic.level] = acc[topic.level] || [];
      acc[topic.level].push(topic);
      return acc;
    }, {} as Record<number, Topic[]>);

    return (
      <div className="space-y-12 pb-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 text-9xl transform translate-x-1/4 -translate-y-1/4">🇬🇧</div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">Hello, Champion! 👋</h1>
            <p className="text-lg md:text-xl opacity-90 mb-6 max-w-2xl">
              You are currently a <span className="font-bold text-yellow-300">{currentRank.title}</span>. 
              Keep learning to unlock new levels!
            </p>
            
            {/* Rank Progress */}
            <div className="max-w-md bg-black/20 rounded-full h-4 backdrop-blur-sm overflow-hidden mb-2">
              <div className="bg-yellow-400 h-full transition-all duration-1000" style={{ width: `${progressToNext}%` }}></div>
            </div>
            <p className="text-xs font-mono opacity-70">
              {nextRank ? `${Math.round(nextRank.xp - userXP)} XP to next rank` : 'Max Rank Reached!'}
            </p>
          </div>
        </div>

        {/* Topics List */}
        {Object.keys(LEVEL_LABELS).map((levelStr) => {
          const level = parseInt(levelStr);
          return (
            <div key={level} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 border border-slate-700">
                  {level}
                </div>
                <h2 className="text-2xl font-bold text-slate-200">
                  {LEVEL_LABELS[level as 1|2|3]}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {topicsByLevel[level]?.map((topic) => {
                  const isCompleted = completedTopics.has(topic.id);
                  return (
                    <button
                      key={topic.id}
                      onClick={() => handleStartLesson(topic)}
                      className={`group relative p-6 rounded-2xl text-left border transition-all duration-300 flex flex-col justify-between h-48 overflow-hidden
                        ${isCompleted 
                          ? 'bg-slate-800/80 border-green-500/50 hover:border-green-400 hover:bg-slate-800' 
                          : 'bg-slate-800 border-slate-700 hover:border-accent hover:bg-slate-750 shadow-md'
                        }
                      `}
                    >
                      {/* Background Decoration */}
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-white/5 to-white/0 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide
                             ${topic.category === 'grammar' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-pink-500/20 text-pink-300'}
                          `}>
                            {topic.category}
                          </span>
                          {isCompleted && (
                            <div className="bg-green-500 w-6 h-6 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
                              <span className="text-black font-bold text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors mb-2">
                          {topic.title}
                        </h3>
                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                          {topic.description}
                        </p>
                      </div>
                      
                      <div className="relative z-10 mt-auto pt-4 flex items-center text-xs font-bold text-slate-500 group-hover:text-white transition-colors">
                        {isCompleted ? 'REVIEW LESSON →' : 'START LESSON →'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark text-slate-100 font-sans selection:bg-secondary selection:text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-dark/90 backdrop-blur-xl border-b border-slate-800 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView(AppView.DASHBOARD)}>
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg group-hover:rotate-12 transition-transform">
              L
            </div>
            <span className="font-bold text-xl tracking-tight hidden md:block group-hover:text-white transition-colors">LinguaQuest</span>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setView(AppView.DASHBOARD)}
              className={`text-sm font-bold transition-all px-3 py-1.5 rounded-lg ${view === AppView.DASHBOARD ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Lessons
            </button>
            <button 
              onClick={() => setView(AppView.CHAT)}
              className={`text-sm font-bold transition-all px-3 py-1.5 rounded-lg ${view === AppView.CHAT ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Chat
            </button>
            <button 
              onClick={() => setView(AppView.PROFILE)}
              className={`text-sm font-bold transition-all px-3 py-1.5 rounded-lg flex items-center gap-2 ${view === AppView.PROFILE ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Profile & Settings"
            >
              <span>👤</span>
              <span className="hidden sm:inline">Profile</span>
            </button>
            
            {/* XP Counter (Desktop) */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-700">
               <div className="text-right">
                 <p className="text-xs text-slate-400 font-bold uppercase">{currentRank.title}</p>
                 <div className="flex items-center justify-end gap-1.5 text-yellow-400 font-black">
                   <span>{currentRank.emoji}</span>
                   <span>{userXP} XP</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        {view === AppView.DASHBOARD && renderDashboard()}
        {view === AppView.PROFILE && renderProfile()}
        
        {view === AppView.LESSON && selectedTopic && (
          <LessonView 
            topic={selectedTopic} 
            masterEmail={masterEmail}
            onComplete={handleCompleteLesson}
            onBack={() => setView(AppView.DASHBOARD)}
          />
        )}

        {view === AppView.CHAT && (
          <div className="animate-fade-in-up">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">English Chat Coach 🤖</h1>
              <p className="text-slate-400">Pratica l'inglese parlando con LinguaBot. Ti correggerà se sbagli!</p>
            </div>
            <ChatInterface />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;