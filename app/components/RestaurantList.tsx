'use client';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
}

interface RestaurantListProps {
  restaurants: Restaurant[];
}

export default function RestaurantList({ restaurants }: RestaurantListProps) {
  if (restaurants.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-500">
        No restaurants have been nominated yet.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium mb-4">Nominated Restaurants ({restaurants.length})</h2>
      
      <div className="space-y-3">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
          >
            <div className="font-medium">{restaurant.name}</div>
            <div className="text-sm text-gray-500">{restaurant.cuisine}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 