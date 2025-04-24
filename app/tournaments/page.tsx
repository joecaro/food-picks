'use client';

import { useState } from 'react';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth-provider';
import { useTournamentsList, useCreateTournament } from '../../lib/hooks/useTournaments';

export default function TournamentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: tournaments, isLoading, error } = useTournamentsList();
  const createTournament = useCreateTournament();
  const router = useRouter();

  const handleCreateTournament = async (name: string) => {
    try {
      const tournament = await createTournament.mutateAsync(name);
      setShowCreateForm(false);
      router.push(`/tournaments/${tournament.id}`);
    } catch (error) {
      console.error('Failed to create tournament', error);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Tournaments
          </h1>
          
          {user ? (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {showCreateForm ? 'Cancel' : 'Create Tournament'}
            </button>
          ) : (
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-500"
            >
              Login to create tournaments
            </Link>
          )}
        </div>
        
        {user && showCreateForm && (
          <div className="mb-8">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Create a New Tournament</h2>
              
              {createTournament.error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                  {createTournament.error instanceof Error 
                    ? createTournament.error.message 
                    : 'Failed to create tournament'}
                </div>
              )}
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                if (name) {
                  handleCreateTournament(name);
                }
              }}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Tournament Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Lunch tournament"
                    disabled={createTournament.isPending}
                    required
                    minLength={3}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={createTournament.isPending}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {createTournament.isPending ? 'Creating...' : 'Create Tournament'}
                </button>
              </form>
            </div>
          </div>
        )}
        
        {authLoading || isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">Loading...</p>
          </div>
        ) : !user ? (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-center text-gray-500">
              Please login to view and create tournaments.
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-sm">
            {error instanceof Error ? error.message : 'Failed to load tournaments'}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Tournaments</h2>
            
            {tournaments && tournaments.length > 0 ? (
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
                        {tournament.status === 'completed' && tournament.winner && (
                          <div className="text-sm">
                            <span className="font-medium">Winner:</span>{' '}
                            <span className="text-green-600">{tournament.winner.name}</span>
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
            ) : (
              <p className="text-center text-gray-500">No tournaments found. Create one to get started!</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 