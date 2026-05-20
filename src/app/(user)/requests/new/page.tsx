'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Category = {
  value: string;
  label: string;
};

const categories: Category[] = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'other', label: 'Other' },
];

export default function NewRequestPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 3) {
      setToast({
        message: 'You can upload a maximum of 3 images',
        type: 'error',
      });
      return;
    }
    const newImages = [...images, ...files];
    setImages(newImages);

    // Create previews
    const previews: string[] = [];
    newImages.forEach((file) => {
      previews.push(URL.createObjectURL(file));
    });
    setImagePreviews(previews);

    // Reset input
    e.target.value = '';
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    // Revoke object URL to prevent memory leak
    URL.revokeObjectURL(imagePreviews[index]);

    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [imagePreviews]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !category || !description.trim()) {
      setToast({
        message: 'Please fill in all required fields',
        type: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description.trim());

      images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch('/api/user/requests', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setToast({
        message: 'Request submitted successfully!',
        type: 'success',
      });

      // Reset form
      setTitle('');
      setCategory('');
      setDescription('');
      setImages([]);
      setImagePreviews([]);

      // Revoke object URLs
      imagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
      setImagePreviews([]);

      // Redirect to requests page after 2 seconds
      setTimeout(() => {
        router.push('/user/requests');
      }, 2000);
    } catch (error) {
      setToast({
        message: 'Failed to submit request. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-h1 text-h1 text-on-surface flex items-center gap-3 text-3xl font-bold">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              add_circle
            </span>
            Submit New Request
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
            Report an issue or describe a system flow that needs attention.
          </p>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`mb-6 px-4 py-3 rounded-lg flex items-start gap-3 ${
            toast.type === 'success'
              ? 'bg-secondary-container text-on-secondary-container'
              : 'bg-error-container text-on-error-container'
          }`}>
            <span
              className="material-symbols-outlined flex-shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <div>
              <p className="font-label-md text-label-md">{toast.message}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="font-label-md text-label-md text-on-surface mb-2 block">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Briefly describe the issue"
                className="block w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-text-on-surface placeholder:text-on-surface-variant/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="font-label-md text-label-md text-on-surface mb-2 block">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-text-on-surface placeholder:text-on-surface-variant/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="font-label-md text-label-md text-on-surface mb-2 block">
                Detailed Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail, including location, severity, and any relevant information"
                rows={4}
                className="block w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-text-on-surface placeholder:text-on-surface-variant/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
                required
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="font-label-md text-label-md text-on-surface mb-2 block">
                Images (max 3)
              </label>
              <div className="border-2 border-dashed border-outline-variant rounded-lg p-6 text-center cursor-pointer hover:bg-surface-container-low transition-colors"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <span className="material-symbols-outlined text-outline/60 mb-2 block" style={{ fontSize: '36px' }}>
                  upload_file
                </span>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  Click to upload or drag and drop
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant/60 mt-1">
                  Maximum 3 images, JPG/PNG format
                </p>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative w-24 h-24">
                      <img
                        src={preview}
                        alt="Preview"
                        className="object-cover w-full h-full rounded-lg border border-outline-variant"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-error text-on-error text-xs hover:bg-error/80 transition-colors"
                        aria-label="Remove image"
                      >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                          close
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center px-6 py-3 rounded-lg font-label-md text-label-md transition-colors hover:bg-primary/90 ${
                  loading
                    ? 'bg-secondary/50 cursor-not-allowed'
                    : 'bg-secondary text-on-secondary hover:bg-primary'
                }`}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'FILL' 1", animation: 'spin 1s linear infinite' }}>
                      refreshing
                    </span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                      send
                    </span>
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}