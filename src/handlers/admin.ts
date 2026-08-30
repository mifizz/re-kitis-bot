import type { Bot } from "grammy";
import config from "config"

import type { BotDatabase } from "../utils/database";
import { TELEGRAM_ERRORS } from "./error";
import { logger } from "../utils/logger";

export async function handleAdminSend(bot: Bot, db: BotDatabase, text: string, mode: string, ids: string[]) {
  const ids_all = (await db.getUsers()).map((u) => u.id)
  let ids_filtered: string[] = []
  if (mode == "ex")
    ids_filtered = ids_all.filter((id) => !ids.includes(id))
  else if (mode == "in")
    ids_filtered = ids_all.filter((id) => ids.includes(id))
  else if (mode == "test")
    ids_filtered = [config.get<string>("bot.admin_id")]
    // for (let i = 0; i < 40; i++) {
    //   ids_filtered.push(config.get<string>("bot.admin_id"))
    // }
  else
    ids_filtered = ids_all

  logger.debug(`Sending message to: ${ids_filtered}`)
  await Promise.all(ids_filtered.map(async (id) => {
    try {
      await bot.api.sendMessage(id, text, {parse_mode: "HTML"})
    } catch (e) {
      const err = e as Error
      if (
        err.message.includes(TELEGRAM_ERRORS.BotBlocked) ||
        err.message.includes(TELEGRAM_ERRORS.UserDeactivated)
      ) {
        await db.deleteUser(id)
        logger.debug(`Deleted user ${id}. Reason: ${err.message}`)
      }
    }
  }))
  logger.debug(`Done sending message`)

  await bot.api.sendMessage(config.get<string>("bot.admin_id"), `Отправлено ${ids_filtered.length} сообщений.`)
}
