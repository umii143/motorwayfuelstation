import React from 'react';

export const Card = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
 <div className={`bg-card rounded-xl shadow-sm border border-border${className}`} {...props}>
 {children}
 </div>
);

export const CardHeader = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
 <div className={`p-6 pb-4 border-b border-border${className}`} {...props}>
 {children}
 </div>
);

export const CardTitle = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
 <h3 className={`text-lg font-bold text-foreground${className}`} {...props}>
 {children}
 </h3>
);

export const CardDescription = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
 <p className={`mt-1 text-sm text-muted-foreground${className}`} {...props}>
 {children}
 </p>
);

export const CardContent = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
 <div className={`p-6${className}`} {...props}>
 {children}
 </div>
);
