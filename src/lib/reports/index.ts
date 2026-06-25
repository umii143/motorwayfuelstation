import { ReportTemplate } from './types';

import { salesTemplates } from './compilers/salesReports';
import { inventoryTemplates } from './compilers/inventoryReports';
import { financialTemplates } from './compilers/financialReports';
import { staffTemplates } from './compilers/staffReports';
import { customersTemplates } from './compilers/customersReports';
import { suppliersTemplates } from './compilers/suppliersReports';
import { auditTemplates } from './compilers/auditReports';
import { extendedTemplates } from './compilers/extendedReports';
import { enterpriseTemplates } from './compilers/enterpriseReports';

export const REPORT_TEMPLATES: ReportTemplate[] = [
  ...salesTemplates,
  ...inventoryTemplates,
  ...financialTemplates,
  ...staffTemplates,
  ...customersTemplates,
  ...suppliersTemplates,
  ...auditTemplates,
  ...extendedTemplates,
  ...enterpriseTemplates,
];
