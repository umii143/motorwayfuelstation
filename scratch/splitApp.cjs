const fs = require('fs');
const path = require('path');

const appFile = path.join(__dirname, '../src/App.tsx');
let content = fs.readFileSync(appFile, 'utf8');

const lazyStart = content.indexOf('// Start the enterprise offline-first sync engine immediately');
const lazyEnd = content.indexOf('import LoadingScreen');
const lazySection = content.substring(lazyStart, lazyEnd);

const renderStart = content.indexOf('const renderActiveComponent = () => {');
const renderEndStr = '      default:\n        return <Dashboard'; // finding the end of switch
const renderEndIdx = content.indexOf(renderEndStr);
// find the closing brace of renderActiveComponent
let renderEnd = content.indexOf('    }', renderEndIdx) + 5;
let renderSection = content.substring(renderStart, renderEnd);

// Replace renderActiveComponent internal references if necessary.
// We will generate AppRouter.tsx

const appRouterContent = `import React from 'react';
import { useStation } from '../contexts/StationContext';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';
${lazySection.replace('// Start the enterprise offline-first sync engine immediately\nSyncEngine.start().catch(logger.error);\n', '')}
import { isLubeBusinessStation } from '../lib/businessScope';

export const AppRouter = ({ activeView, handleViewChange, isExpired, settings, lubePosSales }: any) => {
  const { 
    activeStationId, shifts, products, customers, suppliers, banks, staff, nozzles, tanks,
    rateHistory, attendance, staffFinance, standaloneExpenses, stockTxns, digitalAccounts
  } = useStation();
  
  const { isSuperAdmin } = useAuth();
  const isLubeBusiness = isLubeBusinessStation(activeStationId);

  ${renderSection.replace('const renderActiveComponent = () => {', 'const renderActiveComponent = () => {')}

  return renderActiveComponent();
};
`;

fs.writeFileSync(path.join(__dirname, '../src/router/AppRouter.tsx'), appRouterContent);

// Now remove them from App.tsx
content = content.replace(lazySection, `// Lazy imports moved to AppRouter.tsx\nimport { AppRouter } from './router/AppRouter';\n`);
content = content.replace(renderSection, `const renderActiveComponent = () => <AppRouter activeView={activeView} handleViewChange={handleViewChange} isExpired={isExpired} settings={settings} lubePosSales={lubePosSales} />;`);

fs.writeFileSync(appFile, content);
console.log('AppRouter extracted successfully!');
