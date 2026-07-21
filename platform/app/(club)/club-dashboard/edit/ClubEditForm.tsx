'use client';

import { createBrowserClient } from '@supabase/ssr';
import { CheckCircle2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import type { Club } from '@/types/sessionpro';

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise(resolve => { image.onload = resolve; });
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.92));
}

type Props = { club: Club };

export function ClubEditForm({ club }: Props) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description ?? '');

  const existingLogoUrl = club.logo_path
    ? club.logo_path.startsWith('/')
      ? club.logo_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pro-media/${club.logo_path}`
    : null;
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(existingLogoUrl);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropSrc(URL.createObjectURL(file));
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function applyCrop() {
    if (!cropSrc || !croppedAreaPixels) return;
    const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
    setLogoFile(new File([blob], 'logo.jpg', { type: 'image/jpeg' }));
    setLogoPreview(URL.createObjectURL(blob));
    setCropSrc(null);
  }

  async function handleSave() {
    setError('');
    if (!name.trim()) {
      setError('Club name is required.');
      return;
    }
    setSaving(true);

    const updates: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
    };

    if (logoFile) {
      const storagePath = `clubs/${club.id}/logo.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('pro-media')
        .upload(storagePath, logoFile, { upsert: true });
      if (uploadError) {
        setError('Logo upload failed: ' + uploadError.message);
        setSaving(false);
        return;
      }
      updates.logo_path = storagePath;
    }

    const { error: updateError } = await supabase.from('clubs').update(updates).eq('id', club.id);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <div className="admin-card" style={{ padding: 24, maxWidth: 520 }}>
      <div className="form-field">
        <label className="form-label" htmlFor="club-name">Club name</label>
        <input id="club-name" type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="club-description">Description</label>
        <textarea id="club-description" className="form-input form-textarea" value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div className="form-field">
        <label className="form-label">Logo</label>
        <div className="photo-upload-row">
          {logoPreview ? (
            <div className="photo-upload-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoPreview} alt="Preview" />
            </div>
          ) : (
            <div className="photo-upload-placeholder">
              {name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
            </div>
          )}
          <div>
            <label htmlFor="club-logo" className="button" style={{ cursor: 'pointer', fontSize: 14, minHeight: 38, padding: '0 16px' }}>
              {logoPreview ? 'Change logo' : 'Upload logo'}
            </label>
            <input id="club-logo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} style={{ display: 'none' }} />
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)' }}>JPEG, PNG or WebP · Max 5 MB</p>
          </div>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="edit-save-row">
        {saved && (
          <span className="edit-saved-label">
            <CheckCircle2 size={15} /> Saved
          </span>
        )}
        <button className="button button-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 130 }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {cropSrc && (
        <div className="crop-modal-overlay">
          <div className="crop-modal">
            <div className="crop-modal-header">Adjust your logo</div>
            <div className="crop-area">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="crop-controls">
              <div className="crop-zoom-row">
                <label>Zoom</label>
                <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} />
              </div>
              <div className="crop-actions">
                <button className="button" onClick={() => setCropSrc(null)}>Cancel</button>
                <button className="button button-primary" onClick={applyCrop}>Apply crop</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
