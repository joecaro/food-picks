'use client';

import { useState } from 'react';
import { useDeleteRestaurant } from '@/lib/hooks/useFoodFights';
import { useAuth } from '@/app/auth-provider';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
}

interface RestaurantListProps {
  restaurants: Restaurant[];
  foodFightId: string;
}

export default function RestaurantList({ restaurants, foodFightId }: RestaurantListProps) {
  const [error, setError] = useState<string | null>(null);
  const deleteRestaurantMutation = useDeleteRestaurant(foodFightId);
  const { user } = useAuth();
  const isAdmin = user?.email === 'joe@trysalient.com';
  
  const handleDelete = async (restaurantId: string) => {
    setError(null);
    try {
      await deleteRestaurantMutation.mutateAsync(restaurantId);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to remove restaurant');
    }
  };

  if (restaurants.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-500">
        No restaurants have been nominated yet.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <h2 className="text-lg font-medium mb-4">Nominated Restaurants ({restaurants.length})</h2>
      
      <div className="space-y-3">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{restaurant.name}</div>
              <div className="text-sm text-gray-500">{restaurant.cuisine}</div>
            </div>
            
            {isAdmin && (
              <button
                onClick={() => handleDelete(restaurant.id)}
                disabled={deleteRestaurantMutation.isPending}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 focus:outline-none"
                aria-label="Remove restaurant"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 