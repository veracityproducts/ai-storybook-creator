"use client"

import * as React from "react"
import { useState } from "react"
import { Check, ChevronDown, BookOpen, Target, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { PHONICS_PATTERNS, type PhonicsPattern } from "@/lib/phonics-patterns"

interface PhonicsPatternSelectorProps {
  selectedPatternId?: string
  onPatternSelect: (pattern: PhonicsPattern) => void
  className?: string
}

export function PhonicsPatternSelector({ 
  selectedPatternId, 
  onPatternSelect, 
  className 
}: PhonicsPatternSelectorProps) {
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({
    beginner: true,
    intermediate: false,
    advanced: false
  })

  const toggleLevel = (level: string) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }))
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "beginner": return <Target className="h-4 w-4 text-green-600" />
      case "intermediate": return <BookOpen className="h-4 w-4 text-yellow-600" />
      case "advanced": return <Users className="h-4 w-4 text-red-600" />
      default: return null
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner": return "bg-green-50 border-green-200"
      case "intermediate": return "bg-yellow-50 border-yellow-200"
      case "advanced": return "bg-red-50 border-red-200"
      default: return "bg-gray-50 border-gray-200"
    }
  }

  const groupedPatterns = PHONICS_PATTERNS.reduce((acc, pattern) => {
    if (!acc[pattern.level]) {
      acc[pattern.level] = []
    }
    acc[pattern.level].push(pattern)
    return acc
  }, {} as Record<string, PhonicsPattern[]>)

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Select Phonics Pattern</h3>
        <p className="text-sm text-muted-foreground">
          Choose the phonics pattern that matches your students' reading level
        </p>
      </div>

      {Object.entries(groupedPatterns).map(([level, patterns]) => (
        <Collapsible
          key={level}
          open={expandedLevels[level]}
          onOpenChange={() => toggleLevel(level)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-between p-4 h-auto",
                getLevelColor(level)
              )}
            >
              <div className="flex items-center gap-3">
                {getLevelIcon(level)}
                <div className="text-left">
                  <div className="font-medium capitalize">{level} Level</div>
                  <div className="text-sm text-muted-foreground">
                    {patterns.length} pattern{patterns.length !== 1 ? 's' : ''} available
                  </div>
                </div>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                expandedLevels[level] && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-2 mt-2">
            {patterns.map((pattern) => (
              <Card
                key={pattern.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedPatternId === pattern.id && "ring-2 ring-primary bg-primary/5"
                )}
                onClick={() => onPatternSelect(pattern)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {pattern.name}
                        {selectedPatternId === pattern.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {pattern.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Ages {pattern.ageRange}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {/* Pattern Details */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-muted-foreground">Graphemes:</span>
                      <div className="mt-1">
                        {pattern.config.graphemesAllowed.slice(0, 8).join(", ")}
                        {pattern.config.graphemesAllowed.length > 8 && "..."}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Word Count:</span>
                      <div className="mt-1">
                        {pattern.config.approvedWords.length} approved words
                      </div>
                    </div>
                  </div>

                  {/* Example Words */}
                  <div>
                    <span className="font-medium text-muted-foreground text-xs">Example Words:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {pattern.config.approvedWords.slice(0, 6).map((word) => (
                        <Badge key={word} variant="outline" className="text-xs px-2 py-0">
                          {word}
                        </Badge>
                      ))}
                      {pattern.config.approvedWords.length > 6 && (
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          +{pattern.config.approvedWords.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Example Sentences */}
                  <div>
                    <span className="font-medium text-muted-foreground text-xs">Example Sentences:</span>
                    <div className="mt-1 space-y-1">
                      {pattern.examples.slice(0, 2).map((example, index) => (
                        <div key={index} className="text-xs italic text-gray-600 bg-gray-50 p-2 rounded">
                          "{example}"
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}
