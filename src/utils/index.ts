export const orderResponseAlphabetically = (response: any) => {
  return response.sort((a: any, b: any) => {
    if (a.name.toLowerCase() < b.name.toLowerCase()) {
      return -1;
    }
    if (a.name.toLowerCase() > b.name.toLowerCase()) {
      return 1;
    }
    return 0;
  });
};

export const formatCount = (count: number): string => {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    const thousands = Math.floor(count / 1000);
    return `${thousands}k+`;
  } else {
    const millions = Math.floor(count / 1000000);
    return `${millions}m+`;
  }
};

/** Bottom tab unread badges: show exact count up to 99, then "99+". */
export const formatTabBadgeCount = (count: number): string => {
  if (count > 99) {
    return '99+';
  }
  return count.toString();
};
