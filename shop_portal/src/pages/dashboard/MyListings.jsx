import React, { useState, useEffect } from 'react';
import api from '../../core/api';

const MyListings = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All');
  
  // Stock adding modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockPrice, setStockPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick edit price modal
  const [editingItem, setEditingItem] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  // Add Custom Product modal
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    title: '',
    category: 'Notes',
    price: '',
    stock_count: '10',
    description: '',
    branch: 'Computer Science',
    course_type: 'Engineering',
    semester: '3',
    subject: '',
    author: '',
    cover_photo_url: '',
  });

  // Edit Product Details modal
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const categories = ['All', 'Books', 'Manuals', 'Notes', 'Forms', 'Stationery', 'Other'];
  const productCategories = ['Books', 'Manuals', 'Notes', 'Forms', 'Stationery', 'Other'];
  const branchOptions = [
    'Computer Science',
    'Information Technology',
    'Mechanical',
    'Civil',
    'Electrical',
    'Electronics & Telecomm',
    'First Year (FE)',
    'Commerce & Arts',
    'General / School',
    'Other'
  ];

  useEffect(() => {
    fetchInventory();
  }, [selectedCategory]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/shop/inventory?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}`);
      setInventory(res.data.inventory || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await api.get(`/shop/inventory/catalog?category=${catalogCategory}&search=${encodeURIComponent(catalogSearch)}`);
      setCatalogItems(res.data.catalog || []);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (showCatalogModal) {
      fetchMasterCatalog();
    }
  }, [showCatalogModal, catalogCategory, catalogSearch]);

  const handleStockUpdate = async (inventoryId, delta) => {
    try {
      await api.patch(`/shop/inventory/${inventoryId}/stock`, { delta });
      // Optimistic update
      setInventory(prev => prev.map(item => {
        if (item.inventory_id === inventoryId) {
          const newCount = Math.max(0, parseInt(item.stock_count, 10) + delta);
          return { ...item, stock_count: newCount, is_available: newCount > 0 };
        }
        return item;
      }));
    } catch (err) {
      console.error('Error adjusting stock:', err);
      alert('Failed to update stock');
      fetchInventory();
    }
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!editingItem || !newPrice) return;
    try {
      await api.patch(`/shop/inventory/${editingItem.inventory_id}/price`, { price: parseFloat(newPrice) });
      setInventory(prev => prev.map(item => item.inventory_id === editingItem.inventory_id ? { ...item, price: newPrice } : item));
      setEditingItem(null);
    } catch (err) {
      alert('Failed to update price');
    }
  };

  const handleDeleteItem = async (inventoryId, title) => {
    if (!window.confirm(`Remove "${title}" from your shop inventory?`)) return;
    try {
      await api.delete(`/shop/inventory/${inventoryId}`);
      setInventory(prev => prev.filter(item => item.inventory_id !== inventoryId));
    } catch (err) {
      alert('Failed to remove item');
    }
  };

  const handleAddToInventory = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      await api.post('/shop/inventory', {
        product_id: selectedProduct.product_id,
        price: parseFloat(stockPrice),
        stock_count: parseInt(stockQuantity, 10)
      });
      setSelectedProduct(null);
      setStockPrice('');
      setStockQuantity('10');
      setShowCatalogModal(false);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add item to inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e, isEditMode = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const fileUrl = res.data?.file?.url || res.data?.url;
      if (fileUrl) {
        if (isEditMode) {
          setEditingProduct(prev => ({ ...prev, cover_photo_url: fileUrl }));
        } else {
          setCustomForm(prev => ({ ...prev, cover_photo_url: fileUrl }));
        }
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Image upload failed. You can paste an image URL instead.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateCustomProduct = async (e) => {
    e.preventDefault();
    if (!customForm.title.trim()) {
      alert('Please enter a product title.');
      return;
    }
    const priceNum = parseFloat(customForm.price);
    if (isNaN(priceNum) || priceNum < 0) {
      alert('Please enter a valid selling price.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/shop/inventory/custom-product', {
        ...customForm,
        price: priceNum,
        stock_count: parseInt(customForm.stock_count || '0', 10),
      });
      setShowAddCustomModal(false);
      setCustomForm({
        title: '',
        category: 'Notes',
        price: '',
        stock_count: '10',
        description: '',
        branch: 'Computer Science',
        course_type: 'Engineering',
        semester: '3',
        subject: '',
        author: '',
        cover_photo_url: '',
      });
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProductEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      await api.put(`/shop/inventory/custom-product/${editingProduct.product_id}`, {
        title: editingProduct.title,
        category: editingProduct.category,
        description: editingProduct.description,
        branch: editingProduct.branch,
        course_type: editingProduct.course_type,
        semester: editingProduct.semester,
        subject: editingProduct.subject,
        author: editingProduct.author,
        cover_photo_url: editingProduct.cover_photo_url,
        price: parseFloat(editingProduct.price),
        stock_count: parseInt(editingProduct.stock_count, 10),
      });
      setEditingProduct(null);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats calculation
  const totalItems = inventory.length;
  const inStockItems = inventory.filter(i => i.stock_count > 0).length;
  const outOfStockItems = inventory.filter(i => i.stock_count === 0).length;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="font-display-sm text-display-sm font-bold text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">storefront</span>
            Store Inventory & Listings
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Manage your shop's stock of books, manuals, notes, and college forms.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setShowAddCustomModal(true)}
            className="bg-primary hover:bg-primary/90 text-on-primary px-5 py-2.5 rounded-xl font-label-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer font-bold text-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Product
          </button>
          <button
            onClick={() => setShowCatalogModal(true)}
            className="bg-surface-container hover:bg-outline-variant/20 text-on-surface border border-outline-variant/40 px-4 py-2.5 rounded-xl font-label-lg flex items-center gap-2 transition-all cursor-pointer font-semibold text-xs"
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            Browse Catalog
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-lg">
        <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">inventory_2</span>
          </div>
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-on-surface-variant">Total Titles</p>
            <p className="text-2xl font-black text-on-surface">{totalItems}</p>
          </div>
        </div>

        <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-on-surface-variant">In Stock</p>
            <p className="text-2xl font-black text-emerald-500">{inStockItems}</p>
          </div>
        </div>

        <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">error_outline</span>
          </div>
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-on-surface-variant">Out of Stock</p>
            <p className="text-2xl font-black text-rose-500">{outOfStockItems}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-4 mb-lg flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-outline-variant/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search by title, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
              className="w-full bg-surface-container-high pl-9 pr-3 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
            />
          </div>
          <button
            onClick={fetchInventory}
            className="px-3 py-2 bg-surface-container-high hover:bg-outline-variant/20 rounded-xl text-xs font-semibold text-on-surface border border-outline-variant/40 cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      {/* Inventory Listings Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary mr-2">autorenew</span>
          <span>Loading inventory items...</span>
        </div>
      ) : inventory.length === 0 ? (
        <div className="bg-surface-container border border-outline-variant/30 rounded-3xl p-12 text-center text-on-surface-variant flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl">inventory_2</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-1">No items found in your inventory</h3>
          <p className="text-xs max-w-sm mb-6">
            Add your own products directly to your shop inventory, or pick standard titles from the master catalog.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={() => setShowAddCustomModal(true)}
              className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Add Your Own Product
            </button>
            <button
              onClick={() => setShowCatalogModal(true)}
              className="bg-surface-container-high hover:bg-outline-variant/20 text-on-surface border border-outline-variant/40 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              Browse Master Catalog
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map(item => {
            const isOutOfStock = parseInt(item.stock_count, 10) === 0;
            const isLowStock = !isOutOfStock && parseInt(item.stock_count, 10) <= 3;

            return (
              <div
                key={item.inventory_id}
                className={`bg-surface-container border rounded-2xl overflow-hidden flex flex-col transition-all hover:border-primary/50 ${
                  isOutOfStock ? 'border-rose-500/30 opacity-80' : 'border-outline-variant/30'
                }`}
              >
                {/* Image & Category Banner */}
                <div className="relative h-40 bg-surface-container-highest flex items-center justify-center overflow-hidden">
                  {item.cover_photo_url ? (
                    <img src={item.cover_photo_url} alt={item.title || 'Product listing thumbnail'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">
                      {item.category === 'Books' ? 'menu_book' : item.category === 'Manuals' ? 'assignment' : item.category === 'Forms' ? 'description' : item.category === 'Stationery' ? 'draw' : 'edit_note'}
                    </span>
                  )}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      {item.category}
                    </span>
                    {item.is_custom && (
                      <span className="bg-primary/90 text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    {isOutOfStock ? (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                        Low Stock ({item.stock_count})
                      </span>
                    ) : (
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                        {item.stock_count} Available
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface text-base line-clamp-1 mb-1">{item.title}</h3>
                    <p className="text-xs text-on-surface-variant font-medium">
                      {item.branch || 'General'} {item.semester ? `• Sem ${item.semester}` : ''}
                    </p>
                    {item.subject && (
                      <p className="text-xs text-on-surface-variant/80 mt-0.5">Subject: {item.subject}</p>
                    )}
                    {item.description && (
                      <p className="text-[11px] text-on-surface-variant/70 mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>

                  {/* Price & Stock Adjustment Section */}
                  <div className="mt-4 pt-3 border-t border-outline-variant/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant">Price:</span>
                        <span className="font-extrabold text-base text-primary">₹{item.price}</span>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setNewPrice(item.price);
                          }}
                          className="text-on-surface-variant hover:text-primary material-symbols-outlined text-[16px] cursor-pointer"
                          title="Quick Edit Price"
                        >
                          edit
                        </button>
                        <button
                          onClick={() => setEditingProduct({ ...item })}
                          className="text-on-surface-variant hover:text-primary material-symbols-outlined text-[16px] cursor-pointer"
                          title="Edit Full Product Details"
                        >
                          tune
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.inventory_id, item.title)}
                        className="text-rose-400 hover:text-rose-500 material-symbols-outlined text-[18px] cursor-pointer"
                        title="Remove from shop inventory"
                      >
                        delete
                      </button>
                    </div>

                    {/* Stock stepper controls */}
                    <div className="bg-surface-container-high p-2 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-semibold text-on-surface-variant">Adjust Stock:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStockUpdate(item.inventory_id, -1)}
                          disabled={item.stock_count <= 0}
                          className="w-7 h-7 bg-surface-container rounded-lg flex items-center justify-center font-bold text-on-surface hover:bg-outline-variant/30 disabled:opacity-40 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-black text-sm text-on-surface">{item.stock_count}</span>
                        <button
                          onClick={() => handleStockUpdate(item.inventory_id, 1)}
                          className="w-7 h-7 bg-surface-container rounded-lg flex items-center justify-center font-bold text-on-surface hover:bg-outline-variant/30 cursor-pointer"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleStockUpdate(item.inventory_id, 10)}
                          className="bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold px-2 py-1.5 rounded-lg ml-1 cursor-pointer"
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal 1: Add Custom Product Directly ── */}
      {showAddCustomModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface border border-outline-variant/40 rounded-3xl p-6 w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant/30 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">add_circle</span>
                  Add Product to Shop
                </h2>
                <p className="text-xs text-on-surface-variant">Create and list a custom book, manual, notes, form, or stationery item.</p>
              </div>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="text-on-surface-variant hover:text-on-surface material-symbols-outlined cursor-pointer"
              >
                close
              </button>
            </div>

            <form onSubmit={handleCreateCustomProduct} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Product Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Data Structures Complete Handwritten Notes"
                  value={customForm.title}
                  onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                  className="w-full bg-surface-container px-3.5 py-2.5 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface font-medium"
                />
              </div>

              {/* Category & Price & Stock in 3 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Category *</label>
                  <select
                    value={customForm.category}
                    onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2.5 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface cursor-pointer"
                  >
                    {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Selling Price (₹) *</label>
                  <input
                    required
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 50"
                    value={customForm.price}
                    onChange={(e) => setCustomForm({ ...customForm, price: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2.5 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface font-bold text-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Initial Stock Count *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="e.g. 15"
                    value={customForm.stock_count}
                    onChange={(e) => setCustomForm({ ...customForm, stock_count: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2.5 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface font-bold"
                  />
                </div>
              </div>

              {/* Branch / Stream & Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Branch / Department (Optional)</label>
                  <select
                    value={customForm.branch}
                    onChange={(e) => setCustomForm({ ...customForm, branch: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2.5 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface cursor-pointer"
                  >
                    <option value="">None / General</option>
                    {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Semester / Year (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sem 3 or 2nd Year"
                    value={customForm.semester}
                    onChange={(e) => setCustomForm({ ...customForm, semester: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2.5 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
                  />
                </div>
              </div>

              {/* Subject & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Subject (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Data Structures & Algorithms"
                    value={customForm.subject}
                    onChange={(e) => setCustomForm({ ...customForm, subject: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2.5 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Author / Publisher / Faculty (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Department Faculty or TechKnowledge"
                    value={customForm.author}
                    onChange={(e) => setCustomForm({ ...customForm, author: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2.5 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Description / Notes (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Covers all 5 units, with solved question bank, spiral bound A4 sheets."
                  value={customForm.description}
                  onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                  className="w-full bg-surface-container px-3.5 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
                />
              </div>

              {/* Image / Thumbnail */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Product Photo / Thumbnail (Optional)</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-surface-container-highest border border-outline-variant/40 overflow-hidden flex items-center justify-center shrink-0">
                    {customForm.cover_photo_url ? (
                      <img src={customForm.cover_photo_url} alt="Product Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant text-xl">image</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      type="url"
                      placeholder="Paste image URL (or upload below)"
                      value={customForm.cover_photo_url}
                      onChange={(e) => setCustomForm({ ...customForm, cover_photo_url: e.target.value })}
                      className="w-full bg-surface-container px-3 py-1.5 text-xs rounded-lg border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
                    />
                    <label className="inline-flex items-center gap-1.5 text-primary text-xs font-bold cursor-pointer hover:underline">
                      <span className="material-symbols-outlined text-[16px]">upload</span>
                      <span>{uploadingImage ? 'Uploading image...' : 'Upload Image from Computer'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, false)}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="flex-1 py-2.5 text-xs rounded-xl bg-surface-container hover:bg-outline-variant/20 text-on-surface font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-xs rounded-xl bg-primary text-on-primary font-bold shadow hover:bg-primary/90 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Product...' : 'Add to Shop Listings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Edit Product Details ── */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface border border-outline-variant/40 rounded-3xl p-6 w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl my-auto">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant/30 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                  Edit Product Details
                </h2>
                <p className="text-xs text-on-surface-variant">Update item details, price, or stock levels.</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-on-surface-variant hover:text-on-surface material-symbols-outlined cursor-pointer"
              >
                close
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Product Title *</label>
                <input
                  required
                  type="text"
                  value={editingProduct.title || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full bg-surface-container px-3.5 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Category *</label>
                  <select
                    value={editingProduct.category || 'Other'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface cursor-pointer"
                  >
                    {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Price (₹) *</label>
                  <input
                    required
                    type="number"
                    step="0.5"
                    min="0"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface font-bold text-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Stock Count *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={editingProduct.stock_count !== undefined ? editingProduct.stock_count : ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_count: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Branch / Department</label>
                  <select
                    value={editingProduct.branch || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, branch: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface cursor-pointer"
                  >
                    <option value="">None / General</option>
                    {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Semester / Year</label>
                  <input
                    type="text"
                    value={editingProduct.semester || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, semester: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Subject</label>
                  <input
                    type="text"
                    value={editingProduct.subject || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subject: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Author / Faculty</label>
                  <input
                    type="text"
                    value={editingProduct.author || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, author: e.target.value })}
                    className="w-full bg-surface-container px-3 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Description</label>
                <textarea
                  rows="2"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-surface-container px-3.5 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Product Photo</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-surface-container-highest border border-outline-variant/40 overflow-hidden flex items-center justify-center shrink-0">
                    {editingProduct.cover_photo_url ? (
                      <img src={editingProduct.cover_photo_url} alt="Product Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant text-xl">image</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <input
                      type="url"
                      placeholder="Paste image URL"
                      value={editingProduct.cover_photo_url || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, cover_photo_url: e.target.value })}
                      className="w-full bg-surface-container px-3 py-1.5 text-xs rounded-lg border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
                    />
                    <label className="inline-flex items-center gap-1.5 text-primary text-xs font-bold cursor-pointer hover:underline">
                      <span className="material-symbols-outlined text-[16px]">upload</span>
                      <span>{uploadingImage ? 'Uploading...' : 'Replace Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, true)}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 text-xs rounded-xl bg-surface-container hover:bg-outline-variant/20 text-on-surface font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-xs rounded-xl bg-primary text-on-primary font-bold shadow hover:bg-primary/90 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 3: Master Catalog Browser Modal (Optional Alternative) ── */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="bg-surface border border-outline-variant/40 rounded-3xl p-6 w-full max-h-[88vh] flex flex-col shadow-2xl"
            style={{ maxWidth: '780px' }}
          >
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant/30 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">menu_book</span>
                  Master Product Catalog
                </h2>
                <p className="text-xs text-on-surface-variant">Select a standard college title to stock in your shop</p>
              </div>
              <button
                onClick={() => {
                  setShowCatalogModal(false);
                  setSelectedProduct(null);
                }}
                className="text-on-surface-variant hover:text-on-surface material-symbols-outlined cursor-pointer"
              >
                close
              </button>
            </div>

            {/* Modal Filters */}
            <div className="py-4 flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search catalog by title, subject..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-surface-container-high pl-9 pr-3 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
                />
              </div>
              <select
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                className="bg-surface-container-high px-3 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Catalog Items List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {catalogLoading ? (
                <div className="py-12 text-center text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined animate-spin text-2xl text-primary mr-2">autorenew</span>
                  <span>Fetching catalog...</span>
                </div>
              ) : catalogItems.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant">
                  No catalog products found. You can add your own custom product using the "Add Product" button!
                </div>
              ) : (
                catalogItems.map(prod => (
                  <div
                    key={prod.product_id}
                    className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container-highest shrink-0 flex items-center justify-center overflow-hidden">
                        {prod.cover_photo_url ? (
                          <img src={prod.cover_photo_url} alt={prod.title ? `${prod.title} thumbnail` : 'Catalog product thumbnail'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant">book</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-on-surface">{prod.title}</span>
                          <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
                            {prod.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {prod.branch} • {prod.course_type} {prod.semester && `• Sem ${prod.semester}`}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto justify-end">
                      {prod.is_stocked ? (
                        <div className="text-right">
                          <span className="text-[11px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-1 rounded-md">
                            Already Stocked (₹{prod.current_price}, {prod.current_stock} qty)
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedProduct(prod);
                            setStockPrice('45');
                            setStockQuantity('10');
                          }}
                          className="bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          Stock This Item
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom selected product form */}
            {selectedProduct && (
              <form onSubmit={handleAddToInventory} className="mt-4 pt-4 border-t border-outline-variant/30 bg-surface-container p-4 rounded-2xl">
                <div className="text-xs font-bold text-on-surface mb-3 flex items-center justify-between">
                  <span>Set Price & Stock for: <strong className="text-primary">{selectedProduct.title}</strong></span>
                  <button type="button" onClick={() => setSelectedProduct(null)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">Cancel</button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Your Selling Price (₹) *</label>
                    <input
                      required
                      type="number"
                      step="0.5"
                      min="0"
                      value={stockPrice}
                      onChange={(e) => setStockPrice(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full bg-surface-container-high px-3 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Stock Count (Copies) *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full bg-surface-container-high px-3 py-2 text-xs rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface font-bold"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-on-primary py-2.5 rounded-xl text-xs font-bold shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm & Add to Shop Inventory'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Modal 4: Quick Edit Price Modal ── */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-on-surface text-base mb-1">Update Price</h3>
            <p className="text-xs text-on-surface-variant mb-4">{editingItem.title}</p>
            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">New Price (₹)</label>
                <input
                  required
                  type="number"
                  step="0.5"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-surface-container px-3 py-2 text-sm rounded-xl border border-outline-variant/40 focus:border-primary outline-none text-on-surface font-bold"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2 text-xs rounded-xl bg-surface-container hover:bg-outline-variant/20 text-on-surface font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs rounded-xl bg-primary text-on-primary font-bold shadow cursor-pointer"
                >
                  Save Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;
