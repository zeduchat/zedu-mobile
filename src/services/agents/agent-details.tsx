import { ACTIONS } from '@/store/types';
import { useDataContext } from '@/store/useDataContext';
import { Agent } from '@/types/agents';
import { GetRequest } from '@/utils/requests';
import { useEffect, useState } from 'react';

const UseAgentDetails = (id: string) => {
  const { state, dispatch } = useDataContext();
  const { orgId, agentCallback } = state;
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    if (orgId) {
      const fetchAgentDetails = async () => {
        const { data, error } = await GetRequest(
          `/organisations/${orgId}/agents/${id}`,
        );

        if (!error) {
          setAgent(data.data);
          dispatch({ type: ACTIONS.AGENT, payload: data?.data });
        }
        setLoading(false);
      };
      fetchAgentDetails();
    }
  }, [orgId, dispatch, agentCallback]);

  return {
    loading,
    agent,
  };
};

export default UseAgentDetails;
