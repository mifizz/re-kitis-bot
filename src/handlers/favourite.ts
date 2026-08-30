import type { Context } from "grammy";

import type { BotDatabase } from "../utils/database";
import { KEYBOARD, TEXT } from "../utils/template";
import { editOrReply } from "../utils/context";
import { getSources } from "../utils/api";
import { buildFavouritesEditKeyboard } from "../keyboards";

export async function handleFavouritesEdit(c: Context) {
  await editOrReply(c, TEXT.reply.select_source_type, {reply_markup: KEYBOARD.favs_types})
}
export async function handleFavouritesEditType(c: Context, db: BotDatabase, source_type: string, page: number = 0) {
  const sources = await getSources(source_type)
  const prefs = await db.getPreferences(c.chatId ?? 0)
  if (!prefs) return
  if (!prefs.favourite_sources) prefs.favourite_sources = []
  const kb = buildFavouritesEditKeyboard(sources, prefs.favourite_sources, source_type, page)

  await editOrReply(c, TEXT.reply.select_sources_fav, {reply_markup: kb})
}
