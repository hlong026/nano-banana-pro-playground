"use client"

import type React from "react"
import { X, Plus, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiImageUploadProps {
  images: string[]
  maxImages: number
  onAdd: () => void
  onRemove: (index: number) => void
  onImageClick: (url: string) => void
  disabled?: boolean
}

export function MultiImageUpload({
  images,
  maxImages,
  onAdd,
  onRemove,
  onImageClick,
  disabled = false,
}: MultiImageUploadProps) {
  const canAddMore = images.length < maxImages

  return (
    <div className="space-y-2 overflow-hidden">
      <div className="grid grid-cols-4 gap-2 auto-rows-fr">
        {images.map((preview, index) => (
          <div
            key={`image-${index}-${preview.slice(-20)}`}
            className="relative aspect-square bg-black/50 border border-gray-600 rounded overflow-hidden group cursor-pointer"
            onClick={() => onImageClick(preview)}
          >
            <img
              src={preview}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(index)
              }}
              className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
              {index + 1}
            </div>
          </div>
        ))}
        
        {canAddMore && (
          <button
            onClick={onAdd}
            disabled={disabled}
            className={cn(
              "aspect-square bg-black/30 border-2 border-dashed border-gray-600 rounded flex flex-col items-center justify-center gap-1 hover:border-white hover:bg-black/50 transition-all",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Plus className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400">Add</span>
          </button>
        )}
      </div>
      
      <div className="text-xs text-gray-400 text-center">
        {images.length} / {maxImages} images
      </div>
    </div>
  )
}
