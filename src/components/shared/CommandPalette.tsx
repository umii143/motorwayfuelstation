import { CommandAction } from '../../types/search.types';

// This is a data file — actual actions injected from app context
export const COMMAND_ACTIONS: CommandAction[] = [
  // CREATE actions
  {
    id: 'new_shift',
    label: 'Start New Shift',
    description: 'Open shift with salesman assignment',
    icon: 'add_circle',
    shortcut: 'Ctrl+N',
    category: 'create',
    action: () => {/* setActiveView('start_shift') */},
  },
  {
    id: 'new_stock_in',
    label: 'Record Stock IN',
    description: 'Add new fuel delivery / purchase',
    icon: 'inventory_2',
    category: 'create',
    action: () => {/* setActiveView('stock_in') */},
  },
  {
    id: 'new_expense',
    label: 'Add Expense',
    description: 'Record a station expense',
    icon: 'receipt_long',
    category: 'create',
    action: () => {/* setActiveView('expenses') */},
  },
  {
    id: 'new_customer',
    label: 'Add Customer',
    description: 'Create new customer / khata account',
    icon: 'person_add',
    category: 'create',
    action: () => { /* empty */ },
  },

  // NAVIGATION actions
  {
    id: 'go_dashboard',
    label: 'Go to Dashboard',
    description: 'Main overview',
    icon: 'dashboard',
    category: 'navigation',
    action: () => { /* empty */ },
  },
  {
    id: 'go_reports',
    label: 'Open Reports',
    description: 'All reports & analytics',
    icon: 'analytics',
    category: 'navigation',
    action: () => { /* empty */ },
  },

  // REPORT actions
  {
    id: 'today_report',
    label: "Today's Summary",
    description: 'Revenue, profit, stock for today',
    icon: 'today',
    category: 'report',
    action: () => { /* empty */ },
  },

  // AI actions
  {
    id: 'ai_profit',
    label: 'Ask AI: Profit Analysis',
    description: 'Get AI profit breakdown in receipt format',
    icon: 'smart_toy',
    shortcut: 'Ctrl+/',
    category: 'ai',
    action: () => { /* empty */ },
  },
];
