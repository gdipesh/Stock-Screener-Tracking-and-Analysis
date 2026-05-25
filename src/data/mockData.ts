/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Screener, StockRecord, ScreenerRun } from '../types';

// Initial default supported screeners
export const DEFAULT_SCREENERS: Screener[] = [
  {
    id: 'momentum',
    name: 'Momentum Strategy',
    description: 'Tracks stocks making higher highs with positive RSI levels (> 60) and rising price trend.',
    filters: 'Price > SMA(50), RSI(14) > 60, Daily Change % > 1.5%',
    color: 'emerald'
  },
  {
    id: 'breakout',
    name: 'Breakout Strategy',
    description: 'Identifies high volume surges breaking above critical resistance boundaries and key levels.',
    filters: 'Relative Volume > 2.0, Price > 20-Day High, Volume > 1M',
    color: 'indigo'
  },
  {
    id: 'growth',
    name: 'Growth Strategy',
    description: 'Scans for mid-to-large cap growth operators displaying consistent margin expansion and market participation.',
    filters: 'Market Cap > $5B, EPS Growth Q/Q > 15%, Relative Volume > 1.0',
    color: 'sky'
  },
  {
    id: 'swing',
    name: 'Swing Trading Strategy',
    description: 'Spots oversold retracements in structurally strong trends reverting back to mean moving averages.',
    filters: 'RSI(14) < 40, Price > SMA(200), Support Level Retrace',
    color: 'amber'
  }
];

// Seed stock definitions for realistic sector/industry simulation
interface SeedStock {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  basePrice: number;
  baseVolume: number;
  screenerAffinities: { [screenerId: string]: number }; // Probability weights (0 to 1)
}

