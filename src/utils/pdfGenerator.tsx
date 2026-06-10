import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';

// Register fonts if needed (we can use standard Helvetica for simplicity, or register custom ones)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica', // Built-in font
    fontSize: 10,
    color: '#333',
  },
  thermalPage: {
    padding: 10,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#000',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottom: '1px solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  tableCol: {
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    padding: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTop: '1px solid #ccc',
    paddingTop: 10,
    fontSize: 8,
    color: '#666',
  },
  poweredBy: {
    marginTop: 5,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
  }
});

interface PdfDocumentProps {
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
  isThermal?: boolean; // If true, optimize for 80mm thermal
}

export const MotorwayPetroleumReport = ({ title, data, columns, isThermal = false }: PdfDocumentProps) => {
  // A4 size by default, or an 80mm wide thermal roll size
  const pageSize = isThermal ? [226, 800] : 'A4';
  const pageStyle = isThermal ? styles.thermalPage : styles.page;

  return (
    <Document>
      <Page size={pageSize as any} style={pageStyle}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>MOTORWAY PETROLEUM</Text>
          <Text style={styles.subtitle}>Mardan, KPK | Ph: +92 300 0000000</Text>
          <Text style={{ marginTop: 10, fontSize: 12, fontWeight: 'bold' }}>{title}</Text>
          <Text style={{ marginTop: 2, fontSize: 8 }}>Date: {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Data Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            {columns.map((col, i) => (
              <View key={i} style={[styles.tableColHeader, { width: `${100 / columns.length}%` }]}>
                <Text style={{ fontWeight: 'bold' }}>{col.label}</Text>
              </View>
            ))}
          </View>
          {/* Table Body */}
          {data.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow}>
              {columns.map((col, colIndex) => (
                <View key={colIndex} style={[styles.tableCol, { width: `${100 / columns.length}%` }]}>
                  <Text>{row[col.key] != null ? String(row[col.key]) : '-'}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Official System Generated Document</Text>
          <Text style={styles.poweredBy}>Powered by Umar Ali a</Text>
        </View>
      </Page>
    </Document>
  );
};

export const generatePdfBlob = async (props: PdfDocumentProps): Promise<Blob> => {
  const doc = React.createElement(MotorwayPetroleumReport, props);
  const pdfInstance = pdf(doc);
  return await pdfInstance.toBlob();
};


export const PdfHeader = ({ title, documentNo, date, generatedBy }: any) => (
  <View style={styles.header}>
    <Text style={styles.title}>MOTORWAY PETROLEUM</Text>
    <Text style={styles.subtitle}>Mardan, KPK | Ph: +92 300 0000000</Text>
    <Text style={{ marginTop: 10, fontSize: 12, fontWeight: 'bold' }}>{title}</Text>
    {documentNo && <Text style={{ marginTop: 2, fontSize: 8 }}>Ref: {documentNo}</Text>}
    <Text style={{ marginTop: 2, fontSize: 8 }}>Date: {date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString()}</Text>
    {generatedBy && <Text style={{ marginTop: 2, fontSize: 8 }}>By: {generatedBy}</Text>}
  </View>
);

export const PdfFooter = () => (
  <View style={styles.footer}>
    <Text>Official System Generated Document</Text>
    <Text style={styles.poweredBy}>Powered by Umar Ali &</Text>
  </View>
);

export const PdfSignatures = ({ leftLabel = 'Prepared By', rightLabel = 'Authorized Signature' }: any) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 50, paddingHorizontal: 20 }}>
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 100, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 }} />
      <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{leftLabel}</Text>
    </View>
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 100, borderBottomWidth: 1, borderBottomColor: '#000', marginBottom: 5 }} />
      <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{rightLabel}</Text>
    </View>
  </View>
);



