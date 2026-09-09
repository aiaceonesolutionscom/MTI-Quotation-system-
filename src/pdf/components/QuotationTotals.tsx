import { View, Text } from "@react-pdf/renderer";
import { styles } from "../pdf-styles";

function formatAmount(value: string | number) {
  const num = Number(value);
  return new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
}

export interface PdfTotals {
  totalQuantity: string;
  subtotal: string;
  discountAmount: string;
  gstEnabled: boolean;
  gstPercent: string;
  gstAmount: string;
  additionalTaxEnabled: boolean;
  additionalTaxName: string | null;
  additionalTaxPercent: string | null;
  additionalTaxAmount: string;
  grandTotal: string;
  amountInWords: string;
}

export function QuotationTotals({ totals }: { totals: PdfTotals }) {
  const showDiscount = Number(totals.discountAmount) > 0;

  const extraRows: { label: string; value: string }[] = [];
  if (showDiscount) {
    extraRows.push({ label: "Discount", value: `− ${formatAmount(totals.discountAmount)}` });
  }
  if (totals.gstEnabled) {
    extraRows.push({ label: `GST ${totals.gstPercent}%`, value: formatAmount(totals.gstAmount) });
  }
  if (totals.additionalTaxEnabled) {
    extraRows.push({
      label: `${totals.additionalTaxName ?? "Additional Tax"} ${totals.additionalTaxPercent ?? 0}%`,
      value: formatAmount(totals.additionalTaxAmount),
    });
  }

  return (
    <View>
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryCell, styles.colSNo]} />
        <Text style={[styles.summaryCellBold, styles.colDescription]}>TOTAL</Text>
        <Text style={[styles.summaryCell, styles.colUom]} />
        <Text style={[styles.summaryCell, styles.colQty]}>{formatAmount(totals.totalQuantity)}</Text>
        <Text style={[styles.summaryCellBold, styles.colRate]}>TOTAL</Text>
        <Text style={[styles.summaryCellBold, styles.colTotal]}>{formatAmount(totals.subtotal)}</Text>
      </View>

      {extraRows.map((row) => (
        <View key={row.label} style={styles.summaryRow}>
          <Text style={[styles.summaryCell, styles.colSNo]} />
          <Text style={[styles.summaryCell, styles.colDescription]} />
          <Text style={[styles.summaryCell, styles.colUom]} />
          <Text style={[styles.summaryCell, styles.colQty]} />
          <Text style={[styles.summaryCell, styles.colRate]}>{row.label}</Text>
          <Text style={[styles.summaryCell, styles.colTotal]}>{row.value}</Text>
        </View>
      ))}

      <View style={styles.summaryRow}>
        <Text style={[styles.summaryCell, styles.colSNo]} />
        <Text style={[styles.summaryCell, styles.colDescription]} />
        <Text style={[styles.summaryCell, styles.colUom]} />
        <Text style={[styles.summaryCell, styles.colQty]} />
        <Text style={[styles.summaryCellBold, styles.colRate]}>TOTAL</Text>
        <Text style={[styles.summaryCellBold, styles.colTotal]}>{formatAmount(totals.grandTotal)}</Text>
      </View>

      <View style={styles.amountWordsWrap}>
        <Text style={styles.amountWordsLabel}>Amount in words :</Text>
        <Text style={styles.amountWordsValue}>{totals.amountInWords}</Text>
      </View>
    </View>
  );
}
