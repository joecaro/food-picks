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

export async function nominateRestaurantToFoodFight(
  foodFightId: string,
  restaurantData: { name: string; cuisine: string; link?: string | null }
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Check food fight status remains 'nominating'
  const { data: foodFight, error: foodFightError } = await supabase
    .from('food_fights')
    .select('status')
    .eq('id', foodFightId)
    .single();

  if (foodFightError) throw foodFightError;
  if (!foodFight) throw new Error('Food Fight not found');
  if (foodFight.status !== 'nominating') throw new Error('Food Fight not in nomination phase');

  // 1. Find or Create the restaurant in the central 'restaurants' table
  let restaurantId: string;

  const { data: existingRestaurant, error: findError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('name', restaurantData.name) // Assuming name is the unique identifier for now
    .maybeSingle(); // Use maybeSingle to handle not found

  if (findError && findError.code !== 'PGRST116') { // Ignore 'not found' error code
    console.error("Error finding restaurant:", findError);
    throw findError; // Rethrow other errors
  }

  if (existingRestaurant) {
    restaurantId = existingRestaurant.id;
    // Optional: Update existing restaurant cuisine/link if needed
    // const { error: updateRestError } = await supabase
    //   .from('restaurants')
    //   .update({ 
    //     cuisine: restaurantData.cuisine,
    //     link: restaurantData.link || null
    //   })
    //   .eq('id', restaurantId);
    // if (updateRestError) console.warn("Failed to update existing restaurant details:", updateRestError);
  } else {
    // Create new restaurant
    const { data: newRestaurant, error: createError } = await supabase
      .from('restaurants')
      .insert({
        name: restaurantData.name,
        cuisine: restaurantData.cuisine,
        link: restaurantData.link || null,
        // created_by: user.id // Optional: track who created it
      })
      .select('id')
      .single();

    if (createError) {
      console.error("Error creating restaurant:", createError);
      throw createError;
    }
    if (!newRestaurant) throw new Error("Failed to create restaurant and get ID.");
    restaurantId = newRestaurant.id;
  }

  // 2. Link the restaurant to the food fight in the junction table
  const { error: linkError } = await supabase
    .from('food_fight_restauraunt')
    .insert({
      food_fight_id: foodFightId,
      restaurant_id: restaurantId,
    });

  // Handle potential duplicate link error (e.g., unique constraint violation)
  if (linkError) {
    if (linkError.code === '23505') { // Postgres unique violation code
      console.warn(`Restaurant ${restaurantId} already nominated for food fight ${foodFightId}.`);
      // Optionally throw a more user-friendly error or just ignore
      throw new Error('Restaurant already nominated for this Food Fight.');
    } else {
      console.error("Error linking restaurant to food fight:", linkError);
      throw linkError; // Rethrow other errors
    }
  }

  console.log(`Restaurant ${restaurantId} linked to food fight ${foodFightId}`);
}

export async function startVoting(foodFightId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Check food fight status
  const { data: foodFight, error: foodFightError } = await supabase
    .from('food_fights')
    .select('status') // Only need status
    .eq('id', foodFightId)
    .single();

  if (foodFightError) throw foodFightError;
  if (!foodFight) throw new Error('Food Fight not found');
  if (foodFight.status !== 'nominating') throw new Error('Food Fight not in nomination phase');

  // Get count of restaurants linked to this food fight
  const { count, error: countError } = await supabase
    .from('food_fight_restauraunt')
    .select('*' , { count: 'exact', head: true }) // Select nothing, just get count
    .eq('food_fight_id', foodFightId);

  if (countError) throw countError;
  if (count === null || count < 2) throw new Error('Need at least 2 nominated restaurants to start voting');

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
  name: string;
  cuisine: string;
  link?: string | null;
  average_score: number;
  vote_count: number;
}

// Define and export the structure for the result of getFoodFight
export type GetFoodFightResult = {
  foodFight: {
    id: string;
    name: string;
    status: string;
    end_time: string;
    creator_id: string;
    created_at: string;
    winner: string | null;
  };
  restaurants: { id: string; name: string; cuisine: string; link?: string | null }[];
  winnerDetails: { id: string; name: string; cuisine: string; link?: string | null } | null;
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

  // Get restaurants associated with this food fight via the junction table
  const { data: fightRestaurantsData, error: restaurantsError } = await supabase
    .from('food_fight_restauraunt')
    .select(`
      restaurants ( id, name, cuisine, link )
    `)
    .eq('food_fight_id', foodFightId);

  if (restaurantsError) throw restaurantsError;
  
  // Correctly extract and type the restaurant details from the join
  const restaurantList: { id: string; name: string; cuisine: string; link?: string | null }[] = 
    fightRestaurantsData
      ?.map(item => item.restaurants) // Extract the 'restaurants' object/array
      .flat() // Flatten if 'restaurants' is an array (depends on relationship)
      .filter((restaurant): restaurant is NonNullable<typeof restaurant> => restaurant != null && typeof restaurant === 'object' && 'id' in restaurant) // Use a simpler type guard
      .map(restaurant => restaurant as { id: string; name: string; cuisine: string; link?: string | null }) // Assert type after filtering
    || [];

  // Find winner details
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
             if (!s || typeof s.restaurant_id !== 'string') return; 
            if (!restaurantScores[s.restaurant_id]) {
              restaurantScores[s.restaurant_id] = { totalScore: 0, voteCount: 0 };
            }
            restaurantScores[s.restaurant_id].totalScore += s.score;
            restaurantScores[s.restaurant_id].voteCount++;
          });
          
          // Correct the Map creation type
          const restaurantMap = new Map(restaurantList.map(r => [r.id, r]));

          aggregateScoresResult = Object.entries(restaurantScores).map(([id, data]) => {
            const restaurantDetails = restaurantMap.get(id);
            // Make sure restaurantDetails exist before accessing properties
            const name = restaurantDetails?.name ?? 'Unknown Restaurant';
            const cuisine = restaurantDetails?.cuisine ?? 'Unknown';
            const link = restaurantDetails?.link ?? null;
            
            return {
                restaurant_id: id,
                name: name, 
                cuisine: cuisine,
                link: link, 
                average_score: data.totalScore / data.voteCount,
                vote_count: data.voteCount
            }
          });
          
          aggregateScoresResult.sort((a, b) => b.average_score - a.average_score);
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
    winnerDetails: winnerDetails,
    userScores: userScoresResult,
    aggregateScores: aggregateScoresResult,
  };
}

export async function getAllRestaurants() {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, cuisine, link')
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching all restaurants:', error);
    return [];
  }
}

export async function removeRestaurantFromFoodFight(foodFightId: string, restaurantId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not logged in');

  // Delete the link from the junction table
  const { error } = await supabase
    .from('food_fight_restauraunt')
    .delete()
    .eq('food_fight_id', foodFightId)
    .eq('restaurant_id', restaurantId);

  if (error) {
    console.error("Error removing restaurant from food fight:", error);
    throw error;
  }

  console.log(`Restaurant ${restaurantId} removed from food fight ${foodFightId}`);
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