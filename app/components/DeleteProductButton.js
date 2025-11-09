'use client'; // This is a Client Component

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function DeleteProductButton({ id, deleteProductAction }) {

  const handleClick = async () => {
    // Ask for confirmation
    if (window.confirm('Are you sure you want to delete this?')) {
      await deleteProductAction(id);
      toast.success('Product deleted.');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-500 hover:text-red-600"
      onClick={handleClick}
    >
      Delete
    </Button>
  );
}