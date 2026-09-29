import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../core/api';

const OrderDetailModal = ({ order, onClose, onStatusUpdate, onPrint, onReviewAndAccept }) => {
  if (!order) return null;


  const shortId = order.order_id ? order.order_id.split('-')[0] : '';
  
  let files = [];
  try {
    const raw = typeof order.files === 'string' ? JSON.parse(order.files) : (order.files || []);
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
  } catch(e) {}

  let opts = {};
  try {
    opts = typeof order.print_options === 'string' ? JSON.parse(order.print_options) : (order.print_options || {});
  } catch(e) {}
  if (files.length > 0 && files[0].print_options) {
    try {
      const fileOpts = typeof files[0].print_options === 'string' ? JSON.parse(files[0].print_options) : files[0].print_options;
      opts = { ...opts, ...fileOpts };
    } catch(e) {}
  }

  // Extract Customer Instructions / Description with full fallback
  const customerInstructions = useMemo(() => {
    if (order.print_instructions && typeof order.print_instructions === 'string' && order.print_instructions.trim()) {
      return order.print_instructions.trim();
    }
    if (opts.instructions && typeof opts.instructions === 'string' && opts.instructions.trim()) {
      return opts.instructions.trim();
    }
    if (opts.print_instructions && typeof opts.print_instructions === 'string' && opts.print_instructions.trim()) {
      return opts.print_instructions.trim();
    }
    for (const f of files) {
      if (f.print_instructions && typeof f.print_instructions === 'string' && f.print_instructions.trim()) {
        return f.print_instructions.trim();
      }
    }
    return '';
  }, [order.print_instructions, opts, files]);

  const isScheduled = opts.pickup_type === 'scheduled' || order.order_id?.startsWith('S');
  let pickupTimeStr = 'ASAP Pickup';
  if (isScheduled && opts.pickup_time) {
    const pt = new Date(opts.pickup_time);
    pickupTimeStr = pt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + pt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Print layout specs
  const isBw = opts.color !== 'color';
  const isLandscape = opts.orientation === 'landscape';
  const isMultiGrid = Boolean(opts.multi_file_grid) || (files.length > 1 && Boolean(opts.pages_per_paper && Number(opts.pages_per_paper) > 1));
  const pagesPerPaper = Number(opts.pages_per_paper) || (isMultiGrid ? (files.length <= 2 ? 2 : 4) : 1);
  const isDuplex = opts.sides === 'double';

  // Preview state: download URLs for files
  const [fileUrls, setFileUrls] = useState({});
  const [activeSide, setActiveSide] = useState('front'); // 'front' | 'back'
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadUrls = async () => {
      if (!order?.order_id || order.files_deleted) return;
      const urls = {};
      for (let i = 0; i < files.length; i++) {
        try {
          const res = await api.get(`/shop/orders/${order.order_id}/files/${i}/download-url`);
          if (res.data?.download_url) {
            urls[i] = res.data.download_url;
          }
        } catch (e) {
          console.warn(`Could not load preview URL for file ${i}:`, e.message);
        }
      }
      if (isMounted) {
        setFileUrls(urls);
      }
    };
    loadUrls();
    return () => { isMounted = false; };
  }, [order?.order_id, files.length, order?.files_deleted]);

  // Dynamic time estimation
  const getTimeEstimate = () => {
    if (order.status === 'ready' || order.status === 'collected') return 'Ready!';
    if (order.status === 'processing') return '~2 mins left';

    const totalPages = files.reduce((sum, f) => sum + (parseInt(f.pages) || 1), 0);
    const copies = parseInt(opts.copies) || 1;
    const queuePos = parseInt(order.queue_position) || 1;

    const minutesForThisOrder = 2 + (totalPages * 0.3 * copies);
    const totalMins = Math.round(minutesForThisOrder * queuePos);

    if (totalMins <= 2) return '~2 mins';
    if (totalMins >= 60) {
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      return mins > 0 ? `~${hrs}h ${mins}m` : `~${hrs}h`;
    }
    return `~${totalMins} mins`;
  };

  // Helper to determine if file is an image
  const isImageFile = (name) => {
    return /\.(jpe?g|png|webp|gif|bmp)$/i.test(name || '');
  };

  // Build grid blocks according to pagesPerPaper
  const blockCount = pagesPerPaper > 0 ? pagesPerPaper : 1;
  const blocks = Array.from({ length: blockCount }, (_, idx) => {
    // In multi-file grid, block 0 = file 0, block 1 = file 1, etc.
    const fileIdx = isMultiGrid ? (idx % files.length) : 0;
    const targetFile = files[fileIdx] || files[0] || { name: 'Document.pdf', pages: 1 };
    const url = fileUrls[fileIdx];
    return {
      index: idx,
      fileIndex: fileIdx,
      file: targetFile,
      url,
      isImage: isImageFile(targetFile.name)
    };
  });

  // Extract Selective Page Range if customer specified one
  const pageRange = useMemo(() => {
    if (opts.page_range && typeof opts.page_range === 'string' && opts.page_range.trim()) {
      return opts.page_range.trim();
    }
    for (const f of files) {
      if (f.page_range && typeof f.page_range === 'string' && f.page_range.trim()) {
        return f.page_range.trim();
      }
      if (f.print_options) {
        try {
          const po = typeof f.print_options === 'string' ? JSON.parse(f.print_options) : f.print_options;
          if (po && po.page_range) return po.page_range.trim();
        } catch (e) {}
      }
    }
    return '';
  }, [opts, files]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-4xl max-h-[88vh] my-auto flex flex-col shadow-[0_16px_64px_rgba(0,0,0,0.6)] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-display text-2xl font-bold text-primary">#{shortId}</h3>
              <span className="text-xs text-on-surface font-semibold bg-surface-bright px-2.5 py-0.5 rounded border border-outline-variant shadow-sm">
                Order Details
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                order.status === 'queued' ? 'bg-primary/20 text-primary border-primary/30' :
                order.status === 'processing' ? 'bg-yellow-500/20 text-yellow-500 dark:text-yellow-300 border-yellow-500/40' :
                order.status === 'ready' ? 'bg-green-500/20 text-green-600 dark:text-green-300 border-green-500/40' :
                'bg-surface-container-highest text-on-surface border-outline-variant'
              }`}>
                {order.status}
              </span>
              {order.queue_position && order.status === 'queued' && (
                <span className="bg-surface-bright border border-outline-variant px-2.5 py-0.5 rounded text-xs font-mono font-bold text-on-surface">
                  Queue Pos #{order.queue_position}
                </span>
              )}

              {pageRange && (
                <span className="inline-flex items-center gap-1 bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[12px]">filter_none</span>
                  PAGES: {pageRange}
                </span>
              )}
              {opts.multi_file_grid && (
                <span className="inline-flex items-center gap-1 bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[12px]">grid_view</span>
                  {pagesPerPaper}-UP GRID COLLATION
                </span>
              )}
              {order.files_deleted && (
                <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">delete_sweep</span>
                  Files Erased
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant font-medium mt-1">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>


          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-bright border border-outline-variant text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto kanban-col flex flex-col gap-5">

          {/* PROMINENT CUSTOMER INSTRUCTIONS / DESCRIPTION CARD */}
          <div className={`p-4 rounded-xl border transition-all ${
            customerInstructions
              ? 'bg-amber-500/10 border-amber-500/50 text-on-surface shadow-sm'
              : 'bg-surface-bright border-outline-variant/60 text-on-surface-variant'
          }`}>
            <div className="flex items-center gap-2 mb-1.5 font-bold text-xs uppercase tracking-wider">
              <span className={`material-symbols-outlined text-[18px] ${customerInstructions ? 'text-amber-500' : 'text-on-surface-variant'}`}>
                sticky_note_2
              </span>
              <span className={customerInstructions ? 'text-amber-600 dark:text-amber-300 font-bold' : 'text-on-surface-variant'}>
                Customer Note &amp; Print Description
              </span>
              {customerInstructions && (
                <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-mono font-bold border border-amber-500/30">
                  SPECIAL INSTRUCTIONS
                </span>
              )}
            </div>
            <p className="text-sm font-semibold leading-relaxed break-words">
              {customerInstructions || 'No special instructions left by customer. Proceed with standard print options.'}
            </p>
          </div>

          {/* TWO COLUMN WORKSPACE: LEFT (VISUAL SHEET OUTPUT PREVIEW) | RIGHT (SPECS & DETAILS) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            
            {/* LEFT: VISUAL PRINT SHEET CANVAS (Customer-Side Match) */}
            <div className="md:col-span-5 bg-surface-bright p-4 rounded-2xl border border-outline-variant flex flex-col items-center">
              
              {/* Preview Header */}
              <div className="w-full flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">visibility</span>
                  Sheet Output Preview
                </span>
                <span className="text-[10px] font-mono font-bold bg-surface-container px-2 py-0.5 rounded border border-outline-variant text-on-surface">
                  {opts.size || 'A4'} • {isLandscape ? 'Landscape' : 'Portrait'}
                </span>
              </div>

              {/* Physical A4 Sheet Container */}
              <div className="w-full flex justify-center py-2">
                <div 
                  className={`bg-white rounded-md shadow-[0_6px_24px_rgba(0,0,0,0.18)] border border-slate-300 relative overflow-hidden transition-all flex flex-col ${
                    isLandscape ? 'w-[280px] h-[198px]' : 'w-[200px] h-[282px]'
                  }`}
                  style={{
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  {/* Subtle 5mm printable margin guide */}
                  <div className="absolute inset-1.5 border border-dashed border-sky-400/40 rounded pointer-events-none z-10"></div>

                  {/* Grid Layout Canvas */}
                  <div 
                    className={`w-full h-full p-2 grid gap-1.5 ${
                      blockCount === 1 ? 'grid-cols-1 grid-rows-1' :
                      blockCount === 2 ? (isLandscape ? 'grid-cols-2 grid-rows-1' : 'grid-cols-1 grid-rows-2') :
                      blockCount === 4 ? 'grid-cols-2 grid-rows-2' :
                      'grid-cols-2 grid-rows-3'
                    }`}
                  >
                    {blocks.map((b) => (
                      <div 
                        key={b.index}
                        className="relative bg-slate-50 border border-slate-200 rounded flex items-center justify-center overflow-hidden"
                      >
                        {b.url && b.isImage ? (
                          <img 
                            src={b.url}
                            alt={b.file.name}
                            className="w-full h-full object-contain pointer-events-none"
                            style={{ filter: isBw ? 'grayscale(100%) contrast(108%)' : 'none' }}
                          />
                        ) : b.url && !b.isImage ? (
                          <div 
                            className="w-full h-full flex flex-col items-center justify-center p-1 text-center bg-slate-50"
                            style={{ filter: isBw ? 'grayscale(100%)' : 'none' }}
                          >
                            <span className="material-symbols-outlined text-primary text-xl">picture_as_pdf</span>
                            <span className="text-[8px] font-semibold text-slate-800 line-clamp-1 max-w-[80px]">
                              {b.file.name}
                            </span>
                          </div>
                        ) : (
                          <div 
                            className="w-full h-full flex flex-col items-center justify-center p-1 text-center"
                            style={{ filter: isBw ? 'grayscale(100%)' : 'none' }}
                          >
                            <span className="material-symbols-outlined text-slate-400 text-lg">description</span>
                            <span className="text-[8px] font-medium text-slate-600 line-clamp-1">
                              {b.file.name}
                            </span>
                          </div>
                        )}

                        {/* Block Index Badge */}
                        <span className="absolute top-0.5 left-0.5 bg-black/65 text-white text-[8px] font-mono px-1 rounded z-20">
                          #{b.index + 1}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* B&W Laser Print Indicator Ribbon */}
                  {isBw && (
                    <div className="absolute top-0 right-0 bg-slate-800 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl shadow-sm z-20">
                      B&amp;W
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Footer Badges & Controls */}
              <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-outline-variant/60 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[15px] text-primary">layers</span>
                  <span>{pagesPerPaper}-Up Grid</span>
                  <span>•</span>
                  <span>{isBw ? '⬛ Black & White' : '🎨 Full Color'}</span>
                </div>

                {isDuplex && (
                  <div className="flex items-center gap-1 p-0.5 bg-surface-container rounded-lg border border-outline-variant">
                    <button
                      onClick={() => setActiveSide('front')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${activeSide === 'front' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}
                    >
                      Front
                    </button>
                    <button
                      onClick={() => setActiveSide('back')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${activeSide === 'back' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'}`}
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>

              {/* Open full file preview link */}
              {fileUrls[0] && !order.files_deleted && (
                <button
                  type="button"
                  onClick={() => window.open(fileUrls[0], '_blank')}
                  className="w-full mt-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  Open Full Document in New Tab
                </button>
              )}
            </div>

            {/* RIGHT: SPECS, PRICING & ATTACHED DOCUMENTS */}
            <div className="md:col-span-7 flex flex-col gap-4">
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-surface-bright p-3 rounded-xl border border-outline-variant">
                  <span className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mb-0.5">Total Price</span>
                  <span className="text-xl font-bold text-on-surface font-mono">₹{order.amount_total}</span>
                  <span className={`block text-[10px] font-semibold mt-0.5 ${order.payment_status === 'captured' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                    {order.payment_status === 'captured' ? '✓ Paid' : '⌛ Pending'}
                  </span>
                </div>

                <div className="bg-surface-bright p-3 rounded-xl border border-outline-variant">
                  <span className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mb-0.5">Color Mode</span>
                  <span className="text-xs font-bold text-on-surface">
                    {opts.color === 'color' ? '🎨 Full Color' : '⬛ Black & White'}
                  </span>
                  <span className="block text-[10px] text-on-surface-variant mt-0.5">
                    {opts.sides === 'double' ? 'Double Sided' : 'Single Sided'}
                  </span>
                </div>

                <div className="bg-surface-bright p-3 rounded-xl border border-outline-variant">
                  <span className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mb-0.5">Paper & Copies</span>
                  <span className="text-xs font-bold text-on-surface">
                    {opts.size || 'A4'} • {opts.copies || 1} {opts.copies > 1 ? 'copies' : 'copy'}
                  </span>
                  <span className="block text-[10px] text-on-surface-variant mt-0.5 truncate">
                    Binding: {opts.binding || 'None'}
                  </span>
                </div>

                <div className="bg-surface-bright p-3 rounded-xl border border-outline-variant">
                  <span className="block text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mb-0.5">Customer Phone</span>
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1 font-mono">
                    <span className="material-symbols-outlined text-[13px] text-primary">call</span>
                    {order.customer_phone || 'N/A'}
                  </span>
                  <span className="block text-[10px] text-on-surface-variant mt-0.5">
                    {order.customer_phone ? 'Direct call' : 'Guest'}
                  </span>
                </div>
              </div>

              {/* Pickup Notice */}
              <div className="bg-surface-container-high border border-outline-variant p-3 rounded-xl flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">local_shipping</span>
                <div>
                  <h4 className="text-xs font-bold text-on-surface">
                    {isScheduled ? 'Scheduled Pickup' : 'Express Immediate Pickup'}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 font-medium">
                    {isScheduled ? `Scheduled for: ${pickupTimeStr}` : 'Customer will pick up as soon as ready.'}
                  </p>
                </div>
              </div>

              {/* Selective Page Range Banner */}
              {pageRange && (
                <div className="bg-sky-500/10 border border-sky-500/30 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-sky-500 text-[22px]">filter_none</span>
                    <div>
                      <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        Selective Page Printing
                        <span className="text-[10px] bg-sky-500/20 text-sky-700 dark:text-sky-300 font-mono font-bold px-1.5 py-0.2 rounded border border-sky-500/30">
                          CUSTOM RANGE
                        </span>
                      </h4>
                      <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                        Customer requested to print only specified pages
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-sm text-sky-600 dark:text-sky-300 bg-sky-500/20 px-3 py-1.5 rounded-lg border border-sky-500/40 shadow-sm">
                    {pageRange}
                  </span>
                </div>
              )}


              {/* Attached Files List */}
              <div className="bg-surface-bright p-4 rounded-xl border border-outline-variant">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                    Attached Files ({files.length})
                  </span>
                  {opts.multi_file_grid && (
                    <span className="text-[10px] bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded font-bold border border-cyan-500/30">
                      Collated onto 1 Sheet
                    </span>
                  )}
                </h4>

                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {files.length === 0 ? (
                    <div className="p-3 bg-surface-container rounded-lg border border-outline-variant text-xs text-on-surface-variant text-center">
                      No explicit file metadata attached to this order.
                    </div>
                  ) : (
                    files.map((f, idx) => (
                      <div key={idx} className="bg-surface-container border border-outline-variant p-2.5 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="material-symbols-outlined text-primary text-lg">
                            {isImageFile(f.name) ? 'image' : 'picture_as_pdf'}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-bold text-on-surface truncate">{f.name}</p>
                            <p className="text-[10px] text-on-surface-variant">{f.pages} {f.pages > 1 ? 'pages' : 'page'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {fileUrls[idx] && !order.files_deleted && (
                            <button
                              type="button"
                              onClick={() => window.open(fileUrls[idx], '_blank')}
                              className="px-2.5 py-1 bg-surface-bright hover:bg-surface-variant text-on-surface border border-outline-variant font-medium rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              title="Open original file"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                              View
                            </button>
                          )}
                          {order.files_deleted ? (
                            <span className="px-2 py-1 bg-surface-bright text-on-surface-variant/70 border border-outline-variant rounded text-[10px] flex items-center gap-1 font-medium">
                              <span className="material-symbols-outlined text-[13px] text-emerald-400">check_circle</span>
                              Erased
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onPrint(order.order_id, idx)}
                              className="px-2.5 py-1 bg-primary text-on-primary hover:bg-primary/90 font-bold rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                              title="Print to connected Print Agent"
                            >
                              <span className="material-symbols-outlined text-[14px]">print</span>
                              Print
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Order Status & Progress (High Contrast) */}
              <div className="bg-surface-bright p-3 rounded-xl border border-outline-variant flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold font-mono text-base">
                    #{order.queue_position || '1'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Estimated Queue Time</span>
                    <p className="text-xs font-bold text-on-surface">{getTimeEstimate()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Mode</span>
                  <p className="text-xs font-bold text-on-surface capitalize">{order.print_mode || 'Normal'}</p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-low flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              disabled={Boolean(order.files_deleted)}
              onClick={() => onPrint(order.order_id)}
              className={`px-4 py-2 border rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                order.files_deleted
                  ? 'bg-surface-bright/50 border-outline-variant/50 text-outline cursor-not-allowed opacity-60'
                  : 'bg-surface-bright border-outline-variant text-on-surface hover:border-primary hover:text-primary transition-colors cursor-pointer shadow-sm'
              }`}
              title={order.files_deleted ? 'Document files have been permanently erased' : ''}
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Print Document
            </button>
          </div>

          <div className="flex items-center gap-2">
            {order.status === 'queued' && (
              <>
                <button
                  onClick={() => { 
                    if (onReviewAndAccept) {
                      onClose();
                      onReviewAndAccept(order);
                    } else {
                      onStatusUpdate(order.order_id, 'processing'); 
                      onClose(); 
                    }
                  }}
                  className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">local_printshop</span>
                  Accept &amp; Choose Printer
                </button>
                <button
                  onClick={() => { onStatusUpdate(order.order_id, 'cancelled'); onClose(); }}
                  className="px-3 py-2 bg-error/10 border border-error/30 text-error font-semibold rounded-lg text-xs hover:bg-error/20 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  Reject Order
                </button>
              </>
            )}

            {order.status === 'processing' && (
              <>
                {onReviewAndAccept && (
                  <button
                    onClick={() => {
                      onClose();
                      onReviewAndAccept(order);
                    }}
                    className="px-3 py-2 bg-surface-bright border border-outline-variant text-primary hover:border-primary font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                    title="Change target printer or re-spool to Print Agent"
                  >
                    <span className="material-symbols-outlined text-[16px]">local_printshop</span>
                    Change Printer
                  </button>
                )}
                <button
                  onClick={() => { onStatusUpdate(order.order_id, 'ready'); onClose(); }}
                  className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">check_box</span>
                  Mark Ready for Pickup
                </button>
              </>
            )}

            {order.status === 'ready' && (
              <button
                onClick={() => { onStatusUpdate(order.order_id, 'collected'); onClose(); }}
                className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                Mark Handed to Customer
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface-container-highest border border-outline-variant text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-variant cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrderDetailModal;

