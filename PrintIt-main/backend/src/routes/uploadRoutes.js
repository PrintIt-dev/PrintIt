const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const auth = require('../middleware/auth');
const upload = require('../config/multer');
const { getStorage } = require('../config/firebase');
const documentConverter = require('../services/documentConverter');

const bucket = getStorage().bucket();

const MIME_BY_EXT = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
};

const sanitizeFileName = (name) => {
    return (name || 'document')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.{2,}/g, '_');
};

const safeDelete = async (filePath) => {
    if (!filePath) return;
    try {
        await fs.promises.unlink(filePath);
    } catch (e) {
        // ignore if already deleted or doesn't exist
    }
};

const uploadToFirebase = (file, printMode = 'normal') => {
    return new Promise((resolve, reject) => {
        // Unique token stored in Firebase metadata; required for self-authenticating download URLs
        const downloadToken = randomUUID();
        const isSecure = (printMode || '').toLowerCase() === 'secure';
        const folder = isSecure ? 'printit/secure_uploads' : 'printit/uploads';
        const originalName = file.originalname || 'document';
        const ext = path.extname(originalName).toLowerCase();
        const mimeType = (file.mimetype && file.mimetype !== 'application/octet-stream')
            ? file.mimetype
            : (MIME_BY_EXT[ext] || 'application/octet-stream');
        const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeName = sanitizeFileName(originalName);
        const fileName = `${folder}/${uniqueId}_${safeName}`;
        const blob = bucket.file(fileName);
        
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: mimeType,
            metadata: {
                metadata: {
                    // This field is how Firebase validates the ?token= query param in download URLs
                    firebaseStorageDownloadTokens: downloadToken,
                    print_mode: isSecure ? 'secure' : 'normal',
                    uploaded_at: new Date().toISOString()
                }
            }
        });

        blobStream.on('error', (error) => {
            reject(error);
        });

        blobStream.on('finish', () => {
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media&token=${downloadToken}`;
            resolve({
                secure_url: publicUrl,
                public_id: blob.name,
                print_mode: isSecure ? 'secure' : 'normal',
                storage_path: fileName,
                format: ext ? ext.replace('.', '') : (mimeType.split('/')[1] || ''),
                bytes: file.size || (file.buffer ? file.buffer.length : 0)
            });
        });

        if (file.path) {
            const readStream = fs.createReadStream(file.path);
            readStream.on('error', (err) => {
                blobStream.destroy();
                reject(err);
            });
            readStream.pipe(blobStream);
        } else if (file.buffer) {
            blobStream.end(file.buffer);
        } else {
            reject(new Error('No file content found to upload'));
        }
    });
};

/**
 * Handles server-side document conversion (Excel, text, etc. to PDF) before uploading to Firebase
 */
const processAndUploadFile = async (file, printMode = 'normal') => {
    let convertedPath = null;
    let fileToUpload = file;
    let pageCount = 1;
    let sourceFormat = path.extname(file.originalname || '').replace('.', '').toLowerCase();

    try {
        if (file.path && documentConverter.isConvertible(file.originalname || file.path)) {
            console.log(`[UploadRoute] Document conversion triggered for: ${file.originalname}`);
            const conversion = await documentConverter.convertToPdf(file.path, file.originalname);
            convertedPath = conversion.outputPath;
            pageCount = conversion.pageCount;
            sourceFormat = conversion.sourceFormat;

            // Generate clean target PDF filename preserving base original name
            const parsedName = path.parse(file.originalname || 'document');
            const convertedFileName = `${parsedName.name}.pdf`;

            fileToUpload = {
                ...file,
                path: conversion.outputPath,
                originalname: convertedFileName,
                mimetype: 'application/pdf',
                size: conversion.size
            };
        } else if (file.path && path.extname(file.originalname || '').toLowerCase() === '.pdf') {
            pageCount = await documentConverter.getPdfPageCount(file.path);
        }

        const uploadResult = await uploadToFirebase(fileToUpload, printMode);

        return {
            ...uploadResult,
            page_count: pageCount,
            source_format: sourceFormat,
            original_name: file.originalname // Maintain customer's original display name
        };
    } finally {
        if (convertedPath) {
            await safeDelete(convertedPath);
        }
    }
};

// POST /api/upload — Single file
router.post('/', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const printMode = req.query.print_mode || req.query.mode || req.body?.print_mode || req.body?.mode || 'normal';

        // Convert document to PDF if needed and stream to Firebase Storage
        const result = await processAndUploadFile(req.file, printMode);

        return res.status(201).json({
            message: 'File uploaded successfully',
            file: {
                s3_key: result.secure_url,
                public_id: result.public_id,
                print_mode: result.print_mode,
                storage_path: result.storage_path,
                original_name: result.original_name,
                format: result.format,
                source_format: result.source_format,
                page_count: result.page_count,
                size: result.bytes
            }
        });

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message || 'File upload failed' });
    } finally {
        if (req.file && req.file.path) {
            await safeDelete(req.file.path);
        }
    }
});

// POST /api/upload/guest — Single file for guest
router.post('/guest', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const printMode = req.query.print_mode || req.query.mode || req.body?.print_mode || req.body?.mode || 'normal';
        const result = await processAndUploadFile(req.file, printMode);

        return res.status(201).json({
            message: 'File uploaded successfully',
            file: {
                s3_key: result.secure_url,
                public_id: result.public_id,
                print_mode: result.print_mode,
                storage_path: result.storage_path,
                original_name: result.original_name,
                format: result.format,
                source_format: result.source_format,
                page_count: result.page_count,
                size: result.bytes
            }
        });

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message || 'File upload failed' });
    } finally {
        if (req.file && req.file.path) {
            await safeDelete(req.file.path);
        }
    }
});

// POST /api/upload/multiple — Multiple files
router.post('/multiple', auth, upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const printMode = req.query.print_mode || req.query.mode || req.body?.print_mode || req.body?.mode || 'normal';

        const uploadedFiles = await Promise.all(
            req.files.map(async file => {
                const result = await processAndUploadFile(file, printMode);
                return {
                    s3_key: result.secure_url,
                    public_id: result.public_id,
                    print_mode: result.print_mode,
                    storage_path: result.storage_path,
                    original_name: result.original_name,
                    format: result.format,
                    source_format: result.source_format,
                    page_count: result.page_count,
                    size: result.bytes
                };
            })
        );

        return res.status(201).json({
            message: `${req.files.length} file(s) uploaded successfully`,
            files: uploadedFiles
        });

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message || 'File upload failed' });
    } finally {
        if (req.files && req.files.length > 0) {
            await Promise.all(req.files.map(f => safeDelete(f.path)));
        }
    }
});

module.exports = router;
