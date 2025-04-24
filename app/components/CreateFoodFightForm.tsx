import { useRouter } from 'next/router';
import { useMutation } from 'react-query';
import { useState } from 'react';

const CreateFoodFightForm: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const createFoodFightMutation = useMutation(async (name: string) => {
    // Implementation of the mutation
  });

  const onSubmit = async (data: FoodFightFormValues) => {
    setError(null);
    try {
      const foodFight = await createFoodFightMutation.mutateAsync(data.name);
      reset();
      router.push(`/food-fights/${foodFight.id}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to create Food Fight');
    }
  };

  return (
    <div>
      {/* Render your form here */}
    </div>
  );
};

export default CreateFoodFightForm; 