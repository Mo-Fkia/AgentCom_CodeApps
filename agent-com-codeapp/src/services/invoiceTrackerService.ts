import { getInvoiceTracker as getMockInvoiceTracker } from "./mockData";

export type DraftStatus = "New" | "Sent" | "Uploaded" | "Completed";

export type MockInvoiceTrackerRecord = {
  InvoiceNumber: string;
  AgentCompanyName: string;
  VendorCode: string;
  CampusName: string;
  Amount: number;
  Status: string;
  LastUpdated: string;
};

export type DraftInvoiceRecord = {
  DraftNm: string;
  AgentName: string;
  AgentCode: string;
  YearTerm: string;
  Campus: string;
  TotalCommission: number;
  CurrentStatus: DraftStatus;
  CreatedDate: string;
  DraftInvoiceLink: "#";
};

type DraftInvoiceInput = Omit<DraftInvoiceRecord, "CurrentStatus" | "CreatedDate" | "DraftInvoiceLink"> &
  Partial<Pick<DraftInvoiceRecord, "CurrentStatus" | "CreatedDate" | "DraftInvoiceLink">>;

const today = () => new Date().toISOString().slice(0, 10);

const initialTrackerRecords = (getMockInvoiceTracker() as MockInvoiceTrackerRecord[]).map((record) => ({
  AgentCode: record.VendorCode || "-",
  AgentName: record.AgentCompanyName,
  Campus: record.CampusName,
  CreatedDate: record.LastUpdated,
  CurrentStatus: "New" as DraftStatus,
  DraftInvoiceLink: "#" as const,
  DraftNm: record.InvoiceNumber,
  TotalCommission: record.Amount,
  YearTerm: "Mock",
}));

let invoiceTrackerState: DraftInvoiceRecord[] = [...initialTrackerRecords];

export function getInvoiceTracker() {
  return invoiceTrackerState;
}

export function createDraftInvoices(rows: DraftInvoiceInput[]) {
  const draftInvoices = rows.map((row) => ({
    ...row,
    CreatedDate: row.CreatedDate ?? today(),
    CurrentStatus: row.CurrentStatus ?? "New",
    DraftInvoiceLink: row.DraftInvoiceLink ?? ("#" as const),
  }));

  invoiceTrackerState = [...invoiceTrackerState, ...draftInvoices];

  return draftInvoices;
}

export function updateInvoiceStatus(draftNm: string, status: DraftStatus) {
  let updatedRecord: DraftInvoiceRecord | undefined;

  invoiceTrackerState = invoiceTrackerState.map((record) => {
    if (record.DraftNm !== draftNm) {
      return record;
    }

    updatedRecord = { ...record, CurrentStatus: status };
    return updatedRecord;
  });

  return updatedRecord;
}

export function uploadInvoiceMock(draftNm: string, file: File | { name?: string } | string) {
  const uploadedFileName = typeof file === "string" ? file : file.name || "mock-upload";
  const updatedRecord = updateInvoiceStatus(draftNm, "Uploaded");

  return {
    draftNm,
    fileName: uploadedFileName,
    status: updatedRecord?.CurrentStatus ?? "Uploaded",
  };
}
