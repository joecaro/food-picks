'use client';

import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { queryKeys } from '@/lib/queryKeys';

interface AverageScoreDisplayProps {
  foodFightId: string;
  restaurantId: string;
}

// Helper to format the score (kept for tooltip)
function formatScore(score: number | null): string {
    if (score === null || isNaN(score)) return "N/A";
    return score.toFixed(1);
}

// Helper to determine background color based on score
function getScoreBgColor(score: number | null): string {
    if (score === null || isNaN(score)) return "bg-gray-300"; // Empty bar color
    if (score >= 4.5) return "bg-green-600";
    if (score >= 4.0) return "bg-green-500";
    if (score >= 3.0) return "bg-yellow-500"; // Adjusted yellow
    if (score >= 2.0) return "bg-orange-500";
    return "bg-red-600";
}

// Async function to fetch and calculate the average score
async function fetchAverageScore(foodFightId: string, restaurantId: string): Promise<{ averageScore: number | null, voteCount: number }> {
    const { data: scores, error: scoresError } = await supabase
        .from('scores')
        .select('score')
        .eq('food_fight_id', foodFightId)
        .eq('restaurant_id', restaurantId);

    if (scoresError) {
        console.error('Error fetching average score:', scoresError);
        throw new Error('Failed to fetch score data.'); // Let useQuery handle error state
    }

    if (scores && scores.length > 0) {
        const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
        return {
            averageScore: totalScore / scores.length,
            voteCount: scores.length
        };
    } else {
        return {
            averageScore: null, // No scores yet
            voteCount: 0
        };
    }
}

export function AverageScoreDisplay({ foodFightId, restaurantId }: AverageScoreDisplayProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: queryKeys.averageScore(foodFightId, restaurantId),
        queryFn: () => fetchAverageScore(foodFightId, restaurantId),
        enabled: !!foodFightId && !!restaurantId,
        staleTime: 10000,
    });

    const averageScore = data?.averageScore ?? null;
    const voteCount = data?.voteCount ?? 0;
    const scoreDisplay = formatScore(averageScore);
    const scoreBgColor = getScoreBgColor(averageScore);
    const scoreHeightPercentage = averageScore !== null ? (averageScore / 5) * 100 : 0;

    // Display Loading or Error state slightly differently with the progress bar structure
    let barContent;
    if (isLoading) {
        barContent = (
            <div className="absolute inset-0 flex items-center justify-center">
                 <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></div>
            </div>
        );
    } else if (error) {
         barContent = (
            <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold text-xs">!</div>
        );
    } else {
        barContent = (
             <div
                className={`absolute bottom-0 left-0 w-full rounded-full transition-all duration-500 ease-in-out ${scoreBgColor}`}
                style={{ height: `${scoreHeightPercentage}%` }}
            />
        );
    }

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                     {/* Vertical Progress Bar Container */}
                     <div className="relative w-5 h-16 bg-muted rounded-full overflow-hidden cursor-default mx-auto">
                        {barContent}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                    {error ? (
                         <p className="text-red-500">Error: {error.message}</p>
                    ) : isLoading ? (
                        <p>Loading score...</p>
                    ) : (
                        <p>
                           Avg: {scoreDisplay} ({voteCount} vote{voteCount !== 1 ? 's' : ''})
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/*
Potential Integration into ScoreVotingForm.tsx:

Inside the restaurants.map(...) loop:

<div key={restaurant.id} ...>
    <h3 ...>{restaurant.name}</h3>
    <p ...>{restaurant.cuisine}</p>
    
    <div className="my-2">
        <AverageScoreDisplay 
            foodFightId={foodFightId} 
            restaurantId={restaurant.id} 
        />
    </div>

    <div className="flex space-x-2 ..."> 
        // ... emoji buttons ...
    </div>
    
    {scores[restaurant.id] && (...)} 
    {error && (...)} 
</div>

*/ 