import React from 'react';
import { Phone } from 'lucide-react';

export const Footer: React.FC = () => {
 return (
 <div className="w-full flex-none flex flex-col mt-auto lg:hidden">
 {/* 1px Divider */}
 <div className="w-full h-[1px] bg-slate-200" />
 
 {/* Ultra Thin Footer Information */}
 <footer className="w-full h-[28px] flex items-center justify-center gap-[10px] px-3 bg-transparent">
 <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground /60 whitespace-nowrap">Developed by Umar Ali</span>
 <span className="text-muted-foreground /20 text-[10px]">|</span>
 <span className="text-[10px] sm:text-[11px] font-medium text-orange-500 whitespace-nowrap">Pak RozNamcha</span>
 <span className="text-muted-foreground /20 text-[10px]">|</span>
 <a href="https://wa.me/923168432329" className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-emerald-600 whitespace-nowrap hover:text-emerald-500 dark:hover:text-emerald-400">
 <Phone className="w-3 h-3" />
 0316-8432329
 </a>
 </footer>
 </div>
 );
};
