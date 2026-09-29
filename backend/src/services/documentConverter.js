const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const XLSX = require('xlsx');
const { PDFDocument } = require('pdf-lib');

// Try loading puppeteer or playwright from available modules
let puppeteerInstance = null;
try {
  puppeteerInstance = require('puppeteer');
} catch {
  try {
    puppeteerInstance = require(path.join(__dirname, '../../../node_modules/puppeteer'));
  } catch {}
}

const CONVERTIBLE_EXTENSIONS = new Set([
  '.xlsx', '.xls', '.csv',
  '.txt',
  '.docx', '.doc',
  '.pptx', '.ppt'
]);

const EXCEL_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv']);

// Dedicated directory for converted temporary PDFs
const CONVERT_DIR = path.join(os.tmpdir(), 'printit_converted');
if (!fs.existsSync(CONVERT_DIR)) {
  fs.mkdirSync(CONVERT_DIR, { recursive: true });
}

/**
 * Escapes characters for safe HTML inclusion
 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Discovers an available browser executable (Chrome, Edge, Chromium)
 */
function findBrowserExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates = [
    // Windows Chrome
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    // Windows Edge
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    // Linux / Docker
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

/**
 * Checks if Microsoft Excel COM automation is available (Windows hosts)
 */
let isWindowsExcelCached = null;
function checkWindowsExcelAvailable() {
  if (process.platform !== 'win32') return Promise.resolve(false);
  if (isWindowsExcelCached !== null) return Promise.resolve(isWindowsExcelCached);

  return new Promise((resolve) => {
    exec(
      'powershell -NoProfile -Command "try { $e = New-Object -ComObject Excel.Application; $e.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($e) | Out-Null; Write-Output \'OK\' } catch { exit 1 }"',
      { timeout: 8000 },
      (err, stdout) => {
        isWindowsExcelCached = !err && (stdout || '').includes('OK');
        resolve(isWindowsExcelCached);
      }
    );
  });
}

/**
 * Converts Excel spreadsheet directly using native Microsoft Excel engine via COM
 * Preserves 100% of formatting, cell colors, custom fonts, borders, charts, and page setup
 */
async function convertViaWindowsExcel(inputPath) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const outputPath = path.join(CONVERT_DIR, `excel_native_${uniqueSuffix}.pdf`);

  const resolvedInput = path.resolve(inputPath).replace(/'/g, "''");
  const resolvedOutput = path.resolve(outputPath).replace(/'/g, "''");

  const psCommand = `$excel = New-Object -ComObject Excel.Application; $excel.Visible = $false; $excel.DisplayAlerts = $false; try { $wb = $excel.Workbooks.Open('${resolvedInput}'); $wb.ExportAsFixedFormat(0, '${resolvedOutput}'); $wb.Close($false); Write-Output 'SUCCESS' } catch { Write-Error $_; exit 1 } finally { $excel.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null }`;

  return new Promise((resolve, reject) => {
    exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`,
      { timeout: 35000 },
      (error, stdout, stderr) => {
        if (error || !fs.existsSync(outputPath)) {
          return reject(
            new Error(`Native Excel export failed: ${stderr || error?.message || 'File not generated'}`)
          );
        }
        resolve(outputPath);
      }
    );
  });
}

/**
 * Checks if LibreOffice / soffice CLI is accessible on this machine
 */
function checkLibreOfficeAvailable() {
  return new Promise((resolve) => {
    const customPath = process.env.LIBREOFFICE_PATH || process.env.SOFFICE_PATH;
    if (customPath && fs.existsSync(customPath)) {
      return resolve(customPath);
    }
    const winLibre = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
    if (fs.existsSync(winLibre)) {
      return resolve(winLibre);
    }
    exec('soffice --version', (err) => {
      if (!err) return resolve('soffice');
      exec('libreoffice --version', (err2) => {
        if (!err2) return resolve('libreoffice');
        resolve(null);
      });
    });
  });
}

/**
 * Converts a document using headless LibreOffice if available
 */
async function convertViaLibreOffice(inputPath, originalFileName, officeCmd) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const outDir = path.join(CONVERT_DIR, `lo_${uniqueSuffix}`);
  fs.mkdirSync(outDir, { recursive: true });

  const escapedInput = `"${inputPath}"`;
  const escapedOutDir = `"${outDir}"`;
  const cmd = `"${officeCmd}" --headless --convert-to pdf --outdir ${escapedOutDir} ${escapedInput}`;

  await new Promise((resolve, reject) => {
    exec(cmd, { timeout: 35000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`LibreOffice conversion failed: ${stderr || error.message}`));
      }
      resolve(stdout);
    });
  });

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const expectedPdf = path.join(outDir, `${baseName}.pdf`);
  if (!fs.existsSync(expectedPdf)) {
    const files = fs.readdirSync(outDir).filter(f => f.endsWith('.pdf'));
    if (files.length === 0) {
      throw new Error('LibreOffice exited without generating a PDF file');
    }
    return path.join(outDir, files[0]);
  }
  return expectedPdf;
}

/**
 * Converts Excel spreadsheets (.xlsx, .xls, .csv) to clean print-ready PDF using SheetJS + Headless Browser
 */
async function convertExcelViaBrowser(inputPath, originalFileName) {
  if (!puppeteerInstance) {
    throw new Error('Puppeteer is not available for document conversion');
  }

  const wb = XLSX.readFile(inputPath);
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('Excel document contains no readable sheets');
  }

  // 1. Analyze column counts to choose optimal orientation
  let maxCols = 0;
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (Array.isArray(data)) {
      for (const row of data) {
        if (Array.isArray(row) && row.length > maxCols) {
          maxCols = row.length;
        }
      }
    }
  }

  // Use landscape if table has > 7 columns or wide structure
  const isLandscape = maxCols > 7;

  // 2. Generate clean, printable HTML table representation
  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(originalFileName || 'Spreadsheet')}</title>
<style>
  @page {
    size: A4 ${isLandscape ? 'landscape' : 'portrait'};
    margin: 12mm 10mm 15mm 10mm;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    margin: 0;
    padding: 0;
    font-size: 9.5pt;
    line-height: 1.35;
    background-color: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet-container {
    page-break-after: always;
    margin-bottom: 24px;
  }
  .sheet-container:last-child {
    page-break-after: auto;
  }
  .sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 4px;
    margin-bottom: 12px;
  }
  .sheet-title {
    font-size: 13pt;
    font-weight: 700;
    color: #0f172a;
  }
  .sheet-badge {
    font-size: 8pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }
  table.excel-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
    word-wrap: break-word;
    margin-top: 4px;
  }
  table.excel-table th, table.excel-table td {
    border: 1px solid #cbd5e1;
    padding: 5px 8px;
    vertical-align: top;
  }
  table.excel-table th {
    background-color: #f1f5f9;
    font-weight: 600;
    color: #334155;
    text-align: left;
    font-size: 9pt;
  }
  table.excel-table tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .empty-note {
    font-style: italic;
    color: #94a3b8;
    padding: 12px;
  }
</style>
</head>
<body>`;

  let hasRenderedAnySheet = false;

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!data || data.length === 0) continue;

    hasRenderedAnySheet = true;
    html += `<div class="sheet-container">`;
    html += `<div class="sheet-header">`;
    html += `<span class="sheet-title">${escapeHtml(sheetName)}</span>`;
    html += `<span class="sheet-badge">PrintIt Auto-Converted Document</span>`;
    html += `</div>`;

    html += `<table class="excel-table">`;
    data.forEach((row, rIdx) => {
      if (!Array.isArray(row) || row.length === 0) return;
      html += `<tr>`;
      row.forEach((cell) => {
        const isNum = typeof cell === 'number';
        const strVal = cell != null ? escapeHtml(String(cell)) : '';
        const tag = rIdx === 0 ? 'th' : 'td';
        const cls = isNum ? ' class="num"' : '';
        html += `<${tag}${cls}>${strVal}</${tag}>`;
      });
      html += `</tr>`;
    });
    html += `</table>`;
    html += `</div>`;
  }

  if (!hasRenderedAnySheet) {
    html += `<div class="empty-note">Spreadsheet contains no row data to print.</div>`;
  }

  html += `</body></html>`;

  // 3. Render HTML to PDF via headless browser
  const browserPath = findBrowserExecutable();
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  };
  if (browserPath) {
    launchOptions.executablePath = browserPath;
  }

  const browser = await puppeteerInstance.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBytes = await page.pdf({
      format: 'A4',
      landscape: isLandscape,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="font-size: 8pt; width: 100%; text-align: right; color: #94a3b8; padding-right: 10mm;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const outputPath = path.join(CONVERT_DIR, `excel_${uniqueSuffix}.pdf`);
    fs.writeFileSync(outputPath, pdfBytes);
    return outputPath;
  } finally {
    await browser.close();
  }
}

/**
 * Converts Plain Text (.txt) files to printable PDF
 */
async function convertTextViaBrowser(inputPath, originalFileName) {
  if (!puppeteerInstance) {
    throw new Error('Puppeteer is not available for document conversion');
  }

  const textContent = fs.readFileSync(inputPath, 'utf-8');
  const safeContent = escapeHtml(textContent);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(originalFileName || 'Text Document')}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 15mm 15mm 15mm 15mm;
  }
  body {
    font-family: Consolas, "Courier New", Courier, monospace;
    font-size: 10pt;
    line-height: 1.45;
    color: #0f172a;
    margin: 0;
    padding: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .doc-header {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    border-bottom: 2px solid #64748b;
    padding-bottom: 6px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    font-size: 9pt;
    color: #64748b;
  }
  .doc-title {
    font-weight: 700;
    color: #0f172a;
    font-size: 11pt;
  }
</style>
</head>
<body>
  <div class="doc-header">
    <span class="doc-title">${escapeHtml(originalFileName || 'Text Document')}</span>
    <span>PrintIt Text Document</span>
  </div>
  <pre>${safeContent}</pre>
</body>
</html>`;

  const browserPath = findBrowserExecutable();
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  };
  if (browserPath) {
    launchOptions.executablePath = browserPath;
  }

  const browser = await puppeteerInstance.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="font-size: 8pt; width: 100%; text-align: right; color: #94a3b8; padding-right: 10mm;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const outputPath = path.join(CONVERT_DIR, `txt_${uniqueSuffix}.pdf`);
    fs.writeFileSync(outputPath, pdfBytes);
    return outputPath;
  } finally {
    await browser.close();
  }
}

class DocumentConverter {
  /**
   * Checks whether the file extension requires server-side conversion to PDF
   */
  isConvertible(fileNameOrPath) {
    if (!fileNameOrPath) return false;
    const ext = path.extname(fileNameOrPath).toLowerCase();
    return CONVERTIBLE_EXTENSIONS.has(ext);
  }

  /**
   * Inspects a PDF file or buffer and returns total page count
   */
  async getPdfPageCount(filePathOrBuffer) {
    try {
      const buffer = typeof filePathOrBuffer === 'string'
        ? fs.readFileSync(filePathOrBuffer)
        : filePathOrBuffer;
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      return Math.max(1, doc.getPageCount());
    } catch (e) {
      console.warn('[DocumentConverter] Could not inspect PDF page count:', e.message);
      return 1;
    }
  }

  /**
   * Converts a supported document (Excel, Word, Text) into a clean vector PDF.
   *
   * Hierarchy of Engines:
   * 1. Native Microsoft Excel (Windows) -> 100% exact 1:1 format preservation (fills, fonts, charts, merged cells, borders)
   * 2. Headless LibreOffice (Linux/Docker/Windows) -> 100% exact Office layout preservation
   * 3. Standalone Browser + SheetJS -> Universal fallback without external dependencies
   *
   * @param {string} inputPath Path to original uploaded file on local disk
   * @param {string} originalFileName Original file name provided by customer
   * @returns {Promise<{ outputPath: string, pageCount: number, size: number, isConverted: boolean, sourceFormat: string }>}
   */
  async convertToPdf(inputPath, originalFileName) {
    const ext = path.extname(originalFileName || inputPath).toLowerCase();
    if (!CONVERTIBLE_EXTENSIONS.has(ext)) {
      throw new Error(`File format ${ext} is not supported for document conversion`);
    }

    console.log(`[DocumentConverter] Starting conversion for "${originalFileName}" (${ext})...`);

    let generatedPdfPath = null;

    // 1. If on Windows and Excel format: Attempt native Microsoft Excel engine first (100% exact formatting)
    if (EXCEL_EXTENSIONS.has(ext) && (await checkWindowsExcelAvailable())) {
      try {
        console.log(`[DocumentConverter] Using Native Microsoft Excel Engine for 1:1 original format preservation...`);
        generatedPdfPath = await convertViaWindowsExcel(inputPath);
      } catch (excelErr) {
        console.warn(`[DocumentConverter] Native Excel export failed: ${excelErr.message}. Attempting fallback engine...`);
      }
    }

    // 2. If LibreOffice is available, use it (primary engine on Linux/Docker production servers)
    if (!generatedPdfPath) {
      const officeCmd = await checkLibreOfficeAvailable();
      if (officeCmd) {
        try {
          console.log(`[DocumentConverter] Converting via LibreOffice CLI (${officeCmd})...`);
          generatedPdfPath = await convertViaLibreOffice(inputPath, originalFileName, officeCmd);
        } catch (loErr) {
          console.warn(`[DocumentConverter] LibreOffice conversion failed: ${loErr.message}. Attempting fallback...`);
        }
      }
    }

    // 3. Standalone browser fallback if neither native Excel nor LibreOffice was available
    if (!generatedPdfPath) {
      if (EXCEL_EXTENSIONS.has(ext)) {
        console.log(`[DocumentConverter] Converting Excel via SheetJS + Headless Browser fallback...`);
        generatedPdfPath = await convertExcelViaBrowser(inputPath, originalFileName);
      } else if (ext === '.txt') {
        console.log(`[DocumentConverter] Converting Plain Text via Headless Browser...`);
        generatedPdfPath = await convertTextViaBrowser(inputPath, originalFileName);
      } else {
        throw new Error(
          `Document format ${ext} requires Microsoft Office or LibreOffice server-side tools which are not currently installed.`
        );
      }
    }

    if (!generatedPdfPath || !fs.existsSync(generatedPdfPath)) {
      throw new Error(`Failed to produce converted PDF for ${originalFileName}`);
    }

    const stats = fs.statSync(generatedPdfPath);
    const pageCount = await this.getPdfPageCount(generatedPdfPath);

    console.log(
      `[DocumentConverter] Successfully converted "${originalFileName}" -> PDF (${pageCount} page(s), ${stats.size} bytes)`
    );

    return {
      outputPath: generatedPdfPath,
      pageCount,
      size: stats.size,
      isConverted: true,
      sourceFormat: ext.replace('.', '')
    };
  }
}

module.exports = new DocumentConverter();
