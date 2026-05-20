import { getAgentTagging, getVendors as getMockVendors } from "./mockData";

type DataMode = "mock" | "real";

export type VendorRecord = {
  Address?: string;
  Email?: string;
  ID: string;
  "NAV ID": string;
  NAVID?: string;
  Phone?: string;
  "Vendor Name": string;
  VendorName?: string;
};

export type AgentMappingRecord = {
  AgentCompanyID?: string;
  Title: string;
  AgentCompanyName: string;
  BCAgentName?: string;
  BCVendorCode?: string;
  EMPAgentCompanyName?: string;
  "BC Agent Name": string;
  "BC Vendor Code": string;
  OtherRemarks?: string;
  "Other Remarks": string;
  field_1?: string;
  field_2?: string;
  field_3?: string;
  field_4?: string;
};

type AgentLookupResponse = {
  agentTagging: AgentMappingRecord[];
  vendors: VendorRecord[];
};

type RawAgentLookupResponse = {
  agentTagging: AgentMappingRecord[] | string;
  vendors: VendorRecord[] | string;
};

const dataMode = (import.meta.env.VITE_DATA_MODE ?? "mock") as DataMode;
const agentLookupsUrl = import.meta.env.VITE_AGENT_LOOKUPS_URL;
let cachedAgentLookups: AgentLookupResponse | undefined;

function asString(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function normalizeAgentMapping(record: Partial<AgentMappingRecord>) {
  const agentCompanyId = asString(record.AgentCompanyID ?? record.Title);
  const empAgentCompanyName = asString(
    record.EMPAgentCompanyName ?? record.AgentCompanyName ?? record.field_1,
  );
  const bcAgentName = asString(record.BCAgentName ?? record["BC Agent Name"] ?? record.field_2);
  const bcVendorCode = asString(record.BCVendorCode ?? record["BC Vendor Code"] ?? record.field_3);
  const otherRemarks = asString(record.OtherRemarks ?? record["Other Remarks"] ?? record.field_4);

  return {
    ...record,
    AgentCompanyID: agentCompanyId,
    AgentCompanyName: empAgentCompanyName,
    BCAgentName: bcAgentName,
    BCVendorCode: bcVendorCode,
    EMPAgentCompanyName: empAgentCompanyName,
    OtherRemarks: otherRemarks,
    Title: agentCompanyId,
    "BC Agent Name": bcAgentName,
    "BC Vendor Code": bcVendorCode,
    "Other Remarks": otherRemarks,
  } as AgentMappingRecord;
}

function normalizeVendor(record: Partial<VendorRecord>) {
  const navId = asString(record.NAVID ?? record["NAV ID"]);
  const vendorName = asString(record.VendorName ?? record["Vendor Name"]);

  return {
    ...record,
    ID: asString(record.ID) || navId || vendorName,
    NAVID: navId,
    VendorName: vendorName,
    "NAV ID": navId,
    "Vendor Name": vendorName,
  } as VendorRecord;
}

function parseLookupArray<T>(value: T[] | string, fieldName: string) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    throw new Error(`Agent lookup ${fieldName} must be an array or JSON string.`);
  }

  try {
    const parsedValue = JSON.parse(value);

    if (!Array.isArray(parsedValue)) {
      throw new Error(`Agent lookup ${fieldName} JSON did not contain an array.`);
    }

    return parsedValue as T[];
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown parse error.";

    throw new Error(`Agent lookup ${fieldName} JSON could not be parsed: ${reason}`);
  }
}

function normalizeAgentLookups(lookups: AgentLookupResponse) {
  return {
    agentTagging: lookups.agentTagging.map(normalizeAgentMapping),
    vendors: lookups.vendors.map(normalizeVendor),
  };
}

async function fetchAgentLookupsReal() {
  if (!agentLookupsUrl) {
    throw new Error("VITE_AGENT_LOOKUPS_URL is not configured.");
  }

  const response = await fetch(agentLookupsUrl, {
    body: JSON.stringify({}),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(
      `Agent lookup extraction failed with status ${response.status}: ${responseText}`,
    );
  }

  const lookups = await response.json();

  if (!lookups || !("agentTagging" in lookups) || !("vendors" in lookups)) {
    throw new Error("Agent lookup extraction returned an invalid response.");
  }

  const rawLookups = lookups as RawAgentLookupResponse;

  return normalizeAgentLookups({
    agentTagging: parseLookupArray<AgentMappingRecord>(rawLookups.agentTagging, "agentTagging"),
    vendors: parseLookupArray<VendorRecord>(rawLookups.vendors, "vendors"),
  });
}

export async function loadAgentLookups() {
  if (dataMode === "mock") {
    cachedAgentLookups = normalizeAgentLookups({
      agentTagging: getAgentTagging() as AgentMappingRecord[],
      vendors: getMockVendors() as VendorRecord[],
    });

    return cachedAgentLookups;
  }

  if (!cachedAgentLookups) {
    cachedAgentLookups = await fetchAgentLookupsReal();
  }

  return cachedAgentLookups;
}

export function getVendors() {
  if (dataMode === "real") {
    return cachedAgentLookups?.vendors ?? [];
  }

  return (getMockVendors() as VendorRecord[]).map(normalizeVendor);
}

export function getAgentMappings() {
  if (dataMode === "real") {
    return cachedAgentLookups?.agentTagging ?? [];
  }

  return (getAgentTagging() as AgentMappingRecord[]).map(normalizeAgentMapping);
}
