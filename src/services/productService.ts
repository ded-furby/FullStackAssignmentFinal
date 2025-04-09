import { supabase, Product } from '../lib/supabase';

// Types for filtering products in the catalog
// TODO: Maybe add sorting options later?
type ProductFilter = {
  category?: string;      // Filter by product category
  minPrice?: number;      // Price range lower bound
  maxPrice?: number;      // Price range upper bound
  minRating?: number;     // Show only well-rated items
  searchQuery?: string;   // Search in name/description
};

// All the product-related database operations live here
// Note: We might want to split this into smaller services if it grows too big
export const productService = {
  // Add a new product to the catalog
  async createProduct(product: Omit<Product, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('products')
      .insert([{ 
        ...product, 
        created_at: new Date().toISOString() // Keep track of when products are added
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create product: ${error.message}`);
    return data;
  },

  // Fetch products with optional filtering
  // Returns newest products first - users usually want to see fresh stuff
  async getProducts(filters?: ProductFilter) {
    let query = supabase
      .from('products')
      .select('*');

    // Apply any filters the user has set
    if (filters) {
      // Filter by category if specified
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      // Handle price range filtering
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      // Only show products with good ratings if requested
      if (filters.minRating !== undefined) {
        query = query.gte('rating', filters.minRating);
      }
      // Search in both name and description - more chances to find what user wants
      if (filters.searchQuery) {
        query = query.or(
          `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
        );
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`Couldn't fetch products: ${error.message}`);
    return data;
  },

  // Update product details - keeping created_at and id untouchable
  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Couldn't update product ${id}: ${error.message}`);
    return data;
  },

  // Remove a product from the catalog
  // Warning: This is permanent! Maybe add a 'soft delete' later?
  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete product ${id}: ${error.message}`);
  },

  // Get a single product by its ID
  // Useful for product details page or quick lookups
  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Product ${id} not found: ${error.message}`);
    return data;
  },
};