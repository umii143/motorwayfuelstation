import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles } from '../../../utils/pdfStyles';
import { PdfHeader, PdfFooter, PdfSignatures } from '../../../utils/pdfGenerator';
import { ExpenseEntry } from '../../../types';

interface ExpenseVoucherProps {
  expense: ExpenseEntry;
  generatedBy?: string;
}

export const ExpenseVoucherDocument: React.FC<ExpenseVoucherProps> = ({ expense, generatedBy }) => {
  return (
    <Document>
      <Page size="A5" style={pdfStyles.page}>
        <PdfHeader 
          title="Expense Voucher" 
          documentNo={expense.id} 
          date={expense.date}
          generatedBy={generatedBy}
        />

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Payment Details</Text>
          <View style={pdfStyles.metaDataContainer}>
            <View style={pdfStyles.metaDataColumn}>
              <Text>Category: {expense.category}</Text>
              <Text>Paid From: {expense.paidFrom}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Expense Details</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeaderRow}>
              <Text style={pdfStyles.tableCellHeader}>Description</Text>
              <Text style={[pdfStyles.tableCellHeader, pdfStyles.tableCellRight]}>Amount (PKR)</Text>
            </View>
            <View style={pdfStyles.tableRow}>
              <Text style={pdfStyles.tableCell}>{expense.description}</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellRight]}>{expense.amount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <PdfSignatures />
        <PdfFooter />
      </Page>
    </Document>
  );
};
