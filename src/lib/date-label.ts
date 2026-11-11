import moment from 'moment';

// Date label for message lists: "Today", "Yesterday", otherwise "October 5, 2026"
export const formatDateLabel = (date: moment.MomentInput) =>
  moment(date).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: 'MMMM D, YYYY',
    nextDay: 'MMMM D, YYYY',
    nextWeek: 'MMMM D, YYYY',
    sameElse: 'MMMM D, YYYY',
  });
