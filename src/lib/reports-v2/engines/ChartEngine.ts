/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * Chart Engine — Resolves chart data for any report engine type
 *
 * The Chart Engine decides what chart to render (bar, line, area, pie, etc.)
 * based on configuration. UI never decides chart type — this engine does.
 */

import { QueryContext, ChartResult, ChartType } from './types';
import { QueryEngine } from './QueryEngine';
import { getPrimaryDomainForEngine } from './RegisterEngine';

interface ChartDefinition {
  chartId: string;
  chartType: ChartType;
  title: string;
  titleUr: string;
  domain: string;
  xKey: string;
  yKeys: string[];
  colors?: string[];
  transform?: (docs: any[]) => any[];
}

const ENGINE_CHART_MAP: Record<string, ChartDefinition[]> = {
  BusinessDashboard: [
    {
      chartId: 'chart_sales_by_product', chartType: 'bar',
      title: 'Sales by Product', titleUr: 'پروڈکٹ کے مطابق سیلز',
      domain: 'SALES', xKey: 'productName', yKeys: ['totalAmount'],
      colors: ['#3498db'],
      transform: (docs) => {
        const grouped: Record<string, number> = {};
        docs.forEach((d: any) => {
          const name = d.productName || d.product || 'Unknown';
          grouped[name] = (grouped[name] || 0) + (Number(d.totalAmount) || 0);
        });
        return Object.entries(grouped).map(([productName, totalAmount]) => ({ productName, totalAmount }));
      }
    }
  ],

  SalesRegister: [
    {
      chartId: 'chart_hourly_sales', chartType: 'area',
      title: 'Hourly Sales', titleUr: 'گھنٹے کے مطابق سیلز',
      domain: 'SALES', xKey: 'hour', yKeys: ['amount'],
      colors: ['#2ecc71'],
      transform: (docs) => {
        const hourly: Record<number, number> = {};
        docs.forEach((d: any) => {
          const date = new Date(d.date || d.createdAt || d.timestamp);
          const hour = date.getHours();
          hourly[hour] = (hourly[hour] || 0) + (Number(d.totalAmount) || 0);
        });
        return Object.entries(hourly)
          .map(([h, amount]) => ({ hour: `${h}:00`, amount }))
          .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
      }
    }
  ],

  StockDashboard: [
    {
      chartId: 'chart_tank_levels', chartType: 'bar',
      title: 'Tank Levels', titleUr: 'ٹینک لیول',
      domain: 'TANKS', xKey: 'name', yKeys: ['currentStock'],
      colors: ['#e74c3c', '#3498db']
    }
  ],

  ProfitReport: [
    {
      chartId: 'chart_sales_by_product', chartType: 'bar',
      title: 'Sales by Product', titleUr: 'پروڈکٹ کے مطابق سیلز',
      domain: 'SALES', xKey: 'productName', yKeys: ['totalAmount'],
      colors: ['#f39c12'],
      transform: (docs) => {
        const grouped: Record<string, number> = {};
        docs.forEach((d: any) => {
          const name = d.productName || d.product || 'Unknown';
          grouped[name] = (grouped[name] || 0) + (Number(d.totalAmount) || 0);
        });
        return Object.entries(grouped).map(([productName, totalAmount]) => ({ productName, totalAmount }));
      }
    },
    {
      chartId: 'chart_daily_sales', chartType: 'area',
      title: 'Daily Sales Trend', titleUr: 'روزانہ سیلز ٹرینڈ',
      domain: 'SALES', xKey: 'day', yKeys: ['amount'],
      colors: ['#16a34a'],
      transform: (docs) => {
        const byDay: Record<string, number> = {};
        docs.forEach((d: any) => {
          const raw = d.timestamp || d.date || d.createdAt;
          if (!raw) return;
          const resolved: unknown = typeof raw?.toDate === 'function' ? raw.toDate() : raw;
          const parsed = new Date(resolved as any);
          if (Number.isNaN(parsed.getTime())) return;
          const day = parsed.toISOString().slice(0, 10);
          byDay[day] = (byDay[day] || 0) + (Number(d.totalAmount) || Number(d.amount) || 0);
        });
        return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, amount]) => ({ day, amount }));
      }
    }
  ],

  Variance: [
    {
      chartId: 'chart_variance_by_shift', chartType: 'bar',
      title: 'Variance by Shift', titleUr: 'شفٹ کے مطابق فرق',
      domain: 'SHIFTS', xKey: 'shiftName', yKeys: ['varianceAmount'],
      colors: ['#ef4444'],
      transform: (docs) => docs.map((d: any) => ({ shiftName: d.shiftName || d._id?.slice(0, 8) || 'Shift', varianceAmount: Number(d.varianceAmount) || 0 })).slice(-20)
    },
    {
      chartId: 'chart_variance_daily', chartType: 'line',
      title: 'Daily Variance Trend', titleUr: 'روزانہ فرق ٹرینڈ',
      domain: 'SHIFTS', xKey: 'day', yKeys: ['amount'],
      colors: ['#f59e0b'],
      transform: (docs) => {
        const byDay: Record<string, number> = {};
        docs.forEach((d: any) => {
          const raw = d.timestamp || d.date || d.shiftEndTime || d.shiftStartTime;
          if (!raw) return;
          const resolved: unknown = typeof raw?.toDate === 'function' ? raw.toDate() : raw;
          const parsed = new Date(resolved as any);
          if (Number.isNaN(parsed.getTime())) return;
          const day = parsed.toISOString().slice(0, 10);
          byDay[day] = (byDay[day] || 0) + (Number(d.varianceAmount) || 0);
        });
        return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, amount]) => ({ day, amount }));
      }
    }
  ]
};

