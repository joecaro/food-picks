export const queryKeys = {
  // List of all food fights
  foodFights: () => ['foodFights'] as const,
  
  // Single food fight (details, restaurants, user scores, etc.)
  foodFight: (foodFightId: string) => ['foodFight', foodFightId] as const,
  
  // Restaurants for a specific food fight
  restaurants: (foodFightId: string) => ['restaurants', foodFightId] as const,

  // Average score for a specific restaurant within a food fight
  averageScore: (foodFightId: string, restaurantId?: string) => 
    ['averageScore', foodFightId, restaurantId].filter(Boolean),
}; 