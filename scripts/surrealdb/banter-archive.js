#!/usr/bin/env node
/**
 * Banter weekly archive script
 * Moves old records to archive tables, exports to JSON
 */

import Surreal from 'surrealdb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVE_DIR = path.join(__dirname, '../../archives/banter');
const RETENTION_DAYS = 30;

async function archive() {
  const db = new Surreal();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  const cutoff = cutoffDate.toISOString();

  try {
    await db.connect('ws://127.0.0.1:8000/rpc');
    await db.signin({ username: 'root', password: 'root' });
    await db.use({ namespace: 'banter', database: 'sessions' });

    console.log(`Archiving records older than ${cutoff}...`);

    // Export old commits
    const oldCommits = await db.query(`
      SELECT * FROM commits WHERE timestamp < $cutoff
    `, { cutoff });

    // Export old files_touched
    const oldFiles = await db.query(`
      SELECT * FROM files_touched WHERE timestamp < $cutoff
    `, { cutoff });

    // Export completed tasks
    const completedTasks = await db.query(`
      SELECT * FROM tasks WHERE status = 'completed' AND updated_at < $cutoff
    `, { cutoff });

    // Export resolved blockers
    const resolvedBlockers = await db.query(`
      SELECT * FROM blockers WHERE resolved = true AND timestamp < $cutoff
    `, { cutoff });

    // Create archive directory
    const archiveDate = new Date().toISOString().split('T')[0];
    const archivePath = path.join(ARCHIVE_DIR, archiveDate);
    fs.mkdirSync(archivePath, { recursive: true });

    // Write archives
    const archives = {
      commits: oldCommits[0]?.result || oldCommits[0] || [],
      files_touched: oldFiles[0]?.result || oldFiles[0] || [],
      tasks: completedTasks[0]?.result || completedTasks[0] || [],
      blockers: resolvedBlockers[0]?.result || resolvedBlockers[0] || []
    };

    let totalArchived = 0;
    for (const [table, records] of Object.entries(archives)) {
      if (records.length > 0) {
        fs.writeFileSync(
          path.join(archivePath, `${table}.json`),
          JSON.stringify(records, null, 2)
        );
        console.log(`  Archived ${records.length} ${table} records`);
        totalArchived += records.length;
      }
    }

    if (totalArchived === 0) {
      console.log('  No records to archive');
      fs.rmdirSync(archivePath);
    } else {
      // Delete archived records
      await db.query(`DELETE FROM commits WHERE timestamp < $cutoff`, { cutoff });
      await db.query(`DELETE FROM files_touched WHERE timestamp < $cutoff`, { cutoff });
      await db.query(`DELETE FROM tasks WHERE status = 'completed' AND updated_at < $cutoff`, { cutoff });
      await db.query(`DELETE FROM blockers WHERE resolved = true AND timestamp < $cutoff`, { cutoff });

      console.log(`\n✓ Archive complete: ${archivePath}`);
    }

    // Stats
    const commitCount = await db.query(`SELECT count() FROM commits GROUP ALL`);
    const taskCount = await db.query(`SELECT count() FROM tasks GROUP ALL`);
    const learningCount = await db.query(`SELECT count() FROM learnings GROUP ALL`);
    const fileCount = await db.query(`SELECT count() FROM files_touched GROUP ALL`);

    console.log('\nCurrent DB stats:');
    console.log(`  Commits: ${commitCount[0]?.[0]?.count || 0}`);
    console.log(`  Tasks: ${taskCount[0]?.[0]?.count || 0}`);
    console.log(`  Learnings: ${learningCount[0]?.[0]?.count || 0}`);
    console.log(`  Files touched: ${fileCount[0]?.[0]?.count || 0}`);

  } catch (err) {
    console.error('Archive failed:', err.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

archive();
