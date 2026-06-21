import React, { useState, useEffect } from 'react';

interface DeferredWidgetProps {
  children: React.ReactNode;
  delay?: number;
  skeleton?: React.ReactNode;
  className?: string;
}

export const DeferredWidget: React.FC<DeferredWidgetProps> = ({ 
  children, 
  delay = 0, 
  skeleton = null,
  className = ""
}) => {
  const [shouldRender, setShouldRender] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    
    // Defer rendering
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return <>{skeleton}</>;
  }

  return (
    <div 
      className={className} 
      style={{ contentVisibility: 'auto' }}
    >
      {children}
    </div>
  );
};
