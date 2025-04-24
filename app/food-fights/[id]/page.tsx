import React, { useEffect } from 'react';
import { useFoodFight } from '@/hooks/useFoodFight';
import { useCheckVotingEndMutation } from '@/hooks/useCheckVotingEndMutation';
import { useStartVotingMutation } from '@/hooks/useStartVotingMutation';
import { NominateRestaurantForm } from '@/components/NominateRestaurantForm';
import { RestaurantList } from '@/components/RestaurantList';
import { ScoreVotingForm } from '@/components/ScoreVotingForm';
import { FoodFightWinnerDisplay } from '@/components/FoodFightWinnerDisplay';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { Navbar } from '@/components/Navbar';

export default function FoodFightDetailPage() {
  const { data: foodFightData, isLoading, error: queryError } = useFoodFight(foodFightId);
  const checkVotingEndMutation = useCheckVotingEndMutation();
  const startVotingMutation = useStartVotingMutation();

  useEffect(() => {
    if (foodFightData?.foodFight?.status === 'voting') {
      const endTime = new Date(foodFightData.foodFight.end_time).getTime();
      if (Date.now() > endTime) {
        console.log('Voting end time passed, checking status...');
        checkVotingEndMutation.mutate(false);
      }
    }
  }, [foodFightData, checkVotingEndMutation]);

  const handleStartVoting = () => {
    // Implementation of handleStartVoting
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (queryError) {
    return <div>Error: {queryError.message}</div>;
  }

  const { foodFight, restaurants, winnerDetails, userScores, aggregateScores } = foodFightData;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {foodFight.name}
              </h1>
              <div className="text-gray-500">
                {foodFight.status === 'nominating' && 'Nomination Phase'}
                {foodFight.status === 'voting' && 'Voting Phase'}
                {foodFight.status === 'completed' && 'Food Fight Complete'}
              </div>
            </div>
            
            {foodFight.status === 'nominating' && (
              <button
                onClick={handleStartVoting}
                disabled={startVotingMutation.isPending || restaurants.length < 2}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {startVotingMutation.isPending ? 'Starting...' : 'Start Voting'}
              </button>
            )}
          </div>
        </div>
        
        {foodFight.status === 'nominating' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <NominateRestaurantForm 
                foodFightId={foodFightId}
              />
            </div>
            <div>
              <RestaurantList 
                restaurants={restaurants} 
                foodFightId={foodFightId}
              />
            </div>
          </div>
        )}
        
        {foodFight.status === 'voting' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Vote for Restaurants</h2>
            <p className="text-gray-600 mb-4">Voting ends at: {new Date(foodFight.end_time).toLocaleString()}</p>
            <ScoreVotingForm
                foodFightId={foodFightId}
                restaurants={restaurants}
                userScores={userScores}
                endTime={foodFight.end_time}
            />
          </div>
        )}
        
        {foodFight.status === 'completed' && (
          <div className="space-y-8">
              {winnerDetails && (
                <div>
                  <FoodFightWinnerDisplay winner={winnerDetails} />
                </div>
              )}
              {aggregateScores && aggregateScores.length > 0 && (
                 <div>
                     <ResultsDisplay results={aggregateScores} />
                 </div>
              )}
              {(!winnerDetails && (!aggregateScores || aggregateScores.length === 0)) &&
                  <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-500">
                     Food Fight completed, but no winner or scores found.
                  </div>
              }
          </div>
        )}
      </main>
    </div>
  );
} 