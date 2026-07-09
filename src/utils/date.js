const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Accepts "MM-DD" or a full ISO date string and returns { month, day }
// (month is 1-12), or null if the value is missing/unparseable.
export function parseBirthday(birthday) {
  if (!birthday) return null;
  const mmdd = /^(\d{1,2})-(\d{1,2})$/.exec(birthday);
  if (mmdd) {
    return { month: Number(mmdd[1]), day: Number(mmdd[2]) };
  }
  const date = new Date(birthday);
  if (Number.isNaN(date.getTime())) return null;
  return { month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function formatBirthday(birthday) {
  const parsed = parseBirthday(birthday);
  if (!parsed) return '';
  return `${parsed.day} ${MONTH_NAMES[parsed.month - 1]}`;
}

export function isBirthdayInMonth(birthday, month) {
  const parsed = parseBirthday(birthday);
  return !!parsed && parsed.month === month;
}
