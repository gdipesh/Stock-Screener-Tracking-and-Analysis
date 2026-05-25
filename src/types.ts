/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Screener Strategy Definition
export interface Screener {
  id: string;
  name: string;
  description: string;
  filters: string;
  color: string; // Theme accent color (e.g. 'emerald', 'sky', 'amber')
}

// Raw Stock Record collected on a specific date for a specific screener
export interface StockRecord {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  relativeVolume: number;
  marketCap: number;
  rsi: number | null;
  dateCollected: string; // YYYY-MM-DD
  screenerName: string;
}

// Single daily run containing all records from a specific screener strategy
export interface ScreenerRun {
  id: string; // e.g., "run-2026-05-25-momentum"
  date: string; // YYYY-MM-DD
  screenerId: string;
  stocks: StockRecord[];
}

// Aggregated/Calculated metrics for a single stock across all historical dates
export interface StockAnalysis {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  price: number; // Last recorded price
  changePercent: number; // Last recorded change
  volume: number; // Last recorded volume
  avgVolume: number; // Last recorded avg volume
  relativeVolume: number; // Last recorded relative volume
  marketCap: number; // Last recorded market cap
  rsi: number | null; // Last recorded RSI
  
  // Historical stats
  appearanceCount: number;
  consecutiveStreak: number; // Current continuous daily streak (active today/last date)
  longestStreak: number; // Historical longest consecutive run
  persistenceScore: number; // Total Appearances / Total Trading Days of recordings
  firstAppearance: string; // Date (YYYY-MM-DD)
  lastAppearance: string; // Date (YYYY-MM-DD)
  screenersDetected: string[]; // Screeners that have captured this stock
  
  // Scoring & Conviction
  rankingScore: number; // Calculated conviction level out of 100
  signalCategory: 'Strong Candidate' | 'Watch List' | 'Losing Momentum';
  
  // Trend timelines of price & relative volume for detailing
  history: {
    date: string;
    price: number;
    changePercent: number;
    volume: number;
    relativeVolume: number;
    screenerName: string;
  }[];
}

// Metadata summary stats for a chosen focal date (typically "Today")
export interface DashboardSummary {
  focalDate: string;
  totalStocksToday: number;
  recurringStocksCount: number;
  newStocksCount: number;
  droppedStocksCount: number;
  strongestStreak: {
    symbol: string;
    streak: number;
  } | null;
  topRankedStock: {
    symbol: string;
    score: number;
  } | null;
}

// Qualitative custom notes/watchlist records kept by user
export interface StockUserNote {
  symbol: string;
  notes: string;
  updatedAt: string;
  status: 'watch' | 'buy' | 'sell' | 'neutral';
}
