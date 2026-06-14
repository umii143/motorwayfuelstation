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
}

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

// Hardcoded PIN for MVP security hardening. In a real system, this would be hashed and checked against the DB.
const OWNER_PIN = '1234';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Defaulting to Owner for development purposes
      user: DEFAULT_OWNER,
      isAuthenticated: true,

      login: (user) => {
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      verifyPin: (pin: string) => {
        // For MVP, we only require PIN for the Owner role's sensitive actions
        const state = get();
        if (state.user?.role === 'Owner') {
          return pin === OWNER_PIN;
        }
        return false;
      },

      hasPermission: (permission) => {
        const state = get();
        if (!state.user) return false;
        if (state.user.role === 'Owner') return true; // Owner always has all permissions
        return !!state.user.permissions[permission];
      },
    }),
    {
      name: 'fuelpro-auth-storage',
    }
  )
);
