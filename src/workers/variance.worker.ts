/**
 * Variance Analytics Web Worker
 * Processes historical shift readings and tank dips to find long-term trends and anomalies
 * off the main thread.
 */

self.onmessage = (e: MessageEvent) => {
  const { summary } = e.data;
  
  let totalSystemVariance = 0;
  const nozzleLosses: Record<string, number> = { /* empty */ };
  const tankDeviations: string[] = [];
  
  const len = summary.shifts?.length || 0;
  for (let i = 0; i < len; i++) {
     const shift = summary.shifts[i];
     totalSystemVariance += shift.totalVariance || 0;
     
     if (shift.nozzleVariances) {
       const nvLen = shift.nozzleVariances.length;
       for (let j = 0; j < nvLen; j++) {
         const nv = shift.nozzleVariances[j];
         if (!nozzleLosses[nv.nozzleId]) nozzleLosses[nv.nozzleId] = 0;
         nozzleLosses[nv.nozzleId] += nv.variance;
       }
     }
  }

  // Find the worst nozzle
  let worstNozzleId = 'N/A';
  let worstNozzleLoss = 0;
  for (const [nId, loss] of Object.entries(nozzleLosses)) {
    const numLoss = loss as number;
    if (Math.abs(numLoss) > Math.abs(worstNozzleLoss)) {
      worstNozzleLoss = numLoss;
      worstNozzleId = nId;
    }
  }
  
  // Quick tank deviations check
  if (summary.tankDips && summary.tankDips.length > 0) {
     const tdLen = summary.tankDips.length;
     for (let k = 0; k < tdLen; k++) {
       const dip = summary.tankDips[k];
       const diff = dip.actual - dip.expected;
       if (Math.abs(diff) > 50) {
         tankDeviations.push(`Tank ${dip.tankId} deviation: ${diff.toFixed(1)}L on ${dip.date}`);
       }
     }
  }

  self.postMessage({
    totalSystemVariance,
    worstNozzleId,
    worstNozzleLoss,
    tankDeviations,
    status: Math.abs(totalSystemVariance) > 500 ? 'Critical' : 'Normal'
  });
};
