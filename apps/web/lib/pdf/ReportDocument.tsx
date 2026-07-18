import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const MARA_RED = '#8B1A1A'
const MARA_GOLD = '#D4A017'
const MARA_DARK = '#5C1010'

const styles = StyleSheet.create({
  page: {
    padding: 35,
    paddingBottom: 50,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#2d2d2d',
  },
  topBar: {
    backgroundColor: MARA_RED,
    margin: -35,
    marginBottom: 20,
    padding: '12 35',
  },
  topBarText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: MARA_GOLD,
    paddingBottom: 12,
    marginBottom: 15,
  },
  docTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MARA_DARK,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 20,
  },
  metaLabel: {
    fontSize: 7,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 9,
    color: '#444',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: MARA_RED,
    padding: '6 10',
    marginTop: 14,
    marginBottom: 8,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  col2: {
    width: '50%',
    padding: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 8,
    color: MARA_DARK,
    marginBottom: 4,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: MARA_GOLD,
    paddingBottom: 3,
  },
  cardTitleGreen: {
    fontWeight: 'bold',
    fontSize: 8,
    color: '#1a7d36',
    marginBottom: 4,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#1a7d36',
    paddingBottom: 3,
  },
  cardTitleRed: {
    fontWeight: 'bold',
    fontSize: 8,
    color: '#b91c1c',
    marginBottom: 4,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#b91c1c',
    paddingBottom: 3,
  },
  cardTitleBlue: {
    fontWeight: 'bold',
    fontSize: 8,
    color: '#0369a1',
    marginBottom: 4,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#0369a1',
    paddingBottom: 3,
  },
  cardTitleOrange: {
    fontWeight: 'bold',
    fontSize: 8,
    color: '#c2410c',
    marginBottom: 4,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#c2410c',
    paddingBottom: 3,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingRight: 4,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 5,
    marginTop: 4,
  },
  bulletDotGreen: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1a7d36',
    marginRight: 5,
    marginTop: 4,
  },
  bulletDotRed: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#b91c1c',
    marginRight: 5,
    marginTop: 4,
  },
  bulletDotBlue: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0369a1',
    marginRight: 5,
    marginTop: 4,
  },
  bulletDotOrange: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c2410c',
    marginRight: 5,
    marginTop: 4,
  },
  bulletText: {
    fontSize: 8,
    color: '#444',
    lineHeight: 1.35,
    flex: 1,
  },
  feasibilityBox: {
    borderWidth: 1,
    borderColor: MARA_GOLD,
    backgroundColor: '#fefcf0',
    borderRadius: 4,
    padding: '12 15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: MARA_RED,
  },
  tierLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: MARA_DARK,
    marginTop: 2,
  },
  col3: {
    width: '33.3%',
    padding: 4,
  },
  pitchBox: {
    borderWidth: 1,
    borderColor: MARA_GOLD,
    backgroundColor: '#fefcf0',
    borderRadius: 4,
    padding: 10,
    lineHeight: 1.4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: MARA_GOLD,
    paddingTop: 8,
    marginTop: 20,
    textAlign: 'center',
    fontSize: 7,
    color: '#999',
  },
})

interface ReportDocumentProps {
  project: {
    title: string
    description: string
    category: string
    team_members: string[]
  }
  report: {
    feasibility_score: number
    feasibility_tier: string
    swot: {
      strengths: string[]
      weaknesses: string[]
      opportunities: string[]
      threats: string[]
    }
    blueprint: {
      technical: string[]
      marketing: string[]
      financial: string[]
    }
    pitch_script: string
    grant_notes: {
      mara: string
    }
    generated_at: string
  }
}

