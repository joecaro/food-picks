'use client';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
}

interface TournamentWinnerProps {
  winner: Restaurant;
}

export default function TournamentWinner({ winner }: TournamentWinnerProps) {
  return (
    <div className="bg-background p-6 rounded-lg shadow-sm border border-green-200">
      <h2 className="text-xl font-medium text-center mb-2">Winner!</h2>
      
      <div className="flex justify-center">
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 text-center max-w-sm">
          <div className="text-2xl font-bold mb-2">{winner.name}</div>
          <div className="text-gray-600">{winner.cuisine}</div>
          
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 border border-green-300 rounded-full text-green-800">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Winner
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center text-gray-500">
        The tournament has concluded! Everyone should head to {winner.name} for lunch.
      </div>
    </div>
  );
} 