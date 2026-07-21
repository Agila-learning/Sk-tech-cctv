'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Star, Upload, X, Check, Shield } from 'lucide-react';

export default function ReviewForm({ orderId, productId, technicianId, variant, onSuccess, onCancel }: any) {
  const [formData, setFormData] = useState({
    title: '',
    comment: '',
    rating: 5,
    productRating: 5,
    installationRating: 5,
    technicianRating: 5,
    valueForMoney: 5,
    easyToUse: 5,
    recommendProduct: true,
    isAnonymous: false,
    images: [] as string[],
    videoUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRatingChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: any) => {
    if (formData.images.length >= 5) {
      setError('Maximum 5 images allowed.');
      return;
    }
    const files = Array.from(e.target.files);
    // Dummy local URL creation for demo. Real app uploads to cloud storage.
    const newImages = files.map(file => URL.createObjectURL(file as Blob));
    setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages].slice(0, 5) }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await axios.post('/api/reviews', {
        orderId,
        technician: technicianId,
        product: productId,
        variant,
        ...formData
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingStars = (field: keyof typeof formData, label: string, description: string) => (
    <div className="mb-6 bg-white/40 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200">{label}</h4>
          {description && <p className="text-xs font-medium text-slate-500">{description}</p>}
        </div>
        <div className="flex text-amber-400 gap-1 cursor-pointer">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={28}
              onClick={() => handleRatingChange(field, star)}
              className={`transition-all hover:scale-110 ${star <= (formData[field] as number) ? 'fill-current text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-300 dark:text-slate-600'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-white/50 dark:border-slate-800/80">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="w-14 h-14 rounded-full bg-emerald-100/80 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
          <Shield size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Verified Review</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Your feedback helps others make better choices.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl border border-red-200/50 dark:border-red-800/50 text-sm font-bold flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Ratings */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Rate your experience</h3>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
            {renderRatingStars('rating', 'Overall Rating', 'How was your overall experience?')}
            {renderRatingStars('productRating', 'Product Quality', 'Rate the build and features.')}
            {renderRatingStars('installationRating', 'Installation', 'How smooth was the setup?')}
            {renderRatingStars('technicianRating', 'Technician', 'Professionalism & expertise.')}
            {renderRatingStars('valueForMoney', 'Value for Money', 'Was it worth the price?')}
            {renderRatingStars('easyToUse', 'Ease of Use', 'Is the product user-friendly?')}
          </div>
        </div>

        {/* Text Fields */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Review Title</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Excellent picture quality and great service!"
              className="w-full px-5 py-3.5 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white font-medium shadow-inner transition-shadow"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Detailed Review</label>
            <textarea 
              required
              rows={4}
              placeholder="Tell us more about your experience..."
              className="w-full px-5 py-3.5 rounded-xl bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white font-medium shadow-inner transition-shadow resize-none"
              value={formData.comment}
              onChange={e => setFormData({...formData, comment: e.target.value})}
            />
          </div>
        </div>

        {/* Media Uploads */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Add Photos (Max 5)</label>
          <div className="flex flex-wrap gap-4">
            {formData.images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 group shadow-sm">
                <img src={img} className="w-full h-full object-cover" alt="upload preview" />
                <button 
                  type="button" 
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {formData.images.length < 5 && (
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-white/30 dark:bg-slate-900/30">
                <Upload size={20} className="mb-1" />
                <span className="text-xs font-bold">Upload</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col sm:flex-row gap-6 p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
          <label className="flex items-center gap-3 cursor-pointer group flex-1">
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.recommendProduct ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.recommendProduct ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">I recommend this product</span>
            <input type="checkbox" className="hidden" checked={formData.recommendProduct} onChange={e => setFormData({...formData, recommendProduct: e.target.checked})} />
          </label>
          <div className="w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
          <label className="flex items-center gap-3 cursor-pointer group flex-1">
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.isAnonymous ? 'bg-slate-800 dark:bg-slate-400' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.isAnonymous ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Submit Anonymously</span>
            <input type="checkbox" className="hidden" checked={formData.isAnonymous} onChange={e => setFormData({...formData, isAnonymous: e.target.checked})} />
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 mt-2 border-t border-slate-200 dark:border-slate-800">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-6 py-3 rounded-full font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            {submitting ? 'Submitting...' : <><Check size={18} /> Submit Review</>}
          </button>
        </div>
      </form>
    </div>
  );
}
