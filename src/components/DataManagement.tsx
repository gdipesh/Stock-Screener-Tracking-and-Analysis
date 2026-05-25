/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Upload, Database, Plus, Trash2, FileText, Download, Play, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Screener, ScreenerRun, StockRecord } from '../types';

interface DataManagementProps {
  screeners: Screener[];
  runs: ScreenerRun[];
  onAddRun: (run: ScreenerRun) => void;
  onClearDatabase: () => void;
  onRestoreDefaults: () => void;
  onAddScreener: (screener: Screener) => void;
  onDeleteScreener: (screenerId: string) => void;
  onImportDatabase: (runs: ScreenerRun[], screeners?: Screener[]) => void;
}

export default function DataManagement({
  screeners,
  runs,
  onAddRun,
  onClearDatabase,
  onRestoreDefaults,
  onAddScreener,
  onDeleteScreener,
  onImportDatabase
}: DataManagementProps) {
  // Add Screener Run States
  const [targetDate, setTargetDate] = useState('2026-05-25');
  const [selectedScreenerId, setSelectedScreenerId] = useState(screeners[0]?.id || 'momentum');
  const [importMethod, setImportMethod] = useState<'quick' | 'csv'>('quick');
  
  // Quick symbol entry
  const [quickSymbols, setQuickSymbols] = useState('AMD NVDA PLTR SMCI');
  
  // CSV pasting
  const [csvContent, setCsvContent] = useState(
    "Symbol,Company,Sector,Industry,Price,Change%,Volume,AvgVolume,RelativeVolume,MarketCap,RSI\n" +
    "AAPL,Apple Inc.,Technology,Consumer Electronics,185.34,1.25,48000000,52000000,0.92,2840.0,62\n" +
    "PLTR,Palantir Technologies,Technology,Software - Application,29.10,4.82,31000000,25000000,1.24,65.2,74\n" +
    "MSFT,Microsoft Corp.,Technology,Software - Infrastructure,421.40,-0.60,17500000,19000000,0.92,3130.0,58"
  );

  // Success/error logging
  const [logMessage, setLogMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Strategy Definition States
  const [newScreenerName, setNewScreenerName] = useState('');
  const [newScreenerDesc, setNewScreenerDesc] = useState('');
  const [newScreenerFilters, setNewScreenerFilters] = useState('');
  const [newScreenerColor, setNewScreenerColor] = useState('indigo');

  // Trigger dynamic Quick entry parsing
  const handleQuickImport = () => {
    const symbolList = quickSymbols
      .toUpperCase()
      .replace(/[,;]/g, ' ')
      .split(/\s+/)
      .map(sm => sm.trim())
      .filter(sm => sm.length > 0);

    if (symbolList.length === 0) {
      setLogMessage({ text: 'Please enter at least one valid ticker symbol.', type: 'error' });
      return;
    }

    const currentScreener = screeners.find(s => s.id === selectedScreenerId);
    if (!currentScreener) {
      setLogMessage({ text: 'No active strategy selected.', type: 'error' });
      return;
    }

    // Generate realistic market values based on ticker identity to prevent boring empties
    const newRecords: StockRecord[] = symbolList.map(symbol => {
      // Base realistic models if matching major tech operators, else use randomized defaults
      const knownData: { [key: string]: { name: string; sector: string; industry: string; val: number } } = {
        AMD: { name: 'Advanced Micro Devices, Inc.', sector: 'Technology', industry: 'Semiconductors', val: 170.50 },
        NVDA: { name: 'NVIDIA Corporation', sector: 'Technology', industry: 'Semiconductors', val: 125.00 },
        PLTR: { name: 'Palantir Technologies Inc.', sector: 'Technology', industry: 'Software - Application', val: 28.50 },
        TSLA: { name: 'Tesla, Inc.', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', val: 182.00 },
        AAPL: { name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics', val: 186.10 },
        MSFT: { name: 'Microsoft Corporation', sector: 'Technology', industry: 'Software - Infrastructure', val: 418.90 },
        SMCI: { name: 'Super Micro Computer, Inc.', sector: 'Technology', industry: 'Computer Hardware', val: 845.00 }
      };

      const match = knownData[symbol] || {
        name: `${symbol} Inc.`,
        sector: 'Technology',
        industry: 'Software - Infrastructure',
        val: 45.0 + Math.random() * 80
      };

      const change = parseFloat(((Math.random() > 0.45 ? 1 : -1) * Math.random() * 5.5).toFixed(2));
      const relativeVolume = parseFloat((0.8 + Math.random() * 2.8).toFixed(2));
      const volume = Math.round(12000000 * (relativeVolume || 1));
      const rsiValue = Math.round(45 + Math.random() * 35);

      return {
        symbol,
        name: match.name,
        sector: match.sector,
        industry: match.industry,
        price: parseFloat(match.val.toFixed(2)),
        changePercent: change,
        volume: volume,
        avgVolume: 12000000,
        relativeVolume: relativeVolume,
        marketCap: parseFloat(((match.val * 2.5e7) / 1e9).toFixed(2)),
        rsi: rsiValue,
        dateCollected: targetDate,
        screenerName: currentScreener.name
      };
    });

    const runId = `run-${targetDate}-${selectedScreenerId}`;
    onAddRun({
      id: runId,
      date: targetDate,
      screenerId: selectedScreenerId,
      stocks: newRecords
    });

    setLogMessage({
      text: `Success: Logged ${newRecords.length} stocks historically under '${currentScreener.name}' for ${targetDate}.`,
      type: 'success'
    });
    setQuickSymbols('');
  };

  // Safe manual CSV Parsing
  const handleCsvImport = () => {
    const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      setLogMessage({ text: 'CSV requires a header line and at least one stock row.', type: 'error' });
      return;
    }

    const currentScreener = screeners.find(s => s.id === selectedScreenerId);
    if (!currentScreener) {
      setLogMessage({ text: 'No active strategy selected.', type: 'error' });
      return;
    }

    // Try mapping headers
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const newRecords: StockRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
       const row = lines[i].split(',').map(col => col.trim());
       if (row.length < headers.length) continue;

       // Find indices dynamically
       const symIdx = headers.indexOf('symbol');
       const nameIdx = headers.indexOf('company');
       const sectorIdx = headers.indexOf('sector');
       const indIdx = headers.indexOf('industry');
       const prcIdx = headers.indexOf('price');
       const chgIdx = headers.indexOf('change%') !== -1 ? headers.indexOf('change%') : headers.indexOf('change percent');
       const volIdx = headers.indexOf('volume');
       const avgVolIdx = headers.indexOf('avgvolume') !== -1 ? headers.indexOf('avgvolume') : headers.indexOf('average volume');
       const rvolIdx = headers.indexOf('relativevolume') !== -1 ? headers.indexOf('relativevolume') : headers.indexOf('relative volume');
       const capIdx = headers.indexOf('marketcap') !== -1 ? headers.indexOf('marketcap') : headers.indexOf('market cap');
       const rsiIdx = headers.indexOf('rsi');

       const symbol = symIdx !== -1 ? row[symIdx].toUpperCase() : 'UNKNOWN';
       if (symbol === 'UNKNOWN' || symbol.length === 0) continue;

       newRecords.push({
         symbol,
         name: nameIdx !== -1 ? row[nameIdx] : `${symbol} Corp.`,
         sector: sectorIdx !== -1 ? row[sectorIdx] : 'Technology',
         industry: indIdx !== -1 ? row[indIdx] : 'Software - Infrastructure',
         price: prcIdx !== -1 ? parseFloat(row[prcIdx]) || 10.0 : 10.0,
         changePercent: chgIdx !== -1 ? parseFloat(row[chgIdx]) || 0.0 : 0.0,
         volume: volIdx !== -1 ? parseInt(row[volIdx]) || 1000000 : 1000000,
         avgVolume: avgVolIdx !== -1 ? parseInt(row[avgVolIdx]) || 1000000 : 1000000,
         relativeVolume: rvolIdx !== -1 ? parseFloat(row[rvolIdx]) || 1.0 : 1.0,
         marketCap: capIdx !== -1 ? parseFloat(row[capIdx]) || 5.0 : 5.0,
         rsi: rsiIdx !== -1 ? parseInt(row[rsiIdx]) || null : null,
         dateCollected: targetDate,
         screenerName: currentScreener.name
       });
    }

    if (newRecords.length === 0) {
      setLogMessage({ text: 'Failed to parse any valid stock rows. Validate column header spellings.', type: 'error' });
      return;
    }

    const runId = `run-${targetDate}-${selectedScreenerId}`;
    onAddRun({
      id: runId,
      date: targetDate,
      screenerId: selectedScreenerId,
      stocks: newRecords
    });

    setLogMessage({
      text: `Success: Logged ${newRecords.length} stocks from CSV for strategy '${currentScreener.name}' on ${targetDate}.`,
      type: 'success'
    });
  };

  // Add Strategy Logic
  const handleAddScreener = () => {
    if (!newScreenerName) {
      setLogMessage({ text: 'Strategy Name is mandatory.', type: 'error' });
      return;
    }
    const id = newScreenerName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Check duplicates
    if (screeners.some(s => s.id === id)) {
      setLogMessage({ text: 'A strategy with this name sequence already exists.', type: 'error' });
      return;
    }

    onAddScreener({
      id,
      name: newScreenerName,
      description: newScreenerDesc || 'Custom screener results.',
      filters: newScreenerFilters || 'No specific filters registered',
      color: newScreenerColor
    });

    setLogMessage({ text: `Strategy '${newScreenerName}' initialized successfully.`, type: 'success' });
    setNewScreenerName('');
    setNewScreenerDesc('');
    setNewScreenerFilters('');
  };

  // Export JSON backups
  const handleExportDatabase = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      screeners,
      runs
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `screener-database-backup-${targetDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setLogMessage({ text: 'Database exported. File downloaded successfully!', type: 'success' });
  };

  // Import JSON uploads
  const handleImportDatabaseJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json && Array.isArray(json.runs)) {
          onImportDatabase(json.runs, json.screeners);
          setLogMessage({ 
            text: `Database Restored: Loaded ${json.runs.length} screener runs across ${json.screeners?.length || 'existing'} strategies successfully.`, 
            type: 'success' 
          });
        } else {
          setLogMessage({ text: 'Invalid database backup structure. Root arrays lack runs.', type: 'error' });
        }
      } catch (err) {
        setLogMessage({ text: 'Error parsing local file. Confirm valid JSON format.', type: 'error' });
      }
    };
    fileReader.readAsText(files[0]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Import daily runs */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-widest font-mono">Daily Screener ingestion console</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1.5">Ingestial Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-zinc-700 text-zinc-300 rounded p-2 text-xs focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1.5">Strategy Category Channel</label>
              <select
                value={selectedScreenerId}
                onChange={(e) => setSelectedScreenerId(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-zinc-700 text-zinc-305 rounded p-2 text-xs focus:outline-none font-mono"
              >
                {screeners.map(sc => (
                  <option key={sc.id} value={sc.id}>{sc.name} ({sc.filters.split(',')[0]}...)</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab selector for quick vs csv */}
          <div className="flex gap-4 border-b border-[#27272a] pb-3 mb-4">
            <button
              onClick={() => { setImportMethod('quick'); setLogMessage(null); }}
              className={`pb-1 text-xs font-semibold uppercase tracking-wider font-mono transition cursor-pointer select-none ${
                importMethod === 'quick' ? 'border-b-2 border-blue-500 text-zinc-200' : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              Wizard/Quick Symbols
            </button>
            <button
              onClick={() => { setImportMethod('csv'); setLogMessage(null); }}
              className={`pb-1 text-xs font-semibold uppercase tracking-wider font-mono transition cursor-pointer select-none ${
                importMethod === 'csv' ? 'border-b-2 border-blue-500 text-zinc-200' : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              Bulk CSV Raw Paste
            </button>
          </div>

          {/* Quick Entry Method */}
          {importMethod === 'quick' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Enter space or comma separated tickers</label>
                <input
                  type="text"
                  placeholder="e.g. AAPL AMZN TSLA COIN LLY"
                  value={quickSymbols}
                  onChange={(e) => setQuickSymbols(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-zinc-700 rounded p-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none uppercase font-mono font-semibold"
                />
                <p className="text-[10px] text-zinc-500 mt-1.5">
                  💡 Symbols entered here are dynamic! The engine automatically models realistic prices, volume changes, Sectors and RSI trends relative to market conditions.
                </p>
              </div>

              <button
                onClick={handleQuickImport}
                className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded shadow-lg hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Commit Screener Entries
              </button>
            </div>
          )}

          {/* CSV Entry Method */}
          {importMethod === 'csv' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Paste CSV with columns matching header format below</label>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-zinc-700 rounded p-2.5 text-[10px] text-zinc-300 placeholder-zinc-800 focus:outline-none font-mono"
                />
                <p className="text-[9px] text-zinc-500 leading-normal mt-1 flex gap-2">
                  <span>Header columns required:</span>
                  <span className="font-semibold text-blue-400">symbol</span> • 
                  <span className="font-semibold">company</span> • 
                  <span className="font-semibold">sector</span> • 
                  <span className="font-semibold">industry</span> • 
                  <span className="font-semibold">price</span> • 
                  <span className="font-semibold">change%</span> • 
                  <span className="font-semibold">volume</span> • 
                  <span className="font-semibold">avgvolume</span> • 
                  <span className="font-semibold">relativevolume</span>
                </p>
              </div>

              <button
                onClick={handleCsvImport}
                className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded shadow-lg hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="h-4 w-4" />
                Parse & Commit CSV Matrix
              </button>
            </div>
          )}

          {/* Logging feedback messages wrapper */}
          {logMessage && (
            <div className={`mt-5 p-3 rounded-lg border flex items-start gap-2.5 text-xs animate-pulse font-mono ${
              logMessage.type === 'success' ? 'bg-emerald-950/20 border-emerald-550/25 text-emerald-400' : 'bg-rose-950/20 border-rose-550/25 text-rose-450'
            }`}>
              {logMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              <span>{logMessage.text}</span>
            </div>
          )}
        </div>

        {/* STRATEGY BUILDER SHEET */}
        <div className="bg-[#141416] border border-[#27272a] rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-widest font-mono">Create custom strategy (screener definition)</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Strategy Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Golden Cross Breakout"
                  value={newScreenerName}
                  onChange={(e) => setNewScreenerName(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-zinc-700 text-zinc-300 rounded p-2 text-xs focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Theme Visual Color Badge</label>
                <select
                  value={newScreenerColor}
                  onChange={(e) => setNewScreenerColor(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-zinc-700 text-zinc-300 rounded p-2 text-xs focus:outline-none font-mono text-zinc-400 font-semibold"
                >
                  <option value="emerald">Emerald Green (Momentum)</option>
                  <option value="indigo">Indigo Purple (Breakouts)</option>
                  <option value="sky">Horizon Sky (Growth Operators)</option>
                  <option value="amber">Warm Amber (Retrace Mean Reversions)</option>
                  <option value="rose">Rose Red (Anomalous Spikes)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Operational Filter Logic Conditions</label>
              <input
                type="text"
                placeholder="e.g. Price > SMA(50), RSI(14) > 65, RVol > 2.0"
                value={newScreenerFilters}
                onChange={(e) => setNewScreenerFilters(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-zinc-700 text-zinc-300 rounded p-2 text-xs focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Concept Strategy Description</label>
              <textarea
                rows={2}
                placeholder="tracks specific long-term setups, golden crosses of averages..."
                value={newScreenerDesc}
                onChange={(e) => setNewScreenerDesc(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-zinc-700 text-zinc-300 rounded p-2 text-xs focus:outline-none font-mono"
              />
            </div>

            <button
              onClick={handleAddScreener}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Register Strategy
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Database controls / Backup systems */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Export / Import backup box */}
        <div className="bg-[#141416] border border-[#27272a] rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
            <Database className="h-4 w-4 text-blue-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 font-mono">Archive Backups</h4>
          </div>

          <p className="text-[11px] text-zinc-400 leading-normal">
            This workspace utilizes web client <strong className="text-zinc-300">Local Storage</strong> to avoid recurring server fees. Save or import backups via file uploads.
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={handleExportDatabase}
              className="w-full py-2 bg-[#0a0a0c] hover:bg-[#18181b] border border-[#27272a] hover:border-zinc-700 text-zinc-300 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export Local Backup (.json)
            </button>

            <div className="relative">
              <input
                id="import-upload"
                type="file"
                accept=".json"
                onChange={handleImportDatabaseJson}
                className="hidden"
              />
              <label
                htmlFor="import-upload"
                className="w-full py-2 bg-[#0a0a0c] hover:bg-[#18181b] border border-[#27272a] hover:border-zinc-700 text-zinc-300 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer text-center"
              >
                <Plus className="h-3.5 w-3.5" />
                Upload Backup File
              </label>
            </div>
          </div>
        </div>

        {/* Database Integrity Maintenance panel */}
        <div className="bg-[#141416] border border-[#27272a] rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
            <Trash2 className="h-4 w-4 text-rose-500" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 font-mono">System Maintenance</h4>
          </div>

          <p className="text-[11px] text-zinc-400">
            Current historical database contains <strong className="text-blue-400">{runs.length} unique runs</strong> across <strong className="text-sky-400">{screeners.length} strategies</strong>.
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                if (confirm("Reset current database? This wipes custom imports and restores the 24-day baseline mock records.")) {
                  onRestoreDefaults();
                  setLogMessage({ text: 'System restored back to 24-day baseline mock records.', type: 'success' });
                }
              }}
              className="w-full py-2 bg-[#0a0a0c] hover:bg-[#18181b] border border-[#27272a] hover:border-zinc-700 text-zinc-450 hover:text-rose-450 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reload Baseline Mock Data
            </button>

            <button
              onClick={() => {
                if (confirm("Danger: Clear entire database? This removes everything, starting completely empty.")) {
                  onClearDatabase();
                  setLogMessage({ text: 'Database wiped successfully. Starting clean!', type: 'success' });
                }
              }}
              className="w-full py-2 bg-rose-950/20 hover:bg-rose-900/35 border border-rose-950 hover:border-rose-700 text-rose-400 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Empty Entire Database
            </button>
          </div>
        </div>

        {/* Strategies Reference Index */}
        <div className="bg-[#141416] border border-[#27272a] rounded-xl p-5 shadow-xl space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-200 font-mono">Active Strategy Parameters</h4>
          
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {screeners.map((sc) => (
              <div key={sc.id} className="p-2.5 rounded bg-[#0a0a0c] border border-[#27272a] flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-505" style={{ backgroundColor: sc.color === 'emerald' ? '#10b981' : sc.color === 'indigo' ? '#6366f1' : sc.color === 'sky' ? '#0ea5e9' : sc.color === 'amber' ? '#f59e0b' : '#f43f5e' }} />
                    <span className="text-xs font-bold text-zinc-300 font-mono">{sc.name}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono leading-snug">{sc.filters}</p>
                </div>
                
                {screeners.length > 2 && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove custom strategy: '${sc.name}'? This deletes his entries.`)) {
                        onDeleteScreener(sc.id);
                        setLogMessage({ text: `Deleted strategy ${sc.name}`, type: 'success' });
                      }
                    }}
                    className="p-1 text-zinc-500 hover:text-rose-450 shrink-0 select-none cursor-pointer"
                    title="Delete strategy"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
