
import React, { useState, useCallback, useEffect } from 'react';
import { Zap, Play, Trash2, Sparkles, MessageSquare } from 'lucide-react';
import { FloatConfig, DamageType, DamageInstance } from './types';
import Stage from './components/Stage';
import ControlPanel from './components/ControlPanel';
import { GoogleGenAI } from "@google/genai";

const INITIAL_CONFIG: FloatConfig = {
  duration: 1.2,
  scaleCurve: [
    { time: 0, value: 0 },
    { time: 0.1, value: 1.8 },
    { time: 0.3, value: 1.2 },
    { time: 1, value: 1.0 }
  ],
  opacityCurve: [
    { time: 0, value: 0 },
    { time: 0.1, value: 1 },
    { time: 0.7, value: 1 },
    { time: 1, value: 0 }
  ],
  moveXCurve: [
    { time: 0, value: 0 },
    { time: 0.4, value: 40 },
    { time: 1, value: 80 }
  ],
  moveYCurve: [
    { time: 0, value: 0 },
    { time: 0.2, value: 150 },
    { time: 1, value: 250 }
  ]
};

const App: React.FC = () => {
  const [config, setConfig] = useState<FloatConfig>(INITIAL_CONFIG);
  const [activeDamages, setActiveDamages] = useState<DamageInstance[]>([]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [aiScenario, setAiScenario] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const triggerDamage = useCallback((x?: number, y?: number, type?: DamageType) => {
    const id = Math.random().toString(36).substr(2, 9);
    const defaultType = type || (Math.random() > 0.85 ? DamageType.CRITICAL : DamageType.NORMAL);
    
    let value: number | string = Math.floor(Math.random() * 999) + 1;
    if (defaultType === DamageType.CRITICAL) value = Math.floor(value * 2.5);
    if (defaultType === DamageType.MISS) value = "MISS";

    const newInstance: DamageInstance = {
      id,
      value,
      type: defaultType,
      x: x !== undefined ? x : window.innerWidth / 2,
      y: y !== undefined ? y : window.innerHeight / 2,
      createdAt: Date.now()
    };

    setActiveDamages(prev => [...prev, newInstance]);

    setTimeout(() => {
      setActiveDamages(prev => prev.filter(d => d.id !== id));
    }, config.duration * 1000 + 500);
  }, [config.duration]);

  useEffect(() => {
    let interval: any;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        const x = Math.random() * (window.innerWidth * 0.6) + (window.innerWidth * 0.2);
        const y = Math.random() * (window.innerHeight * 0.6) + (window.innerHeight * 0.2);
        triggerDamage(x, y);
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, triggerDamage]);

  const generateScenario = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "生成一个简短、史诗级的 RPG 战斗场景描述（1 句话，中文）。"
      });
      setAiScenario(response.text || "一股神秘的力量发起了攻击！");
      for(let i=0; i<12; i++) {
        setTimeout(() => triggerDamage(), i * 80);
      }
    } catch (error) {
      console.error(error);
      setAiScenario("战斗进入了白热化！");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#ffffff11 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <Stage 
        instances={activeDamages} 
        config={config} 
        onStageClick={(x, y) => triggerDamage(x, y)} 
      />

      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isAutoPlaying ? 'bg-orange-500' : 'bg-slate-700'} transition-colors shadow-lg`}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold font-orbitron tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                  伤害飘字模拟器
                </h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">RPG Damage Text VFX Designer</p>
              </div>
            </div>
            <div className="flex gap-2">
               <button 
                onClick={generateScenario}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-900/20"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold">AI 爆发</span>
              </button>
              <button 
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg ${isAutoPlaying ? 'bg-rose-600 shadow-rose-900/20' : 'bg-emerald-600 shadow-emerald-900/20'}`}
              >
                {isAutoPlaying ? <Trash2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="text-sm font-semibold">{isAutoPlaying ? '停止' : '自动'}</span>
              </button>
            </div>
          </div>
          
          {aiScenario && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <MessageSquare className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              <p className="text-xs text-indigo-200 italic line-clamp-1">{aiScenario}</p>
            </div>
          )}
        </div>
      </div>

      <ControlPanel config={config} setConfig={setConfig} />

      <div className="absolute bottom-6 left-6 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
        Ref: 2.5-Flash-Preview • Design by AI
      </div>
      
      <div className="absolute bottom-6 right-6 flex gap-4">
        <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-mono text-slate-300">活跃实例: {activeDamages.length}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
