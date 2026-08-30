import type { Context, InlineKeyboard } from "grammy";

export async function editOrReply(c: Context, msg: string, other?: {
  parse_mode?: "Markdown" | "MarkdownV2" | "HTML" | undefined,
  reply_markup?: InlineKeyboard | undefined
}) {
  if (c.callbackQuery?.data) {
    return await c.editMessageText(msg, other)
  }
  return await c.reply(msg, other)
}
