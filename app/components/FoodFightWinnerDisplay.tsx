'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Assuming shadcn/ui Card components
import { Link as LinkIcon, Trophy } from 'lucide-react'; // Import LinkIcon and Trophy

// Update interface to include link
interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  link?: string | null; // Add optional link
}

interface FoodFightWinnerDisplayProps {
  winner: Restaurant | null | undefined; // Expect full Restaurant type
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
    <Card className="w-full max-w-md mx-auto border-primary border-2 shadow-lg bg-card">
      <CardHeader className="text-center pt-4">
        <div className="flex justify-center items-center mb-2 text-amber-500">
          <Trophy size={28} className="mr-2" />
          <span className="text-lg font-semibold">Food Fight Winner!</span>
          <Trophy size={28} className="ml-2" />
        </div>
        <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
          {winner.name}
          {/* Add Link Icon */}
          {winner.link && (
            <a 
              href={winner.link}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              aria-label={`View ${winner.name} on external site`}
              onClick={(e) => e.stopPropagation()} 
            >
              <LinkIcon size={18} />
            </a>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center pb-4">
        <p className="text-lg text-muted-foreground">Cuisine: {winner.cuisine}</p>
        {/* Add more details if needed */}
      </CardContent>
    </Card>
  );
} 