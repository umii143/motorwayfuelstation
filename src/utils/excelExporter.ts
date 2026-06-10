import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExcelExportOptions {
  fileName: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: any[];
  title?: string;
}

export const exportToExcel = ({ fileName, sheetName = 'Sheet1', columns, data, title }: ExcelExportOptions) => {
  // Extract headers
  const headers = columns.map(col => col.header);
  
  // Format data
  const formattedData = data.map(item => {
    const row: any = {};
    columns.forEach(col => {
      row[col.header] = item[col.key];
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Set column widths
  const wscols = columns.map(col => ({
    wch: col.width || 15
  }));
  worksheet['!cols'] = wscols;

  // Add a title row if provided (requires shifting data down)
  if (title) {
    XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: 'A1' });
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }
    ];
    // Re-add data starting from row 2
    XLSX.utils.sheet_add_json(worksheet, formattedData, { origin: 'A2', skipHeader: false });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  
  saveAs(dataBlob, `${fileName}_${new Date().getTime()}.xlsx`);
};
