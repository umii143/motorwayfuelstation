/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — UI Framework
 *
 * Universal Notification System (Framework Only).
 * Support: Info, Warning, Critical, Success, Audit, Realtime.
 * Strictly no business alerts.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

export type NotificationType = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS' | 'AUDIT' | 'REALTIME';

export interface EnterpriseNotification {
  id: string;
  type: NotificationType;
  titleEn: string;
  titleUr: string;
  messageEn?: string;
  messageUr?: string;
  timestamp: string;
  isRead: boolean;
}

interface NotificationContextValue {
  notifications: EnterpriseNotification[];
  addNotification: (notification: Omit<EnterpriseNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<EnterpriseNotification[]>([]);

  const addNotification = useCallback((notif: Omit<EnterpriseNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: EnterpriseNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useEnterpriseNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useEnterpriseNotifications must be used within a NotificationProvider');
  }
  return context;
}

// UI Component (To be docked in header or drawer later)
export function NotificationBadge() {
  const { notifications } = useEnterpriseNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ position: 'relative', cursor: 'pointer' }}>
      <span style={{ fontSize: 20 }}>🔔</span>
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute',
          top: -5,
          right: -10,
          backgroundColor: 'var(--color-error, #ef4444)',
          color: 'white',
          fontSize: 10,
          fontWeight: 'bold',
          padding: '2px 6px',
          borderRadius: 10
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
}
