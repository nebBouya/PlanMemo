import h from "../../api/h.js";


export function createCurrentMonthPreviewCalendar() {
    const container = h("section", {
        class: "calendar--preview",
        role: "region",
        "aria-label": "Calendrier du mois en cours"
    });

    const header = h("header", { class: "calendar--preview__header" });
    const table = h("table", { class: "calendar--preview__table", role: "grid" });
    const thead = h("thead", {});
    const tbody = h("tbody", {});
    const title = h("div", { class: "calendar--preview__title" });

    const headRow = h("tr");
    const startDate = new Date(2024, 5, 9);
    for (let i = 0; i < 7; i++) {
        const dayName = new Date(startDate.getTime() + i * 86400000)
            .toLocaleDateString("fr-FR", { weekday: "long" });
        const label = dayName.slice(0, 2).charAt(0).toUpperCase() + dayName.slice(1, 2);
        headRow.appendChild(h("th", {
            scope: "col",
            "aria-label": dayName
        }, label));
    }
    thead.appendChild(headRow);

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const monthLabel = today.toLocaleDateString("fr-FR", { month: "long" });

    title.innerHTML = `<p>${monthLabel}</p><span>${year}</span>`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const daysInPrevMonth = prevLastDay.getDate();
    const startDay = (firstDay.getDay() + 6) % 7;

    let day = 1;
    let nextMonthDay = 1;

    for (let w = 0; w < 6; w++) {
        const row = h("tr");

        for (let d = 0; d < 7; d++) {
            const cellIndex = w * 7 + d;
            let cellDate;
            let classes = ["calendar--preview__day"];
            let text = "";

            if (cellIndex < startDay) {
                const ld = daysInPrevMonth - (startDay - d - 1);
                cellDate = new Date(year, month - 1, ld);
                classes.push("calendar--preview__day--dimmed");
                text = ld;
            } else if (day > daysInMonth) {
                cellDate = new Date(year, month + 1, nextMonthDay);
                classes.push("calendar--preview__day--dimmed");
                text = nextMonthDay++;
            } else {
                cellDate = new Date(year, month, day);
                if (cellDate.toDateString() === new Date().toDateString()) {
                    classes.push("calendar--preview__day--current");
                }
                text = day++;
            }

            row.appendChild(h("td", {
                class: classes.join(" "),
                "aria-label": cellDate.toLocaleDateString("fr-FR", {
                    day: "numeric", month: "long", year: "numeric"
                })
            }, h("span", { class: "day-number" }, String(text))));
        }

        tbody.appendChild(row);
    }

    table.appendChild(thead);
    table.appendChild(tbody);

    header.appendChild(title);
    container.appendChild(header);
    container.appendChild(table);

    return container;
}


export function createFullCalendar() {
    return {
        get el() { return createCurrentMonthPreviewCalendar(); },
        rerender: () => { }
    };
}