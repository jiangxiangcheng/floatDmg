
import React, { useRef, useState, useEffect } from 'react';
import { FloatConfig } from '../types';
import { RotateCcw, Activity, Download, Upload, Clock, Zap, Timer } from 'lucide-react';
import CurveEditor from './CurveEditor';

interface Props {
  config: FloatConfig;
  setConfig: React.Dispatch<React.SetStateAction<FloatConfig>>;
}

const SmartSlider: React.FC<{
  label: string;
  val: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  icon?: React.ReactNode;
  unit?: string;
}> = ({ label, val, min, max, step, onChange, icon, unit = "s" }) => {
  const [localVal, setLocalVal] = useState(val.toString());

  useEffect(() => {
    setLocalVal(val.toString());
  }, [val]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalVal(e.target.value);
  };

  const handleBlur = () => {
    const parsed = parseFloat(localVal);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
      setLocalVal(clamped.toString());
    } else {
      setLocalVal(val.toString());
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-6 px-1 group">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-slate-500">{icon}</span>}
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-200 transition-colors">
            {label}
          </label>
        </div>
        <div className="relative">
          <input
            type="text"
            value={localVal}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            className="w-12 bg-slate-800/50 border border-slate-700/50 rounded px-1.5 py-0.5 text-[11px] font-mono text-blue-400 text-right focus:outline-none focus:border-blue-500/50 transition-all"
          />
          <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 font-bold">{unit}</span>
        </div>
      </div>
      <div className="relative flex items-center h-4">
        <div className="absolute w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 opacity-50" 
            style={{ width: `${((val - min) / (max - min)) * 100}%` }}
          />
        </div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={val}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute w-full h-full bg-transparent appearance-none cursor-pointer accent-blue-500 z-10"
        />
      </div>
    </div>
  );
};

const ControlPanel: React.FC<Props> = ({ config, setConfig }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateConfig = (key: keyof FloatConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `unity_damage_config_${new Date().getTime()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedConfig = JSON.parse(content);
        if (importedConfig && typeof importedConfig.duration === 'number') {
          setConfig(importedConfig);
        } else {
          alert("无效的配置文件格式");
        }
      } catch (error) {
        console.error("解析 JSON 失败:", error);
        alert("解析配置文件失败");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="absolute top-24 right-6 w-72 max-h-[82vh] bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-y-auto z-50 p-5 scrollbar-hide flex flex-col">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-900/10 backdrop-blur-sm pb-2 z-10 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h2 className="font-bold text-xs tracking-widest uppercase text-slate-200">Unity 适配工作台</h2>
        </div>
        <div className="flex gap-1">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          <button onClick={handleImportClick} title="导入" className="p-1.5 hover:bg-slate-800 rounded-lg text-emerald-400"><Upload className="w-3.5 h-3.5" /></button>
          <button onClick={handleExport} title="导出" className="p-1.5 hover:bg-slate-800 rounded-lg text-blue-400"><Download className="w-3.5 h-3.5" /></button>
          <button onClick={() => window.location.reload()} title="重置" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500"><RotateCcw className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        <section>
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 border-b border-slate-800 pb-1">时间与模拟设置</h3>
          <SmartSlider label="总时长" val={config.duration} min={0.1} max={5} step={0.05} onChange={(v) => updateConfig('duration', v)} icon={<Clock size={10} />} />
          <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
             <SmartSlider label="单次生成量" val={config.autoSpawnRate} min={1} max={20} step={1} unit="x" onChange={(v) => updateConfig('autoSpawnRate', v)} icon={<Zap size={10} />} />
             <SmartSlider label="生成间隔" val={config.autoSpawnInterval} min={0} max={2000} step={10} unit="ms" onChange={(v) => updateConfig('autoSpawnInterval', v)} icon={<Timer size={10} />} />
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 border-b border-slate-800 pb-1">Unity 坐标位移</h3>
          <CurveEditor 
            label="垂直位移 (Y+)" 
            points={config.moveYCurve} 
            onChange={(pts) => updateConfig('moveYCurve', pts)}
            color="#ec4899" 
            minY={-30} 
            maxY={150} 
          />
          <CurveEditor 
            label="水平位移 (X+)" 
            points={config.moveXCurve} 
            onChange={(pts) => updateConfig('moveXCurve', pts)}
            color="#f59e0b" 
            minY={-80} 
            maxY={80} 
          />
        </section>

        <section>
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 border-b border-slate-800 pb-1">形态曲线</h3>
          <CurveEditor label="缩放比例" points={config.scaleCurve} onChange={(pts) => updateConfig('scaleCurve', pts)} color="#3b82f6" minY={0} maxY={4} />
          <CurveEditor label="透明度" points={config.opacityCurve} onChange={(pts) => updateConfig('opacityCurve', pts)} color="#10b981" minY={0} maxY={1} />
        </section>
      </div>

      <div className="mt-6 p-2 bg-slate-950/50 rounded-lg border border-slate-800">
        <p className="text-[9px] text-slate-400 leading-relaxed italic text-center">
          当前模式：1:3.75 像素转换。导出的数值已优化为 Unity AnimationCurve 兼容格式。
        </p>
      </div>
    </div>
  );
};

export default ControlPanel;
