import { useState, useEffect, useCallback } from 'react';
import { Product } from '../../lib/supabase';
import { productService } from '../../services/productService';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ProductForm } from './ProductForm';

// Define available product categories for better maintainability
const PRODUCT_CATEGORIES = [
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Books', label: 'Books' },
  { value: 'Home', label: 'Home' }
];

type ProductFilter = {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  searchQuery?: string;
};

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilter>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch products with current filters and handle loading states
  const refreshProductList = useCallback(async () => {
    try {
      setLoading(true);
      const productList = await productService.getProducts(filters);
      setProducts(productList);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to fetch products. Please try again.';
      setError(errorMessage);
      console.error('Product fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Refresh product list whenever filters change
  useEffect(() => {
    refreshProductList();
  }, [refreshProductList]);

  // Handle product deletion with user confirmation
  const handleProductRemoval = async (productId: string) => {
    const userConfirmed = window.confirm('This action cannot be undone. Are you sure you want to remove this product?');
    if (!userConfirmed) return;
    
    try {
      setDeletingId(productId);
      await productService.deleteProduct(productId);
      setProducts(currentProducts => 
        currentProducts.filter(product => product.id !== productId)
      );
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to remove product. Please try again.';
      setError(errorMessage);
      console.error('Product deletion error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const [tempFilters, setTempFilters] = useState<ProductFilter>({});

  const handleFilter = (newFilters: Partial<ProductFilter>) => {
    setTempFilters(prev => ({ ...prev, ...newFilters }));
  };

  const applyFilters = () => {
    setFilters(tempFilters);
  };

  if (loading) return <div className="text-center py-8">Loading products...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          type="text"
          placeholder="Search products..."
          className="border rounded-md px-3 py-2"
          onChange={(e) => handleFilter({ searchQuery: e.target.value })}
        />
        <select
          className="border rounded-md px-3 py-2"
          onChange={(e) => handleFilter({ category: e.target.value })}
        >
          <option value="">All Categories</option>
          {PRODUCT_CATEGORIES.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min Price"
            className="border rounded-md px-3 py-2 w-1/2"
            onChange={(e) => handleFilter({ minPrice: Number(e.target.value) || undefined })}
          />
          <input
            type="number"
            placeholder="Max Price"
            className="border rounded-md px-3 py-2 w-1/2"
            onChange={(e) => handleFilter({ maxPrice: Number(e.target.value) || undefined })}
          />
        </div>
        <input
          type="number"
          placeholder="Min Rating"
          min="0"
          max="5"
          className="border rounded-md px-3 py-2"
          onChange={(e) => handleFilter({ minRating: Number(e.target.value) || undefined })}
        />
        <button
          onClick={applyFilters}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Apply Filters
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit product"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleProductRemoval(product.id)}
                  className="text-red-600 hover:text-red-800"
                  disabled={deletingId === product.id}
                  title="Delete product"
                >
                  {deletingId === product.id ? (
                    <span className="animate-spin">↻</span>
                  ) : (
                    <TrashIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{product.description}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span className="px-2 py-1 bg-gray-100 rounded-full">Category: {product.category}</span>
              <span className="font-medium">${product.price.toFixed(2)}</span>
              <span className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                {product.rating}/5
              </span>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No products found. Try adjusting your filters or add a new product.
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {(showAddModal || editingProduct) && (
        <ProductForm
          product={editingProduct || undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            refreshProductList(); 
          }}
        />
      )}
    </div>
  );
}
