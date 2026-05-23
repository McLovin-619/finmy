import YahooFinance from "yahoo-finance2";

// v3 is class-based; the default-import static methods are deprecated.
const yahooFinance = new YahooFinance();
yahooFinance._notices.suppress(["yahooSurvey", "ripHistorical"]);

// SAR is pegged to USD at 3.75 — fixed rate keeps wallet math in one currency.
const USD_TO_SAR = 3.75;

type WatchlistEntry = {
  symbol: string;
  name: string;
  exchange: "NASDAQ" | "NYSE" | "Tadawul";
  sector: string;
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

export type HistoryPoint = { date: string; closeHalalas: number };

// Yahoo rate-limits aggressively when polled hard; cache fresh quotes for 30s
// and serve stale entries indefinitely as a fallback when a refresh fails.
const QUOTE_TTL_MS = 30_000;
// History barely moves intraday — 10-min TTL is enough to make sparklines look
// live without hammering Yahoo's chart() endpoint per client.
const HISTORY_TTL_MS = 10 * 60_000;

const quoteCache = new Map<string, { quote: Quote; fetchedAt: number }>();
const historyCache = new Map<string, { history: HistoryPoint[]; fetchedAt: number }>();

function toHalalas(price: number, native: "USD" | "SAR"): number {
  const sar = native === "USD" ? price * USD_TO_SAR : price;
  return Math.round(sar * 100);
}

// reason: yahoo-finance2's Quote union (QuoteEquity, QuoteCryptoCurrency,
// QuoteECNQuote, …) has no shared structural overlap, so narrowing each
// variant before reading regularMarketPrice would be more noise than value.
type RawQuoteLike = {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChangePercent?: number;
  marketState?: string;
};

function buildQuote(raw: RawQuoteLike): Quote | null {
  if (!raw.symbol) return null;
  const meta = WATCHLIST_BY_SYMBOL.get(raw.symbol);
  if (!meta) return null;
  const price = raw.regularMarketPrice ?? 0;
  const prevClose = raw.regularMarketPreviousClose ?? price;
  return {
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
    if (cached && now - cached.fetchedAt < QUOTE_TTL_MS) {
      fresh.push(cached.quote);
    } else {
      stale.push(sym);
    }
  }

  if (stale.length === 0) return fresh;

  try {
    const rawQuotes = await yahooFinance.quote(stale);
    const list = (Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes]) as RawQuoteLike[];
    for (const raw of list) {
      const quote = buildQuote(raw);
      if (!quote) continue;
      quoteCache.set(quote.symbol, { quote, fetchedAt: now });
      fresh.push(quote);
    }
  } catch (err) {
    // Stale-while-revalidate: a transient Yahoo blip shouldn't 503 the whole
    // watchlist. Serve any previously-cached values for the stale symbols.
    console.error("yahoo quote refresh failed, serving stale", err);
    for (const sym of stale) {
      const cached = quoteCache.get(sym);
      if (cached) fresh.push(cached.quote);
    }
  }

  return fresh;
}

export async function getQuote(symbol: string): Promise<Quote | null> {
  const [quote] = await getQuotes([symbol]);
  return quote ?? null;
}

export async function getHistory(symbol: string, rangeDays: number): Promise<HistoryPoint[]> {
  const meta = WATCHLIST_BY_SYMBOL.get(symbol);
  if (!meta) return [];

  const cacheKey = `${symbol}:${rangeDays}`;
  const now = Date.now();
  const cached = historyCache.get(cacheKey);
  if (cached && now - cached.fetchedAt < HISTORY_TTL_MS) return cached.history;

  const period2 = new Date(now);
  const period1 = new Date(now - rangeDays * 24 * 60 * 60 * 1000);
  const interval = rangeDays <= 180 ? "1d" : "1wk";

  try {
    const result = await yahooFinance.chart(symbol, { period1, period2, interval });
    const history: HistoryPoint[] = result.quotes
      .filter((q) => q.close != null)
      .map((q) => ({
        date: q.date.toISOString(),
        closeHalalas: toHalalas(q.close as number, meta.nativeCurrency),
      }));
    historyCache.set(cacheKey, { history, fetchedAt: now });
    return history;
  } catch (err) {
    console.error("yahoo chart refresh failed, serving stale", err);
    return cached?.history ?? [];
  }
}

export type Sparkline = {
  symbol: string;
  name: string;
  exchange: string;
  priceHalalas: number;
  changePct: number;
  history: HistoryPoint[];
};

// Batched feed for the mobile invest tab's spotlight strip — one round-trip
// instead of 15. Reuses both caches so the per-client cost stays flat.
export async function getSparklines(rangeDays: number): Promise<Sparkline[]> {
  const symbols = WATCHLIST.map((w) => w.symbol);
  const [quotes, histories] = await Promise.all([
    getQuotes(symbols),
    Promise.all(symbols.map((s) => getHistory(s, rangeDays))),
  ]);
  const quoteBySymbol = new Map(quotes.map((q) => [q.symbol, q]));
  return symbols.flatMap((symbol, idx) => {
    const q = quoteBySymbol.get(symbol);
    const meta = WATCHLIST_BY_SYMBOL.get(symbol);
    if (!q || !meta) return [];
    return [{
      symbol,
      name: meta.name,
      exchange: meta.exchange,
      priceHalalas: q.priceHalalas,
      changePct: q.changePct,
      history: histories[idx],
    }];
  });
}
