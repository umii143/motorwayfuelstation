import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles } from '../../../utils/pdfStyles';
import { PdfHeader, PdfFooter, PdfSignatures } from '../../../utils/pdfGenerator';
import { Customer, LedgerEntry } from '../../../types';

interface CustomerLedgerReportProps {
  customer: Customer;
  entries: LedgerEntry[];
  generatedBy?: string;
}

export const CustomerLedgerReportDocument: React.FC<CustomerLedgerReportProps> = ({ customer, entries, generatedBy }) => {
  // Calculate running balance locally or assume the entries have it
  // We'll calculate it if not present
  
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader 
          title="Customer Ledger Statement" 
          documentNo={`CUST-${customer.id}`} 
          generatedBy={generatedBy}
        />

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Account Information</Text>
          <View style={pdfStyles.metaDataContainer}>
            <View style={pdfStyles.metaDataColumn}>
              <Text>Name: {customer.name}</Text>
              <Text>Phone: {customer.contact || 'N/A'}</Text>
              <Text>Credit Customer</Text>
            </View>
            <View style={[pdfStyles.metaDataColumn, { alignItems: 'flex-end' }]}>
              <Text>Credit Limit: {customer.creditLimit?.toLocaleString() || 'Unlimited'} PKR</Text>
              <Text>Current Balance: {customer.balance?.toLocaleString()} PKR</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Transaction History</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeaderRow}>
              <Text style={pdfStyles.tableCellHeader}>Date</Text>
              <Text style={pdfStyles.tableCellHeader}>Description</Text>
              <Text style={[pdfStyles.tableCellHeader, pdfStyles.tableCellRight]}>Debit (+)</Text>
              <Text style={[pdfStyles.tableCellHeader, pdfStyles.tableCellRight]}>Credit (-)</Text>
              <Text style={[pdfStyles.tableCellHeader, pdfStyles.tableCellRight]}>Amount</Text>
            </View>
            
            {entries.length === 0 ? (
              <View style={pdfStyles.tableRow}>
                <Text style={pdfStyles.tableCell}>No transactions found.</Text>
              </View>
            ) : (
              entries.map((entry, index) => {
                const isEven = index % 2 === 0;
                const isDebit = entry.type === 'Credit Sale' || entry.type === 'Opening Balance';
                const isCredit = entry.type === 'Credit Recovery';
                return (
                  <View key={entry.id || index} style={[pdfStyles.tableRow, !isEven && pdfStyles.tableRowAlternate]}>
                    <Text style={pdfStyles.tableCell}>{entry.date}</Text>
                    <Text style={pdfStyles.tableCell}>{entry.notes || entry.type}</Text>
                    <Text style={[pdfStyles.tableCell, pdfStyles.tableCellRight]}>
                      {isDebit ? entry.amount.toLocaleString() : '-'}
                    </Text>
                    <Text style={[pdfStyles.tableCell, pdfStyles.tableCellRight]}>
                      {isCredit ? entry.amount.toLocaleString() : '-'}
                    </Text>
                    <Text style={[pdfStyles.tableCell, pdfStyles.tableCellRight]}>
                      {entry.amount.toLocaleString()}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
};
