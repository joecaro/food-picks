'use client';

import { 
  useMutation, 
  useQuery, 
  useQueryClient 
} from '@tanstack/react-query';
// Import renamed API functions
import { 
  createFoodFight, 
  getFoodFight, 
  listFoodFights, 
  nominateRestaurant,
  startVoting,
  checkRoundEnd,
  submitScores,
  copyFoodFight,
  deleteRestaurant
} from '../api';

// Import renamed result type from API
import type { GetFoodFightResult } from '../api';

// List Food Fights
export function useFoodFightsList() {
  return useQuery({
    queryKey: ['foodFights'],
    queryFn: listFoodFights, // Use renamed API function
  });
}

// Use renamed data type
export type FoodFightData = GetFoodFightResult;

// Get single Food Fight
export function useFoodFight(id: string) {
  return useQuery({
    queryKey: ['foodFight', id],
    queryFn: () => getFoodFight(id), // Use renamed API function
    refetchInterval: (query: { state: { data: FoodFightData | undefined } }) => {
      const data = query.state.data;
      // Use renamed inner property from FoodFightData
      if (data?.foodFight?.status === 'voting') { 
        return 5000;
      }
      return false;
    },
  });
}

// Create Food Fight
export function useCreateFoodFight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (name: string) => createFoodFight(name), // Use renamed API function
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['foodFights'] });
      return data;
    },
  });
}

// Copy Food Fight
export function useCopyFoodFight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (foodFightId: string) => copyFoodFight(foodFightId), // Use renamed API function
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['foodFights'] });
      return data;
    },
  });
}

// Nominate restaurant (Hook name unchanged, use renamed API function)
export function useNominateRestaurant(foodFightId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ name, cuisine }: { name: string; cuisine: string }) => 
      nominateRestaurant(foodFightId, name, cuisine), // Use renamed API function
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodFight', foodFightId] });
    },
  });
}

// Start voting (Hook name unchanged, use renamed API function)
export function useStartVoting(foodFightId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => startVoting(foodFightId), // Use renamed API function
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodFight', foodFightId] });
    },
  });
}

// Submit scores (Hook name unchanged, use renamed API function)
export function useSubmitScores(foodFightId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['foodFight', foodFightId];

  return useMutation<void, Error, { restaurant_id: string; score: number }, { previousFoodFightData: FoodFightData | undefined }>({ // Rename context type property
    mutationFn: (scoreData: { restaurant_id: string; score: number }) => 
      submitScores(foodFightId, scoreData), // Use renamed API function

    onMutate: async (newScoreData) => {
      await queryClient.cancelQueries({ queryKey });
      const previousFoodFightData = queryClient.getQueryData<FoodFightData>(queryKey);
      queryClient.setQueryData<FoodFightData>(queryKey, (oldData) => {
        if (!oldData) return undefined;
        // Use renamed inner property from FoodFightData
        const existingScores = oldData.userScores || []; 
        const scoreIndex = existingScores.findIndex(s => s.restaurant_id === newScoreData.restaurant_id);
        let updatedScores: typeof existingScores;
        if (scoreIndex > -1) {
            updatedScores = [
                ...existingScores.slice(0, scoreIndex),
                newScoreData,
                ...existingScores.slice(scoreIndex + 1),
            ];
        } else {
            updatedScores = [...existingScores, newScoreData];
        }
        return {
          ...oldData,
          userScores: updatedScores,
        };
      });
      return { previousFoodFightData }; // Use renamed context variable
    },

    onError: (err, newScoreData, context) => {
      console.error('Score submission failed, rolling back optimistic update:', err);
      // Use renamed context property
      if (context?.previousFoodFightData) {
        queryClient.setQueryData(queryKey, context.previousFoodFightData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Check Voting End (Hook name unchanged, use renamed API function)
export function useCheckVotingEnd(foodFightId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (force: boolean = false) => checkRoundEnd(foodFightId, force), // Use renamed API function
    onSuccess: (didEnd) => {
      if (didEnd) {
        console.log('Voting ended/winner calculated, refetching data...');
        queryClient.invalidateQueries({ queryKey: ['foodFight', foodFightId] });
        queryClient.invalidateQueries({ queryKey: ['foodFights'] });
      }
    },
  });
}

// Delete restaurant (Hook name unchanged, use renamed API function)
export function useDeleteRestaurant(foodFightId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (restaurantId: string) => deleteRestaurant(restaurantId), // Use renamed API function (no change needed here as it takes restaurantId)
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodFight', foodFightId] });
    },
  });
} 