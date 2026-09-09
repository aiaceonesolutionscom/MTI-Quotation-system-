import { StyleSheet } from "@react-pdf/renderer";

export const COLORS = {
  black: "#000000",
  white: "#ffffff",
  border: "#000000",
  muted: "#333333",
};

export const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 60,
    paddingHorizontal: 32,
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    color: COLORS.black,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 14,
  },
  headerLeftText: {
    flexGrow: 1,
    flexShrink: 1,
    alignItems: "center",
  },
  companyName: {
    fontFamily: "Times-Bold",
    fontSize: 23,
    textAlign: "center",
    borderBottomWidth: 1.4,
    borderBottomColor: COLORS.border,
    paddingBottom: 2,
    alignSelf: "stretch",
  },
  isoLine: {
    fontSize: 9,
    textAlign: "left",
    marginTop: 3,
  },
  infoBox: {
    flexDirection: "column",
    flexShrink: 0,
    marginTop: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 5,
    paddingHorizontal: 9,
    width: 195,
  },
  infoBoxText: {
    fontSize: 9,
    textAlign: "center",
    lineHeight: 1.4,
  },
  infoBoxTextSpaced: {
    fontSize: 9,
    textAlign: "center",
    lineHeight: 1.4,
    marginTop: 3,
  },

  // Customer + meta
  customerBlock: {
    marginTop: 18,
    marginBottom: 12,
  },
  customerName: {
    fontFamily: "Times-Bold",
    fontSize: 15,
    textDecoration: "underline",
  },
  customerLocation: {
    fontSize: 10.5,
    marginTop: 2,
  },
  quotationNumber: {
    textAlign: "center",
    fontFamily: "Times-Bold",
    fontSize: 15,
    textDecoration: "underline",
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  metaLabel: {
    fontFamily: "Times-Bold",
    fontSize: 10.5,
  },
  metaValue: {
    fontSize: 10.5,
    marginTop: 2,
  },

  // Table
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.black,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: "row",
    backgroundColor: COLORS.black,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cellHeader: {
    color: COLORS.white,
    fontFamily: "Times-BoldItalic",
    fontSize: 10,
    paddingVertical: 7,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  cell: {
    fontFamily: "Times-Italic",
    fontSize: 10,
    paddingVertical: 7,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  cellLeft: {
    fontFamily: "Times-Italic",
    fontSize: 10,
    paddingVertical: 7,
    paddingHorizontal: 5,
    textAlign: "left",
  },
  summaryCell: {
    color: COLORS.white,
    fontSize: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  summaryCellBold: {
    color: COLORS.white,
    fontFamily: "Times-Bold",
    fontSize: 12.5,
    paddingVertical: 7,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  colSNo: { width: "6%" },
  colDescription: { width: "42%" },
  colUom: { width: "10%" },
  colQty: { width: "10%" },
  colRate: { width: "16%" },
  colTotal: { width: "16%" },

  // Amount in words + notes
  amountWordsWrap: {
    marginTop: 14,
  },
  amountWordsLabel: {
    fontFamily: "Times-Italic",
    fontSize: 10.5,
  },
  amountWordsValue: {
    fontFamily: "Times-BoldItalic",
    fontSize: 13,
    textDecoration: "underline",
    marginTop: 4,
  },
  notesBlock: {
    marginTop: 16,
  },
  notesLabel: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 10,
    lineHeight: 1.4,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 22,
    left: 32,
    right: 32,
  },
  footerText: {
    textAlign: "center",
    fontSize: 9,
    textDecoration: "underline",
  },
});
