'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import RestaurantSearchSelect from './RestaurantSearchSelect';
import { useNominateRestaurant } from '../../lib/hooks/useFoodFights';

const restaurantSchema = z.object({
  name: z.string().min(2, { message: 'Restaurant name must be at least 2 characters' }),
  cuisine: z.string().min(2, { message: 'Cuisine must be at least 2 characters' }),
});

type RestaurantFormValues = z.infer<typeof restaurantSchema>;

type Restaurant = {
  name: string;
  cuisine: string;
};

interface NominateRestaurantFormProps {
  restaurants: Restaurant[];
  foodFightId: string;
}

export default function NominateRestaurantForm({ 
  foodFightId,
  restaurants
}: NominateRestaurantFormProps) {
  const [error, setError] = useState<string | null>(null);
  const nominateMutation = useNominateRestaurant(foodFightId);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: '',
      cuisine: '',
    },
  });

  const handleSelectExistingRestaurant = (restaurant: { name: string; cuisine: string }) => {
    onSubmit({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
    });
  };

  const onSubmit = async (data: RestaurantFormValues) => {
    setError(null);
    
    try {
      await nominateMutation.mutateAsync({
        name: data.name,
        cuisine: data.cuisine,
      });
      reset();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to nominate restaurant');
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Nominate a Restaurant</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <RestaurantSearchSelect
          selectedRestaurants={restaurants}
          onSelect={handleSelectExistingRestaurant}
        />

        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Restaurant Name
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Restaurant name"
            disabled={nominateMutation.isPending}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-1">
            Cuisine
          </label>
          <input
            id="cuisine"
            type="text"
            {...register('cuisine')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Italian, Mexican, etc."
            disabled={nominateMutation.isPending}
          />
          {errors.cuisine && (
            <p className="mt-1 text-sm text-red-600">{errors.cuisine.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={nominateMutation.isPending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {nominateMutation.isPending ? 'Nominating...' : 'Nominate Restaurant'}
        </button>
      </form>
    </div>
  );
} 