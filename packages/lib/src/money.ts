// Money is always integer minor units (halalas for SAR) + currency code.
// Never float. Currency always travels with the amount.
export type Money = {
  amount: number; // integer minor units, e.g. 4523000 = SAR 45,230.00
  currency: string; // ISO 4217, e.g. "SAR"
};

export function formatMoney({ amount, currency }: Money): string {
  const major = amount / 100;
  const [int, dec] = major.toFixed(2).split(".");
  const formatted = (int ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency} ${formatted}.${dec ?? "00"}`;
}

export function sarMinorUnits(riyals: number): Money {
  return { amount: Math.round(riyals * 100), currency: "SAR" };
}

export function formatHalalasSar(halalas: number, decimals = 2): string {
  return (halalas / 100).toLocaleString("en-SA", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
