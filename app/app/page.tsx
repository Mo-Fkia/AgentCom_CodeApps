"use client";

import Image from "next/image";
import { useState } from "react";

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

function StatusBadge({ children }: { children: string }) {
  const tone =
    children.includes("Approved") || children.includes("Ready") || children.includes("Matched")
      ? "border-[#cfc39d] bg-[#f6f2e6] text-[#6f5d2e]"
      : children.includes("Paid") || children.includes("Submitted")
        ? "border-[#9caac4] bg-[#eef3fb] text-[#062b68]"
        : "border-[#e5d6a7] bg-[#fbf7ec] text-[#7c651f]";

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${tone}`}>
      {children}
    </span>
  );
}

function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[620px] border-collapse text-left text-sm">
        <thead className="bg-[#f7f4eb] text-xs uppercase text-[#062b68]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell, index) => (
                <td key={cell} className="px-4 py-3">
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

function SectionHeader({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow: string;
  action?: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#88774f]">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#00205b]">{title}</h2>
      </div>
      {action ? (
        <button className="h-10 border border-[#cfc39d] bg-white px-4 text-sm font-medium text-[#00205b] shadow-sm hover:bg-[#f7f4eb]">
          {action}
        </button>
      ) : null}
    </div>
  );
}

function HomeScreen({ setActiveScreen }: { setActiveScreen: (screen: string) => void }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-5 border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_260px]">
        <div>
          <Image
            src="/lcb-australia-logo.png"
            alt="Le Cordon Bleu Australia"
            width={330}
            height={90}
            priority
            className="h-auto w-64"
          />
          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[#88774f]">
            Finance team
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[#00205b]">Agent Commission Workbench</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Mock layout for reviewing agent commission drafts, mapping vendors, tracking invoice
            status, and preparing approved items for Business Central.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {campuses.map((campus) => (
              <span
                key={campus}
                className="border border-[#cfc39d] bg-[#fbf8ef] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#062b68]"
              >
                {campus}
              </span>
            ))}
          </div>
        </div>
        <div className="hidden overflow-hidden border border-slate-200 bg-[#f7f4eb] lg:block">
          <Image
            src="/lcb-australia-student.png"
            alt="Le Cordon Bleu Australia student"
            width={250}
            height={250}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <SectionHeader title="Commission Summary" eyebrow="Home" action="Refresh mock data" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-slate-200 border-t-[#88774f] bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#00205b]">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {screens.slice(1).map((screen) => (
          <button
            key={screen}
            onClick={() => setActiveScreen(screen)}
            className="border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#88774f] hover:bg-[#fbf8ef]"
          >
            <span className="text-sm font-semibold text-[#00205b]">{screen}</span>
            <span className="mt-2 block text-sm leading-6 text-slate-500">
              Open the {screen.toLowerCase()} mock screen.
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GenerateDraftsScreen() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Generate Drafts" eyebrow="Draft generation" action="Generate drafts" />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <DataTable
          columns={["Agent code", "Agent", "Students", "Commission", "Status"]}
          rows={draftRows}
        />
        <div className="border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#00205b]">Run settings</h3>
          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <label className="block">
              Intake
              <select className="mt-2 h-10 w-full border border-slate-300 bg-white px-3 text-slate-900">
                <option>July 2026</option>
                <option>October 2026</option>
              </select>
            </label>
            <label className="block">
              Campus
              <select className="mt-2 h-10 w-full border border-slate-300 bg-white px-3 text-slate-900">
                <option>All campuses</option>
                <option>Sydney</option>
                <option>Melbourne</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentMappingScreen() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Agent Mapping" eyebrow="Agent setup" action="Save mappings" />
      <DataTable
        columns={["Agent code", "Agent name", "Vendor no.", "Status"]}
        rows={mappingRows}
      />
    </div>
  );
}

function InvoiceReviewScreen() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Invoice Review" eyebrow="Approval queue" action="Approve selected" />
      <DataTable
        columns={["Invoice", "Agent", "Amount", "Review status"]}
        rows={reviewRows}
      />
    </div>
  );
}

function InvoiceTrackerScreen() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Invoice Tracker" eyebrow="Progress" action="Export list" />
      <DataTable columns={["Invoice", "Status", "Last updated", "Amount"]} rows={trackerRows} />
    </div>
  );
}

function UploadInvoiceScreen() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Upload Invoice" eyebrow="Invoice intake" action="Upload mock invoice" />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex min-h-[280px] items-center justify-center border border-dashed border-[#88774f] bg-white p-8 text-center shadow-sm">
          <div>
            <Image
              src="/lcb-australia-logo.png"
              alt="Le Cordon Bleu Australia"
              width={240}
              height={70}
              className="mx-auto h-auto w-48"
            />
            <p className="mt-6 text-lg font-semibold text-[#00205b]">Drop invoice file here</p>
            <p className="mt-2 text-sm text-slate-500">Mock upload area only</p>
          </div>
        </div>
        <div className="border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#00205b]">Extracted details</h3>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Agent</dt>
              <dd className="font-medium text-slate-900">Sydney Education Partners</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Amount</dt>
              <dd className="font-medium text-slate-900">$18,450</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <StatusBadge>Ready</StatusBadge>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function SendToBcScreen() {
  return (
    <div className="space-y-6">
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

export default function App() {
  const [activeScreen, setActiveScreen] = useState("Home");

  return (
    <main className="min-h-screen bg-[#f2f2f2] text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-[#001846] bg-[#00205b] text-white lg:w-72 lg:border-b-0 lg:border-r">
          <div className="border-b border-white/10 bg-white p-5">
            <Image
              src="/lcb-australia-logo.png"
              alt="Le Cordon Bleu Australia"
              width={250}
              height={70}
              className="h-auto w-full"
            />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#88774f]">
              Finance team
            </p>
            <h1 className="mt-1 text-lg font-semibold text-[#00205b]">Agent Commission</h1>
          </div>
          <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
            {screens.map((screen) => (
              <button
                key={screen}
                onClick={() => setActiveScreen(screen)}
                className={`whitespace-nowrap px-4 py-3 text-left text-sm font-medium transition ${
                  activeScreen === screen
                    ? "bg-[#88774f] text-white"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                {screen}
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex-1">
          <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-5">
            <div>
              <p className="text-sm text-slate-500">Le Cordon Bleu Australia Finance</p>
              <p className="font-semibold text-[#00205b]">{activeScreen}</p>
            </div>
            <div className="hidden text-sm text-slate-500 sm:block">No external connections</div>
          </header>
          <div className="mx-auto max-w-7xl p-5 lg:p-8">
            <ActiveScreen activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
          </div>
        </section>
      </div>
    </main>
  );
}
