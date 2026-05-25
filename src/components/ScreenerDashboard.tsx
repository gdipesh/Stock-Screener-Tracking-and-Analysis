/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Search, ShieldAlert, BadgeCheck, AlertCircle, Play, TrendingUp, Calendar, ChevronDown, 
  ChevronUp, Grid, Filter, RefreshCw, BarChart3, Layers, Clock, Settings
} from 'lucide-react';
import { Screener, ScreenerRun, StockAnalysis, DashboardSummary, StockUserNote } from '../types';
import { calculateDashboardSummary } from '../utils/analytics';

interface ScreenProps {
  screeners: Screener[];
  runs: ScreenerRun[];
  analyses: StockAnalysis[];
  userNotes: StockUserNote[];
  onSelectStock: (symbol: string) => void;
  activeDate: string;
  onActiveDateChange: (date: string) => void;
}

export default function ScreenerDashboard({
  screeners,
  runs,
  analyses,
  userNotes,
  onSelectStock,
  activeDate,
  onActiveDateChange
}: ScreenProps) {
  // Navigation / Search options
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'recurring' | 'streak2' | 'streak3' | 'candidates'>('all');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedScreenerFilter, setSelectedScreenerFilter] = useState('ALL');
  
  // Sorting options
  const [sortBy, setSortBy] = useState<'volume' | 'relativeVolume' | 'appearances' | 'streak' | 'score' | 'changePercent' | 'price'>('volume');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Multi-day calendar of actual recorded trading days
  const distinctTradingDays = useMemo(() => {
    return Array.from(new Set(runs.map(r => r.date))).sort().reverse(); // Newest first
  }, [runs]);

  // Handle automatic select of date if activeDate gets lost
  const safeActiveDate = useMemo(() => {
    if (distinctTradingDays.length === 0) return '';
    if (distinctTradingDays.includes(activeDate)) return activeDate;
    return distinctTradingDays[0];
  }, [distinctTradingDays, activeDate]);

  // Compute stats telemetry specifically for safeActiveDate
  const statsSummary: DashboardSummary | null = useMemo(() => {
    if (!safeActiveDate || runs.length === 0 || analyses.length === 0) return null;
    return calculateDashboardSummary(runs, analyses, safeActiveDate);
  }, [runs, analyses, safeActiveDate]);

  // Extract active unique stock symbols present on safeActiveDate
  const activeSymbolsToday = useMemo(() => {
    if (!safeActiveDate) return [];
    const focalRuns = runs.filter(r => r.date === safeActiveDate);
    return Array.from(new Set(focalRuns.flatMap(r => r.stocks.map(s => s.symbol))));
  }, [runs, safeActiveDate]);

  // Select Sector options list
  const sectorOptions = useMemo(() => {
    const list = new Set<string>();
    analyses.forEach(s => {
      if (s.sector) list.add(s.sector);
    });
    return ['ALL', ...Array.from(list).sort()];
  }, [analyses]);

  // Create list of processed StockAnalysis results available for the active focal date
  const listData = useMemo(() => {
    // We display stocks that appeared TODAY (if viewing today's run) or ALL stocks historical overall
    // Filter down primarily to symbols active on focal date
    const todayAnalyses = analyses.filter(an => activeSymbolsToday.includes(an.symbol));
    
    return todayAnalyses.map(an => {
      // Find the specific record for today to obtain active day stats
      const todayRecord = runs
        .filter(r => r.date === safeActiveDate)
        .flatMap(r => r.stocks)
        .find(s => s.symbol === an.symbol);

      return {
        ...an,
        // Override dynamic daily values in table with specific day values for time travel matching accuracy!
        price: todayRecord?.price ?? an.price,
        changePercent: todayRecord?.changePercent ?? an.changePercent,
        volume: todayRecord?.volume ?? an.volume,
        relativeVolume: todayRecord?.relativeVolume ?? an.relativeVolume,
        rsi: todayRecord?.rsi ?? an.rsi,
        screenerName: todayRecord?.screenerName ?? an.screenersDetected[0]
      };
    });
  }, [analyses, activeSymbolsToday, runs, safeActiveDate]);

  // Apply filters: Search + Quick filters + Sector/Strategy dropdowns
  const filteredListData = useMemo(() => {
    return listData.filter(stock => {
      // 1. Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = stock.symbol.toLowerCase().includes(searchLower) ||
                          stock.name.toLowerCase().includes(searchLower) ||
                          stock.sector.toLowerCase().includes(searchLower) ||
                          stock.industry.toLowerCase().includes(searchLower);
      if (!matchSearch) return false;

      // 2. Sector filter
      if (selectedSector !== 'ALL' && stock.sector !== selectedSector) return false;

      // 3. Strategy filter
      if (selectedScreenerFilter !== 'ALL' && !stock.screenersDetected.includes(selectedScreenerFilter)) return false;

      // 4. Quick filter tabs
      if (statsSummary) {
        const priorRuns = runs.filter(r => r.date.localeCompare(safeActiveDate) < 0);
        const uniquePriorSymbols = new Set(priorRuns.flatMap(r => r.stocks.map(s => s.symbol)));

        if (activeFilter === 'new') {
          // New today: Has not appeared prior to safeActiveDate
          if (uniquePriorSymbols.has(stock.symbol)) return false;
        }
        if (activeFilter === 'recurring') {
          // Recurring: Has appeared previously
          if (!uniquePriorSymbols.has(stock.symbol)) return false;
        }
        if (activeFilter === 'streak2' && stock.consecutiveStreak < 2) return false;
        if (activeFilter === 'streak3' && stock.consecutiveStreak < 3) return false;
        if (activeFilter === 'candidates' && stock.rankingScore < 65) return false;
      }

      return true;
    });
  }, [listData, searchTerm, activeFilter, selectedSector, selectedScreenerFilter, statsSummary, runs, safeActiveDate]);

  // Handle multi-column sorting calculations
  const sortedListData = useMemo(() => {
    return [...filteredListData].sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      if (sortBy === 'volume') {
        valA = a.volume;
        valB = b.volume;
      } else if (sortBy === 'relativeVolume') {
        valA = a.relativeVolume;
        valB = b.relativeVolume;
      } else if (sortBy === 'appearances') {
        valA = a.appearanceCount;
        valB = b.appearanceCount;
      } else if (sortBy === 'streak') {
        valA = a.consecutiveStreak;
        valB = b.consecutiveStreak;
      } else if (sortBy === 'score') {
        valA = a.rankingScore;
        valB = b.rankingScore;
      } else if (sortBy === 'changePercent') {
        valA = a.changePercent;
        valB = b.changePercent;
      } else if (sortBy === 'price') {
        valA = a.price;
        valB = b.price;
      }

      const comparison = valA - valB;
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [filteredListData, sortBy, sortDirection]);

  // Top Trading Candidates representation: Score >= 65, sorted highest score/streak first, max 4
  const topCandidates = useMemo(() => {
    return listData
      .filter(s => s.rankingScore >= 65)
      .sort((a, b) => b.rankingScore - a.rankingScore)
      .slice(0, 4);
  }, [listData]);

  const handleSortToggle = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(col);
      setSortDirection('desc'); // Default search highest first
    }
  };

  const getSortIcon = (col: typeof sortBy) => {
    if (sortBy !== col) return null;
    return sortDirection === 'desc' ? <ChevronDown className="h-3 ml-1" /> : <ChevronUp className="h-3 ml-1" />;
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS (TIME TRAVEL MODE) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141416] border border-[#27272a] p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-400" />
          <div>
            <span className="text-[10px] text-zinc-500 font-mono block uppercase">Active Focal Trading Period</span>
            {distinctTradingDays.length > 0 ? (
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={safeActiveDate}
                  onChange={(e) => onActiveDateChange(e.target.value)}
                  className="bg-[#18181b] border border-[#27272a] hover:border-zinc-700 text-xs font-bold text-[#e4e4e7] font-mono rounded-lg p-1.5 focus:outline-none transition cursor-pointer"
                >
                  {distinctTradingDays.map(date => (
                    <option key={date} value={date}>{date} (Run Checked)</option>
                  ))}
                </select>
                {safeActiveDate === distinctTradingDays[0] && (
                  <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded uppercase">
                     Latest Run
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-rose-400 font-bold">No runs loaded. Use Command Center to import.</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick search */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search symbol, industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] text-xs text-zinc-300 rounded-lg pl-8 pr-3 py-2 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-600 outline-none font-semibold"
            />
          </div>
        </div>
      </div>

      {distinctTradingDays.length === 0 ? (
        <div className="bg-[#141416] border border-[#27272a] rounded-xl p-16 text-center shadow-xl">
          <AlertCircle className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-300 font-semibold">Workspace History is Empty</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-2 leading-relaxed">
            Please navigate to the <strong className="text-zinc-300">Command Center</strong> tab to import daily screener results or load default simulated baseline history in seconds.
          </p>
        </div>
      ) : (
        <>
          {/* TELEMETRY METRIC STAT CARDS */}
          {statsSummary && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {[
                { label: 'Total hits', value: statsSummary.totalStocksToday, desc: 'Strategy matches today', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/25' },
                { label: 'Recurring stocks', value: statsSummary.recurringStocksCount, desc: 'Previous hits seen active', badgeColor: 'bg-indigo-500/10 text-indigo-400 border border-indigo-550/20' },
                { label: 'New entrants', value: statsSummary.newStocksCount, desc: 'First appearance captured', badgeColor: 'bg-sky-500/10 text-sky-400 border border-sky-550/20' },
                { label: 'Yesterday drops', value: statsSummary.droppedStocksCount, desc: 'Entries failing criteria', badgeColor: 'bg-rose-500/10 text-rose-400 border border-rose-550/20' },
                { 
                  label: 'Strongest streak', 
                  value: statsSummary.strongestStreak ? `${statsSummary.strongestStreak.symbol}` : 'N/A', 
                  desc: statsSummary.strongestStreak ? `${statsSummary.strongestStreak.streak} consecutive days` : 'No continuing streaks',
                  badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-550/20', 
                  symbolClick: statsSummary.strongestStreak?.symbol 
                },
                { 
                  label: 'Conviction Leader', 
                  value: statsSummary.topRankedStock ? `${statsSummary.topRankedStock.symbol}` : 'N/A', 
                  desc: statsSummary.topRankedStock ? `Rank Score: ${statsSummary.topRankedStock.score}` : 'Metrics loading',
                  badgeColor: 'bg-red-500/10 text-red-400 border border-red-550/20', 
                  symbolClick: statsSummary.topRankedStock?.symbol 
                }
              ].map((card, idx) => (
                <div 
                  key={idx} 
                  onClick={() => card.symbolClick && onSelectStock(card.symbolClick)}
                  className={`bg-[#141416] border border-[#27272a] p-4 rounded-xl shadow flex flex-col justify-between ${card.symbolClick ? 'cursor-pointer hover:border-zinc-500 transition' : ''}`}
                >
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-medium block">{card.label}</span>
                    <span className="text-xl font-bold text-[#e4e4e7] font-mono tracking-tight block mt-1.5">{card.value}</span>
                  </div>
                  <span className="text-[9px] text-[#e4e4e7] font-medium leading-relaxed mt-2.5 block">{card.desc}</span>
                </div>
              ))}
            </div>
          )}

          {/* TOP TRADING CANDIDATES GRID SECTION */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#e4e4e7] font-mono mb-3.5 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-blue-500 animate-pulse" />
              Top Trading Candidates Today
            </h3>
            
            {topCandidates.length === 0 ? (
              <div className="bg-[#141416]/40 border border-[#27272a] p-6 rounded-xl text-center text-xs text-zinc-500">
                No stocks currently satisfy high-conviction Candidate parameter boundaries (Score &gt;= 65) in today's runs.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topCandidates.map((stock) => {
                  const gain = stock.changePercent >= 0;
                  // Grab custom watchlist lock status
                  const lock = userNotes.find(n => n.symbol === stock.symbol);
                  const lockColors = {
                    buy: 'border-emerald-500 text-emerald-400 bg-emerald-950/20',
                    watch: 'border-sky-500 text-sky-400 bg-sky-950/20',
                    sell: 'border-rose-500 text-rose-400 bg-rose-950/20',
                    neutral: 'border-[#27272a] text-zinc-400 bg-[#18181b]'
                  };

                  return (
                    <div 
                      key={stock.symbol}
                      onClick={() => onSelectStock(stock.symbol)}
                      className="bg-[#141416] border border-[#27272a] hover:border-zinc-650 rounded-xl p-4 cursor-pointer transition shadow-md hover:shadow-lg flex flex-col justify-between relative overflow-hidden group"
                    >
                      {/* Subtle accent hover background */}
                      <div className="absolute right-0 top-0 h-14 w-14 rounded-bl-full bg-blue-550/5 group-hover:bg-blue-600/10 transition" />

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold font-mono tracking-tight text-white">{stock.symbol}</span>
                            {lock?.status && (
                              <span className={`text-[8px] px-1 py-0.5 rounded border uppercase font-mono ${lockColors[lock.status]}`}>
                                {lock.status}
                              </span>
                            )}
                          </div>
                          
                          <span className="text-xs font-bold font-mono text-blue-400">
                            Score: {stock.rankingScore}
                          </span>
                        </div>

                        <p className="text-[10px] text-zinc-500 truncate font-semibold">{stock.name}</p>

                        <div className="flex justify-between text-xs pt-1">
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-zinc-500 block uppercase font-mono">Price</span>
                            <span className="font-bold font-mono text-zinc-200">${stock.price.toFixed(2)}</span>
                          </div>

                          <div className="space-y-0.5 text-right">
                            <span className="text-[9px] text-zinc-500 block uppercase font-mono">Change %</span>
                            <span className={`font-bold font-mono ${gain ? 'text-emerald-400' : 'text-rose-450'}`}>
                              {gain ? '+' : ''}{stock.changePercent}%
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between text-[10px] pt-1.5 border-t border-[#27272a] text-zinc-400 font-mono">
                          <span>Streak: <strong className="text-zinc-300">{stock.consecutiveStreak}D</strong></span>
                          <span>Rvol: <strong className="text-zinc-300">{stock.relativeVolume}x</strong></span>
                          <span>Hits: <strong className="text-zinc-300">{stock.appearanceCount}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MAIN COMPREHENSIVE FILTERED TABLE CARD */}
          <div className="bg-[#141416] border border-[#27272a] rounded-xl overflow-hidden shadow-xl">
            
            {/* Table Header Filtering Controls */}
            <div className="p-4 bg-[#18181b] border-b border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Hits' },
                  { id: 'new', label: 'New Today' },
                  { id: 'recurring', label: 'Recurring' },
                  { id: 'streak2', label: 'Streak 2D+' },
                  { id: 'streak3', label: 'Streak 3D+' },
                  { id: 'candidates', label: 'Conviction Candidates 🎯' }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setActiveFilter(pill.id as any)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer select-none ${
                      activeFilter === pill.id 
                        ? 'bg-blue-600 text-white font-bold' 
                        : 'bg-[#141416] hover:bg-[#18181b] text-zinc-400 hover:text-white border border-[#27272a]'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Sector / Strategy Dropdowns */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Sector:</span>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="bg-[#141416] text-[10px] font-mono font-bold text-zinc-300 rounded border border-[#27272a] focus:outline-none p-1 shrink-0 max-w-[120px] cursor-pointer"
                  >
                    {sectorOptions.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider font-semibold">Strategy:</span>
                  <select
                    value={selectedScreenerFilter}
                    onChange={(e) => setSelectedScreenerFilter(e.target.value)}
                    className="bg-[#141416] text-[10px] font-mono font-bold text-zinc-300 rounded border border-[#27272a] focus:outline-none p-1 shrink-0 max-w-[120px] cursor-pointer"
                  >
                    <option value="ALL">All Strategies</option>
                    {screeners.map(sc => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
                  </select>
                </div>
              </div>

            </div>

            {/* List Table proper */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap font-medium text-zinc-300">
                <thead className="bg-[#18181b] font-semibold font-mono text-[9px] text-zinc-500 tracking-wider border-b border-[#27272a] uppercase">
                  <tr>
                    <th className="py-3 px-4">Screener Source</th>
                    <th 
                      onClick={() => handleSortToggle('score')} 
                      className="py-3 px-4 cursor-pointer hover:bg-[#18181b] text-zinc-400 hover:text-white"
                    >
                      <div className="flex items-center">Rank Score {getSortIcon('score')}</div>
                    </th>
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4 max-w-xs truncate">Company</th>
                    <th className="py-3 px-4">Sector</th>
                    <th 
                      onClick={() => handleSortToggle('streak')} 
                      className="py-3 px-4 cursor-pointer hover:bg-[#18181b] text-zinc-400 hover:text-white"
                    >
                      <div className="flex items-center">Streak {getSortIcon('streak')}</div>
                    </th>
                    <th 
                      onClick={() => handleSortToggle('appearances')} 
                      className="py-3 px-4 cursor-pointer hover:bg-[#18181b] text-zinc-400 hover:text-white"
                    >
                      <div className="flex items-center">Matches {getSortIcon('appearances')}</div>
                    </th>
                    <th 
                      onClick={() => handleSortToggle('price')} 
                      className="py-3 px-4 cursor-pointer hover:bg-[#18181b] text-zinc-400 hover:text-white"
                    >
                      <div className="flex items-center">Price {getSortIcon('price')}</div>
                    </th>
                    <th 
                      onClick={() => handleSortToggle('changePercent')} 
                      className="py-3 px-4 cursor-pointer hover:bg-[#18181b] text-zinc-400 hover:text-white"
                    >
                      <div className="flex items-center">Daily Change {getSortIcon('changePercent')}</div>
                    </th>
                    <th 
                      onClick={() => handleSortToggle('volume')} 
                      className="py-3 px-4 cursor-pointer hover:bg-[#18181b] text-zinc-400 hover:text-white text-right"
                    >
                      <div className="flex items-center justify-end">Volume {getSortIcon('volume')}</div>
                    </th>
                    <th 
                      onClick={() => handleSortToggle('relativeVolume')} 
                      className="py-3 px-4 cursor-pointer hover:bg-[#18181b] text-zinc-400 hover:text-white text-right"
                    >
                      <div className="flex items-center justify-end">Relative Vol {getSortIcon('relativeVolume')}</div>
                    </th>
                    <th className="py-3 px-4 text-center">RSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {sortedListData.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-10 text-zinc-500 font-mono text-xs">
                        No matches correspond to the filtered credentials on {safeActiveDate}.
                      </td>
                    </tr>
                  ) : (
                    sortedListData.map((stock) => {
                      const lock = userNotes.find(n => n.symbol === stock.symbol);
                      const activeScreenerObj = screeners.find(s => s.name === stock.screenerName);
                      
                      const sColors = {
                        buy: 'text-emerald-400 opacity-90',
                        watch: 'text-sky-400 opacity-90',
                        sell: 'text-rose-400 opacity-90',
                        neutral: 'text-zinc-550'
                      };

                      return (
                        <tr
                          key={stock.symbol}
                          onClick={() => onSelectStock(stock.symbol)}
                          className="hover:bg-[#18181b] transition cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 font-mono text-[10px]">
                            <span 
                              className="px-2 py-0.5 rounded-sm text-zinc-300 border border-[#27272a] bg-[#141416]"
                              style={{ 
                                borderLeftColor: activeScreenerObj?.color === 'emerald' ? '#10b981' : 
                                                 activeScreenerObj?.color === 'indigo' ? '#6366f1' : 
                                                 activeScreenerObj?.color === 'sky' ? '#0ea5e9' : 
                                                 activeScreenerObj?.color === 'amber' ? '#f59e0b' : '#f43f5e',
                                borderLeftWidth: '3px'
                              }}
                            >
                              {stock.screenerName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              stock.rankingScore >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              stock.rankingScore >= 40 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-rose-500/10 text-rose-455 border border-rose-550/10'
                            }`}>
                              {stock.rankingScore}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold font-mono text-white flex items-center gap-1.5">
                            {stock.symbol}
                            {lock?.status && (
                              <span className={`text-[8px] font-bold ${sColors[lock.status]}`}>★</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 max-w-[140px] truncate text-zinc-400 group-hover:text-[#e4e4e7] transition font-normal" title={stock.name}>
                            {stock.name}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-500 text-[10px]" title={stock.industry}>{stock.sector}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-200">
                            {stock.consecutiveStreak}D
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="text-zinc-200 font-bold">{stock.appearanceCount}</span>
                            <span className="text-[10px] text-zinc-500 font-light"> ({Math.round(stock.persistenceScore * 100)}%)</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-zinc-200 font-bold">${stock.price.toFixed(2)}</td>
                          <td className={`py-3.5 px-4 font-mono font-bold ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                          </td>
                          <td className="py-3.5 px-4 font-mono text-right font-bold text-zinc-350">
                            {(stock.volume / 1e6).toFixed(2)}M
                          </td>
                          <td className="py-3.5 px-4 font-mono text-right text-zinc-200">
                            <span className={`font-bold ${stock.relativeVolume >= 2.0 ? 'text-emerald-400' : stock.relativeVolume >= 1.2 ? 'text-sky-300' : 'text-zinc-400'}`}>
                              {stock.relativeVolume}x
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono">
                            {stock.rsi ? (
                              <span className={`font-bold text-[10px] ${
                                stock.rsi >= 70 ? 'text-rose-455 animate-pulse' : 
                                stock.rsi <= 30 ? 'text-emerald-400 font-extrabold' : 'text-zinc-400'
                              }`}>
                                {stock.rsi}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Table footer size overview */}
            <div className="p-3 bg-[#18181b] border-t border-[#27272a] text-[10px] font-mono text-zinc-500 flex justify-between items-center">
              <span>Showing {sortedListData.length} of {listData.length} records matching strategy conditions</span>
              <span>Default sort: Highest Volume First</span>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
