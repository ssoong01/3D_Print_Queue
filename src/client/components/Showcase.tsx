import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';

interface ShowcaseImage {
  _id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  imageUrl: string;
  isUpload: boolean;
  caption?: string;
  createdAt: string;
}

const Showcase: React.FC = () => {
  const { user } = useUser();
  const [images, setImages] = useState<ShowcaseImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ShowcaseImage | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, [page]);

  const fetchImages = async () => {
    try {
      const response = await fetch(`/api/showcase?page=${page}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch showcase images');

      const data = await response.json();
      setImages(data.images);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to upload images');
        return;
      }

      if (uploadType === 'file') {
        if (!selectedFile) {
          setError('Please select a file');
          return;
        }

        const formData = new FormData();
        formData.append('image', selectedFile);
        if (caption) formData.append('caption', caption);

        const response = await fetch('/api/showcase/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to upload image');
        }
      } else {
        if (!imageUrl) {
          setError('Please enter an image URL');
          return;
        }

        const response = await fetch('/api/showcase', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageUrl, caption })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add image');
        }
      }

      // Reset form
      setShowUploadModal(false);
      setImageUrl('');
      setCaption('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Refresh gallery
      setPage(1);
      fetchImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/showcase/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete image');
      }

      fetchImages();
      if (selectedImage?._id === imageId) {
        setSelectedImage(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  const canDelete = (image: ShowcaseImage): boolean => {
    if (!user) return false;
    return user.isAdmin || image.userId === user.id;
  };

  if (loading) return <div className="loading">Loading showcase...</div>;

  return (
    <div className="showcase-container">
      <div className="showcase-header">
        <h1>Showcase Gallery</h1>
        {user && (
          <button 
            className="button button-primary add-image-btn"
            onClick={() => setShowUploadModal(true)}
          >
            + Add Image
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {images.length === 0 ? (
        <div className="empty-state">
          <p>No images in the showcase yet.</p>
          {user && <p>Be the first to add one!</p>}
        </div>
      ) : (
        <>
          <div className="showcase-gallery">
            {images.map((image) => (
              <div 
                key={image._id} 
                className="gallery-item"
                onClick={() => setSelectedImage(image)}
              >
                <img 
                  src={image.imageUrl} 
                  alt={image.caption || 'Showcase image'}
                  loading="lazy"
                  onError={(e) => {
                    console.error('Image failed to load:', image.imageUrl);
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="14"%3EImage Not Found%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="gallery-item-overlay">
                  <div className="gallery-item-info">
                    <span className="gallery-author">{image.userDisplayName}</span>
                    {image.caption && (
                      <span className="gallery-caption">{image.caption}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="button button-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                className="button button-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Image to Showcase</h2>
              <button 
                className="modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>

            <div className="upload-type-selector">
              <button
                className={`type-btn ${uploadType === 'file' ? 'active' : ''}`}
                onClick={() => setUploadType('file')}
              >
                Upload File
              </button>
              <button
                className={`type-btn ${uploadType === 'url' ? 'active' : ''}`}
                onClick={() => setUploadType('url')}
              >
                Image URL
              </button>
            </div>

            <form onSubmit={handleUpload}>
              {uploadType === 'file' ? (
                <div className="form-group">
                  <label htmlFor="image-file">Select Image:</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="image-file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    required
                  />
                  {selectedFile && (
                    <div className="file-preview">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="image-url">Image URL:</label>
                  <input
                    type="url"
                    id="image-url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="caption">Caption (optional):</label>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption for your image..."
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="button cancel-btn"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="button button-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image View Modal */}
      {selectedImage && (
        <div className="modal-overlay image-modal" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            
            <img 
              src={selectedImage.imageUrl} 
              alt={selectedImage.caption || 'Showcase image'}
              onError={(e) => {
                console.error('Modal image failed to load:', selectedImage.imageUrl);
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23333" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="20"%3EImage Not Found%3C/text%3E%3C/svg%3E';
              }}
            />
            
            <div className="image-modal-info">
              <div className="image-details">
                <strong>{selectedImage.userDisplayName}</strong>
                <span className="image-date">
                  {new Date(selectedImage.createdAt).toLocaleDateString()}
                </span>
              </div>
              {selectedImage.caption && (
                <p className="image-caption">{selectedImage.caption}</p>
              )}
              {canDelete(selectedImage) && (
                <button
                  className="button button-danger button-sm"
                  onClick={() => handleDelete(selectedImage._id)}
                >
                  Delete Image
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Showcase;