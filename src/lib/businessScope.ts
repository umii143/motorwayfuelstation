import { LubePosSale, Product, Shift, TenantDocument } from '../types';

export const DEFAULT_FUEL_STATION_ID = 'st_default';
export const LUBE_STATION_ID = 'st_lube';

export type BusinessType = NonNullable<TenantDocument['businessType']>;

const FUEL_ONLY_VIEWS = new Set([
  'shift_logs',
  'price_management',
  'fleet',
  'fuel_quality',
  'tanker_delivery',
  'loss_prevention',
  'dip_calculator',

  'onboarding',
]);

const LUBE_ONLY_VIEWS = new Set(['lube_pos']);

export function resolveStationId(stationId?: string): string {
  return stationId || DEFAULT_FUEL_STATION_ID;
}

export function getBusinessTypeForStation(stationId?: string): BusinessType {
  return resolveStationId(stationId) === LUBE_STATION_ID ? 'lube' : 'fuel_station';
}

export function isLubeBusinessStation(stationId?: string): boolean {
  return getBusinessTypeForStation(stationId) === 'lube';
}

export function isRecordInBusinessScope(
  record: TenantDocument | undefined,
  stationId?: string,
  orgId?: string
): boolean {
  if (!record) return true;

  const resolvedStationId = resolveStationId(stationId);
  const expectedBusinessType = getBusinessTypeForStation(resolvedStationId);

  if (orgId && record.orgId && record.orgId !== orgId) return false;
  if (record.stationId && record.stationId !== resolvedStationId) return false;
  if (record.businessId && record.businessId !== resolvedStationId) return false;
  if (record.businessType && record.businessType !== expectedBusinessType) return false;

  return true;
}

export function withBusinessScope<T extends TenantDocument>(
  record: T,
  stationId?: string,
  orgId?: string
): T {
  const resolvedStationId = resolveStationId(stationId);
  const scoped: TenantDocument = {
    ...record,
    stationId: resolvedStationId,
    businessId: resolvedStationId,
    businessType: getBusinessTypeForStation(resolvedStationId),
  };

  if (orgId) {
    scoped.orgId = orgId;
  }

  return scoped as T;
}

export function isolateTenantRecords<T extends TenantDocument>(
  records: T[],
  stationId?: string,
  orgId?: string
): T[] {
  return records
    .filter((record) => isRecordInBusinessScope(record, stationId, orgId))
    .map((record) => withBusinessScope(record, stationId, orgId));
}

export function isolateProductRecords(
  products: Product[],
  stationId?: string,
  orgId?: string
): Product[] {
  const scopedProducts = isolateTenantRecords(products, stationId, orgId);

  if (isLubeBusinessStation(stationId)) {
    return scopedProducts.filter((product) => product.type !== 'fuel');
  }

  return scopedProducts.filter((product) => product.type === 'fuel');
}

export function isolateShiftRecords(
  shifts: Shift[],
  stationId?: string,
  orgId?: string
): Shift[] {
  const scopedShifts = isolateTenantRecords(shifts, stationId, orgId);

  if (isLubeBusinessStation(stationId)) {
    return [];
  }

  return scopedShifts.map((shift) => ({
    ...shift,

  }));
}

export function isolateLubePosSales(
  sales: LubePosSale[],
  stationId?: string,
  orgId?: string
): LubePosSale[] {
  if (!isLubeBusinessStation(stationId)) {
    return [];
  }

  return isolateTenantRecords(sales, stationId, orgId);
}

export function resolveViewForBusiness(view: string, stationId?: string): string {
  if (isLubeBusinessStation(stationId)) {
    if (view === 'shift_wizard') return 'lube_pos';
    if (FUEL_ONLY_VIEWS.has(view)) return 'dashboard';
    return view;
  }

  if (LUBE_ONLY_VIEWS.has(view)) return 'dashboard';
  return view;
}
