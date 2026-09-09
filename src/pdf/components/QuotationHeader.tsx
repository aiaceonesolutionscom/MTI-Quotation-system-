import { View, Text } from "@react-pdf/renderer";
import { styles } from "../pdf-styles";
import { CompanyLogoImage } from "./MtiLogo";

export interface CompanySettingsData {
  name: string;
  logoUrl: string | null;
  address: string | null;
  strn: string | null;
  ntn: string | null;
  isoCerts: string | null;
}

export function QuotationHeader({ company }: { company: CompanySettingsData }) {
  return (
    <View fixed>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <CompanyLogoImage src={company.logoUrl} size={58} />
          <View style={styles.headerLeftText}>
            <Text style={styles.companyName}>{company.name}</Text>
            {company.isoCerts && <Text style={styles.isoLine}>{company.isoCerts}</Text>}
          </View>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            STRN# {company.strn ?? "—"}/ NTN NO: {company.ntn ?? "—"}
          </Text>
          <Text style={styles.infoBoxTextSpaced}>Head Office: {company.address ?? "—"}</Text>
        </View>
      </View>
    </View>
  );
}
