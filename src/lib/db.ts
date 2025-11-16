import sqlite3 from 'sqlite3';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

const dbPath = path.join(process.cwd(), 'submissions.db');
const db = new sqlite3.Database(dbPath);

// Enable WAL mode for better concurrency
db.run('PRAGMA journal_mode = WAL');

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT UNIQUE NOT NULL,
    submit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    content_type TEXT NOT NULL, -- 'file' or 'text'
    original_filename TEXT,
    content BLOB,
    text_content TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied'
    approved_time DATETIME
  )
`);

export interface Submission {
  id: number;
  hash: string;
  submit_time: string;
  content_type: 'file' | 'text';
  original_filename?: string;
  content?: Buffer;
  text_content?: string;
  status: 'pending' | 'approved' | 'denied';
  approved_time?: string;
}

export function addSubmission(hash: string, contentType: 'file' | 'text', file?: File, text?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let stmt: sqlite3.Statement;

    if (contentType === 'file' && file) {
      stmt = db.prepare(`
        INSERT INTO submissions (hash, content_type, original_filename, content)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(hash, contentType, file.name, file, function(err: any) {
        stmt.finalize();
        if (err) reject(err);
        else resolve(hash);
      });
    } else if (contentType === 'text' && text) {
      stmt = db.prepare(`
        INSERT INTO submissions (hash, content_type, text_content)
        VALUES (?, ?, ?)
      `);
      stmt.run(hash, contentType, text, function(err: any) {
        stmt.finalize();
        if (err) reject(err);
        else resolve(hash);
      });
    } else {
      reject(new Error('Invalid submission data'));
    }
  });
}

export function getPendingSubmissions(): Promise<Submission[]> {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT * FROM submissions
      WHERE status = 'pending'
      ORDER BY submit_time DESC
    `);
    stmt.all((err, rows: any[]) => {
      stmt.finalize();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function getSubmission(hash: string): Promise<Submission | null> {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT * FROM submissions WHERE hash = ?
    `);
    stmt.get(hash, (err, row: any) => {
      stmt.finalize();
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

export function approveSubmission(hash: string, destinationPath: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const submission = await getSubmission(hash);
      if (!submission) {
        reject(new Error('Submission not found'));
        return;
      }

      // Determine filename and path for thefile
      const destinationDir = path.join(process.cwd(), destinationPath);
      await mkdir(destinationDir, { recursive: true });
      let filename = submission.original_filename || hash;

      if (submission.content_type === 'text' && !filename.endsWith('.txt')) {
        filename += '.txt';
      }

      const filePath = path.join(destinationDir, filename);

      // Write content to thefiles
      if (submission.content_type === 'file' && submission.content) {
        await writeFile(filePath, submission.content);
      } else if (submission.content_type === 'text' && submission.text_content) {
        await writeFile(filePath, submission.text_content);
      }

      // Update status to approved
      const updateStmt = db.prepare(`
        UPDATE submissions
        SET status = 'approved', approved_time = CURRENT_TIMESTAMP
        WHERE hash = ?
      `);
      updateStmt.run(hash, function(err: any) {
        updateStmt.finalize();
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function denySubmission(hash: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      UPDATE submissions
      SET status = 'denied'
      WHERE hash = ?
    `);
    stmt.run(hash, function(err) {
      stmt.finalize();
      if (err) reject(err);
      else resolve();
    });
  });
}
