export type CommissionStatus = "active" | "dormant" | "concluded" | "unknown";
export type LinkStatus = "working" | "broken" | "to_be_located";

export interface Commission {
  name: {
    primary: string;
    translations: { language: string; name: string }[];
  };
  foundingYear: number | null;
  memberCountries: string[];
  sponsoringInstitutions: string[];
  keyTopics: string[];
  publications: {
    title: string;
    year: number | null;
    url: string | null;
    format: "report" | "monograph" | "proceedings" | "textbook_review" | "teaching_material" | "other";
  }[];
  workingGroups: string[];
  status: CommissionStatus;
  chairs: { name: string; country: string; affiliation: string | null }[];
  url: string;
  linkStatus: LinkStatus;
  siteLanguages: string[];
  lastArchivedSnapshot: string | null;
  archivableDocuments: { title: string; url: string }[];
}
