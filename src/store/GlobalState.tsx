import { createContext, useReducer, ReactNode, Dispatch } from 'react';
import reducers, { AppState } from './Reducers';
import { Action } from './types';

// Define the context shape
interface ContextProps {
  state: AppState;
  dispatch: Dispatch<Action>;
}

export const DataContext = createContext<ContextProps | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const initialState: AppState = {
    // auth
    token: null,
    user: null,
    success: null,
    error: null,
    callback: false,
    authFlow: null,
    userTyping: [],
    chatSubscription: null,
    channelSubscription: null,
    replySubscription: null,

    // organisation
    orgId: null,
    orgData: null,
    org: [],
    orgMembers: [],
    orgCallback: false,

    // dms
    dms: [],
    dmsChat: [],
    singleDmsChat: [],
    dmLoading: true,
    participant: [],
    singleParticipant: [],
    receiver: null,
    media: [],
    uploading: false,
    groupDetails: null,
    groupCallback: false,
    selectedMsg: null,

    // channels
    userChannels: [],
    allChannels: [],
    channelLoading: true,
    channelsChat: [],
    replyChat: [],
    channelDetails: null,
    channel: null,
    channelCallback: false,
    replyCallback: false,

    // agents
    agents: [],
    agent: null,
    agentsChat: [],
    agentCallback: false,

    // buzz
    hasJoined: false,
    buzzData: null,
    buzzParticipants: [],
    buzzChats: [],
    floatingEmojis: [],
    buzzIsMuted: true,
    buzzShowVideo: false,
    buzzIsScreenSharing: false,
    buzzJoinLoading: false,
    isCallMinimized: false,
    minimizedFrom: null,

    // settings
    statusCallback: false,
    billings: [],

    // mentions
    mentionsList: [],
    unseenThreadCount: 0,
    loadThreadCallback: false,
    mentionUser: false,
  };

  const [state, dispatch] = useReducer(reducers, initialState);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};
