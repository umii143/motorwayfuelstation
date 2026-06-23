import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Responsive } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useWidgetEngine } from '../../stores/useWidgetEngine';
import { WidgetWrapper } from './WidgetWrapper';
import { Activity } from 'lucide-react';
import { HeroPerformanceWidget } from './instances/HeroPerformanceWidget';
import { ActiveShiftWidget } from './instances/ActiveShiftWidget';
import { TankHealthWidget } from './instances/TankHealthWidget';
import { TreasuryWidget } from './instances/TreasuryWidget';
import { SalesOverviewWidget } from './instances/SalesOverviewWidget';
import { ActivityFeedWidget } from './instances/ActivityFeedWidget';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ResponsiveGridLayout(props: any) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full">
      <Responsive width={width} {...props} />
    </div>
  );
}

export function DashboardCanvas() {
  const { activeLayout, manifests, isEditMode, updateWidgetLayouts } = useWidgetEngine();

  // Map widgets to react-grid-layout format
  const layout = useMemo(() => {
    if (!activeLayout) return [];
    return activeLayout.widgets.map(w => ({
      i: w.instanceId,
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
      minW: manifests[w.manifestId]?.minWidth || 1,
      minH: manifests[w.manifestId]?.minHeight || 1,
      isDraggable: isEditMode,
      isResizable: isEditMode,
    }));
  }, [activeLayout, manifests, isEditMode]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onLayoutChange = (newLayout: any[]) => {
    // Only update if in edit mode to prevent accidental saves during initial render
    if (isEditMode) {
      updateWidgetLayouts(newLayout);
    }
  };

  if (!activeLayout) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[400px]">
        <Activity className="w-8 h-8 text-slate-500 animate-pulse mb-4" />
        <div className="text-sm font-bold text-slate-400">Loading Dashboard Layout...</div>
      </div>
    );
  }

  if (activeLayout.widgets.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-white/10 rounded-[24px]">
        <div className="text-sm font-bold text-slate-400">Dashboard is Empty</div>
        <div className="text-xs text-slate-500 mt-2">Open the Widget Studio to add widgets.</div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-[600px] ${isEditMode ? 'bg-indigo-900/10 rounded-[24px] ring-1 ring-indigo-500/20' : ''}`}>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={180}
        containerPadding={[0, 0]}
        margin={[24, 24]}
        onLayoutChange={onLayoutChange}
        draggableHandle=".drag-handle"
        isDraggable={isEditMode}
        isResizable={isEditMode}
        useCSSTransforms={true}
      >
        {activeLayout.widgets.map((widget) => {
          const manifest = manifests[widget.manifestId];
          if (!manifest) return <div key={widget.instanceId} />;

          let WidgetComponent = null;
          if (manifest.id === 'hero-performance') {
             WidgetComponent = <HeroPerformanceWidget />;
          } else if (manifest.id === 'active-shift') {
             WidgetComponent = <ActiveShiftWidget />;
          } else if (manifest.id === 'tank-health') {
             WidgetComponent = <TankHealthWidget />;
          } else if (manifest.id === 'treasury') {
             WidgetComponent = <TreasuryWidget />;
          } else if (manifest.id === 'sales-overview') {
             WidgetComponent = <SalesOverviewWidget />;
          } else if (manifest.id === 'activity-feed') {
             WidgetComponent = <ActivityFeedWidget />;
          }

          return (
            <div key={widget.instanceId}>
              <WidgetWrapper instance={widget} manifest={manifest}>
                {WidgetComponent ? WidgetComponent : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <div className="text-xs font-bold text-slate-400">{manifest.name}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Component not mapped yet</div>
                  </div>
                )}
              </WidgetWrapper>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}
