'use client';

import { useState } from 'react';
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth-provider';
import { useFoodFightsList, useCreateFoodFight } from '../../lib/hooks/useFoodFights';

export default function FoodFightsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: foodFights, isLoading, error } = useFoodFightsList();
  const createFoodFight = useCreateFoodFight();
  const router = useRouter();

  const handleCreateFoodFight = async (name: string) => {
    try {
      const foodFight = await createFoodFight.mutateAsync(name);
      setShowCreateForm(false);
      router.push(`/tournaments/${foodFight.id}`);
    } catch (error) {
      console.error('Failed to create Food Fight', error);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Food Fights
          </h1>
          
          {user ? (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {showCreateForm ? 'Cancel' : 'Create Food Fight'}
            </button>
          ) : (
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-500"
            >
              Login to create Food Fights
            </Link>
          )}
        </div>
        
        {user && showCreateForm && (
          <div className="mb-8">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Create a New Food Fight</h2>
              
              {createFoodFight.error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                  {createFoodFight.error instanceof Error 
                    ? createFoodFight.error.message 
                    : 'Failed to create Food Fight'}
                </div>
              )}
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                if (name) {
                  handleCreateFoodFight(name);
                }
              }}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Food Fight Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Lunch Food Fight"
                    disabled={createFoodFight.isPending}
                    required
                    minLength={3}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={createFoodFight.isPending}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {createFoodFight.isPending ? 'Creating...' : 'Create Food Fight'}
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
              Please login to view and create Food Fights.
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-sm">
            {error instanceof Error ? error.message : 'Failed to load Food Fights'}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4">Food Fights</h2>
            
            {foodFights && foodFights.length > 0 ? (
              <div className="space-y-3">
                {foodFights.map((foodFight) => (
                  <Link
                    href={`/tournaments/${foodFight.id}`}
                    key={foodFight.id}
                    className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{foodFight.name}</div>
                        <div className="text-sm text-gray-500">
                          {foodFight.status === 'nominating' && 'Nomination Phase'}
                          {foodFight.status === 'voting' && `Voting Phase`}
                          {foodFight.status === 'completed' && 'Completed'}
                        </div>
                      </div>
                      <div>
                        {foodFight.status === 'completed' && foodFight.winner && (
                          <div className="text-sm">
                            <span className="font-medium">Winner:</span>{' '}
                            <span className="text-green-600">{foodFight.winner.name}</span>
                          </div>
                        )}
                        {foodFight.status !== 'completed' && (
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              foodFight.status === 'nominating'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {foodFight.status === 'nominating' ? 'Nominating' : 'Voting'}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No Food Fights found. Create one to get started!</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 