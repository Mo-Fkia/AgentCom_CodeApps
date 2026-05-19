import { useState } from "react";
import "./App.css";
import logoUrl from "./assets/brand/lcb-australia-logo.png";
import studentUrl from "./assets/brand/lcb-australia-student.png";
import { getAgentPayReady, getAgentTagging, getVendors } from "./services/mockData";
import {
  calculateBaseAmount,
  calculateCommissionAmount,
  calculateCommissionRate,
  calculateNonFeeAmount,
  calculateTotalPayment,
  getProgramCodeMapping,
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

const trackerRows = [
  ["INV-2399", "Submitted", "10 May 2026", "$9,820"],
  ["INV-2401", "Paid", "12 May 2026", "$14,300"],
  ["INV-2407", "Ready for BC", "18 May 2026", "$18,450"],
];

type DataTableProps = {
  columns: string[];
  rows: string[][];
};

type SectionHeaderProps = {
  title: string;
  eyebrow: string;
  action?: string;
};

type SeenFilter = "All" | "Seen" | "Not Seen";

type AgentPayReadyRecord = {
  TermYear: number;
  TermNumber: number;
  CampusName: string;
  ProgramName: string;
  ProgramCode: string;
  StudentName: string;
  AgentCompanyID: number;
  AgentCompanyName: string;
  PaymentAmountSubject: number;
  TotalPayment2: number;
  PaymentStatus: string;
  Seen: boolean;
};

type AgentTaggingRecord = {
  Title: string;
  AgentCompanyName: string;
  "BC Agent Name": string;
  "BC Vendor Code": string;
  "Other Remarks": string;
};

type VendorRecord = {
  ID: string;
  "NAV ID": string;
  "Vendor Name": string;
};

type AgentMappingRow = {
  agentCompanyId: string;
  originalAgentName: string;
  selectedNavId: string;
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
          {rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`}>
                  {index === row.length - 1 ? <StatusBadge>{cell}</StatusBadge> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeader({ title, eyebrow, action }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action ? <button className="secondary-button">{action}</button> : null}
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

function uniqueOptions<T>(rows: T[], getValue: (row: T) => string | number) {
  return Array.from(new Set(rows.map((row) => String(getValue(row))).filter(Boolean))).sort();
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    currency: "AUD",
    style: "currency",
  }).format(amount);
}

function GenerateDraftsScreen() {
  const agentPayReady = getAgentPayReady() as AgentPayReadyRecord[];
  const [yearFilter, setYearFilter] = useState("All");
  const [termFilter, setTermFilter] = useState("All");
  const [campusFilter, setCampusFilter] = useState("All");
  const [programFilter, setProgramFilter] = useState("All");
  const [seenFilter, setSeenFilter] = useState<SeenFilter>("All");

  const yearOptions = uniqueOptions(agentPayReady, (record) => record.TermYear);
  const termOptions = uniqueOptions(agentPayReady, (record) => record.TermNumber);
  const campusOptions = uniqueOptions(agentPayReady, (record) => record.CampusName);
  const programOptions = uniqueOptions(agentPayReady, (record) => record.ProgramName);

  const filteredRecords = agentPayReady.filter((record) => {
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

  const distinctAgentCount = new Set(
    filteredRecords.map((record) => record.AgentCompanyID || record.AgentCompanyName),
  ).size;

  const previewRows = filteredRecords.slice(0, 25).map((record) => [
    String(record.AgentCompanyID),
    record.AgentCompanyName,
    `${record.TermYear} T${record.TermNumber}`,
    record.CampusName,
    record.ProgramCode,
    formatCurrency(record.PaymentAmountSubject),
    record.Seen ? "Seen" : "Not Seen",
  ]);

  return (
    <div className="screen-stack">
      <SectionHeader title="Generate Drafts" eyebrow="Draft generation" action="Generate drafts" />
      <div className="split-grid">
        <DataTable
          columns={["Agent ID", "Agent", "Term", "Campus", "Program", "Amount", "Seen"]}
          rows={previewRows}
        />
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
              <option>All</option>
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
        </aside>
      </div>
      <div className="draft-summary-grid">
        <div className="stat-card">
          <p>Total filtered records</p>
          <strong>{filteredRecords.length}</strong>
        </div>
        <div className="stat-card">
          <p>Distinct agent count</p>
          <strong>{distinctAgentCount}</strong>
        </div>
      </div>
    </div>
  );
}

function AgentMappingScreen() {
  const agentPayReady = getAgentPayReady() as AgentPayReadyRecord[];
  const agentTagging = getAgentTagging() as AgentTaggingRecord[];
  const vendors = getVendors() as VendorRecord[];

  const taggingByAgentId = new Map(
    agentTagging.map((record) => [record.Title, record]),
  );
  const vendorsByNavId = new Map(
    vendors
      .filter((vendor) => vendor["NAV ID"] && vendor["Vendor Name"])
      .map((vendor) => [vendor["NAV ID"], vendor]),
  );

  const agentRows = Array.from(
    new Map(
      agentPayReady.map((record) => {
        const agentCompanyId = String(record.AgentCompanyID);
        const tagging = taggingByAgentId.get(agentCompanyId);

        return [
          agentCompanyId,
          {
            agentCompanyId,
            originalAgentName: record.AgentCompanyName,
            selectedNavId: tagging?.["BC Vendor Code"] ?? "",
          },
        ];
      }),
    ).values(),
  );

  const [agentMappings, setAgentMappings] = useState<AgentMappingRow[]>(agentRows);

  const vendorOptions = vendors
    .filter((vendor) => vendor["NAV ID"] && vendor["Vendor Name"])
    .sort((a, b) => a["Vendor Name"].localeCompare(b["Vendor Name"]));

  const updateVendor = (agentCompanyId: string, selectedNavId: string) => {
    setAgentMappings((currentMappings) =>
      currentMappings.map((mapping) =>
        mapping.agentCompanyId === agentCompanyId ? { ...mapping, selectedNavId } : mapping,
      ),
    );
  };

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
          <strong>
            {
              agentMappings.filter((mapping) => vendorsByNavId.has(mapping.selectedNavId))
                .length
            }
          </strong>
        </div>
        <button className="secondary-button" disabled={!allAgentsMapped}>
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
                        updateVendor(mapping.agentCompanyId, event.target.value)
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

function InvoiceReviewScreen() {
  const agentPayReady = getAgentPayReady() as AgentPayReadyRecord[];

  const invoiceReviewRows = agentPayReady.map((record) => [
    record.AgentCompanyName,
    record.StudentName.trim() || "-",
    record.ProgramName,
    record.CampusName,
    formatCurrency(calculateTotalPayment(record)),
    formatCurrency(calculateNonFeeAmount(record)),
    formatCurrency(calculateBaseAmount(record)),
    `${calculateCommissionRate(record)}%`,
    formatCurrency(calculateCommissionAmount(record)),
    getProgramCodeMapping(record).programCode,
  ]);

  return (
    <div className="screen-stack">
      <SectionHeader title="Invoice Review" eyebrow="Approval queue" action="Approve selected" />
      <DataTable
        columns={[
          "Agent",
          "Student",
          "Program",
          "Campus",
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

function InvoiceTrackerScreen() {
  return (
    <div className="screen-stack">
      <SectionHeader title="Invoice Tracker" eyebrow="Progress" action="Export list" />
      <DataTable columns={["Invoice", "Status", "Last updated", "Amount"]} rows={trackerRows} />
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
  activeScreen,
  setActiveScreen,
}: {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
}) {
  if (activeScreen === "Home") return <HomeScreen setActiveScreen={setActiveScreen} />;
  if (activeScreen === "Generate Drafts") return <GenerateDraftsScreen />;
  if (activeScreen === "Agent Mapping") return <AgentMappingScreen />;
  if (activeScreen === "Invoice Review") return <InvoiceReviewScreen />;
  if (activeScreen === "Invoice Tracker") return <InvoiceTrackerScreen />;
  if (activeScreen === "Upload Invoice") return <UploadInvoiceScreen />;
  return <SendToBcScreen />;
}

function App() {
  const [activeScreen, setActiveScreen] = useState("Home");

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
              className={activeScreen === screen ? "active" : ""}
              onClick={() => setActiveScreen(screen)}
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
          <ActiveScreen activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
        </div>
      </section>
    </main>
  );
}

export default App;
