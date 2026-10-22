import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, Check, User, Phone, MapPin, CreditCard, Star, Sparkles, Loader2, History, FilePlus, AlertCircle, Tag, CheckCircle2 } from 'lucide-react';
import { apiCall } from '../config/api';
import { OrderHistoryView } from './OrderHistoryView';

export const BillingView = ({ onToast }) => {
  const [activeSubTab, setActiveSubTab] = useState('new_bill'); // 'new_bill' | 'order_history'

  // Products loaded from backend
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Search & Auto-complete state
  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Bill items state
  const [billItems, setBillItems] = useState([]);

  // Customer Details state
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [checkingCustomer, setCheckingCustomer] = useState(false);

  // Payment & Rating & Status state
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [reviewScore, setReviewScore] = useState(5.0);
  const [discount, setDiscount] = useState(0);
  const [orderStatus, setOrderStatus] = useState('Processing'); // UI-only per spec

  // Checkout submission loading
  const [submittingBill, setSubmittingBill] = useState(false);
  const [billSuccessModal, setBillSuccessModal] = useState(null);

  // Fetch product inventory for POS
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await apiCall('/products/');
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products for billing', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Customer lookup by phone number
  const handlePhoneBlurOrSearch = async (phoneVal) => {
    const cleanPhone = phoneVal.trim();
    if (!cleanPhone || cleanPhone.length < 5) {
      setIsExistingCustomer(false);
      return;
    }

    setCheckingCustomer(true);
    try {
      const res = await apiCall(`/customers/phone/${encodeURIComponent(cleanPhone)}`);
      if (res && res.length > 0) {
        // Autofill from the most recent transaction for this phone
        const latest = res[res.length - 1];
        setCustomerName(latest.customer_name || '');
        setCustomerCity(latest.customer_city || '');
        setCustomerState(latest.customer_state || '');
        setIsExistingCustomer(true);
      } else {
        setIsExistingCustomer(false);
      }
    } catch (_err) {
      // 404 = no transactions for this phone → new customer; leave fields blank/editable, no toast
      setIsExistingCustomer(false);
    } finally {
      setCheckingCustomer(false);
    }
  };

  // Filter products by search term
  const searchMatches = products.filter((p) => {
    if (!productSearch.trim()) return false;
    const q = productSearch.toLowerCase();
    return (
      (p.product_id && p.product_id.toLowerCase().includes(q)) ||
      (p.product_name && p.product_name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  // Add product to bill
  const handleAddProductToBill = (prod) => {
    if (prod.current_stock <= 0) {
      onToast(`"${prod.product_name}" is out of stock!`, 'warning');
      return;
    }

    setBillItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product_id === prod.product_id);
      if (existingIndex > -1) {
        // Increment quantity if stock available
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        if (currentQty + 1 > prod.current_stock) {
          onToast(`Cannot add more than available stock (${prod.current_stock}).`, 'warning');
          return prev;
        }
        updated[existingIndex].quantity = currentQty + 1;
        return updated;
      } else {
        // Add new line item
        return [
          ...prev,
          {
            product_id: prod.product_id,
            product_name: prod.product_name,
            category: prod.category || 'General',
            selling_price: prod.selling_price || 0,
            quantity: 1,
            max_stock: prod.current_stock || 0,
          },
        ];
      }
    });

    setProductSearch('');
    setShowDropdown(false);
  };

  // Update line item quantity
  const handleQuantityChange = (productId, newQty) => {
    setBillItems((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          const qty = Math.max(1, Math.min(newQty, item.max_stock));
          return { ...item, quantity: qty };
        }
        return item;
      })
    );
  };

  // Remove line item
  const handleRemoveItem = (productId) => {
    setBillItems((prev) => prev.filter((item) => item.product_id !== productId));
  };
  const handleClearBill = () => {
    setBillItems([]);
    setCustomerPhone('');
    setCustomerName('');
    setCustomerCity('');
    setCustomerState('');
    setIsExistingCustomer(false);
    setProductSearch('');
    setDiscount(0);  // ADD THIS
  };
  // Calculate bill total amount
  const calculateTotalAmount = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
    const disc = parseFloat(discount) || 0;
    return Math.max(0, subtotal - disc); // never let total go negative
  };

  const calculateSubtotal = () => {
    return billItems.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  };

  // Submit & Generate Bill
  const handleGenerateBill = async () => {
    if (billItems.length === 0) {
      onToast('Please add at least one product to generate a bill.', 'warning');
      return;
    }

    // Validate quantities against stock
    for (const item of billItems) {
      if (item.quantity > item.max_stock) {
        onToast(`Quantity for ${item.product_name} exceeds current stock (${item.max_stock}).`, 'error');
        return;
      }
    }

    setSubmittingBill(true);

    try {
      // Single POST with the whole cart — backend generates ONE order_id
      // and creates one transaction row per item, all sharing that order_id.
      const payload = {
        customer_name: customerName.trim() || 'Walk-in Customer',
        customer_phone: customerPhone.trim() || undefined,
        customer_city: customerCity.trim() || undefined,
        customer_state: customerState.trim() || undefined,
        items: billItems.map((item) => ({
          product_id: item.product_id,
          product_count: item.quantity,
          product_categories: item.category || 'General',
        })),
        total_freight: 0.0,
        discount: parseFloat(discount) || 0.0,
        payment_value: calculateTotalAmount(),
        payment_type: paymentMethod,
        review_score: parseFloat(reviewScore) || 5.0,
      };

      const createdRows = await apiCall('/billing/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const orderId = createdRows?.[0]?.order_id;

      // If cashier picked a status other than the backend default ("Processing"),
      // push it via a single PATCH — updates all rows sharing this order_id.
      if (orderStatus !== 'Processing' && orderId) {
        try {
          await apiCall(`/billing/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ order_status: orderStatus.toLowerCase() }),
          });
        } catch (statusErr) {
          console.error(`Failed to set status for ${orderId}`, statusErr);
          onToast(`Order ${orderId} created, but status update failed.`, 'warning');
        }
      }

      // Success modal
      const totalAmount = calculateTotalAmount();

      setBillSuccessModal({
        orderId: orderId || 'ORD',
        itemCount: billItems.length,
        totalAmount,
        customerName: customerName || 'Walk-in Customer',
        paymentMethod,
      });

      onToast(`Bill generated successfully! Order #${orderId}`, 'success');

      // Clear bill & refresh stock
      handleClearBill();
      loadProducts();
    } catch (err) {
      onToast(err.message || 'Failed to generate bill.', 'error');
    } finally {
      setSubmittingBill(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing System / POS</h1>
          <p className="text-xs text-slate-500 mt-0.5">Quick Checkout & Customer Order Management</p>
        </div>

        {/* Tab Selector: New Bill vs Order History */}
        <div className="p-1 bg-slate-200/80 rounded-full flex items-center shadow-inner self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('new_bill')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 ${activeSubTab === 'new_bill'
              ? 'bg-white text-slate-900 shadow-md font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FilePlus className="w-3.5 h-3.5 text-[#f2643a]" />
            <span>New Bill</span>
          </button>
          <button
            onClick={() => setActiveSubTab('order_history')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 ${activeSubTab === 'order_history'
              ? 'bg-white text-slate-900 shadow-md font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-500" />
            <span>Order History</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'order_history' ? (
        <OrderHistoryView onToast={onToast} />
      ) : (
        /* NEW BILL VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Search + Line Items + Customer + Payment (~7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* CARD 1: Add Products Search */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl rounded-3xl p-5 space-y-3 relative z-30">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Search & Add Products
              </label>

              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  placeholder="Search by product name, ID, or category..."
                  value={productSearch}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 shadow-inner"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

                {/* Dropdown Results */}
                {showDropdown && productSearch.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-50 divide-y divide-slate-100">
                    {searchMatches.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-medium">
                        No matching products found.
                      </div>
                    ) : (
                      searchMatches.map((match) => (
                        <div
                          key={match.product_id}
                          onClick={() => handleAddProductToBill(match)}
                          className="p-3 hover:bg-orange-50/60 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#f2643a]">
                              {match.product_name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {match.product_id} &bull; {match.category || 'General'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-emerald-600">
                              ₹{Number(match.selling_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <div className={`text-[10px] font-semibold ${match.current_stock > 0 ? 'text-slate-500' : 'text-rose-500'}`}>
                              {match.current_stock > 0 ? `${match.current_stock} in stock` : 'Out of Stock'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CARD 2: Bill Line Items Table */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#f2643a]" />
                  <span>Bill Items ({billItems.length})</span>
                </h3>
                {billItems.length > 0 && (
                  <button
                    onClick={handleClearBill}
                    className="text-[11px] font-semibold text-rose-500 hover:underline"
                  >
                    Remove All
                  </button>
                )}
              </div>

              {billItems.length === 0 ? (
                /* Empty state per spec */
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    No products added yet. Search and add products above.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">PRODUCT</th>
                        <th className="py-2.5 px-2">QTY</th>
                        <th className="py-2.5 px-3">PRICE</th>
                        <th className="py-2.5 px-3">AMOUNT</th>
                        <th className="py-2.5 px-2 text-right">REMOVE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {billItems.map((item) => {
                        const lineAmount = item.selling_price * item.quantity;
                        return (
                          <tr key={item.product_id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{item.product_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.product_id}</div>
                            </td>

                            {/* Quantity control */}
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.max_stock}
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value) || 1)}
                                  className="w-12 text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-slate-600 font-medium">
                              ₹{Number(item.selling_price).toFixed(2)}
                            </td>

                            <td className="py-3 px-3 font-bold text-slate-900">
                              ₹{Number(lineAmount).toFixed(2)}
                            </td>

                            <td className="py-3 px-2 text-right">
                              <button
                                onClick={() => handleRemoveItem(item.product_id)}
                                className="p-1 rounded-full hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CARD 3: Customer Details */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>Customer Details</span>
                </h3>
                {isExistingCustomer && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Existing Customer
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone Number */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    PHONE NUMBER
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="Enter phone number..."
                      value={customerPhone}
                      onBlur={() => handlePhoneBlurOrSearch(customerPhone)}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (e.target.value.length === 10) {
                          handlePhoneBlurOrSearch(e.target.value);
                        }
                      }}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    {checkingCustomer && (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin absolute right-3 top-2.5" />
                    )}
                  </div>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    CUSTOMER NAME
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    CITY
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* State */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    STATE
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Maharashtra"
                      value={customerState}
                      onChange={(e) => setCustomerState(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: Payment & Rating & Status */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-xl rounded-3xl p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  <span>Payment & Order Settings</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Payment Method */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    PAYMENT METHOD
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 cursor-pointer font-semibold"
                  >
                    <option value="UPI">UPI / QR</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>

                {/* Review Score */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    REVIEW SCORE (1-5)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="5"
                      value={reviewScore}
                      onChange={(e) => setReviewScore(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* Order Status (UI-only per spec) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    ORDER STATUS
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 cursor-pointer font-semibold"
                  >
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary (~5 cols) */}
          <div className="lg:col-span-5 sticky top-6">
            <div className="bg-white/90 backdrop-blur-2xl border border-white/80 shadow-2xl rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Order Summary</h3>
                  <p className="text-xs text-slate-500">Checkout summary and bill calculation</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#f2643a] flex items-center justify-center font-bold text-xs">
                  {billItems.length}
                </div>
              </div>

              {/* Items Breakdown list */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {billItems.length === 0 ? (
                  <div className="py-6 text-center text-xs font-semibold text-slate-400">
                    No items in bill
                  </div>
                ) : (
                  billItems.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50">
                      <div className="truncate max-w-[180px]">
                        <span className="font-semibold text-slate-800">{item.product_name}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.quantity} × ₹{Number(item.selling_price).toFixed(2)}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">
                        ₹{(item.selling_price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Discount Input */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  DISCOUNT (₹)
                </label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>
              </div>

              {/* Price Calculations */}
              <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span className="text-rose-600 font-semibold">
                    − ₹{(parseFloat(discount) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Taxes / Charges</span>
                  <span className="text-emerald-600 font-semibold">Included</span>
                </div>
                <div className="flex justify-between items-center text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-xl text-[#f2643a]">
                    ₹{calculateTotalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleGenerateBill}
                  disabled={submittingBill || billItems.length === 0}
                  className="w-full py-3.5 rounded-full btn-gradient font-bold text-sm shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingBill ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Bill...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-200" />
                      <span>Generate Bill</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClearBill}
                  disabled={billItems.length === 0}
                  className="w-full py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Confirmation Modal */}
      {billSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center space-y-4 border border-slate-100">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bill Generated!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Order <span className="font-mono font-bold text-slate-800">{billSuccessModal.orderId}</span> completed.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 text-left text-xs space-y-1.5 border border-slate-200/60">
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span className="font-semibold text-slate-800">{billSuccessModal.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Items Billed:</span>
                <span className="font-semibold text-slate-800">{billSuccessModal.itemCount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-semibold text-slate-800">{billSuccessModal.paymentMethod}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Paid:</span>
                <span className="text-[#f2643a]">₹{billSuccessModal.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setBillSuccessModal(null)}
              className="w-full py-3 rounded-full btn-gradient font-bold text-xs shadow-md"
            >
              Done & Next Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
