import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../core/api';


const PrintReviewModal = ({ order, onClose, onApprove }) => {
  const shortId = order?.order_id ? order.order_id.split('-')[0] : '';

  // Parse files
  let files = [];
  try {
    const raw = typeof order?.files === 'string' ? JSON.parse(order.files) : (order?.files || []);
    files = raw.map(entry => {
      if (!entry) return null;
      if (entry.file_info && typeof entry.file_info === 'object') {
        return {
          name: entry.file_info.original_name || entry.file_info.name || 'Document.pdf',
          size: entry.file_info.size,
          pages: entry.file_info.pages || 1,
          print_options: entry.print_options,
          print_instructions: entry.print_instructions
        };
      }
      return {
        name: entry.original_name || entry.name || 'Document.pdf',
        pages: entry.pages || 1,
        print_options: entry.print_options,
        print_instructions: entry.print_instructions
      };
    }).filter(Boolean);
  } catch (e) {}

  // Parse initial print options
  let initialOpts = {};
  try {
    initialOpts = typeof order?.print_options === 'string' 
      ? JSON.parse(order.print_options) 
      : (order?.print_options || {});
  } catch (e) {}

  if (files.length > 0 && files[0].print_options) {
    try {
      const fileOpts = typeof files[0].print_options === 'string' 
        ? JSON.parse(files[0].print_options) 
        : files[0].print_options;
      initialOpts = { ...initialOpts, ...fileOpts };
    } catch (e) {}
  }

  // State for editable print settings
  const [colorMode, setColorMode] = useState(initialOpts.color || 'bw');
  const [copies, setCopies] = useState(Number(initialOpts.copies) || 1);
  const [paperSize, setPaperSize] = useState(initialOpts.size || 'A4');
  const [sides, setSides] = useState(initialOpts.sides || 'single');
  const [orientation, setOrientation] = useState(initialOpts.orientation || 'portrait');
  const [binding, setBinding] = useState(initialOpts.binding || 'none');
  const [pagesPerPaper, setPagesPerPaper] = useState(Number(initialOpts.pages_per_paper) || 1);
  
  // New features state
  const [pageRange, setPageRange] = useState(initialOpts.pages || initialOpts.page_range || '');
  const [padOddDuplex, setPadOddDuplex] = useState(initialOpts.pad_odd_duplex !== false);
  const [repeatImageOnGrid, setRepeatImageOnGrid] = useState(initialOpts.repeat_image_on_grid ?? true);
  
  // Multi-file grid collation state (e.g. 4 photos / 4 files on 1 sheet)
  const isMultiFile = files.length > 1;
  const [isMultiGrid, setIsMultiGrid] = useState(Boolean(initialOpts.multi_file_grid) || isMultiFile);
  const [gridPagesPerPaper, setGridPagesPerPaper] = useState(
    Number(initialOpts.pages_per_paper) > 1 ? Number(initialOpts.pages_per_paper) : (files.length <= 2 ? 2 : 4)
  );

  // Target printer state
  const [selectedPrinter, setSelectedPrinter] = useState(
    initialOpts.printer_name || localStorage.getItem('printit_last_selected_printer') || 'auto'
  );

  // Connected Agent / Printer state
  const [agentDevice, setAgentDevice] = useState(null);
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local/saved custom printers
  const [customPrinters, setCustomPrinters] = useState(() => {
    try {
      const saved = localStorage.getItem('printit_shop_printers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [newPrinterName, setNewPrinterName] = useState('');
  const [showAddPrinter, setShowAddPrinter] = useState(false);

  // Available printers list from agent device, saved custom printers, and fallbacks
  const availablePrinters = useMemo(() => {
    const list = new Set();
    
    // 1. From agent device reported printers
    if (agentDevice?.available_printers) {
      let raw = agentDevice.available_printers;
      if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch (e) { raw = []; }
      }
      if (Array.isArray(raw)) {
        raw.forEach(p => {
          const name = typeof p === 'string' ? p : p?.name;
          if (name) list.add(name);
        });
      }
    }
    if (agentDevice?.selected_printer) list.add(agentDevice.selected_printer);
    if (agentDevice?.selected_printer_bw) list.add(agentDevice.selected_printer_bw);
    if (agentDevice?.selected_printer_color) list.add(agentDevice.selected_printer_color);

    // 2. From saved custom printers
    customPrinters.forEach(p => { if (p) list.add(p); });

    return Array.from(list);
  }, [agentDevice, customPrinters]);

  useEffect(() => {
    let isMounted = true;
    const fetchAgentInfo = async () => {
      try {
        const res = await api.get('/shop/agent');
        if (isMounted) {
          setAgentDevice(res.data?.device || null);
          setLoadingAgent(false);
        }
      } catch (err) {
        console.warn('Could not fetch agent info:', err);
        if (isMounted) setLoadingAgent(false);
      }
    };
    fetchAgentInfo();
    return () => { isMounted = false; };
  }, []);

  const handleAddCustomPrinter = () => {
    const trimmed = newPrinterName.trim();
    if (!trimmed) return;
    const updated = Array.from(new Set([...customPrinters, trimmed]));
    setCustomPrinters(updated);
    try {
      localStorage.setItem('printit_shop_printers', JSON.stringify(updated));
    } catch(e) {}
    setSelectedPrinter(trimmed);
    setNewPrinterName('');
    setShowAddPrinter(false);
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    
    // If 'auto' is selected or left empty, send undefined so the agent auto-routes based on B&W/Color
    const targetPrinter = (selectedPrinter && selectedPrinter !== 'auto' && selectedPrinter !== 'Default Windows Spooler')
      ? selectedPrinter
      : undefined;

    const effectivePagesPerPaper = isMultiGrid ? gridPagesPerPaper : pagesPerPaper;

    const verifiedOptions = {
      ...initialOpts,
      color: colorMode,
      copies: Math.max(1, copies),
      size: paperSize,
      sides,
      orientation,
      binding,
      pages_per_paper: effectivePagesPerPaper,
      pages: pageRange?.trim() || undefined,
      pad_odd_duplex: sides === 'double' ? padOddDuplex : false,
      repeat_image_on_grid: repeatImageOnGrid,
      multi_file_grid: isMultiGrid && isMultiFile,
      printer_name: targetPrinter
    };

    if (targetPrinter) {
      try {
        localStorage.setItem('printit_last_selected_printer', targetPrinter);
      } catch (e) {}
    }

    try {
      await onApprove(order.order_id, verifiedOptions);
      onClose();
    } catch (err) {
      console.error('Approval failed:', err);
      setIsSubmitting(false);
    }
  };

  const isScheduled = initialOpts.pickup_type === 'scheduled' || order?.order_id?.startsWith('S');
  const phoneStr = order?.customer_phone || 'N/A';
  const isAgentOnline = agentDevice && agentDevice.status === 'ONLINE';

  if (!order) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="bg-surface-container rounded-2xl border border-glass-edge shadow-2xl max-w-2xl w-full max-h-[88vh] my-auto flex flex-col overflow-hidden text-on-surface relative"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="p-5 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-high/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-on-surface">Verify &amp; Approve Print Job</h2>
                <span className="font-display font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                  #{shortId}
                </span>
                {order.print_mode === 'secure' && (
                  <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    SECURE
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant">Review document specifications, collation, and printer routing before spooling.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Connected Printer Station Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isAgentOnline 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isAgentOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
              }`}>
                <span className="material-symbols-outlined text-[20px]">print</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-on-surface">Target Print Station:</span>
                  <span className="text-xs font-bold text-primary">
                    {agentDevice?.device_name || 'Counter-Station-1'}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isAgentOnline 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isAgentOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    {isAgentOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  B&amp;W Default: <strong className="text-primary font-bold">{agentDevice?.selected_printer_bw || 'Auto'}</strong> | Color Default: <strong className="text-primary font-bold">{agentDevice?.selected_printer_color || 'Auto'}</strong>
                </p>
              </div>
            </div>
            {!isAgentOnline && (
              <span className="text-[11px] text-amber-300/90 font-medium max-w-[180px] text-right">
                Job will queue and print immediately when agent connects.
              </span>
            )}
          </div>

          {/* Customer & Order Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-surface-container-high/40 p-4 rounded-xl border border-glass-edge/20 text-xs">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80 mb-0.5">CUSTOMER PHONE</span>
              <span className="font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">call</span>
                {phoneStr}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80 mb-0.5">SERVICE TYPE</span>
              <span className="font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">{isScheduled ? 'schedule' : 'bolt'}</span>
                {isScheduled ? 'Scheduled Pickup' : 'Express ASAP'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/80 mb-0.5">DOCUMENTS</span>
              <span className="font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                {files.length > 0 ? `${files.length} file(s)` : '1 file'}
              </span>
            </div>
          </div>

          {/* Customer Instructions if any */}
          {(order.print_instructions || initialOpts.instructions) && (
            <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg text-amber-300 text-xs">
              <span className="font-bold block mb-0.5">Customer Instructions:</span>
              <p className="italic">"{order.print_instructions || initialOpts.instructions}"</p>
            </div>
          )}

          {/* NEW: Multi-File Collation Card (When >1 file is uploaded) */}
          {isMultiFile && (
            <div className="bg-primary/10 p-4 rounded-xl border border-primary/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">auto_awesome_mosaic</span>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Multi-File Collation ({files.length} Uploaded Documents)</h4>
                    <p className="text-[11px] text-on-surface-variant">Combine multiple uploaded files onto a single sheet grid.</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-surface-container px-3 py-1.5 rounded-lg border border-glass-edge/40">
                  <span className="text-xs font-semibold text-primary">Combine on 1 Sheet</span>
                  <input
                    type="checkbox"
                    checked={isMultiGrid}
                    onChange={(e) => setIsMultiGrid(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </label>
              </div>

              {isMultiGrid && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-primary/20 gap-2 text-xs">
                  <span className="text-on-surface-variant font-medium">
                    Grid tiling for {files.length} files:
                  </span>
                  <div className="flex items-center gap-2">
                    {[
                      { val: 2, label: '2-up (2/sheet)' },
                      { val: 4, label: '4-up (4/sheet)' },
                      { val: 6, label: '6-up (6/sheet)' }
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setGridPagesPerPaper(val)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          gridPagesPerPaper === val
                            ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/30'
                            : 'bg-surface-container text-on-surface hover:bg-surface-variant border border-glass-edge/40'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Print Settings Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Print Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Color Mode */}
              <div className="bg-surface-container-high/30 p-3.5 rounded-xl border border-glass-edge/30">
                <label className="block text-xs font-bold text-on-surface mb-2">Color Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setColorMode('bw')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      colorMode === 'bw'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container hover:bg-surface-variant text-on-surface border border-glass-edge/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">contrast</span>
                    Black &amp; White
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('color')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      colorMode === 'color'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container hover:bg-surface-variant text-on-surface border border-glass-edge/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">palette</span>
                    Color
                  </button>
                </div>
              </div>

              {/* Number of Copies */}
              <div className="bg-surface-container-high/30 p-3.5 rounded-xl border border-glass-edge/30">
                <label className="block text-xs font-bold text-on-surface mb-2">Number of Copies</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCopies(prev => Math.max(1, prev - 1))}
                    className="w-10 h-9 rounded-lg bg-surface-container hover:bg-surface-variant border border-glass-edge/40 flex items-center justify-center text-on-surface font-bold text-base transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center py-1.5 bg-surface-container border border-primary/40 rounded-lg text-sm font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setCopies(prev => prev + 1)}
                    className="w-10 h-9 rounded-lg bg-surface-container hover:bg-surface-variant border border-glass-edge/40 flex items-center justify-center text-on-surface font-bold text-base transition-colors cursor-pointer"
                  >
                    +
                  </button>
                  <span className="text-xs text-on-surface-variant font-medium">sets</span>
                </div>
              </div>

              {/* Sides (Single / Double) */}
              <div className="bg-surface-container-high/30 p-3.5 rounded-xl border border-glass-edge/30">
                <label className="block text-xs font-bold text-on-surface mb-2">Print Sides</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSides('single')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sides === 'single'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container hover:bg-surface-variant text-on-surface border border-glass-edge/40'
                    }`}
                  >
                    Single-Sided
                  </button>
                  <button
                    type="button"
                    onClick={() => setSides('double')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sides === 'double'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container hover:bg-surface-variant text-on-surface border border-glass-edge/40'
                    }`}
                  >
                    Double-Sided (Duplex)
                  </button>
                </div>
              </div>

              {/* Paper Size */}
              <div className="bg-surface-container-high/30 p-3.5 rounded-xl border border-glass-edge/30">
                <label className="block text-xs font-bold text-on-surface mb-2">Paper Size</label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value)}
                  className="w-full py-2 px-3 bg-surface-container border border-glass-edge/40 rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="A4">A4 (Standard 210 × 297 mm)</option>
                  <option value="A3">A3 (297 × 420 mm)</option>
                  <option value="Legal">Legal (8.5 × 14 in)</option>
                  <option value="Letter">Letter (8.5 × 11 in)</option>
                </select>
              </div>

              {/* Orientation */}
              <div className="bg-surface-container-high/30 p-3.5 rounded-xl border border-glass-edge/30">
                <label className="block text-xs font-bold text-on-surface mb-2">Orientation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container hover:bg-surface-variant text-on-surface border border-glass-edge/40'
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container hover:bg-surface-variant text-on-surface border border-glass-edge/40'
                    }`}
                  >
                    Landscape
                  </button>
                </div>
              </div>

              {/* Binding */}
              <div className="bg-surface-container-high/30 p-3.5 rounded-xl border border-glass-edge/30">
                <label className="block text-xs font-bold text-on-surface mb-2">Binding / Finishing</label>
                <select
                  value={binding}
                  onChange={(e) => setBinding(e.target.value)}
                  className="w-full py-2 px-3 bg-surface-container border border-glass-edge/40 rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="none">None (Loose sheets)</option>
                  <option value="staple">Corner Staple</option>
                  <option value="spiral">Spiral Binding</option>
                  <option value="soft_cover">Soft Cover Book</option>
                </select>
              </div>

              {/* NEW: Selective Page Range Input */}
              <div className="bg-surface-container-high/30 p-3.5 rounded-xl border border-glass-edge/30 sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">filter_none</span>
                    Selective Page Printing (Optional)
                  </label>
                  <span className="text-[11px] text-on-surface-variant">e.g. 1-5, 8, 11-14 or leave blank for All</span>
                </div>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="Leave empty to print all document pages"
                  className="w-full py-2 px-3 bg-surface-container border border-glass-edge/40 rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Pages Per Sheet (Single-file N-Up Grid) - only when not in multi-grid */}
              {!isMultiGrid && (
                <div className="bg-surface-container-high/30 p-3.5 rounded-xl border border-glass-edge/30 sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-on-surface">Pages Per Sheet (Layout Grid)</label>
                    {pagesPerPaper > 1 && (
                      <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        {pagesPerPaper} Pages Tiled On 1 Sheet
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { val: 1, label: 'Standard (1 Page)' },
                      { val: 2, label: '2 Pages (2-up)' },
                      { val: 4, label: '4 Pages (4-up)' },
                      { val: 6, label: '6 Pages (6-up)' }
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPagesPerPaper(val)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                          pagesPerPaper === val
                            ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/40'
                            : 'bg-surface-container hover:bg-surface-variant text-on-surface border border-glass-edge/40'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplex Padding & Repeat Image Toggles */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sides === 'double' && (
                  <label className="bg-surface-container-high/30 p-3 rounded-xl border border-glass-edge/30 flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="block text-xs font-bold text-on-surface">Duplex Sheet Padding</span>
                      <span className="text-[11px] text-on-surface-variant">Pad blank sheet for odd-page jobs</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={padOddDuplex}
                      onChange={(e) => setPadOddDuplex(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                  </label>
                )}

                <label className="bg-surface-container-high/30 p-3 rounded-xl border border-glass-edge/30 flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="block text-xs font-bold text-on-surface">Repeat Image on Grid</span>
                    <span className="text-[11px] text-on-surface-variant">Fill all cells for 1-page photo/cards</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={repeatImageOnGrid}
                    onChange={(e) => setRepeatImageOnGrid(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </label>
              </div>

              {/* Destination Hardware Printer */}
              <div className="bg-surface-container-high/30 p-3.5 rounded-xl border border-glass-edge/30 sm:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">local_printshop</span>
                    Target Hardware Printer
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPrinter(!showAddPrinter)}
                      className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {showAddPrinter ? 'close' : 'add'}
                      </span>
                      {showAddPrinter ? 'Cancel' : 'Add Custom'}
                    </button>
                  </div>
                </div>

                {showAddPrinter && (
                  <div className="mb-3 p-3 bg-surface-container rounded-lg border border-primary/30 flex items-center gap-2 animate-fade-in">
                    <input
                      type="text"
                      value={newPrinterName}
                      onChange={(e) => setNewPrinterName(e.target.value)}
                      placeholder="e.g. EPSON L3250 Series or Virtual Test Printer"
                      className="flex-1 py-1.5 px-3 bg-surface-container-high border border-glass-edge/40 rounded text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomPrinter(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomPrinter}
                      className="px-3 py-1.5 bg-primary text-on-primary font-bold rounded text-xs hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
                    >
                      Add &amp; Select
                    </button>
                  </div>
                )}

                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="w-full py-2.5 px-3 bg-surface-container border border-glass-edge/40 rounded-lg text-xs font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="auto">
                    ⚡ Auto-Route (Routes B&amp;W to Mono, Color to Color Hardware)
                  </option>
                  {availablePrinters.map((p) => (
                    <option key={p} value={p} className="bg-surface-container text-on-surface">
                      {p}
                    </option>
                  ))}
                </select>

                <p className="text-[11px] text-on-surface-variant mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-primary">info</span>
                  {selectedPrinter === 'auto'
                    ? `Auto-routing active: ${colorMode === 'color' ? '🎨 Will route to Color Printer' : '⚫ Will route to B&W Printer'}`
                    : `Direct routing to: ${selectedPrinter}`}
                </p>
              </div>

            </div>
          </div>

          {/* Files List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Document Files ({files.length})
              </label>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">lock</span>
                Zero-Trace Spooling
              </span>
            </div>
            <div className="space-y-2">
              {files.map((file, idx) => (
                <div 
                  key={idx} 
                  className="p-3 bg-surface-container-high/30 rounded-xl border border-glass-edge/20 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="material-symbols-outlined text-[20px] text-primary">picture_as_pdf</span>
                    <span className="font-semibold text-on-surface truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-on-surface-variant text-[11px]">
                    {file.size && <span>{Math.round(file.size / 1024)} KB</span>}
                    <span className="bg-surface-container px-2 py-0.5 rounded border border-glass-edge/30 font-medium">
                      {file.pages} page{file.pages > 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[12px]">security</span>
                      Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-outline-variant/60 bg-surface-container-high/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-400 select-none self-start sm:self-center">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span className="font-semibold text-[11px] tracking-tight">Silent Agent Spooling · Temporary files deleted immediately</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-glass-edge/50 hover:bg-surface-variant text-on-surface font-semibold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Assigning &amp; Spooling...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">local_printshop</span>
                  <span>{isMultiGrid ? `Accept & Print Combined (${files.length} Files)` : 'Accept & Print Document'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PrintReviewModal;

