import { useState } from 'react';
import { predictionAPI } from '../services/api';
import type { Match, Prediction, PredictionChoice } from '../types';
import toast from 'react-hot-toast';

export function usePredictions(initialPredictions: Prediction[] = []) {
  const [myPredictions, setMyPredictions] = useState<Prediction[]>(initialPredictions);
  const [predictingId, setPredictingId] = useState<string | null>(null);

  const refreshPredictions = async () => {
    const res = await predictionAPI.getMy();
    setMyPredictions(res.data as Prediction[]);
  };

  const handlePredict = async (matchId: string, choice: PredictionChoice) => {
    setPredictingId(matchId);
    try {
      await predictionAPI.submit({ matchId, choice });
      toast.success('Prediction submitted! ⚽');
      await refreshPredictions();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Failed to submit prediction';
      toast.error(msg);
    } finally {
      setPredictingId(null);
    }
  };

  const getPredictionForMatch = (matchId: string): PredictionChoice | null => {
    const pred = myPredictions.find(
      (p) =>
        (typeof p.matchId === 'string' ? p.matchId : (p.matchId as Match)._id) ===
        matchId
    );
    return pred ? pred.choice : null;
  };

  return {
    myPredictions,
    setMyPredictions,
    predictingId,
    handlePredict,
    getPredictionForMatch,
  };
}
