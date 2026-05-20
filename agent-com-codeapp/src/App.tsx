import { useState } from "react";
import "./App.css";
import logoUrl from "./assets/brand/lcb-australia-logo.png";
import studentUrl from "./assets/brand/lcb-australia-student.png";
import { extractAgentPayReady, getAgentPayFilterOptions } from "./services/agentPayService";
import { getAgentMappings, getVendors, loadAgentLookups } from "./services/vendorService";
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
  programCode,
  totalPayment,
} from "./rules/commission";

const screens = [
  "Home",
  "Generate Drafts",
  "Agent Mapping",
  "Invoice Review",
  "Invoice Tracker",
  "Upload Invoice",
  "Send to BC",
];

const stats = [
  { label: "Draft invoices", value: "18" },
  { label: "Pending review", value: "7" },
  { label: "Mapped agents", value: "126" },
  { label: "Ready for BC", value: "5" },
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
                  <td key={`${rowIndex}-${cellIndex}`}>
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

      <SectionHeader title="Commission Summary" eyebrow="Home" action="Refresh mock data" />
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>
      <div className="screen-grid">
        {screens.slice(1).map((screen) => (
          <button key={screen} className="screen-card" onClick={() => setActiveScreen(screen)}>
            <span>{screen}</span>
            <small>Open the {screen.toLowerCase()} mock screen.</small>
          </button>
        ))}
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
  return Boolean(mapping.selectedNavId);
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
  extractedRecords,
  hasExtracted,
  onExtractData,
}: {
  extractedRecords: AgentPayReadyRecord[];
  hasExtracted: boolean;
  onExtractData: (records: AgentPayReadyRecord[]) => Promise<void>;
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
      const rows = await extractAgentPayReady({
        campus: campusFilter,
        program: programFilter,
        seen: seenFilter,
        term: termFilter,
        year: yearFilter,
      });

      if (!Array.isArray(rows)) {
        throw new Error("Agent pay extraction returned an invalid response.");
      }

      await onExtractData(rows);
    } catch (error) {
      setExtractError(error instanceof Error ? error.message : "Agent pay extraction failed.");
    } finally {
      setIsExtracting(false);
    }
  };

  const distinctAgentCount = new Set(
    extractedRecords.map((record) => record.AgentCompanyID || record.AgentCompanyName),
  ).size;

  const previewRows = extractedRecords.slice(0, 25).map((record, index) => ({
    AgentPayReadyID: record.AgentPayReadyID,
    cells: [
      String(record.AgentCompanyID),
      record.OriginalAgentCompanyName || record.AgentCompanyName,
      `${record.TermYear} T${record.TermNumber}`,
      record.CampusName,
      record.ProgramCode,
      formatCurrency(record.PaymentAmountSubject),
      record.Seen ? "Seen" : "Not Seen",
    ],
    id: index,
  }));

  return (
    <div className="screen-stack">
      <SectionHeader title="Generate Drafts" eyebrow="Draft generation" />
      <div className="split-grid">
        <aside className="side-panel">
          <h3>Filters</h3>
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
          <button
            className="secondary-button side-panel-button"
            disabled={isExtracting}
            onClick={handleExtractData}
          >
            {isExtracting ? "Extracting..." : "Extract Data"}
          </button>
          {extractError ? <div className="error-message">{extractError}</div> : null}
        </aside>
        <div className="empty-state">
          {hasExtracted
            ? "Extracted data is ready for review."
            : "Select filters and extract data to begin draft generation."}
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
          <DataTable
            columns={["Agent ID", "Agent", "Term", "Campus", "Program", "Amount", "Seen"]}
            rows={previewRows}
          />
        </>
      ) : null}
    </div>
  );
}

