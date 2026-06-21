import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, PieChart, Pie
} from 'recharts';

// Wrapping Recharts in a standalone file so we can lazy load them.
// Recharts blocks the main thread during large renders.

export const LazyAreaChart = (props: any) => <AreaChart {...props} />;
export const LazyArea = (props: any) => <Area {...props} />;
export const LazyXAxis = (props: any) => <XAxis {...props} />;
export const LazyYAxis = (props: any) => <YAxis {...props} />;
export const LazyTooltip = (props: any) => <Tooltip {...props} />;
export const LazyResponsiveContainer = (props: any) => <ResponsiveContainer {...props} />;
export const LazyBarChart = (props: any) => <BarChart {...props} />;
export const LazyBar = (props: any) => <Bar {...props} />;
export const LazyCell = (props: any) => <Cell {...props} />;
export const LazyLineChart = (props: any) => <LineChart {...props} />;
export const LazyLine = (props: any) => <Line {...props} />;
export const LazyPieChart = (props: any) => <PieChart {...props} />;
export const LazyPie = (props: any) => <Pie {...props} />;

export default function RechartsModule() {
  return null; // Dummy export for dynamic import root if needed
}
