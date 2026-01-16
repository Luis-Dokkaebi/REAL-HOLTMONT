const getSpreadsheetTimeZone = () => "GMT"; // Mock

const Utilities = {
  formatDate: (date, tz, format) => {
    // Basic mock for formatDate
    if (format === "HH:mm") {
        return date.toISOString().substr(11, 5);
    }
    if (format === "dd/MM/yy") {
        return date.toISOString().substr(8, 2) + "/" + date.toISOString().substr(5, 2) + "/" + date.toISOString().substr(2, 2);
    }
    return date.toString();
  }
};

const SS = { getSpreadsheetTimeZone };

function test() {
    // 1. Test Date (Year > 1900)
    const date1 = new Date("2025-01-16T12:00:00Z");
    let val1 = date1;

    if (val1.getFullYear() < 1900) {
        val1 = Utilities.formatDate(val1, SS.getSpreadsheetTimeZone(), "HH:mm");
    } else {
        val1 = Utilities.formatDate(val1, SS.getSpreadsheetTimeZone(), "dd/MM/yy");
    }

    console.log("Date Test (2025):", val1);
    if (val1 !== "16/01/25") console.error("FAIL: Date should be 16/01/25");

    // 2. Test Time (Year 1899)
    // Google Sheets uses Dec 30 1899 base for time.
    const date2 = new Date("1899-12-30T17:00:00Z");
    let val2 = date2;

    if (val2.getFullYear() < 1900) {
        val2 = Utilities.formatDate(val2, SS.getSpreadsheetTimeZone(), "HH:mm");
    } else {
        val2 = Utilities.formatDate(val2, SS.getSpreadsheetTimeZone(), "dd/MM/yy");
    }

    console.log("Time Test (1899):", val2);
    if (val2 !== "17:00") console.error("FAIL: Time should be 17:00");

}

test();
