import { useState, useEffect } from 'react';
import { Product } from '../../lib/supabase';
import { productService } from '../../services/productService';

// Shared product categories for consistency
const PRODUCT_CATEGORIES = [
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Books', label: 'Books' },
  { value: 'Home', label: 'Home' }
];

// Keeping these handy for form validation
// Note: Might want to make these customizable per product type later
const formRules = {
  price: { min: 0, message: "C'mon, price can't be negative!" },
  rating: { min: 0, max: 5, message: "Let's stick to a rating between 0 and 5 stars" }
};

type ProductFormProps = {
  product?: Product;
  onClose: () => void;
  onSuccess: () => void;
};

export function ProductForm({ product, onClose, onSuccess }: ProductFormProps) {
  // Track form state and validation
  const [productDetails, setProductDetails] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    category: product?.category ?? '',
    price: product?.price?.toString() ?? '',
    rating: product?.rating?.toString() ?? ''
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when editing different product
  useEffect(() => {
    if (product) {
      setProductDetails({
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price.toString(),
        rating: product.rating.toString()
      });
    }
  }, [product]);

  const checkFormValidity = () => {
    const trimmedName = productDetails.name.trim();
    if (!trimmedName) {
      return 'Hey, we need a name for this product!';
    }
    if (!productDetails.description.trim()) {
      return 'Mind adding a quick description?';
    }
    if (!productDetails.category) {
      return 'Please pick a category for this item';
    }

    const priceValue = Number(productDetails.price);
    if (isNaN(priceValue) || priceValue < formRules.price.min) {
      return formRules.price.message;
    }

    const ratingValue = Number(productDetails.rating);
    if (isNaN(ratingValue) || 
        ratingValue < formRules.rating.min || 
        ratingValue > formRules.rating.max) {
      return formRules.rating.message;
    }

    return null;
  };

  // Handle the form submission - validate, save, and show feedback
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null); // Clear any previous errors
    
    const errorMsg = checkFormValidity();
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }

    setIsSaving(true);

    try {
      const updatedProduct = {
        name: productDetails.name,
        description: productDetails.description,
        category: productDetails.category,
        price: Number(productDetails.price),
        rating: Number(productDetails.rating)
      };

      if (product?.id) {
        await productService.updateProduct(product.id, updatedProduct);
      } else {
        await productService.createProduct(updatedProduct);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save product:', err);
      setValidationError(
        err instanceof Error 
          ? err.message 
          : 'Oops! Something went wrong while saving'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Update form fields as user types/selects
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductDetails(prev => ({ ...prev, [name]: value })); // Keep the rest of the form data intact
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={productDetails.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={productDetails.description}
              onChange={handleChange}
              required
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={productDetails.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Choose a category...</option>
              {PRODUCT_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              name="price"
              value={productDetails.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rating</label>
            <input
              type="number"
              name="rating"
              value={productDetails.rating}
              onChange={handleChange}
              required
              min="0"
              max="5"
              step="0.1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {validationError && (
            <div className="text-red-600 text-sm">{validationError}</div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSaving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}