const SEED_STOCKS: SeedStock[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Technology',
    industry: 'Semiconductors',
    basePrice: 124.50,
    baseVolume: 42000000,
    screenerAffinities: { momentum: 0.9, breakout: 0.7, growth: 0.8 }
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices, Inc.',
    sector: 'Technology',
    industry: 'Semiconductors',
    basePrice: 168.20,
    baseVolume: 18000000,
    screenerAffinities: { momentum: 0.8, breakout: 0.5, growth: 0.7 }
  },
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies Inc.',
    sector: 'Technology',
    industry: 'Software - Application',
    basePrice: 27.80,
    baseVolume: 25000000,
    screenerAffinities: { momentum: 0.85, breakout: 0.8, growth: 0.9 }
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    basePrice: 184.25,
    baseVolume: 52000000,
    screenerAffinities: { momentum: 0.5, breakout: 0.3, growth: 0.6 }
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    basePrice: 415.60,
    baseVolume: 19000000,
    screenerAffinities: { momentum: 0.6, breakout: 0.3, growth: 0.8 }
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    basePrice: 178.40,
    baseVolume: 82000000,
    screenerAffinities: { momentum: 0.45, breakout: 0.6, growth: 0.4 }
  },
  {
    symbol: 'CELH',
    name: 'Celsius Holdings, Inc.',
    sector: 'Consumer Defensive',
    industry: 'Beverages - Non-Alcoholic',
    basePrice: 62.10,
    baseVolume: 4500000,
    screenerAffinities: { momentum: 0.7, breakout: 0.75, growth: 0.8 }
  },
  {
    symbol: 'LLY',
    name: 'Eli Lilly and Company',
    sector: 'Healthcare',
    industry: 'Drug Manufacturers - General',
    basePrice: 742.30,
    baseVolume: 3200000,
    screenerAffinities: { momentum: 0.8, breakout: 0.4, growth: 0.85 }
  },
  {
    symbol: 'XOM',
    name: 'Exxon Mobil Corporation',
    sector: 'Energy',
    industry: 'Oil & Gas Integrated',
    basePrice: 112.40,
    baseVolume: 12000000,
    screenerAffinities: { momentum: 0.4, breakout: 0.3, growth: 0.3, swing: 0.6 }
  },
  {
    symbol: 'COIN',
    name: 'Coinbase Global, Inc.',
    sector: 'Financial Services',
    industry: 'Capital Markets',
    basePrice: 216.50,
    baseVolume: 11000000,
    screenerAffinities: { momentum: 0.85, breakout: 0.9, growth: 0.6 }
  },
  {
    symbol: 'SHOP',
    name: 'Shopify Inc.',
    sector: 'Technology',
    industry: 'Software - Application',
    basePrice: 74.80,
    baseVolume: 8500000,
    screenerAffinities: { momentum: 0.65, breakout: 0.5, growth: 0.75 }
  },
  {
    symbol: 'HOOD',
    name: 'Robinhood Markets, Inc.',
    sector: 'Financial Services',
    industry: 'Capital Markets',
    basePrice: 18.90,
    baseVolume: 14000000,
    screenerAffinities: { momentum: 0.75, breakout: 0.8, growth: 0.5 }
  },
  {
    symbol: 'SMCI',
    name: 'Super Micro Computer, Inc.',
    sector: 'Technology',
    industry: 'Computer Hardware',
    basePrice: 840.00,
    baseVolume: 9000000,
    screenerAffinities: { momentum: 0.9, breakout: 0.85, growth: 0.95 }
  },
  {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    sector: 'Technology',
    industry: 'Internet Content & Information',
    basePrice: 472.90,
    baseVolume: 16000000,
    screenerAffinities: { momentum: 0.7, breakout: 0.5, growth: 0.75 }
  },
  {
    symbol: 'COST',
    name: 'Costco Wholesale Corporation',
    sector: 'Consumer Defensive',
    industry: 'Discount Stores',
    basePrice: 715.00,
    baseVolume: 2100000,
    screenerAffinities: { momentum: 0.6, breakout: 0.3, growth: 0.65 }
  },
  {
    symbol: 'GPV',
    name: 'GreenPower Motor Company Inc.',
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    basePrice: 1.85,
    baseVolume: 350000,
    screenerAffinities: { momentum: 0.2, breakout: 0.45, growth: 0.1, swing: 0.8 }
  },
  {
    symbol: 'RIVN',
    name: 'Rivian Automotive, Inc.',
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    basePrice: 10.45,
    baseVolume: 22000000,
    screenerAffinities: { momentum: 0.3, breakout: 0.5, growth: 0.2, swing: 0.7 }
  },
  {
    symbol: 'NET',
    name: 'Cloudflare, Inc.',
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    basePrice: 91.20,
    baseVolume: 4200000,
    screenerAffinities: { momentum: 0.7, breakout: 0.6, growth: 0.8 }
  },
  {
    symbol: 'UNH',
    name: 'UnitedHealth Group Incorporated',
    sector: 'Healthcare',
    industry: 'Healthcare Plans',
    basePrice: 512.50,
    baseVolume: 3500000,
    screenerAffinities: { momentum: 0.4, breakout: 0.2, growth: 0.5, swing: 0.65 }
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Financial Services',
    industry: 'Banks - Diversified',
    basePrice: 194.80,
    baseVolume: 9500000,
    screenerAffinities: { momentum: 0.55, breakout: 0.3, growth: 0.4 }
  }
];

// Helper to generate the last N weekday date strings (excluding weekends) up to current local date
export function generateTradingDays(count: number, endDateStr: string): string[] {
  const dates: string[] = [];
  let current = new Date(endDateStr);
  
  while (dates.length < count) {
    const day = current.getUTCDay();
    // Exclude Sunday (0) and Saturday (6)
    if (day !== 0 && day !== 6) {
      dates.push(current.toISOString().split('T')[0]);
    }
    // Step backwards 1 day
    current.setUTCDate(current.getUTCDate() - 1);
  }
  
  return dates.reverse(); // Standard chronological order (oldest first)
}

