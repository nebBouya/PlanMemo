import { signal, effect } from "../../api/signals.js";
import str from "../../utils/string.js";
import h from "../../api/h.js";
import { groupedCalendarTasks } from "../calendar/store.js";
import { splitDate } from "../tokens.js";

const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet",
    "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function createTable() {
    const table = h("table", {
        class: "calendar--mini__table",
        role: "grid"
    });

    const thead = h("thead");
    const headRow = h("tr");

    for (let i = 0; i < 7; i++) {
        const dayName = new Date(2024, 5, 9 + i).toLocaleDateString("fr-FR", { weekday: "long" });
        const label = str.case.capitalize(dayName).slice(0, 2);
        headRow.appendChild(h("th", {
            scope: "col",
            "aria-label": dayName
        }, label));
    }

    thead.appendChild(headRow);
    table.appendChild(thead);
    table.appendChild(h("tbody"));

    return table;
}

function renderCalendar(date, calendarTitle, calendarTableBody, activeDate) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const monthText = monthNames[month];
    calendarTitle.setAttribute("datetime", `${year}-${String(month + 1).padStart(2, "0")}`);
    calendarTitle.innerHTML = `<p>${monthText}</p><span>${year}</span>`;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const daysInPrevMonth = prevLastDay.getDate();

    const weeks = [];
    let day = 1, nextMonthDay = 1;

    for (let i = 0; i < 6; i++) {
        const row = [];

        for (let j = 0; j < 7; j++) {
            const cellIndex = i * 7 + j;

            if (cellIndex < startDay) {
                const d = daysInPrevMonth - (startDay - j - 1);
                row.push({
                    day: d,
                    dimmed: true,
                    date: new Date(year, month - 1, d)
                });
            } else if (day > daysInMonth) {
                row.push({
                    day: nextMonthDay,
                    dimmed: true,
                    date: new Date(year, month + 1, nextMonthDay++)
                });
            } else {
                const thisDate = new Date(year, month, day);
                const today = new Date();
                const isToday = thisDate.toDateString() === today.toDateString();

                row.push({
                    day,
                    dimmed: false,
                    current: isToday,
                    date: thisDate
                });

                day++;
            }
        }

        weeks.push(row);
    }

    updateCalendarTable(weeks, calendarTableBody, activeDate);
}

function updateCalendarTable(weeks, calendarTableBody, activeDate) {
    calendarTableBody.innerHTML = "";
    for (const week of weeks) {
        const row = h("tr");

        for (const dayInfo of week) {
            const classes = ["calendar--mini__day"];
            if (dayInfo.dimmed) classes.push("calendar--mini__day--dimmed");
            if (dayInfo.current) classes.push("calendar--mini__day--current");

            const taskDots = getTaskDotsForDate(dayInfo.date);

            const td = h("td", {
                class: classes.join(" "),
                "aria-label": dayInfo.date.toLocaleDateString("fr-FR", {
                    day: "numeric", month: "long", year: "numeric"
                }),
                onClick: () => {
                    if (dayInfo.current) return;
                    if (dayInfo.dimmed) {
                        activeDate(new Date(dayInfo.date.getFullYear(), dayInfo.date.getMonth(), 1));
                    }
                }
            },
                h("span", { class: "day-number" }, String(dayInfo.day)),
                ...(taskDots.length ? [
                    h("span", { class: "calendar--mini__dots" },
                        ...taskDots.map(cls => h("span", {
                            class: `group-color group-color--bullet group-color--sm group-color--${cls}`,
                            "aria-hidden": "true"
                        }))
                    )
                ] : [])
            );

            row.appendChild(td);
        }

        calendarTableBody.appendChild(row);
    }
}

function getTaskDotsForDate(date) {
    const dateStr = splitDate(date);
    const tasks = groupedCalendarTasks().get(dateStr) || [];
    const grouped = tasks.filter(t => t.group && t.group.color);
    const ungrouped = tasks.filter(t => !t.group || !t.group.color);
    const topTasks = [...grouped, ...ungrouped].slice(0, 3);
    return topTasks.map(task => task.group?.color || "default");
}


export default function initMiniCalendar() {
    const calendarContainer = document.querySelector(".calendar--mini");
    const calendarTitle = calendarContainer.querySelector(".calendar--mini__title");
    const table = createTable();
    const tableBody = table.querySelector("tbody");
    calendarContainer.appendChild(table);
    const currentDate = signal(new Date());

    effect(() => {
        const date = currentDate();
        renderCalendar(date, calendarTitle, tableBody, currentDate);
    });

    document.querySelectorAll(".calendar--mini__nav").forEach((btn, index) => {
        btn.addEventListener("click", () => {
            const date = currentDate();
            const newDate = new Date(date.getFullYear(), date.getMonth() + (index === 0 ? -1 : 1), 1);
            currentDate(newDate);
        });
    });

    function reset() {
        currentDate(new Date());
    }

    return reset;
}