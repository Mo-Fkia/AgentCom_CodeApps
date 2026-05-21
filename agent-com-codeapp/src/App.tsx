import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import logoUrl from "./assets/brand/lcb-australia-logo.png";
import studentUrl from "./assets/brand/lcb-australia-student.png";
import { extractAgentPayReady, getAgentPayFilterOptions } from "./services/agentPayService";
import {
  getCachedAgentLookups,
  loadAgentLookups,
  type AgentLookupResponse,
} from "./services/vendorService";
import {
  createDraftInvoices as createDraftInvoicesService,
  getInvoiceTracker,
  updateInvoiceStatus,
} from "./services/invoiceTrackerService";
import {
  baseAmount,
  commissionAmount,
  commissionRate,
  nonFee,
  totalPayment,
} from "./rules/commission";

const navigationGroups = [
  {
    label: "Generating Drafts",
    mainScreen: "Generate Drafts",
    pages: ["Generate Drafts", "Agent Mapping", "Invoice Review"],
  },
  {
    label: "Invoice Tracker",
    mainScreen: "Invoice Tracker",
    pages: ["Invoice Tracker", "Upload Invoice", "Send to BC"],
  },
];

const campuses = ["Adelaide", "Brisbane", "Melbourne", "Sydney"];

type DataTableProps = {
  columns: string[];
  rows: DataTableRow[];
};

type DataTableRow =
  | string[]
  | {
      AgentPayReadyID?: number | string;
      cells: string[];
      id?: number | string;
    };

type SectionHeaderProps = {
  title: string;
  eyebrow: string;
  action?: string;
  onAction?: () => void;
};

type SeenFilter = "All" | "Seen" | "Not Seen";

type AgentPayReadyRecord = {
  TermYear: number;
  TermNumber: number;
  CampusName: string;
  ProgramName: string;
  ProgramCode: string;
  ProgramStage?: string;
  CourseName?: string;
  StudentName: string;
  EmpID: number;
  StudentID?: number;
  AgentCompanyID: number;
  AgentCompanyName: string;
  OriginalAgentCompanyName?: string;
  PaymentAmountSubject: number;
  TotalPayment2: number;
  PaymentStatus: string;
  YT: string;
  Seen: boolean;
  AgentPayReadyID?: number;
};

type AgentTaggingRecord = {
  AgentCompanyID?: string;
  Title: string;
  AgentCompanyName: string;
  BCAgentName?: string;
  BCVendorCode?: string;
  EMPAgentCompanyName?: string;
  "BC Agent Name": string;
  "BC Vendor Code": string;
  "Other Remarks": string;
};

type VendorRecord = {
  ID: string;
  "NAV ID": string;
  NAVID?: string;
  "Vendor Name": string;
  VendorName?: string;
};

type AgentMappingRow = {
  agentCompanyId: string;
  originalAgentName: string;
  selectedNavId: string;
  selectedVendorName: string;
};

type GenerateDraftFilters = {
  campus: string;
  program: string;
  seen: SeenFilter;
  term: string;
  year: string;
};

type DraftStatus = "New" | "Sent" | "Uploaded" | "Completed";

