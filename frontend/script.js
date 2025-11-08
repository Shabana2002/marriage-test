window.QUESTIONS = {
  sectionA: [ /* ... */ ],
  sectionB: [
    {
      id: 'q1b',
      text: 'Match the following with descriptions (Periods, Cramps, Ovulation, Hymen, Vagina).',
      mapping: {
        Periods: ['Menstrual bleeding each month', 'Painful lower abdomen', 'Egg release', 'Membrane covering vaginal opening', 'Birth canal'],
        Cramps: ['Menstrual bleeding each month', 'Painful lower abdomen', 'Egg release', 'Membrane covering vaginal opening', 'Birth canal'],
        Ovulation: ['Menstrual bleeding each month', 'Painful lower abdomen', 'Egg release', 'Membrane covering vaginal opening', 'Birth canal'],
        Hymen: ['Menstrual bleeding each month', 'Painful lower abdomen', 'Egg release', 'Membrane covering vaginal opening', 'Birth canal'],
        Vagina: ['Menstrual bleeding each month', 'Painful lower abdomen', 'Egg release', 'Membrane covering vaginal opening', 'Birth canal']
      }
    },
    // add 4 more questions here
  ]
};
// ========================
// Warn user before leaving (only if test not completed)
// ========================
window.addEventListener('beforeunload', (e) => {
  // Only show the warning if user started but hasn’t completed
  const hasStarted = !!role;
  const completed =
    (role === 'female' && sessionData.submittedFemale) ||
    (role === 'male' && sessionData.submittedMale);

  if (hasStarted && !completed) {
    e.preventDefault();
    e.returnValue = ''; // Required for Chrome to show the popup
    return ''; // Some browsers need this return value
  }
});
