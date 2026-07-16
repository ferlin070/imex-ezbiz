import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Create stylesheet for the PDF layout
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1e293b',
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#0ea5e9',
    paddingBottom: 15,
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0ea5e9',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  docTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 5,
  },
  metaGrid: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    padding: 5,
    marginTop: 15,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  col2: {
    width: '50%',
    padding: 5,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 10,
    height: '100%',
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#0f172a',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingRight: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0ea5e9',
    marginRight: 6,
    marginTop: 3,
  },
  bulletText: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.3,
  },
  feasibilityBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fafafa',
    borderRadius: 6,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  pitchBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    padding: 10,
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
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
      mdec: string
      tekun: string
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
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.appTitle}>IMEX AI-Biz — Laporan Komersial Inovasi</Text>
          <Text style={styles.docTitle}>{project.title}</Text>
          
          <View style={styles.metaGrid}>
            <Text>Kategori: {project.category || 'Umum'}</Text>
            <Text>Ahli: {project.team_members?.join(', ') || 'Tiada'}</Text>
            <Text>Tarikh Jana: {formattedDate}</Text>
          </View>
        </View>

        {/* Section 1: Feasibility Score */}
        <View style={styles.feasibilityBox}>
          <View>
            <Text style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>Kelayakan Komersial Projek</Text>
            <Text style={styles.tierLabel}>Tahap: {report.feasibility_tier}</Text>
          </View>
          <Text style={styles.scoreValue}>{report.feasibility_score}%</Text>
        </View>

        {/* Section 2: SWOT Analysis */}
        <Text style={styles.sectionTitle}>1. Analisis SWOT Perniagaan</Text>
        <View style={styles.grid}>
          {/* Strengths */}
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={[styles.cardTitle, { color: '#16a34a' }]}>Kekuatan (Strengths)</Text>
              {(report.swot.strengths || []).map((item, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <View style={[styles.bulletDot, { backgroundColor: '#16a34a' }]} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Weaknesses */}
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={[styles.cardTitle, { color: '#dc2626' }]}>Kelemahan (Weaknesses)</Text>
              {(report.swot.weaknesses || []).map((item, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <View style={[styles.bulletDot, { backgroundColor: '#dc2626' }]} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Opportunities */}
          <View style={[styles.col2, { marginTop: 10, width: '50%', padding: 5 }]}>
            <View style={styles.card}>
              <Text style={[styles.cardTitle, { color: '#0ea5e9' }]}>Peluang (Opportunities)</Text>
              {(report.swot.opportunities || []).map((item, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <View style={[styles.bulletDot, { backgroundColor: '#0ea5e9' }]} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Threats */}
          <View style={[styles.col2, { marginTop: 10, width: '50%', padding: 5 }]}>
            <View style={styles.card}>
              <Text style={[styles.cardTitle, { color: '#ea580c' }]}>Ancaman (Threats)</Text>
              {(report.swot.threats || []).map((item, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <View style={[styles.bulletDot, { backgroundColor: '#ea580c' }]} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Section 3: Actionable Blueprint */}
        <Text style={styles.sectionTitle}>2. Blueprint Tindakan Komersial</Text>
        <View style={styles.grid}>
          {/* Technical */}
          <View style={{ width: '33.3%', padding: 5 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Teknikal</Text>
              {(report.blueprint.technical || []).map((item, idx) => (
                <Text key={idx} style={[styles.bulletText, { marginBottom: 6 }]}>
                  {idx + 1}. {item}
                </Text>
              ))}
            </View>
          </View>

          {/* Marketing */}
          <View style={{ width: '33.3%', padding: 5 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pemasaran</Text>
              {(report.blueprint.marketing || []).map((item, idx) => (
                <Text key={idx} style={[styles.bulletText, { marginBottom: 6 }]}>
                  {idx + 1}. {item}
                </Text>
              ))}
            </View>
          </View>

          {/* Financial */}
          <View style={{ width: '33.3%', padding: 5 }}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Kewangan</Text>
              {(report.blueprint.financial || []).map((item, idx) => (
                <Text key={idx} style={[styles.bulletText, { marginBottom: 6 }]}>
                  {idx + 1}. {item}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Section 4: Investor Pitch Script */}
        <Text style={styles.sectionTitle}>3. Skrip Pitching Pelabur (60 Saat)</Text>
        <View style={styles.pitchBox}>
          <Text style={{ fontSize: 9, lineHeight: 1.4, color: '#334155' }}>
            {report.pitch_script}
          </Text>
        </View>

        {/* Section 5: Financing & Grants */}
        <Text style={styles.sectionTitle}>4. Nota Kelayakan Geran & Pembiayaan</Text>
        <View style={{ gap: 6 }}>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>MARA: </Text>
            {report.grant_notes.mara}
          </Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>TEKUN: </Text>
            {report.grant_notes.tekun}
          </Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>MDEC / Cradle: </Text>
            {report.grant_notes.mdec}
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Laporan ini dijana secara automatik oleh platform IMEX AI-Biz. Nilai peratusan diukur berdasarkan penilaian purata panel juri pakar teknikal.
        </Text>
      </Page>
    </Document>
  )
}
