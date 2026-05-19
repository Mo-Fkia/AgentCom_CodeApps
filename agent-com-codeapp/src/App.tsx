import { useState } from "react";
import "./App.css";

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

const draftRows = [
  ["AUS001", "Sydney Education Partners", "15", "$18,450", "Ready"],
  ["KOR044", "Han Study Group", "9", "$11,210", "Draft"],
  ["IND098", "Global Pathways", "22", "$27,880", "Ready"],
];

const mappingRows = [
  ["AUS001", "Sydney Education Partners", "V000382", "Matched"],
  ["KOR044", "Han Study Group", "V000517", "Needs check"],
  ["IDN021", "Jakarta Placement Co", "-", "Unmapped"],
];

const reviewRows = [
  ["INV-2407", "Sydney Education Partners", "$18,450", "Approved"],
  ["INV-2408", "Han Study Group", "$11,210", "Missing ABN"],
  ["INV-2409", "Global Pathways", "$27,880", "Approved"],
];

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
            src="/lcb-australia-logo.png"
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
          <img src="/lcb-australia-student.png" alt="Le Cordon Bleu Australia student" />
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

function GenerateDraftsScreen() {
  return (
    <div className="screen-stack">
      <SectionHeader title="Generate Drafts" eyebrow="Draft generation" action="Generate drafts" />
      <div className="split-grid">
        <DataTable
          columns={["Agent code", "Agent", "Students", "Commission", "Status"]}
          rows={draftRows}
        />
        <aside className="side-panel">
          <h3>Run settings</h3>
          <label>
            Intake
            <select>
              <option>July 2026</option>
              <option>October 2026</option>
            </select>
          </label>
          <label>
            Campus
            <select>
              <option>All campuses</option>
              <option>Sydney</option>
              <option>Melbourne</option>
              <option>Adelaide</option>
              <option>Brisbane</option>
            </select>
          </label>
        </aside>
      </div>
    </div>
  );
}

function AgentMappingScreen() {
  return (
    <div className="screen-stack">
      <SectionHeader title="Agent Mapping" eyebrow="Agent setup" action="Save mappings" />
      <DataTable columns={["Agent code", "Agent name", "Vendor no.", "Status"]} rows={mappingRows} />
    </div>
  );
}

function InvoiceReviewScreen() {
  return (
    <div className="screen-stack">
      <SectionHeader title="Invoice Review" eyebrow="Approval queue" action="Approve selected" />
      <DataTable columns={["Invoice", "Agent", "Amount", "Review status"]} rows={reviewRows} />
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
            src="/lcb-australia-logo.png"
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
          <img src="/lcb-australia-logo.png" alt="Le Cordon Bleu Australia" />
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
