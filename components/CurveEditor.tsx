
import React, { useRef, useState, useEffect } from 'react';
import { CurvePoint } from '../types';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

interface CurveEditorProps {
  label: string;
  points: CurvePoint[];
  onChange: (points: CurvePoint[]) => void;
  color: string;
  minY: number;
  maxY: number;
}

// 智能输入组件，解决受控组件在输入时的抖动和自动格式化问题
const SmartInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  step?: string;
  className?: string;
}> = ({ value, onChange, disabled, step = "0.1", className }) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else {
      setLocalValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="text"
      value={localValue}
      disabled={disabled}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
    />
  );
};

const CurveEditor: React.FC<CurveEditorProps> = ({ label, points, onChange, color, minY, maxY }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const padding = 12;
  const width = 240;
  const height = 100;
  const rangeY = maxY - minY;

  const toSvgX = (t: number) => padding + t * (width - 2 * padding);
  const toSvgY = (v: number) => {
    const normalizedV = (v - minY) / rangeY;
    return height - (padding + normalizedV * (height - 2 * padding));
  };

  const fromSvgX = (x: number) => {
    const t = (x - padding) / (width - 2 * padding);
    return Math.min(1, Math.max(0, t));
  };

  const fromSvgY = (y: number) => {
    const normalizedV = (height - y - padding) / (height - 2 * padding);
    const v = normalizedV * rangeY + minY;
    return Math.min(maxY, Math.max(minY, v));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingIdx === null || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newPoints = [...points];
      if (draggingIdx === 0) {
        newPoints[0] = { time: 0, value: 0 };
      } else if (draggingIdx === points.length - 1) {
        newPoints[draggingIdx].time = 1;
        newPoints[draggingIdx].value = fromSvgY(y);
      } else {
        newPoints[draggingIdx].time = fromSvgX(x);
        newPoints[draggingIdx].value = fromSvgY(y);
      }

      const sorted = [...newPoints].sort((a, b) => a.time - b.time);
      onChange(sorted);
    };

    const handleMouseUp = () => setDraggingIdx(null);

    if (draggingIdx !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingIdx, points, onChange, minY, maxY]);

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击在现有的点上
    const clickedIdx = points.findIndex(p => 
      Math.abs(toSvgX(p.time) - x) < 8 && Math.abs(toSvgY(p.value) - y) < 8
    );

    if (clickedIdx !== -1) {
      if (clickedIdx !== 0) setDraggingIdx(clickedIdx);
      return;
    }

    // 在线条上添加新点
    const time = fromSvgX(x);
    const value = fromSvgY(y);
    const newPoints = [...points, { time, value }].sort((a, b) => a.time - b.time);
    onChange(newPoints);
    
    // 立即开始拖拽新创建的点
    const newIdx = newPoints.findIndex(p => p.time === time);
    if (newIdx !== -1 && newIdx !== 0) setDraggingIdx(newIdx);
  };

  const updatePoint = (index: number, field: keyof CurvePoint, val: number) => {
    const newPoints = [...points];
    newPoints[index] = { ...newPoints[index], [field]: val };
    
    if (index === 0) {
      newPoints[0].time = 0;
      newPoints[0].value = 0;
    } else if (index === points.length - 1) {
      newPoints[index].time = 1;
    }

    const sorted = [...newPoints].sort((a, b) => a.time - b.time);
    onChange(sorted);
  };

  const deletePoint = (index: number) => {
    if (index === 0 || index === points.length - 1) return;
    onChange(points.filter((_, i) => i !== index));
  };

  // 生成平滑的贝塞尔曲线路径 (类似 Unity)
  const renderSmoothPath = () => {
    if (points.length < 2) return "";
    
    let d = `M ${toSvgX(points[0].time)} ${toSvgY(points[0].value)}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      
      const x0 = toSvgX(p0.time);
      const y0 = toSvgY(p0.value);
      const x1 = toSvgX(p1.time);
      const y1 = toSvgY(p1.value);
      
      // 计算控制点：水平拉伸以产生平滑感，模拟 Unity 的 Auto Tangents
      const cpX1 = x0 + (x1 - x0) / 2.5;
      const cpX2 = x1 - (x1 - x0) / 2.5;
      
      d += ` C ${cpX1} ${y0}, ${cpX2} ${y1}, ${x1} ${y1}`;
    }
    return d;
  };

  return (
    <div className="mb-6 group">
      <div className="flex justify-between items-center mb-2 px-1">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronDown size={12} className="text-blue-400" /> : <ChevronRight size={12} />}
          {label}
        </button>
        <span className="text-[10px] font-mono text-slate-600">
          [{points[points.length-1].value.toFixed(1)}]
        </span>
      </div>

      <div className="relative bg-slate-950/50 rounded-xl border border-slate-800/50 overflow-hidden shadow-inner transition-colors">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="cursor-crosshair block"
          onMouseDown={handleSvgMouseDown}
        >
          {/* 网格背景 */}
          <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="#1e293b" strokeWidth="0.5" />
          <line x1={width-padding} y1={padding} x2={width-padding} y2={height-padding} stroke="#1e293b" strokeWidth="0.5" />
          
          {minY < 0 && maxY > 0 && (
            <line x1={padding} y1={toSvgY(0)} x2={width - padding} y2={toSvgY(0)} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 2" />
          )}
          
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#334155" strokeWidth="1" />
          
          {/* 曲线路径 */}
          <path 
            d={renderSmoothPath()} 
            fill="none" 
            stroke={color} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="opacity-90"
          />
          
          {points.map((p, i) => {
            const isLocked = i === 0;
            return (
              <circle
                key={i}
                cx={toSvgX(p.time)}
                cy={toSvgY(p.value)}
                r={draggingIdx === i ? 6 : 4.5}
                fill={isLocked ? '#475569' : (draggingIdx === i ? '#fff' : color)}
                stroke="#0f172a"
                strokeWidth="2"
                className={`${isLocked ? 'cursor-not-allowed' : 'cursor-move'} transition-all`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (!isLocked) setDraggingIdx(i);
                }}
              />
            );
          })}
        </svg>

        {/* 关键帧数值列表 - Unity 风格优化 */}
        {isExpanded && (
          <div className="bg-slate-900 border-t border-slate-800 p-2 text-[10px] space-y-1">
            <div className="grid grid-cols-7 gap-1 text-slate-500 font-bold uppercase mb-1 px-1">
              <div className="col-span-1">#</div>
              <div className="col-span-2">时间(T)</div>
              <div className="col-span-3">数值(V)</div>
              <div className="col-span-1"></div>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {points.map((p, i) => (
                <div key={i} className="grid grid-cols-7 gap-1 items-center bg-slate-950/40 p-1 rounded group/row hover:bg-slate-800/50 transition-colors">
                  <div className="col-span-1 text-slate-600 font-mono pl-1">{i}</div>
                  <div className="col-span-2">
                    <SmartInput
                      value={p.time}
                      disabled={i === 0 || i === points.length - 1}
                      onChange={(val) => updatePoint(i, 'time', val)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-blue-300 disabled:opacity-50 disabled:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                  </div>
                  <div className="col-span-3">
                    <SmartInput
                      value={p.value}
                      disabled={i === 0}
                      onChange={(val) => updatePoint(i, 'value', val)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-emerald-300 disabled:opacity-50 disabled:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {i !== 0 && i !== points.length - 1 && (
                      <button 
                        onClick={() => deletePoint(i)}
                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-all p-1"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
};

export default CurveEditor;
