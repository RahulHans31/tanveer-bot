'use server'; // This is a Server Actions file!

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Parses a URL to find the store type and product ID.
 */
function getProductDetails(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('flipkart.com')) {
      const pid = parsedUrl.searchParams.get('pid');
      if (!pid) {
        throw new Error('Flipkart URL is missing a "pid" query parameter.');
      }
      // Extract product name from the path, make it readable
      const name = parsedUrl.pathname.split('/')[1].replace(/-/g, ' ').slice(0, 50) + '...';
      return {
        name: name,
        productId: pid,
        storeType: 'flipkart',
      };
    }

    if (parsedUrl.hostname.includes('croma.com')) {
      const pathParts = parsedUrl.pathname.split('/');
      const pid = pathParts[pathParts.length - 1];
      if (!pid || !/^\d+$/.test(pid)) {
        throw new Error('Could not find a valid product ID at the end of the Croma URL.');
      }
      // Extract product name from the path
      const name = pathParts[1].replace(/-/g, ' ').slice(0, 50) + '...';
      return {
        name: name,
        productId: pid,
        storeType: 'croma',
      };
    }

    throw new Error('Sorry, only Flipkart and Croma URLs are supported.');

  } catch (error) {
    console.error("URL Parsing Error:", error.message);
    return { error: error.message };
  }
}

/**
 * Server Action to add a product.
 */
export async function addProduct(formData) {
  const url = formData.get('url');
  if (!url) {
    return { error: 'URL is required.' };
  }

  const details = getProductDetails(url);
  if (details.error) {
    return { error: details.error };
  }

  try {
    await prisma.product.create({
      data: {
        name: details.name,
        url: url,
        productId: details.productId,
        storeType: details.storeType,
      },
    });

    revalidatePath('/'); // This tells Next.js to refresh the product list on the page
    return { success: `Added ${details.name}` };

  } catch (error) {
    console.error("Database Error:", error);
    return { error: 'Failed to add product to database. Is it a duplicate?' };
  }
}

/**
 * Server Action to delete a product.
 */
export async function deleteProduct(id) {
  if (!id) return;

  try {
    await prisma.product.delete({
      where: { id: id },
    });
    revalidatePath('/'); // Refresh the product list
  } catch (error) {
    console.error("Delete Error:", error);
    // Fail silently for now
  }
}