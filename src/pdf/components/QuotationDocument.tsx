import { Document, Page } from "@react-pdf/renderer";
import { styles } from "../pdf-styles";
import { QuotationHeader, type CompanySettingsData } from "./QuotationHeader";
import { QuotationMeta } from "./QuotationMeta";
import { QuotationItemsTable, type PdfQuotationItem } from "./QuotationItemsTable";
import { QuotationTotals, type PdfTotals } from "./QuotationTotals";
import { QuotationFooter } from "./QuotationFooter";

export interface QuotationPdfData {
  company: CompanySettingsData & { mobile: string | null; phone: string | null; email: string | null; website: string | null };
  customerName: string;
  customerLocation: string;
  quotationNumber: string;
  quotationDate: string;
  expirationDate: string;
  items: PdfQuotationItem[];
  totals: PdfTotals;
}

export function QuotationDocument({ data }: { data: QuotationPdfData }) {
  return (
    <Document title={`Quotation ${data.quotationNumber}`}>
      <Page size="A4" style={styles.page} wrap>
        <QuotationHeader company={data.company} />
        <QuotationMeta
          customerName={data.customerName}
          customerLocation={data.customerLocation}
          quotationNumber={data.quotationNumber}
          quotationDate={data.quotationDate}
          expirationDate={data.expirationDate}
        />
        <QuotationItemsTable items={data.items} />
        <QuotationTotals totals={data.totals} />
        <QuotationFooter
          mobile={data.company.mobile}
          phone={data.company.phone}
          email={data.company.email}
          website={data.company.website}
        />
      </Page>
    </Document>
  );
}
