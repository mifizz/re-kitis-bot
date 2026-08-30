import { getSchedule, type APIResponseSchedule, type ScheduleLesson } from "./api"

const SOURCE_TYPE_GEN = {
  group: "группы",
  lecturer: "преподавателя",
  room: "аудитории"
}
const SEP = "--------------------------"

function formatLesson(source_type: string, lesson: ScheduleLesson) {
  const fmt_map = {
    group: "<b>{number})</b> {name} - <i>{room}</i>",
    lecturer: "<b>{number})</b> {name} - <i>{room}</i>",
    room: "<b>{number})</b> {name} - <i>{lecturer}</i>"
  }
  const pattern = fmt_map[source_type as keyof typeof fmt_map]
  return pattern.replace(/\{(\w+)\}/g, (_, key) => String(lesson[key as keyof typeof lesson] ?? key))
}

export async function getScheduleMessage(source_id: number): Promise<string> {
  const s = await getSchedule(source_id)

  let msg = `Расписание ${SOURCE_TYPE_GEN[s.source_type as keyof typeof SOURCE_TYPE_GEN]} <b>${s.source}</b>\n${SEP}\n`

  // fill days if any of days has lessons
  if (s.days.find((d) => d.lessons.length > 0)) {
    for (const day of s.days) {
      if (day.lessons.length == 0 && ["Суббота", "Воскресенье"].includes(day.weekday)) continue

      msg += `\n${day.date} - <b>${day.weekday}</b>\n\n`
      for (const lesson of day.lessons) {
        if (lesson.name.length > 80) lesson.name = lesson.name.slice(0, 77) + "..."
        if (lesson.subgroup > 0) lesson.name = `${lesson.name} (${lesson.subgroup})`
        if (lesson.room == "") lesson.room = "Дистант"

        msg += formatLesson(s.source_type, lesson) + "\n"
      }
      msg += `\n${SEP}\n`
    }
  }
  // no lessons at all
  else {
    msg += `\nНа этой неделе нет пар 👀 (${s.days[0]?.date} - ${s.days[s.days.length-1]?.date})\n\n${SEP}\n`
  }

  const modified_time_s = new Date(s.modified_time * 1000).toLocaleDateString("ru-RU", {
    timeZone: "Europe/Kaliningrad",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
  msg += `Обновлено: ${modified_time_s}`

  return msg
}
