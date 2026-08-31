import { Bot, Context } from "grammy";
import { run } from "@grammyjs/runner";
import config from "config"

import { BotDatabase } from "./utils/database";
import { logger } from "./utils/logger";
import { initWebsocket } from "./utils/api";

import { handleError } from "./handlers/error";

import { handleStart } from "./handlers/start";
import { handleAdminSend } from "./handlers/admin";
import { handleDefaultSourceEmpty } from "./handlers/myschedule";
import { handleFavouritesEdit, handleFavouritesEditType } from "./handlers/favourite";
import { handleSchedule, handleScheduleID, handleScheduleType } from "./handlers/schedule";
import { handleNotitificationsEdit, handleScheduleSet, handleScheduleSetID, handleScheduleSetType, handleSettings } from "./handlers/settings";


const bot = new Bot(config.get("bot.token"))
const db = await new BotDatabase().init()

initWebsocket(bot, db)

/// ADMIN

const RE_ADMIN_SEND = /\!send ((?:all|ex|in|test))(?: ([^\n]*))?\n(^(?:(?!\|\|\|).)+)/ms
bot.hears(RE_ADMIN_SEND, async (c: Context) => {
  const cid = c.chatId!
  if (cid != config.get<number>("bot.admin_id") || !c.match) return

  const [, mode, ids_s, text] = c.message?.text?.match(RE_ADMIN_SEND) ?? []
  if (!mode || !text) return
  const ids = ids_s?.split(" ") ?? []

  await handleAdminSend(bot, db, text, mode.toLowerCase(), ids)
})

const RE_ADMIN_ERR = /!err (\d+)/
bot.hears(RE_ADMIN_ERR, async (c: Context) => {
  const cid = c.chatId!
  if (cid != config.get<number>("bot.admin_id") || !c.match) return

  const [, err_id] = c.message?.text?.match(RE_ADMIN_ERR) ?? []
  if (!err_id) throw new Error("default error")

  switch (err_id) {
    case "1":
      await bot.api.deleteMessage(cid, -1)
      break
    case "2":
      const m = await bot.api.sendMessage(cid, "updated message will be the same as before")
      await bot.api.editMessageText(cid, m.message_id, "updated message will be the same as before")
      break
    default:
      throw new Error("default error")
  }
})

/// BASE COMMANDS

bot.command("start", async (c) => {
  await db.checkUser(c)
  logger.debug("/start received", {id: c.chatId})
  await handleStart(c, db)
})
bot.hears(/моё расписание/i, async (c) => {
  await db.checkUser(c)
  const prefs = await db.getPreferences(c.chatId ?? 0)
  if (!prefs) return
  if (!prefs.default_source_id) {
    await handleDefaultSourceEmpty(c)
    return
  }
  await handleScheduleID(c, prefs.default_source_id)
})
bot.hears(/другое расписание/i, async (c) => {
  await db.checkUser(c)
  logger.debug("/schedule received", {id: c.chatId})
  await handleSchedule(c)
})
bot.hears(/настройки/i, async (c) => {
  await db.checkUser(c)
  await handleSettings(c)
})

bot.callbackQuery(/^noop:/, async (c) => {
  await c.answerCallbackQuery()
})

/// SCHEDULE

bot.callbackQuery(/^schedule:get:type:(\w*):(\d*)/, async (c) => {
  await db.checkUser(c)
  const [, source_type, page] = c.match
  await c.answerCallbackQuery()
  if (!source_type) {
    await handleSchedule(c)
    return
  }
  await handleScheduleType(c, db, source_type, parseInt(page ?? "0"))
})
bot.callbackQuery(/^schedule:get:id:(\d+)$/, async (c) => {
  await db.checkUser(c)
  await c.answerCallbackQuery()
  const source_id = parseInt(c.match[1] ?? "0")
  await handleScheduleID(c, source_id)
})

/// SETTINGS

bot.callbackQuery(/^settings$/, async (c) => {
  await db.checkUser(c)
  await c.answerCallbackQuery()
  await handleSettings(c)
})
bot.callbackQuery(/^schedule:set:type:(\w*):(\d*)/, async (c) => {
  await db.checkUser(c)
  const [, source_type, page] = c.match
  await c.answerCallbackQuery()
  if (!source_type) {
    await handleScheduleSet(c)
    return
  }
  await handleScheduleSetType(c, source_type, parseInt(page ?? "0"))
})
bot.callbackQuery(/^schedule:set:id:(\d+)$/, async (c) => {
  await db.checkUser(c)
  const source_id = parseInt(c.match[1] ?? "0")
  await handleScheduleSetID(c, db, source_id)
})

/// FAVOURITES

bot.callbackQuery(/^favs:edit:(\w*):(\d*)/, async (c) => {
  await db.checkUser(c)
  const [, source_type, page] = c.match
  await c.answerCallbackQuery()
  if (!source_type) {
    await handleFavouritesEdit(c)
    return
  }
  await handleFavouritesEditType(c, db, source_type, parseInt(page ?? "0"))
})
bot.callbackQuery(/^favs:((?:add|del)):(\w*):(\d*):(\d*)/, async (c) => {
  await db.checkUser(c)

  const cid = c.chatId!
  const [, action, source_type, source_id, page] = c.match
  await c.answerCallbackQuery()
  if (!source_type) {
    await handleFavouritesEdit(c)
    return
  }

  const prefs = await db.getPreferences(cid)
  if (!prefs) return
  if (!prefs.favourite_sources)
    prefs.favourite_sources = action === "add" ? [{ source_id: parseInt(source_id ?? "0"), source_type }] : []
  else if (action === "add")
    prefs.favourite_sources.push({ source_id: parseInt(source_id ?? "0"), source_type })
  else if (action === "del")
    prefs.favourite_sources = prefs.favourite_sources.filter((f) => f.source_id != parseInt(source_id ?? "0"))

  await db.editFavouriteSources(cid, prefs.favourite_sources)
  await handleFavouritesEditType(c, db, source_type, parseInt(page ?? "0"))
})

/// NOTIFICATIONS

bot.callbackQuery(/^notifications:(\d*)/, async (c) => {
  await db.checkUser(c)

  const cid = c.chatId!
  const [, mode] = c.match
  await c.answerCallbackQuery()

  if (!mode) {
    await handleNotitificationsEdit(c, db)
    return
  }

  const prefs = await db.getPreferences(cid)
  if (!prefs || prefs.notification_mode == parseInt(mode ?? "0")) return

  await db.editNotificationMode(cid, parseInt(mode ?? "0"))
  await handleNotitificationsEdit(c, db)
})

bot.catch((err) => handleError(err, db))

logger.info("Started")
run(bot)
