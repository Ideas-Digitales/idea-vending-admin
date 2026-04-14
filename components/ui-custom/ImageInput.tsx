'use client';

import { useEffect, useRef, useState } from 'react';
import { validateImageFile } from '@/lib/utils/imageUpload';

interface ImageInputProps {
  label?: string;
  hint?: string;
  previewAlt?: string;
  currentImageUrl?: string | null;
  disabled?: boolean;
  onChange: (file: File | null) => void;
}

export default function ImageInput({
  label,
  hint,
  previewAlt = 'Vista previa',
  currentImageUrl,
  disabled = false,
  onChange,
}: ImageInputProps) {
  const inputRef                        = useRef<HTMLInputElement>(null);
  const [preview, setPreview]           = useState<string | null>(currentImageUrl ?? null);
  const [error, setError]               = useState<string | null>(null);
  const [isCurrentUrl, setIsCurrentUrl] = useState(!!currentImageUrl);

  // Sync preview if the parent resets currentImageUrl (e.g. after modal open)
  useEffect(() => {
    if (currentImageUrl) {
      setPreview(currentImageUrl);
      setIsCurrentUrl(true);
    }
  }, [currentImageUrl]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setError(null);
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      return;
    }

    setError(null);
    setIsCurrentUrl(false);

    const objectUrl = URL.createObjectURL(file);
    setPreview(prev => {
      if (prev && !isCurrentUrl) URL.revokeObjectURL(prev);
      return objectUrl;
    });

    onChange(file);
  }

  useEffect(() => {
    return () => {
      if (preview && !isCurrentUrl) URL.revokeObjectURL(preview);
    };
  }, []);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        disabled={disabled}
        className="input-field"
      />

      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}

      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}

      {preview && (
        <img
          src={preview}
          alt={previewAlt}
          className="mt-2 h-32 w-full rounded-xl border border-gray-200 object-cover"
        />
      )}
    </div>
  );
}
