import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../core/api';

const AddShop = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    shop_name: '',
    address: '',
    price_bw: '0.50',
    price_color: '2.00'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    setRegisteredShop(null);

    try {
      const res = await api.post('/auth/register-shop', formData);
      const newShop = res.data?.shop || { name: formData.shop_name, shop_code: 'PR' + Math.floor(1000 + Math.random() * 9000) };
      setRegisteredShop(newShop);
      setSuccess(`Shop "${formData.shop_name}" registered successfully! Shop Code: ${newShop.shop_code || 'Generated'}`);
      setFormData({
        email: '', password: '', full_name: '', phone: '',
        shop_name: '', address: '', price_bw: '0.50', price_color: '2.00'
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Overview & Sales</span>
        </button>
      </div>

      <div className="bg-surface-container border border-outline-variant/30 rounded-3xl p-6 sm:p-10 shadow-sm">
        {/* Header */}
        <div className="border-b border-outline-variant/30 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center material-symbols-outlined text-2xl border border-primary/20">
              add_business
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">Onboard New Print Shop</h1>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                Register a new vendor partner, provision their shopkeeper portal access, and set base document pricing.
              </p>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 p-4 rounded-2xl mb-6 text-xs sm:text-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">error</span>
            <div>
              <p className="font-bold">Registration Failed</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-5 rounded-2xl mb-6 text-xs sm:text-sm space-y-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl shrink-0 text-emerald-500">check_circle</span>
              <div className="flex-1">
                <p className="font-bold text-base text-emerald-500">Shop Successfully Registered!</p>
                <p className="opacity-90 text-xs sm:text-sm mt-0.5">{success}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                View on Dashboard
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Shopkeeper Account */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <span className="material-symbols-outlined text-lg">person</span>
              <span>Shopkeeper Account Credentials</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <label className="text-on-surface text-xs font-semibold">Shopkeeper Full Name *</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    badge
                  </span>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface text-xs font-semibold">Email Address (Login) *</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    mail
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="shop@campusprint.com"
                    className="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface text-xs font-semibold">Portal Password *</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface text-xs font-semibold">Phone Number</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    call
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-outline-variant/30" />

          {/* Section 2: Store Details & Base Pricing */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <span className="material-symbols-outlined text-lg">storefront</span>
              <span>Shop Details & Base Print Rates</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <label className="text-on-surface text-xs font-semibold">Shop Name *</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    store
                  </span>
                  <input
                    type="text"
                    name="shop_name"
                    required
                    value={formData.shop_name}
                    onChange={handleChange}
                    placeholder="e.g. QuickPrint Solutions"
                    className="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface text-xs font-semibold">Address / Campus Landmark</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    pin_drop
                  </span>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. Building 3, FC Road Campus"
                    className="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface text-xs font-semibold">B&W Rate per page (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="price_bw"
                    required
                    value={formData.price_bw}
                    onChange={handleChange}
                    placeholder="0.50"
                    className="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-mono"
                  />
                </div>
                <span className="text-[10px] text-on-surface-variant">Default Black & White A4 single side</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-on-surface text-xs font-semibold">Color Rate per page (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="price_color"
                    required
                    value={formData.price_color}
                    onChange={handleChange}
                    placeholder="2.00"
                    className="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-primary transition-colors font-mono"
                  />
                </div>
                <span className="text-[10px] text-on-surface-variant">Default Color A4 single side</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-on-primary px-8 py-3 rounded-xl font-bold shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">autorenew</span>
                  <span>Registering Shop...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  <span>Confirm & Onboard Shop</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs sm:text-sm font-semibold border border-outline-variant/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShop;
