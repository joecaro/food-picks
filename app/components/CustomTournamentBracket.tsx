'use client';

import React, { useMemo } from 'react';

// Define the expected structure for matches and restaurants
interface Restaurant {
  id: string;
  name: string;
  cuisine?: string;
}

interface Match {
  id: string;
  round: number;
  restaurant1: Restaurant;
  restaurant2: Restaurant | null;
  votes1: number;
  votes2: number;
  userVote?: string; // Include if needed for styling later
  created_at?: string; // Include if needed for sorting/display
  // Add calculated properties for convenience
  x?: number;
  y?: number;
  winnerId?: string | null;
  nextMatchId?: string | null;
  // Link back to previous matches (for layout)
  parentMatch1Id?: string | null;
  parentMatch2Id?: string | null;
}

interface MatchesByRound {
  [round: number]: Match[];
}

interface CustomTournamentBracketProps {
  matchesByRound: MatchesByRound;
}

// --- Layout Constants --- 
const MATCH_WIDTH = 192;
const MATCH_HEIGHT = 72;
const ROUND_SPACING_X = 80; // Increased horizontal gap
const VERTICAL_SPACING_ROUND1 = 24; // Vertical gap between matches in round 1
const HEADER_HEIGHT = 40;
const CONTAINER_PADDING_TOP = 20;
const CONTAINER_PADDING_LEFT = 20;

// --- Position Calculation Logic (Removed - now inside useMemo) --- 
// function calculateMatchY(...) { ... }
// function calculateRoundX(...) { ... }

