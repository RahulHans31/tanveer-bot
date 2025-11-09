'use client'; // This is a Client Component

import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AddProductForm({ addProductAction }) {
  const formRef = useRef(null);

  async function formAction(formData) {
    // Reset the form
    formRef.current?.reset();

    // Call the server action
    const result = await addProductAction(formData);

    // Show a toast message
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Product added to tracker!");
    }
  }

  return (
    <form ref={formRef} action={formAction} className="flex w-full items-center space-x-2">
      <Input
        type="text"
        name="url"
        placeholder="Paste Flipkart or Croma URL"
        required
      />
      <Button type="submit">Add Product</Button>
    </form>
  );
}