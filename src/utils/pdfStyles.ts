import { StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts if needed (e.g. for Urdu or specific English fonts)
// Font.register({ family: 'Roboto', src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf' });

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 25,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4
  },
  companySubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 2
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#1e293b',
    textTransform: 'uppercase'
  },
  metaDataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    fontSize: 9,
    color: '#475569'
  },
  metaDataColumn: {
    flexDirection: 'column',
    gap: 3
  },
  section: {
    marginTop: 15,
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#334155',
    backgroundColor: '#f8fafc',
    padding: 4,
    borderRadius: 2
  },
  table: {
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid'
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  tableRowAlternate: {
    backgroundColor: '#fcfcfc'
  },
  tableCellHeader: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'left'
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    color: '#475569',
    textAlign: 'left'
  },
  tableCellRight: {
    textAlign: 'right'
  },
  summaryBox: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3
  },
  summaryLabel: {
    fontSize: 10,
    color: '#475569',
    fontWeight: 'bold'
  },
  summaryValue: {
    fontSize: 10,
    color: '#0f172a',
    fontWeight: 'bold'
  },
  grandTotalBox: {
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1'
  },
  grandTotalValue: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 25,
    right: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8'
  },
  poweredBy: {
    fontSize: 9,
    color: '#ea580c',
    fontWeight: 'bold'
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingHorizontal: 20
  },
  signatureBox: {
    width: 120,
    alignItems: 'center'
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    marginBottom: 5
  },
  signatureText: {
    fontSize: 9,
    color: '#64748b'
  }
});
