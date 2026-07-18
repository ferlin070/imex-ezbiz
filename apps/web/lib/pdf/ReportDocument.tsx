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
  card: { borderWidth: 1, borderColor: '#ddd', padding: '6 8', marginBottom: 4 },
  cardTitle: { fontWeight: 'bold', fontSize: 8, color: MARA_DARK, marginBottom: 3, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: MARA_GOLD, paddingBottom: 2 },
  bulletItem: { flexDirection: 'row', marginBottom: 2 },
  bulletDot: { width: 3, height: 3, borderRadius: 1, marginRight: 4, marginTop: 4 },
  bulletText: { fontSize: 8, color: '#444', lineHeight: 1.3 },
  feasibilityBox: { borderWidth: 1, borderColor: MARA_GOLD, backgroundColor: '#fefcf0', borderRadius: 3, padding: '10 14', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  scoreValue: { fontSize: 20, fontWeight: 'bold', color: MARA_RED },
  tierLabel: { fontSize: 10, fontWeight: 'bold', color: MARA_DARK, marginTop: 2 },
  pitchBox: { borderWidth: 1, borderColor: MARA_GOLD, backgroundColor: '#fefcf0', borderRadius: 3, padding: 8, marginBottom: 4 },
  swotRow: { flexDirection: 'row', marginBottom: 4 },
  swotHalf: { width: '50%', padding: 2 },
  bpCol: { width: '33.3%', padding: 2 },
  bpRow: { flexDirection: 'row', marginBottom: 4 },
  footer: { borderTopWidth: 1, borderTopColor: MARA_GOLD, paddingTop: 6, marginTop: 14, textAlign: 'center', fontSize: 7, color: '#999' },
})

interface ReportDocumentProps {
  project: { title: string; description: string; category: string; team_members: string[] }
  report: {
    feasibility_score: number; feasibility_tier: string
    swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] }
    blueprint: { technical: string[]; marketing: string[]; financial: string[] }
    pitch_script: string; grant_notes: { mara: string }; generated_at: string
  }
}

function SwotCard({ title, items, dotColor, titleColor }: { title: string; items: string[]; dotColor: string; titleColor: string }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.cardTitle, { color: titleColor, borderBottomColor: titleColor }]}>{title}</Text>
      {(items || []).map((item, idx) => (
        <View key={idx} style={styles.bulletItem}>
          <View style={[styles.bulletDot, { backgroundColor: dotColor }]} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

function BpCard({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {(items || []).map((item, idx) => (
        <Text key={idx} style={[styles.bulletText, { marginBottom: 2 }]}>{idx + 1}. {item}</Text>
      ))}
    </View>
  )
}

export default function ReportDocument({ project, report }: ReportDocumentProps) {
  const formattedDate = new Date(report.generated_at).toLocaleDateString('ms-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <Document>
      {/* Page 1 — Header, Score, SWOT */}
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar}>
          <Text style={styles.topBarText}>IMEX AI-Biz — Laporan Komersial Inovasi</Text>
        </View>
        <View style={styles.headerContainer}>
          <Text style={styles.docTitle}>{project.title}</Text>
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Kategori</Text>
              <Text style={styles.metaValue}>{project.category || 'Umum'}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Tarikh Jana</Text>
              <Text style={styles.metaValue}>{formattedDate}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Ahli Pasukan</Text>
              <Text style={styles.metaValue}>{project.team_members?.join(', ') || 'Tiada'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.feasibilityBox}>
          <View>
            <Text style={{ fontSize: 7, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Kelayakan Komersial Projek</Text>
            <Text style={styles.tierLabel}>Tahap: {report.feasibility_tier}</Text>
          </View>
          <Text style={styles.scoreValue}>{report.feasibility_score}%</Text>
        </View>
        <Text style={styles.sectionTitle}>1. Analisis SWOT Perniagaan</Text>
        <View style={styles.swotRow}>
          <View style={styles.swotHalf}>
            <SwotCard title="Kekuatan" items={report.swot.strengths} dotColor="#1a7d36" titleColor="#1a7d36" />
          </View>
          <View style={styles.swotHalf}>
            <SwotCard title="Kelemahan" items={report.swot.weaknesses} dotColor="#b91c1c" titleColor="#b91c1c" />
          </View>
        </View>
        <View style={styles.swotRow}>
          <View style={styles.swotHalf}>
            <SwotCard title="Peluang" items={report.swot.opportunities} dotColor="#0369a1" titleColor="#0369a1" />
          </View>
          <View style={styles.swotHalf}>
            <SwotCard title="Ancaman" items={report.swot.threats} dotColor="#c2410c" titleColor="#c2410c" />
          </View>
        </View>
      </Page>

      {/* Page 2 — Blueprint, Pitch, Grants */}
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar}>
          <Text style={styles.topBarText}>IMEX AI-Biz — Laporan Komersial Inovasi (sambungan)</Text>
        </View>
        <Text style={styles.sectionTitle}>2. Blueprint Tindakan Komersial</Text>
        <View style={styles.bpRow}>
          <View style={styles.bpCol}>
            <BpCard title="Teknikal" items={report.blueprint.technical} />
          </View>
          <View style={styles.bpCol}>
            <BpCard title="Pemasaran" items={report.blueprint.marketing} />
          </View>
          <View style={styles.bpCol}>
            <BpCard title="Kewangan" items={report.blueprint.financial} />
          </View>
        </View>
        <Text style={styles.sectionTitle}>3. Skrip Pitching Pelabur (60 Saat)</Text>
        <View style={styles.pitchBox}>
          <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#444' }}>{report.pitch_script}</Text>
        </View>
        <Text style={styles.sectionTitle}>4. Nota Kelayakan Geran & Pembiayaan</Text>
        <View style={styles.pitchBox}>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold', color: MARA_RED }}>MARA: </Text>
            {report.grant_notes.mara}
          </Text>
        </View>
        <Text style={styles.footer}>
          Laporan ini dijana secara automatik oleh platform IMEX AI-Biz. Nilai peratusan diukur berdasarkan penilaian purata panel juri pakar teknikal.
        </Text>
      </Page>
    </Document>
  )
}
