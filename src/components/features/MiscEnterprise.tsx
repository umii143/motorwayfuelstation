import React from "react";
import { Camera, Network } from "lucide-react";
import { GlobalSettings } from "../../types";

export function CCTVIntegration({ settings }: { settings: GlobalSettings }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white flex flex-col p-8 items-center justify-center text-center">
      <Camera className="h-12 w-12 text-slate-200 mb-4" />
      <h3 className="font-sans text-lg font-bold text-slate-800">CCTV IP Camera Link</h3>
      <p className="text-slate-500 text-sm mt-2 max-w-md">Connect your Dahua or Hikvision NVR to overlay shift variance events directly onto camera footage.</p>
    </div>
  );
}

export function APIGateway({ settings }: { settings: GlobalSettings }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white flex flex-col p-8 items-center justify-center text-center">
      <Network className="h-12 w-12 text-slate-200 mb-4" />
      <h3 className="font-sans text-lg font-bold text-slate-800">API Access</h3>
      <p className="text-slate-500 text-sm mt-2 max-w-md">Generate API keys to connect FuelPro with SAP, Oracle, or custom back-office applications.</p>
    </div>
  );
}
