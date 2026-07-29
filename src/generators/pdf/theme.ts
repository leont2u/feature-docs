/** Shared typography, color, and spacing tokens for consistent report styling. */
export const PdfTheme = {
  page: {
    size: 'A4' as const,
    margin: 54,
  },
  colors: {
    heading: '#0f172a',
    body: '#1e293b',
    muted: '#64748b',
    accent: '#2563eb',
    tableHeaderBg: '#1e293b',
    tableHeaderText: '#f8fafc',
    tableRowAlt: '#f1f5f9',
    border: '#cbd5e1',
  },
  fonts: {
    heading: 'Helvetica-Bold',
    body: 'Helvetica',
    mono: 'Courier',
  },
  fontSize: {
    coverTitle: 30,
    coverSubtitle: 16,
    sectionTitle: 20,
    subsectionTitle: 14,
    body: 10.5,
    small: 9,
  },
  spacing: {
    sectionGapBefore: 24,
    paragraphGap: 8,
    tableRowHeight: 22,
  },
} as const;
