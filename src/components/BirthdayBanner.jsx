import { isBirthdayInMonth } from '../utils/date.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function BirthdayBanner({ people }) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const celebrants = people.filter((p) => isBirthdayInMonth(p.birthday, currentMonth));

  if (celebrants.length === 0) return null;

  return (
    <div className="birthday-banner">
      <span className="icon">✦</span>
      <span>
        <strong>Birthdays this month:</strong> {celebrants.map((p) => p.name).join(', ')} — wish them well in{' '}
        {MONTH_NAMES[currentMonth - 1]}!
      </span>
    </div>
  );
}
