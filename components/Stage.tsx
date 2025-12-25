
import React from 'react';
import { DamageInstance, FloatConfig } from '../types';
import DamageText from './DamageText';

interface Props {
  instances: DamageInstance[];
  config: FloatConfig;
  onStageClick: (x: number, y: number) => void;
}

const Stage: React.FC<Props> = ({ instances, config, onStageClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    onStageClick(e.clientX, e.clientY);
  };

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden cursor-crosshair active:cursor-grabbing"
      onClick={handleClick}
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
        <div className="w-[80vw] h-[80vh] border border-dashed border-white rounded-3xl"></div>
      </div>
    </div>
  );
};

export default Stage;
