/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { X, Calendar, Edit2, CheckCircle2, AlertTriangle, TrendingUp, Info, Activity } from 'lucide-react';
import { StockAnalysis, StockUserNote } from '../types';

interface DetailProps {
  symbol: string;
  analyses: StockAnalysis[];
  userNotes: StockUserNote[];
  onSaveNotes: (symbol: string, notes: string, status: 'watch' | 'buy' | 'sell' | 'neutral') => void;
  onClose: () => void;
}

export default function StockDetailDialog({ symbol, analyses, userNotes, onSaveNotes, onClose }: DetailProps) {
  const stock = analyses.find(s => s.symbol === symbol);
  const note = userNotes.find(n => n.symbol === symbol);

  const [notesText, setNotesText] = useState(note?.notes || '');
  const [evalStatus, setEvalStatus] = useState<'watch' | 'buy' | 'sell' | 'neutral'>(note?.status || 'neutral');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setNotesText(note?.notes || '');
    setEvalStatus(note?.status || 'neutral');
    setIsSaved(false);
  }, [symbol, note]);

  if (!stock) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full text-center">
          <p className="text-slate-300">Stock symbol not found.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-800 rounded text-xs text-slate-100">Close</button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    onSaveNotes(symbol, notesText, evalStatus);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Generate dynamic Quantitative Analyst automated commentary
  const getAnalystAssessment = () => {
    const pPct = Math.round(stock.persistenceScore * 100);
    let thesis = '';
    let recommendation = '';

    if (stock.rankingScore >= 70) {
      thesis = `${stock.symbol} is driving extremely strong institutional accumulation, appearing in ${stock.appearanceCount} of our recorded trading days (${pPct}% persistence).`;
      if (stock.consecutiveStreak >= 3) {
        thesis += ` It is currently on an active streak of ${stock.consecutiveStreak} consecutive trading days, demonstrating relentless breakout strength.`;
      }
      recommendation = `With a very high conviction rating of ${stock.rankingScore}/100 and favorable relative volume (${stock.relativeVolume}x), this represents an institutional breakout candidate. Look for consolidation setups or moving average retracements before entering.`;
    } else if (stock.rankingScore >= 40) {
      thesis = `${stock.symbol} is building positive momentum with an intermediate conviction ranking of ${stock.rankingScore}/100. It has appeared ${stock.appearanceCount} times recently.`;
       if (stock.consecutiveStreak === 0) {
         thesis += ` However, its streak is currently broken, meaning it failed to meet strategy parameters in the most recent run.`;
       } else {
         thesis += ` It currently has an active streak of ${stock.consecutiveStreak} trading days.`;
       }
      recommendation = `This is a high-quality Watch List candidate. Wait for volume to spike (Rvol > 1.8x) or for a multiple-screener trigger overlap before initiating sizing.`;
    } else {
      thesis = `${stock.symbol} has a low score of ${stock.rankingScore}/100 with weak persistence (${pPct}%). It recently lacked the liquidity or price trend to maintain its position on our core screeners.`;
      recommendation = `Avoid chasing this asset at current level. It exhibits traits of losing momentum or structural resistance breakthroughs that failed. Set alerts at structural support bounds instead.`;
    }

    return { thesis, recommendation };
  };

  const assessment = getAnalystAssessment();

  // Color mappings for signal badges
  const categoryColors = {
    'Strong Candidate': 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    'Watch List': 'bg-sky-500/15 border-sky-500/30 text-sky-450',
    'Losing Momentum': 'bg-rose-500/15 border-rose-500/30 text-rose-400'
  };

  const statusColors = {
    buy: 'bg-blue-600 border-blue-700 text-white font-semibold shadow-md',
    watch: 'bg-sky-600 border-sky-700 text-white font-semibold',
    sell: 'bg-rose-600 border-rose-700 text-white font-semibold',
    neutral: 'bg-[#18181b] border-[#27272a] text-zinc-300'
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0c]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141416] border border-[#27272a] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-4 relative animate-in fade-in-50 duration-200">
        
        {/* Header bar */}
        <div className="border-b border-[#27272a] p-5 flex items-center justify-between bg-[#0a0a0c]">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">{stock.symbol}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${categoryColors[stock.signalCategory]}`}>
                {stock.signalCategory}
              </span>
              <span className="text-xs bg-[#18181b] text-zinc-400 border border-[#27272a] px-2 py-0.5 rounded font-mono">
                Score: {stock.rankingScore}/100
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">{stock.name} | {stock.sector} • {stock.industry}</p>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1 px-2.5 bg-[#0a0a0c] border border-[#27272a] hover:border-zinc-750 hover:text-white rounded-lg transition text-zinc-400 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable pane */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Top Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {[
              { label: 'Last Price', val: `$${stock.price.toFixed(2)}`, desc: `${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%`, descColor: stock.changePercent >= 0 ? 'text-blue-400 font-semibold' : 'text-rose-450 font-semibold' },
              { label: 'Relative Vol', val: `${stock.relativeVolume}x`, desc: 'Normal standard = 1.0x', descColor: stock.relativeVolume >= 1.5 ? 'text-blue-400' : 'text-zinc-500' },
              { label: 'RSI(14)', val: stock.rsi ? stock.rsi.toString() : 'N/A', desc: stock.rsi && stock.rsi > 70 ? 'Overbought' : stock.rsi && stock.rsi < 30 ? 'Oversold' : 'Steady', descColor: stock.rsi && stock.rsi > 60 ? 'text-blue-450' : stock.rsi && stock.rsi < 40 ? 'text-amber-450' : 'text-zinc-500' },
              { label: 'Active Streak', val: `${stock.consecutiveStreak} Days`, desc: `Peak: ${stock.longestStreak} days`, descColor: 'text-blue-400' },
              { label: 'Total Hits', val: `${stock.appearanceCount} Appearances`, desc: `${Math.round(stock.persistenceScore * 100)}% Persistence`, descColor: 'text-zinc-400 font-mono' },
              { label: 'Market Cap', val: `$${stock.marketCap.toFixed(1)}B`, desc: 'Dynamic cap size', descColor: 'text-zinc-500 font-mono' }
            ].map((metric, i) => (
              <div key={i} className="bg-[#0a0a0c] p-3 rounded-lg border border-[#27272a] flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">{metric.label}</p>
                  <p className="text-base font-bold text-zinc-100 font-mono mt-1">{metric.val}</p>
                </div>
                <p className={`text-[10px] mt-1.5 font-medium ${metric.descColor}`}>{metric.desc}</p>
              </div>
            ))}
          </div>

          {/* Sparkline trend representation */}
          <div className="bg-[#0a0a0c] border border-[#27272a] p-4 rounded-xl">
            <span className="text-xs font-semibold text-zinc-300 block mb-3 flex items-center gap-1.5 font-mono">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              CHRONOLOGICAL PERFORMANCE TREND ({stock.history.length} DATA RECORDS)
            </span>
            
            <div className="relative h-24 w-full flex items-end justify-between border-b border-[#27272a] pb-1">
              {(() => {
                const maxPrice = Math.max(...stock.history.map(h => h.price), 1);
                const minPrice = Math.min(...stock.history.map(h => h.price), 0);
                const priceRange = maxPrice - minPrice || 1;
                
                return stock.history.map((h, i) => {
                  const pctY = ((h.price - minPrice) / priceRange) * 100;
                  const volPct = Math.min(100, (h.relativeVolume / 5) * 100);
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Price Point Indicator Block */}
                      <div 
                        className="w-1.5 rounded-full bg-blue-500 absolute transition-all group-hover:bg-blue-400"
                        style={{ 
                          height: `${Math.max(6, pctY)}%`, 
                          bottom: '12px' 
                        }}
                      />
                      {/* Volume Bar below */}
                      <div 
                        className="w-1.5 bg-zinc-700 h-[6px]"
                        style={{ height: `${Math.max(2, volPct * 0.1)}px` }}
                      />

                      {/* Sparkline point hover tooltip */}
                      <div className="absolute bottom-full mb-1 flex-col items-center hidden group-hover:flex z-50 bg-[#0a0a0c] border border-zinc-750 p-2 rounded text-[9px] font-mono shadow-2xl whitespace-nowrap">
                        <span className="text-zinc-400">{h.date}</span>
                        <span className="text-blue-400 font-bold mt-0.5">Price: ${h.price.toFixed(2)}</span>
                        <span className="text-purple-300 font-bold">RVol: {h.relativeVolume}x</span>
                        <span className="text-zinc-550 font-normal">{h.screenerName}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-550 mt-2">
              <span>First detected: {stock.firstAppearance}</span>
              <span>Last detected: {stock.lastAppearance}</span>
            </div>
          </div>

          {/* Section 2: Analyst Assesment Block */}
          <div className="bg-blue-950/20 border border-blue-500/15 p-4 rounded-xl flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-300 font-mono">Automated Quant Analysis</h4>
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">{assessment.thesis}</p>
              <p className="text-xs text-blue-400 leading-relaxed font-medium mt-1">{assessment.recommendation}</p>
            </div>
          </div>

          {/* Section 3: Dual Column Layout: Notebook & Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Quantitative Evaluation & Notes Block */}
            <div className="bg-[#0a0a0c] p-4 border border-[#27272a] rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-2.5">
                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-widest font-mono">Trading Notebook</span>
                <span className="text-[10px] text-zinc-500">Record notes & strategy locks</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 block mb-1">EVALUATION CONVICTION STATE</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'buy', label: 'Buy Lock' },
                      { id: 'watch', label: 'Watchlist' },
                      { id: 'sell', label: 'Sell Target' },
                      { id: 'neutral', label: 'Neutral' }
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setEvalStatus(st.id as any)}
                        className={`py-1.5 rounded border text-center text-xs font-medium cursor-pointer transition ${
                          evalStatus === st.id 
                            ? statusColors[evalStatus] 
                            : 'bg-[#141416] border-[#27272a] hover:border-zinc-700 text-zinc-450 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 block mb-1 font-mono">PORTFOLIO OBSERVATIONS & QUALITATIVE INSIGHTS</label>
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Enter observation thesis (e.g. 'Breaking pivot resistance at $170 on strong volume, support held EMA(20)...')"
                    rows={4}
                    className="w-full bg-[#141416] border border-[#27272a] focus:border-zinc-700 rounded p-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {note?.updatedAt ? `Last modified: ${new Date(note.updatedAt).toLocaleDateString()}` : 'No saved records'}
                  </span>
                  
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Save Changes
                  </button>
                </div>

                {isSaved && (
                  <p className="text-blue-400 text-[10px] text-right font-mono animate-pulse">✓ Evaluation locks updated successfully.</p>
                )}
              </div>
            </div>

            {/* Right: Detailed Chronological Timeline of Hits */}
            <div className="bg-[#0a0a0c] p-4 border border-[#27272a] rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-2.5">
                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-widest font-mono">Screener Trigger Record</span>
                <span className="text-[10px] text-blue-405 font-mono font-semibold">{stock.screenersDetected.length} unique strategies</span>
              </div>

              <div className="overflow-y-auto max-h-[220px] pr-1 space-y-2.5 scrollbar-thin">
                {stock.history.slice().reverse().map((h, i) => (
                  <div key={i} className="border-l-2 border-zinc-805 hover:border-blue-450 pl-3 py-1 bg-[#141416]/40 rounded-r relative transition">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-300 font-mono">{h.date}</span>
                      <span className="text-[10px] bg-[#0a0a0c] px-1.5 py-0.5 rounded border border-[#27272a] text-blue-400 font-mono">
                        {h.screenerName}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1.5 text-[10px] text-zinc-400 font-mono">
                      <span>Price: <strong className="text-zinc-250">${h.price.toFixed(2)}</strong> ({h.changePercent >= 0 ? '+' : ''}{h.changePercent}%)</span>
                      <span>RVol: <strong className="text-zinc-250">{h.relativeVolume}x</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
