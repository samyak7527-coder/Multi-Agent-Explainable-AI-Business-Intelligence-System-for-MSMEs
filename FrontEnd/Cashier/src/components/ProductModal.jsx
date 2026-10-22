import React, { useState, useEffect } from 'react';
import { X, Package, Loader2, Save, PlusCircle } from 'lucide-react';
import { apiCall } from '../config/api';

export const ProductModal = ({ isOpen, onClose, productToEdit, onProductSaved }) => {
  const isEditing = !!productToEdit;

  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('General');
  const [currentStock, setCurrentStock] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setProductId(productToEdit.product_id || '');
      setProductName(productToEdit.product_name || '');
      setCategory(productToEdit.category || 'General');
      setCurrentStock(productToEdit.current_stock?.toString() || '0');
      setSellingPrice(productToEdit.selling_price?.toString() || '');
      setPurchasePrice(productToEdit.purchase_price?.toString() || '');
      setSellerId(productToEdit.seller_id || '');
      setWarehouseLocation(productToEdit.warehouse_location || '');
    } else {
      // Auto generate a new ID like PROD104
      setProductId('PROD' + Math.floor(100 + Math.random() * 900));
      setProductName('');
      setCategory('General');
      setCurrentStock('10');
      setSellingPrice('');
      setPurchasePrice('');
      setSellerId('SEL001');
      setWarehouseLocation('Warehouse A');
    }
    setError('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!productId.trim() || !productName.trim() || !sellingPrice) {
      setError('Please fill in Product ID, Product Name, and Selling Price.');
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        // PATCH only changed fields
        const patchPayload = {};
        if (productName !== productToEdit.product_name) patchPayload.product_name = productName.trim();
        if (category !== productToEdit.category) patchPayload.category = category.trim();
        if (parseInt(currentStock) !== productToEdit.current_stock) patchPayload.current_stock = parseInt(currentStock) || 0;
        if (parseFloat(sellingPrice) !== productToEdit.selling_price) patchPayload.selling_price = parseFloat(sellingPrice) || 0;
        if (purchasePrice && parseFloat(purchasePrice) !== productToEdit.purchase_price) patchPayload.purchase_price = parseFloat(purchasePrice);
        if (sellerId !== productToEdit.seller_id) patchPayload.seller_id = sellerId.trim();
        if (warehouseLocation !== productToEdit.warehouse_location) patchPayload.warehouse_location = warehouseLocation.trim();

        await apiCall(`/products/${productToEdit.product_id}`, {
          method: 'PATCH',
          body: JSON.stringify(patchPayload),
        });
        onProductSaved('Product updated successfully!');
      } else {
        // POST new product
        const postPayload = {
          product_id: productId.trim(),
          product_name: productName.trim(),
          category: category.trim() || 'General',
          current_stock: parseInt(currentStock) || 0,
          selling_price: parseFloat(sellingPrice) || 0,
          purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
          seller_id: sellerId.trim() || null,
          warehouse_location: warehouseLocation.trim() || null,
        };

        await apiCall('/products/', {
          method: 'POST',
          body: JSON.stringify(postPayload),
        });
        onProductSaved('New product created successfully!');
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-2xl overflow-hidden space-y-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-100 text-[#f2643a] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `Updating ${productToEdit.product_id}` : 'Fill in the details for inventory record'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {/* Product ID */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                PRODUCT ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                placeholder="e.g. PROD001"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                CATEGORY
              </label>
              <input
                type="text"
                placeholder="e.g. Electronics, Grocery"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              PRODUCT NAME <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wireless Bluetooth Headphones"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Current Stock */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                STOCK <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                SELLING PRICE (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 font-semibold text-emerald-600"
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                PURCHASE PRICE (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Seller ID */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                SELLER ID
              </label>
              <input
                type="text"
                placeholder="e.g. VENDOR-01"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>

            {/* Warehouse Location */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                WAREHOUSE LOCATION
              </label>
              <input
                type="text"
                placeholder="e.g. Shelf B4"
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full btn-gradient font-bold text-xs shadow-md flex items-center gap-1.5 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isEditing ? (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Product</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
