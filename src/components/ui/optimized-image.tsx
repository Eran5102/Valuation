'use client'

import Image, { ImageProps } from 'next/image'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { createLazyLoader } from '@/lib/performance-utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallback?: string
  lazy?: boolean
  blur?: boolean
  aspectRatio?: number
  onLoad?: () => void
  onError?: () => void
  wrapperClassName?: string
}

export function OptimizedImage({
  src,
  alt,
  fallback = '/images/placeholder.svg',
  lazy = true,
  blur = true,
  aspectRatio,
  onLoad,
  onError,
  className,
  wrapperClassName,
  priority = false,
  quality = 75,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(!lazy)

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) {
      setIsInView(true)
      return
    }

    const observer = createLazyLoader(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
          }
        })
      },
      { rootMargin: '50px' }
    )

    const element = document.querySelector(`[data-image-id="${src}"]`)
    if (element && observer) {
      observer.observe(element)
      return () => observer.disconnect()
    }
  }, [src, lazy, priority])

  const handleLoad = () => {
    setIsLoading(false)
    setIsError(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setIsError(true)
    setImgSrc(fallback)
    onError?.()
  }

  // Wrapper styles for aspect ratio
  const wrapperStyle = aspectRatio
    ? { position: 'relative' as const, paddingBottom: `${(1 / aspectRatio) * 100}%` }
    : {}

  return (
    <div
      className={cn('relative overflow-hidden', wrapperClassName)}
      style={wrapperStyle}
      data-image-id={src}
    >
      {isInView ? (
        <>
          {isLoading && !isError && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <Image
            src={imgSrc}
            alt={alt}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
            quality={quality}
            priority={priority}
            placeholder={blur ? 'blur' : 'empty'}
            {...props}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  )
}

// Responsive Image Component
interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'sizes'> {
  mobileSrc?: string
  tabletSrc?: string
  desktopSrc?: string
}

export function ResponsiveImage({
  src,
  mobileSrc,
  tabletSrc,
  desktopSrc,
  alt,
  ...props
}: ResponsiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src)

  useEffect(() => {
    const updateSrc = () => {
      const width = window.innerWidth
      if (width < 640 && mobileSrc) {
        setCurrentSrc(mobileSrc)
      } else if (width < 1024 && tabletSrc) {
        setCurrentSrc(tabletSrc)
      } else if (desktopSrc) {
        setCurrentSrc(desktopSrc)
      } else {
        setCurrentSrc(src)
      }
    }

    updateSrc()
    window.addEventListener('resize', updateSrc)
    return () => window.removeEventListener('resize', updateSrc)
  }, [src, mobileSrc, tabletSrc, desktopSrc])

  return (
    <OptimizedImage
      src={currentSrc}
      alt={alt}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      {...props}
    />
  )
}

// Background Image Component
interface BackgroundImageProps {
  src: string
  alt?: string
  overlay?: boolean
  overlayOpacity?: number
  children?: React.ReactNode
  className?: string
}

export function BackgroundImage({
  src,
  alt = '',
  overlay = false,
  overlayOpacity = 0.5,
  children,
  className
}: BackgroundImageProps) {
  return (
    <div className={cn('relative', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        quality={90}
        priority
      />
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  )
}

// Avatar Component with optimization
interface AvatarImageProps {
  src?: string
  alt: string
  fallbackText?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function AvatarImage({
  src,
  alt,
  fallbackText,
  size = 'md',
  className
}: AvatarImageProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const sizePixels = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64
  }

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold',
          sizeClasses[size],
          className
        )}
      >
        {fallbackText || alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <div className={cn('relative rounded-full overflow-hidden', sizeClasses[size], className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={sizePixels[size]}
        height={sizePixels[size]}
        className="object-cover"
        priority
      />
    </div>
  )
}

// Gallery Component with lazy loading
interface GalleryImageProps {
  images: { src: string; alt: string; caption?: string }[]
  columns?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ImageGallery({
  images,
  columns = 3,
  gap = 'md',
  className
}: GalleryImageProps) {
  const columnClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
      {images.map((image, index) => (
        <figure key={index} className="relative">
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            width={400}
            height={300}
            className="rounded-lg"
            lazy
            priority={index < 3} // Prioritize first 3 images
          />
          {image.caption && (
            <figcaption className="mt-2 text-sm text-muted-foreground text-center">
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}