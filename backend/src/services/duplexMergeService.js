const path = require('path');
const crypto = require('crypto');
const { PDFDocument } = require('pdf-lib');
const documentConverter = require('./documentConverter');
const { getStorage } = require('../config/firebase');

/**
 * Extracts storage path or download URL from a raw file object
 */
function getStoragePath(rawFile) {
  const fileInfo = (rawFile && rawFile.file_info && typeof rawFile.file_info === 'object')
    ? rawFile.file_info
    : rawFile;
  return fileInfo && (fileInfo.storage_path || fileInfo.public_id || fileInfo.s3_key || fileInfo.url || fileInfo.file_url || null);
}

/**
 * Checks if the given order and print options qualify for Back-to-Back duplex merging.
 */
function isBackToBackDuplex(files, printOptions = {}) {
  if (!Array.isArray(files) || files.length <= 1) return false;
  const isMultiGrid = Boolean(printOptions.multi_file_grid);
  if (isMultiGrid) return false;

  return Boolean(
    printOptions.merge_back_to_back === true ||
    printOptions.mergeBackToBack === true ||
    files.some(rawFile => {
      const entry = (rawFile && rawFile.file_info && typeof rawFile.file_info === 'object') ? rawFile.file_info : (rawFile || {});
      const opts = entry.print_options || rawFile.print_options || {};
      return opts.merge_back_to_back === true || opts.mergeBackToBack === true;
    })
  );
}

/**
 * Downloads and merges all files into a single unified multi-page PDF, uploads it to Firebase,
 * and returns the publicUrl, storagePath, and pageCount.
 */
async function generateMergedDuplexPdf(orderId, files) {
  const bucket = getStorage().bucket();
  const fileItems = [];

  for (let i = 0; i < files.length; i++) {
    const rawFile = files[i];
    const sPath = getStoragePath(rawFile);
    const fileName = (rawFile && rawFile.file_info && (rawFile.file_info.original_name || rawFile.file_info.originalname))
      || rawFile.original_name
      || (sPath ? path.basename(sPath) : `file_${i}.pdf`);

    if (sPath) {
      try {
        if (sPath.startsWith('http://') || sPath.startsWith('https://')) {
          const fetchRes = await fetch(sPath);
          const arrayBuf = await fetchRes.arrayBuffer();
          fileItems.push({ buffer: Buffer.from(arrayBuf), name: fileName });
        } else {
          const [fileBuffer] = await bucket.file(sPath).download();
          fileItems.push({ buffer: fileBuffer, name: fileName });
        }
      } catch (dlErr) {
        console.warn(`[DuplexMergeService] Could not download file ${sPath}:`, dlErr.message);
      }
    }
  }

  if (fileItems.length === 0) {
    throw new Error('No valid file contents could be retrieved for back-to-back duplex merging');
  }

  // Merge into a single PDF buffer
  const mergedBuffer = await documentConverter.mergeAnyFilesToSinglePdf(fileItems);
  
  // Calculate total pages
  let pageCount = 2;
  try {
    const doc = await PDFDocument.load(mergedBuffer);
    pageCount = doc.getPageCount();
  } catch (_) {}

  // Upload to Firebase Storage with a secure download token
  const downloadToken = crypto.randomUUID();
  const mergedStoragePath = `printit/merged/merged_${orderId}_${Date.now()}.pdf`;
  const mergedFile = bucket.file(mergedStoragePath);

  await mergedFile.save(mergedBuffer, {
    metadata: {
      contentType: 'application/pdf',
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
        print_mode: 'normal',
        uploaded_at: new Date().toISOString()
      }
    },
    resumable: false
  });

  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(mergedFile.name)}?alt=media&token=${downloadToken}`;

  return {
    mergedStoragePath,
    publicUrl,
    pageCount,
    fileCount: fileItems.length
  };
}

/**
 * Ensures a single merged back-to-back duplex print job is queued in print_jobs (and agent_print_jobs).
 * Deduplicates to prevent multiple submissions.
 */
async function queueMergedDuplexPrintJob(pool, { orderId, shopId, files, printOptions }) {
  // Check if a job for this order was already queued very recently (last 30s)
  const existingRes = await pool.query(
    "SELECT id, status FROM print_jobs WHERE order_id = $1 AND created_at > NOW() - INTERVAL '30 seconds' LIMIT 1",
    [orderId]
  );
  if (existingRes.rows.length > 0) {
    console.log(`[DuplexMergeService] Merged duplex job already queued (${existingRes.rows[0].status}) for order ${orderId}, skipping duplicate queue.`);
    return { success: true, alreadyQueued: true, jobId: existingRes.rows[0].id };
  }

  const { mergedStoragePath, publicUrl, pageCount, fileCount } = await generateMergedDuplexPdf(orderId, files);

  const duplexOpts = {
    ...printOptions,
    sides: 'double',
    merge_back_to_back: true,
    multi_file_grid: false,
    pages_per_paper: 1
  };

  // Remove any stale pending individual jobs for this order to avoid conflicts
  await pool.query("DELETE FROM print_jobs WHERE order_id = $1 AND status = 'PENDING'", [orderId]);

  // Insert into print_jobs (Supabase Realtime for Desktop Agent)
  const printJobRes = await pool.query(
    `INSERT INTO print_jobs (
      order_id, shop_id, pdf_url, checksum, copies, status, is_secure, print_options, file_index, total_files, created_at
    ) VALUES (
      $1, $2, $3, '', $4, 'PENDING', true, $5, 0, 1, NOW()
    ) RETURNING id`,
    [
      orderId,
      shopId,
      publicUrl,
      Math.max(1, parseInt(printOptions.copies, 10) || 1),
      duplexOpts
    ]
  );

  // Also insert/track in agent_print_jobs (for HTTP poller / shopkeeper dashboard)
  try {
    await pool.query(
      `INSERT INTO agent_print_jobs (shop_id, order_id, file_index, storage_path, print_options, status)
       VALUES ($1, $2, 0, $3, $4, 'pending')`,
      [shopId, orderId, mergedStoragePath, duplexOpts]
    );
  } catch (apjErr) {
    console.warn('[DuplexMergeService] Non-blocking agent_print_jobs insert warning:', apjErr.message);
  }

  console.log(`[DuplexMergeService] Queued back-to-back duplex job #${printJobRes.rows[0].id} for order ${orderId} (${fileCount} files -> ${pageCount} pages)`);
  return {
    success: true,
    jobId: printJobRes.rows[0].id,
    publicUrl,
    mergedStoragePath,
    pageCount,
    fileCount
  };
}

module.exports = {
  getStoragePath,
  isBackToBackDuplex,
  generateMergedDuplexPdf,
  queueMergedDuplexPrintJob
};
