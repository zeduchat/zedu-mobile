let pendingIncomingBuzzId: string | null = null;

export const registerPendingIncomingCall = (buzzId: string) => {
  if (!buzzId) return;
  pendingIncomingBuzzId = String(buzzId);
};

export const clearPendingIncomingCall = () => {
  pendingIncomingBuzzId = null;
};

export const getPendingIncomingBuzzId = () => pendingIncomingBuzzId;

export const isPendingIncomingCall = (buzzId: string) => {
  if (!buzzId || !pendingIncomingBuzzId) return false;
  return String(pendingIncomingBuzzId) === String(buzzId);
};
