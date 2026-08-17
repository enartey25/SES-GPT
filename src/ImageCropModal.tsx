import React, { useState, useRef, useEffect, useCallback } from 'react'

interface ImageCropModalProps {
  imageSrc: string
  onCrop: (croppedBase64: string) => void
  onClose: () => void
}

const CROP_DIAMETER = 200 // Visual circular crop diameter in px
const EXPORT_SIZE = 512   // High-res output size in px

export default function ImageCropModal({ imageSrc, onCrop, onClose }: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  const imageRef = useRef<HTMLImageElement | null>(null)

  // Reset state on new image
  useEffect(() => {
    setZoom(1.0)
    setRotation(0)
    setPan({ x: 0, y: 0 })
  }, [imageSrc])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    setImgNaturalSize({ w: naturalWidth, h: naturalHeight })
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
  }

  // Base dimensions calculation: scale image so it comfortably fits the crop circle at 1.0x zoom
  let baseWidth = CROP_DIAMETER
  let baseHeight = CROP_DIAMETER
  if (imgNaturalSize.w > 0 && imgNaturalSize.h > 0) {
    const aspect = imgNaturalSize.w / imgNaturalSize.h
    if (aspect >= 1) {
      // Landscape or square: match height to crop circle, width is larger
      baseHeight = CROP_DIAMETER
      baseWidth = CROP_DIAMETER * aspect
    } else {
      // Portrait: match width to crop circle, height is larger
      baseWidth = CROP_DIAMETER
      baseHeight = CROP_DIAMETER / aspect
    }
  }

  const displayedWidth = baseWidth * zoom
  const displayedHeight = baseHeight * zoom

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.002
    setZoom(prev => Math.min(3.0, Math.max(1.0, prev + delta)))
  }

  const handleRotate = () => {
    setRotation(r => (r + 90) % 360)
  }

  const handleReset = () => {
    setZoom(1.0)
    setRotation(0)
    setPan({ x: 0, y: 0 })
  }

  const handleSaveCrop = useCallback(() => {
    const img = imageRef.current
    if (!img || imgNaturalSize.w === 0 || imgNaturalSize.h === 0) return

    const canvas = document.createElement('canvas')
    canvas.width = EXPORT_SIZE
    canvas.height = EXPORT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)

    // Clip to smooth circle
    ctx.beginPath()
    ctx.arc(EXPORT_SIZE / 2, EXPORT_SIZE / 2, EXPORT_SIZE / 2, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.clip()

    ctx.save()

    // Translate to center of canvas
    ctx.translate(EXPORT_SIZE / 2, EXPORT_SIZE / 2)
    ctx.rotate((rotation * Math.PI) / 180)

    // Scale factor from visual preview (CROP_DIAMETER) to export canvas (EXPORT_SIZE)
    const exportScale = EXPORT_SIZE / CROP_DIAMETER
    const drawW = baseWidth * zoom * exportScale
    const drawH = baseHeight * zoom * exportScale
    const drawX = pan.x * exportScale
    const drawY = pan.y * exportScale

    ctx.drawImage(img, drawX - drawW / 2, drawY - drawH / 2, drawW, drawH)
    ctx.restore()

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.94)
    onCrop(croppedDataUrl)
  }, [baseWidth, baseHeight, zoom, rotation, pan, imgNaturalSize, onCrop])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#ffffff] border border-[#d9d9d9] rounded-[20px] max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 text-[#1e1e1e] font-['Inter',sans-serif]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5]">
          <div>
            <h3 className="text-[16px] font-[700] text-[#1e1e1e]">Adjust Profile Photo</h3>
            <p className="text-[12px] text-[#757575] mt-0.5">Drag to center, slide or scroll to zoom</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#757575] hover:text-[#1e1e1e] p-1.5 rounded-full hover:bg-[#f0f0f0] transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Viewport Box */}
        <div
          className="relative w-full h-[280px] bg-[#121212] rounded-[14px] overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Inner Image (Initial scale perfectly sized to the circle) */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Preview"
            onLoad={handleImageLoad}
            style={{
              width: `${displayedWidth}px`,
              height: `${displayedHeight}px`,
              transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
            }}
            className="max-w-none max-h-none pointer-events-none object-cover select-none"
            draggable={false}
          />

          {/* Circular Crop Guide Mask */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              style={{ width: `${CROP_DIAMETER}px`, height: `${CROP_DIAMETER}px` }}
              className="rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3.5">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-[500] text-[#757575] w-12">Zoom</span>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.02"
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-[#1e1e1e] cursor-pointer"
            />
            <span className="text-[12px] font-mono text-[#757575] w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#f5f5f5] hover:bg-[#eaeaea] text-[#1e1e1e] text-[12px] font-[500] border border-[#d9d9d9] transition-colors cursor-pointer"
                title="Rotate 90 degrees"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1.5 rounded-[6px] text-[#757575] hover:text-[#1e1e1e] text-[12px] font-[500] transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-full text-[13px] font-[500] text-[#757575] hover:bg-[#f0f0f0] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCrop}
                className="px-5 py-1.5 rounded-full bg-[#1e1e1e] text-white text-[13px] font-[600] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
