'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import Navbar from '../../components/Navbar';
import NominateRestaurantForm from '../../components/NominateRestaurantForm';
import RestaurantList from '../../components/RestaurantList';
import TournamentBracket from '../../components/TournamentBracket';
import TournamentWinner from '../../components/TournamentWinner';
import { useAuth } from '../../auth-provider';
import { getTournament, startVoting } from '../../../lib/api';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
}

interface Tournament {
  id: string;
  name: string;
  status: 'nominating' | 'voting' | 'completed';
  current_round: number;
  end_time: number;
  winner: Restaurant | null;
}

interface Match {
  id: string;
  round: number;
  restaurant1: Restaurant;
  restaurant2: Restaurant | null;
  votes1: number;
  votes2: number;
  userVote?: string;
}

interface TournamentData {
  tournament: Tournament;
  restaurants: Restaurant[];
  winner: Restaurant | null;
  matchesByRound?: Record<number, Match[]>;
}

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  const unwrappedParams = React.use(params as unknown as Promise<{ id: string }>);
  const tournamentId = unwrappedParams.id;
  const { user, isLoading: authLoading } = useAuth();
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingVoting, setIsStartingVoting] = useState(false);

  const fetchTournament = async () => {
    try {
      setIsLoading(true);
      const data = await getTournament(tournamentId);
      setTournamentData(data as TournamentData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load tournament');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTournament();
    }
  }, [user, tournamentId]);

  const handleStartVoting = async () => {
    if (!tournamentData) return;
    
    try {
      setIsStartingVoting(true);
      await startVoting(tournamentId);
      fetchTournament();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to start voting');
    } finally {
      setIsStartingVoting(false);
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

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-sm">
            {error}
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
                disabled={isStartingVoting || restaurants.length < 2}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isStartingVoting ? 'Starting...' : 'Start Voting'}
              </button>
            )}
          </div>
        </div>
        
        {tournament.status === 'nominating' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <NominateRestaurantForm 
                tournamentId={tournamentId} 
                onSuccess={fetchTournament}
              />
            </div>
            <div>
              <RestaurantList restaurants={restaurants} />
            </div>
          </div>
        )}
        
        {tournament.status === 'voting' && matchesByRound && (
          <TournamentBracket
            tournamentId={tournamentId}
            currentRound={tournament.current_round}
            matchesByRound={matchesByRound}
            endTime={tournament.end_time.toString()}
            onRefresh={fetchTournament}
          />
        )}
        
        {tournament.status === 'completed' && winner && (
          <TournamentWinner winner={winner} />
        )}
      </main>
    </div>
  );
} 