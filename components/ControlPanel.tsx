
import React from 'react';
import { FloatConfig } from '../types';
import { RotateCcw, Activity, Download } from 'lucide-react';
import CurveEditor from './CurveEditor';

interface Props {
  config: FloatConfig;
  setConfig: React.Dispatch<React.SetStateAction<FloatConfig>>;
}

const ControlPanel: React.FC<Props> = ({ config, setConfig }) => {
  const updateConfig = (key: keyof FloatConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `damage_float_config_${new Date().getTime()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
  };

  const Slider = ({ label, val, min, max, step, k }: { label: string, val: number, min: number, max: number, step: number, k: keyof FloatConfig }) => (
    <div className="flex flex-col gap-1.5 mb-4 px-1">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
        <span className="text-xs font-mono text-blue-400 font-bold">{val}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={val}
        onChange={(e) => updateConfig(k, parseFloat(e.target.value))}
        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );

  return (
    <div className="absolute top-24 right-6 w-72 max-h-[82vh] bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-y-auto z-50 p-5 scrollbar-hide">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-900/10 backdrop-blur-sm pb-2 z-10 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h2 className="font-bold text-xs tracking-widest uppercase text-slate-200">特效工作台</h2>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={handleExport}
            title="导出 JSON 配置"
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => window.location.reload()}
            title="重置"
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 border-b border-slate-800 pb-1">时间与基本控制</h3>
          <Slider label="持续时间 (秒)" val={config.duration} min={0.2} max={4} step={0.1} k="duration" />
        </section>

        <section>
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 border-b border-slate-800 pb-1">位移曲线 (正值向上)</h3>
          <CurveEditor 
            label="垂直位移 (Y+ 向上)" 
            points={config.moveYCurve} 
            onChange={(pts) => updateConfig('moveYCurve', pts)}
            color="#ec4899" 
            minY={-100} 
            maxY={500} 
          />
          <CurveEditor 
            label="水平位移 (X+ 向右)" 
            points={config.moveXCurve} 
            onChange={(pts) => updateConfig('moveXCurve', pts)}
            color="#f59e0b" 
            minY={-300} 
            maxY={300} 
          />
        </section>

        <section>
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 border-b border-slate-800 pb-1">形态曲线 (视觉表现)</h3>
          <CurveEditor 
            label="缩放曲线" 
            points={config.scaleCurve} 
            onChange={(pts) => updateConfig('scaleCurve', pts)}
            color="#3b82f6" 
            minY={0}
            maxY={4} 
          />
          <CurveEditor 
            label="透明度曲线" 
            points={config.opacityCurve} 
            onChange={(pts) => updateConfig('opacityCurve', pts)}
            color="#10b981" 
            minY={0}
            maxY={1} 
          />
        </section>
      </div>

      <div className="mt-4 p-2 bg-slate-950/50 rounded-lg border border-slate-800">
        <p className="text-[9px] text-slate-500 leading-relaxed italic">
          提示：导出的 JSON 包含 (time, value) 关键帧列表，可直接对应 Unity AnimationCurve 的 Keyframes 数组。
        </p>
      </div>
    </div>
  );
};

export default ControlPanel;
