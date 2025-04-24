'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { listFoodFights } from '../../lib/api';

interface FoodFight {
  id: string;
  name: string;
  status: 'nominating' | 'voting' | 'completed';
  winner?: {
    id: string;
    name: string;
    cuisine: string;
  } | null;
}

export default function FoodFightList() {
  const [foodFights, setFoodFights] = useState<FoodFight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFoodFights = async () => {
      try {
        setIsLoading(true);
        const data = await listFoodFights();
        setFoodFights(data as FoodFight[]);
      } catch (err) {
        console.error(err);
        setError('Failed to load Food Fights');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoodFights();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchFoodFights, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <p className="text-center text-gray-500">Loading Food Fights...</p>
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

  if (foodFights.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <p className="text-center text-gray-500">No Food Fights found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium mb-4">Food Fights</h2>
      
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
    </div>
  );
} 