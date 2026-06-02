import React from "react";
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
  Network,
  ChevronRight,
} from "lucide-react";
import { GlobalSettings } from "../../types";

interface ModuleProps {
  settings: GlobalSettings;
}

export function FleetManagement({ settings }: ModuleProps) {
  const isUrdu = settings.language === "ur";
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-0.5">
            FLEET HUB
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-orange-600" />
            <span>Vehicles & Fleet Operations</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Enterprise fleet tracking, vehicle fuel limits, driver
            authorization, and mileage analytics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="font-mono text-[9px] font-black text-slate-400 uppercase">
            ACTIVE FLEETS
          </span>
          <h3 className="font-sans text-xl font-black text-slate-900 mt-1">
            12
          </h3>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="font-mono text-[9px] font-black text-slate-400 uppercase">
            TOTAL VEHICLES
          </span>
          <h3 className="font-sans text-xl font-black text-slate-900 mt-1">
            45
          </h3>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="font-mono text-[9px] font-black text-slate-400 uppercase">
            MONTHLY CONSUMPTION
          </span>
          <h3 className="font-sans text-xl font-black text-slate-900 mt-1">
            2,450 L
          </h3>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-emerald-50 p-5 shadow-sm">
          <span className="font-mono text-[9px] font-black text-emerald-600 uppercase">
            SYSTEM STATUS
          </span>
          <h3 className="font-sans text-xl font-black text-emerald-900 mt-1 flex items-center gap-2">
            Active{" "}
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </h3>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white flex flex-col p-8 items-center justify-center text-center">
        <Truck className="h-12 w-12 text-slate-200 mb-4" />
        <h3 className="font-sans text-lg font-bold text-slate-800">
          Fleet tracking ready
        </h3>
        <p className="text-slate-500 text-sm mt-2 max-w-md">
          Connect your corporate fleet accounts and transport vehicles to
          automate commercial fuel billing.
        </p>
        <button className="mt-6 bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition">
          Integrate RFID Accounts
        </button>
      </div>
    </div>
  );
}

export function TankerDelivery({ settings }: ModuleProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-rose-600 uppercase tracking-widest block mb-0.5">
            LOGISTICS
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-rose-600 animate-pulse" />
            <span>Delivery & Tanker Scheduling</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Real-time supply chain mapping, OMC delivery schedules, and tanker
            tracking.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white flex flex-col p-12 items-center justify-center text-center bg-gradient-to-b from-white to-slate-50">
        <ArrowRightLeft className="h-16 w-16 text-rose-100 mb-6" />
        <h3 className="font-sans text-xl font-black text-slate-900 tracking-tight">
          Logistics Engine Provisioning
        </h3>
        <p className="text-slate-500 text-sm mt-3 max-w-lg">
          Advanced GPS tanker integration and OMC delivery dispatch tracking
          algorithms are configuring limits based on geographical compliance.
        </p>
        <button className="mt-8 bg-rose-600 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-700 hover:-translate-y-0.5 transition-all">
          Configure OMC Endpoints
        </button>
      </div>
    </div>
  );
}

export function LossPrevention({ settings }: ModuleProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-red-600 uppercase tracking-widest block mb-0.5">
            AUDIT & SECURE
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            <span>Loss Prevention & Variances</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Automated detection algorithms for vapor loss, short delivery, and
            cashier cash variance anomalies.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
          <h4 className="font-sans text-sm font-bold text-rose-950 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>{" "}
            DIP Variance Tolerance
          </h4>
          <p className="text-xs text-rose-700 mt-2 font-medium">
            Monitoring standard thermal expansion and transit loss metrics. AI
            thresholds currently analyzing seasonal temperatures.
          </p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
          <h4 className="font-sans text-sm font-bold text-amber-950 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div> Cash
            Register Reconciliation
          </h4>
          <p className="text-xs text-amber-700 mt-2 font-medium">
            Automatic float discrepancy catching enabled. Shift tolerance bounds
            active at Rs. 500 drift margin.
          </p>
        </div>
      </div>
    </div>
  );
}

