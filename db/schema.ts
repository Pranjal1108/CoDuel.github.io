import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms', { code: text('code').primaryKey(), host: text('host').notNull(), guest: text('guest'), config: text('config').notNull(), starts: integer('starts'), hostResult: text('host_result'), guestResult: text('guest_result') });
export const profiles = sqliteTable('profiles', { id: text('id').primaryKey(), data: text('data').notNull() });
