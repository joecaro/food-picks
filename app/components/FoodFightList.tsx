'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFoodFightsList, useDeleteFoodFight } from '@/lib/hooks/useFoodFights';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryClient } from '@tanstack/react-query';

// Define the expected type for a list item
// Based on the SELECT query in listFoodFights API function
interface FoodFightListItem {
  id: string;
  name: string;
  status: 'nominating' | 'voting' | 'completed';
  created_at: string; // Assuming it's selected with *
  creator_id: string; // Assuming it's selected with *
  end_time: string;   // Assuming it's selected with *
  winner: { // This comes from the joined relation
    id: string;
    name: string;
    cuisine: string;
  } | null;
}

export default function FoodFightList() {
  const queryClient = useQueryClient();
  const { data: foodFights, isLoading, error } = useFoodFightsList();
  const deleteFoodFightMutation = useDeleteFoodFight();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [foodFightToDelete, setFoodFightToDelete] = useState<FoodFightListItem | null>(null);

  // Function to trigger deletion confirmation
  const handleDeleteClick = (foodFight: FoodFightListItem) => {
    setFoodFightToDelete(foodFight);
    setShowDeleteAlert(true);
  };

  // Function to confirm and execute deletion
  const confirmDelete = () => {
    if (foodFightToDelete) {
      deleteFoodFightMutation.mutate(foodFightToDelete.id);
    }
    setShowDeleteAlert(false); // Close dialog regardless of outcome (hook handles errors)
    setFoodFightToDelete(null);
  };

  useEffect(() => {
    const handleDBChange = (payload: unknown) => {
      console.log("Database change received!", payload);
      queryClient.invalidateQueries({ queryKey: queryKeys.foodFights() });
    };

    const channel = supabase.channel("food-fights");
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "food_fights" },
      handleDBChange
    );
  }, [foodFights, queryClient]);

  if (isLoading) {
    return (
      <div className="bg-background p-6 rounded-lg shadow-sm">
        <p className="text-center text-gray-500">Loading Food Fights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-lg shadow-sm">
        {error instanceof Error ? error.message : 'Failed to load Food Fights'}
      </div>
    );
  }

  if (!foodFights || foodFights.length === 0) {
    return (
      <div className="bg-background p-6 rounded-lg shadow-sm">
        <p className="text-center text-gray-500">No Food Fights found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background p-6 rounded-lg shadow-sm">
        <div className="space-y-3">
          {foodFights.map((foodFight: FoodFightListItem) => {
            let winnerText = null;
            if (foodFight.status === 'completed' && foodFight.winner) {
               winnerText = foodFight.winner.name || 'Unknown'; 
            }
            
            return (
              <ContextMenu key={foodFight.id}>
                <ContextMenuTrigger 
                   className="block border border-border rounded-lg p-4 hover:bg-border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                   asChild
                 >
                  <Link href={`/food-fights/${foodFight.id}`}> 
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{foodFight.name}</div>
                        <div className="text-sm text-gray-500">
                          {foodFight.status === 'nominating' && 'Nomination Phase'}
                          {foodFight.status === 'voting' && `Voting Phase`}
                          {foodFight.status === 'completed' && 'Completed'}
                        </div>
                      </div>
                      <div>
                        {winnerText && (
                          <div className="text-sm">
                            <span className="font-medium">Winner:</span>{' '}
                            <span className="text-green-600">{winnerText}</span>
                          </div>
                        )}
                        {foodFight.status !== 'completed' && (
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              foodFight.status === 'nominating'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {foodFight.status === 'nominating' ? 'Nominating' : 'Voting'}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-64">
                  <ContextMenuItem 
                    className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                    onSelect={(e: Event) => { 
                       e.preventDefault();
                       handleDeleteClick(foodFight);
                     }}
                    inset
                  >
                    <Trash2 size={14} className="mr-2"/> Delete Food Fight
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              Food Fight &quot;<span className="font-semibold">{foodFightToDelete?.name}</span>&quot; 
              and all associated restaurants and scores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFoodFightToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              disabled={deleteFoodFightMutation.isPending}
            >
              {deleteFoodFightMutation.isPending ? "Deleting..." : "Yes, delete it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 