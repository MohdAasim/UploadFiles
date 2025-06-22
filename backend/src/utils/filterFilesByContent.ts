// /home/arslaanas/Desktop/UploadFiles/backend/src/utils/filterFilesByContent.ts
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';

const textMimeTypes = [
  'text/plain',
  'application/json',
  'application/xml',
  'application/javascript',
  'application/x-httpd-php',
  'application/x-sh',
  'application/typescript',
  'application/x-typescript',
];

const textExtensions = [
  '.txt',
  '.md',
  '.json',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.html',
  '.css',
  '.scss',
  '.yml',
  '.yaml',
  '.env',
  '.xml',
  '.sh',
  '.py',
  '.java',
  '.c',
  '.cpp',
  '.cs',
  '.rb',
  '.pdf',
  '.docx',
  '.xlsx',
];

interface FileMeta {
  _id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  [key: string]: any;
}

function isTextBasedFile(file: FileMeta): boolean {
  const filename = file.filename.split('.');
  console.log(filename);
  const ext = '.' + filename[filename.length - 1].toLowerCase();
  return textMimeTypes.includes(file.mimetype) || textExtensions.includes(ext);
}

async function extractText(file: FileMeta): Promise<string> {
  const filename = file.filename.split('.');
  console.log(filename);
  const ext = '.' + filename[filename.length - 1].toLowerCase();

  if (ext === '.pdf') {
    const buffer = await fs.readFile(file.path);
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  if (ext === '.docx') {
    const buffer = await fs.readFile(file.path);
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  if (ext === '.xlsx') {
    const buffer = await fs.readFile(file.path);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const allText: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = xlsx.utils.sheet_to_csv(sheet);
      allText.push(sheetData);
    }

    return allText.join('\n');
  }

  // Default plain text/code reader
  return await fs.readFile(file.path, 'utf-8');
}

export async function filterFilesByContent(
  files: FileMeta[],
  query: string
): Promise<FileMeta[]> {
  const matchedFiles: FileMeta[] = [];

  for (const file of files) {
    if (!isTextBasedFile(file)) continue;

    try {
      const content = await extractText(file);
      if (content.toLowerCase().includes(query.toLowerCase())) {
        matchedFiles.push(file);
      }
    } catch (err) {
      console.warn(`Skipping file: ${file.filename}`, (err as Error).message);
    }
  }

  return matchedFiles;
}
