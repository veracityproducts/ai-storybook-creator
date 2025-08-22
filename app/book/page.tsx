"use client"

import { useState, useEffect } from "react"
import { BookReader, type BookData } from "@/components/book-reader"
import { PhonicsPatternSelector } from "@/components/phonics-pattern-selector"
import { exportBookToPDF } from "@/lib/pdf-export"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, BookOpen, Wand2, Settings } from "lucide-react"
import { toast } from "sonner"
import { PHONICS_PATTERNS, type PhonicsPattern, createPhonicsConfig } from "@/lib/phonics-patterns"

interface BookGenerationParams {
  title: string
  theme: string
  ageRange: string
  maxPages: number
  phonicsPattern: PhonicsPattern
}

export default function BookPage() {
  const [book, setBook] = useState<BookData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationParams, setGenerationParams] = useState<BookGenerationParams>({
    title: "Sam at Camp",
    theme: "Sam sets up a mat and a tent at camp",
    ageRange: "4-7",
    maxPages: 6,
    phonicsPattern: PHONICS_PATTERNS[0] // Default to first pattern (CVC Short A)
  })

  // Load sample book data for demo
  useEffect(() => {
    loadSampleBook()
  }, [])

  const loadSampleBook = async () => {
    try {
      // Try to load from our CVC smoke test first
      const response = await fetch('/api/cvc-smoke', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        if (data.ok && data.images) {
          const sampleBook: BookData = {
            title: data.title,
            theme: data.theme,
            ageRange: data.ageRange,
            pages: data.images.map((img: any) => ({
              pageIndex: img.pageIndex,
              text: img.text,
              url: img.url,
              mimeType: img.mimeType
            })),
            moral: data.story?.moral,
            costInfo: data.costInfo
          }
          setBook(sampleBook)
          return
        }
      }
    } catch (error) {
      console.error('Failed to load sample book:', error)
    }

    // Fallback to static sample data
    const fallbackBook: BookData = {
      title: "Sample Decodable Story",
      theme: "A demonstration of the book reader",
      ageRange: "4-7",
      pages: [
        {
          pageIndex: 0,
          text: "This is a sample page.",
          url: "/placeholder.svg?height=400&width=300&text=Sample+Page+1"
        },
        {
          pageIndex: 1,
          text: "Here is another page.",
          url: "/placeholder.svg?height=400&width=300&text=Sample+Page+2"
        }
      ],
      moral: "This is a sample book to demonstrate the reader interface."
    }
    setBook(fallbackBook)
  }

  const generateNewBook = async () => {
    setIsGenerating(true)
    try {
      // Create phonics config from selected pattern
      const phonicsConfig = createPhonicsConfig(generationParams.phonicsPattern.id)

      const requestBody = {
        title: generationParams.title,
        theme: generationParams.theme,
        ageRange: generationParams.ageRange,
        maxPages: generationParams.maxPages,
        // Include phonics configuration
        patternId: phonicsConfig.patternId,
        graphemesAllowed: phonicsConfig.graphemesAllowed,
        approvedWords: phonicsConfig.approvedWords,
        heartWords: phonicsConfig.heartWords,
        bannedWords: phonicsConfig.bannedWords,
        maxSentencesPerPage: phonicsConfig.maxSentencesPerPage,
        allowedPunctuation: phonicsConfig.allowedPunctuation,
        properNounsPolicy: phonicsConfig.properNounsPolicy,
        characterMappings: phonicsConfig.characterMappings
      }

      const response = await fetch('/api/compile-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.ok && data.book) {
        setBook(data.book)
        toast.success(`Book "${data.book.title}" generated successfully!`)
      } else {
        throw new Error(data.error || 'Failed to generate book')
      }
    } catch (error) {
      console.error('Error generating book:', error)
      toast.error('Failed to generate book. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportPDF = async () => {
    if (!book) return

    try {
      toast.info('Generating PDF...')
      await exportBookToPDF(book, {
        format: 'a4',
        orientation: 'portrait',
        quality: 0.9,
        includeMetadata: true
      })
      toast.success('PDF exported successfully!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export PDF. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">StoryMaker AI</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create beautiful, decodable children's books with AI-generated illustrations.
            Perfect for early readers and phonics instruction.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Generation Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Generate New Book
                </CardTitle>
                <CardDescription>
                  Create a custom decodable reader with AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Book Title</Label>
                  <Input
                    id="title"
                    value={generationParams.title}
                    onChange={(e) => setGenerationParams(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter book title..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme/Story</Label>
                  <Textarea
                    id="theme"
                    value={generationParams.theme}
                    onChange={(e) => setGenerationParams(prev => ({ ...prev, theme: e.target.value }))}
                    placeholder="Describe the story theme..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ageRange">Age Range</Label>
                    <Input
                      id="ageRange"
                      value={generationParams.ageRange}
                      onChange={(e) => setGenerationParams(prev => ({ ...prev, ageRange: e.target.value }))}
                      placeholder="e.g., 4-7"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxPages">Max Pages</Label>
                    <Input
                      id="maxPages"
                      type="number"
                      min="2"
                      max="12"
                      value={generationParams.maxPages}
                      onChange={(e) => setGenerationParams(prev => ({ ...prev, maxPages: parseInt(e.target.value) || 6 }))}
                    />
                  </div>
                </div>

                {/* Phonics Pattern Selector */}
                <div className="space-y-2">
                  <Label>Phonics Pattern</Label>
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{generationParams.phonicsPattern.name}</div>
                        <div className="text-sm text-muted-foreground">{generationParams.phonicsPattern.description}</div>
                      </div>
                      <Badge variant="secondary">{generationParams.phonicsPattern.level}</Badge>
                    </div>
                    <PhonicsPatternSelector
                      selectedPatternId={generationParams.phonicsPattern.id}
                      onPatternSelect={(pattern) => setGenerationParams(prev => ({ ...prev, phonicsPattern: pattern }))}
                    />
                  </div>
                </div>

                <Button
                  onClick={generateNewBook}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Book
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <div className="text-sm text-muted-foreground text-center">
                    This may take 1-2 minutes to generate all images...
                  </div>
                )}

                {/* Features */}
                <div className="pt-4 border-t space-y-2">
                  <h4 className="font-medium text-sm">Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">Decodable Text</Badge>
                    <Badge variant="secondary" className="text-xs">AI Illustrations</Badge>
                    <Badge variant="secondary" className="text-xs">PDF Export</Badge>
                    <Badge variant="secondary" className="text-xs">Mobile Friendly</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Book Reader */}
          <div className="lg:col-span-2">
            {book ? (
              <BookReader
                book={book}
                onExportPDF={handleExportPDF}
                className="w-full"
              />
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Loading sample book...</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>
            Powered by <strong>Imagen 4 Fast</strong> for high-quality, cost-effective image generation
          </p>
          <p>
            Built with Next.js, Tailwind CSS, and Shadcn/ui components
          </p>
        </div>
      </div>
    </div>
  )
}
