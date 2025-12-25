
import React, { useRef, useState, useEffect } from 'react';
import { DamageInstance, FloatConfig } from '../types';
import DamageText from './DamageText';

interface Props {
  instances: DamageInstance[];
  config: FloatConfig;
  onStageClick: (x: number, y: number) => void;
}

const Stage: React.FC<Props> = ({ instances, config, onStageClick }) => {
  const timerRef = useRef<number | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [isPressing, setIsPressing] = useState(false);

  const startContinuousSpawn = (x: number, y: number) => {
    if (timerRef.current) return;
    
    // 立即触发一次
    onStageClick(x, y);
    
    // 设置定时器持续触发
    timerRef.current = window.setInterval(() => {
      onStageClick(mousePosRef.current.x, mousePosRef.current.y);
    }, 100); // 每100ms触发一个
  };

  const stopContinuousSpawn = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 仅左键
    mousePosRef.current = { x: e.clientX, y: e.clientY };
    setIsPressing(true);
    startContinuousSpawn(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      stopContinuousSpawn();
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div 
      className={`absolute inset-0 w-full h-full overflow-hidden cursor-crosshair transition-all ${isPressing ? 'bg-blue-500/5' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      {instances.map((instance) => (
        <DamageText 
          key={instance.id} 
          instance={instance} 
          config={config} 
        />
      ))}
      
      {/* Helper Grid */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <div className={`w-[80vw] h-[80vh] border border-dashed border-white rounded-3xl transition-transform duration-300 ${isPressing ? 'scale-105' : 'scale-100'}`}></div>
      </div>

      {/* 提示信息 */}
      <div className="absolute top-28 left-6 pointer-events-none animate-pulse">
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
          {isPressing ? "正在快速释放..." : "点击或按住屏幕任何位置查看效果"}
        </p>
      </div>
    </div>
  );
};

export default Stage;
