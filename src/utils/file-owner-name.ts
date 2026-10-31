export type FileOwnerIdentity = {
  id?: string | number;
  user_id?: string | number;
  full_name?: string;
  name?: string;
  username?: string;
  email?: string;
};

export type FileOwnerNameInput = {
  fileUserId: string | number;
  apiOwner?: string | null;
  orgMembers: FileOwnerIdentity[];
  currentUser?: FileOwnerIdentity | null;
};

const normalizeId = (value?: string | number | null) =>
  value === undefined || value === null ? '' : String(value);

const getIdentityId = (identity?: FileOwnerIdentity | null) =>
  normalizeId(identity?.user_id ?? identity?.id);

const getIdentityName = (identity?: FileOwnerIdentity | null) =>
  [
    identity?.full_name,
    identity?.name,
    identity?.username,
    identity?.email,
  ]
    .find(value => value?.trim())
    ?.trim();

export const resolveFileOwnerName = ({
  fileUserId,
  apiOwner,
  orgMembers,
  currentUser,
}: FileOwnerNameInput): string => {
  const normalizedFileUserId = normalizeId(fileUserId);
  const normalizedApiOwner = apiOwner?.trim();

  if (normalizedApiOwner && normalizedApiOwner !== normalizedFileUserId) {
    return normalizedApiOwner;
  }

  if (getIdentityId(currentUser) === normalizedFileUserId) {
    const currentUserName = getIdentityName(currentUser);
    if (currentUserName) return currentUserName;
  }

  const member = orgMembers.find(
    item => getIdentityId(item) === normalizedFileUserId,
  );

  return getIdentityName(member) || 'Unknown';
};
