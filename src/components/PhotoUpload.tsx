import React, { useRef, useState } from 'react';

interface PhotoUploadProps {
  currentPhoto: string;
  onPhotoChange: (photo: string) => void;
  size?: number;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  currentPhoto,
  onPhotoChange,
  size = 120,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Limiter la taille à 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onPhotoChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPhotoChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      {/* Zone de photo */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-color)'}`,
          background: isDragging ? 'var(--bg-info)' : 'var(--bg-tertiary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transition: 'all 0.2s',
          position: 'relative',
        }}
      >
        {currentPhoto ? (
          <>
            <img
              src={currentPhoto}
              alt="Photo du produit"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Overlay au survol */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
                color: 'white',
                fontSize: '0.8rem',
                gap: 4,
              }}
              className="photo-overlay"
            >
              <span>📷 Changer</span>
              <button
                onClick={handleRemove}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                🗑️ Supprimer
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 8 }}>
            <div style={{ fontSize: '2rem', marginBottom: 4 }}>📷</div>
            <div style={{ fontSize: '0.75rem' }}>Ajouter une photo</div>
            <div style={{ fontSize: '0.65rem', marginTop: 2 }}>ou glisser-déposer</div>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      {currentPhoto && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-small"
            style={{ fontSize: '0.8rem' }}
          >
            📷 Changer
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="btn btn-small btn-danger"
            style={{ fontSize: '0.8rem' }}
          >
            🗑️ Supprimer
          </button>
        </div>
      )}

      <style>{`
        .photo-overlay { opacity: 0 !important; }
        div:hover > .photo-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default PhotoUpload;
