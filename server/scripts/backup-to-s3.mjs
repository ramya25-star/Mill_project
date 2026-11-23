// Takes a consistent snapshot of every Mill Mate database (each company + the
// Console's platform.db) and uploads them (gzipped) to s3://$S3_BUCKET/backups/. Run it on a schedule (see deploy/ec2/millmate-backup.timer).
//
//   node scripts/backup-to-s3.mjs
//
// Uses the same environment as the server (DB_PATH, S3_BUCKET, S3_REGION).
// Old backups are removed by an S3 lifecycle rule (deploy/aws/s3-lifecycle.json),
// not by this script.
import 'dotenv/config';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Enabled, getS3Client, getBucket } from '../storage.js';

if (!s3Enabled) {
  console.error('S3_BUCKET is not set - nothing to back up to.');
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(here, '..', 'data', 'alagiri.db');
const dataRoot = path.dirname(dbPath);
const tenantsDir = process.env.TENANT_DATA_DIR || path.join(dataRoot, 'tenants');
const platformPath = process.env.PLATFORM_DB_PATH || path.join(dataRoot, 'platform.db');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');

// What to back up: the original company (same S3 key as always), every other
// company's database, and the Console's platform.db.
const targets = [{ file: dbPath, key: `backups/alagiri-${stamp}.db.gz` }];
if (fs.existsSync(tenantsDir)) {
  for (const name of fs.readdirSync(tenantsDir)) {
    if (/^[a-z][a-z0-9]{2,19}\.db$/.test(name)) {
      targets.push({ file: path.join(tenantsDir, name), key: `backups/tenants/${name.replace(/\.db$/, '')}-${stamp}.db.gz` });
    }
  }
}
if (fs.existsSync(platformPath)) targets.push({ file: platformPath, key: `backups/platform-${stamp}.db.gz` });

let failed = 0;
for (const { file, key } of targets) {
  const tmpFile = path.join(os.tmpdir(), `millmate-backup-${process.pid}-${path.basename(file)}`);
  try {
    // VACUUM INTO writes a complete, consistent copy even while the server is running.
    const db = new DatabaseSync(file);
    db.exec(`VACUUM INTO '${tmpFile.replace(/'/g, "''")}'`);
    db.close();

    const compressed = zlib.gzipSync(fs.readFileSync(tmpFile));
    await getS3Client().send(new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: compressed,
      ContentType: 'application/gzip',
      ServerSideEncryption: 'AES256'
    }));
    console.log(`Backup uploaded: s3://${getBucket()}/${key} (${(compressed.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    failed += 1;
    console.error(`Backup failed for ${file}:`, err);
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}
if (failed) process.exitCode = 1;
