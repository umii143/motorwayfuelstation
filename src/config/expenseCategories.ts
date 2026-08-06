export type ExpenseCategoryType = 'Operational' | 'Fuel Logistics' | 'Administrative' | 'Emergency';

export interface ExpenseCategory {
  id: string;
  name: string;
  nameUrdu: string;
  type: ExpenseCategoryType;
  description: string;
  isFuelLogistics?: boolean;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  // Operational
  { id: 'OP-001', name: 'Electricity', nameUrdu: 'بجلی', type: 'Operational', description: 'Station electricity bills' },
  { id: 'OP-002', name: 'Salary', nameUrdu: 'تنخواہ', type: 'Operational', description: 'Staff salaries' },
  { id: 'OP-003', name: 'Tea/Refreshment', nameUrdu: 'چائے / ریفریشمنٹ', type: 'Operational', description: 'Daily tea and snacks' },
  { id: 'OP-004', name: 'Maintenance', nameUrdu: 'مرمت', type: 'Operational', description: 'General station maintenance' },
  
  // Fuel Logistics (Inward Expenses)
  { id: 'FL-001', name: 'Tanker Carriage', nameUrdu: 'ٹینکر کرایہ', type: 'Fuel Logistics', description: 'Carriage paid for fuel delivery', isFuelLogistics: true },
  { id: 'FL-002', name: 'Driver Tips', nameUrdu: 'ڈرائیور ٹپ', type: 'Fuel Logistics', description: 'Tips and allowance for tanker drivers', isFuelLogistics: true },
  { id: 'FL-003', name: 'Freight', nameUrdu: 'فریٹ', type: 'Fuel Logistics', description: 'Freight charges if separated from carriage', isFuelLogistics: true },
  { id: 'FL-004', name: 'Fuel Unloading', nameUrdu: 'ایندھن ان لوڈنگ', type: 'Fuel Logistics', description: 'Crane, labour, hose, and safety charges', isFuelLogistics: true },
  { id: 'FL-005', name: 'Sampling Charges', nameUrdu: 'سیمپلنگ فیس', type: 'Fuel Logistics', description: 'Sample testing charges', isFuelLogistics: true },
  { id: 'FL-006', name: 'Density Test Charges', nameUrdu: 'ڈینسیٹی ٹیسٹ', type: 'Fuel Logistics', description: 'Charges for measuring density', isFuelLogistics: true },
  { id: 'FL-007', name: 'Seal Breaking Charges', nameUrdu: 'سیل توڑنے کی فیس', type: 'Fuel Logistics', description: 'Charges applied by inspector or authority', isFuelLogistics: true },
  
  // Administrative
  { id: 'AD-001', name: 'Office Supplies', nameUrdu: 'آفس کا سامان', type: 'Administrative', description: 'Stationary and office supplies' },
  { id: 'AD-002', name: 'License/Fees', nameUrdu: 'لائسنس فیس', type: 'Administrative', description: 'Government and regulatory fees' },
  
  // Emergency
  { id: 'EM-001', name: 'Emergency Fuel Handling', nameUrdu: 'ہنگامی ایندھن اخراجات', type: 'Emergency', description: 'Costs incurred during spills or accidents' },
  { id: 'EM-002', name: 'Medical/Safety Incident', nameUrdu: 'طبی / حفاظتی اخراجات', type: 'Emergency', description: 'Medical emergencies or urgent safety repairs' }
];

export const getExpenseCategoriesByType = (type: ExpenseCategoryType) => {
  return EXPENSE_CATEGORIES.filter(c => c.type === type);
};

export const getFuelLogisticsCategories = () => {
  return EXPENSE_CATEGORIES.filter(c => c.isFuelLogistics);
};
