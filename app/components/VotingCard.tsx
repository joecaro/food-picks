'use client';

import React from 'react';

interface Restaurant {
  id: string;
  name: string;
  cuisine?: string;
}

interface Match {
  id: string;
  restaurant1: Restaurant;
  restaurant2: Restaurant | null;
  votes1?: number; // Optional, may not be needed for display here
  votes2?: number; // Optional
  userVote?: string; // Optional, for potential pre-selection/disabled state if needed
}

interface VotingCardProps {
  match: Match;
  onVote: (matchId: string, restaurantId: string) => void;
  disabled?: boolean;
}

export default function VotingCard({ match, onVote, disabled = false }: VotingCardProps) {
  const { id: matchId, restaurant1, restaurant2 } = match;

  // Handle bye scenario
  if (!restaurant2) {
    // Optionally, display something or automatically advance
    // For now, we assume the logic filtering matches to vote on handles byes
    // If a bye card needs to be shown, this needs adjustment
    return null; 
  }

  const handleVoteClick = (restaurantId: string) => {
    if (!disabled) {
      onVote(matchId, restaurantId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md mx-auto my-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-center text-gray-500 mb-4">Vote Now!</h3>
      <div className="flex justify-around items-center gap-4">
        {/* Restaurant 1 Button */}
        <button
          onClick={() => handleVoteClick(restaurant1.id)}
          disabled={disabled}
          className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-4 px-4 rounded-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="block text-xl">{restaurant1.name}</span>
          {restaurant1.cuisine && (
            <span className="block text-sm text-blue-600 mt-1">({restaurant1.cuisine})</span>
          )}
        </button>

        <div className="text-gray-400 font-bold text-xl">VS</div>

        {/* Restaurant 2 Button */}
        <button
          onClick={() => handleVoteClick(restaurant2.id)}
          disabled={disabled}
          className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-4 px-4 rounded-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="block text-xl">{restaurant2.name}</span>
          {restaurant2.cuisine && (
            <span className="block text-sm text-green-600 mt-1">({restaurant2.cuisine})</span>
          )}
        </button>
      </div>
    </div>
  );
} 