function AgentMappingScreen({
  agentMappings,
  onContinue,
  onUpdateVendor,
}: {
  agentMappings: AgentMappingRow[];
  onContinue: () => void;
  onUpdateVendor: (agentCompanyId: string, selectedNavId: string) => void;
}) {
  const vendors = getVendors() as VendorRecord[];
  const vendorsByNavId = new Map(
    vendors
      .filter((vendor) => vendor["NAV ID"] && vendor["Vendor Name"])
      .map((vendor) => [vendor["NAV ID"], vendor]),
  );
  const vendorOptions = vendors
    .filter((vendor) => vendor["NAV ID"] && vendor["Vendor Name"])
    .sort((a, b) => a["Vendor Name"].localeCompare(b["Vendor Name"]));
  const allAgentsMapped = agentMappings.every((mapping) => {
    const vendor = vendorsByNavId.get(mapping.selectedNavId);
    return Boolean(vendor?.["Vendor Name"] && vendor["NAV ID"]);
  });

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
          <strong>{agentMappings.filter(isMappedAgent).length}</strong>
        </div>
        <button className="secondary-button" disabled={!allAgentsMapped} onClick={onContinue}>
          Continue
        </button>
      </div>
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Agent ID</th>
              <th>Original Agent Name</th>
              <th>Selected Vendor Name</th>
              <th>NAVID / vendor code</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {agentMappings.map((mapping) => {
              const selectedVendor = vendorsByNavId.get(mapping.selectedNavId);
              const isMapped = Boolean(selectedVendor?.["Vendor Name"] && selectedVendor["NAV ID"]);

              return (
                <tr key={mapping.agentCompanyId}>
                  <td>{mapping.agentCompanyId}</td>
                  <td>{mapping.originalAgentName}</td>
                  <td>
                    <select
                      aria-label={`Vendor for ${mapping.originalAgentName}`}
                      value={mapping.selectedNavId}
                      onChange={(event) =>
                        onUpdateVendor(mapping.agentCompanyId, event.target.value)
                      }
                    >
                      <option value="">Select vendor</option>
                      {vendorOptions.map((vendor) => (
                        <option key={`${vendor.ID}-${vendor["NAV ID"]}`} value={vendor["NAV ID"]}>
                          {vendor["Vendor Name"]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{selectedVendor?.["NAV ID"] ?? ""}</td>
                  <td>
                    <StatusBadge>{isMapped ? "Matched" : "Needs mapping"}</StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvoiceReviewScreen({
  extractedRecords,
  onGenerateDrafts,
}: {
  extractedRecords: AgentPayReadyRecord[];
  onGenerateDrafts: (records: AgentPayReadyRecord[]) => void;
}) {
  const invoiceReviewRows = extractedRecords.map((record, index) => ({
    AgentPayReadyID: record.AgentPayReadyID,
    cells: [
      record.OriginalAgentCompanyName || record.AgentCompanyName,
      record.StudentName.trim() || "-",
      String(record.StudentID ?? record.EmpID),
      record.ProgramName,
      record.CampusName,
      getYearTerm(record),
      formatCurrency(totalPayment(record)),
      formatCurrency(nonFee(record)),
      formatCurrency(baseAmount(record)),
      `${commissionRate(record)}%`,
      formatCurrency(commissionAmount(record)),
      programCode(record).programCode,
    ],
    id: index,
  }));

  return (
    <div className="screen-stack">
      <SectionHeader
        title="Invoice Review"
        eyebrow="Approval queue"
        action="Generate Drafts"
        onAction={() => onGenerateDrafts(extractedRecords)}
      />
      <DataTable
        columns={[
          "Agent",
          "Student",
          "Student ID",
          "Program",
          "Campus",
          "YearTerm",
          "Total Payment",
          "Non Fee",
          "Base Amount",
          "Commission Rate",
          "Commission Amount",
          "Program Code",
        ]}
        rows={invoiceReviewRows}
      />
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

function ActiveScreen({
  agentMappings,
  activeScreen,
  extractedRecords,
  hasExtracted,
  isMappingComplete,
  onAdvanceStatus,
  onContinueMapping,
  onExtractData,
  onGenerateDrafts,
  onUpdateVendor,
  setActiveScreen,
  successMessage,
  trackerRecords,
}: {
  agentMappings: AgentMappingRow[];
  activeScreen: string;
  extractedRecords: AgentPayReadyRecord[];
  hasExtracted: boolean;
  isMappingComplete: boolean;
  onAdvanceStatus: (draftName: string) => void;
  onContinueMapping: () => void;
  onExtractData: (records: AgentPayReadyRecord[]) => Promise<void>;
  onGenerateDrafts: (records: AgentPayReadyRecord[]) => void;
  onUpdateVendor: (agentCompanyId: string, selectedNavId: string) => void;
  setActiveScreen: (screen: string) => void;
  successMessage: string;
  trackerRecords: DraftInvoiceRecord[];
}) {
  if (activeScreen === "Home") return <HomeScreen setActiveScreen={setActiveScreen} />;
  if (activeScreen === "Generate Drafts") {
    return (
      <GenerateDraftsScreen
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
        onContinue={onContinueMapping}
        onUpdateVendor={onUpdateVendor}
      />
    );
  }
  if (activeScreen === "Invoice Review") {
    if (!isMappingComplete) {
      return <div className="empty-state">Complete agent mapping before invoice review.</div>;
    }

    return (
      <InvoiceReviewScreen
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
  const [agentMappings, setAgentMappings] = useState<AgentMappingRow[]>([]);
  const [trackerRecords, setTrackerRecords] = useState<DraftInvoiceRecord[]>(createInitialTrackerRecords);
  const [successMessage, setSuccessMessage] = useState("");
  const hasExtracted = extractedRecords.length > 0;
  const isMappingComplete =
    hasExtracted && agentMappings.length > 0 && agentMappings.every(isMappedAgent);

  const buildAgentMappings = (records: AgentPayReadyRecord[]) => {
    const agentTagging = getAgentMappings() as AgentTaggingRecord[];
    const vendors = getVendors() as VendorRecord[];
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

          return [
            agentCompanyId,
            {
              agentCompanyId,
              originalAgentName: record.OriginalAgentCompanyName || record.AgentCompanyName,
              selectedNavId: validVendorCodes.has(selectedNavId) ? selectedNavId : "",
            },
          ];
        }),
      ).values(),
    );
  };

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

  const extractData = async (records: AgentPayReadyRecord[]) => {
    await loadAgentLookups();
    setExtractedRecords(records);
    setAgentMappings(buildAgentMappings(records));
    setSuccessMessage("");
  };

  const updateVendor = (agentCompanyId: string, selectedNavId: string) => {
    setAgentMappings((currentMappings) =>
      currentMappings.map((mapping) =>
        mapping.agentCompanyId === agentCompanyId ? { ...mapping, selectedNavId } : mapping,
      ),
    );
  };

  const generateDraftInvoices = (records: AgentPayReadyRecord[]) => {
    const createdDate = new Date().toISOString().slice(0, 10);
    const groupedDrafts = new Map<string, DraftInvoiceRecord>();

    records.forEach((record) => {
      const yearTerm = getYearTerm(record);
      const agentCode = String(record.AgentCompanyID);
      const groupKey = `${agentCode}-${yearTerm}-${record.CampusName}`;
      const existingDraft = groupedDrafts.get(groupKey);

      if (existingDraft) {
        existingDraft.TotalCommission += commissionAmount(record);
        return;
      }

      groupedDrafts.set(groupKey, {
        DraftInvoiceLink: "#",
        DraftNm: `DRFT-${yearTerm}-${agentCode}-${record.CampusName}`,
        AgentCode: agentCode,
        AgentName: record.OriginalAgentCompanyName || record.AgentCompanyName,
        Campus: record.CampusName,
        CreatedDate: createdDate,
        CurrentStatus: "New",
        TotalCommission: commissionAmount(record),
        YearTerm: yearTerm,
      });
    });

    const nextDraftInvoices = createDraftInvoicesService(Array.from(groupedDrafts.values()));
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
          {screens.map((screen) => (
            <button
              key={screen}
              disabled={
                (screen === "Agent Mapping" && !hasExtracted) ||
                (screen === "Invoice Review" && !isMappingComplete)
              }
              className={activeScreen === screen ? "active" : ""}
              onClick={() => navigateToScreen(screen)}
            >
              {screen}
            </button>
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
            extractedRecords={extractedRecords}
            hasExtracted={hasExtracted}
            isMappingComplete={isMappingComplete}
            onAdvanceStatus={advanceStatus}
            onContinueMapping={() => setActiveScreen("Invoice Review")}
            onExtractData={extractData}
            onGenerateDrafts={generateDraftInvoices}
            onUpdateVendor={updateVendor}
            setActiveScreen={navigateToScreen}
            successMessage={successMessage}
            trackerRecords={trackerRecords}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
