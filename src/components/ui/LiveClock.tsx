import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface LiveClockProps {
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
}

export const LiveClock: React.FC<LiveClockProps> = React.memo(({ 
  className = "text-xs font-bold text-slate-400 flex items-center gap-1", 
  iconClassName = "w-3.5 h-3.5",
  showIcon = true 
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Only update every minute to avoid heavy React rendering tree paints
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  return (
    <span className={className}>
      {showIcon && <Clock className={iconClassName} />}
      {timeStr}
    </span>
  );
});