type DraftInvoiceRecord = {
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

type InvoiceReviewDetailLine = {
  baseAmount: number;
  commissionAmount: number;
  course: string;
  nonFee: number;
  paymentAmount: number;
  studentId: string;
  studentName: string;
};

type InvoiceReviewSummary = {
  agentName: string;
  baseAmount: number;
  campus: string;
  commissionAmount: number;
  commissionRate: number;
  details: InvoiceReviewDetailLine[];
  key: string;
  navId: string;
  nonFee: number;
  program: string;
  totalPayment: number;
  yearTerm: string;
};

function StatusBadge({ children }: { children: string }) {
  const tone =
    children.includes("Approved") || children.includes("Ready") || children.includes("Matched")
      ? "status-badge status-badge--ready"
      : children.includes("Paid") || children.includes("Submitted")
        ? "status-badge status-badge--sent"
        : "status-badge status-badge--review";

  return <span className={tone}>{children}</span>;
}

function DataTable({ columns, rows }: DataTableProps) {
  const getRowCells = (row: DataTableRow) => (Array.isArray(row) ? row : row.cells);
  const getRowKey = (row: DataTableRow, index: number) => {
    if (Array.isArray(row)) {
      return `${index}`;
    }

    return String(row.AgentPayReadyID ?? row.id ?? index);
  };

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const cells = getRowCells(row);

            return (
              <tr key={getRowKey(row, rowIndex)}>
                {cells.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} title={cell}>
                    {cellIndex === cells.length - 1 ? <StatusBadge>{cell}</StatusBadge> : cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeader({ title, eyebrow, action, onAction }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action ? (
        <button className="secondary-button" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

function HomeScreen({ setActiveScreen }: { setActiveScreen: (screen: string) => void }) {
  return (
    <div className="screen-stack">
      <section className="brand-panel">
        <div className="brand-panel__content">
          <img
            src={logoUrl}
            alt="Le Cordon Bleu Australia"
            className="brand-logo brand-logo--large"
          />
          <p className="eyebrow">Finance team</p>
          <h2>Agent Commission Workbench</h2>
          <p className="brand-copy">
            Mock layout for reviewing agent commission drafts, mapping vendors, tracking invoice
            status, and preparing approved items for Business Central.
          </p>
          <div className="campus-list">
            {campuses.map((campus) => (
              <span key={campus}>{campus}</span>
            ))}
          </div>
        </div>
        <div className="brand-panel__image">
          <img src={studentUrl} alt="Le Cordon Bleu Australia student" />
        </div>
      </section>

      <SectionHeader title="Process Areas" eyebrow="Home" />
      <div className="process-grid">
        <section className="process-card">
          <div>
            <p className="eyebrow">Workflow</p>
            <h3>Generating Drafts</h3>
            <p>
              Extract SQL data, map agents, review invoice drafts, then generate draft invoices.
            </p>
          </div>
          <ol>
            <li>Generate Drafts</li>
            <li>Agent Mapping</li>
            <li>Invoice Review</li>
          </ol>
          <button className="secondary-button" onClick={() => setActiveScreen("Generate Drafts")}>
            Open Generate Drafts
          </button>
        </section>
        <section className="process-card">
          <div>
            <p className="eyebrow">Workflow</p>
            <h3>Invoice Tracker</h3>
            <p>
              Track generated drafts, upload official invoices, and send approved invoices to
              Business Central.
            </p>
          </div>
          <ol>
            <li>Invoice Tracker</li>
            <li>Upload Invoice</li>
            <li>Send to BC</li>
          </ol>
          <button className="secondary-button" onClick={() => setActiveScreen("Invoice Tracker")}>
            Open Invoice Tracker
          </button>
        </section>
      </div>
    </div>
  );
}

function uniqueOptions<T>(rows: T[] | unknown, getValue: (row: T) => string | number) {
  const safeRows = Array.isArray(rows) ? (rows as T[]) : [];

  return Array.from(new Set(safeRows.map((row) => String(getValue(row))).filter(Boolean)));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    currency: "AUD",
    style: "currency",
  }).format(amount);
}

function getYearTerm(record: AgentPayReadyRecord) {
  return record.YT || `${record.TermYear}${record.TermNumber}`;
}

function isMappedAgent(mapping: AgentMappingRow) {
  return Boolean(mapping.selectedNavId && mapping.selectedVendorName);
}

function nextDraftStatus(status: DraftStatus) {
  const statuses: DraftStatus[] = ["New", "Sent", "Uploaded", "Completed"];
  const currentIndex = statuses.indexOf(status);

  return statuses[Math.min(currentIndex + 1, statuses.length - 1)];
}

function createInitialTrackerRecords() {
  return getInvoiceTracker() as DraftInvoiceRecord[];
}

function GenerateDraftsScreen({
  extractionFilters,
  extractedRecords,
  hasExtracted,
  onExtractData,
}: {
  extractionFilters: GenerateDraftFilters | undefined;
  extractedRecords: AgentPayReadyRecord[];
  hasExtracted: boolean;
  onExtractData: (records: AgentPayReadyRecord[], filters: GenerateDraftFilters) => Promise<void>;
}) {
  const [yearFilter, setYearFilter] = useState("All");
  const [termFilter, setTermFilter] = useState("All");
  const [campusFilter, setCampusFilter] = useState("All");
  const [programFilter, setProgramFilter] = useState("All");
  const [seenFilter, setSeenFilter] = useState<SeenFilter>("All");
  const [extractError, setExtractError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const filterOptions = getAgentPayFilterOptions();
  const extractedTermOptions = extractedRecords.map((record) => `T${record.TermNumber}`);

  const yearOptions = uniqueOptions<string>(
    [...filterOptions.years, ...extractedRecords.map((record) => String(record.TermYear))],
    (option) => option,
  );
  const termOptions = uniqueOptions<string>(
    [...filterOptions.terms, ...extractedTermOptions],
    (option) => option,
  );
  const campusOptions = uniqueOptions<string>(
    [...filterOptions.campuses, ...extractedRecords.map((record) => record.CampusName)],
    (option) => option,
  );
  const programOptions = uniqueOptions<string>(
    [...filterOptions.programs, ...extractedRecords.map((record) => record.ProgramName)],
    (option) => option,
  );

  const handleExtractData = async () => {
    setExtractError("");
    setIsExtracting(true);

    try {
      const filters = {
        campus: campusFilter,
        program: programFilter,
        seen: seenFilter,
        term: termFilter,
        year: yearFilter,
      };
      const rows = await extractAgentPayReady(filters);

      if (!Array.isArray(rows)) {
        throw new Error("Agent pay extraction returned an invalid response.");
      }

      await onExtractData(rows, filters);
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : "Agent pay extraction failed.");
    } finally {
      setIsExtracting(false);
    }
  };

  const distinctAgentCount = new Set(
    extractedRecords.map((record) => record.AgentCompanyID || record.AgentCompanyName),
  ).size;

  const generatedFromFilters = extractionFilters ?? {
    campus: campusFilter,
    program: programFilter,
    seen: seenFilter,
    term: termFilter,
    year: yearFilter,
  };
  const statusChipSummary = [
    ["Year", generatedFromFilters.year],
    ["Term", generatedFromFilters.term],
    ["Campus", generatedFromFilters.campus],
    ["Seen", generatedFromFilters.seen],
  ];
  const previewRows = Array.from(
    extractedRecords
      .reduce((groupedRows, record) => {
        const studentId = String(record.StudentID ?? record.EmpID);
        const studentName = record.StudentName.trim() || "-";
        const agentId = String(record.AgentCompanyID);
        const agentName = record.OriginalAgentCompanyName || record.AgentCompanyName;
        const yearTerm = getYearTerm(record);
        const groupKey = [
          studentId,
          studentName,
          agentId,
          agentName,
          yearTerm,
          record.CampusName,
          record.ProgramName,
        ].join("|");
        const existingRow = groupedRows.get(groupKey);

        if (existingRow) {
          existingRow.amount += Number(record.PaymentAmountSubject) || 0;
          existingRow.seen = existingRow.seen || record.Seen;
          return groupedRows;
        }

        groupedRows.set(groupKey, {
          agentId,
          agentName,
          amount: Number(record.PaymentAmountSubject) || 0,
          campus: record.CampusName,
          program: record.ProgramName,
          seen: record.Seen,
          studentId,
          studentName,
          yearTerm,
        });

        return groupedRows;
      }, new Map<string, {
        agentId: string;
        agentName: string;
        amount: number;
        campus: string;
        program: string;
        seen: boolean;
        studentId: string;
        studentName: string;
        yearTerm: string;
      }>())
      .values(),
  ).map((row, index) => ({
    cells: [
      row.studentId,
      row.studentName,
      row.agentId,
      row.agentName,
      row.yearTerm,
      row.campus,
      row.program,
      formatCurrency(row.amount),
      row.seen ? "Seen" : "Not Seen",
    ],
    id: index,
  }));

  return (
    <div className="screen-stack">
      <SectionHeader title="Generate Drafts" eyebrow="Draft generation" />
      <div className="generate-panel-grid">
        <aside className="side-panel generate-filters">
          <h3>Filters</h3>
          <div className="filter-grid">
            <label>
              Year
              <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                <option>All</option>
                {yearOptions.map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </label>
            <label>
              Term
              <select value={termFilter} onChange={(event) => setTermFilter(event.target.value)}>
                <option>All</option>
                {termOptions.map((term) => (
                  <option key={term}>{term}</option>
                ))}
              </select>
            </label>
            <label>
              Campus
              <select value={campusFilter} onChange={(event) => setCampusFilter(event.target.value)}>
                <option>All</option>
                {campusOptions.map((campus) => (
                  <option key={campus}>{campus}</option>
                ))}
              </select>
            </label>
            <label>
              Seen status
              <select
                value={seenFilter}
                onChange={(event) => setSeenFilter(event.target.value as SeenFilter)}
              >
                <option>All</option>
                <option>Seen</option>
                <option>Not Seen</option>
              </select>
            </label>
            <label className="filter-grid__wide">
              Program
              <select
                value={programFilter}
                onChange={(event) => setProgramFilter(event.target.value)}
              >
                {programOptions.map((program) => (
                  <option key={program}>{program}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="secondary-button side-panel-button"
            disabled={isExtracting}
            onClick={handleExtractData}
          >
            {isExtracting ? "Extracting..." : "Extract Data"}
          </button>
          {extractError ? <div className="error-message">{extractError}</div> : null}
        </aside>
        <div className="draft-guidance-panel">
          <p className="eyebrow">Status</p>
          <h3>{hasExtracted ? "Ready for review" : "No data extracted yet"}</h3>
          <p>
            {hasExtracted
              ? "Generated from these filters. Review the extracted records below, then continue to Agent Mapping."
              : "Choose the filters for the term, campus, program, and seen status, then extract data."}
          </p>
          <dl className="filter-summary">
            {statusChipSummary.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd title={value}>{value}</dd>
              </div>
            ))}
            <div className="filter-summary__program">
              <dt>Program</dt>
              <dd title={generatedFromFilters.program}>{generatedFromFilters.program}</dd>
            </div>
          </dl>
        </div>
      </div>
      {hasExtracted ? (
        <>
          <div className="draft-summary-grid">
            <div className="stat-card">
              <p>Total filtered records</p>
              <strong>{extractedRecords.length}</strong>
            </div>
            <div className="stat-card">
              <p>Distinct agent count</p>
              <strong>{distinctAgentCount}</strong>
            </div>
          </div>
          <div className="preview-table-scroll">
            <DataTable
              columns={[
                "Student ID",
                "Student Name",
                "Agent ID",
                "Agent Name",
                "YearTerm",
                "Campus",
                "Program",
                "Amount",
                "Seen",
              ]}
              rows={previewRows}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function AgentMappingScreen({
  agentMappings,
  isLookupLoading,
  lookupError,
  onContinue,
  onRefreshLookups,
  onUpdateVendor,
  vendors,
}: {
  agentMappings: AgentMappingRow[];
  isLookupLoading: boolean;
  lookupError: string;
  onContinue: () => void;
  onRefreshLookups: () => void;
  onUpdateVendor: (agentCompanyId: string, selectedNavId: string, selectedVendorName: string) => void;
  vendors: VendorRecord[];
}) {
  const [mappingFilter, setMappingFilter] = useState("All");
  const [vendorSearchByAgentId, setVendorSearchByAgentId] = useState<Record<string, string>>({});
  const [activeVendorAgentId, setActiveVendorAgentId] = useState("");
  const vendorOptions = useMemo(
    () =>
      vendors
        .filter((vendor) => (vendor.NAVID || vendor["NAV ID"]) && (vendor.VendorName || vendor["Vendor Name"]))
        .sort((a, b) =>
          (a.VendorName || a["Vendor Name"]).localeCompare(b.VendorName || b["Vendor Name"]),
        ),
    [vendors],
  );
  const getIsMatched = (mapping: AgentMappingRow) =>
    Boolean(mapping.selectedVendorName && mapping.selectedNavId);
  const allAgentsMapped = useMemo(
    () => agentMappings.length > 0 && agentMappings.every(getIsMatched),
    [agentMappings],
  );
  const matchedAgentCount = useMemo(
    () => agentMappings.filter(getIsMatched).length,
    [agentMappings],
  );
  const visibleAgentMappings = useMemo(
    () =>
      agentMappings.filter((mapping) => {
        const isMatched = getIsMatched(mapping);

        return (
          mappingFilter === "All" ||
          (mappingFilter === "Matched" && isMatched) ||
          (mappingFilter === "Unmatched" && !isMatched)
        );
      }),
    [agentMappings, mappingFilter],
  );
  const vendorsByName = useMemo(
    () =>
      new Map(
        vendorOptions.map((vendor) => [
          (vendor.VendorName || vendor["Vendor Name"]).trim().toLowerCase(),
          vendor,
        ]),
      ),
    [vendorOptions],
  );
  const updateVendorSearch = (agentCompanyId: string, value: string) => {
    setVendorSearchByAgentId((currentSearch) => ({
      ...currentSearch,
      [agentCompanyId]: value,
    }));
  };
  const getVendorName = (vendor: VendorRecord) => vendor.VendorName || vendor["Vendor Name"];
  const getVendorNavId = (vendor: VendorRecord) => vendor.NAVID || vendor["NAV ID"];
  const getComboboxVendors = (agentCompanyId: string) => {
    const searchValue = (vendorSearchByAgentId[agentCompanyId] ?? "").trim().toLowerCase();

    if (!searchValue) {
      return vendorOptions;
    }

    return vendorOptions.filter((vendor) => getVendorName(vendor).toLowerCase().includes(searchValue));
  };
  const selectVendorByName = (mapping: AgentMappingRow, selectedVendorName: string) => {
    const vendorName = selectedVendorName.trim();
    updateVendorSearch(mapping.agentCompanyId, selectedVendorName);

    if (!vendorName) {
      onUpdateVendor(mapping.agentCompanyId, "", "");
      return;
    }

    const selectedVendor = vendorsByName.get(vendorName.toLowerCase());

    if (!selectedVendor) {
      return;
    }

    onUpdateVendor(
      mapping.agentCompanyId,
      getVendorNavId(selectedVendor),
      getVendorName(selectedVendor),
    );
    setActiveVendorAgentId("");
  };

  if (isLookupLoading) {
    return (
      <div className="screen-stack">
        <SectionHeader title="Agent Mapping" eyebrow="Agent setup" />
        <div className="mapping-toolbar">
          <div>
            <p>Agents to map</p>
            <strong>{agentMappings.length}</strong>
          </div>
          <div>
            <p>Mapped agents</p>
            <strong>{matchedAgentCount}</strong>
          </div>
          <button className="secondary-button" disabled>
            Refreshing...
          </button>
          <button className="secondary-button" disabled>
            Continue
          </button>
        </div>
        <div className="empty-state">
          Vendor and agent mapping data is still loading. Please wait...
        </div>
      </div>
    );
  }

  return (
    <div className="screen-stack">
      <SectionHeader title="Agent Mapping" eyebrow="Agent setup" />
      <div className="mapping-toolbar">
        <div className="mapping-metric">
          <p>Agents to map</p>
          <strong>{agentMappings.length}</strong>
        </div>
        <div className="mapping-metric">
          <p>Mapped agents</p>
          <strong>{matchedAgentCount}</strong>
        </div>
        <label className="mapping-filter">
          Mapping filter
          <select value={mappingFilter} onChange={(event) => setMappingFilter(event.target.value)}>
            <option>All</option>
            <option>Matched</option>
            <option>Unmatched</option>
          </select>
        </label>
        <div className="mapping-actions">
          <button className="secondary-button" disabled={isLookupLoading} onClick={onRefreshLookups}>
            {isLookupLoading ? "Refreshing..." : "Refresh lookups"}
          </button>
          <button className="secondary-button" disabled={!allAgentsMapped} onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
      {lookupError ? <div className="error-message">{lookupError}</div> : null}
      {visibleAgentMappings.length > 0 ? (
        <div className="mapping-list" aria-label="Agent mappings">
          {visibleAgentMappings.map((mapping) => {
            const isMapped = getIsMatched(mapping);
            const searchValue =
              vendorSearchByAgentId[mapping.agentCompanyId] ?? mapping.selectedVendorName;
            const comboboxVendors = getComboboxVendors(mapping.agentCompanyId);

            return (
              <div
                key={mapping.agentCompanyId}
                className={`mapping-row ${isMapped ? "mapping-row--matched" : "mapping-row--unmatched"}`}
              >
                <div className="mapping-row__main">
                  <span className="mapping-row__id">{mapping.agentCompanyId}</span>
                  <strong>{mapping.originalAgentName}</strong>
                  <StatusBadge>{isMapped ? "Matched" : "Needs mapping"}</StatusBadge>
                </div>
                <div className="mapping-row__detail">
                  <div className="vendor-combobox">
                    <input
                      aria-label={`Search vendor for ${mapping.originalAgentName}`}
                      placeholder="Search vendor name"
                      value={searchValue}
                      onBlur={() => {
                        window.setTimeout(() => setActiveVendorAgentId(""), 150);
                      }}
                      onChange={(event) => selectVendorByName(mapping, event.target.value)}
                      onFocus={() => setActiveVendorAgentId(mapping.agentCompanyId)}
                    />
                    {activeVendorAgentId === mapping.agentCompanyId ? (
                      <div className="vendor-combobox__options">
                        {comboboxVendors.map((vendor) => (
                          <button
                            key={`${vendor.ID}-${getVendorNavId(vendor)}`}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              selectVendorByName(mapping, getVendorName(vendor));
                            }}
                          >
                            {getVendorName(vendor)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="mapping-row__navid">
                    <span>NAVID / vendor code</span>
                    <strong>{mapping.selectedNavId || "-"}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">No agents match the selected mapping filter.</div>
      )}
    </div>
  );
}

function InvoiceReviewScreen({
  agentMappings,
  extractedRecords,
  onGenerateDrafts,
}: {
  agentMappings: AgentMappingRow[];
  extractedRecords: AgentPayReadyRecord[];
  onGenerateDrafts: (drafts: InvoiceReviewSummary[]) => void;
}) {
  const mappingByAgentId = new Map(
    agentMappings.map((mapping) => [mapping.agentCompanyId, mapping]),
  );
  const invoiceReviewRows = Array.from(
    extractedRecords
      .reduce((groups, record) => {
        const mapping = mappingByAgentId.get(String(record.AgentCompanyID));
        const agentName = mapping?.selectedVendorName || record.AgentCompanyName;
        const navId = mapping?.selectedNavId ?? "";
        const yearTerm = getYearTerm(record);
        const groupKey = [agentName, navId, record.ProgramName, record.CampusName, yearTerm].join("|");
        const commissionRecord = {
          ...record,
          AgentCompanyName: agentName,
        };
        const recordTotalPayment = totalPayment(commissionRecord);
        const recordNonFee = nonFee(commissionRecord);
        const recordBaseAmount = baseAmount(commissionRecord);
        const recordCommissionAmount = commissionAmount(commissionRecord);
        const detailLine = {
          baseAmount: recordBaseAmount,
          commissionAmount: recordCommissionAmount,
          course: record.CourseName || record.ProgramStage || "-",
          nonFee: recordNonFee,
          paymentAmount: recordTotalPayment,
          studentId: String(record.StudentID ?? record.EmpID),
          studentName: record.StudentName.trim() || "-",
        };
        const existingGroup = groups.get(groupKey);

        if (existingGroup) {
          existingGroup.totalPayment += recordTotalPayment;
          existingGroup.nonFee += recordNonFee;
          existingGroup.baseAmount = existingGroup.totalPayment - existingGroup.nonFee;
          existingGroup.commissionAmount += recordCommissionAmount;
          existingGroup.details.push(detailLine);
          return groups;
        }

        groups.set(groupKey, {
          agentName,
          baseAmount: recordTotalPayment - recordNonFee,
          campus: record.CampusName,
          commissionAmount: recordCommissionAmount,
          commissionRate: commissionRate(commissionRecord),
          details: [detailLine],
          key: groupKey,
          navId,
          nonFee: recordNonFee,
          program: record.ProgramName,
          totalPayment: recordTotalPayment,
          yearTerm,
        });

        return groups;
      }, new Map<string, InvoiceReviewSummary>())
      .values(),
  );
  const [selectedInvoiceKey, setSelectedInvoiceKey] = useState(invoiceReviewRows[0]?.key ?? "");
  const selectedInvoice =
    invoiceReviewRows.find((row) => row.key === selectedInvoiceKey) ?? invoiceReviewRows[0];

  return (
    <div className="screen-stack">
      <SectionHeader
        title="Invoice Review"
        eyebrow="Approval queue"
        action="Generate Drafts"
        onAction={() => onGenerateDrafts(invoiceReviewRows)}
      />
      <div className="table-shell invoice-summary-table">
        <table>
          <thead>
            <tr>
              <th>Agent</th>
              <th>NAVID</th>
              <th>Program</th>
              <th>Campus</th>
              <th>YearTerm</th>
              <th>Total Payment</th>
              <th>Non Fee</th>
              <th>Base Amount</th>
              <th>Commission Rate</th>
              <th>Commission Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceReviewRows.map((row) => (
              <tr
                key={row.key}
                className={selectedInvoice?.key === row.key ? "selected-row" : ""}
                onClick={() => setSelectedInvoiceKey(row.key)}
              >
                <td title={row.agentName}>{row.agentName}</td>
                <td>{row.navId}</td>
                <td title={row.program}>{row.program}</td>
                <td>{row.campus}</td>
                <td>{row.yearTerm}</td>
                <td>{formatCurrency(row.totalPayment)}</td>
                <td>{formatCurrency(row.nonFee)}</td>
                <td>{formatCurrency(row.baseAmount)}</td>
                <td>{`${row.commissionRate}%`}</td>
                <td>{formatCurrency(row.commissionAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedInvoice ? (
        <section className="invoice-detail-panel">
          <div className="invoice-detail-header">
            <div>
              <p className="eyebrow">Draft invoice detail</p>
              <h3>{selectedInvoice.agentName}</h3>
            </div>
            <dl>
              <div>
                <dt>NAVID</dt>
                <dd>{selectedInvoice.navId}</dd>
              </div>
              <div>
                <dt>Program</dt>
                <dd title={selectedInvoice.program}>{selectedInvoice.program}</dd>
              </div>
              <div>
                <dt>Campus</dt>
                <dd>{selectedInvoice.campus}</dd>
              </div>
              <div>
                <dt>YearTerm</dt>
                <dd>{selectedInvoice.yearTerm}</dd>
              </div>
            </dl>
          </div>
          <div className="invoice-total-grid">
            <div className="stat-card">
              <p>Total Payment</p>
              <strong>{formatCurrency(selectedInvoice.totalPayment)}</strong>
            </div>
            <div className="stat-card">
              <p>Non Fee</p>
              <strong>{formatCurrency(selectedInvoice.nonFee)}</strong>
            </div>
            <div className="stat-card">
              <p>Base Amount</p>
              <strong>{formatCurrency(selectedInvoice.baseAmount)}</strong>
            </div>
            <div className="stat-card">
              <p>Commission Amount</p>
              <strong>{formatCurrency(selectedInvoice.commissionAmount)}</strong>
            </div>
          </div>
          <div className="table-shell invoice-detail-table">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Course / Program Stage</th>
                  <th>Payment Amount</th>
                  <th>Non Fee</th>
                  <th>Base Amount</th>
                  <th>Commission Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.details.map((detail, index) => (
                  <tr key={`${detail.studentId}-${detail.course}-${index}`}>
                    <td>{detail.studentId}</td>
                    <td title={detail.studentName}>{detail.studentName}</td>
                    <td title={detail.course}>{detail.course}</td>
                    <td>{formatCurrency(detail.paymentAmount)}</td>
                    <td>{formatCurrency(detail.nonFee)}</td>
                    <td>{formatCurrency(detail.baseAmount)}</td>
                    <td>{formatCurrency(detail.commissionAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function InvoiceTrackerScreen({
  trackerRecords,
  successMessage,
  onAdvanceStatus,
}: {
  trackerRecords: DraftInvoiceRecord[];
  successMessage: string;
  onAdvanceStatus: (draftName: string) => void;
}) {
  return (
    <div className="screen-stack">
      <SectionHeader title="Invoice Tracker" eyebrow="Progress" action="Export list" />
      {successMessage ? <div className="success-message">{successMessage}</div> : null}
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Draft</th>
              <th>Agent Name</th>
              <th>Agent Code</th>
              <th>YearTerm</th>
              <th>Campus</th>
              <th>Total Commission</th>
              <th>Created Date</th>
              <th>Draft Link</th>
              <th>Status</th>
              <th>Next</th>
            </tr>
          </thead>
          <tbody>
            {trackerRecords.map((draft) => (
              <tr key={draft.DraftNm}>
                <td>{draft.DraftNm}</td>
                <td>{draft.AgentName}</td>
                <td>{draft.AgentCode}</td>
                <td>{draft.YearTerm}</td>
                <td>{draft.Campus}</td>
                <td>{formatCurrency(draft.TotalCommission)}</td>
                <td>{draft.CreatedDate}</td>
                <td>{draft.DraftInvoiceLink}</td>
                <td>
                  <StatusBadge>{draft.CurrentStatus}</StatusBadge>
                </td>
                <td>
                  <button
                    className="secondary-button table-action"
                    disabled={draft.CurrentStatus === "Completed"}
                    onClick={() => onAdvanceStatus(draft.DraftNm)}
                  >
                    Advance
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UploadInvoiceScreen() {
  return (
    <div className="screen-stack">
      <SectionHeader title="Upload Invoice" eyebrow="Invoice intake" action="Upload mock invoice" />
      <div className="split-grid split-grid--upload">
        <div className="upload-panel">
          <img
            src={logoUrl}
            alt="Le Cordon Bleu Australia"
            className="brand-logo"
          />
          <h3>Drop invoice file here</h3>
          <p>Mock upload area only</p>
        </div>
        <aside className="side-panel">
          <h3>Extracted details</h3>
          <dl>
            <div>
              <dt>Agent</dt>
              <dd>Sydney Education Partners</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>$18,450</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge>Ready</StatusBadge>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function SendToBcScreen() {
  return (
    <div className="screen-stack">
      <SectionHeader title="Send to BC" eyebrow="Business Central handoff" action="Send selected" />
      <DataTable
        columns={["Invoice", "Agent", "Amount", "BC status"]}
        rows={[
          ["INV-2407", "Sydney Education Partners", "$18,450", "Ready"],
          ["INV-2409", "Global Pathways", "$27,880", "Ready"],
          ["INV-2410", "Jakarta Placement Co", "$6,430", "Needs check"],
        ]}
      />
    </div>
  );
}

function buildAgentMappingsFromLookups(
  records: AgentPayReadyRecord[],
  lookups: AgentLookupResponse | undefined,
) {
  const agentTagging = (lookups?.agentTagging ?? []) as AgentTaggingRecord[];
  const vendors = (lookups?.vendors ?? []) as VendorRecord[];
  const taggingByAgentId = new Map(agentTagging.map((record) => [record.Title, record]));
  const validVendorCodes = new Set(
    vendors
      .filter((vendor) => vendor["NAV ID"] && vendor["Vendor Name"])
      .map((vendor) => vendor["NAV ID"]),
  );
  const vendorByName = new Map(
    vendors
      .filter((vendor) => vendor["NAV ID"] && vendor["Vendor Name"])
      .map((vendor) => [vendor["Vendor Name"].trim().toLowerCase(), vendor]),
  );

  return Array.from(
    new Map(
      records.map((record) => {
        const agentCompanyId = String(record.AgentCompanyID);
        const tagging = taggingByAgentId.get(agentCompanyId);
        const mappedNavId = tagging?.["BC Vendor Code"] ?? "";
        const mappedVendorName = tagging?.["BC Agent Name"] ?? "";
        const vendorByMappedName = vendorByName.get(mappedVendorName.trim().toLowerCase());
        const selectedNavId = validVendorCodes.has(mappedNavId)
          ? mappedNavId
          : vendorByMappedName?.["NAV ID"] ?? "";
        const selectedVendor = vendors.find((vendor) => vendor["NAV ID"] === selectedNavId);

        return [
          agentCompanyId,
          {
            agentCompanyId,
            originalAgentName: record.OriginalAgentCompanyName || record.AgentCompanyName,
            selectedNavId: validVendorCodes.has(selectedNavId) ? selectedNavId : "",
            selectedVendorName:
              validVendorCodes.has(selectedNavId) && selectedVendor
                ? selectedVendor["Vendor Name"]
                : "",
          },
        ];
      }),
    ).values(),
  );
}

function ActiveScreen({
  agentMappings,
  activeScreen,
  extractionFilters,
  extractedRecords,
  hasExtracted,
  isLookupLoading,
  isMappingComplete,
  lookupError,
  onAdvanceStatus,
  onContinueMapping,
  onExtractData,
  onGenerateDrafts,
  onRefreshLookups,
  onUpdateVendor,
  setActiveScreen,
  successMessage,
  trackerRecords,
  vendors,
}: {
  agentMappings: AgentMappingRow[];
  activeScreen: string;
  extractionFilters: GenerateDraftFilters | undefined;
  extractedRecords: AgentPayReadyRecord[];
  hasExtracted: boolean;
  isLookupLoading: boolean;
  isMappingComplete: boolean;
  lookupError: string;
  onAdvanceStatus: (draftName: string) => void;
  onContinueMapping: () => void;
  onExtractData: (records: AgentPayReadyRecord[], filters: GenerateDraftFilters) => Promise<void>;
  onGenerateDrafts: (drafts: InvoiceReviewSummary[]) => void;
  onRefreshLookups: () => void;
  onUpdateVendor: (
    agentCompanyId: string,
    selectedNavId: string,
    selectedVendorName: string,
  ) => void;
  setActiveScreen: (screen: string) => void;
  successMessage: string;
  trackerRecords: DraftInvoiceRecord[];
  vendors: VendorRecord[];
}) {
  if (activeScreen === "Home") return <HomeScreen setActiveScreen={setActiveScreen} />;
  if (activeScreen === "Generate Drafts") {
    return (
      <GenerateDraftsScreen
        extractionFilters={extractionFilters}
        extractedRecords={extractedRecords}
        hasExtracted={hasExtracted}
        onExtractData={onExtractData}
      />
    );
  }
  if (activeScreen === "Agent Mapping") {
    if (!hasExtracted) return <div className="empty-state">Extract data before mapping agents.</div>;

    return (
      <AgentMappingScreen
        agentMappings={agentMappings}
        isLookupLoading={isLookupLoading}
        lookupError={lookupError}
        onContinue={onContinueMapping}
        onRefreshLookups={onRefreshLookups}
        onUpdateVendor={onUpdateVendor}
        vendors={vendors}
      />
    );
  }
  if (activeScreen === "Invoice Review") {
    if (!isMappingComplete) {
      return <div className="empty-state">Complete agent mapping before invoice review.</div>;
    }

    return (
      <InvoiceReviewScreen
        agentMappings={agentMappings}
        extractedRecords={extractedRecords}
        onGenerateDrafts={onGenerateDrafts}
      />
    );
  }
  if (activeScreen === "Invoice Tracker") {
    return (
      <InvoiceTrackerScreen
        onAdvanceStatus={onAdvanceStatus}
        successMessage={successMessage}
        trackerRecords={trackerRecords}
      />
    );
  }
  if (activeScreen === "Upload Invoice") return <UploadInvoiceScreen />;
  return <SendToBcScreen />;
}

function App() {
  const [activeScreen, setActiveScreen] = useState("Home");
  const [extractedRecords, setExtractedRecords] = useState<AgentPayReadyRecord[]>([]);
  const [extractionFilters, setExtractionFilters] = useState<GenerateDraftFilters>();
  const [agentMappings, setAgentMappings] = useState<AgentMappingRow[]>([]);
  const [trackerRecords, setTrackerRecords] = useState<DraftInvoiceRecord[]>(createInitialTrackerRecords);
  const [lookupData, setLookupData] = useState<AgentLookupResponse | undefined>(() =>
    getCachedAgentLookups(),
  );
  const [isLookupLoading, setIsLookupLoading] = useState(() => !getCachedAgentLookups());
  const [lookupError, setLookupError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const extractedRecordsRef = useRef<AgentPayReadyRecord[]>([]);
  const hasExtracted = extractedRecords.length > 0;
  const isMappingComplete =
    hasExtracted && agentMappings.length > 0 && agentMappings.every(isMappedAgent);

  useEffect(() => {
    let isMounted = true;
    const cachedLookups = getCachedAgentLookups();

    async function loadStartupLookups() {
      try {
        const lookups = await loadAgentLookups({ forceRefresh: Boolean(cachedLookups) });

        if (isMounted) {
          setLookupData(lookups);
          if (extractedRecordsRef.current.length > 0) {
            setAgentMappings(buildAgentMappingsFromLookups(extractedRecordsRef.current, lookups));
          }
          setLookupError("");
        }
      } catch (error) {
        if (isMounted) {
          setLookupError(error instanceof Error ? error.message : "Vendor lookup loading failed.");
        }
      } finally {
        if (isMounted) {
          setIsLookupLoading(false);
        }
      }
    }

    void loadStartupLookups();

    return () => {
      isMounted = false;
    };
  }, []);

  const navigateToScreen = (screen: string) => {
    if (screen === "Agent Mapping" && !hasExtracted) {
      setActiveScreen("Generate Drafts");
      return;
    }

    if (screen === "Invoice Review" && !isMappingComplete) {
      setActiveScreen(hasExtracted ? "Agent Mapping" : "Generate Drafts");
      return;
    }

    setActiveScreen(screen);
  };

  const refreshLookups = async ({ background = false } = {}) => {
    if (!background) {
      setIsLookupLoading(true);
    }

    setLookupError("");

    try {
      const lookups = await loadAgentLookups({ forceRefresh: true });
      setLookupData(lookups);

      if (extractedRecords.length > 0) {
        setAgentMappings(buildAgentMappingsFromLookups(extractedRecords, lookups));
      }
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "Vendor lookup loading failed.");
    } finally {
      setIsLookupLoading(false);
    }
  };

  const extractData = async (records: AgentPayReadyRecord[], filters: GenerateDraftFilters) => {
    extractedRecordsRef.current = records;
    setExtractedRecords(records);
    setExtractionFilters(filters);
    setAgentMappings(buildAgentMappingsFromLookups(records, lookupData));
    setSuccessMessage("");
  };

  const updateVendor = (
    agentCompanyId: string,
    selectedNavId: string,
    selectedVendorName: string,
  ) => {
    setAgentMappings((currentMappings) =>
      currentMappings.map((mapping) =>
        mapping.agentCompanyId === agentCompanyId
          ? { ...mapping, selectedNavId, selectedVendorName }
          : mapping,
      ),
    );
  };

  const generateDraftInvoices = (drafts: InvoiceReviewSummary[]) => {
    const createdDate = new Date().toISOString().slice(0, 10);
    const draftInvoices = drafts.map((draft) => {
      const draftKey = [draft.yearTerm, draft.navId, draft.campus, draft.program]
        .join("-")
        .replace(/[^a-z0-9-]+/gi, "-")
        .replace(/-+/g, "-");

      return {
        DraftInvoiceLink: "#",
        DraftNm: `DRFT-${draftKey}`,
        AgentCode: draft.navId,
        AgentName: draft.agentName,
        Campus: draft.campus,
        CreatedDate: createdDate,
        CurrentStatus: "New",
        TotalCommission: draft.commissionAmount,
        YearTerm: draft.yearTerm,
      } as DraftInvoiceRecord;
    });

    const nextDraftInvoices = createDraftInvoicesService(draftInvoices);
    setTrackerRecords(getInvoiceTracker() as DraftInvoiceRecord[]);
    setSuccessMessage(`${nextDraftInvoices.length} draft invoice records created.`);
    setActiveScreen("Invoice Tracker");
  };

  const advanceStatus = (draftName: string) => {
    const currentRecord = trackerRecords.find((record) => record.DraftNm === draftName);

    if (!currentRecord) {
      return;
    }

    updateInvoiceStatus(draftName, nextDraftStatus(currentRecord.CurrentStatus));
    setTrackerRecords(getInvoiceTracker() as DraftInvoiceRecord[]);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <img src={logoUrl} alt="Le Cordon Bleu Australia" />
          <p>Finance team</p>
          <h1>Agent Commission</h1>
        </div>
        <nav className="sidebar__nav" aria-label="Agent Commission screens">
          <button
            className={activeScreen === "Home" ? "active" : ""}
            onClick={() => navigateToScreen("Home")}
          >
            Home
          </button>
          {navigationGroups.map((group) => (
            <div key={group.label} className="sidebar__group">
              <button
                className={`sidebar__group-heading ${
                  activeScreen === group.mainScreen ? "active" : ""
                }`}
                onClick={() => navigateToScreen(group.mainScreen)}
              >
                {group.label}
              </button>
              {group.pages.map((screen, index) => (
                <button
                  key={screen}
                  disabled={
                    (screen === "Agent Mapping" && !hasExtracted) ||
                    (screen === "Invoice Review" && !isMappingComplete)
                  }
                  className={`${activeScreen === screen ? "active" : ""} ${
                    index > 0 ? "sidebar__subpage" : ""
                  }`}
                  onClick={() => navigateToScreen(screen)}
                >
                  {screen}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>Le Cordon Bleu Australia Finance</p>
            <strong>{activeScreen}</strong>
          </div>
          <span>No external connections</span>
        </header>
        <div className="workspace__content">
          <ActiveScreen
            agentMappings={agentMappings}
            activeScreen={activeScreen}
            extractionFilters={extractionFilters}
            extractedRecords={extractedRecords}
            hasExtracted={hasExtracted}
            isLookupLoading={isLookupLoading}
            isMappingComplete={isMappingComplete}
            lookupError={lookupError}
            onAdvanceStatus={advanceStatus}
            onContinueMapping={() => setActiveScreen("Invoice Review")}
            onExtractData={extractData}
            onGenerateDrafts={generateDraftInvoices}
            onRefreshLookups={() => void refreshLookups()}
            onUpdateVendor={updateVendor}
            setActiveScreen={navigateToScreen}
            successMessage={successMessage}
            trackerRecords={trackerRecords}
            vendors={lookupData?.vendors ?? []}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
