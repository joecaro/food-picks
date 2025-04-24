'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming shadcn/ui Card components

// Define the structure of the Restaurant data actually passed as props (winnerDetails)
interface PartialRestaurant {
  id: string;
  name: string;
  cuisine: string;
}

interface FoodFightWinnerDisplayProps {
  winner: PartialRestaurant | null | undefined; // Expect the partial type
}

export function FoodFightWinnerDisplay({ winner }: FoodFightWinnerDisplayProps) {
  if (!winner) {
    return (
      <Card className="w-full max-w-md mx-auto bg-secondary text-secondary-foreground">
        <CardHeader>
          <CardTitle>Winner Not Yet Determined</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The winning restaurant will be displayed here once voting is complete and results are calculated.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border-primary border-2 shadow-lg">
      <CardHeader className="text-center">
        <CardDescription className="text-lg font-semibold text-primary">🏆 Food Fight Winner! 🏆</CardDescription>
        <CardTitle className="text-3xl font-bold">{winner.name}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-lg text-muted-foreground">Cuisine: {winner.cuisine}</p>
        {/* Add more details if needed */}
      </CardContent>
    </Card>
  );
} 