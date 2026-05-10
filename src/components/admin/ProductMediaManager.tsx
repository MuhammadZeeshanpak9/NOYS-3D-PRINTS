'use client';

import React, { useRef } from 'react';
import { Upload, X, ArrowUp, ArrowDown, Star, Film, Image as ImageIcon } from 'lucide-react';

export interface MediaItem {
  id?: string;            // server id, only present for already-saved media
  url: string;            // server URL or blob: preview URL
  media_type: 'image' | 'video';
  file?: File;            // pending upload (no server URL yet)
}

const MAX_IMAGES = 10;

interface Props {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
}

export function ProductMediaManager({ media, onChange }: Props) {
  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);

  const images = media.filter(m => m.media_type === 'image');
  const video = media.find(m => m.media_type === 'video');

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    const accepted = files.slice(0, remaining);

    const newItems: MediaItem[] = accepted.map(file => ({
      url: URL.createObjectURL(file),
      media_type: 'image',
      file,
    }));

    onChange([...media, ...newItems]);
    if (e.target) e.target.value = '';
  };

  const handleAddVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('Video too large. Maximum 50 MB.');
      if (e.target) e.target.value = '';
      return;
    }

    const newVideo: MediaItem = {
      url: URL.createObjectURL(file),
      media_type: 'video',
      file,
    };

    const without = media.filter(m => m.media_type !== 'video');
    onChange([...without, newVideo]);
    if (e.target) e.target.value = '';
  };

  const removeAt = (idx: number) => {
    const next = [...media];
    next.splice(idx, 1);
    onChange(next);
  };

  // Reorder among images only — video position doesn't matter for UI.
  const moveImage = (imgIdx: number, dir: -1 | 1) => {
    const others = media.filter(m => m.media_type !== 'image');
    const imgs = [...images];
    const target = imgIdx + dir;
    if (target < 0 || target >= imgs.length) return;
    [imgs[imgIdx], imgs[target]] = [imgs[target], imgs[imgIdx]];
    onChange([...imgs, ...others]);
  };

  return (
    <div className="space-y-6">
      {/* Photos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <ImageIcon size={16} /> Product Photos
            <span className="text-xs font-normal text-slate-500">
              {images.length} / {MAX_IMAGES}
            </span>
          </label>
          <button
            type="button"
            onClick={() => imgInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40 flex items-center gap-1"
          >
            <Upload size={14} /> Add photos
          </button>
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddImages}
            className="hidden"
          />
        </div>

        {images.length === 0 ? (
          <button
            type="button"
            onClick={() => imgInputRef.current?.click()}
            className="w-full flex justify-center px-6 pt-10 pb-12 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="space-y-2 text-center">
              <div className="mx-auto h-12 w-12 text-slate-400 group-hover:text-blue-500 transition-colors flex items-center justify-center bg-slate-100 rounded-full">
                <Upload size={24} />
              </div>
              <div className="text-sm text-slate-600 font-medium">
                <span className="text-blue-600">Upload photos</span> — first one is the main image
              </div>
              <p className="text-xs text-slate-500">
                PNG, JPG, WEBP. Up to {MAX_IMAGES} images.
              </p>
            </div>
          </button>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, i) => {
              const overallIdx = media.indexOf(img);
              return (
                <div
                  key={img.id ?? img.url}
                  className={`relative group rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'} bg-slate-50 aspect-square`}
                >
                  <img src={img.url} alt="" className="object-cover w-full h-full" />

                  {i === 0 && (
                    <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      <Star size={10} fill="currentColor" /> Main
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                      title="Move left"
                      className="p-1.5 bg-white/90 rounded-full text-slate-700 hover:bg-white disabled:opacity-30"
                    >
                      <ArrowUp size={14} className="-rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(i, 1)}
                      disabled={i === images.length - 1}
                      title="Move right"
                      className="p-1.5 bg-white/90 rounded-full text-slate-700 hover:bg-white disabled:opacity-30"
                    >
                      <ArrowDown size={14} className="-rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAt(overallIdx)}
                      title="Remove"
                      className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-slate-300 border-dashed hover:bg-slate-50 hover:border-blue-400 transition-colors flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-blue-500"
              >
                <Upload size={20} />
                <span className="text-xs font-semibold">Add</span>
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-slate-500">
          The first photo is shown on shop listings and in the cart. Hover a photo to reorder or remove.
        </p>
      </div>

      {/* Video */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Film size={16} /> Turntable Video
            <span className="text-xs font-normal text-slate-500">optional</span>
          </label>
          {!video && (
            <button
              type="button"
              onClick={() => vidInputRef.current?.click()}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Upload size={14} /> Upload video
            </button>
          )}
          <input
            ref={vidInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleAddVideo}
            className="hidden"
          />
        </div>

        {video ? (
          <div className="relative rounded-lg overflow-hidden border-2 border-slate-200 bg-black max-w-md">
            <video src={video.url} controls className="w-full" />
            <button
              type="button"
              onClick={() => removeAt(media.indexOf(video))}
              className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 shadow"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => vidInputRef.current?.click()}
            className="w-full flex justify-center px-6 py-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors text-slate-500 hover:text-blue-600 text-sm font-medium"
          >
            <Film size={18} className="mr-2" /> Add 360° turntable video — MP4 / WebM / MOV up to 50 MB
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Walk a MediaItem[] and upload anything still pointing at a blob: URL.
 * Returns the same array with `file` removed and `url` swapped for the
 * uploaded server URL.
 */
export async function uploadPendingMedia(
  media: MediaItem[],
  apiClient: { post: (url: string, body: FormData, opts: any) => Promise<{ data: { url: string } }> }
): Promise<{ url: string; media_type: 'image' | 'video'; sort_order: number }[]> {
  const result: { url: string; media_type: 'image' | 'video'; sort_order: number }[] = [];

  for (let i = 0; i < media.length; i++) {
    const item = media[i];
    let finalUrl = item.url;

    if (item.file) {
      const fd = new FormData();
      fd.append('file', item.file);
      const endpoint = item.media_type === 'video' ? '/upload/video' : '/upload/image';
      const res = await apiClient.post(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      finalUrl = res.data.url;
    }

    result.push({
      url: finalUrl,
      media_type: item.media_type,
      sort_order: i,
    });
  }

  return result;
}
