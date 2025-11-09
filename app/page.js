import { prisma } from '@/lib/prisma';
import { addProduct, deleteProduct } from '@/app/actions';

// Import our new shadcn components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AddProductForm } from './components/AddProductForm';
import { DeleteProductButton } from './components/DeleteProductButton';

/**
 * This is the main page component.
 */
export default async function Home() {
  // 1. Fetch all products
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="max-w-3xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Stock Tracker Admin</h1>

      {/* This component will now hold our form */}
      <AddProductForm addProductAction={addProduct} />

      {/* This Card component will hold our product list */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Tracked Products</CardTitle>
          <CardDescription>
            {products.length} products currently being tracked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Store</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No products added yet.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="capitalize">{product.storeType}</TableCell>
                    <TableCell className="text-right">
                      {/* This component will hold our delete button */}
                      <DeleteProductButton
                        id={product.id}
                        deleteProductAction={deleteProduct}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}