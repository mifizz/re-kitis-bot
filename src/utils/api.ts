import config from "config"

import { logger } from "./logger";
import { handleWSUpdate } from "../mail";
import type { BotDatabase } from "./database";
import type { Bot } from "grammy";

export class APIFetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "APIFetchError"
  }
}

export type APIResponseError = {
  message: string;
  code: string;
}
export type APIResponseSourcesByTypeExtended = {
  [key: string]: {
    id: number;
    category: string;
    status: string;
  }
}
export type APIResponseSourcesExtended = {
  [key: string]: {
    [key: string]: {
      id: number;
      category: string;
      status: string;
    }
  }
}
export type APIResponseSchedule = {
  modified_time: number;
  source_type: string;
  source: string;
  days: {
    date: string;
    weekday: string;
    lessons: ScheduleLesson[]
  }[]
}

export type ScheduleLesson = {
  number: number;
  bells: string;
  subgroup: number;
  name: string;
  group: string;
  lecturer: string;
  room: string;
}

const API_BASE_URI = config.get<string>("api.base_uri")
// const API_FORCE_SCHEDULE = config.get<boolean>("api.force")

async function fetchData<T>(uri: string): Promise<T> {
  const r = await fetch(API_BASE_URI + uri)
  const j = await r.json()
  if (!r.ok) throw new APIFetchError((j as APIResponseError).code)
  return j as T
}

export async function getSourcesAll() {
  return await fetchData<APIResponseSourcesExtended>(`/sources?extended`)
}
export async function getSources(source_type: string) {
  return await fetchData<APIResponseSourcesByTypeExtended>(`/sources/${source_type}?extended`)
}
export async function getSchedule(source_id: number) {
  return await fetchData<APIResponseSchedule>(`/schedule/db/${source_id}`)
}

export async function initWebsocket(bot: Bot, db: BotDatabase) {
  let need_restart = false
  while (true) {
    const ws = new WebSocket(config.get<string>("api.updates_uri"))

    ws.addEventListener("open", () => {
      logger.info("Updates websocket connected")
    })
    ws.addEventListener("close", () => {
      logger.info("Updates websocket disconnected")
      need_restart = true
    })
    ws.addEventListener("error", (e: Event) => {
      logger.error("Websocket error", { error: JSON.stringify(e) })
      need_restart = true
    })

    ws.addEventListener("message", async (e: MessageEvent) => {
      try {
        const j = JSON.parse(e.data) as {[key: string]: any}
        handleWSUpdate(bot, db, j)
      } catch (err) {
        logger.error(err)
      }
    })

    if (need_restart) {
      need_restart = false
      continue
    }

    while (true) {
      await new Promise((r) => setTimeout(r, 10000))
      if (ws.readyState == 1) {
        ws.send("")
      }
      else {
        logger.warn("Websocket is not ready, restarting...")
        break
      }
    }
  }
}
