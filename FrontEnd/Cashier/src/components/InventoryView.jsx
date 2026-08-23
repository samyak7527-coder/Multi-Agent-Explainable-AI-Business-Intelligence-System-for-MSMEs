import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit3, Trash2, MapPin, RefreshCw, AlertCircle, Box, Loader2 } from 'lucide-react';
import { apiCall } from '../config/api';
import { ProductModal } from './ProductModal';

export const InventoryView = ({ onToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  // Delete Confirm State
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall('/products/');
      setProducts(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddClick = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await apiCall(`/products/${productToDelete.product_id}`, {
        method: 'DELETE',
      });
      onToast(`Product ${productToDelete.product_id} deleted successfully.`, 'success');
      setProducts((prev) => prev.filter((p) => p.product_id !== productToDelete.product_id));
      setProductToDelete(null);
    } catch (err) {
      onToast(err.message || 'Failed to delete product.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.product_id && p.product_id.toLowerCase().includes(q)) ||
      (p.product_name && p.product_name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.warehouse_location && p.warehouse_location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Product Inventory & Stock Tracking</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleAddClick}
            className="px-5 py-2.5 rounded-full btn-gradient font-bold text-xs shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-4 rounded-3xl border border-white/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by ID, name, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200/80 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 self-end sm:self-center">
          <span className="font-semibold text-slate-700">
            Total Items: <span className="text-[#f2643a] font-bold">{products.length}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Low Stock: <span className="text-amber-600 font-bold">{products.filter((p) => (p.current_stock || 0) < 5).length}</span>
          </span>
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#f2643a] animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Loading inventory data...</p>
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State per spec */
          <div className="py-20 px-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-orange-100/60 text-[#f2643a] flex items-center justify-center mx-auto shadow-inner">
              <Box className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                {searchQuery ? 'No matching products found' : 'No products yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try clearing your search terms or filter criteria.'
                  : 'No products yet. Add your first product to get started.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={handleAddClick}
                className="px-5 py-2.5 rounded-full btn-gradient font-bold text-xs shadow-md inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product Now</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">PRODUCT ID</th>
                  <th className="py-3.5 px-4">PRODUCT NAME</th>
                  <th className="py-3.5 px-4">CATEGORY</th>
                  <th className="py-3.5 px-4">STOCK</th>
                  <th className="py-3.5 px-4">SELLING PRICE</th>
                  <th className="py-3.5 px-4">LOCATION</th>
                  <th className="py-3.5 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map((prod) => {
                  const stock = prod.current_stock ?? 0;
                  const stockBadgeClass =
                    stock === 0
                      ? 'bg-rose-100 text-rose-700 border-rose-200'
                      : stock < 5
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  return (
                    <tr
                      key={prod.product_id}
                      className="hover:bg-orange-50/30 transition-colors group"
                    >
                      {/* Product ID */}
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {prod.product_id}
                      </td>

                      {/* Product Name */}
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {prod.product_name}
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px]">
                          {prod.category || 'General'}
                        </span>
                      </td>

                      {/* Stock Badge */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold ${stockBadgeClass}`}>
                          {stock} units
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-4 px-4 font-bold text-slate-900">
                        ₹{Number(prod.selling_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Warehouse Location */}
                      <td className="py-4 px-4 text-slate-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prod.warehouse_location || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(prod)}
                            className="p-1.5 rounded-full hover:bg-orange-100 text-slate-500 hover:text-[#f2643a] transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setProductToDelete(prod)}
                            className="p-1.5 rounded-full hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
        onProductSaved={(msg) => {
          onToast(msg, 'success');
          fetchProducts();
        }}
      />

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Product?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-slate-800">{productToDelete.product_name}</span> ({productToDelete.product_id})? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-70 flex items-center gap-1.5"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
