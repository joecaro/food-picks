"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateFoodFight } from "../../lib/hooks/useFoodFights";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const foodFightSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Food Fight name must be at least 3 characters" }),
});

type FoodFightFormValues = z.infer<typeof foodFightSchema>;

export default function CreateFoodFightForm() {
  const createFoodFightMutation = useCreateFoodFight();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FoodFightFormValues>({
    resolver: zodResolver(foodFightSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: FoodFightFormValues) => {
    setError(null);
    try {
      const foodFight = await createFoodFightMutation.mutateAsync(data.name);
      reset();
      router.push(`/food-fights/${foodFight.id}`);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to create Food Fight"
      );
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">Create Food Fight</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Food Fight</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="bg-background shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">
              Create a New Food Fight
            </h2>

            {(createFoodFightMutation.error || error) && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
                {error ||
                  (createFoodFightMutation.error instanceof Error
                    ? createFoodFightMutation.error.message
                    : "Failed to create Food Fight")}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Food Fight Name
                </label>
                <input
                  id="name"
                  type="text"
                  {...register("name")}
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Lunch Food Fight"
                  disabled={createFoodFightMutation.isPending}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={createFoodFightMutation.isPending}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
              >
                {createFoodFightMutation.isPending
                  ? "Creating..."
                  : "Create Food Fight"}
              </button>
            </form>
          </div>
        </DialogContent>
      </DialogContent>
    </Dialog>
  );
}
