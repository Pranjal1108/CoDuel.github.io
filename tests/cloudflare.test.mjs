import test from 'node:test';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from '../worker/cloudflare.mjs';
import {checkRoom} from '../scripts/check-room.mjs';

test('Pages players create and join using independent bearer sessions', async () => {
  const sqlite = new DatabaseSync(':memory:');
  try {
    sqlite.exec(fs.readFileSync('drizzle/0000_duel.sql','utf8'));
    const DB = {prepare(sql) {
      const statement = sqlite.prepare(sql);
      return {bind(...args) {
        return {first: () => statement.get(...args), run: () => ({meta: statement.run(...args)})};
      }};
    }};
    await checkRoom('https://pranjal1108.github.io', 'https://worker.invalid', req => worker.fetch(req, {DB}));
  } finally {
    sqlite.close();
  }
});
