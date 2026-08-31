import { Bot, GrammyError, InlineKeyboard, type Context } from "grammy"

import type { BotDatabase } from "../utils/database"
import { KEYBOARD, TEXT } from "../utils/template"
import { TELEGRAM_ERRORS } from "./error"
import { getSources } from "../utils/api"
import { buildScheduleFavouritesKeyboard, buildSourceKeyboard } from "../keyboards"
import { getScheduleMessage } from "../utils/format"
import { editOrReply } from "../utils/context"

export async function handleSchedule(c: Context) {
  await editOrReply(c, TEXT.reply.select_source_type, { reply_markup: KEYBOARD.schedule_get_types })
}
export async function handleScheduleType(c: Context, db: BotDatabase, source_type: string, page: number = 0) {
  const sources = await getSources(source_type)
  const prefs = await db.getPreferences(c.chatId!)
  if (!prefs) return
  if (!prefs.favourite_sources)
    prefs.favourite_sources = []

  // const kb = buildSourceKeyboard(sources, source_type, page, "schedule:get")
  const kb = buildScheduleFavouritesKeyboard(sources, prefs.favourite_sources, source_type, page, "schedule:get")

  await c.editMessageText(TEXT.reply.select_source, {reply_markup: kb})
}
export async function handleScheduleID(c: Context, source_id: number) {
  const msg = await getScheduleMessage(source_id)

  // await editOrReply(c, msg, { parse_mode: "HTML", reply_markup: new InlineKeyboard().text("🔄 Обновить", `schedule:get:id:${source_id}`) })
  // try to send/update schedule and skip error if message is the same as before
  try {
    await editOrReply(c, msg, { parse_mode: "HTML", reply_markup: new InlineKeyboard().text("🔄 Обновить", `schedule:get:id:${source_id}`) })
  } catch (err) {
    const e = (err as GrammyError)
    if (!e.description.startsWith(TELEGRAM_ERRORS.MessageNotModified))
      throw err
  }
}
export async function handleBotScheduleID(bot: Bot, telegram_id: number, source_id: number) {
  const msg = await getScheduleMessage(source_id)
  await bot.api.sendMessage(telegram_id, msg, { parse_mode: "HTML", reply_markup: new InlineKeyboard().text("🔄 Обновить", `schedule:get:id:${source_id}`) })
}
