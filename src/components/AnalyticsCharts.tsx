/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, BarChart2, PieChart, Activity, Zap, Layers } from 'lucide-react';
import { ScreenerRun, StockAnalysis } from '../types';

interface ChartsProps {
  runs: ScreenerRun[];
  analyses: StockAnalysis[];
}

export default function AnalyticsCharts({ runs, analyses }: ChartsProps) {
  const [activeTab, setActiveTab] = useState<'trends' | 'persistence' | 'sectors' | 'volume'>('trends');

  // Helper: Get distinct sorted dates and total stocks matching each date
  const totalTradingDays = Array.from(new Set(runs.map(r => r.date))).sort();
  const dailyCounts = totalTradingDays.map(date => {
    const dayRuns = runs.filter(r => r.date === date);
    const uniqueSymbols = new Set(dayRuns.flatMap(r => r.stocks.map(s => s.symbol)));
    return { date, count: uniqueSymbols.size };
  });

  // Data processing: Most recurring stocks (Top 8)
  const topRecurring = [...analyses]
    .sort((a, b) => b.appearanceCount - a.appearanceCount)
    .slice(0, 8);

  // Data processing: Streak Leaders (Top 8)
  const topStreaks = [...analyses]
    .sort((a, b) => b.consecutiveStreak - a.consecutiveStreak)
    .slice(0, 8);

  // Data processing: Sectors and Industries (pie / bento weights)
  const sectorCounts: { [key: string]: number } = {};
  const industryCounts: { [key: string]: number } = {};
  
  analyses.forEach(stock => {
    sectorCounts[stock.sector] = (sectorCounts[stock.sector] || 0) + 1;
    industryCounts[stock.industry] = (industryCounts[stock.industry] || 0) + 1;
  });

  const sortedSectors = Object.entries(sectorCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const sortedIndustries = Object.entries(industryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Data processing: Volume vs Average Volume Leaders
  const volumeLeaders = [...analyses]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 6);

  // Math helpers for SVG plotting
  const maxDailyCount = Math.max(...dailyCounts.map(d => d.count), 5);
  const paddingX = 45;
  const paddingY = 30;
  const chartWidth = 600;
  const chartHeight = 220;

  // Active Tooltip details for interactive nodes
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ x: number; y: number; label: string; val: string | number } | null>(null);

  return (
    <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6 shadow-2xl overflow-hidden">
      {/* Tab Selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#27272a] pb-5 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-150 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Quant Analytics Engine
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Visual intelligence showing anomalies, volume outbreaks, and strategies.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center bg-[#0a0a0c] p-1 rounded-lg border border-[#27272a]">
          {[
            { id: 'trends', label: 'Hit Trends', icon: TrendingUp },
            { id: 'persistence', label: 'Persistence & Streaks', icon: Zap },
            { id: 'sectors', label: 'Sector Distribution', icon: Layers },
            { id: 'volume', label: 'Liquidity Leaders', icon: BarChart2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const IsActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setHoveredDataPoint(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all ${
                  IsActive 
                    ? 'bg-blue-600 text-white shadow-md font-semibold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Chart Portal */}
      <div className="relative min-h-[260px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* Trend Area Chart */}
          {activeTab === 'trends' && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-400">Daily Screener Candidate Yield (Hits Over Time)</span>
                <span className="text-[10px] text-zinc-500">Hover nodes to inspect values</span>
              </div>

              {dailyCounts.length === 0 ? (
                <div className="text-zinc-500 text-center py-16 text-xs">No historical trading data is loaded.</div>
              ) : (
                <div className="relative w-full overflow-x-auto pb-2 scrollbar-thin">
                  <svg className="mx-auto block" width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                     {/* Grids */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
                      const yVal = paddingY + (chartHeight - 2 * paddingY) * (1 - ratio);
                      const displayVal = Math.round(maxDailyCount * ratio);
                      return (
                        <g key={i}>
                          <line 
                            x1={paddingX} 
                            y1={yVal} 
                            x2={chartWidth - paddingX} 
                            y2={yVal} 
                            className="stroke-zinc-800/40" 
                            strokeDasharray="4 4" 
                          />
                          <text 
                            x={paddingX - 10} 
                            y={yVal + 3} 
                            className="fill-zinc-500 text-[10px] font-mono text-right font-medium" 
                            textAnchor="end"
                          >
                            {displayVal}
                          </text>
                        </g>
                      );
                    })}

                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Path plotting */}
                    {(() => {
                      const graphWidth = chartWidth - 2 * paddingX;
                      const graphHeight = chartHeight - 2 * paddingY;
                      const stepX = dailyCounts.length > 1 ? graphWidth / (dailyCounts.length - 1) : graphWidth;

                      const points = dailyCounts.map((d, index) => {
                        const x = paddingX + index * stepX;
                        // Avoid division by zero
                        const y = paddingY + graphHeight * (1 - (d.count / (maxDailyCount || 1)));
                        return { x, y, data: d };
                      });

                      const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                      const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

                      return (
                        <g>
                          {/* Rich area gradient */}
                          <path d={areaD} fill="url(#area-grad)" />
                          {/* Sleek outline line */}
                          <path d={pathD} fill="none" className="stroke-blue-500" strokeWidth="2.5" />

                          {/* Trigger circles */}
                          {points.map((p, idx) => (
                            <circle
                              key={idx}
                              cx={p.x}
                              cy={p.y}
                              r={4}
                              className="fill-[#0a0a0c] stroke-blue-400 cursor-pointer hover:r-6 hover:fill-blue-500 transition-all font-semibold"
                              strokeWidth="2"
                              onMouseEnter={(e) => {
                                setHoveredDataPoint({
                                  x: p.x,
                                  y: p.y - 10,
                                  label: p.data.date,
                                  val: `${p.data.count} hits`
                                });
                              }}
                              onMouseLeave={() => setHoveredDataPoint(null)}
                            />
                          ))}

                          {/* Date Tick Labels */}
                          {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 5)) === 0).map((p, idx) => (
                            <text
                              key={idx}
                              x={p.x}
                              y={chartHeight - paddingY + 18}
                              className="fill-zinc-500 text-[9px] font-mono"
                              textAnchor="middle"
                            >
                              {p.data.date.substring(5)}
                            </text>
                          ))}
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              )}
            </motion.div>
          )}

          {/* Persistence & Streaks Leaderboards */}
          {activeTab === 'persistence' && (
            <motion.div
              key="persistence"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Left Bar Chart: Most Recurring Appearances */}
              <div className="bg-[#0a0a0c]/40 p-4 border border-[#27272a] rounded-lg">
                <span className="text-xs font-semibold text-zinc-350 block mb-3">Top Recurring Stocks (Occurrence Count)</span>
                <div className="space-y-2.5">
                  {topRecurring.map((stock, i) => {
                    const pct = Math.max(3, (stock.appearanceCount / totalTradingDays.length) * 100);
                    return (
                      <div key={stock.symbol} className="flex items-center gap-3 text-xs">
                        <span className="w-12 font-bold font-mono text-zinc-500">{stock.symbol}</span>
                        <div className="flex-1 bg-[#18181b] h-5 rounded overflow-hidden relative flex items-center px-2">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${pct}%` }} 
                            transition={{ duration: 0.8, delay: i * 0.05 }}
                            className="bg-blue-600/20 border-r border-blue-500 h-full absolute left-0 top-0"
                          />
                          <span className="z-10 text-[10px] text-zinc-300 font-mono font-medium">
                            {stock.appearanceCount} days ({Math.round(stock.persistenceScore * 100)}% persistence)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Bar Chart: Streak Leaders */}
              <div className="bg-[#0a0a0c]/40 p-4 border border-[#27272a] rounded-lg">
                <span className="text-xs font-semibold text-zinc-350 block mb-3">Streak Leaders (Current Continuous Weekdays)</span>
                <div className="space-y-2.5">
                  {topStreaks.map((stock, i) => {
                    const maxPossibleStreak = Math.max(...topStreaks.map(s => s.consecutiveStreak), 1);
                    const pct = Math.max(3, (stock.consecutiveStreak / maxPossibleStreak) * 100);
                    return (
                      <div key={stock.symbol} className="flex items-center gap-3 text-xs">
                        <span className="w-12 font-bold font-mono text-zinc-500">{stock.symbol}</span>
                        <div className="flex-1 bg-[#18181b] h-5 rounded overflow-hidden relative flex items-center px-2">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${pct}%` }} 
                            transition={{ duration: 0.8, delay: i * 0.05 }}
                            className="bg-sky-500/20 border-r border-sky-400 h-full absolute left-0 top-0"
                          />
                          <span className="z-10 text-[10px] text-zinc-300 font-mono font-medium flex items-center gap-1">
                            {stock.consecutiveStreak} day streak {stock.consecutiveStreak === stock.longestStreak && <span className="text-[8px] bg-[#18181b] text-sky-400 px-1 rounded border border-[#27272a]">All-Time Max</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Sector and Industry Weights */}
          {activeTab === 'sectors' && (
            <motion.div
              key="sectors"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Sector Weighting lists */}
              <div className="bg-[#0a0a0c]/40 p-4 border border-[#27272a] rounded-lg">
                <span className="text-xs font-semibold text-zinc-350 flex items-center justify-between mb-3.5">
                  <span>Sector Allocation Density</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{sortedSectors.length} distinct sectors</span>
                </span>
                <div className="space-y-3">
                  {sortedSectors.map((sec, i) => {
                    const totalSecVal = sortedSectors.reduce((acc, curr) => acc + curr.value, 0);
                    const pct = Math.round((sec.value / totalSecVal) * 100);
                    return (
                      <div key={sec.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400 font-medium">{sec.name}</span>
                          <span className="text-zinc-300 font-semibold font-mono">{sec.value} hit{sec.value > 1 ? 's' : ''} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6 }}
                            className="bg-blue-500 h-full rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leading Screener Industries */}
              <div className="bg-[#0a0a0c]/40 p-4 border border-[#27272a] rounded-lg">
                <span className="text-xs font-semibold text-zinc-350 flex items-center justify-between mb-3.5">
                  <span>Hot Screened Industries</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Top 8 niches</span>
                </span>
                <div className="grid grid-cols-2 gap-3.5">
                  {sortedIndustries.map((ind, i) => (
                    <div key={ind.name} className="bg-[#141416] border border-[#27272a] p-2.5 rounded hover:border-zinc-700 transition-all">
                      <div className="text-[10px] text-zinc-500 truncate" title={ind.name}>{ind.name}</div>
                      <div className="text-sm font-semibold text-zinc-200 mt-1 flex items-baseline gap-1.5">
                        {ind.value}
                        <span className="text-[9px] font-normal text-zinc-400">appearances</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Volume vs Average Volume Comparison */}
          {activeTab === 'volume' && (
            <motion.div
              key="volume"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-350">Volume Surge Leaderboards (Active Volume vs. Normal Average)</span>
                <span className="text-[10px] flex items-center gap-3">
                  <span className="flex items-center gap-1 text-blue-400 font-medium">● Act Vol</span>
                  <span className="flex items-center gap-1 text-zinc-550 font-medium font-semibold">● Avg Vol</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {volumeLeaders.map((stock, i) => {
                  const highVal = Math.max(stock.volume, stock.avgVolume);
                  const activePct = (stock.volume / highVal) * 100;
                  const avgPct = (stock.avgVolume / highVal) * 100;
                  
                  return (
                    <div key={stock.symbol} className="bg-[#0a0a0c]/60 border border-[#27272a] p-3.5 rounded-lg flex flex-col justify-between hover:border-zinc-700 transition">
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="font-bold text-zinc-200 text-sm font-mono">{stock.symbol}</span>
                        <div className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#141416] border border-[#27272a] text-blue-400 font-semibold">
                          Rvol: {stock.relativeVolume}x
                        </div>
                      </div>
                      
                      {/* Side-by-side volume cylinders */}
                      <div className="space-y-1.5 pb-2">
                        {/* Active Volume bar */}
                        <div>
                          <p className="text-[9px] text-zinc-500 font-mono flex justify-between">
                            <span>Active:</span>
                            <span>{(stock.volume / 1e6).toFixed(1)}M</span>
                          </p>
                          <div className="h-2 w-full bg-[#18181b] rounded-sm overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${activePct}%` }} 
                              className="h-full bg-blue-500/80" 
                            />
                          </div>
                        </div>

                        {/* Avg Volume bar */}
                        <div>
                          <p className="text-[9px] text-zinc-500 font-mono flex justify-between">
                            <span>30D Avg:</span>
                            <span>{(stock.avgVolume / 1e6).toFixed(1)}M</span>
                          </p>
                          <div className="h-1.5 w-full bg-[#18181b] rounded-sm overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${avgPct}%` }} 
                              className="h-full bg-zinc-650" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Chart Node Hover Tooltip */}
        {hoveredDataPoint && (
          <div 
            className="absolute z-50 bg-[#0a0a0c]/95 border border-blue-500 p-2.5 rounded shadow-xl text-[11px] font-mono pointer-events-none text-zinc-200"
            style={{ 
              left: hoveredDataPoint.x - 45, 
              top: hoveredDataPoint.y - 45
            }}
          >
            <p className="text-[9px] text-zinc-400">{hoveredDataPoint.label}</p>
            <p className="font-bold mt-0.5 text-blue-400">{hoveredDataPoint.val}</p>
          </div>
        )}
      </div>
    </div>
  );
}
