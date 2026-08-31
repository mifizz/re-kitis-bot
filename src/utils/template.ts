import { InlineKeyboard, Keyboard } from "grammy";

export const TEXT = {
  reply: {
    start: "👋 Привет! Это бот для просмотра расписания КИТиСа.\n\n📅 Если ты тут впервые, укажи свою группу в настройках и сможешь смотреть своё расписание по кнопке <b>\"Моё расписание\"</b>! Или, если хочешь посмотреть расписание кого-то другого, нажми <b>\"Другое расписание\"</b>.\n\n📨 Этот бот также умеет присылать расписание, когда оно меняется!",
    settings: "⚙️ Настройки",
    select_source_type: "Выберите тип источника:",
    select_source: "Выберите источник:",
    select_sources_fav: "Выберите один или несколько источников:",
    source_changed: "✅ Источник изменён!",
    source_empty: "❌ Источник по умолчанию не установлен!"
  },
  button: {
    back: "↩️ Назад",
    arrow_back: "⬅️",
    arrow_forward: "➡️",
    stop: "❌",
  }
}
export const KEYBOARD = {
  // regular keyboard
  start: new Keyboard().text("📅 Моё расписание").text("📅 Другое расписание").row().text("⚙️ Настройки").resized().persistent(),

  // inline keyboard
  settings: new InlineKeyboard()
    .text("✏️ Источник расписания", "schedule:set:type::").row()
    .text("⭐ Избранное", "favs:edit::").row()
    .text("📨 Уведомления", "notifications:").row(),

  favs_types: new InlineKeyboard()
    .text("Группы", "favs:edit:group:0").row()
    .text("Преподаватели", "favs:edit:lecturer:0").row()
    .text("Аудитории", "favs:edit:room:0").row()
    .text(TEXT.button.back, "settings"),

  schedule_get_types: new InlineKeyboard()
    .text("Группы", "schedule:get:type:group:0").row()
    .text("Преподаватели", "schedule:get:type:lecturer:0").row()
    .text("Аудитории", "schedule:get:type:room:0").row(),

  schedule_set_types: new InlineKeyboard()
    .text("Группы", "schedule:set:type:group:0").row()
    .text("Преподаватели", "schedule:set:type:lecturer:0").row()
    .text("Аудитории", "schedule:set:type:room:0").row()
    .text(TEXT.button.back, "settings")
}