export default function ReportDocument({ project, report }: ReportDocumentProps) {
  const formattedDate = new Date(report.generated_at).toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.topBarText}>IMEX AI-Biz — Laporan Komersial Inovasi</Text>
        </View>

        {/* Header */}
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

        {/* Section 1: Feasibility Score */}
        <View style={styles.feasibilityBox}>
          <View>
            <Text style={{ fontSize: 8, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Kelayakan Komersial Projek</Text>
            <Text style={styles.tierLabel}>Tahap: {report.feasibility_tier}</Text>
          </View>
          <Text style={styles.scoreValue}>{report.feasibility_score}%</Text>
        </View>

        {/* Section 2: SWOT Analysis */}
        <Text style={styles.sectionTitle}>1. Analisis SWOT Perniagaan</Text>
        <View style={styles.grid2}>
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={styles.cardTitleGreen}>Kekuatan (Strengths)</Text>
              {(report.swot.strengths || []).map((item, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <View style={styles.bulletDotGreen} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={styles.cardTitleRed}>Kelemahan (Weaknesses)</Text>
              {(report.swot.weaknesses || []).map((item, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <View style={styles.bulletDotRed} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.grid2}>
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={styles.cardTitleBlue}>Peluang (Opportunities)</Text>
              {(report.swot.opportunities || []).map((item, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <View style={styles.bulletDotBlue} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={styles.cardTitleOrange}>Ancaman (Threats)</Text>
              {(report.swot.threats || []).map((item, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <View style={styles.bulletDotOrange} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Section 3: Actionable Blueprint */}
        <Text style={styles.sectionTitle}>2. Blueprint Tindakan Komersial</Text>
        <View style={styles.grid2}>
          <View style={styles.col3}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Teknikal</Text>
              {(report.blueprint.technical || []).map((item, idx) => (
                <Text key={idx} style={[styles.bulletText, { marginBottom: 4 }]}>
                  {idx + 1}. {item}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.col3}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pemasaran</Text>
              {(report.blueprint.marketing || []).map((item, idx) => (
                <Text key={idx} style={[styles.bulletText, { marginBottom: 4 }]}>
                  {idx + 1}. {item}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.col3}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Kewangan</Text>
              {(report.blueprint.financial || []).map((item, idx) => (
                <Text key={idx} style={[styles.bulletText, { marginBottom: 4 }]}>
                  {idx + 1}. {item}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Section 4: Investor Pitch Script */}
        <Text style={styles.sectionTitle}>3. Skrip Pitching Pelabur (60 Saat)</Text>
        <View style={styles.pitchBox}>
          <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#444' }}>
            {report.pitch_script}
          </Text>
        </View>

        {/* Section 5: Financing & Grants */}
        <Text style={styles.sectionTitle}>4. Nota Kelayakan Geran & Pembiayaan</Text>
        <View style={styles.pitchBox}>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold', color: MARA_RED }}>MARA: </Text>
            {report.grant_notes.mara}
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Laporan ini dijana secara automatik oleh platform IMEX AI-Biz. Nilai peratusan diukur berdasarkan penilaian purata panel juri pakar teknikal.
        </Text>
      </Page>

      {/* Page 2 — Full blueprint, pitch & grants */}
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar}>
          <Text style={styles.topBarText}>IMEX AI-Biz — Laporan Komersial Inovasi (sambungan)</Text>
        </View>

        <Text style={styles.sectionTitle}>2. Blueprint Tindakan Komersial</Text>
        <View style={styles.grid2}>
          <View style={styles.col3}>
            <View style={[styles.card, { minHeight: 0 }]}>
              <Text style={styles.cardTitle}>Teknikal</Text>
              {(report.blueprint.technical || []).map((item, idx) => (
                <Text key={idx} style={[styles.bulletText, { marginBottom: 4 }]}>
                  {idx + 1}. {item}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.col3}>
            <View style={[styles.card, { minHeight: 0 }]}>
              <Text style={styles.cardTitle}>Pemasaran</Text>
              {(report.blueprint.marketing || []).map((item, idx) => (
                <Text key={idx} style={[styles.bulletText, { marginBottom: 4 }]}>
                  {idx + 1}. {item}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.col3}>
            <View style={[styles.card, { minHeight: 0 }]}>
              <Text style={styles.cardTitle}>Kewangan</Text>
              {(report.blueprint.financial || []).map((item, idx) => (
                <Text key={idx} style={[styles.bulletText, { marginBottom: 4 }]}>
                  {idx + 1}. {item}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>3. Skrip Pitching Pelabur (60 Saat)</Text>
        <View style={styles.pitchBox}>
          <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#444' }}>
            {report.pitch_script}
          </Text>
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
