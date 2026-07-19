import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const MARA_RED = '#8B1A1A'
const MARA_GOLD = '#D4A017'
const MARA_DARK = '#5C1010'

const styles = StyleSheet.create({
  page: { padding: 35, paddingBottom: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 9, color: '#2d2d2d' },
  topBar: { backgroundColor: MARA_RED, margin: -35, marginBottom: 18, padding: '10 35' },
  topBarText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },
  headerContainer: { borderBottomWidth: 2, borderBottomColor: MARA_GOLD, paddingBottom: 10, marginBottom: 12 },
  docTitle: { fontSize: 16, fontWeight: 'bold', color: MARA_DARK },
  metaRow: { flexDirection: 'row', marginTop: 6, gap: 16 },
  metaLabel: { fontSize: 7, color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  metaValue: { fontSize: 9, color: '#444', marginTop: 1 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#ffffff', backgroundColor: MARA_RED, padding: '5 10', marginTop: 12, marginBottom: 6 },
  summaryGrid: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  summaryCard: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: '8 10', alignItems: 'center' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: MARA_RED, marginTop: 2 },
  summaryLabel: { fontSize: 7, color: '#888', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  tableHeader: { flexDirection: 'row', backgroundColor: MARA_RED, padding: '5 8', fontSize: 7, color: '#ffffff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  tableRow: { flexDirection: 'row', padding: '4 8', fontSize: 8, borderBottomWidth: 1, borderBottomColor: '#eee', color: '#444' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  footer: { borderTopWidth: 1, borderTopColor: MARA_GOLD, paddingTop: 6, marginTop: 14, textAlign: 'center', fontSize: 7, color: '#999' },
  colMonth: { width: '12%' },
  colInstallment: { width: '22%', textAlign: 'right' },
  colPrincipal: { width: '22%', textAlign: 'right' },
  colProfit: { width: '22%', textAlign: 'right' },
  colBalance: { width: '22%', textAlign: 'right' },
  infoCard: { borderWidth: 1, borderColor: MARA_GOLD, backgroundColor: '#fefcf0', borderRadius: 3, padding: '8 12', marginBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  infoLabel: { fontSize: 7, color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { fontSize: 9, fontWeight: 'bold', color: MARA_DARK },
  watermark: { position: 'absolute', top: '40%', left: 0, right: 0, textAlign: 'center', fontSize: 40, color: '#f0f0f0', transform: 'rotate(-45deg)', fontWeight: 'bold', zIndex: -1 },
})

interface ScheduleItem {
  month: number
  installment: number
  principal: number
  profit: number
  balance: number
}

interface RepaymentScheduleDocumentProps {
  applicantName: string
  productName: string
  amount: number
  tenureMonths: number
  profitRate: number
  monthlyInstallment: number
  totalRepayment: number
  totalProfit: number
  schedule: ScheduleItem[]
  generatedAt: string
}

function TableRow({ item, index }: { item: ScheduleItem; index: number }) {
  return (
    <View style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
      <Text style={styles.colMonth}>{item.month}</Text>
      <Text style={styles.colInstallment}>RM{item.installment.toFixed(2)}</Text>
      <Text style={styles.colPrincipal}>RM{item.principal.toFixed(2)}</Text>
      <Text style={styles.colProfit}>RM{item.profit.toFixed(2)}</Text>
      <Text style={styles.colBalance}>RM{item.balance.toFixed(2)}</Text>
    </View>
  )
}

export default function RepaymentScheduleDocument({
  applicantName,
  productName,
  amount,
  tenureMonths,
  profitRate,
  monthlyInstallment,
  totalRepayment,
  totalProfit,
  schedule,
  generatedAt,
}: RepaymentScheduleDocumentProps) {
  const formattedDate = new Date(generatedAt).toLocaleDateString('ms-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const pages = Math.ceil((schedule.length + 15) / 40)

  return (
    <Document>
      {Array.from({ length: pages }, (_, pageIdx) => (
        <Page key={pageIdx} size="A4" style={styles.page}>
          <View style={styles.topBar}>
            <Text style={styles.topBarText}>MARA — Jadual Bayaran Balik Pembiayaan</Text>
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.docTitle}>Jadual Bayaran Balik</Text>
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.metaLabel}>Pemohon</Text>
                <Text style={styles.metaValue}>{applicantName}</Text>
              </View>
              <View>
                <Text style={styles.metaLabel}>Tarikh Jana</Text>
                <Text style={styles.metaValue}>{formattedDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Skim Pembiayaan</Text>
              <Text style={styles.infoValue}>{productName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amaun Pembiayaan</Text>
              <Text style={styles.infoValue}>RM{amount.toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tempoh Bayaran</Text>
              <Text style={styles.infoValue}>{tenureMonths} Bulan ({(tenureMonths / 12).toFixed(1)} Tahun)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kadar Keuntungan</Text>
              <Text style={styles.infoValue}>{profitRate}% Setahun</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Ringkasan Bayaran</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Ansuran Bulanan</Text>
              <Text style={styles.summaryValue}>RM{monthlyInstallment.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Jumlah Bayaran</Text>
              <Text style={styles.summaryValue}>RM{totalRepayment.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Jumlah Caj Untung</Text>
              <Text style={styles.summaryValue}>RM{totalProfit.toLocaleString()}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Jadual Pengurangan Baki Pembiayaan (Amortisasi)</Text>

          <View style={styles.tableHeader}>
            <Text style={styles.colMonth}>Bulan</Text>
            <Text style={styles.colInstallment}>Ansuran (RM)</Text>
            <Text style={styles.colPrincipal}>Prinsipal (RM)</Text>
            <Text style={styles.colProfit}>Caj Untung (RM)</Text>
            <Text style={styles.colBalance}>Baki (RM)</Text>
          </View>

          {schedule.slice(pageIdx * 40, (pageIdx + 1) * 40).map((item, idx) => (
            <TableRow key={item.month} item={item} index={idx} />
          ))}

          <Text style={styles.footer}>
            Laporan ini dijana secara automatik oleh platform MARA. Nilai adalah anggaran berdasarkan kadar keuntungan semasa. Halaman {pageIdx + 1} / {pages}
          </Text>
        </Page>
      ))}
    </Document>
  )
}
