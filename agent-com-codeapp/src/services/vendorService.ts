import { getAgentTagging, getVendors as getMockVendors } from "./mockData";

export type VendorRecord = {
  ID: string;
  "NAV ID": string;
  "Vendor Name": string;
};

export type AgentMappingRecord = {
  Title: string;
  AgentCompanyName: string;
  "BC Agent Name": string;
  "BC Vendor Code": string;
  "Other Remarks": string;
};

export function getVendors() {
  return getMockVendors() as VendorRecord[];
}

export function getAgentMappings() {
  return getAgentTagging() as AgentMappingRecord[];
}
