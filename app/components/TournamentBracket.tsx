'use client';

import { useState, useEffect } from 'react';
import { useVote, useCheckRoundEnd } from '../../lib/hooks/useTournaments';
import { useAuth } from '@/app/auth-provider';
import VotingCard from './VotingCard';

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

interface TournamentBracketProps {
  tournamentId: string;
  currentRound: number;
  matchesByRound: Record<number, Match[]>;
  endTime: string; // ISO string date
}

export default function TournamentBracket({
  tournamentId,
  currentRound,
  matchesByRound,
  endTime,
}: TournamentBracketProps) {
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(
    Math.max(0, new Date(endTime).getTime() - Date.now())
  );
  const { user } = useAuth();
  const isAdmin = user?.email === 'joe@trysalient.com';
  
  const [currentVotingMatchIndex, setCurrentVotingMatchIndex] = useState<number>(0);

  const voteMutation = useVote(tournamentId);
  const checkRoundEndMutation = useCheckRoundEnd(tournamentId);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = Math.max(0, new Date(endTime).getTime() - Date.now());
      setTimeLeft(newTimeLeft);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [endTime]);

  const matchesInCurrentRound = matchesByRound[currentRound] || [];
  const matchesToVoteOn = matchesInCurrentRound.filter(match => !match.userVote && match.restaurant2);

  useEffect(() => {
    setCurrentVotingMatchIndex(0);
  }, [matchesInCurrentRound]);

  const handleAdvanceRound = async () => {
    console.log('Manually advancing round...');
    try {
      await checkRoundEndMutation.mutateAsync(true);
    } catch (err) {
      console.error('Failed to advance round:', err);
      setError('Failed to advance to next round. Please refresh.');
    }
  };

  const handleVote = async (matchId: string, restaurantId: string) => {
    setError(null);
    try {
      await voteMutation.mutateAsync({ matchId, restaurantId });
      
      setCurrentVotingMatchIndex(prevIndex => prevIndex + 1);

    } catch (err) {
      console.error("Vote mutation call itself failed (rare?):", err);
    }
  };

  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const currentMatch = matchesToVoteOn[currentVotingMatchIndex];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Round {currentRound}</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Time left: <span className="font-mono">{formatTimeLeft()}</span>
            </div>
            
            {isAdmin && (
              <button
                onClick={handleAdvanceRound}
                className="bg-purple-600 text-white py-1 px-3 rounded-md hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-sm"
              >
                Advance Round
              </button>
            )}
          </div>
        </div>
        
        {currentMatch ? (
          <VotingCard 
            key={currentMatch.id}
            match={currentMatch}
            onVote={handleVote}
            disabled={voteMutation.isPending}
          />
        ) : (
          <div className="text-center py-6">
            {matchesInCurrentRound.length > 0 ? (
               <p className="text-gray-600">Your votes for this round are submitted!</p>
            ) : (
               <p className="text-gray-500">Loading matches...</p>
            )}
             <p className="text-gray-500 mt-2">Waiting for the round to end.</p>
          </div>
        )}
      </div>
      
      {Object.keys(matchesByRound)
        .map(Number)
        .filter(round => round < currentRound)
        .sort((a, b) => b - a)
        .map(round => (
          <div key={round} className="bg-white p-4 rounded-lg shadow-sm opacity-70">
            <h2 className="text-lg font-medium mb-4">Round {round} (Completed)</h2>
            
            <div className="space-y-4">
              {matchesByRound[round]?.map((match) => (
                <div key={match.id} className="border rounded-lg p-4">
                  <div className="mb-2 text-sm text-gray-500">
                    Match {match.id.slice(-4)}
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div 
                      className={`flex-1 p-4 rounded-lg ${
                        (!match.restaurant2 || match.votes1 >= match.votes2) 
                          ? 'bg-green-50 border-2 border-green-200' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="font-medium">{match.restaurant1.name}</div>
                      <div className="text-sm text-gray-500">{match.restaurant1.cuisine}</div>
                      <div className="mt-2 text-sm text-gray-500">Votes: {match.votes1}</div>
                      
                      {(!match.restaurant2 || match.votes1 >= match.votes2) && (
                        <div className="mt-1 text-xs text-green-600 font-medium">
                          Winner
                        </div>
                      )}
                    </div>
                    
                    {match.restaurant2 && (
                      <div 
                        className={`flex-1 p-4 rounded-lg ${
                          match.votes2 > match.votes1 
                            ? 'bg-green-50 border-2 border-green-200' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="font-medium">{match.restaurant2.name}</div>
                        <div className="text-sm text-gray-500">{match.restaurant2.cuisine}</div>
                        <div className="mt-2 text-sm text-gray-500">Votes: {match.votes2}</div>
                        
                        {match.votes2 > match.votes1 && (
                          <div className="mt-1 text-xs text-green-600 font-medium">
                            Winner
                          </div>
                        )}
                      </div>
                    )}
                    {!match.restaurant2 && (
                      <div className="flex-1 p-4 rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                        <span className="text-gray-400">Bye (no opponent)</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
} 