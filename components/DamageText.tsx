
import React, { useMemo } from 'react';
import { DamageInstance, DamageType, FloatConfig } from '../types';

interface Props {
  instance: DamageInstance;
  config: FloatConfig;
}

const DamageText: React.FC<Props> = ({ instance, config }) => {
  const { value, type, x, y } = instance;

  const styleClasses = useMemo(() => {
    switch (type) {
      case DamageType.CRITICAL:
        return 'text-amber-400 font-black drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] italic text-5xl font-orbitron scale-x-110';
      case DamageType.HEAL:
        return 'text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] text-4xl';
      case DamageType.MISS:
        return 'text-slate-500 font-bold text-3xl opacity-60 font-mono';
      default:
        return 'text-slate-50 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-4xl';
    }
  }, [type]);

  const animationId = `anim-${instance.id}`;
  const randomFactor = useMemo(() => 0.98 + Math.random() * 0.04, []);

  const generatedKeyframes = useMemo(() => {
    const samples = 20;
    const steps = [];

    const interpolate = (time: number, curve: {time: number, value: number}[]) => {
      const p2Idx = curve.findIndex(p => p.time >= time);
      if (p2Idx === 0) return curve[0].value;
      if (p2Idx === -1) return curve[curve.length - 1].value;
      const p1 = curve[p2Idx - 1];
      const p2 = curve[p2Idx];
      const t = (time - p1.time) / (p2.time - p1.time);
      return p1.value + t * (p2.value - p1.value);
    };

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const scale = interpolate(t, config.scaleCurve);
      const opacity = interpolate(t, config.opacityCurve);
      const moveX = interpolate(t, config.moveXCurve) * randomFactor;
      const moveY = -interpolate(t, config.moveYCurve) * randomFactor;
      
      const percentage = (t * 100).toFixed(1);
      steps.push(`${percentage}% { 
        transform: translate(${moveX}px, ${moveY}px) scale(${scale}); 
        opacity: ${opacity}; 
      }`);
    }

    return `@keyframes ${animationId} { ${steps.join('\n')} }`;
  }, [config, animationId, randomFactor]);

  return (
    <div
      className="absolute pointer-events-none z-10 flex flex-col items-center justify-center whitespace-nowrap"
      style={{ left: x, top: y }}
    >
      <div className={`${styleClasses}`} style={{
        animation: `${animationId} ${config.duration}s linear forwards`
      }}>
        {type === DamageType.CRITICAL && (
          <span className="text-[10px] tracking-widest text-center block font-black uppercase text-amber-500 drop-shadow-none mb-[-4px]">
            Critical Hit!
          </span>
        )}
        {type === DamageType.MISS ? "闪避" : value}
      </div>

      <style>{generatedKeyframes}</style>
    </div>
  );
};

export default DamageText;
