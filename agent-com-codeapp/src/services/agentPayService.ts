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
const agentPayExtractUrl = import.meta.env.VITE_AGENT_PAY_EXTRACT_URL;

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

async function extractAgentPayReadyReal(filters: AgentPayReadyFilters = {}) {
  if (!agentPayExtractUrl) {
    throw new Error("VITE_AGENT_PAY_EXTRACT_URL is not configured.");
  }

  // Future real-data hook:
  // This placeholder posts to the approved Power Automate endpoint. The flow can
  // perform the SQL extraction and return rows shaped like AgentPayReadyRecord[].
  const response = await fetch(agentPayExtractUrl, {
    body: JSON.stringify({
      campus: filters.campus,
      programs: filters.program && filters.program !== "All" ? [filters.program] : [],
      seenFilter: filters.seen,
      term: filters.term,
      year: filters.year,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Agent pay extraction failed with status ${response.status}.`);
  }

  return (await response.json()) as AgentPayReadyRecord[];
}

export function extractAgentPayReady(filters: AgentPayReadyFilters = {}) {
  if (dataMode === "real") {
    return extractAgentPayReadyReal(filters);
  }

  return extractAgentPayReadyMock(filters);
}
