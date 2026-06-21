const DEFAULT_FUEL_STATION_ID = 'st_default';
const LUBE_STATION_ID = 'st_lube';

function resolveStationId(stationId) {
  return stationId || DEFAULT_FUEL_STATION_ID;
}

function getBusinessTypeForStation(stationId) {
  if (stationId === LUBE_STATION_ID) return 'lube';
  return 'fuel_station';
}

function isRecordInBusinessScope(record, stationId, orgId) {
  if (!record) return true;

  const resolvedStationId = resolveStationId(stationId);
  const expectedBusinessType = getBusinessTypeForStation(resolvedStationId);

  if (orgId && record.orgId && record.orgId !== orgId) return false;
  if (record.stationId && record.stationId !== resolvedStationId) return false;
  if (record.businessId && record.businessId !== resolvedStationId) return false;
  if (record.businessType && record.businessType !== expectedBusinessType) return false;

  return true;
}

console.log("Isolate missing stationId:", isRecordInBusinessScope({ id: "t1" }, 'st_default'));
console.log("Isolate wrong stationId:", isRecordInBusinessScope({ id: "t1", stationId: "st_wrong" }, 'st_default'));
