import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 
  | 'Owner'
  | 'Manager'
  | 'Supervisor'
  | 'Cashier'
  | 'Accountant'
  | 'Inventory Officer';

export interface UserPermissions {
  canEditPrices: boolean;
  canApproveExpenses: boolean;
  canViewFinancialReports: boolean;
  canViewAuditLogs: boolean;
  canDeleteFinancialRecords: boolean;
  canChangeGlobalSettings: boolean;
  canManageInventory: boolean;
  canCloseShifts: boolean;
  canDoSales: boolean;
}

export interface UserSession {
  userId: string;
  name: string;
  role: UserRole;
  permissions: UserPermissions;
  branchId: string;
  lastLogin: number;
}

interface AuthState {
  user: UserSession | null;
  isAuthenticated: boolean;
  orgId?: string;
  stationId?: string;
  login: (user: UserSession) => void;
  logout: () => void;
  verifyPin: (pin: string) => boolean; // For security hardening
  hasPermission: (permission: keyof UserPermissions) => boolean;
  isScreenLocked: boolean;
  setScreenLocked: (locked: boolean) => void;
}

import { useStationStore } from './useStationStore';

// Default user code...
const DEFAULT_OWNER: UserSession = {
  userId: 'u_owner_001',
  name: 'Umar Ali',
  role: 'Owner',
  permissions: {
    canEditPrices: true,
    canApproveExpenses: true,
    canViewFinancialReports: true,
    canViewAuditLogs: true,
    canDeleteFinancialRecords: true,
    canChangeGlobalSettings: true,
    canManageInventory: true,
    canCloseShifts: true,
    canDoSales: true,
  },
  branchId: 'station_1',
  lastLogin: Date.now(),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Defaulting to Owner for development purposes
      user: DEFAULT_OWNER,
      isAuthenticated: true,
      isScreenLocked: false,

      login: (user) => {
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      verifyPin: (pin: string) => {
        const state = get();
        if (state.user?.role === 'Owner') {
          const masterPin = useStationStore.getState().settings?.security?.masterPin ?? null;
          if (!masterPin) {
            throw new Error("Master PIN not configured");
          }
          const isValid = pin.trim() === masterPin.trim();
          return isValid;
        }
        return false;
      },

      hasPermission: (permission) => {
        const state = get();
        if (!state.user) return false;
        if (state.user.role === 'Owner') return true; // Owner always has all permissions
        return !!state.user.permissions[permission];
      },

      setScreenLocked: (locked) => {
        set({ isScreenLocked: locked });
      },
    }),
    {
      name: 'fuelpro-auth-storage',
    }
  )
);