export class ChartEngine {
  private static instance: ChartEngine;
  private queryEngine: QueryEngine;

  private constructor() {
    this.queryEngine = QueryEngine.getInstance();
  }

  static getInstance(): ChartEngine {
    if (!ChartEngine.instance) {
      ChartEngine.instance = new ChartEngine();
    }
    return ChartEngine.instance;
  }

  async resolveCharts(engineType: string, context: QueryContext, useArchive = false): Promise<ChartResult[]> {
    const definitions = ENGINE_CHART_MAP[engineType];
    const results: ChartResult[] = [];

    if (definitions && definitions.length > 0) {
      const allDomains = Array.from(new Set(definitions.map(d => d.domain)));
      const rawData = await this.queryEngine.queryMultiple(allDomains, context, useArchive);

      for (const def of definitions) {
        const docs = rawData[def.domain]?.documents || [];
        const data = def.transform ? def.transform(docs) : docs;
        results.push({
          chartId: def.chartId,
          chartType: def.chartType,
          title: def.title,
          titleUr: def.titleUr,
          data,
          xKey: def.xKey,
          yKeys: def.yKeys,
          colors: def.colors
        });
      }
    } else {
      // Generic fallback (Rule #48): derive a real daily activity chart from
      // the engine's primary register domain — every report gets a genuine
      // visualization of its own live data, never a decorative placeholder.
      const fallback = await this.buildFallbackDailyChart(engineType, context, useArchive);
      if (fallback) results.push(fallback);
    }

    return results;
  }

  /**
   * Builds a deterministic 'records per day' bar chart from the engine's
   * primary register domain. Returns null when no records exist.
   * Safely handles Firestore Timestamp / string / Date date fields.
   */
  private async buildFallbackDailyChart(engineType: string, context: QueryContext, useArchive = false): Promise<ChartResult | null> {
    const domain = getPrimaryDomainForEngine(engineType);
    if (!domain) return null;

    const raw = await this.queryEngine.query(domain, context, useArchive);
    const docs = raw.documents;
    if (docs.length === 0) return null;

    const byDay: Record<string, number> = {};
    docs.forEach((d: any) => {
      const rawDate = d.timestamp || d.date || d.createdAt;
      if (!rawDate) return;
      // Firestore Timestamps are objects with toDate(); strings/Dates pass through.
      const resolved: unknown = typeof rawDate?.toDate === 'function' ? rawDate.toDate() : rawDate;
      const parsed = new Date(resolved as any);
      if (Number.isNaN(parsed.getTime())) return; // skip invalid date values
      const day = parsed.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });

    const data = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day, count }));

    if (data.length === 0) return null;

    return {
      chartId: `chart_${engineType}_daily`,
      chartType: 'bar',
      title: 'Records per Day',
      titleUr: 'روزانہ ریکارڈز',
      data,
      xKey: 'day',
      yKeys: ['count'],
      colors: ['#3498db']
    };
  }
}
