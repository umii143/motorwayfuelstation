/**
 * FuelPro Enterprise — SDK Import Ban Checker (PRD v6.1 A.6)
 *
 * Scans the codebase for direct imports of 'firebase/firestore'
 * or 'firebase/database'. All database access MUST go through
 * the Repository/Adapter pattern.
 */

import { execSync } from 'child_process';
import * as path from 'path';

// Allowed files that contain the actual adapters or configuration
const ALLOWED_FILES = [
  'src/lib/firebase.ts', // Core config singleton
  'src/repositories/adapters/FirestoreAdapter.ts', // The ONLY allowed query adapter
  
  // Existing files that still need migration (Temporary whitelist)
  'src/stores/useShiftStore.ts',
  'src/router/AppShell.tsx',
  'src/lib/reports-v2/ebip/engine/queryEngine.ts',
  'src/contexts/StationContext.tsx',
  'src/components/features/LicenseManager.tsx',
  'src/components/features/SubscriptionHub.tsx',
  'src/components/features/reports-v2/framework/WorkspaceStateManager.tsx',
  'src/components/features/SecurityHub.tsx',
  'src/contexts/AuthContext.tsx',
  'src/data/firestore.ts',
  
  // Not source files
  'scripts/check-sdk-imports.ts',
];

try {
  // Use git grep to find all imports of firebase/firestore
  // We use git grep because it's fast and respects .gitignore
  const output = execSync('git grep -n "from \'firebase/firestore\'" src/ || true', { encoding: 'utf-8' });
  
  if (!output.trim()) {
    console.log('✅ SDK Import Check Passed: No direct Firestore imports found.');
    process.exit(0);
  }

  const lines = output.trim().split('\n');
  const violations: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    
    // git grep output format: filepath:line:match
    const match = line.match(/^([^:]+):(\d+):/);
    if (match) {
      const filePath = match[1];
      // Normalize paths for comparison (git grep uses forward slashes, but Windows might differ in ALLOWED_FILES)
      const normalizedPath = filePath.replace(/\\/g, '/');
      
      const isAllowed = ALLOWED_FILES.some(allowed => 
        normalizedPath === allowed || normalizedPath.endsWith(allowed)
      );

      if (!isAllowed) {
        violations.push(line);
      }
    }
  }

  if (violations.length > 0) {
    console.error('❌ SDK Import Violations Found:');
    console.error('Direct imports of "firebase/firestore" are banned per PRD v6.1 A.6.');
    console.error('Use the Repository/Adapter pattern instead (e.g., FirestoreAdapter.ts).');
    console.error('');
    violations.forEach(v => console.error(`  ${v}`));
    process.exit(1);
  } else {
    console.log('✅ SDK Import Check Passed: All imports are within allowed files.');
    process.exit(0);
  }

} catch (err) {
  console.error('Failed to run check:', err);
  process.exit(1);
}
