import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { pdfStyles } from '../../../utils/pdfStyles';
import { PdfHeader, PdfFooter, PdfSignatures } from '../../../utils/pdfGenerator';

interface DailySummaryData {
  date: string;
  petrolSales: number;
  dieselSales: number;
  lubricantSales: number;
  expenses: number;
  cashInHand: number;
  bankDeposits: number;
  netProfit: number;
  grossProfit?: number;
}

interface DailySummaryReportProps {
  data: DailySummaryData;
  generatedBy?: string;
}

export const DailySummaryReportDocument: React.FC<DailySummaryReportProps> = ({ data, generatedBy }) => {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader 
          title="Daily Summary Report" 
          date={data.date}
          generatedBy={generatedBy}
        />

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Sales Overview</Text>
          <View style={pdfStyles.summaryBox}>
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Petrol Sales:</Text>
              <Text style={pdfStyles.summaryValue}>{data.petrolSales.toLocaleString()} PKR</Text>
            </View>
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Diesel Sales:</Text>
              <Text style={pdfStyles.summaryValue}>{data.dieselSales.toLocaleString()} PKR</Text>
            </View>
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Lubricant Sales:</Text>
              <Text style={pdfStyles.summaryValue}>{data.lubricantSales.toLocaleString()} PKR</Text>
            </View>
            <View style={[pdfStyles.summaryRow, pdfStyles.grandTotalBox]}>
              <Text style={pdfStyles.summaryLabel}>Gross Revenue:</Text>
              <Text style={pdfStyles.grandTotalValue}>
                {(data.petrolSales + data.dieselSales + data.lubricantSales).toLocaleString()} PKR
              </Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Financials & Flow</Text>
          <View style={pdfStyles.summaryBox}>
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Operating Expenses:</Text>
              <Text style={[pdfStyles.summaryValue, { color: '#dc2626' }]}>{data.expenses.toLocaleString()} PKR</Text>
            </View>
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Bank Deposits:</Text>
              <Text style={pdfStyles.summaryValue}>{data.bankDeposits.toLocaleString()} PKR</Text>
            </View>
            <View style={pdfStyles.summaryRow}>
              <Text style={pdfStyles.summaryLabel}>Cash In Hand:</Text>
              <Text style={pdfStyles.summaryValue}>{data.cashInHand.toLocaleString()} PKR</Text>
            </View>
            
            {data.grossProfit !== undefined && (
              <View style={[pdfStyles.summaryRow, { marginTop: 5, paddingTop: 5, borderTopWidth: 1, borderTopColor: '#cbd5e1' }]}>
                <Text style={pdfStyles.summaryLabel}>Gross Profit:</Text>
                <Text style={pdfStyles.summaryValue}>{data.grossProfit.toLocaleString()} PKR</Text>
              </View>
            )}

            <View style={[pdfStyles.summaryRow, pdfStyles.grandTotalBox]}>
              <Text style={pdfStyles.summaryLabel}>Net Profit (Est):</Text>
              <Text style={pdfStyles.grandTotalValue}>{data.netProfit.toLocaleString()} PKR</Text>
            </View>
          </View>
        </View>

        <PdfSignatures />
        <PdfFooter />
      </Page>
    </Document>
  );
};
