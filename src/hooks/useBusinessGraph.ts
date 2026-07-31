/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * useBusinessGraph — builds and memoizes the Business Graph from live stores,
 * and exposes trail resolution + navigation to any connected entity.
 */

import { useMemo } from 'react';
import { useCustomerStore } from '../stores/useCustomerStore';
import { useSupplierStore } from '../stores/useSupplierStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useShiftStore } from '../stores/useShiftStore';
import { useStaffStore } from '../stores/useStaffStore';
import { useFinancialStore } from '../stores/useFinancialStore';
import { db } from '../data/db';
import { buildGraph, resolveTrail, degreeOf } from '../lib/businessGraph';
import { GraphNode, EntityRef } from '../types/search.types';

export function useBusinessGraph() {
 const customers = useCustomerStore((s: any) => s.customers);
 const suppliers = useSupplierStore((s: any) => s.suppliers);
 const { products, tanks, nozzles } = useInventoryStore((s: any) => ({ products: s.products, tanks: s.tanks, nozzles: s.nozzles }));
 const shifts = useShiftStore((s: any) => s.shifts);
 const staff = useStaffStore((s: any) => s.staff);
 const { standaloneExpenses, banks, digitalAccounts } = useFinancialStore((s: any) => ({ standaloneExpenses: s.standaloneExpenses, banks: s.banks, digitalAccounts: s.digitalAccounts }));

 const graph = useMemo(() => {
 const activeStationId = db.getActiveStationId();
 const activityLogs = db.getActivityRegister(activeStationId) || [];
 const lubePosSales = db.getLubePosSales(activeStationId) || [];
 return buildGraph({
 settings: {} as any,
 shifts, products, customers, suppliers, tanks, nozzles, banks, digitalAccounts, staff,
 lubePosSales, activityLogs
 });
 }, [customers, suppliers, products, tanks, nozzles, shifts, staff, standaloneExpenses, banks, digitalAccounts]);

 const getTrail = (ref: EntityRef): GraphNode[] => resolveTrail(ref, graph);
 const getDegree = (ref: EntityRef): number => degreeOf(ref, graph);

 return { graph, getTrail, getDegree };
}
