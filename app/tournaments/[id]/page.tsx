'use client';

import { useState } from 'react';
import * as React from 'react';
import Navbar from '../../components/Navbar';
import NominateRestaurantForm from '../../components/NominateRestaurantForm';
import RestaurantList from '../../components/RestaurantList';
import TournamentBracket from '../../components/TournamentBracket';
import TournamentBracketVisualization from '../../components/TournamentBracketVisualization';
import { useAuth } from '../../auth-provider';
import { useTournament, useStartVoting } from '../../../lib/hooks/useTournaments';

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function TournamentDetailPage({ params }: Props) {
  const unwrappedParams = React.use(params);
  const tournamentId = unwrappedParams.id;
  const { user, isLoading: authLoading } = useAuth();
  const { data: tournamentData, isLoading, error: queryError } = useTournament(tournamentId);
  const [error, setError] = useState<string | null>(null);
  const startVotingMutation = useStartVoting(tournamentId);

  const handleStartVoting = async () => {
    try {
      await startVotingMutation.mutateAsync();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to start voting');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">Loading tournament...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">
              Please login to view tournaments.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (queryError || error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-sm">
            {error || (queryError instanceof Error ? queryError.message : 'Failed to load tournament')}
          </div>
        </main>
      </div>
    );
  }

  if (!tournamentData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">Tournament not found.</p>
          </div>
        </main>
      </div>
    );
  }

  const { tournament, restaurants, matchesByRound, winner } = tournamentData;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {tournament.name}
              </h1>
              <div className="text-gray-500">
                {tournament.status === 'nominating' && 'Nomination Phase'}
                {tournament.status === 'voting' && `Voting Round ${tournament.current_round}`}
                {tournament.status === 'completed' && 'Tournament Complete'}
              </div>
            </div>
            
            {tournament.status === 'nominating' && (
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
        
        {tournament.status === 'nominating' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <NominateRestaurantForm 
                tournamentId={tournamentId}
              />
            </div>
            <div>
              <RestaurantList 
                restaurants={restaurants} 
                tournamentId={tournamentId}
              />
            </div>
          </div>
        )}
        
        {tournament.status === 'voting' && matchesByRound && (
          <TournamentBracket
            tournamentId={tournamentId}
            currentRound={tournament.current_round}
            matchesByRound={matchesByRound}
            endTime={tournament.end_time.toString()}
          />
        )}
        
        {tournament.status === 'completed' && winner && matchesByRound && (
          <TournamentBracketVisualization
            tournamentName={tournament.name}
            matchesByRound={matchesByRound}
            winner={winner}
          />
        )}
      </main>
    </div>
  );
} 