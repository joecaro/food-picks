import { supabase } from './supabase';

const NOMINATION_TIME = 2 * 60 * 1000; // 2 minutes
const VOTING_TIME = 2 * 60 * 1000; // 2 minutes per round

// Tournament functions
export async function createTournament(name: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Convert timestamp to ISO string for PostgreSQL
  const endTimeDate = new Date(Date.now() + NOMINATION_TIME);

  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name,
      status: 'nominating',
      creator_id: user.id,
      current_round: 1,
      end_time: endTimeDate.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function copyTournament(tournamentId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Get original tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select()
    .eq('id', tournamentId)
    .single();

  if (tournamentError) throw tournamentError;
  if (!tournament) throw new Error('Tournament not found');

  // Create new tournament
  const endTimeDate = new Date(Date.now() + NOMINATION_TIME);
  
  const { data: newTournament, error: createError } = await supabase
    .from('tournaments')
    .insert({
      name: tournament.name + ' (Copy)',
      status: 'nominating',
      creator_id: user.id,
      current_round: 1,
      end_time: endTimeDate.toISOString(),
    })
    .select()
    .single();

  if (createError) throw createError;

  // Copy restaurants
  const { data: restaurants, error: restaurantsError } = await supabase
    .from('restaurants')
    .select()
    .eq('tournament_id', tournamentId);

  if (restaurantsError) throw restaurantsError;

  if (restaurants && restaurants.length > 0) {
    const restaurantsCopy = restaurants.map(restaurant => ({
      tournament_id: newTournament.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
    }));

    const { error: copyError } = await supabase
      .from('restaurants')
      .insert(restaurantsCopy);

    if (copyError) throw copyError;
  }

  return newTournament;
}

export async function nominateRestaurant(tournamentId: string, name: string, cuisine: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Check tournament status
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select()
    .eq('id', tournamentId)
    .single();

  if (tournamentError) throw tournamentError;
  if (!tournament) throw new Error('Tournament not found');
  if (tournament.status !== 'nominating') throw new Error('Tournament not in nomination phase');

  // Add restaurant
  const { error } = await supabase
    .from('restaurants')
    .insert({
      tournament_id: tournamentId,
      name,
      cuisine,
    });

  if (error) throw error;
}

export async function startVoting(tournamentId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Check tournament status
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select()
    .eq('id', tournamentId)
    .single();

  if (tournamentError) throw tournamentError;
  if (!tournament) throw new Error('Tournament not found');
  if (tournament.status !== 'nominating') throw new Error('Tournament not in nomination phase');

  // Get restaurants
  const { data: restaurants, error: restaurantsError } = await supabase
    .from('restaurants')
    .select()
    .eq('tournament_id', tournamentId);

  if (restaurantsError) throw restaurantsError;
  if (!restaurants || restaurants.length < 2) throw new Error('Need at least 2 restaurants');

  // Shuffle restaurants
  const shuffled = [...restaurants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Create matches for first round
  const matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    const restaurant1 = shuffled[i];
    const restaurant2 = shuffled[i + 1];
    matches.push({
      tournament_id: tournamentId,
      round: 1,
      restaurant1: restaurant1.id,
      restaurant2: restaurant2?.id || null,
      votes1: 0,
      votes2: 0,
    });
  }

  // Insert matches
  const { error: matchesError } = await supabase
    .from('matches')
    .insert(matches);

  if (matchesError) throw matchesError;

  // Update tournament status
  const endTimeDate = new Date(Date.now() + VOTING_TIME);
  
  const { error: updateError } = await supabase
    .from('tournaments')
    .update({
      status: 'voting',
      current_round: 1,
      end_time: endTimeDate.toISOString(),
    })
    .eq('id', tournamentId);

  if (updateError) throw updateError;
}

export async function vote(matchId: string, restaurantId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Get match details
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select()
    .eq('id', matchId)
    .single();

  if (matchError) throw matchError;
  if (!match) throw new Error('Match not found');

  // Check tournament status
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select()
    .eq('id', match.tournament_id)
    .single();

  if (tournamentError) throw tournamentError;
  if (!tournament) throw new Error('Tournament not found');
  if (tournament.status !== 'voting') throw new Error('Tournament not in voting phase');
  if (tournament.current_round !== match.round) throw new Error('Match not in current round');

  // Check if user already voted
  const { data: existingVote, error: voteError } = await supabase
    .from('votes')
    .select()
    .eq('match_id', matchId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (voteError) throw voteError;
  if (existingVote) throw new Error('Already voted');

  try {
    // Record vote - start a transaction by using .rpc() for atomic operations
    const { error: insertError } = await supabase
      .from('votes')
      .insert({
        match_id: matchId,
        user_id: user.id,
        restaurant_id: restaurantId,
      });

    if (insertError) throw insertError;

    // Update match vote count
    if (restaurantId === match.restaurant1) {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ votes1: match.votes1 + 1 })
        .eq('id', matchId);
      
      if (updateError) throw updateError;
    } else if (restaurantId === match.restaurant2) {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ votes2: match.votes2 + 1 })
        .eq('id', matchId);
      
      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error("Error processing vote:", error);
    throw new Error("Failed to process vote. Please try again.");
  }
}

export async function checkRoundEnd(tournamentId: string, force = false) {
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select()
    .eq('id', tournamentId)
    .single();

  if (tournamentError) throw tournamentError;
  if (!tournament) throw new Error('Tournament not found');
  
  if (tournament.status !== 'voting') return false;

  const endTime = new Date(tournament.end_time).getTime();
  const now = Date.now();
  
  if (force || endTime <= now) {
    console.log('Advancing round...');
    await advanceRound(tournamentId);
    return true;
  }
  
  return false;
}

