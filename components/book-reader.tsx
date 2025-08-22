"use client"

import * as React from "react"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Download, BookOpen, Maximize2, Minimize2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface BookPage {
  pageIndex: number
  text: string
  url: string
  mimeType?: string
}

export interface BookData {
  title: string
  theme?: string
  ageRange?: string
  pages: BookPage[]
  moral?: string
  costInfo?: {
    imagesGenerated: number
    costPerImage: number
    totalImageCost: number
    currency: string
    model: string
  }
}

interface BookReaderProps {
  book: BookData
  className?: string
  onExportPDF?: () => void
}

export function BookReader({ book, className, onExportPDF }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({})

  const totalPages = book.pages.length
  const isFirstPage = currentPage === 0
  const isLastPage = currentPage === totalPages - 1

  const nextPage = () => {
    if (!isLastPage) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (!isFirstPage) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleImageLoad = (pageIndex: number) => {
    setImageLoading(prev => ({ ...prev, [pageIndex]: false }))
  }

  const handleImageLoadStart = (pageIndex: number) => {
    setImageLoading(prev => ({ ...prev, [pageIndex]: true }))
  }

  const currentPageData = book.pages[currentPage]

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <Card className={cn(
        "transition-all duration-300",
        isFullscreen && "fixed inset-4 z-50 max-w-none mx-0"
      )}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl md:text-2xl">{book.title}</CardTitle>
                {book.theme && (
                  <p className="text-sm text-muted-foreground mt-1">{book.theme}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {book.ageRange && (
                <Badge variant="secondary">{book.ageRange}</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              {onExportPDF && (
                <Button variant="outline" size="sm" onClick={onExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Page Display */}
          <div className="relative">
            <div className="aspect-[3/4] bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden shadow-inner">
              {currentPageData && (
                <>
                  {imageLoading[currentPage] && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                  <img
                    src={currentPageData.url}
                    alt={`Page ${currentPage + 1}: ${currentPageData.text}`}
                    className="w-full h-full object-cover"
                    onLoadStart={() => handleImageLoadStart(currentPage)}
                    onLoad={() => handleImageLoad(currentPage)}
                    onError={() => handleImageLoad(currentPage)}
                  />
                </>
              )}
            </div>

            {/* Page Text Overlay */}
            {currentPageData && (
              <div className="mt-4 p-4 bg-white/90 backdrop-blur-sm rounded-lg border">
                <p className="text-lg md:text-xl font-medium text-center leading-relaxed">
                  {currentPageData.text}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevPage}
              disabled={isFirstPage}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              
              {/* Page Dots */}
              <div className="flex gap-1 mx-4">
                {book.pages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === currentPage 
                        ? "bg-primary" 
                        : "bg-muted hover:bg-muted-foreground/50"
                    )}
                    aria-label={`Go to page ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={nextPage}
              disabled={isLastPage}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Book Info */}
          {(book.moral || book.costInfo) && (
            <div className="pt-4 border-t space-y-3">
              {book.moral && (
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Moral of the Story</p>
                  <p className="text-base italic">{book.moral}</p>
                </div>
              )}
              
              {book.costInfo && (
                <div className="text-center text-xs text-muted-foreground">
                  Generated with {book.costInfo.model} • {book.costInfo.imagesGenerated} images • 
                  ${book.costInfo.totalImageCost.toFixed(2)} {book.costInfo.currency}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
