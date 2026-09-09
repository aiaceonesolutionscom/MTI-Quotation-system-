import { View, Text } from "@react-pdf/renderer";
import { styles } from "../pdf-styles";

export function QuotationFooter({
  mobile,
  phone,
  email,
  website,
}: {
  mobile: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}) {
  const parts = [
    mobile && `M: ${mobile}`,
    phone && `T: ${phone}`,
    email && `E: ${email}`,
    website && website,
  ].filter(Boolean);

  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{parts.join(" | ")}</Text>
    </View>
  );
}
