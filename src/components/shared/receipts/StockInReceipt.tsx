import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles } from '../../../utils/pdfStyles';
import { PdfHeader, PdfFooter, PdfSignatures } from '../../../utils/pdfGenerator';

interface StockInReceiptProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  purchase: any;
  generatedBy?: string;
}

export const StockInReceiptDocument: React.FC<StockInReceiptProps> = ({ purchase, generatedBy }) => {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader 
          title="Stock Receiving Report (GRN)" 
          documentNo={purchase.id} 
          date={purchase.date}
          generatedBy={generatedBy}
        />

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Supplier Details</Text>
          <View style={pdfStyles.metaDataContainer}>
            <View style={pdfStyles.metaDataColumn}>
              <Text>Supplier: {purchase.supplierId || 'Unknown'}</Text>
              <Text>Invoice/Ref: {purchase.referenceNumber}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Product Details</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeaderRow}>
              <Text style={pdfStyles.tableCellHeader}>Product / Tank</Text>
              <Text style={[pdfStyles.tableCellHeader, pdfStyles.tableCellRight]}>Qty (L/Pkts)</Text>
              <Text style={[pdfStyles.tableCellHeader, pdfStyles.tableCellRight]}>Unit Price</Text>
              <Text style={[pdfStyles.tableCellHeader, pdfStyles.tableCellRight]}>Total</Text>
            </View>
            
            <View style={pdfStyles.tableRow}>
              <Text style={pdfStyles.tableCell}>{purchase.type === 'fuel' ? 'Fuel Delivery' : 'Lube/Item'}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellRight]}>{purchase.totalLiters?.toLocaleString() || purchase.totalAmount}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellRight]}>-</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellRight]}>{purchase.totalAmount?.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <View style={pdfStyles.summaryBox}>
            <View style={[pdfStyles.summaryRow, pdfStyles.grandTotalBox]}>
              <Text style={pdfStyles.summaryLabel}>Total Amount Payable:</Text>
              <Text style={pdfStyles.grandTotalValue}>{purchase.totalAmount?.toLocaleString()} PKR</Text>
            </View>
            {purchase.paidAmount > 0 && (
              <View style={pdfStyles.summaryRow}>
                <Text style={pdfStyles.summaryLabel}>Amount Paid Advance:</Text>
                <Text style={pdfStyles.summaryValue}>{purchase.paidAmount?.toLocaleString()} PKR</Text>
              </View>
            )}
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Balance Pending:</Text>
              <Text style={pdfStyles.summaryValue}>{(purchase.totalAmount - (purchase.paidAmount || 0)).toLocaleString()} PKR</Text>
            </View>
          </View>
        </View>

        <PdfSignatures />
        <PdfFooter />
      </Page>
    </Document>
  );
};
