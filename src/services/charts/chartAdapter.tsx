import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Enterprise Chart Adapter
 * 
 * Provides a unified API for charts to avoid vendor lock-in.
 * Currently uses Recharts. Future providers (Apache ECharts, Highcharts) 
 * can be implemented behind this interface without changing UI code.
 */

export interface ChartDataPoint {
  [key: string]: string | number | undefined;
}

export interface ChartProps {
  data: ChartDataPoint[];
  height?: number | string;
  colors?: string[];
}

export interface LineChartProps extends ChartProps {
  xAxisKey: string;
  lines: { key: string; color?: string; name?: string }[];
}

export interface BarChartProps extends ChartProps {
  xAxisKey: string;
  bars: { key: string; color?: string; name?: string }[];
  stacked?: boolean;
}

export interface PieChartProps extends ChartProps {
  dataKey: string;
  nameKey: string;
}

// Default Enterprise Colors
const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  height = 300, 
  xAxisKey, 
  lines,
  colors = DEFAULT_COLORS
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey={xAxisKey} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
          
          {lines.map((line, index) => (
            <Line 
              key={line.key}
              type="monotone" 
              dataKey={line.key} 
              name={line.name || line.key}
              stroke={line.color || colors[index % colors.length]} 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  height = 300, 
  xAxisKey, 
  bars,
  stacked = false,
  colors = DEFAULT_COLORS
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey={xAxisKey} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
            cursor={{ fill: '#f8fafc' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
          
          {bars.map((bar, index) => (
            <Bar 
              key={bar.key}
              dataKey={bar.key} 
              name={bar.name || bar.key}
              fill={bar.color || colors[index % colors.length]} 
              stackId={stacked ? "a" : undefined}
              radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  height = 300, 
  dataKey, 
  nameKey,
  colors = DEFAULT_COLORS
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey={dataKey}
            nameKey={nameKey}
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};
