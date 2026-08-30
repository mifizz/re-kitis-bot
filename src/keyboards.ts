import { InlineKeyboard } from "grammy";

import type { APIResponseSourcesByTypeExtended } from "./utils/api";
import { TEXT } from "./utils/template";
import type { FavouriteSource } from "./utils/database";

const PAGE_COLUMNS: {[key: string]: number} = {
  group: 3,
  lecturer: 2,
  room: 3,
}
const PAGE_ROWS: {[key: string]: number} = {
  group: 6,
  lecturer: 6,
  room: 6,
}

export function buildSourceKeyboard(sources_full: APIResponseSourcesByTypeExtended, source_type: string, page: number = 0, prefix: string = "schedule:get") {
  const sources = Object.entries(sources_full).filter(([, d]) => d.status == "active")
  const kb = new InlineKeyboard()
  let i = -1, page_size = (PAGE_COLUMNS[source_type] ?? 3) * (PAGE_ROWS[source_type] ?? 6);
  for (const [source, data] of sources) {
    i++;
    if (i < page * page_size) continue
    if (i >= (page + 1) * page_size) break
    if (i % (PAGE_COLUMNS[source_type] ?? 3) == 0) kb.row()
    kb.text(`${source}`, `${prefix}:id:${data.id}`)
  }
  kb.row()

  if (page > 0)
    kb.text(TEXT.button.arrow_back, `${prefix}:type:${source_type}:${page - 1}`)
  else
    kb.text(TEXT.button.stop, "noop:stop")

  kb.text(`${page+1}`, "noop:page")

  if (page < Math.floor(Object.keys(sources).length / page_size))
    kb.text(TEXT.button.arrow_forward, `${prefix}:type:${source_type}:${page + 1}`)
  else
    kb.text(TEXT.button.stop, "noop:stop")

  kb.row()
  kb.text(TEXT.button.back, `${prefix}:type::`)

  return kb
}

export function buildFavouritesEditKeyboard(sources_full: APIResponseSourcesByTypeExtended, fav_sources: FavouriteSource[], source_type: string, page: number = 0) {
  const sources = Object.entries(sources_full).filter(([, d]) => d.status == "active")
  const kb = new InlineKeyboard()
  let i = -1, page_size = (PAGE_COLUMNS[source_type] ?? 3) * (PAGE_ROWS[source_type] ?? 6);
  for (const [source, data] of sources) {
    i++;
    if (i < page * page_size) continue
    if (i >= (page + 1) * page_size) break
    if (i % (PAGE_COLUMNS[source_type] ?? 3) == 0) kb.row()

    if (fav_sources.find((f) => f.source_id == data.id)) {
      kb.text(`⭐ ${source}`, `favs:del:${source_type}:${data.id}:${page}`)
    } else {
      kb.text(`${source}`, `favs:add:${source_type}:${data.id}:${page}`)
    }
  }
  kb.row()

  if (page > 0)
    kb.text(TEXT.button.arrow_back, `favs:edit:${source_type}:${page - 1}`)
  else
    kb.text(TEXT.button.stop, "noop:stop")

  kb.text(`${page+1}`, "noop:page")

  if (page < Math.floor(Object.keys(sources).length / page_size))
    kb.text(TEXT.button.arrow_forward, `favs:edit:${source_type}:${page + 1}`)
  else
    kb.text(TEXT.button.stop, "noop:stop")

  kb.row()
  kb.text(TEXT.button.back, `favs:edit::`)

  return kb
}

export function buildScheduleFavouritesKeyboard(sources_full: APIResponseSourcesByTypeExtended, fav_sources: FavouriteSource[], source_type: string, page: number = 0, prefix: string = "schedule:get") {
  const sources = Object.entries(sources_full).filter(([, d]) => d.status == "active")
  const sources_filtered: typeof sources = []
  const sources_favourite: typeof sources = []
  // const sources_filtered = sources.filter(([_, d]) => !fav_sources.find((f) => f.source_id == d.id))
  // const sources_favourite = sources.filter(([_, d]) => fav_sources.find((f) => f.source_id == d.id))

  for (const [source, data] of sources) {
    if (fav_sources.find((f) => f.source_id == data.id))
      sources_favourite.push([source, data])
    else
      sources_filtered.push([source, data])
  }

  const kb = new InlineKeyboard()
  let i = -1, page_size = (PAGE_COLUMNS[source_type] ?? 3) * (PAGE_ROWS[source_type] ?? 6);
  for (const [source, data] of sources_favourite) {
    i++;
    if (i < page * page_size) continue
    if (i >= (page + 1) * page_size) break
    if (i % (PAGE_COLUMNS[source_type] ?? 3) == 0) kb.row()

    kb.text(`⭐ ${source}`, `${prefix}:id:${data.id}`)
  }
  for (const [source, data] of sources_filtered) {
    i++;
    if (i < page * page_size) continue
    if (i >= (page + 1) * page_size) break
    if (i % (PAGE_COLUMNS[source_type] ?? 3) == 0) kb.row()

    kb.text(`${source}`, `${prefix}:id:${data.id}`)
  }
  kb.row()

  if (page > 0)
    kb.text(TEXT.button.arrow_back, `${prefix}:type:${source_type}:${page - 1}`)
  else
    kb.text(TEXT.button.stop, "noop:stop")

  kb.text(`${page+1}`, "noop:page")

  if (page < Math.floor(Object.keys(sources).length / page_size))
    kb.text(TEXT.button.arrow_forward, `${prefix}:type:${source_type}:${page + 1}`)
  else
    kb.text(TEXT.button.stop, "noop:stop")

  kb.row()
  kb.text(TEXT.button.back, `${prefix}:type::`)

  return kb
}
