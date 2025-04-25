'use client';

import { useState } from 'react';
import { useDeleteRestaurant } from '@/lib/hooks/useFoodFights';
import { useAuth } from '@/app/auth-provider';
import { Trash2, Link as LinkIcon } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  link?: string | null;
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
      <div className="bg-card p-6 rounded-lg shadow-sm text-center text-muted-foreground border border-border">
        No restaurants have been nominated yet.
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <h2 className="text-lg font-medium mb-4">Nominated Restaurants ({restaurants.length})</h2>
      
      <div className="space-y-3">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="border border-border rounded-lg p-4 hover:bg-accent flex justify-between items-center transition-colors"
          >
            <div className="flex items-center gap-3">
              {restaurant.link && (
                <a 
                  href={restaurant.link}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary shrink-0"
                  aria-label={`View ${restaurant.name} on external site`}
                >
                  <LinkIcon size={16} />
                </a>
              )}
              <div>
                <div className="font-medium text-foreground">{restaurant.name}</div>
                <div className="text-sm text-muted-foreground">{restaurant.cuisine}</div>
              </div>
            </div>
            
            {isAdmin && (
              <button
                onClick={() => handleDelete(restaurant.id)}
                disabled={deleteRestaurantMutation.isPending}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive focus:outline-none rounded-full hover:bg-destructive/10 transition-colors"
                aria-label="Remove restaurant"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 