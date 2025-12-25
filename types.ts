
export enum DamageType {
  NORMAL = 'NORMAL',
  CRITICAL = 'CRITICAL',
  HEAL = 'HEAL',
  MISS = 'MISS'
}

export interface CurvePoint {
  time: number; // 0 to 1
  value: number; // 对应属性的值
}

export interface FloatConfig {
  duration: number; // 秒
  scaleCurve: CurvePoint[]; // 缩放关键帧
  opacityCurve: CurvePoint[]; // 透明度关键帧
  moveXCurve: CurvePoint[]; // 水平位移关键帧
  moveYCurve: CurvePoint[]; // 垂直位移关键帧
}

export interface DamageInstance {
  id: string;
  value: number | string;
  type: DamageType;
  x: number;
  y: number;
  createdAt: number;
}
