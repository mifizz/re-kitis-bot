import type { BotError } from "grammy";

import { logger } from "../utils/logger";
import type { BotDatabase } from "../utils/database";

export const TELEGRAM_ERRORS = {
  MessageNotModified: "Bad Request: Message not modified",
  MessageCantBeEdited: "Bad Request: message can't be edited",
  BotBlocked: "Forbidden: bot was blocked by the user",
  UserDeactivated: "Forbidden: user is deactivated"
}


export async function handleError(err: BotError, db: BotDatabase) {
  // check if bot is blocked or user is deleted/deactivated
  if (
    err.message.includes(TELEGRAM_ERRORS.BotBlocked) ||
    err.message.includes(TELEGRAM_ERRORS.UserDeactivated)
  ) {
    await db.deleteUser(err.ctx.chatId ?? 0)
    logger.debug(`Deleted user ${err.ctx.chatId}. Reason: ${err.message}`)
    return
  }

  // else just log an error
  if (
    err.message.includes(TELEGRAM_ERRORS.MessageNotModified) ||
    err.message.includes(TELEGRAM_ERRORS.MessageCantBeEdited)
  )
    logger.error(err.message, { name: err.name })
  else
    logger.error(err.message, { name: err.name, cause: err.cause, stack: err.stack })
}
