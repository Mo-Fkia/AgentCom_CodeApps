import { getAgentPayReady } from "./mockData";

type DataMode = "mock" | "real";

export type SeenFilter = "All" | "Seen" | "Not Seen";

export type AgentPayReadyFilters = {
  year?: string;
  term?: string;
  campus?: string;
  program?: string;
  seen?: SeenFilter;
};

export type AgentPayReadyRecord = {
  TermYear: number;
  TermNumber: number;
  CampusName: string;
  ProgramName: string;
  ProgramCode: string;
  StudentName: string;
  EmpID: number;
  AgentCompanyID: number;
  AgentCompanyName: string;
  PaymentAmountSubject: number;
  TotalPayment2: number;
  PaymentStatus: string;
  YT: string;
  Seen: boolean;
};

const dataMode = (import.meta.env.VITE_DATA_MODE ?? "mock") as DataMode;

function extractAgentPayReadyMock(filters: AgentPayReadyFilters = {}) {
  const records = getAgentPayReady() as AgentPayReadyRecord[];
  const yearFilter = filters.year ?? "All";
  const termFilter = filters.term ?? "All";
  const campusFilter = filters.campus ?? "All";
  const programFilter = filters.program ?? "All";
  const seenFilter = filters.seen ?? "All";

  return records.filter((record) => {
    const matchesYear = yearFilter === "All" || String(record.TermYear) === yearFilter;
    const matchesTerm = termFilter === "All" || String(record.TermNumber) === termFilter;
    const matchesCampus = campusFilter === "All" || record.CampusName === campusFilter;
    const matchesProgram = programFilter === "All" || record.ProgramName === programFilter;
    const matchesSeen =
      seenFilter === "All" ||
      (seenFilter === "Seen" && record.Seen) ||
      (seenFilter === "Not Seen" && !record.Seen);

    return matchesYear && matchesTerm && matchesCampus && matchesProgram && matchesSeen;
  });
}

function extractAgentPayReadyReal(filters: AgentPayReadyFilters = {}) {
  void filters;
  // Future real-data hook:
  // Call the approved SQL-backed API or Power Automate flow here, then normalize
  // the response into AgentPayReadyRecord[] before returning it to the UI.
  throw new Error("Real SQL extraction is not connected yet.");
}

export function extractAgentPayReady(filters: AgentPayReadyFilters = {}) {
  if (dataMode === "real") {
    return extractAgentPayReadyReal(filters);
  }

  return extractAgentPayReadyMock(filters);
}
