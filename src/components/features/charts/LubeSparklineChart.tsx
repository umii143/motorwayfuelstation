import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface SparklineProps {
   
  data: unknown[];
  dataKey: string;
  color: string;
  duration?: number;
}

export default function LubeSparklineChart({ data, dataKey, color, duration = 2000 }: SparklineProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <defs>
          <linearGradient id={`sparklineGrad-${dataKey}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0}/>
            <stop offset="50%" stopColor={color} stopOpacity={1}/>
            <stop offset="100%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={`url(#sparklineGrad-${dataKey})`} 
          strokeWidth={3} 
          dot={false} 
          strokeLinecap="round" 
          isAnimationActive={true} 
          animationDuration={duration} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
