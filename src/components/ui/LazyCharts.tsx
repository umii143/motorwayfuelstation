import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, PieChart, Pie
} from 'recharts';

// Wrapping Recharts in a standalone file so we can lazy load them.
// Recharts blocks the main thread during large renders.

export const LazyAreaChart = (props: React.ComponentProps<typeof AreaChart>) => <AreaChart {...props} />;
export const LazyArea = (props: React.ComponentProps<typeof Area>) => <Area {...props} />;
export const LazyXAxis = (props: React.ComponentProps<typeof XAxis>) => <XAxis {...props} />;
export const LazyYAxis = (props: React.ComponentProps<typeof YAxis>) => <YAxis {...props} />;
export const LazyTooltip = (props: React.ComponentProps<typeof Tooltip>) => <Tooltip {...props} />;
export const LazyResponsiveContainer = (props: React.ComponentProps<typeof ResponsiveContainer>) => <ResponsiveContainer {...props} />;
export const LazyBarChart = (props: React.ComponentProps<typeof BarChart>) => <BarChart {...props} />;
export const LazyBar = (props: React.ComponentProps<typeof Bar>) => <Bar {...props} />;
export const LazyCell = (props: React.ComponentProps<typeof Cell>) => <Cell {...props} />;
export const LazyLineChart = (props: React.ComponentProps<typeof LineChart>) => <LineChart {...props} />;
export const LazyLine = (props: React.ComponentProps<typeof Line>) => <Line {...props} />;
export const LazyPieChart = (props: React.ComponentProps<typeof PieChart>) => <PieChart {...props} />;
export const LazyPie = (props: React.ComponentProps<typeof Pie>) => <Pie {...props} />;

export default function RechartsModule() {
  return null; // Dummy export for dynamic import root if needed
}
