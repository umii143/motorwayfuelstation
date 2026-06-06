import React, { useState, useEffect } from "react";
import { GlobalSettings } from "../../types";
import FleetHub from "./FleetHub/FleetHub";
import LogisticsHub from "./LogisticsHub/LogisticsHub";
import LossPreventionHub from "./LossPreventionHub/LossPreventionHub";
import MaintenanceHub from "./MaintenanceHub/MaintenanceHub";
import LoyaltyHub from "./LoyaltyHub/LoyaltyHub";
import BIAnalyticsHub from "./BIAnalyticsHub/BIAnalyticsHub";
import ERPHub from "./ERPHub/ERPHub";
import {
  CCTVIntegration,
  APIGateway
} from "./MiscEnterprise";
import {
  Truck,
  ArrowRightLeft,
  ShieldAlert,
  Wrench,
  Gift,
  LineChart,
  BarChart3,
  Link,
  Camera,
  Network
} from "lucide-react";

interface EnterpriseHubProps {
  settings: GlobalSettings;
  activeModule?: string;
  onNavigate?: (view: string) => void;
  stationId?: string;
}

export default function EnterpriseHub({ settings, activeModule = "fleet" }: EnterpriseHubProps) {
  const [currentTab, setCurrentTab] = useState(activeModule);

  // Sync tab if the prop changes from outside routing
  useEffect(() => {
    if (activeModule) {
      setCurrentTab(activeModule);
    }
  }, [activeModule]);

  const tabs = [
    { id: "fleet", label: "Fleet Hub", icon: <Truck className="h-4 w-4" />, component: <FleetHub settings={settings} /> },
    { id: "tanker_delivery", label: "Logistics", icon: <ArrowRightLeft className="h-4 w-4" />, component: <LogisticsHub settings={settings} /> },
    { id: "loss_prevention", label: "Loss Prevention", icon: <ShieldAlert className="h-4 w-4" />, component: <LossPreventionHub settings={settings} /> },
    { id: "loyalty", label: "Loyalty", icon: <Gift className="h-4 w-4" />, component: <LoyaltyHub settings={settings} /> },
    { id: "maintenance", label: "Maintenance", icon: <Wrench className="h-4 w-4" />, component: <MaintenanceHub settings={settings} /> },
    { id: "bi_analytics", label: "BI Analytics", icon: <LineChart className="h-4 w-4" />, component: <BIAnalyticsHub settings={settings} /> },
    { id: "demand_forecast", label: "Demand Forecast", icon: <BarChart3 className="h-4 w-4" />, component: <BIAnalyticsHub settings={settings} initialTab="forecast" /> },
    { id: "erp_integration", label: "ERP Link", icon: <Link className="h-4 w-4" />, component: <ERPHub settings={settings} /> },
    { id: "cctv", label: "CCTV", icon: <Camera className="h-4 w-4" />, component: <CCTVIntegration settings={settings} /> },
    { id: "api_gateway", label: "API Gateway", icon: <Network className="h-4 w-4" />, component: <APIGateway settings={settings} /> }
  ];

  const activeTabContent = tabs.find(t => t.id === currentTab)?.component || tabs[0].component;

  return (
    <div className="space-y-6">
      {/* Enterprise Tabs Nav */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-xl font-sans text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? "border-orange-500 text-orange-600 bg-orange-50/50"
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Render active module */}
      <div className="pt-2">
        {activeTabContent}
      </div>
    </div>
  );
}