// Generates logical historical screener runs
export function generateMockHistoricalData(): ScreenerRun[] {
  // Use 24 trading days. The last day is May 25, 2026 (the current focal date)
  const tradingDays = generateTradingDays(24, '2026-05-25');
  const runs: ScreenerRun[] = [];

  tradingDays.forEach((date, dateIndex) => {
    // Determine a global drift factor for prices over the timeline to show growth/decline
    const globalTrend = Math.sin(dateIndex * 0.2) * 0.05 + (dateIndex * 0.008); 

    DEFAULT_SCREENERS.forEach((screener) => {
      const runStocks: StockRecord[] = [];

      SEED_STOCKS.forEach((seed) => {
        // Find likelihood of matching this screener
        let affinity = seed.screenerAffinities[screener.id] || 0.15;
        
        // Let's create intentional breakout patterns & streaks
        // AMD & NVDA have very persistent streaks on momentum
        if (seed.symbol === 'AMD' && screener.id === 'momentum') {
          // Keep it on continuously except for 2 specific days
          const skipDays = [4, 11];
          if (skipDays.includes(dateIndex)) affinity = 0;
          else affinity = 1.0;
        }
        if (seed.symbol === 'NVDA' && screener.id === 'momentum') {
          // Excellent consecutive streak towards the end
          if (dateIndex >= 8) affinity = 1.0;
        }
        if (seed.symbol === 'PLTR' && screener.id === 'breakout') {
          // Breakout triggers sequentially around days 14-22
          if (dateIndex >= 12 && dateIndex <= 21) affinity = 1.0;
        }
        if (seed.symbol === 'CELH' && screener.id === 'growth') {
          // Early appearances, then disappears (dropped stock demonstration)
          if (dateIndex <= 10) affinity = 0.9;
          else affinity = 0.05;
        }
        if (seed.symbol === 'COIN' && screener.id === 'breakout') {
          // Triggers high momentum indicators
          if (dateIndex % 3 === 0) affinity = 0.9;
        }

        // Random check with affinity weight
        const rand = Math.random();
        if (rand < affinity) {
          // Base walk calculation
          const priceMultiplier = 1 + globalTrend + (Math.sin(dateIndex + seed.symbol.charCodeAt(0)) * 0.03);
          const currentPrice = parseFloat((seed.basePrice * priceMultiplier).toFixed(2));
          
          // Generate realistic momentum % change
          const randomChangeSign = (Math.random() > 0.45) ? 1 : -1;
          const randomChange = parseFloat((randomChangeSign * Math.random() * 4.2).toFixed(2));
          
          // Scaled volumes
          const volMultiplier = (screener.id === 'breakout') ? (2.0 + Math.random() * 2.5) : (0.8 + Math.random() * 1.2);
          const volume = Math.round(seed.baseVolume * volMultiplier);
          const avgVolume = seed.baseVolume;
          const relativeVolume = parseFloat(volMultiplier.toFixed(2));
          
          // Calculate realistic RSI
          let rsiValue = Math.round(55 + (randomChange * 4) + (Math.sin(dateIndex) * 10));
          if (screener.id === 'swing') {
            rsiValue = Math.round(28 + (Math.sin(dateIndex) * 8));
          }
          rsiValue = Math.max(15, Math.min(92, rsiValue));

          const marketCapInB = parseFloat(((seed.basePrice * seed.baseVolume * 15 / 1e9) * priceMultiplier).toFixed(2));

          runStocks.push({
            symbol: seed.symbol,
            name: seed.name,
            sector: seed.sector,
            industry: seed.industry,
            price: currentPrice,
            changePercent: randomChange,
            volume: volume,
            avgVolume: avgVolume,
            relativeVolume: relativeVolume,
            marketCap: marketCapInB,
            rsi: rsiValue,
            dateCollected: date,
            screenerName: screener.name
          });
        }
      });

      if (runStocks.length > 0) {
        runs.push({
          id: `run-${date}-${screener.id}`,
          date: date,
          screenerId: screener.id,
          stocks: runStocks
        });
      }
    });
  });

  return runs;
}
