import { View, Text } from "@react-pdf/renderer";
import { styles } from "../pdf-styles";

export interface PdfQuotationItem {
  descriptionSnapshot: string;
  uomSnapshot: string;
  quantity: string;
  finalRate: string;
  lineTotal: string;
}

function formatQty(value: string) {
  const num = Number(value);
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function formatAmount(value: string) {
  const num = Number(value);
  return new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
}

export function QuotationItemsTableHeader() {
  return (
    <View style={styles.tableHeaderRow} fixed>
      <Text style={[styles.cellHeader, styles.colSNo]}>{"S.\nNo"}</Text>
      <Text style={[styles.cellHeader, styles.colDescription, { textAlign: "left" }]}>Item Description</Text>
      <Text style={[styles.cellHeader, styles.colUom]}>UOM</Text>
      <Text style={[styles.cellHeader, styles.colQty]}>QTY</Text>
      <Text style={[styles.cellHeader, styles.colRate]}>Rates</Text>
      <Text style={[styles.cellHeader, styles.colTotal]}>Total</Text>
    </View>
  );
}

export function QuotationItemsTable({ items }: { items: PdfQuotationItem[] }) {
  return (
    <View style={styles.table}>
      <QuotationItemsTableHeader />
      {items.map((item, i) => (
        <View key={i} style={styles.tableRow} wrap={false}>
          <Text style={[styles.cell, styles.colSNo]}>{i + 1}</Text>
          <Text style={[styles.cellLeft, styles.colDescription]}>{item.descriptionSnapshot}</Text>
          <Text style={[styles.cell, styles.colUom]}>{item.uomSnapshot}</Text>
          <Text style={[styles.cell, styles.colQty]}>{formatQty(item.quantity)}</Text>
          <Text style={[styles.cell, styles.colRate]}>{formatAmount(item.finalRate)}</Text>
          <Text style={[styles.cell, styles.colTotal]}>{formatAmount(item.lineTotal)}</Text>
        </View>
      ))}
    </View>
  );
}
