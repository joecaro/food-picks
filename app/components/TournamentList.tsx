'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { listTournaments } from '../../lib/api';

interface Tournament {
  id: string;
  name: string;
  status: 'nominating' | 'voting' | 'completed';
  current_round: number;
  winnerDetails?: {
    id: string;
    name: string;
    cuisine: string;
  } | null;
}

export default function TournamentList() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setIsLoading(true);
        const data = await listTournaments();
        setTournaments(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load tournaments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchTournaments, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <p className="text-center text-gray-500">Loading tournaments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-sm">
        {error}
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <p className="text-center text-gray-500">No tournaments found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium mb-4">Tournaments</h2>
      
      <div className="space-y-3">
        {tournaments.map((tournament) => (
          <Link
            href={`/tournaments/${tournament.id}`}
            key={tournament.id}
            className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{tournament.name}</div>
                <div className="text-sm text-gray-500">
                  {tournament.status === 'nominating' && 'Nomination Phase'}
                  {tournament.status === 'voting' && `Voting Round ${tournament.current_round}`}
                  {tournament.status === 'completed' && 'Completed'}
                </div>
              </div>
              <div>
                {tournament.status === 'completed' && tournament.winnerDetails && (
                  <div className="text-sm">
                    <span className="font-medium">Winner:</span>{' '}
                    <span className="text-green-600">{tournament.winnerDetails.name}</span>
                  </div>
                )}
                {tournament.status !== 'completed' && (
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tournament.status === 'nominating'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {tournament.status === 'nominating' ? 'Nominating' : 'Voting'}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 