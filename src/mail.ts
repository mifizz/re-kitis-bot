import type { Bot } from "grammy";
import config from "config"

import type { BotDatabase } from "./utils/database";
import { TELEGRAM_ERRORS } from "./handlers/error";
import { getSourcesAll } from "./utils/api";
import { logger } from "./utils/logger";

import { handleBotScheduleID } from "./handlers/schedule";

const NTFY_MODE_DISABLED = 0,
  NTFY_MODE_PARTIAL = 1,
  NTFY_MODE_FULL = 2,
  NTFY_MODE_SERVER = -1

export async function handleWSUpdate(bot: Bot, db: BotDatabase,  data: Record<string, unknown>) {
  // schedule
  if ("schedule" in data) {
    const j = data["schedule"] as Record<string, string[]>
    const sources_all = await getSourcesAll()
    const source_ids_updated: number[] = []

    for (const [source_type, sources] of Object.entries(j)) {
      for (const source of sources) {
        const id = sources_all[source_type]?.[source]?.id
        if (!id) continue
        source_ids_updated.push(id)
      }
    }

    logger.debug("Sending update notifications...")

    const prefs = await db.getDefaultSourcesAll()
    await Promise.all(prefs.map(async (user) => {
      try {
        if (!source_ids_updated.includes(user.default_source_id) || user.notification_mode == NTFY_MODE_DISABLED) return

        if (user.notification_mode == NTFY_MODE_PARTIAL) {
          await bot.api.sendMessage(user.telegram_id, "📆 Ваше расписание обновилось!")
          return
        } else if (user.notification_mode == NTFY_MODE_FULL || user.notification_mode == NTFY_MODE_SERVER) {
          await handleBotScheduleID(bot, user.telegram_id, user.default_source_id)
        }
      } catch (e) {
        const err = e as Error
        if (
          err.message.includes(TELEGRAM_ERRORS.BotBlocked) ||
          err.message.includes(TELEGRAM_ERRORS.UserDeactivated)
        ) {
          await db.deleteUser(user.telegram_id)
          logger.debug(`Deleted user ${user.telegram_id}. Reason: ${err.message}`)
        }
      }
    }))

    logger.debug("Done sending notifications")
  }

  // test notification
  else if ("test" in data) {
    await bot.api.sendMessage(config.get<string>("bot.admin_id"), `test notification\n<pre>${JSON.stringify(data["test"], null, 2)}</pre>`, {parse_mode: "HTML"})
  }
}
