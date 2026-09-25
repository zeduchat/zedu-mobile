export const dmGroupUsersAlphabetically = (users: any[]) => {
  if (!users || users.length === 0) return [];

  // 1. Sort A-Z
  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));

  // 2. Group by Initial
  const groups = sorted.reduce((acc: any, user) => {
    const firstLetter = user.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(user);
    return acc;
  }, {});

  // 3. Format for Section Rendering
  const sections = Object.keys(groups)
    .sort()
    .map(letter => ({
      title: letter,
      data: groups[letter],
    }));

  return [...sections];
};
