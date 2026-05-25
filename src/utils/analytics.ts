/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScreenerRun, StockRecord, StockAnalysis, DashboardSummary } from '../types';

/**
 * Perform complete quantitative aggregation on raw historical runs.
 * Returns an enriched collection of StockAnalysis datasets.
 */
export function aggregateScreenerData(runs: ScreenerRun[]): StockAnalysis[] {
  if (runs.length === 0) return [];

  // Extract all unique dates where we have screener recordings, sorted oldest to newest
  const allTradingDays = Array.from(new Set(runs.map(r => r.date))).sort();

  // Map to group raw occurrences by stock symbol
  const symbolMap = new Map<string, StockRecord[]>();
  
  // Track screener names that captured each symbol by date
  const symbolScreenerMap = new Map<string, Map<string, Set<string>>>(); // Symbol -> Date -> Screener Set

  runs.forEach(run => {
    run.stocks.forEach(stock => {
      // Group structures
      if (!symbolMap.has(stock.symbol)) {
        symbolMap.set(stock.symbol, []);
      }
      symbolMap.get(stock.symbol)!.push(stock);

      // Log screeners by date
      if (!symbolScreenerMap.has(stock.symbol)) {
        symbolScreenerMap.set(stock.symbol, new Map());
      }
      const dateMap = symbolScreenerMap.get(stock.symbol)!;
      if (!dateMap.has(stock.dateCollected)) {
        dateMap.set(stock.dateCollected, new Set());
      }
      dateMap.get(stock.dateCollected)!.add(stock.screenerName);
    });
  });

  const analyses: StockAnalysis[] = [];

  symbolMap.forEach((records, symbol) => {
    // Sort appearances chronologically to track trendline development
    const chronologicalRecords = [...records].sort((a, b) => 
      a.dateCollected.localeCompare(b.dateCollected)
    );

    const lastRecord = chronologicalRecords[chronologicalRecords.length - 1];
    
    // Calculate appearance dates
    const appearanceDates = Array.from(new Set(chronologicalRecords.map(r => r.dateCollected))).sort();
    const appearanceCount = appearanceDates.length;

    // First and last detection dates
    const firstAppearance = appearanceDates[0];
    const lastAppearance = appearanceDates[appearanceDates.length - 1];

    // Calculate Persistence Score
    const persistenceScore = parseFloat((appearanceCount / allTradingDays.length).toFixed(4));

    // Calculate long-term streaks: current and longest peak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Find the current streak: starting from index of lastAppearance in allTradingDays, 
    // walk backwards to see if they are consecutive
    const lastSeenIndex = allTradingDays.indexOf(lastAppearance);
    const mostRecentDate = allTradingDays[allTradingDays.length - 1];
    
    // Check if the stock appeared recently (usually today, or the trading day right before to keep active streaks showing)
    const isRecentlyActive = (lastAppearance === mostRecentDate) || 
                             (lastSeenIndex >= allTradingDays.length - 2);

    if (isRecentlyActive) {
      // Walk backwards from lastSeenIndex
      let walkIndex = lastSeenIndex;
      while (walkIndex >= 0) {
        const checkDate = allTradingDays[walkIndex];
        if (appearanceDates.includes(checkDate)) {
          currentStreak++;
          walkIndex--;
        } else {
          break; // Streak broken
        }
      }
    } else {
      currentStreak = 0; // Streak died
    }

    // Calculate longest streak in entire history
    allTradingDays.forEach(date => {
      if (appearanceDates.includes(date)) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    });

    // Find all screeners detecting this stock overall
    const screenersDetected = Array.from(
      new Set(chronologicalRecords.map(r => r.screenerName))
    );

    // Identify screeners active on last appearance date
    const lastSeenScreeners = symbolScreenerMap.get(symbol)?.get(lastAppearance) || new Set<string>();

    // CONVICTION LEVEL RANKING SCORE CALCULATION
    let score = 0;

    // 1. Persistence weight (30 pts max)
    score += persistenceScore * 30;

    // 2. Continuous Streak weight (20 pts max)
    score += Math.min(currentStreak * 4, 20);

    // 3. Relative volume weight on last hit (15 pts max)
    const rvol = lastRecord.relativeVolume;
    if (rvol >= 2.5) score += 15;
    else if (rvol >= 1.5) score += 10;
    else if (rvol >= 1.0) score += 5;

    // 4. Price Momentum on last hit (15 pts max)
    const change = lastRecord.changePercent;
    if (change >= 5.0) score += 15;
    else if (change >= 2.0) score += 10;
    else if (change >= 0.0) score += 5;

    // 5. Multi-screener synergy on last seen date (20 pts max)
    const screenerOverlapCount = lastSeenScreeners.size;
    if (screenerOverlapCount >= 3) score += 20;
    else if (screenerOverlapCount === 2) score += 15;

    // Limit score to bounds
    const rankingScore = Math.max(0, Math.min(100, Math.round(score)));

    // Categorize
    let signalCategory: 'Strong Candidate' | 'Watch List' | 'Losing Momentum' = 'Watch List';
    if (rankingScore >= 65) {
      signalCategory = 'Strong Candidate';
    } else if (rankingScore < 35 || currentStreak === 0 && persistenceScore > 0.4) {
      // Highly persistent stock whose streak broken or weak scoring is losing momentum
      signalCategory = 'Losing Momentum';
    } else {
      signalCategory = 'Watch List';
    }

    // Capture trend timeline
    const history = chronologicalRecords.map(rec => ({
      date: rec.dateCollected,
      price: rec.price,
      changePercent: rec.changePercent,
      volume: rec.volume,
      relativeVolume: rec.relativeVolume,
      screenerName: rec.screenerName
    }));

    analyses.push({
      symbol,
      name: lastRecord.name,
      sector: lastRecord.sector,
      industry: lastRecord.industry,
      price: lastRecord.price,
      changePercent: lastRecord.changePercent,
      volume: lastRecord.volume,
      avgVolume: lastRecord.avgVolume,
      relativeVolume: lastRecord.relativeVolume,
      marketCap: lastRecord.marketCap,
      rsi: lastRecord.rsi,
      appearanceCount,
      consecutiveStreak: currentStreak,
      longestStreak,
      persistenceScore,
      firstAppearance,
      lastAppearance,
      screenersDetected,
      rankingScore,
      signalCategory,
      history
    });
  });

  return analyses;
}

