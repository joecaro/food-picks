import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

const VOTING_TIME = 15 * 60 * 1000; // 15 minutes

// Tournament functions
export async function createFoodFight(name: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  const endTimeDate = new Date(Date.now() + VOTING_TIME);

  const { data, error } = await supabase
    .from('food_fights')
    .insert({
      name,
      status: 'nominating',
      creator_id: user.id,
      end_time: endTimeDate.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function copyFoodFight(foodFightId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Get original food fight
  const { data: foodFight, error: foodFightError } = await supabase
    .from('food_fights')
    .select()
    .eq('id', foodFightId)
    .single();

  if (foodFightError) throw foodFightError;
  if (!foodFight) throw new Error('Food Fight not found');

  // Create new food fight
  const newFoodFightEndTimeDate = new Date(Date.now() + VOTING_TIME);
  
  const { data: newFoodFight, error: createError } = await supabase
    .from('food_fights')
    .insert({
      name: foodFight.name + ' (Copy)',
      status: 'nominating',
      creator_id: user.id,
      end_time: newFoodFightEndTimeDate.toISOString(),
    })
    .select()
    .single();

  if (createError) throw createError;

  // Copy restaurants
  const { data: restaurants, error: restaurantsError } = await supabase
    .from('restaurants')
    .select()
    .eq('food_fight_id', foodFightId);

  if (restaurantsError) throw restaurantsError;

  if (restaurants && restaurants.length > 0) {
    const restaurantsCopy = restaurants.map((restaurant: Database['public']['Tables']['restaurants']['Row']) => ({
      food_fight_id: newFoodFight.id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
    }));

    const { error: copyError } = await supabase
      .from('restaurants')
      .insert(restaurantsCopy);

    if (copyError) throw copyError;
  }

  // Update food fight status
  const { error: updateError } = await supabase
    .from('food_fights')
    .update({
      status: 'voting',
      end_time: newFoodFightEndTimeDate.toISOString(),
    })
    .eq('id', newFoodFight.id);

  if (updateError) throw updateError;

  return newFoodFight;
}

export async function nominateRestaurant(foodFightId: string, name: string, cuisine: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Check food fight status
  const { data: foodFight, error: foodFightError } = await supabase
    .from('food_fights')
    .select()
    .eq('id', foodFightId)
    .single();

  if (foodFightError) throw foodFightError;
  if (!foodFight) throw new Error('Food Fight not found');
  if (foodFight.status !== 'nominating') throw new Error('Food Fight not in nomination phase');

  // Add restaurant
  const { error } = await supabase
    .from('restaurants')
    .insert({
      food_fight_id: foodFightId,
      name,
      cuisine,
    });

  if (error) throw error;
}

export async function startVoting(foodFightId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Check food fight status
  const { data: foodFight, error: foodFightError } = await supabase
    .from('food_fights')
    .select()
    .eq('id', foodFightId)
    .single();

  if (foodFightError) throw foodFightError;
  if (!foodFight) throw new Error('Food Fight not found');
  if (foodFight.status !== 'nominating') throw new Error('Food Fight not in nomination phase');

  // Get restaurants
  const { data: restaurants, error: restaurantsError } = await supabase
    .from('restaurants')
    .select()
    .eq('food_fight_id', foodFightId);

  if (restaurantsError) throw restaurantsError;
  if (!restaurants || restaurants.length < 2) throw new Error('Need at least 2 restaurants');

  // Update food fight status
  const endTimeDate = new Date(Date.now() + VOTING_TIME);
  
  const { error: updateError } = await supabase
    .from('food_fights')
    .update({
      status: 'voting',
      end_time: endTimeDate.toISOString(),
    })
    .eq('id', foodFightId);

  if (updateError) throw updateError;
}

export async function checkRoundEnd(foodFightId: string, force = false) {
  const { data: foodFight, error: foodFightError } = await supabase
    .from('food_fights')
    .select('status, end_time')
    .eq('id', foodFightId)
    .single();

  if (foodFightError) throw foodFightError;
  if (!foodFight) throw new Error('Food Fight not found');
  
  if (foodFight.status !== 'voting') return false; 

  const endTime = new Date(foodFight.end_time).getTime();
  const now = Date.now();
  
  if (force || endTime <= now) {
    console.log('Voting time ended, calculating winner...');
    await calculateWinner(foodFightId); 
    return true;
  }
  
  return false;
}

export async function listFoodFights() {
  try {
    const { data, error } = await supabase
      .from('food_fights')
      .select(`
        *,
        winner:winner(id, name, cuisine)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error listing Food Fights:', error);
    return [];
  }
}

// Define types for scores to be returned by getFoodFight
type UserScore = {
  restaurant_id: string;
  score: number;
}

type AggregateScore = {
  restaurant_id: string;
  name: string; // Include restaurant name
  cuisine: string; // Include restaurant cuisine
  average_score: number;
  vote_count: number;
}

// Define and export the structure for the result of getFoodFight
export type GetFoodFightResult = {
  foodFight: { // Renamed property
    id: string;
    name: string;
    status: string;
    end_time: string;
    creator_id: string;
    created_at: string;
    winner: string | null; // Winner restaurant ID
  };
  restaurants: { id: string; name: string; cuisine: string }[];
  winnerDetails: { id: string; name: string; cuisine: string } | null; // Full details if winner exists
  userScores: UserScore[];
  aggregateScores: AggregateScore[];
};

export async function getFoodFight(foodFightId: string): Promise<GetFoodFightResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Get food fight details
  const { data: foodFight, error: foodFightError } = await supabase
    .from('food_fights')
    .select(`
      id, name, status, end_time, creator_id, created_at,
      winner 
    `)
    .eq('id', foodFightId)
    .single();

  if (foodFightError) throw foodFightError;
  if (!foodFight) throw new Error('Food Fight not found');

  // Get restaurants
  const { data: restaurants, error: restaurantsError } = await supabase
    .from('restaurants')
    .select('id, name, cuisine')
    .eq('food_fight_id', foodFightId);

  if (restaurantsError) throw restaurantsError;
  
  const restaurantList = restaurants || [];

  // Find winner details from the restaurant list if winner ID exists
  const winnerDetails = foodFight.winner 
    ? restaurantList.find(r => r.id === foodFight.winner) || null
    : null;

  // Initialize scores
  let userScoresResult: UserScore[] = [];
  let aggregateScoresResult: AggregateScore[] = [];

  // If voting or completed, fetch scores
  if (foodFight.status === 'voting' || foodFight.status === 'completed') {
    // Get user's scores
    const { data: userScoresData, error: userScoresError } = await supabase
      .from('scores')
      .select('restaurant_id, score')
      .eq('food_fight_id', foodFightId)
      .eq('user_id', user.id);

    if (userScoresError) throw userScoresError;
    userScoresResult = userScoresData || [];

    // If completed, calculate and add aggregate scores for display
    if (foodFight.status === 'completed') {
      const { data: allScoresData, error: allScoresError } = await supabase
        .from('scores')
        .select('restaurant_id, score')
        .eq('food_fight_id', foodFightId);

      if (allScoresError) throw allScoresError;
      
      if (allScoresData && allScoresData.length > 0) {
          const restaurantScores: Record<string, { totalScore: number; voteCount: number }> = {};
          allScoresData.forEach(s => {
            if (!restaurantScores[s.restaurant_id]) {
              restaurantScores[s.restaurant_id] = { totalScore: 0, voteCount: 0 };
            }
            restaurantScores[s.restaurant_id].totalScore += s.score;
            restaurantScores[s.restaurant_id].voteCount++;
          });
          
          // Map restaurant details into the aggregate scores
          const restaurantMap = new Map(restaurantList.map(r => [r.id, r]));

          aggregateScoresResult = Object.entries(restaurantScores).map(([id, data]) => {
            const restaurantDetails = restaurantMap.get(id);
            return {
                restaurant_id: id,
                name: restaurantDetails?.name || 'Unknown Restaurant', 
                cuisine: restaurantDetails?.cuisine || 'Unknown',
                average_score: data.totalScore / data.voteCount,
                vote_count: data.voteCount
            }
          });
          
          // Sort by average score descending
          aggregateScoresResult.sort((a, b) => b.average_score - a.average_score);
          
          // Assign calculated aggregate scores
          aggregateScoresResult = aggregateScoresResult;
      }
    } else {
      // Status is 'voting'
      aggregateScoresResult = [];
    }
  } else {
    // Status is 'nominating'
    aggregateScoresResult = [];
  }

  // Construct the final result object
  return {
    foodFight,
    restaurants: restaurantList,
    winnerDetails,
    userScores: userScoresResult,
    aggregateScores: aggregateScoresResult,
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
      new Map(data?.map((item: { name: string; cuisine: string }) => [item.name, item])).values()
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

  // Get restaurant to find food fight id
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('food_fight_id')
    .eq('id', restaurantId)
    .single();

  if (restaurantError) throw restaurantError;
  if (!restaurant) throw new Error('Restaurant not found');

  // Check food fight status
  const { data: foodFight, error: foodFightError } = await supabase
    .from('food_fights')
    .select()
    .eq('id', restaurant.food_fight_id)
    .single();

  if (foodFightError) throw foodFightError;
  if (!foodFight) throw new Error('Food Fight not found');
  if (foodFight.status !== 'nominating') throw new Error('Cannot remove restaurant after nomination phase');

  // Delete restaurant
  const { error } = await supabase
    .from('restaurants')
    .delete()
    .eq('id', restaurantId);

  if (error) throw error;
}

// New function to submit scores for a user - Updated to accept single score object
export async function submitScores(foodFightId: string, scoreData: { restaurant_id: string; score: number }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Check food fight status
  const { data: foodFight, error: foodFightError } = await supabase
    .from('food_fights')
    .select('status, end_time')
    .eq('id', foodFightId)
    .single();

  if (foodFightError) throw foodFightError;
  if (!foodFight) throw new Error('Food Fight not found');
  if (foodFight.status !== 'voting') throw new Error('Food Fight not in voting phase');
  
  // Optional: Check if voting time has ended
  // const endTime = new Date(foodFight.end_time).getTime();
  // if (Date.now() > endTime) {
  //   throw new Error('Voting has ended for this Food Fight');
  // }

  // Validate the single score object
  if (!scoreData || typeof scoreData.restaurant_id !== 'string' || 
      typeof scoreData.score !== 'number' || 
      scoreData.score < 1 || scoreData.score > 5 ||
      !Number.isInteger(scoreData.score)) {
    throw new Error('Invalid score format or value (must be integer 1-5)');
  }
  
  // Prepare single row for upsert
  const scoreRow = {
    food_fight_id: foodFightId,
    user_id: user.id,
    restaurant_id: scoreData.restaurant_id,
    score: scoreData.score,
  };

  // Upsert single score (insert or update based on unique constraint)
  const { error: upsertError } = await supabase
    .from('scores')
    .upsert(scoreRow, { onConflict: 'food_fight_id, user_id, restaurant_id' }); // Pass single object

  if (upsertError) {
    console.error("Error submitting score:", upsertError);
    throw new Error("Failed to submit score.");
  }
}

// New function to calculate and set the winner based on scores
export async function calculateWinner(foodFightId: string) {
  console.log(`Calculating winner for Food Fight ${foodFightId}`);
  
  // 1. Verify food fight status (should be 'voting' or maybe re-runnable if 'completed')
  const { data: foodFightData, error: foodFightError } = await supabase
    .from('food_fights')
    .select('status')
    .eq('id', foodFightId)
    .single();

  if (foodFightError) throw foodFightError;
  if (!foodFightData) throw new Error('Food Fight not found during winner calculation');
  if (foodFightData.status !== 'voting') {
     console.warn(`Food Fight ${foodFightId} is not in 'voting' status. Current status: ${foodFightData.status}. Calculation might be redundant or inappropriate.`);
     // Decide if we should proceed or exit. For now, let's proceed but warn.
     // return; 
  }
  
  // 2. Fetch all scores for the food fight
  const { data: scores, error: scoresError } = await supabase
    .from('scores')
    .select('restaurant_id, score')
    .eq('food_fight_id', foodFightId);

  if (scoresError) throw scoresError;
  if (!scores || scores.length === 0) {
    // Handle case with no scores - maybe set status to completed with no winner?
    console.warn(`No scores found for Food Fight ${foodFightId}. Cannot determine winner.`);
     const { error: updateError } = await supabase
      .from('food_fights')
      .update({ status: 'completed', winner: null }) // Set winner to null explicitly
      .eq('id', foodFightId);
    if (updateError) throw updateError;
    return; // Exit early
  }

  // 3. Calculate aggregate scores (average score per restaurant)
  const restaurantScores: Record<string, { totalScore: number; voteCount: number }> = {};
  scores.forEach(s => {
    if (!restaurantScores[s.restaurant_id]) {
      restaurantScores[s.restaurant_id] = { totalScore: 0, voteCount: 0 };
    }
    restaurantScores[s.restaurant_id].totalScore += s.score;
    restaurantScores[s.restaurant_id].voteCount++;
  });
  
  const restaurantAverages = Object.entries(restaurantScores).map(([id, data]) => ({
    id,
    averageScore: data.totalScore / data.voteCount,
    voteCount: data.voteCount // Keep vote count for tie-breaking?
  }));

  // 4. Find the winner (highest average score)
  // Sort descending by average score, then potentially by vote count as a tie-breaker
  restaurantAverages.sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
          return b.averageScore - a.averageScore;
      }
      // Tie-breaker: higher vote count wins (optional)
      // return b.voteCount - a.voteCount; 
      // Or just pick the first one found in case of a tie
      return 0; 
  });
  
  const winnerId = restaurantAverages[0].id;
  console.log(`Winner determined for ${foodFightId}: Restaurant ${winnerId} with average score ${restaurantAverages[0].averageScore}`);

  // 5. Update food fight status and winner
  const { error: updateError } = await supabase
    .from('food_fights')
    .update({ status: 'completed', winner: winnerId })
    .eq('id', foodFightId);

  if (updateError) throw updateError;

  console.log(`Food Fight ${foodFightId} status updated to completed.`);
}

// New function to delete a food fight
export async function deleteFoodFight(foodFightId: string) {
  console.log(`Deleting food fight ${foodFightId}`);
  
  // Optional: Add permission checks here - e.g., check if user is creator
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) throw new Error('Not logged in');
  // const { data: foodFightData, error: fetchError } = await supabase
  //   .from('food_fights')
  //   .select('creator_id')
  //   .eq('id', foodFightId)
  //   .single();
  // if (fetchError || !foodFightData) throw new Error('Food Fight not found or error fetching details');
  // if (foodFightData.creator_id !== user.id) throw new Error('Only the creator can delete this Food Fight');

  // Delete the food fight. Associated restaurants/scores should cascade delete
  // based on the FOREIGN KEY constraints defined in schema.sql.
  const { error: deleteError } = await supabase
    .from('food_fights')
    .delete()
    .eq('id', foodFightId);

  if (deleteError) {
    console.error('Error deleting food fight:', deleteError);
    throw new Error('Failed to delete Food Fight.');
  }

  console.log(`Food Fight ${foodFightId} deleted successfully.`);
} 