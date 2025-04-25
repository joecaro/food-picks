'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import RestaurantSearchSelect from './RestaurantSearchSelect';
import { useNominateRestaurant } from '../../lib/hooks/useFoodFights';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Restaurant } from '@/lib/types';

const restaurantSchema = z.object({
  name: z.string().min(2, { message: 'Restaurant name must be at least 2 characters' }),
  cuisine: z.string().min(2, { message: 'Cuisine must be at least 2 characters' }),
  link: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
});

type RestaurantFormValues = z.infer<typeof restaurantSchema>;

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
      link: '',
    },
  });

  const handleSelectExistingRestaurant = (restaurant: Restaurant) => {
    onSubmit({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      link: restaurant.link || '',
    });
  };

  const onSubmit = async (data: RestaurantFormValues) => {
    setError(null);
    
    try {
      const payload = {
        name: data.name,
        cuisine: data.cuisine,
        link: data.link || null,
      };
      await nominateMutation.mutateAsync(payload);
      reset();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to nominate restaurant');
    }
  };

  return (
    <div className="bg-card shadow-sm rounded-lg p-6 border border-border">
      <h2 className="text-lg font-medium mb-4">Nominate a Restaurant</h2>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <RestaurantSearchSelect
          restaurants={restaurants}
          onSelect={handleSelectExistingRestaurant}
        />

        <div>
          <Label htmlFor="name">Restaurant Name</Label>
          <Input
            id="name"
            type="text"
            {...register('name')}
            placeholder="Restaurant name"
            disabled={nominateMutation.isPending}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="cuisine">Cuisine</Label>
          <Input
            id="cuisine"
            type="text"
            {...register('cuisine')}
            placeholder="Italian, Mexican, etc."
            disabled={nominateMutation.isPending}
            aria-invalid={errors.cuisine ? "true" : "false"}
          />
          {errors.cuisine && (
            <p className="mt-1 text-sm text-destructive">{errors.cuisine.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="link">Link (Optional)</Label>
          <Input
            id="link"
            type="url"
            {...register('link')}
            placeholder="https://www.doordash.com/..."
            disabled={nominateMutation.isPending}
            aria-invalid={errors.link ? "true" : "false"}
          />
          {errors.link && (
            <p className="mt-1 text-sm text-destructive">{errors.link.message}</p>
          )}
        </div>
        
        <Button
          type="submit"
          disabled={nominateMutation.isPending}
          className="w-full"
        >
          {nominateMutation.isPending ? 'Nominating...' : 'Nominate Restaurant'}
        </Button>
      </form>
    </div>
  );
} 