import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from 'recharts';

interface VoteData {
  date: string;
  [key: string]: string | number;
}

interface VoteHistoryGraphProps {
  foodFightIds: string[];
}

export function VoteHistoryGraph({ foodFightIds }: VoteHistoryGraphProps) {
  const [voteData, setVoteData] = useState<VoteData[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchVoteHistory() {
      try {
        // Get all restaurants for all food fights
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .from('restaurants')
          .select('id, name')

        if (restaurantsError) throw restaurantsError;
        if (!restaurantsData) throw new Error('No restaurants found');
        setRestaurants(restaurantsData);

        // Get all scores with their timestamps
        const { data: scoresData, error: scoresError } = await supabase
          .from('scores')
          .select('restaurant_id, score, created_at')
          .in('food_fight_id', foodFightIds)
          .order('created_at', { ascending: true });

        if (scoresError) throw scoresError;
        if (!scoresData) throw new Error('No scores found');

        console.log('scoresData', scoresData);
        console.log('restaurantsData', restaurantsData);

        // Process the data to get daily averages
        const dailyData: { [date: string]: { [restaurantId: string]: { total: number; count: number } } } = {};

        // Initialize all dates with all restaurants
        const allDates = new Set<string>();
        scoresData.forEach(score => {
          const date = new Date(score.created_at).toLocaleDateString();
          allDates.add(date);
        });

        // Initialize the data structure for all dates and restaurants
        allDates.forEach(date => {
          dailyData[date] = {};
          restaurantsData.forEach(restaurant => {
            dailyData[date][restaurant.id] = { total: 0, count: 0 };
          });
        });

        // Add scores to the data structure
        scoresData.forEach(score => {
          const date = new Date(score.created_at).toLocaleDateString();
          if (dailyData[date] && dailyData[date][score.restaurant_id]) {
            dailyData[date][score.restaurant_id].total += score.score;
            dailyData[date][score.restaurant_id].count += 1;
          }
        });

        // Convert to the format needed for Recharts
        console.log('dailyData', dailyData);
        const formattedData = Object.entries(dailyData).map(([date, restaurantScores]) => {
          const dataPoint: VoteData = { date };
          let hasScore = false;
          Object.entries(restaurantScores).forEach(([restaurantId, scores]) => {
            const restaurant = restaurantsData.find(r => r.id === restaurantId);
            if (restaurant && scores.count > 0) {
              dataPoint[restaurant.name] = Number((scores.total / scores.count).toFixed(1));
              hasScore = true;
            }
          });
          return hasScore ? dataPoint : null;
        }).filter(Boolean) as VoteData[];

        // Sort data points by date
        formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setVoteData(formattedData);
      } catch (error) {
        console.error('Error fetching vote history:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVoteHistory();
  }, [foodFightIds]);

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading vote history...</div>;
  }

  if (voteData.length === 0) {
    return <div className="text-center text-gray-500">No vote data available</div>;
  }

  const colors = [
    '#2563eb', // blue
    '#16a34a', // green
    '#dc2626', // red
    '#9333ea', // purple
    '#ea580c', // orange
    '#0891b2', // cyan
    '#be185d', // pink
    '#4f46e5', // indigo
    '#f97316', // orange
    '#0ea5e9', // blue
    '#84cc16', // green
    '#f43f5e', // red
    '#f59e0b', // yellow
    '#0ea5e9', // blue
    
  ];

  console.log(voteData);
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={voteData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 40,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-30} textAnchor="end">
            <Label value="Date" offset={-10} position="insideBottom" />
          </XAxis>
          <YAxis domain={[0, 5]} tickCount={6}>
            <Label value="Average Score" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
          </YAxis>
          <Tooltip />
          <Legend verticalAlign="top" height={56} wrapperStyle={{ paddingBottom: 10, fontSize: '14px' }} />
          {restaurants.map((restaurant, index) => (
            <Line
              key={restaurant.id}
              type="monotone"
              dataKey={restaurant.name}
              stroke={colors[index % colors.length]}
              activeDot={{ r: 8 }}
              strokeWidth={2}
            >
            </Line>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 