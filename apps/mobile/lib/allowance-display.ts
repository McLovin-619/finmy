export type AllowanceFrequency = "daily" | "weekly" | "monthly";
export type AllowanceRelation = "Son" | "Daughter" | "Staff" | "Other";
export type AllowanceStatus = "active" | "paused";

export type ApiAllowance = {
  id: string;
  name: string;
  relation: "son" | "daughter" | "staff" | "other";
  targetIbanOrPhone: string;
  amountSar: number;
  frequency: AllowanceFrequency;
  nextPayoutDate: string;
  isActive: boolean;
  totalSentSar: number;
  createdAt: string;
};

export type Allowance = {
  id: string;
  name: string;
  relation: AllowanceRelation;
  initials: string;
  color: string;
  handle: string;
  amountSar: number;
  frequency: AllowanceFrequency;
  dayLabel: string;
  status: AllowanceStatus;
  totalSentSar: number;
};

export const RELATION_COLORS: Record<AllowanceRelation, string> = {
  Son: "#7C3AED",
  Daughter: "#EC4899",
  Staff: "#10B981",
  Other: "#6B7280",
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getDayLabel(freq: AllowanceFrequency, nextPayoutDate: string): string {
  const d = new Date(nextPayoutDate);
  if (freq === "daily") return "Every day";
  if (freq === "weekly") {
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `Every ${names[d.getDay()]}`;
  }
  const day = d.getDate();
  const suffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th";
  return `${day}${suffix} of every month`;
}

export function toDisplay(a: ApiAllowance): Allowance {
  const rel = (a.relation.charAt(0).toUpperCase() + a.relation.slice(1)) as AllowanceRelation;
  return {
    id: a.id,
    name: a.name,
    relation: rel,
    initials: getInitials(a.name),
    color: RELATION_COLORS[rel],
    handle: a.targetIbanOrPhone,
    amountSar: a.amountSar,
    frequency: a.frequency,
    dayLabel: getDayLabel(a.frequency, a.nextPayoutDate),
    status: a.isActive ? "active" : "paused",
    totalSentSar: a.totalSentSar,
  };
}
