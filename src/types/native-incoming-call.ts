import { IncomingBuzzInvite } from '@/services/direct-call-invite-queue.service';

export type NativeIncomingCallAction =
  | 'open'
  | 'accept'
  | 'decline'
  | 'timeout';

export interface NativeIncomingCallEvent {
  action: NativeIncomingCallAction;
  invite: IncomingBuzzInvite;
}
