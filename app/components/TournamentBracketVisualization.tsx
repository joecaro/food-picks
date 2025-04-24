'use client';

import React from 'react';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
}

interface Match {
  id: string;
  round: number;
  restaurant1: Restaurant;
  restaurant2: Restaurant | null;
  votes1: number;
  votes2: number;
  userVote?: string;
}

interface TournamentBracketVisualizationProps {
  matchesByRound: Record<number, Match[]>;
  tournamentName: string;
  winner: Restaurant;
}

export default function TournamentBracketVisualization({ matchesByRound, tournamentName, winner }: TournamentBracketVisualizationProps) {
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  
  // Calculate winner of each match
  const getWinnerOfMatch = (match: Match) => {
    if (!match.restaurant2) return match.restaurant1;
    return match.votes1 >= match.votes2 ? match.restaurant1 : match.restaurant2;
  };

  // Pre-calculate winners for all matches
  const matchWinners = new Map<string, Restaurant>();
  rounds.forEach(round => {
    matchesByRound[round].forEach(match => {
      matchWinners.set(match.id, getWinnerOfMatch(match));
    });
  });

  // Find matches in previous round that feed into a match
  const findChildMatches = (match: Match, round: number): Match[] => {
    if (round <= 1) return [];
    const prevRound = round - 1;
    if (!matchesByRound[prevRound]) return [];
    
    return matchesByRound[prevRound].filter(prevMatch => {
      const prevWinner = matchWinners.get(prevMatch.id);
      if (!prevWinner) return false;
      return match.restaurant1.id === prevWinner.id || match.restaurant2?.id === prevWinner.id;
    });
  };

  return (
    <div className="p-6 bg-gray-50 rounded-xl shadow-sm">
      <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">{tournamentName}</h2>
      
      <div className="overflow-x-auto">
        <div className="min-w-[900px] p-4">
          <div className="tournament-bracket">
            <div className="flex justify-center">
              <div className="flex gap-20 items-start">
                {rounds.map(round => (
                  <div 
                    key={round} 
                    className="flex flex-col relative" 
                    style={{ 
                      width: '220px',
                      gap: Math.pow(2, round-1) * 30 + 'px',
                    }}
                  >
                    {matchesByRound[round].map((match) => {
                      const winner = matchWinners.get(match.id);
                      const isWinner1 = winner?.id === match.restaurant1.id;
                      const isWinner2 = winner?.id === match.restaurant2?.id;
                      const childMatches = findChildMatches(match, round);
                      
                      return (
                        <div key={match.id} className="match-wrapper relative">
                          {/* Match box */}
                          <div className="match-box border rounded-lg overflow-hidden bg-white shadow-sm">
                            <div 
                              className={`px-4 py-3 ${isWinner1 ? 'bg-green-50' : ''}`}
                              style={{ borderBottom: '1px solid #e5e7eb' }}
                            >
                              <div className={`font-medium ${isWinner1 ? 'text-green-700' : 'text-gray-800'}`}>
                                {match.restaurant1.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{match.votes1} votes</div>
                            </div>
                            
                            {match.restaurant2 ? (
                              <div className={`px-4 py-3 ${isWinner2 ? 'bg-green-50' : ''}`}>
                                <div className={`font-medium ${isWinner2 ? 'text-green-700' : 'text-gray-800'}`}>
                                  {match.restaurant2.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{match.votes2} votes</div>
                              </div>
                            ) : (
                              <div className="px-4 py-3 text-gray-400 italic text-center">
                                Bye
                              </div>
                            )}
                          </div>
                          
                          {/* Connector lines */}
                          {round < rounds.length && (
                            <div className="connector-line absolute right-0 top-1/2 -mt-px">
                              <div className="h-px w-20 bg-gray-300" />
                            </div>
                          )}
                          
                          {/* Lines connecting to child matches */}
                          {childMatches.length > 0 && round > 1 && (
                            <div className="absolute left-0 top-1/2 w-20 -ml-20 -mt-px">
                              <div className="h-px w-20 bg-gray-300" />
                              
                              {childMatches.length === 2 && (
                                <>
                                  <div 
                                    className="absolute bg-gray-300 w-px" 
                                    style={{ 
                                      left: '0', 
                                      height: Math.pow(2, round-1) * 30 + 'px',
                                      top: '0px',
                                      transform: 'translateY(-50%)'
                                    }}
                                  />
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
                
                {/* Champion */}
                <div className="flex flex-col" style={{ width: '220px' }}>
                  <div className="flex items-center h-full pt-14">
                    <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50 text-center shadow-sm w-full">
                      <div className="text-xl font-bold text-green-700">{winner.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{winner.cuisine}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 