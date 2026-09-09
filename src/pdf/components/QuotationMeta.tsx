import { View, Text } from "@react-pdf/renderer";
import { styles } from "../pdf-styles";

export function QuotationMeta({
  customerName,
  customerLocation,
  quotationNumber,
  quotationDate,
  expirationDate,
}: {
  customerName: string;
  customerLocation: string;
  quotationNumber: string;
  quotationDate: string;
  expirationDate: string;
}) {
  return (
    <View>
      <View style={styles.customerBlock}>
        <Text style={styles.customerName}>{customerName}</Text>
        {customerLocation && <Text style={styles.customerLocation}>{customerLocation}</Text>}
      </View>

      <Text style={styles.quotationNumber}>Quotation#{quotationNumber}</Text>

      <View style={styles.metaRow}>
        <View>
          <Text style={styles.metaLabel}>Quotation Date:</Text>
          <Text style={styles.metaValue}>{quotationDate}</Text>
        </View>
        <View>
          <Text style={{ ...styles.metaLabel, textAlign: "right" }}>Expiration Date:</Text>
          <Text style={{ ...styles.metaValue, textAlign: "right" }}>{expirationDate}</Text>
        </View>
      </View>
    </View>
  );
}
