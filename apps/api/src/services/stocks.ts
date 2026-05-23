import YahooFinance from "yahoo-finance2";

// v3 is class-based; the default export's static methods are deprecated.
const yahooFinance = new YahooFinance();
// Suppress the noisy survey/historical-RIP notices that print on first call.
yahooFinance._notices.suppress(["yahooSurvey", "ripHistorical"]);

// SAR is pegged to USD at 3.75; we use this fixed rate to convert US-listed
// stock prices into SAR halalas so the wallet math stays in one currency.
const USD_TO_SAR = 3.75;

type WatchlistEntry = {
  symbol: string;
  name: string;
  exchange: "NASDAQ" | "NYSE" | "Tadawul";
  sector: string;
  // Yahoo's native currency for this symbol — what we receive from quote()
  nativeCurrency: "USD" | "SAR";
};

export const WATCHLIST: WatchlistEntry[] = [
  { symbol: "AAPL", name: "Apple", exchange: "NASDAQ", sector: "Technology", nativeCurrency: "USD" },
  { symbol: "MSFT", name: "Microsoft", exchange: "NASDAQ", sector: "Technology", nativeCurrency: "USD" },
  { symbol: "NVDA", name: "NVIDIA", exchange: "NASDAQ", sector: "Semiconductors", nativeCurrency: "USD" },
  { symbol: "TSLA", name: "Tesla", exchange: "NASDAQ", sector: "Automotive", nativeCurrency: "USD" },
  { symbol: "GOOGL", name: "Alphabet", exchange: "NASDAQ", sector: "Technology", nativeCurrency: "USD" },
  { symbol: "AMZN", name: "Amazon", exchange: "NASDAQ", sector: "Consumer", nativeCurrency: "USD" },
  { symbol: "META", name: "Meta Platforms", exchange: "NASDAQ", sector: "Technology", nativeCurrency: "USD" },
  { symbol: "NFLX", name: "Netflix", exchange: "NASDAQ", sector: "Media", nativeCurrency: "USD" },
  { symbol: "2222.SR", name: "Saudi Aramco", exchange: "Tadawul", sector: "Energy", nativeCurrency: "SAR" },
  { symbol: "1120.SR", name: "Al Rajhi Bank", exchange: "Tadawul", sector: "Banking", nativeCurrency: "SAR" },
  { symbol: "1180.SR", name: "Saudi National Bank", exchange: "Tadawul", sector: "Banking", nativeCurrency: "SAR" },
  { symbol: "7010.SR", name: "STC", exchange: "Tadawul", sector: "Telecom", nativeCurrency: "SAR" },
  { symbol: "1211.SR", name: "Ma'aden", exchange: "Tadawul", sector: "Materials", nativeCurrency: "SAR" },
  { symbol: "2010.SR", name: "SABIC", exchange: "Tadawul", sector: "Materials", nativeCurrency: "SAR" },
  { symbol: "2280.SR", name: "Almarai", exchange: "Tadawul", sector: "Consumer", nativeCurrency: "SAR" },
];

const WATCHLIST_BY_SYMBOL = new Map(WATCHLIST.map((e) => [e.symbol, e]));

export type Quote = {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  priceHalalas: number;
  changeHalalas: number;
  changePct: number;
  previousCloseHalalas: number;
  marketState: string;
};

// In-memory quote cache. Yahoo rate-limits aggressively when polled too hard;
// 30 s is enough to give a "live" feel without thrashing them.
const CACHE_TTL_MS = 30_000;
const quoteCache = new Map<string, { quote: Quote; fetchedAt: number }>();

function toHalalas(price: number, native: "USD" | "SAR"): number {
  const sar = native === "USD" ? price * USD_TO_SAR : price;
  return Math.round(sar * 100);
}

export function isWatchlistSymbol(symbol: string): boolean {
  return WATCHLIST_BY_SYMBOL.has(symbol);
}

export function getWatchlistMeta(symbol: string): WatchlistEntry | undefined {
  return WATCHLIST_BY_SYMBOL.get(symbol);
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const now = Date.now();
  const fresh: Quote[] = [];
  const stale: string[] = [];

  for (const sym of symbols) {
    const cached = quoteCache.get(sym);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      fresh.push(cached.quote);
    } else {
      stale.push(sym);
    }
  }

  if (stale.length === 0) return fresh;

  const rawQuotes = await yahooFinance.quote(stale);
  const list = Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes];

  for (const raw of list) {
    const meta = WATCHLIST_BY_SYMBOL.get(raw.symbol);
    if (!meta) continue;
    const price = raw.regularMarketPrice ?? 0;
    const prevClose = raw.regularMarketPreviousClose ?? price;
    const quote: Quote = {
      symbol: raw.symbol,
      name: meta.name,
      exchange: meta.exchange,
      sector: meta.sector,
      priceHalalas: toHalalas(price, meta.nativeCurrency),
      previousCloseHalalas: toHalalas(prevClose, meta.nativeCurrency),
      changeHalalas: toHalalas(price - prevClose, meta.nativeCurrency),
      changePct: raw.regularMarketChangePercent ?? 0,
      marketState: raw.marketState ?? "CLOSED",
    };
    quoteCache.set(raw.symbol, { quote, fetchedAt: now });
    fresh.push(quote);
  }

  return fresh;
}

export async function getQuote(symbol: string): Promise<Quote | null> {
  const [quote] = await getQuotes([symbol]);
  return quote ?? null;
}

export type HistoryPoint = { date: string; closeHalalas: number };

// Yahoo's chart() returns OHLC bars between period1/period2.
// rangeDays: 30 → daily bars for 1M; 90 → 3M; 180 → 6M; 365 → 1Y.
export async function getHistory(symbol: string, rangeDays: number): Promise<HistoryPoint[]> {
  const meta = WATCHLIST_BY_SYMBOL.get(symbol);
  if (!meta) return [];

  const period2 = new Date();
  const period1 = new Date(period2.getTime() - rangeDays * 24 * 60 * 60 * 1000);
  const interval = rangeDays <= 30 ? "1d" : rangeDays <= 180 ? "1d" : "1wk";

  const result = await yahooFinance.chart(symbol, { period1, period2, interval });

  return result.quotes
    .filter((q) => q.close != null)
    .map((q) => ({
      date: q.date.toISOString(),
      closeHalalas: toHalalas(q.close as number, meta.nativeCurrency),
    }));
}
