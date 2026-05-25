/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, LayoutDashboard, Sliders, Database, TrendingUp, HelpCircle, 
  Share2, ArrowUpRight, Award, PlusCircle, CheckSquare, Zap, Terminal, ShieldAlert
} from 'lucide-react';

import { Screener, ScreenerRun, StockAnalysis, StockUserNote } from './types';
import { DEFAULT_SCREENERS, generateMockHistoricalData } from './data/mockData';
import { aggregateScreenerData } from './utils/analytics';

// Imported modular sub-components
import ScreenerDashboard from './components/ScreenerDashboard';
import AnalyticsCharts from './components/AnalyticsCharts';
import DataManagement from './components/DataManagement';
import StockDetailDialog from './components/StockDetailDialog';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'charts' | 'data'>('dashboard');

  // Core local states: loaded from LocalStorage or seeded defaults on Day One
  const [screeners, setScreeners] = useState<Screener[]>([]);
  const [runs, setRuns] = useState<ScreenerRun[]>([]);
  const [userNotes, setUserNotes] = useState<StockUserNote[]>([]);

  // Focus detail stock dialog controller
  const [focusedSymbol, setFocusedSymbol] = useState<string | null>(null);

  // Focus dating state (tracks which day is active across dashboard filters)
  const [activeDate, setActiveDate] = useState<string>('2026-05-25');

  // Load database on mount
  useEffect(() => {
    // 1. Strategies / Screeners
    const storedScreeners = localStorage.getItem('screener_strategies');
    let loadedScreeners: Screener[] = [];
    if (storedScreeners) {
      try {
        loadedScreeners = JSON.parse(storedScreeners);
      } catch (e) {
        loadedScreeners = DEFAULT_SCREENERS;
      }
    } else {
      loadedScreeners = DEFAULT_SCREENERS;
      localStorage.setItem('screener_strategies', JSON.stringify(DEFAULT_SCREENERS));
    }
    setScreeners(loadedScreeners);

    // 2. Historical Runs
    const storedRuns = localStorage.getItem('screener_historical_runs');
    let loadedRuns: ScreenerRun[] = [];
    if (storedRuns) {
      try {
        loadedRuns = JSON.parse(storedRuns);
      } catch (e) {
        loadedRuns = generateMockHistoricalData();
      }
    } else {
      loadedRuns = generateMockHistoricalData();
      localStorage.setItem('screener_historical_runs', JSON.stringify(loadedRuns));
    }
    setRuns(loadedRuns);

    // 3. User Notes / watchlist locks
    const storedNotes = localStorage.getItem('screener_user_notes');
    let loadedNotes: StockUserNote[] = [];
    if (storedNotes) {
      try {
        loadedNotes = JSON.parse(storedNotes);
      } catch (e) {
        loadedNotes = [];
      }
    }
    setUserNotes(loadedNotes);

    // Set initial activeDate value to latest date in recorded runs
    if (loadedRuns.length > 0) {
      const dates = Array.from(new Set(loadedRuns.map(r => r.date))).sort().reverse();
      if (dates.length > 0) {
        setActiveDate(dates[0]);
      }
    }
  }, []);

  // Compute calculated aggregations dynamically on any runs modifications
  const analyses: StockAnalysis[] = useMemo(() => {
    return aggregateScreenerData(runs);
  }, [runs]);

  // Synchronizers back to local storage
  const saveRunsToLocalStorage = (updatedRuns: ScreenerRun[]) => {
    setRuns(updatedRuns);
    localStorage.setItem('screener_historical_runs', JSON.stringify(updatedRuns));
    
    // Automatically set activeDate to latest available date
    if (updatedRuns.length > 0) {
      const dates = Array.from(new Set(updatedRuns.map(r => r.date))).sort().reverse();
      if (dates.length > 0) {
        setActiveDate(dates[0]);
      }
    }
  };

  const saveScreenersToLocalStorage = (updatedScreeners: Screener[]) => {
    setScreeners(updatedScreeners);
    localStorage.setItem('screener_strategies', JSON.stringify(updatedScreeners));
  };

  const handleSaveUserNotes = (symbol: string, notes: string, status: 'watch' | 'buy' | 'sell' | 'neutral') => {
    const updatedNotesList = [...userNotes];
    const notesIdx = updatedNotesList.findIndex(n => n.symbol === symbol);

    const packedNote: StockUserNote = {
      symbol,
      notes,
      status,
      updatedAt: new Date().toISOString()
    };

    if (notesIdx !== -1) {
      updatedNotesList[notesIdx] = packedNote;
    } else {
      updatedNotesList.push(packedNote);
    }

    setUserNotes(updatedNotesList);
    localStorage.setItem('screener_user_notes', JSON.stringify(updatedNotesList));
  };

  // SYSTEM CONTROLS
  const handleClearDatabase = () => {
    saveRunsToLocalStorage([]);
    setActiveDate('');
  };

  const handleRestoreDefaults = () => {
    const freshMockData = generateMockHistoricalData();
    saveRunsToLocalStorage(freshMockData);
    saveScreenersToLocalStorage(DEFAULT_SCREENERS);
    
    const dates = Array.from(new Set(freshMockData.map(r => r.date))).sort().reverse();
    if (dates.length > 0) {
      setActiveDate(dates[0]);
    }
  };

  const handleAddScreener = (screener: Screener) => {
    const nextArr = [...screeners, screener];
    saveScreenersToLocalStorage(nextArr);
  };

  const handleDeleteScreener = (screenerId: string) => {
    const nextArr = screeners.filter(s => s.id !== screenerId);
    saveScreenersToLocalStorage(nextArr);
  };

  const handleImportDatabase = (importedRuns: ScreenerRun[], importedScreeners?: Screener[]) => {
    saveRunsToLocalStorage(importedRuns);
    if (importedScreeners && importedScreeners.length > 0) {
      saveScreenersToLocalStorage(importedScreeners);
    }
  };

  const handleAddRun = (newRun: ScreenerRun) => {
    const duplicatesRemoved = runs.filter(r => r.id !== newRun.id);
    const updatedList = [...duplicatesRemoved, newRun];
    saveRunsToLocalStorage(updatedList);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#e4e4e7] flex flex-col font-sans select-none antialiased selection:bg-blue-500/30 selection:text-white">
      
      {/* PROFESSIONAL SECTOR HEADER RAIL */}
      <header className="border-b border-[#27272a] bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/10 border border-blue-500/25 p-2 rounded-lg text-blue-400">
              <Zap className="h-5 w-5 fill-blue-400/10 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-widest font-mono text-blue-400">QUANT_SCORE</span>
                <span className="text-[9px] bg-[#18181b] border border-[#27272a] text-zinc-500 px-1 rounded font-mono uppercase tracking-wider">v1.2</span>
              </div>
              <h1 className="text-xs font-medium text-zinc-400 mt-0.5">Stock Screener Conviction Analyzer & Hist Tracker</h1>
            </div>
          </div>

          {/* Core Master Tabs navigation */}
          <div className="flex items-center bg-[#0a0a0c] border border-[#27272a] p-1 rounded-xl">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'charts', label: 'Quant Charts', icon: BarChart3 },
              { id: 'data', label: 'Command Center', icon: Sliders }
            ].map(tab => {
              const TabIcon = tab.icon;
              const IsActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative cursor-pointer ${
                    IsActive 
                      ? 'bg-[#18181b] text-white shadow-inner border border-[#27272a]' 
                      : 'text-zinc-400 hover:bg-[#18181b] hover:text-white'
                  }`}
                >
                  <TabIcon className={`h-4 w-4 ${IsActive ? 'text-blue-500' : 'text-zinc-500'}`} />
                  {tab.label}
                  {tab.id === 'data' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick status box on upper-right */}
          <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono border-l border-[#27272a] pl-4 shrink-0 text-zinc-500">
            <div className="space-y-0.5">
              <p className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                <span>WORKSPACE SECURITY STATUS: <strong className="text-zinc-400 font-semibold">SECURE</strong></span>
              </p>
              <p className="font-normal text-zinc-500 text-[9px]">PERSISTENCE ENGINE: LOCAL / FREE-TIER</p>
            </div>
          </div>

        </div>
      </header>

      {/* MASTER PAGE VIEW CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <ScreenerDashboard
                screeners={screeners}
                runs={runs}
                analyses={analyses}
                userNotes={userNotes}
                onSelectStock={setFocusedSymbol}
                activeDate={activeDate}
                onActiveDateChange={setActiveDate}
              />
            )}

            {activeTab === 'charts' && (
              <AnalyticsCharts
                runs={runs}
                analyses={analyses}
              />
            )}

            {activeTab === 'data' && (
              <DataManagement
                screeners={screeners}
                runs={runs}
                onAddRun={handleAddRun}
                onClearDatabase={handleClearDatabase}
                onRestoreDefaults={handleRestoreDefaults}
                onAddScreener={handleAddScreener}
                onDeleteScreener={handleDeleteScreener}
                onImportDatabase={handleImportDatabase}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER METADATA INDICATORS */}
      <footer className="border-t border-[#27272a] bg-[#0a0a0c] py-4 mt-12 text-[10px] text-zinc-500 font-mono tracking-wide">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-center md:text-left">
            © 2026 QUANT_SCORE Inc. Distributed via Cloud sandboxing. Zero subscription requirements.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-[9px] text-zinc-500">
            <span>DATABASE: {runs.length} Runs Locked</span>
            <span>STRATEGIES: {screeners.length} Active</span>
            <span>DATA STORE: localStorage (100% Client-Bound)</span>
          </div>
        </div>
      </footer>

      {/* INTERACTIVE STOCK DETAIL PORTAL MODAL */}
      {focusedSymbol && (
        <StockDetailDialog
          symbol={focusedSymbol}
          analyses={analyses}
          userNotes={userNotes}
          onSaveNotes={handleSaveUserNotes}
          onClose={() => setFocusedSymbol(null)}
        />
      )}

    </div>
  );
}
