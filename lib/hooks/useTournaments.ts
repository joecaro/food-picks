'use client';

import { 
  useMutation, 
  useQuery, 
  useQueryClient 
} from '@tanstack/react-query';
import { 
  createTournament, 
  getTournament, 
  listTournaments, 
  nominateRestaurant,
  startVoting,
  vote,
  checkRoundEnd,
  copyTournament,
  deleteRestaurant
} from '../api';
// import { supabase } from '../supabase'; // Supabase client used in api.ts, not directly here
import { useAuth } from '@/app/auth-provider'; // Try path alias

// List tournaments
export function useTournamentsList() {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: listTournaments,
  });
}

interface Match {
  id: string;
  round: number;
  restaurant1: {
    id: string;
    name: string;
    cuisine: string;
  };
  restaurant2: {
    id: string;
    name: string;
    cuisine: string;
  } | null;
  votes1: number;
  votes2: number;
  userVote?: string;
}

// Fix type issues
export type TournamentData = {
  tournament: {
    status: string;
    current_round: number;
    end_time: string;
    name: string;
  };
  restaurants: {
    id: string;
    name: string;
    cuisine: string;
  }[];
  winner: {
    id: string;
    name: string;
    cuisine: string;
  };
  matchesByRound?: Record<number, Match[]>;
};

// Get single tournament
export function useTournament(id: string) {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: () => getTournament(id),
    refetchInterval: (query) => {
      const data = query.state.data as TournamentData | undefined;
      // Auto refresh for active tournaments
      if (data?.tournament?.status === 'voting') {
        return 1000; // Refresh every 5 seconds during voting
      }
      return false;
    },
  });
}

// Create tournament
export function useCreateTournament() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (name: string) => createTournament(name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      return data;
    },
  });
}

// Copy tournament
export function useCopyTournament() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (tournamentId: string) => copyTournament(tournamentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      return data;
    },
  });
}

// Nominate restaurant
export function useNominateRestaurant(tournamentId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ name, cuisine }: { name: string; cuisine: string }) => 
      nominateRestaurant(tournamentId, name, cuisine),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    },
  });
}

// Start voting
export function useStartVoting(tournamentId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => startVoting(tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    },
  });
}

// Vote
export function useVote(tournamentId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Get user for optimistic update

  return useMutation({
    mutationFn: ({ matchId, restaurantId }: { matchId: string; restaurantId: string }) =>
      vote(matchId, restaurantId),
    // Remove onSuccess invalidation, rely on optimistic update and potential background refetch/realtime
    // onSuccess: () => {
    //   queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    // },
    onMutate: async ({ matchId, restaurantId }) => {
      await queryClient.cancelQueries({ queryKey: ['tournament', tournamentId] });
      const previousData = queryClient.getQueryData(['tournament', tournamentId]);

      queryClient.setQueryData(['tournament', tournamentId], (old: TournamentData | undefined) => {
        if (!old || !old.matchesByRound || !user) return old; // Need user for userVote

        // Deep clone to avoid modifying the original cache object directly
        const newData = JSON.parse(JSON.stringify(old)); 
        const currentRound = newData.tournament.current_round;

        // Ensure the round exists in matchesByRound
        if (!newData.matchesByRound[currentRound]) return old; 
        
        const matches = newData.matchesByRound[currentRound];
        const matchIndex = matches.findIndex((m: { id: string }) => m.id === matchId);

        if (matchIndex >= 0) {
          const match = matches[matchIndex];
          
          // Avoid double voting optimistically if user already voted
          if (match.userVote) return old; 

          // Optimistically update counts
          if (restaurantId === match.restaurant1.id) {
            match.votes1 += 1;
          } else if (match.restaurant2 && restaurantId === match.restaurant2.id) {
            match.votes2 += 1;
          }
          
          // Optimistically set the user's vote
          match.userVote = restaurantId; 
        }

        return newData;
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['tournament', tournamentId], context.previousData);
      }
      // Optionally: show error notification to user
      console.error('Vote failed:', err);
    },
    onSettled: () => {
       // Refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    }
  });
}

// Check if round has ended
export function useCheckRoundEnd(tournamentId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (force: boolean = false) => checkRoundEnd(tournamentId, force),
    onSuccess: (wasAdvanced) => {
      // Only refetch if the round was advanced
      if (wasAdvanced) {
        console.log('Round was advanced, refetching data...');
        queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
        queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      }
    },
  });
}

// Delete restaurant
export function useDeleteRestaurant(tournamentId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (restaurantId: string) => deleteRestaurant(restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    },
  });
} 