import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

const testDate = new Date('2025-07-15');

console.log('English format:', format(testDate, 'MMM dd, yyyy'));
console.log('Uzbek format:', format(testDate, 'MMM dd, yyyy', { locale: uz }));

// Test different month names
const months = [
  new Date('2025-01-15'),
  new Date('2025-02-15'),
  new Date('2025-03-15'),
  new Date('2025-04-15'),
  new Date('2025-05-15'),
  new Date('2025-06-15'),
  new Date('2025-07-15'),
  new Date('2025-08-15'),
  new Date('2025-09-15'),
  new Date('2025-10-15'),
  new Date('2025-11-15'),
  new Date('2025-12-15'),
];

console.log('\nMonth names in Uzbek:');
months.forEach(date => {
  console.log(format(date, 'MMMM', { locale: uz }));
}); 