/**
 * Computes high-level comparative metrics for a target focal date (e.g. "Today")
 */
export function calculateDashboardSummary(runs: ScreenerRun[], analyses: StockAnalysis[], targetDate: string): DashboardSummary {
  // Sort distinct trading days in chronological order
  const allTradingDays = Array.from(new Set(runs.map(r => r.date))).sort();
  const dateIndex = allTradingDays.indexOf(targetDate);
  const prevDate = dateIndex > 0 ? allTradingDays[dateIndex - 1] : null;

  // Active unique stocks on target date
  const targetDateRuns = runs.filter(r => r.date === targetDate);
  const targetStocks = Array.from(new Set(
    targetDateRuns.flatMap(r => r.stocks.map(s => s.symbol))
  ));

  // Previous day unique stocks
  const prevDateRuns = prevDate ? runs.filter(r => r.date === prevDate) : [];
  const prevStocks = Array.from(new Set(
    prevDateRuns.flatMap(r => r.stocks.map(s => s.symbol))
  ));

  // Historic unique stocks appearing strictly before targetDate
  const priorRuns = runs.filter(r => r.date.localeCompare(targetDate) < 0);
  const priorUniqueStocks = new Set(priorRuns.flatMap(r => r.stocks.map(s => s.symbol)));

  // Categorize target day's stock list
  let recurringCount = 0;
  let newCount = 0;

  targetStocks.forEach(symbol => {
    if (priorUniqueStocks.has(symbol)) {
      recurringCount++;
    } else {
      newCount++;
    }
  });

  // Dropped stocks: appeared yesterday, but failed to qualify today
  let droppedCount = 0;
  prevStocks.forEach(symbol => {
    if (!targetStocks.includes(symbol)) {
      droppedCount++;
    }
  });

  // Strongest current consecutive streak among active today's stocks
  let strongestStreak: { symbol: string; streak: number } | null = null;
  // Highest scoring active stock today
  let topRankedStock: { symbol: string; score: number } | null = null;

  const targetAnalyses = analyses.filter(an => targetStocks.includes(an.symbol));

  targetAnalyses.forEach(an => {
    if (!strongestStreak || an.consecutiveStreak > strongestStreak.streak) {
      strongestStreak = { symbol: an.symbol, streak: an.consecutiveStreak };
    }
    if (!topRankedStock || an.rankingScore > topRankedStock.score) {
      topRankedStock = { symbol: an.symbol, score: an.rankingScore };
    }
  });

  return {
    focalDate: targetDate,
    totalStocksToday: targetStocks.length,
    recurringStocksCount: recurringCount,
    newStocksCount: newCount,
    droppedStocksCount: droppedCount,
    strongestStreak,
    topRankedStock
  };
}
