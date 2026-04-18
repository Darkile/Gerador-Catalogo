import { format } from "date-fns";

export function buildCatalogPdfFilename(date = new Date()) {
  return `catalogo-gregory-${format(date, "yyyy-MM-dd-HHmm")}.pdf`;
}
