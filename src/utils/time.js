export class TimeUnit {
    static fromSec(sec = 1) {
        return sec * 1000;
    }

    static fromMin(min = 1) {
        return min * 60 * this.fromSec();
    }

    static fromHour(hour = 1) {
        return hour * 60 * this.fromMin();
    }

    static fromDay(day = 1) {
        return day * 24 * this.fromHour();
    }

    static fromWeek(week = 1) {
        return week * 7 * this.fromDay();
    }

    static fromMonth(month = 1) {
        return month * 30 * this.fromDay();
    }

    static fromYear(year = 1) {
        return year * 365 * this.fromDay();
    }
}