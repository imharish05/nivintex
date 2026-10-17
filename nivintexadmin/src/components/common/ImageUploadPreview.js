import { useState, useEffect, useRef } from 'react';

/**
 * Reusable image upload field with real-time image preview, file info,
 * status badge ('NEW' / 'SAVED'), and cancellation support.
 */
export default function ImageUploadPreview({
  label,
  required = false,
  note = '',
  file = null,
  existingUrl = null,
  onChange,
  onRemove,
  accept = 'image/*',
  helpText = '',
  previewMaxHeight = 140,
  className = 'km-field km-field-full',
}) {
  const [objectUrl, setObjectUrl] = useState(null);
  const inputRef = useRef(null);

  // Manage blob URL lifecycle for newly selected file
  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && onChange) {
      onChange(selected);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  const previewSrc = objectUrl || existingUrl || null;
  const isNew = Boolean(file);
  const hasImage = Boolean(previewSrc);

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const fileName = file
    ? file.name
    : existingUrl
    ? existingUrl.split('/').pop().split('?')[0]
    : '';

  return (
    <div className={className}>
      {label && (
        <label className="km-label">
          {label} {required && <span style={{ color: 'red' }}>*</span>}
          {note && (
            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--km-muted)', fontWeight: 400 }}>
              {note}
            </span>
          )}
        </label>
      )}

      {/* Real-time Preview Area */}
      {hasImage && (
        <div className="km-preview-container">
          <div className="km-preview-img-wrapper">
            <img
              src={previewSrc}
              alt="Uploaded preview"
              className="km-preview-img"
              style={{ maxHeight: previewMaxHeight }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span className={`km-preview-badge ${isNew ? 'new' : 'saved'}`}>
              {isNew ? 'NEW' : 'SAVED'}
            </span>
          </div>

          <div className="km-preview-info">
            <div className="km-preview-title" title={fileName}>
              {fileName || 'Image Preview'}
            </div>
            <div className="km-preview-meta">
              {isNew
                ? `${formatFileSize(file?.size)} · Ready to upload`
                : 'Currently saved image (click below to replace)'}
            </div>
            {isNew && (
              <button
                type="button"
                className="km-preview-remove-btn"
                onClick={handleClear}
                title="Cancel selected file"
              >
                ✕ Cancel selection
              </button>
            )}
          </div>
        </div>
      )}

      {/* Drop/Click Upload Zone */}
      <div className="km-file-zone">
        <div className="km-file-icon">🖼️</div>
        {file ? (
          <p className="km-file-selected">✓ {file.name} (Click to change)</p>
        ) : existingUrl ? (
          <p className="km-file-label">Click or drag to replace image</p>
        ) : (
          <p className="km-file-label">Click to upload image</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
        />
      </div>

      {helpText && (
        <p style={{ fontSize: 11, color: 'var(--km-muted)', marginTop: 4 }}>
          {helpText}
        </p>
      )}
    </div>
  );
}
