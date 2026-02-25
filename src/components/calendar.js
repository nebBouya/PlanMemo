import initFullCalendarServices, { internalRerenderFullCalendar } from "../services/calendar/index.js";

export default function initCalendar() {
    const calendar = initFullCalendarServices();
    const wrapper = document.getElementById("calendar");
    wrapper.innerHTML = "";
    wrapper.append(calendar);
}

export function rerenderCalendar() {
    internalRerenderFullCalendar();
}