export type Template = {
  id: number;
  name: string;
  description: string;
  body: string;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Lead = {
  id: string;
  title: string;
  organizationId: number | null;
  organizationName: string | null;
  personId: number | null;
  personName: string | null;
  personEmail: string | null;
  value: { amount: number; currency: string } | null;
  addTime: string;
  isArchived: boolean;
  website: string | null;
};

export type LeadRow = Lead & {
  offerCount: number;
  offerStatus: "none" | "draft" | "converted";
  latestOfferId: number | null;
};

export type MeetingNote = {
  id: number;
  content: string;
  text: string;
  addTime: string;
  updateTime: string | null;
  author: string | null;
};

export type WebsitePage = {
  url: string;
  title: string;
  status: "read" | "failed" | "skipped";
  chars: number;
  error?: string;
};

export type CompanyNote = {
  text: string;
  sourceUrl: string;
};

export type OfferSources = {
  template: { id: number | null; name: string };
  notes: { id: number; addTime: string; excerpt: string }[];
  website: string | null;
  pages: WebsitePage[];
  companyNotes: CompanyNote[];
  model: string;
};

export type Offer = {
  id: number;
  leadId: string;
  leadTitle: string;
  organizationName: string | null;
  templateId: number | null;
  templateName: string;
  title: string;
  body: string;
  status: "draft" | "converted";
  sources: OfferSources;
  dealId: number | null;
  dealNoteId: number | null;
  dealFileId: number | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