// --- Component --- 
export default function CustomTournamentBracket({ matchesByRound: initialMatchesByRound }: CustomTournamentBracketProps) {
  
  // Memoize processed matches with positions and next match links
  const { allMatchesList, finalHeight, finalWidth } = useMemo(() => {
    const rounds = Object.keys(initialMatchesByRound).map(Number).sort((a, b) => a - b);
    if (!rounds.length) return { allMatchesList: [], finalHeight: 0, finalWidth: 0 };

    const processedMatches: Match[] = [];
    const matchMap = new Map<string, Match>(); // For quick lookups

    let currentY = CONTAINER_PADDING_TOP + HEADER_HEIGHT; // Starting Y for the first round
    let maxWidth = 0;
    let maxHeight = 0;

    // Round 1: Calculate initial positions and find winners/next matches
    const round1Matches = initialMatchesByRound[1] || [];
    round1Matches.forEach((match, index) => {
      const x = CONTAINER_PADDING_LEFT;
      const y = currentY + index * (MATCH_HEIGHT + VERTICAL_SPACING_ROUND1);
      const winnerId = (!match.restaurant2 || (match.restaurant2 && match.votes1 >= match.votes2))
                       ? match.restaurant1?.id
                       : (match.restaurant2 && match.votes1 < match.votes2) ? match.restaurant2?.id : null;

      const processedMatch: Match = {
        ...match,
        x,
        y,
        winnerId,
        nextMatchId: null // Will be calculated by looking ahead
      };
      processedMatches.push(processedMatch);
      matchMap.set(match.id, processedMatch);
      // Don't update currentY based on index here, calculate absolute position
      maxWidth = Math.max(maxWidth, x + MATCH_WIDTH);
      maxHeight = Math.max(maxHeight, y + MATCH_HEIGHT);
    });
     currentY = maxHeight; // Set base Y for next round calculations if needed, though not directly used in midpoint calc

     // Subsequent Rounds: Calculate position based on parent matches
    for (let roundIndex = 1; roundIndex < rounds.length; roundIndex++) {
        const currentRoundNum = rounds[roundIndex];
        const prevRoundNum = rounds[roundIndex - 1];
        const matchesInCurrentRound = initialMatchesByRound[currentRoundNum] || [];
        const matchesInPrevRound = processedMatches.filter(m => m.round === prevRoundNum); // Get already processed previous round matches

        matchesInCurrentRound.forEach((match) => {
             // Find the two matches from the previous round feeding into this one
            const parentMatches = matchesInPrevRound.filter(prevMatch => {
                // Find next match ID for prevMatch (look ahead in initial data)
                let tempNextMatchId: string | null = null;
                if (prevMatch.winnerId && prevMatch.round < rounds.length) {
                     const nextRoundData = initialMatchesByRound[prevMatch.round + 1];
                     if(nextRoundData){
                        const nextMatch = nextRoundData.find(nrMatch => nrMatch.restaurant1?.id === prevMatch.winnerId || nrMatch.restaurant2?.id === prevMatch.winnerId);
                        if(nextMatch) tempNextMatchId = nextMatch.id;
                     }
                }
                // Now assign it back to the processed match object if not already set
                const processedPrevMatch = matchMap.get(prevMatch.id);
                if(processedPrevMatch && !processedPrevMatch.nextMatchId) {
                    processedPrevMatch.nextMatchId = tempNextMatchId;
                }

                // Check if the processed prev match links to the current match
                return processedPrevMatch?.nextMatchId === match.id;
            });

            let calculatedY: number;
            let parent1Id: string | null = null;
            let parent2Id: string | null = null;

            // Ensure parent matches have their positions calculated
            const parent1 = parentMatches[0] ? matchMap.get(parentMatches[0].id) : undefined;
            const parent2 = parentMatches[1] ? matchMap.get(parentMatches[1].id) : undefined;

            if (parent1 && parent2 && parent1.y !== undefined && parent2.y !== undefined) {
                // Position centered between the two parent matches
                calculatedY = (parent1.y + parent2.y) / 2;
                parent1Id = parent1.id;
                parent2Id = parent2.id;
            } else if (parent1 && parent1.y !== undefined) {
                // Position aligned with the single parent match (handles byes in previous round)
                calculatedY = parent1.y;
                 parent1Id = parent1.id;
            } else {
                // Fallback position
                 console.warn(`Could not determine position for match ${match.id} based on parents:`, parentMatches);
                 calculatedY = currentY; // Use last known Y as a rough fallback
                 currentY += MATCH_HEIGHT + VERTICAL_SPACING_ROUND1; // Increment fallback Y
            }

            const x = CONTAINER_PADDING_LEFT + roundIndex * (MATCH_WIDTH + ROUND_SPACING_X);
            const winnerId = (!match.restaurant2 || (match.restaurant2 && match.votes1 >= match.votes2))
                             ? match.restaurant1?.id
                             : (match.restaurant2 && match.votes1 < match.votes2) ? match.restaurant2?.id : null;

            const processedMatch: Match = {
                 ...match,
                 x,
                 y: calculatedY,
                 winnerId,
                 parentMatch1Id: parent1Id,
                 parentMatch2Id: parent2Id,
                 nextMatchId: null // Next match calculated in the *next* iteration or final pass
            };
            // Add/update in map and list
            if (!matchMap.has(match.id)) {
                 processedMatches.push(processedMatch);
            }
            matchMap.set(match.id, processedMatch);
            maxWidth = Math.max(maxWidth, x + MATCH_WIDTH);
            maxHeight = Math.max(maxHeight, calculatedY + MATCH_HEIGHT);
        });
        currentY = maxHeight; // Update base Y for fallback calculation
    }

    // Final pass to ensure all nextMatchIds are set on the processed items in the map
     processedMatches.forEach(pm => {
         const matchFromMap = matchMap.get(pm.id); // Get the potentially updated match from the map
         if (!matchFromMap) return;

         if(matchFromMap.nextMatchId === null && matchFromMap.winnerId && matchFromMap.round < rounds.length) {
             const nextRoundData = initialMatchesByRound[matchFromMap.round + 1];
             if(nextRoundData){
                 const nextMatch = nextRoundData.find(nrMatch => nrMatch.restaurant1?.id === matchFromMap.winnerId || nrMatch.restaurant2?.id === matchFromMap.winnerId);
                 if(nextMatch) matchFromMap.nextMatchId = nextMatch.id;
             }
         }
     });

    // Get final list from map values to ensure all updates are included
    const finalList = Array.from(matchMap.values());

    return { allMatchesList: finalList, finalHeight: maxHeight + CONTAINER_PADDING_TOP, finalWidth: maxWidth + CONTAINER_PADDING_LEFT };

  }, [initialMatchesByRound]);

  // Convert map back to list for rendering if needed, or use allMatchesList directly
  const allMatchesMap = useMemo(() => new Map(allMatchesList.map(m => [m.id, m])), [allMatchesList]);

  if (!allMatchesList.length) {
    return <p className="text-center text-gray-500">No matches to display.</p>;
  }
  
  return (
    <div 
      className="relative p-4 bg-gray-50 rounded overflow-auto" // Keep padding for overall spacing
      style={{ height: `${finalHeight}px`, width: `${finalWidth}px` }}
    >
      {/* SVG Layer for Connectors (Positioned behind matches) */}
      <svg 
         className="absolute top-0 left-0 w-full h-full z-0"
         width={finalWidth} // Use estimated size for SVG canvas
         height={finalHeight}
         style={{ pointerEvents: 'none' }} // Allow clicks to pass through to matches
       >
        <defs>
          {/* Optional: Define marker for arrowheads if desired */}
        </defs>
        <g stroke="#9CA3AF" strokeWidth="1.5" fill="none"> {/* Default line style */}
          {allMatchesList.map(match => {
            if (!match.nextMatchId) return null; // No line from final match

            const nextMatch = allMatchesMap.get(match.nextMatchId);
            if (!nextMatch || typeof match.x === 'undefined' || typeof match.y === 'undefined' || typeof nextMatch.x === 'undefined' || typeof nextMatch.y === 'undefined') return null;
            
            // Calculate points for the connector line
            const startX = match.x + MATCH_WIDTH;
            const startY = match.y + MATCH_HEIGHT / 2;
            const endX = nextMatch.x;
            const endY = nextMatch.y + MATCH_HEIGHT / 2;
            const midX = startX + (endX - startX) / 2;

            // Create polyline points: Start -> Mid-Horizontal -> Mid-Vertical -> End
            const points = `${startX},${startY} ${midX},${startY} ${midX},${endY} ${endX},${endY}`;
            
            // Highlight if winner is defined (optional)
            const strokeColor = match.winnerId ? '#10B981' : '#9CA3AF'; 

            return (
              <polyline 
                key={`${match.id}-to-${nextMatch.id}`}
                points={points}
                stroke={strokeColor}
              />
            );
          })}
        </g>
      </svg>

      {/* Match Rendering Layer (Positioned above SVG) */}
      <div className="relative z-10">
        {/* Calculate unique rounds from the processed matches */}
        {[...new Set(allMatchesList.map(m => m.round))].sort((a,b) => a - b).map((round, roundIndex) => {
          const matchesInThisRound = allMatchesList.filter(m => m.round === round);
          if (!matchesInThisRound.length) return null;

          let roundName = `Round ${round}`;
          // Use roundIndex based on the *actual* rounds present
          const uniqueRounds = [...new Set(allMatchesList.map(m => m.round))];
          const totalRoundsPresent = uniqueRounds.length;
          if (roundIndex === totalRoundsPresent - 1) roundName = 'Final';
          else if (roundIndex === totalRoundsPresent - 2) roundName = 'Semi-final';

          // Use the calculated X from the first match for the header
          const headerX = matchesInThisRound[0].x;
          if (headerX === undefined) return null; // Don't render header if X is missing

          return (
            <React.Fragment key={`round-fragment-${round}`}>
              {/* Round Header - Positioned absolutely with top offset */}
              <h3 
                className="absolute text-lg font-semibold p-2 bg-gray-800 text-white rounded w-48 text-center"
                style={{ top: `${CONTAINER_PADDING_TOP}px`, left: `${headerX}px`, height: `${HEADER_HEIGHT}px` }}
              >
                {roundName}
              </h3>

              {/* Matches in this round */}
              {matchesInThisRound.map((match) => {
                if (typeof match.x === 'undefined' || typeof match.y === 'undefined') return null;
                
                const isWinner1 = !match.restaurant2 || (match.restaurant2 && match.votes1 >= match.votes2);
                const isWinner2 = match.restaurant2 && match.votes1 < match.votes2;

                return (
                  <div 
                    key={match.id} 
                    className="absolute border border-gray-300 rounded-md bg-white shadow text-sm flex flex-col"
                    style={{ 
                      top: `${match.y}px`, 
                      left: `${match.x}px`, 
                      height: `${MATCH_HEIGHT}px`, 
                      width: `${MATCH_WIDTH}px` 
                    }}
                  >
                    {/* Participant 1 */}
                    <div 
                      className={`flex-1 p-2 flex flex-col justify-center ${isWinner1 ? 'bg-green-50 font-semibold' : 'bg-gray-100'}`}
                    >
                      {/* Apply truncate only to name */}
                      <div className="truncate" title={match.restaurant1?.name}>{match.restaurant1?.name || 'TBD'}</div> 
                      {match.restaurant1 && (
                        <div className="text-xs text-gray-500 mt-0.5">{match.votes1} votes</div>
                      )}
                    </div>
                    
                    <div className="h-px bg-gray-300"></div>

                    {/* Participant 2 or Bye */}
                    <div 
                      className={`flex-1 p-2 flex flex-col justify-center ${isWinner2 ? 'bg-green-50 font-semibold' : 'bg-gray-100'}`}
                    >
                      {match.restaurant2 ? (
                        <>
                          <div className="truncate" title={match.restaurant2.name}>{match.restaurant2.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{match.votes2} votes</div>
                        </>
                      ) : (
                        <div className="text-gray-400 text-xs italic text-center py-1">Bye</div> 
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
       </div>
    </div>
  );
} 