export async function advanceRound(tournamentId: string) {
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select()
    .eq('id', tournamentId)
    .single();

  if (tournamentError) throw tournamentError;
  if (!tournament) throw new Error('Tournament not found');
  if (tournament.status !== 'voting') throw new Error('Tournament not in voting phase');

  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select()
    .eq('tournament_id', tournamentId)
    .eq('round', tournament.current_round);

  if (matchesError) throw matchesError;
  if (!matches) throw new Error('No matches found');

  console.log(`Advancing round ${tournament.current_round}, found ${matches.length} matches`);
  
  const winners: string[] = [];
  for (const match of matches) {
    if (!match.restaurant2) {
      console.log(`Match ${match.id}: Restaurant1 (${match.restaurant1}) wins by bye`);
      winners.push(match.restaurant1);
    } else if (match.votes1 >= match.votes2) {
      console.log(`Match ${match.id}: Restaurant1 (${match.restaurant1}) wins with ${match.votes1} votes vs ${match.votes2} votes`);
      winners.push(match.restaurant1);
    } else {
      console.log(`Match ${match.id}: Restaurant2 (${match.restaurant2}) wins with ${match.votes2} votes vs ${match.votes1} votes`);
      winners.push(match.restaurant2);
    }
  }

  console.log(`Winners: ${winners.length}, winners array:`, winners);
  
  if (winners.length === 1) {
    console.log('Only one winner, setting tournament to completed');
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({
        status: 'completed',
        winner: winners[0],
      })
      .eq('id', tournamentId);

    if (updateError) throw updateError;
  } else {
    // Create next round matches
    const nextRoundMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      const restaurant1 = winners[i];
      const restaurant2 = i + 1 < winners.length ? winners[i + 1] : null;
      console.log(`Creating match for round ${tournament.current_round + 1}: ${restaurant1} vs ${restaurant2 || 'bye'}`);
      
      nextRoundMatches.push({
        tournament_id: tournamentId,
        round: tournament.current_round + 1,
        restaurant1: restaurant1,
        restaurant2: restaurant2,
        votes1: 0,
        votes2: 0,
      });
    }

    console.log(`Creating ${nextRoundMatches.length} matches for round ${tournament.current_round + 1}`);
    
    const { error: insertError } = await supabase
      .from('matches')
      .insert(nextRoundMatches);

    if (insertError) throw insertError;

    // Update tournament status
    const endTimeDate = new Date(Date.now() + VOTING_TIME);
    
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({
        current_round: tournament.current_round + 1,
        end_time: endTimeDate.toISOString(),
      })
      .eq('id', tournamentId);

    if (updateError) throw updateError;
  }
}

export async function listTournaments() {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        winner:winner(id, name, cuisine)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error listing tournaments:', error);
    return [];
  }
}

export async function getTournament(tournamentId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Get tournament details
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select(`
      *,
      winner:winner(id, name, cuisine)
    `)
    .eq('id', tournamentId)
    .single();

  if (tournamentError) throw tournamentError;
  if (!tournament) throw new Error('Tournament not found');

  // Get restaurants
  const { data: restaurants, error: restaurantsError } = await supabase
    .from('restaurants')
    .select()
    .eq('tournament_id', tournamentId);

  if (restaurantsError) throw restaurantsError;

  if (tournament.status === 'nominating') {
    return {
      tournament,
      restaurants: restaurants || [],
      winner: tournament.winner,
    };
  }

  // Get matches and process for bracket display
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select(`
      *,
      restaurant1(*),
      restaurant2(*)
    `)
    .eq('tournament_id', tournamentId);

  if (matchesError) throw matchesError;

  // Get user votes
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select()
    .eq('user_id', user.id)
    .in(
      'match_id',
      matches?.map(match => match.id) || []
    );

  if (votesError) throw votesError;

  // Group matches by round
  type Restaurant = {
    id: string;
    name: string;
    cuisine: string;
  };
  
  type Match = {
    id: string;
    round: number;
    restaurant1: Restaurant;
    restaurant2: Restaurant | null;
    votes1: number;
    votes2: number;
    userVote?: string;
  };
  
  const matchesByRound: Record<number, Match[]> = {};
  matches?.forEach(match => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    
    const userVote = votes?.find(vote => vote.match_id === match.id)?.restaurant_id;
    
    matchesByRound[match.round].push({
      id: match.id,
      round: match.round,
      restaurant1: match.restaurant1,
      restaurant2: match.restaurant2,
      votes1: match.votes1,
      votes2: match.votes2,
      userVote,
    });
  });

  return {
    tournament,
    restaurants: restaurants || [],
    winner: tournament.winner,
    matchesByRound,
  };
}

export async function getAllRestaurants() {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('name, cuisine')
      .order('name');
    
    if (error) throw error;
    
    // De-duplicate restaurants with the same name
    const uniqueRestaurants = Array.from(
      new Map(data?.map(item => [item.name, item])).values()
    );
    
    return uniqueRestaurants;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }
}

export async function deleteRestaurant(restaurantId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Get restaurant to check tournament status
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('tournament_id')
    .eq('id', restaurantId)
    .single();

  if (restaurantError) throw restaurantError;
  if (!restaurant) throw new Error('Restaurant not found');

  // Check tournament status
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select()
    .eq('id', restaurant.tournament_id)
    .single();

  if (tournamentError) throw tournamentError;
  if (!tournament) throw new Error('Tournament not found');
  if (tournament.status !== 'nominating') throw new Error('Cannot remove restaurant after nomination phase');

  // Delete restaurant
  const { error } = await supabase
    .from('restaurants')
    .delete()
    .eq('id', restaurantId);

  if (error) throw error;
} 