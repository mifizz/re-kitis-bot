import { InlineKeyboard, type Context } from "grammy";

import { TEXT } from "../utils/template";
import { editOrReply } from "../utils/context";

export async function handleDefaultSourceEmpty(c: Context) {
  await editOrReply(c, TEXT.reply.source_empty, {reply_markup: new InlineKeyboard().text("Изменить источник", "schedule:set:type::")})
}
