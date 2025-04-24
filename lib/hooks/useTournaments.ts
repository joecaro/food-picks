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
import { supabase } from '../supabase';

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
type TournamentData = {
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
  
  return useMutation({
    mutationFn: ({ matchId, restaurantId }: { matchId: string; restaurantId: string }) => 
      vote(matchId, restaurantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
    },
    // Add optimistic updates for immediate UI feedback
    onMutate: async ({ matchId, restaurantId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tournament', tournamentId] });
      
      // Save current data
      const previousData = queryClient.getQueryData(['tournament', tournamentId]);
      
      // Optimistically update vote counts only
      queryClient.setQueryData(['tournament', tournamentId], (old: TournamentData | undefined) => {
        if (!old || !old.matchesByRound) return old;
        
        const newData = JSON.parse(JSON.stringify(old));
        const currentRound = newData.tournament.current_round;
        const matches = newData.matchesByRound[currentRound];
        
        const matchIndex = matches.findIndex((m: { id: string }) => m.id === matchId);
        if (matchIndex >= 0) {
          const match = matches[matchIndex];
          if (restaurantId === match.restaurant1.id) {
            match.votes1 += 1;
          } else if (match.restaurant2 && restaurantId === match.restaurant2.id) {
            match.votes2 += 1;
          }
          // Do NOT set match.userVote here
        }
        
        return newData;
      });
      
      // Query the current user's vote for this match and update the cache accordingly
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;
      if (currentUserId) {
        const { data: voteData } = await supabase
          .from('votes')
          .select('restaurant_id')
          .eq('match_id', matchId)
          .eq('user_id', currentUserId)
          .maybeSingle();
        if (voteData) {
          queryClient.setQueryData(['tournament', tournamentId], (old: TournamentData | undefined) => {
            if (!old || !old.matchesByRound) return old;
            const newData = JSON.parse(JSON.stringify(old));
            const currentRound = newData.tournament.current_round;
            const matches = newData.matchesByRound[currentRound];
            const matchIndex = matches.findIndex((m: { id: string }) => m.id === matchId);
            if (matchIndex >= 0) {
              matches[matchIndex].userVote = voteData.restaurant_id;
            }
            return newData;
          });
        }
      }
      
      return { previousData };
    },
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