import { Client } from "pg";
import config from "config"
import type { Context } from "grammy";
import { logger } from "./logger";

type UserPreferences = {
  default_source_id?: number;
  notification_mode: number;
  favourite_sources?: FavouriteSource[]
  schedule_format?: ScheduleFormat
}
export type FavouriteSource = {
  source_id: number
  source_type: string
}
type ScheduleFormat = {
  group: ScheduleFormatEntry,
  lecturer: ScheduleFormatEntry,
  room: ScheduleFormatEntry
}
type ScheduleFormatEntry = {
  number: boolean;
  bells: boolean;
  group: boolean;
  name: boolean;
  lecturer: boolean;
  room: boolean;
}

const DEFAULT_SCHEDULE_FORMAT = {
  group: {
    number: true,
    bells: true,
    group: false,
    name: true,
    lecturer: false,
    room: true,
  },
  lecturer: {
    number: true,
    bells: true,
    group: true,
    name: true,
    lecturer: false,
    room: true,
  },
  room: {
    number: true,
    bells: true,
    group: true,
    name: true,
    lecturer: true,
    room: false,
  }
}

const INIT_QUERY = `
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(32),
    joined_at TIMESTAMP DEFAULT now()
);
CREATE TABLE IF NOT EXISTS preferences (
    telegram_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    default_source_id INT,
    notification_mode SMALLINT DEFAULT 2,    -- -1: server default, 0: disabled, 1: partial, 2: full
    favourite_sources JSONB,
    schedule_format JSONB
);
`

export class BotDatabase {
  private sql = new Client({
    host: config.get("database.host"),
    port: config.get("database.port"),
    database: config.get("database.name"),
    user: config.get("database.user"),
    password: config.get("database.pass")
  })

  constructor() { }

  public async init() {
    await this.sql.connect()
    await this.sql.query(INIT_QUERY)
    return this
  }
  public async close() {
    await this.sql.end()
  }

  public async checkUser(c: Context) {
    const cid = c.chatId ?? 0
    const user = await this.getUser(cid)
    if (!user) {
      await this.addUser(cid, c.chat?.username)
      return
    }
    if (user.username != c.chat?.username) {
      await this.updateUser(cid, c.chat?.username)
      logger.debug(`Updated ${cid} username from '${user.username}' to '${c.chat?.username}'`)
    }
  }

  public async addUser(telegram_id: number | string, username?: string) {
    await this.sql.query(`INSERT INTO users(id, username) VALUES ($1, $2)`, [telegram_id, username])
    await this.sql.query(`INSERT INTO preferences(telegram_id) VALUES ($1)`, [telegram_id])
  }
  public async updateUser(telegram_id: number | string, username?: string) {
    await this.sql.query(`UPDATE users SET id = $1, username = $2`, [telegram_id, username])
  }

  public async getUser(telegram_id: number | string) {
    return (await this.sql.query<{id: number, username?: string}>(`
      SELECT id, username FROM users WHERE id = $1 LIMIT 1;
      `, [telegram_id])).rows[0]
  }
  public async getUsers() {
    return (await this.sql.query<{id: string, username?: string}>(`
      SELECT id, username FROM users;
      `)).rows
  }
  public async getPreferences(telegram_id: number | string) {
    return (await this.sql.query<UserPreferences>(`
      SELECT default_source_id, notification_mode, favourite_sources, schedule_format FROM preferences WHERE telegram_id = $1 LIMIT 1;
      `, [telegram_id])).rows[0]
  }
  public async getDefaultSourcesAll() {
    return (await this.sql.query<{telegram_id: number, default_source_id: number, notification_mode: number}>(`
      SELECT telegram_id, default_source_id, notification_mode FROM preferences;
      `,)).rows
  }

  public async editDefaultSource(telegram_id: number | string, source_id: number) {
    await this.sql.query(`UPDATE preferences SET default_source_id = $2 WHERE telegram_id = $1`, [telegram_id, source_id])
  }
  public async editFavouriteSources(telegram_id: number | string, fav_sources: FavouriteSource[]) {
    await this.sql.query(`UPDATE preferences SET favourite_sources = $2 WHERE telegram_id = $1`, [telegram_id, JSON.stringify(fav_sources)])
  }
  public async editNotificationMode(telegram_id: number | string, mode: number) {
    await this.sql.query(`UPDATE preferences SET notification_mode = $2 WHERE telegram_id = $1`, [telegram_id, mode])
  }

  public async deleteUser(telegram_id: number | string) {
    await this.sql.query(`DELETE FROM users WHERE id = $1`, [telegram_id])
  }
}
