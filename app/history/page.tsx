'use client';

import Navbar from '@/app/components/Navbar';
import { useFoodFightsList } from '@/lib/hooks/useFoodFights';

interface FoodFight {
  id: string;
  name: string;
  status: 'nominating' | 'voting' | 'completed';
  created_at: string;
  winner: {
    id: string;
    name: string;
    cuisine: string;
  } | null;
}

export default function HistoryPage() {
  const { data: foodFights, isLoading, error } = useFoodFightsList();
  
  const completedFoodFights = foodFights?.filter(
    (foodFight: FoodFight) => foodFight.status === 'completed'
  ) || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-500">Loading tournament history...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            Failed to load tournament history. Please try again later.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Food Fight History</h1>
        
        {completedFoodFights.length === 0 ? (
          <div className="text-center text-gray-500">
            No completed Food Fights yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedFoodFights.map((foodFight: FoodFight) => (
              <div 
                key={foodFight.id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{foodFight.name}</h2>
                  <p className="text-sm text-gray-500">{formatDate(foodFight.created_at)}</p>
                </div>

                {foodFight.winner && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-2">Winner</div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="font-medium text-green-900">
                        {foodFight.winner.name}
                      </div>
                      <div className="text-sm text-green-700">
                        {foodFight.winner.cuisine}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 