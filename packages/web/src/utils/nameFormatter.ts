interface NameParts {
  firstName: string;
  lastName: string;
  patronymic?: string | null;
  displayName?: string | null;
}


export const getFullName = (member: NameParts): string => {
  const parts = [
    member.lastName,
    member.firstName,
    member.patronymic,
  ].filter(Boolean);

  return parts.join(' ') || 'Без имени';
};


export const getDisplayName = (member: NameParts): string => {
  if (member.displayName) {
    return member.displayName;
  }
  return getFullName(member);
};


export const getTableName = (member: NameParts): string => {
  const fullName = getFullName(member);
  const displayName = member.displayName;

  if (displayName && fullName !== displayName) {
    return `${fullName} (${displayName})`;
  }
  return fullName;
};