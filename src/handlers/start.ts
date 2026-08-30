import { InlineKeyboard, type Context } from "grammy";
import config from "config"

import { TEXT, KEYBOARD } from "../utils/template";
import { logger } from "../utils/logger";
import type { BotDatabase } from "../utils/database";

export async function handleStart(c: Context, db: BotDatabase) {
  await c.reply("Привет, я новый ReКитисбот, тыкай кнопки внизу", {reply_markup: KEYBOARD.start})
}
