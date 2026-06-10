import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles } from '../../../utils/pdfStyles';
import { PdfHeader, PdfFooter, PdfSignatures } from '../../../utils/pdfGenerator';
import { Shift } from '../../../types'; // Assuming types exist

interface ShiftReceiptProps {
  shift: Shift;
  generatedBy?: string;
}

export const ShiftReceiptDocument: React.FC<ShiftReceiptProps> = ({ shift, generatedBy }) => {
  const totalCreditSales = shift.debitEntries?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalExpenses = shift.expenseEntries?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalDigital = shift.digitalCashEntries?.reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader 
          title="Shift Closing Report" 
          documentNo={shift.id} 
          date={shift.date}
          generatedBy={generatedBy}
        />

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Shift Details</Text>
          <View style={pdfStyles.metaDataContainer}>
            <View style={pdfStyles.metaDataColumn}>
              <Text>Operator ID: {shift.staffId || 'Unknown'}</Text>
              <Text>Shift Period: {shift.type}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Financial Summary</Text>
          <View style={pdfStyles.summaryBox}>
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Expected Cash:</Text>
              <Text style={pdfStyles.summaryValue}>{shift.expectedCash?.toLocaleString() || 0} PKR</Text>
            </View>
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Credit/Khata Sales:</Text>
              <Text style={pdfStyles.summaryValue}>{totalCreditSales.toLocaleString()} PKR</Text>
            </View>
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Expenses/Advances:</Text>
              <Text style={pdfStyles.summaryValue}>{totalExpenses.toLocaleString()} PKR</Text>
            </View>
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Digital/Card Payments:</Text>
              <Text style={pdfStyles.summaryValue}>{totalDigital.toLocaleString()} PKR</Text>
            </View>
            <View style={[pdfStyles.summaryRow, pdfStyles.grandTotalBox]}>
              <Text style={pdfStyles.summaryLabel}>Cash Recovered:</Text>
              <Text style={pdfStyles.summaryValue}>{shift.submittedCash?.toLocaleString() || 0} PKR</Text>
            </View>
            <View style={[pdfStyles.summaryRow, { marginTop: 5 }]}>
              <Text style={pdfStyles.summaryLabel}>Variance (Short/Excess):</Text>
              <Text style={pdfStyles.grandTotalValue}>{(shift.cashVariance || 0).toLocaleString()} PKR</Text>
            </View>
          </View>
        </View>

        <PdfSignatures />
        <PdfFooter />
      </Page>
    </Document>
  );
};
