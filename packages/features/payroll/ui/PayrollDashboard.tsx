"use client";

import {
  Banknote,
  Building2,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  Moon,
  Plus,
  Shield,
  Smartphone,
  Sun,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type PaymentFrequency = "hourly" | "weekly" | "monthly";
export type PaymentMethod = "bank_transfer" | "mobile_wallet" | "debit_card";

export interface PaymentRecord {
  id: string;
  date: string;
  grossPay: number;
  bonus: number;
  deductions: number;
  netPay: number;
  hoursWorked?: number;
  status: "paid";
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  frequency: PaymentFrequency;
  baseRate: number;
  nextPayDate: string;
  paymentMethod: PaymentMethod;
  status: "active" | "inactive";
  history: PaymentRecord[];
}

// ─── Money utilities ──────────────────────────────────────────────────────────

function fmt(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function parseDollars(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isNaN(n) || n < 0 ? 0 : Math.round(n * 100);
}

function parseHours(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

function monthlyEquivalent(emp: Employee): number {
  if (emp.frequency === "monthly") return emp.baseRate;
  if (emp.frequency === "weekly") return Math.round(emp.baseRate * 4.333);
  return Math.round(emp.baseRate * 160); // 40 hrs × 4 wks
}

// ─── Date utilities ───────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function advanceDate(iso: string, freq: PaymentFrequency): string {
  const d = new Date(`${iso}T00:00:00`);
  if (freq === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Misc utilities ───────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    name: "Carlos M.",
    role: "Personal Driver",
    frequency: "monthly",
    baseRate: 250000,
    nextPayDate: "2026-06-01",
    paymentMethod: "bank_transfer",
    status: "active",
    history: [
      {
        id: "h-1a",
        date: "2026-05-01",
        grossPay: 250000,
        bonus: 0,
        deductions: 0,
        netPay: 250000,
        status: "paid",
      },
      {
        id: "h-1b",
        date: "2026-04-01",
        grossPay: 250000,
        bonus: 15000,
        deductions: 0,
        netPay: 265000,
        status: "paid",
      },
    ],
  },
  {
    id: "emp-2",
    name: "Amina K.",
    role: "Housekeeper / Cook",
    frequency: "weekly",
    baseRate: 60000,
    nextPayDate: "2026-05-22",
    paymentMethod: "mobile_wallet",
    status: "active",
    history: [
      {
        id: "h-2a",
        date: "2026-05-15",
        grossPay: 60000,
        bonus: 5000,
        deductions: 0,
        netPay: 65000,
        status: "paid",
      },
      {
        id: "h-2b",
        date: "2026-05-08",
        grossPay: 60000,
        bonus: 0,
        deductions: 2000,
        netPay: 58000,
        status: "paid",
      },
    ],
  },
  {
    id: "emp-3",
    name: "Sarah T.",
    role: "Nanny",
    frequency: "hourly",
    baseRate: 2500,
    nextPayDate: "2026-05-19",
    paymentMethod: "debit_card",
    status: "active",
    history: [
      {
        id: "h-3a",
        date: "2026-05-12",
        grossPay: 120000,
        bonus: 0,
        deductions: 0,
        netPay: 120000,
        hoursWorked: 48,
        status: "paid",
      },
      {
        id: "h-3b",
        date: "2026-05-05",
        grossPay: 100000,
        bonus: 0,
        deductions: 0,
        netPay: 100000,
        hoursWorked: 40,
        status: "paid",
      },
    ],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const FREQ_LABELS: Record<PaymentFrequency, string> = {
  hourly: "Hourly",
  weekly: "Weekly",
  monthly: "Monthly",
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank Transfer",
  mobile_wallet: "Mobile Wallet",
  debit_card: "Debit Card",
};

const ROLE_OPTIONS = [
  "Personal Driver",
  "Housekeeper / Cook",
  "Nanny",
  "Gardener",
  "Security Guard",
  "Personal Chef",
  "House Manager",
  "Other",
];

// Dark-aware palette: light tokens first, dark: overrides included
const AVATAR_PALETTE = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
];

// ─── Primitive atoms ──────────────────────────────────────────────────────────

function Avatar({ name, idx }: { name: string; idx: number }) {
  const color = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
  return (
    <span
      className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${color}`}
    >
      {initials(name)}
    </span>
  );
}

function FreqBadge({ freq }: { freq: PaymentFrequency }) {
  return (
    <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
      {FREQ_LABELS[freq]}
    </span>
  );
}

function MethodBadge({ method }: { method: PaymentMethod }) {
  const Icon =
    method === "bank_transfer" ? Building2 : method === "mobile_wallet" ? Smartphone : CreditCard;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
      <Icon className="h-3 w-3" />
      {METHOD_LABELS[method]}
    </span>
  );
}

function PaidBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
      <CheckCircle className="h-3 w-3" />
      Paid
    </span>
  );
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
    >
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-gray-600 dark:focus:border-violet-500 dark:focus:bg-white/[0.09] dark:focus:ring-violet-900/40"
    />
  );
}

function DropdownSelect({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium text-gray-900 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-violet-500 dark:focus:bg-white/[0.09] dark:focus:ring-violet-900/40"
    >
      {children}
    </select>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1A1426]">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Employee card ────────────────────────────────────────────────────────────

function EmployeeCard({
  employee,
  idx,
  onPay,
}: {
  employee: Employee;
  idx: number;
  onPay: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1A1426]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={employee.name} idx={idx} />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{employee.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{employee.role}</p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
          Active
        </span>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            Next Payment
          </span>
          <FreqBadge freq={employee.frequency} />
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {fmtDate(employee.nextPayDate)}
        </p>
        {employee.frequency === "hourly" ? (
          <p className="mt-0.5 text-base font-bold text-violet-700 dark:text-violet-400">
            {fmt(employee.baseRate)}
            <span className="text-sm font-medium text-gray-400 dark:text-gray-500">/hr</span>
          </p>
        ) : (
          <p className="mt-0.5 text-lg font-bold text-violet-700 dark:text-violet-400">
            {fmt(employee.baseRate)}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <MethodBadge method={employee.paymentMethod} />
        <button
          type="button"
          onClick={onPay}
          className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
        >
          <Banknote className="h-3.5 w-3.5" />
          Pay Now
        </button>
      </div>
    </div>
  );
}

// ─── Pay modal ────────────────────────────────────────────────────────────────

type ModalPhase = "form" | "loading" | "success";

function PayModal({
  employee,
  empIdx,
  onClose,
  onPaid,
}: {
  employee: Employee;
  empIdx: number;
  onClose: () => void;
  onPaid: (empId: string, record: PaymentRecord, nextDate: string) => void;
}) {
  const [hours, setHours] = useState("");
  const [bonus, setBonus] = useState("");
  const [deductions, setDeductions] = useState("");
  const [phase, setPhase] = useState<ModalPhase>("form");

  const h = parseHours(hours);
  const bonusCents = parseDollars(bonus);
  const dedCents = parseDollars(deductions);

  const grossPay =
    employee.frequency === "hourly" ? Math.round(h * employee.baseRate) : employee.baseRate;
  const netPay = Math.max(0, grossPay + bonusCents - dedCents);
  const canConfirm = employee.frequency === "hourly" ? h > 0 : true;

  function confirm() {
    if (!canConfirm || phase !== "form") return;
    setPhase("loading");
    setTimeout(() => setPhase("success"), 1800);
    setTimeout(() => {
      onPaid(
        employee.id,
        {
          id: uid(),
          date: todayIso(),
          grossPay,
          bonus: bonusCents,
          deductions: dedCents,
          netPay,
          hoursWorked: employee.frequency === "hourly" ? h : undefined,
          status: "paid",
        },
        advanceDate(employee.nextPayDate, employee.frequency)
      );
    }, 3300);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#1A1426]">
        {/* Modal header */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-5 dark:from-violet-800 dark:to-violet-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={employee.name} idx={empIdx} />
              <div>
                <p className="font-semibold text-white">{employee.name}</p>
                <p className="text-sm text-violet-200">{employee.role}</p>
              </div>
            </div>
            {phase === "form" && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-violet-200 transition-colors hover:bg-violet-500 hover:text-white dark:hover:bg-violet-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-5">
          {/* ── Form phase ── */}
          {phase === "form" && (
            <>
              {/* Hourly: hours input */}
              {employee.frequency === "hourly" && (
                <div className="mb-4">
                  <FieldLabel>Hours Worked This Period</FieldLabel>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g. 40"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-gray-600 dark:focus:border-violet-500 dark:focus:bg-white/[0.09] dark:focus:ring-violet-900/40"
                    />
                  </div>
                  {h > 0 && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {h} hrs × {fmt(employee.baseRate)}/hr ={" "}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {fmt(grossPay)}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Weekly / monthly: fixed base display */}
              {employee.frequency !== "hourly" && (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Base {FREQ_LABELS[employee.frequency]} Pay
                    </p>
                    <p className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">
                      {fmt(employee.baseRate)}
                    </p>
                  </div>
                  <FreqBadge freq={employee.frequency} />
                </div>
              )}

              {/* Bonus */}
              <div className="mb-3">
                <FieldLabel>Bonus / Overtime (optional)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-8 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-gray-600 dark:focus:border-violet-500 dark:focus:bg-white/[0.09] dark:focus:ring-violet-900/40"
                  />
                </div>
              </div>

              {/* Deductions */}
              <div className="mb-5">
                <FieldLabel>Deductions (optional)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-8 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-gray-600 dark:focus:border-violet-500 dark:focus:bg-white/[0.09] dark:focus:ring-violet-900/40"
                  />
                </div>
              </div>

              {/* Live summary */}
              <div className="mb-5 rounded-xl border border-violet-100 bg-violet-50 px-4 py-4 dark:border-violet-800/40 dark:bg-violet-950/50">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">
                  Payment Summary
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Gross Pay</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {fmt(grossPay)}
                    </span>
                  </div>
                  {bonusCents > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600 dark:text-emerald-400">+ Bonus</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        +{fmt(bonusCents)}
                      </span>
                    </div>
                  )}
                  {dedCents > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-red-500 dark:text-red-400">− Deductions</span>
                      <span className="font-medium text-red-500 dark:text-red-400">
                        −{fmt(dedCents)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-violet-200 pt-2 dark:border-violet-800/50">
                    <span className="font-semibold text-violet-900 dark:text-violet-300">
                      Net Payout
                    </span>
                    <span className="text-xl font-bold text-violet-700 dark:text-violet-400">
                      {fmt(netPay)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={confirm}
                disabled={!canConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-violet-700 dark:hover:bg-violet-600"
              >
                <Shield className="h-4 w-4" />
                Confirm & Transfer Salary
              </button>
            </>
          )}

          {/* ── Loading phase ── */}
          {phase === "loading" && (
            <div className="flex flex-col items-center justify-center gap-4 py-14">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-900/30">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">Processing Payment</p>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                  Securely transferring funds…
                </p>
              </div>
            </div>
          )}

          {/* ── Success phase ── */}
          {phase === "success" && (
            <div className="flex flex-col items-center justify-center gap-4 py-14">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                <CheckCircle className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">Payment Sent</p>
                <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {fmt(netPay)}
                </p>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                  transferred to {employee.name}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add employee panel ───────────────────────────────────────────────────────

function AddEmployeePanel({ onAdd }: { onAdd: (emp: Employee) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [freq, setFreq] = useState<PaymentFrequency>("monthly");
  const [rate, setRate] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [nextDate, setNextDate] = useState("");
  const [errors, setErrors] = useState<{ name?: string; rate?: string; nextDate?: string }>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required";
    const r = Number.parseFloat(rate);
    if (!rate || Number.isNaN(r) || r <= 0) e.rate = "Enter a valid positive rate";
    if (!nextDate) e.nextDate = "Select a pay date";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onAdd({
      id: uid(),
      name: name.trim(),
      role,
      frequency: freq,
      baseRate: parseDollars(rate),
      nextPayDate: nextDate,
      paymentMethod: method,
      status: "active",
      history: [],
    });
    setName("");
    setRole(ROLE_OPTIONS[0]);
    setFreq("monthly");
    setRate("");
    setMethod("bank_transfer");
    setNextDate("");
    setErrors({});
    setOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-white dark:border-white/10 dark:bg-[#1A1426]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
            <UserPlus className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Add New Employee</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Register a new household staff member
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-6 py-5 dark:border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FieldLabel>Full Name</FieldLabel>
              <TextInput
                type="text"
                placeholder="e.g. Maria S."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
              <FieldLabel>Role</FieldLabel>
              <DropdownSelect value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </DropdownSelect>
            </div>

            <div>
              <FieldLabel>Pay Frequency</FieldLabel>
              <DropdownSelect
                value={freq}
                onChange={(e) => setFreq(e.target.value as PaymentFrequency)}
              >
                <option value="hourly">Hourly</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </DropdownSelect>
            </div>

            <div>
              <FieldLabel>
                Base Rate (${freq === "hourly" ? "/hr" : freq === "weekly" ? "/week" : "/month"})
              </FieldLabel>
              <TextInput
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
              {errors.rate && <p className="mt-1 text-xs text-red-500">{errors.rate}</p>}
            </div>

            <div>
              <FieldLabel>Payment Method</FieldLabel>
              <DropdownSelect
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_wallet">Mobile Wallet</option>
                <option value="debit_card">Debit Card</option>
              </DropdownSelect>
            </div>

            <div className="col-span-2">
              <FieldLabel>First Pay Date</FieldLabel>
              <TextInput
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
              />
              {errors.nextDate && <p className="mt-1 text-xs text-red-500">{errors.nextDate}</p>}
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payroll history table ────────────────────────────────────────────────────

function HistoryTable({ employees }: { employees: Employee[] }) {
  const rows = useMemo(() => {
    return employees
      .flatMap((emp, idx) =>
        emp.history.map((r) => ({
          ...r,
          empName: emp.name,
          empRole: emp.role,
          empFreq: emp.frequency,
          empIdx: idx,
        }))
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [employees]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-14 text-center dark:border-white/10 dark:bg-[#1A1426]">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 dark:bg-white/[0.04]">
          <Banknote className="h-6 w-6 text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
          No payroll history yet
        </p>
        <p className="mt-0.5 text-xs text-gray-300 dark:text-gray-600">
          Completed payments will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-[#1A1426]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-white/[0.04]">
              {[
                ["Employee", "text-left px-6"],
                ["Date", "text-left px-4"],
                ["Gross Pay", "text-right px-4"],
                ["Bonus", "text-right px-4"],
                ["Deductions", "text-right px-4"],
                ["Net Pay", "text-right px-4"],
                ["Status", "text-center px-4"],
              ].map(([label, cls]) => (
                <th
                  key={label}
                  className={`${cls} py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {rows.map((r) => (
              <tr
                key={r.id}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              >
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-900 dark:text-white">{r.empName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {r.empRole}
                    {r.hoursWorked != null ? ` · ${r.hoursWorked}h` : ""}
                  </p>
                </td>
                <td className="px-4 py-4 text-gray-500 dark:text-gray-400">{fmtDate(r.date)}</td>
                <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-white">
                  {fmt(r.grossPay)}
                </td>
                <td className="px-4 py-4 text-right">
                  {r.bonus > 0 ? (
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      +{fmt(r.bonus)}
                    </span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  {r.deductions > 0 ? (
                    <span className="font-medium text-red-500 dark:text-red-400">
                      −{fmt(r.deductions)}
                    </span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right font-bold text-gray-900 dark:text-white">
                  {fmt(r.netPay)}
                </td>
                <td className="px-4 py-4 text-center">
                  <PaidBadge />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Root dashboard ───────────────────────────────────────────────────────────

export default function PayrollDashboard() {
  const [employees, setEmployees] = useState<Employee[]>(SEED_EMPLOYEES);
  const [payingIdx, setPayingIdx] = useState<number | null>(null);
  const [dark, setDark] = useState(false);

  const active = employees.filter((e) => e.status === "active");

  const totalMonthly = useMemo(
    () => active.reduce((sum, e) => sum + monthlyEquivalent(e), 0),
    [active]
  );

  const nextPayment = useMemo(() => {
    return [...active].sort((a, b) => a.nextPayDate.localeCompare(b.nextPayDate))[0] ?? null;
  }, [active]);

  const paidThisMonth = useMemo(() => {
    const prefix = new Date().toISOString().slice(0, 7);
    return employees
      .flatMap((e) => e.history)
      .filter((r) => r.date.startsWith(prefix))
      .reduce((sum, r) => sum + r.netPay, 0);
  }, [employees]);

  function handlePaid(empId: string, record: PaymentRecord, nextDate: string) {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === empId ? { ...e, nextPayDate: nextDate, history: [record, ...e.history] } : e
      )
    );
    setPayingIdx(null);
  }

  return (
    // The `dark` class on this root div activates all dark: variants below
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 p-6 transition-colors duration-200 dark:bg-[#0F0B1A] lg:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Page header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Household Payroll
              </h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Manage salary and payments for your household staff
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                type="button"
                onClick={() => setDark((d) => !d)}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                className="flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-[#1A1426] dark:text-gray-300 dark:hover:bg-white/[0.06]"
              >
                {dark ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-violet-500" />
                )}
                {dark ? "Light" : "Dark"}
              </button>
              {/* Security badge */}
              <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3.5 py-2 shadow-sm dark:border-white/10 dark:bg-[#1A1426]">
                <Shield className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Secured Transfers
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Active Staff"
              value={String(active.length)}
              sub="household employees"
            />
            <StatCard
              icon={<DollarSign className="h-5 w-5" />}
              label="Monthly Payroll"
              value={fmt(totalMonthly)}
              sub="estimated total"
            />
            <StatCard
              icon={<Calendar className="h-5 w-5" />}
              label="Next Payment"
              value={nextPayment ? fmtDate(nextPayment.nextPayDate) : "—"}
              sub={nextPayment?.name ?? ""}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Paid This Month"
              value={fmt(paidThisMonth)}
              sub="total disbursed"
            />
          </div>

          {/* Staff overview */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Staff Overview
              </h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {active.length} active
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {employees.map((emp, idx) => (
                <EmployeeCard
                  key={emp.id}
                  employee={emp}
                  idx={idx}
                  onPay={() => setPayingIdx(idx)}
                />
              ))}
            </div>
          </section>

          {/* Add employee */}
          <AddEmployeePanel onAdd={(emp) => setEmployees((prev) => [...prev, emp])} />

          {/* History */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Payroll History
              </h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {employees.flatMap((e) => e.history).length} records
              </span>
            </div>
            <HistoryTable employees={employees} />
          </section>
        </div>

        {/* Pay modal */}
        {payingIdx !== null && (
          <PayModal
            employee={employees[payingIdx]}
            empIdx={payingIdx}
            onClose={() => setPayingIdx(null)}
            onPaid={handlePaid}
          />
        )}
      </div>
    </div>
  );
}
