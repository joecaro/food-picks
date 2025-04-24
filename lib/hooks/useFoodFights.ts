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
  deleteRestaurant,
  deleteFoodFight
} from '../api';

// Import renamed result type from API
import type { GetFoodFightResult } from '../api';
import { queryKeys } from '../queryKeys';

// List Food Fights
export function useFoodFightsList() {
  return useQuery({
    queryKey: queryKeys.foodFights(), // Use key utility
    queryFn: listFoodFights, // Use renamed API function
  });
}

// Use renamed data type
export type FoodFightData = GetFoodFightResult;

// Get single Food Fight
export function useFoodFight(id: string) {
  return useQuery({
    queryKey: queryKeys.foodFight(id), // Use key utility
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
      queryClient.invalidateQueries({ queryKey: queryKeys.foodFights() }); // Use key utility
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
      queryClient.invalidateQueries({ queryKey: queryKeys.foodFights() }); // Use key utility
      return data;
    },
  });
}

// Nominate restaurant (Hook name unchanged, use renamed API function)
export function useNominateRestaurant(foodFightId: string) {
  const queryClient = useQueryClient();
  const foodFightKey = queryKeys.foodFight(foodFightId); // Get key from utility
  
  return useMutation({
    mutationFn: ({ name, cuisine }: { name: string; cuisine: string }) => 
      nominateRestaurant(foodFightId, name, cuisine), // Use renamed API function
    
    // Add optimistic update for nominating
    onMutate: async (newRestaurantData) => { // Renamed variable for clarity
      await queryClient.cancelQueries({ queryKey: foodFightKey });
      const previousFoodFightData = queryClient.getQueryData<FoodFightData>(foodFightKey);
      
      // Create restaurant object with temporary ID for optimistic update
      const optimisticRestaurant = {
        ...newRestaurantData,
        id: crypto.randomUUID(), // Add temporary client-side ID
      };

      queryClient.setQueryData<FoodFightData>(foodFightKey, (oldData) => {
        if (!oldData) return undefined;
        return {
          ...oldData,
          // Add the restaurant with the temporary ID
          restaurants: [...(oldData.restaurants || []), optimisticRestaurant],
        };
      });
      return { previousFoodFightData };
    },
    onError: (err, newRestaurant, context) => {
      console.error('Failed to nominate restaurant:', err);
      if (context?.previousFoodFightData) {
        queryClient.setQueryData(foodFightKey, context.previousFoodFightData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: foodFightKey });
    },
  });
}

// Start voting (Hook name unchanged, use renamed API function)
export function useStartVoting(foodFightId: string) {
  const queryClient = useQueryClient();
  const foodFightKey = queryKeys.foodFight(foodFightId); // Get key from utility
  
  return useMutation({
    mutationFn: () => startVoting(foodFightId), // Use renamed API function
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodFightKey });
    },
  });
}

// Submit scores (Hook name unchanged, use renamed API function)
export function useSubmitScores(foodFightId: string) {
  const queryClient = useQueryClient();
  const foodFightKey = queryKeys.foodFight(foodFightId); // Get key from utility

  return useMutation<void, Error, { restaurant_id: string; score: number }, { previousFoodFightData: FoodFightData | undefined }>({ // Rename context type property
    mutationFn: (scoreData: { restaurant_id: string; score: number }) => 
      submitScores(foodFightId, scoreData), // Use renamed API function

    onMutate: async (newScoreData) => {
      await queryClient.cancelQueries({ queryKey: foodFightKey });
      const previousFoodFightData = queryClient.getQueryData<FoodFightData>(foodFightKey);
      queryClient.setQueryData<FoodFightData>(foodFightKey, (oldData) => {
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
        queryClient.setQueryData(foodFightKey, context.previousFoodFightData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: foodFightKey });
    },
  });
}

// Check Voting End (Hook name unchanged, use renamed API function)
export function useCheckVotingEnd(foodFightId: string) {
  const queryClient = useQueryClient();
  const foodFightKey = queryKeys.foodFight(foodFightId); // Get key from utility
  const foodFightsListKey = queryKeys.foodFights(); // Get list key
  
  return useMutation({
    mutationFn: (force: boolean = false) => checkRoundEnd(foodFightId, force), // Use renamed API function
    onSuccess: (didEnd) => {
      if (didEnd) {
        console.log('Voting ended/winner calculated, refetching data...');
        queryClient.invalidateQueries({ queryKey: foodFightKey });
        queryClient.invalidateQueries({ queryKey: foodFightsListKey });
      }
    },
  });
}

// Delete restaurant (Hook name unchanged, use renamed API function)
export function useDeleteRestaurant(foodFightId: string) {
  const queryClient = useQueryClient();
  const foodFightKey = queryKeys.foodFight(foodFightId); // Get key from utility
  
  return useMutation({
    mutationFn: (restaurantId: string) => deleteRestaurant(restaurantId), // Use renamed API function (no change needed here as it takes restaurantId)
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodFightKey });
    },
  });
}

// New Hook to delete a Food Fight
export function useDeleteFoodFight() {
  const queryClient = useQueryClient();
  const foodFightsListKey = queryKeys.foodFights();

  return useMutation<void, Error, string>({ // Expects foodFightId (string)
    mutationFn: (foodFightId: string) => deleteFoodFight(foodFightId),
    onSuccess: () => {
      // When a food fight is deleted, invalidate the list query to refetch
      console.log('Food Fight deleted, invalidating list...');
      queryClient.invalidateQueries({ queryKey: foodFightsListKey });
      // Optional: You might want to remove the specific food fight query if cached
      // queryClient.removeQueries({ queryKey: queryKeys.foodFight(deletedId) });
    },
    onError: (err) => {
      // Optionally show error to user via toast or state
      console.error('Food Fight deletion failed:', err);
    },
  });
} 