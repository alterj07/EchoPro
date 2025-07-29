// Script to clear localStorage data for debugging
// Run this in the browser console

console.log('Clearing localStorage data...');

// List all localStorage keys
const allKeys = Object.keys(localStorage);
console.log('All localStorage keys:', allKeys);

// Find quiz-related keys
const quizKeys = allKeys.filter(key => key.includes('quiz') || key.includes('Quiz'));
console.log('Quiz-related keys:', quizKeys);

// Clear all quiz-related keys
quizKeys.forEach(key => {
  console.log(`Removing key: ${key}`);
  localStorage.removeItem(key);
});

// Also clear any user-related keys
const userKeys = allKeys.filter(key => key.includes('user') || key.includes('User'));
console.log('User-related keys:', userKeys);

userKeys.forEach(key => {
  console.log(`Removing key: ${key}`);
  localStorage.removeItem(key);
});

console.log('localStorage cleared!');
console.log('Remaining keys:', Object.keys(localStorage)); 