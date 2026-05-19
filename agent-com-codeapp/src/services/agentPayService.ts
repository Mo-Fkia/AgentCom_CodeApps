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

export type AgentPayFilterOptions = {
  years: string[];
  terms: string[];
  campuses: string[];
  programs: string[];
};

export type AgentPayReadyRecord = {
  TermYear: number;
  TermNumber: number;
  CampusName: string;
  ProgramName: string;
  ProgramCode: string;
  ProgramStage?: string;
  CourseName?: string;
  CourseOfferCode?: string;
  StudentName: string;
  EmpID: number;
  StudentID: number;
  AgentCompanyID: number;
  AgentCompanyName: string;
  OriginalAgentCompanyName: string;
  PaymentAmountSubject: number;
  TotalPayment2: number;
  PaymentMode?: string;
  PaymentStatus: string;
  PaymentComment?: string;
  AmountToPayOverride?: number;
  SessionStatusID?: string;
  Domestic?: string;
  NationalityCountry?: string;
  EmailAddress?: string;
  AddressOne?: string;
  AddressTwo?: string;
  PhoneNumber?: string;
  PostalCode?: string;
  Province?: string;
  ISOAlpha?: string;
  CountryName?: string;
  City?: string;
  YT: string;
  Seen: boolean;
  LoadDtm?: string;
  AgentPayReadyID?: number;
};

const dataMode = (import.meta.env.VITE_DATA_MODE ?? "mock") as DataMode;
const agentPayExtractUrl = import.meta.env.VITE_AGENT_PAY_EXTRACT_URL;

const fixedProgramOptions = [
  "All",
  "SIT30821 Certificate III in Commercial Cookery",
  "Master of Business Administration / Master of Applied Hospitality Management",
  "SIT60322 Advanced Diploma of Hospitality Management (Patisserie)",
  "SIT60322 Advanced Diploma of Hospitality Management (Commercial Cookery)",
  "Bachelor of Business (International Restaurant Management)",
  "SIT40721 Certificate IV in Patisserie",
  "Master of Business Administration",
  "SIT40521 Certificate IV in Kitchen Management",
  "Bachelor of Business (International Hotel Management)",
  "Master of Applied Hospitality Management",
  "Master of International Hospitality Management (MIHM)",
  "A la carte",
  "Bachelor of Business Administration",
  "SIT31021 Certificate III in Patisserie",
  "SIT40521 Certificate IV Kitchen Management",
  "Bachelor of Business",
];

const defaultFilterOptions: AgentPayFilterOptions = {
  campuses: ["Sydney", "Melbourne", "Brisbane", "Adelaide"],
  programs: fixedProgramOptions,
  terms: ["T1", "T2", "T3", "T4"],
  years: ["2024", "2025", "2026"],
};

function uniqueValues<T>(rows: T[], getValue: (row: T) => string | number) {
  return Array.from(new Set(rows.map((row) => String(getValue(row))).filter(Boolean))).sort();
}

function asNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function asString(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function asSeen(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "Seen";
}

function normalizeTermFilter(term: string | undefined) {
  if (!term || term === "All") {
    return "All";
  }

  return term.replace(/^T/i, "");
}

function normalizeAgentPayReadyRecord(row: Partial<AgentPayReadyRecord>) {
  const agentCompanyName = asString(row.AgentCompanyName);
  const empId = asNumber(row.EmpID);

  return {
    ...row,
    AgentCompanyID: asNumber(row.AgentCompanyID),
    AgentCompanyName: agentCompanyName,
    AmountToPayOverride:
      row.AmountToPayOverride === undefined ? undefined : asNumber(row.AmountToPayOverride),
    EmpID: empId,
    OriginalAgentCompanyName: asString(row.OriginalAgentCompanyName) || agentCompanyName,
    PaymentAmountSubject: asNumber(row.PaymentAmountSubject),
    Seen: asSeen(row.Seen),
    StudentID: row.StudentID === undefined ? empId : asNumber(row.StudentID),
    TermNumber: asNumber(row.TermNumber),
    TermYear: asNumber(row.TermYear),
    TotalPayment2: asNumber(row.TotalPayment2),
    YT: asString(row.YT),
  } as AgentPayReadyRecord;
}

export function getAgentPayFilterOptions() {
  if (dataMode === "real") {
    return defaultFilterOptions;
  }

  const records = getAgentPayReady() as AgentPayReadyRecord[];

  return {
    campuses: uniqueValues(records, (record) => record.CampusName),
    programs: fixedProgramOptions,
    terms: uniqueValues(records, (record) => `T${record.TermNumber}`),
    years: uniqueValues(records, (record) => record.TermYear),
  };
}

function extractAgentPayReadyMock(filters: AgentPayReadyFilters = {}) {
  const records = (getAgentPayReady() as Partial<AgentPayReadyRecord>[]).map(
    normalizeAgentPayReadyRecord,
  );
  const yearFilter = filters.year ?? "All";
  const termFilter = filters.term?.replace(/^T/i, "") ?? "All";
  const campusFilter = filters.campus ?? "All";
  const programFilter = filters.program ?? "All";

  return records.filter((record) => {
    const matchesYear = yearFilter === "All" || String(record.TermYear) === yearFilter;
    const matchesTerm = termFilter === "All" || String(record.TermNumber) === termFilter;
    const matchesCampus = campusFilter === "All" || record.CampusName === campusFilter;
    const matchesProgram = programFilter === "All" || record.ProgramName === programFilter;

    return matchesYear && matchesTerm && matchesCampus && matchesProgram;
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
      campus: filters.campus ?? "All",
      programs: [filters.program ?? "All"],
      seenFilter: "All",
      term: normalizeTermFilter(filters.term),
      year: filters.year ?? "All",
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Agent pay extraction failed with status ${response.status}.`);
  }

  const rows = await response.json();

  if (!Array.isArray(rows)) {
    throw new Error("Agent pay extraction returned an invalid response.");
  }

  return (rows as Partial<AgentPayReadyRecord>[]).map(normalizeAgentPayReadyRecord);
}

export function extractAgentPayReady(filters: AgentPayReadyFilters = {}) {
  if (dataMode === "real") {
    return extractAgentPayReadyReal(filters);
  }

  return extractAgentPayReadyMock(filters);
}
