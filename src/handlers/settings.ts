import { InlineKeyboard, type Context } from "grammy";

import type { BotDatabase } from "../utils/database";
import { KEYBOARD, TEXT } from "../utils/template";
import { editOrReply } from "../utils/context";
import { getSources } from "../utils/api";
import { buildSourceKeyboard } from "../keyboards";
import { handleScheduleID } from "./schedule";

export async function handleSettings(c: Context) {
  await editOrReply(c, TEXT.reply.settings, {reply_markup: KEYBOARD.settings})
}

export async function handleScheduleSet(c: Context) {
  await editOrReply(c, TEXT.reply.select_source_type, {reply_markup: KEYBOARD.schedule_set_types})
}
export async function handleScheduleSetType(c: Context, source_type: string, page: number = 0) {
  const sources = await getSources(source_type)
  const kb = buildSourceKeyboard(sources, source_type, page, "schedule:set")

  await c.editMessageText(TEXT.reply.select_source, {reply_markup: kb})
}
export async function handleScheduleSetID(c: Context, db: BotDatabase, source_id: number) {
  const cid = c.chatId ?? 0
  const old_prefs = await db.getPreferences(cid)

  await db.editDefaultSource(cid, source_id)
  await c.answerCallbackQuery(TEXT.reply.source_changed)

  // send schedule if source was set for the first time
  if (old_prefs && !old_prefs.default_source_id) {
    await handleScheduleID(c, source_id)
    return
  }
  await handleSettings(c)
}

export async function handleNotitificationsEdit(c: Context, db: BotDatabase) {
  const cid = c.chatId ?? 0
  const prefs = await db.getPreferences(cid)
  if (!prefs) return

  const kb = new InlineKeyboard()
    .text(`${(prefs.notification_mode == 2 || prefs.notification_mode == -1) ? "✅ " : ""}Расписание полностью`, "notifications:2").row()
    .text(`${prefs.notification_mode == 1 ? "✅ " : ""}Только уведомление`, "notifications:1").row()
    .text(`${prefs.notification_mode == 0 ? "✅ " : ""}Отключить уведомления`, "notifications:0").row()
    .text(TEXT.button.back, "settings")

  await editOrReply(c, "📨 Выберите режим уведомлений:", { reply_markup: kb })
}