export function MaintenanceAssets({ settings }: ModuleProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">
            FACILITY MANAGEMENT
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-blue-600" />
            <span>Maintenance & Assets</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Predictive maintenance for dispenser nozzles, underground tanks, and
            station infrastructure.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Wrench className="h-10 w-10 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-800">Asset Registry</h3>
          <p className="text-slate-500 text-xs mt-1">
            No pending maintenance tickets. Infrastructure operating nominally.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoyaltyRewards({ settings }: ModuleProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-purple-600 uppercase tracking-widest block mb-0.5">
            ENGAGEMENT
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Gift className="h-6 w-6 text-purple-600" />
            <span>Loyalty & Rewards Program</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Customer retention mechanics, point accumulation ledger, and
            promotional campaigns.
          </p>
        </div>
      </div>
      <div className="rounded-3xl bg-gradient-to-br from-purple-900 to-indigo-900 p-8 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Gift className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-sm">
          <h3 className="font-sans text-2xl font-black tracking-tight mb-2">
            Engage Customers
          </h3>
          <p className="text-purple-200 text-sm mb-6">
            Launch point-based reward systems and issue premium NFC membership
            cards to loyal patrons to drive repeated visits and localized market
            share.
          </p>
          <button className="bg-white text-purple-900 font-bold px-5 py-2.5 rounded-lg text-xs shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

export function BIAnalytics({ settings }: ModuleProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-0.5">
            EXECUTIVE VIEW
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <LineChart className="h-6 w-6 text-emerald-600" />
            <span>Business Intelligence & Analytics</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Deep visualization, multi-dimensional revenue charting, and
            enterprise KPIs.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 min-h-[250px] flex flex-col items-center justify-center">
          <LineChart className="h-8 w-8 text-slate-200 mb-2" />
          <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest">
            Growth Trajectory
          </h4>
          <span className="mt-2 text-[10px] text-slate-400">
            Compiling multi-axial data lakes...
          </span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 min-h-[250px] flex flex-col items-center justify-center">
          <BarChart3 className="h-8 w-8 text-slate-200 mb-2" />
          <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest">
            Category Vectors
          </h4>
          <span className="mt-2 text-[10px] text-slate-400">
            Processing volumetric aggregations...
          </span>
        </div>
      </div>
    </div>
  );
}

export function DemandForecast({ settings }: ModuleProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">
            AI HUB
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            <span>Demand Forecasting</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Machine Learning-driven predictive models forecasting pump usage
            based on historical trends, weekends, and tariff hikes.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-8 flex items-center justify-between">
        <div className="max-w-md">
          <h3 className="font-sans text-lg font-black text-indigo-950 mb-2">
            Smart Predictor Initializing
          </h3>
          <p className="text-indigo-800 text-sm font-medium">
            The forecasting engine requires at least 30 days of continuous shift
            logs to establish baseline seasonality variants. Continue operating
            Shift Wizard normally.
          </p>
        </div>
        <div className="hidden lg:flex w-24 h-24 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin items-center justify-center shadow-lg">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-b-indigo-500 animate-spin reverse"></div>
        </div>
      </div>
    </div>
  );
}

export function ERPIntegration({ settings }: ModuleProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-teal-600 uppercase tracking-widest block mb-0.5">
            SYSTEM INTEROP
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Link className="h-6 w-6 text-teal-600" />
            <span>ERP & Accounting Integration</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Push real-time ledgers to SAP, Oracle, QuickBooks, or Xero via
            secure webhooks.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["SAP S/4HANA", "Oracle NetSuite", "QuickBooks Cloud"].map((erp) => (
          <div
            key={erp}
            className="rounded-xl border border-slate-200 bg-white p-5 cursor-pointer hover:border-teal-500 hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Link className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900">{erp}</h4>
            <p className="text-xs text-slate-500 block mt-1">
              Connect natively via REST
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CCTVIntegration({ settings }: ModuleProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black text-slate-900 uppercase tracking-widest block mb-0.5">
            PHYSICAL SECURITY
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Camera className="h-6 w-6 text-slate-900" />
            <span>CCTV & Surveillance Gateway</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            DVR/NVR IP bridge for license plate recognition (ALPR) and real-time
            forecourt monitoring.
          </p>
        </div>
      </div>
      <div className="aspect-video w-full rounded-2xl bg-zinc-900 flex flex-col items-center justify-center text-zinc-500 shadow-2xl relative overflow-hidden border-8 border-zinc-950">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="font-mono text-xs text-red-500 uppercase tracking-widest">
            OFFLINE
          </span>
        </div>
        <Camera className="w-16 h-16 text-zinc-800 mb-4" />
        <h3 className="font-sans text-lg font-bold text-zinc-400">
          Awaiting IP Camera Stream
        </h3>
        <p className="text-zinc-600 text-xs mt-2">
          Provision RTSP feed endpoints in Advanced Settings
        </p>
      </div>
    </div>
  );
}

export function APIGateway({ settings }: ModuleProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="font-mono text-[9px] font-black tracking-widest text-[#f5146c] uppercase block mb-0.5">
            DEV PORTAL
          </span>
          <h2 className="font-sans text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Network className="h-6 w-6 text-[#f5146c]" />
            <span>API & Third-Party Gateway</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Headless GraphQL and REST endpoints for external dashboards and
            partner integrations.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="bg-slate-950 p-8 flex-1 text-slate-300 font-mono text-xs overflow-x-auto">
          <div className="text-emerald-400 mb-2"># Execute request</div>
          <div>
            curl -X GET "https://api.fuelportal.local/v1/shifts/latest" \
          </div>
          <div className="pl-4">
            -H "Authorization: Bearer sk_live_xxxxxxxxxxx" \
          </div>
          <div className="pl-4">-H "Content-Type: application/json"</div>
        </div>
        <div className="bg-slate-50 p-8 sm:w-72 flex flex-col justify-center border-l border-slate-200">
          <h3 className="font-bold text-slate-900 mb-2">Manage Webhooks</h3>
          <p className="text-xs text-slate-500 mb-6">
            Generate developer tokens and configure callback URLs.
          </p>
          <button className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-lg shadow-md hover:bg-slate-800 transition">
            View API Docs
          </button>
        </div>
      </div>
    </div>
  );
}
