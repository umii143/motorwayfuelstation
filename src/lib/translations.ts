import { GlobalSettings } from '../types';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English (US)', flag: '🇺🇸', urduName: 'انگریزی' },
  { code: 'ur', name: 'اردو (Urdu)', flag: '🇵🇰', urduName: 'اردو' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦', urduName: 'عربی' },
  { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸', urduName: 'ہسپانوی' },
  { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳', urduName: 'چینی' }
];

export const DICTIONARY: Record<string, Record<string, string>> = {
  ar: {
    // Navigation
    'Dashboard': 'لوحة القيادة',
    'Shifts Wizard': 'معالج الورديات',
    'Active Shift Operations': 'عمليات الورديات النشطة',
    'Credit Customers': 'عملاء الائتمان',
    'Fuel Suppliers': 'موردو الوقود',
    'Central Ledger': 'دفتر الأستاذ',
    'Bank Cash': 'النقدية بالبنك',
    'Digital Cash': 'الدفع الرقمي',
    'Discounts': 'الخصومات',
    'Expenses': 'المصروفات',
    'Staff & Payroll': 'الموظفون والرواتب',
    'Staff Panel': 'لوحة الموظفين',
    'Advanced Reports': 'تقارير متقدمة',
    'Settings': 'الإعدادات',
    'Central Settings': 'الإعدادات المركزية',
    'Security Hub': 'مركز الأمان',
    
    // UI Elements
    'Total Sales Today': 'إجمالي مبيعات اليوم',
    'Daily Active Shift Expected Cash': 'النقد المتوقع للوردية النشطة اليوم',
    'Today Fuel Stock Inventory': 'مخزون الوقود اليوم',
    'Total Active Debt Receivables': 'إجمالي ذمم الديون النشطة المدنية',
    'Shift Operations Command': 'لوحة تحكم عمليات الورديات',
    'Active Shift': 'الوردية النشطة',
    'Closed Shifts History': 'سجل الورديات المغلقة',
    'Credit Ledger Accounts': 'حسابات دفتر الائتمان',
    'Vendor & Supplier Contracts': 'عقود الموردين والبائعين',
    'Storage Tanks & Calibrations': 'خزانات التخزين والمعايرة',
    'Ledger Accounts': 'حسابات دفتر الأستاذ',
    'Central Settings & Station Hardware': 'الإعدادات المركزية وأجهزة المحطة',
    
    // Buttons & Labels
    'Save Settings': 'حفظ الإعدادات',
    'Save Profile Spec': 'حفظ مواصفات الملف الشخصي',
    'Business profile settings saved!': 'تم حفظ إعدادات الملف الشخصي للعمل!',
    'Add Entry': 'إضافة إدخال',
    'Delete': 'حذف',
    'Edit': 'تعديل',
    'Cancel': 'إلغاء',
    'Search...': 'بحث...',
    'Export CSV': 'تصدير CSV',
    'Search customers, reasons...': 'البحث عن العملاء أو الأسباب...',
    'All Types': 'جميع الأنواع',
    
    // Discounts Hub
    'Central Discounts Hub': 'المركز الرئيسي للخصومات',
    'Master control room for all operational discounts, rebates, and loyalty allowances. Real-time synchronization across all active shifts with comprehensive audit logging.': 'غرفة التحكم الرئيسية لجميع الخصومات التشغيلية والمردودات ومخصصات الولاء. مزامنة في الوقت الفعلي عبر جميع الورديات النشطة مع تسجيل تدقيق شامل.',
    'Total Discounts Value': 'إجمالي قيمة الخصومات',
    'Discounts Given:': 'الخصومات الممنوحة:',
    'Discounts Issued': 'الخصومات الصادرة',
    'Avg. Discount': 'متوسط الخصم',
    'Top Category': 'أعلى فئة',
    'Discount Amount (Rs.):': 'قيمة الخصم:',
    'Discount Type:': 'نوع الخصم:',
    'Customer Name:': 'اسم العميل:',
    'Approved By:': 'تمت الموافقة من قِبل:',
    'Product / Fuel:': 'المنتج / الوقود:',
    'Reason:': 'السبب:',
    'Remarks / Notes:': 'ملاحظات:',
    'ADD DISCOUNT LOG': 'إضافة سجل الخصم',
    'Discounts Logged:': 'الخصومات المسجلة:',
    'No discounts logged yet.': 'لم يتم تسجيل أي خصومات بعد.',
    
    // Station
    'Commercial Trading Title (English):': 'الاسم التجاري التجاري (إنجليزي):',
    'Commercial Trading Title (Urdu):': 'الاسم التجاري التجاري (أردو):',
    'Authorized Mailing Address:': 'عنوان المراسلة المعتمد:',
    'Tax Registry NTN License / GST:': 'رخصة سجل الضرائب NTN / GST:',
    'Owner Emergency Cell Contact:': 'رقم هاتف الطوارئ للمالك:',
    'Bilingual Local Language Switch:': 'تبديل لغة الواجهة:',
    'Toggle interface between professional English ledger style or high local Urdu supports.': 'تبديل واجهة العرض بين النمط الإنجليزي الاحترافي أو دعم لغة الأردو المحلية.',
    'DANGER ZONE & FACTORY WIPE': 'منطقة الخطر وإعادة التعيين الكامل',
    'Execute Factory Reset': 'تنفيذ إعادة تعيين المصنع',
    'Permanent delete of all registered tanks calibrations, mapped nozzle gears, staff attendance archives, and supplier transactions logs.': 'حذف دائم لجميع معايرات الخزانات المسجلة، تروس الفوهات المحددة، أرشيفات حضور الموظفين، وسجلات معاملات الموردين.'
  },
  es: {
    // Navigation
    'Dashboard': 'Tablero',
    'Shifts Wizard': 'Asistente de Turnos',
    'Active Shift Operations': 'Operaciones de Turno Activo',
    'Credit Customers': 'Clientes de Crédito',
    'Fuel Suppliers': 'Proveedores',
    'Central Ledger': 'Libro Mayor',
    'Bank Cash': 'Efectivo en Banco',
    'Digital Cash': 'Efectivo Digital',
    'Discounts': 'Descuentos',
    'Expenses': 'Gastos',
    'Staff & Payroll': 'Personal y Nómina',
    'Staff Panel': 'Panel de Personal',
    'Advanced Reports': 'Informes Avanzados',
    'Settings': 'Configuración',
    'Central Settings': 'Configuración Central',
    'Security Hub': 'Centro de Seguridad',
    
    // UI Elements
    'Total Sales Today': 'Ventas Totales de Hoy',
    'Daily Active Shift Expected Cash': 'Efectivo Esperado del Turno Activo',
    'Today Fuel Stock Inventory': 'Inventario de Combustible Hoy',
    'Total Active Debt Receivables': 'Total de Cuentas por Cobrar Activas',
    'Shift Operations Command': 'Comando de Operaciones de Turno',
    'Active Shift': 'Turno Activo',
    'Closed Shifts History': 'Historial de Turnos Cerrados',
    'Credit Ledger Accounts': 'Cuentas de Libro de Crédito',
    'Vendor & Supplier Contracts': 'Contratos de Proveedores',
    'Storage Tanks & Calibrations': 'Tanques de Almacenamiento',
    'Ledger Accounts': 'Cuentas del Libro Mayor',
    'Central Settings & Station Hardware': 'Configuración Central y Hardware de Estación',
    
    // Buttons & Labels
    'Save Settings': 'Guardar Configuración',
    'Save Profile Spec': 'Guardar Especificaciones de Perfil',
    'Business profile settings saved!': '¡Configuración de perfil comercial guardada!',
    'Add Entry': 'Añadir Entrada',
    'Delete': 'Eliminar',
    'Edit': 'Editar',
    'Cancel': 'Cancelar',
    'Search...': 'Buscar...',
    'Export CSV': 'Exportar CSV',
    'Search customers, reasons...': 'Buscar clientes, motivos...',
    'All Types': 'Todos los Tipos',
    
    // Discounts Hub
    'Central Discounts Hub': 'Centro Central de Descuentos',
    'Master control room for all operational discounts, rebates, and loyalty allowances. Real-time synchronization across all active shifts with comprehensive audit logging.': 'Sala de control principal para todos los descuentos operativos, reembolsos e incentivos de fidelidad. Sincronización en tiempo real en todos los turnos activos con registro de auditoría integral.',
    'Total Discounts Value': 'Valor Total de Descuentos',
    'Discounts Given:': 'Descuentos Entregados:',
    'Discounts Issued': 'Descuentos Emitidos',
    'Avg. Discount': 'Descuento Promedio',
    'Top Category': 'Categoría Principal',
    'Discount Amount (Rs.):': 'Monto del Descuento:',
    'Discount Type:': 'Tipo de Descuento:',
    'Customer Name:': 'Nombre del Cliente:',
    'Approved By:': 'Aprobado Por:',
    'Product / Fuel:': 'Producto / Combustible:',
    'Reason:': 'Motivo:',
    'Remarks / Notes:': 'Notas / Observaciones:',
    'ADD DISCOUNT LOG': 'AÑADIR REGISTRO DE DESCUENTO',
    'Discounts Logged:': 'Descuentos Registrados:',
    'No discounts logged yet.': 'Aún no hay descuentos registrados.',
    
    // Station
    'Commercial Trading Title (English):': 'Título Comercial (Inglés):',
    'Commercial Trading Title (Urdu):': 'Título Comercial (Urdu):',
    'Authorized Mailing Address:': 'Dirección Postal Autorizada:',
    'Tax Registry NTN License / GST:': 'Licencia de Registro Fiscal NTN / GST:',
    'Owner Emergency Cell Contact:': 'Contacto Celular de Emergencia del Propietario:',
    'Bilingual Local Language Switch:': 'Interruptor de Idioma Local:',
    'Toggle interface between professional English ledger style or high local Urdu supports.': 'Alternar interfaz entre el estilo de libro mayor profesional en inglés o el soporte local en urdu.',
    'DANGER ZONE & FACTORY WIPE': 'ZONA DE PELIGRO Y REINICIO DE FÁBRICA',
    'Execute Factory Reset': 'Ejecutar Reinicio de Fábrica',
    'Permanent delete of all registered tanks calibrations, mapped nozzle gears, staff attendance archives, and supplier transactions logs.': 'Eliminación permanente de todas las calibraciones de tanques, mapeo de boquillas de manguera, archivos de asistencia del personal y registros de transacciones de proveedores.'
  },
  zh: {
    // Navigation
    'Dashboard': '仪表板',
    'Shifts Wizard': '轮班向导',
    'Active Shift Operations': '当前轮班操作',
    'Credit Customers': '信用客户',
    'Fuel Suppliers': '燃料供应商',
    'Central Ledger': '中央分类账',
    'Bank Cash': '银行现金',
    'Digital Cash': '数字现金',
    'Discounts': '折扣',
    'Expenses': '费用',
    'Staff & Payroll': '员工与薪资',
    'Staff Panel': '员工管理',
    'Advanced Reports': '高级报告',
    'Settings': '设置',
    'Central Settings': '中央设置',
    'Security Hub': '安全中心',
    
    // UI Elements
    'Total Sales Today': '今日总销售额',
    'Daily Active Shift Expected Cash': '今日当前轮班预测现金',
    'Today Fuel Stock Inventory': '今日燃料库存',
    'Total Active Debt Receivables': '活动应收账款总额',
    'Shift Operations Command': '轮班操作控制台',
    'Active Shift': '当前轮班',
    'Closed Shifts History': '历史已关闭轮班',
    'Credit Ledger Accounts': '信用账簿账户',
    'Vendor & Supplier Contracts': '供应商和销售商合同',
    'Storage Tanks & Calibrations': '储油罐和校准',
    'Ledger Accounts': '分类账账户',
    'Central Settings & Station Hardware': '中央设置与站内硬件',
    
    // Buttons & Labels
    'Save Settings': '保存设置',
    'Save Profile Spec': '保存个人资料信息',
    'Business profile settings saved!': '商业档案设置已保存！',
    'Add Entry': '新增条目',
    'Delete': '删除',
    'Edit': '编辑',
    'Cancel': '取消',
    'Search...': '搜索...',
    'Export CSV': '导出 CSV',
    'Search customers, reasons...': '搜索客户、原因...',
    'All Types': '所有类型',
    
    // Discounts Hub
    'Central Discounts Hub': '折扣控制中心',
    'Master control room for all operational discounts, rebates, and loyalty allowances. Real-time synchronization across all active shifts with comprehensive audit logging.': '所有运营折扣、回扣和忠诚度津贴的主控制室。在所有活动轮班之间进行实时同步，并记录全面的审计日志。',
    'Total Discounts Value': '折扣总额',
    'Discounts Given:': '已给折扣:',
    'Discounts Issued': '签发折扣',
    'Avg. Discount': '平均折扣',
    'Top Category': '最高类别',
    'Discount Amount (Rs.):': '折扣金额:',
    'Discount Type:': '折扣类型:',
    'Customer Name:': '客户名称:',
    'Approved By:': '批准人:',
    'Product / Fuel:': '产品 / 燃料:',
    'Reason:': '原因:',
    'Remarks / Notes:': '备注 / 说明:',
    'ADD DISCOUNT LOG': '添加折扣日志',
    'Discounts Logged:': '已记录折扣:',
    'No discounts logged yet.': '暂无已记录的折扣记录。',
    
    // Station
    'Commercial Trading Title (English):': '商业交易名称 (英文):',
    'Commercial Trading Title (Urdu):': '商业交易名称 (乌尔都语):',
    'Authorized Mailing Address:': '授权邮寄地址:',
    'Tax Registry NTN License / GST:': '税务登记 NTN 编号 / GST:',
    'Owner Emergency Cell Contact:': '业主紧急联系电话:',
    'Bilingual Local Language Switch:': '双语本地语言切换:',
    'Toggle interface between professional English ledger style or high local Urdu supports.': '在专业英文账簿风格或本地乌尔都语支持之间切换界面。',
    'DANGER ZONE & FACTORY WIPE': '危险区域与出厂重置',
    'Execute Factory Reset': '执行出厂重置',
    'Permanent delete of all registered tanks calibrations, mapped nozzle gears, staff attendance archives, and supplier transactions logs.': '永久删除所有注册的储油罐校准、匹配的油枪、员工考勤档案和供应商交易日志。'
  }
};

/**
 * Enterprise Translation Hook
 * @param textEn The default english value
 * @param textUr The custom Urdu fallback translation
 * @param settings The GlobalSettings session context or a language string
 */
export function t(textEn: string, textUr: string, settings?: GlobalSettings | string): string {
  const lang = typeof settings === 'string' ? settings : (settings?.language || 'en');
  if (lang === 'ur') return textUr;
  if (lang === 'en') return textEn;
  
  const dict = DICTIONARY[lang];
  if (dict && dict[textEn]) {
    return dict[textEn];
  }
  
  // Custom fallback: try word-for-word pattern if exact block not found
  return textEn;
}
