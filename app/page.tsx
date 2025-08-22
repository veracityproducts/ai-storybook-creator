import Link from "next/link"
import { BookOpen, Wand2, Download, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-16">
                {/* Hero Section */}
                <div className="text-center space-y-6 mb-16">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <BookOpen className="h-12 w-12 text-primary" />
                        <h1 className="text-5xl font-bold text-gray-900">StoryMaker AI</h1>
                    </div>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Create beautiful, decodable children's books with AI-generated illustrations.
                        Perfect for early readers, phonics instruction, and educational content.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        <Badge variant="secondary" className="text-sm">Decodable Text</Badge>
                        <Badge variant="secondary" className="text-sm">AI Illustrations</Badge>
                        <Badge variant="secondary" className="text-sm">PDF Export</Badge>
                        <Badge variant="secondary" className="text-sm">Mobile Friendly</Badge>
                        <Badge variant="secondary" className="text-sm">Imagen 4 Fast</Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="text-lg px-8">
                            <Link href="/book">
                                <Wand2 className="h-5 w-5 mr-2" />
                                Try the Book Reader
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                            <Link href="#api">
                                View API Docs
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                AI-Generated Stories
                            </CardTitle>
                            <CardDescription>
                                Create unique decodable stories with consistent characters and beautiful illustrations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm space-y-2 text-muted-foreground">
                                <li>• Phonics-compliant text generation</li>
                                <li>• Consistent character descriptions</li>
                                <li>• 3D Pixar-style illustrations</li>
                                <li>• Customizable themes and age ranges</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Interactive Reader
                            </CardTitle>
                            <CardDescription>
                                Beautiful, responsive book reader that works on desktop and mobile
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm space-y-2 text-muted-foreground">
                                <li>• Page-by-page navigation</li>
                                <li>• Fullscreen reading mode</li>
                                <li>• Touch-friendly controls</li>
                                <li>• Progress indicators</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Download className="h-5 w-5 text-primary" />
                                PDF Export
                            </CardTitle>
                            <CardDescription>
                                Export your books as high-quality PDFs for printing or sharing
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm space-y-2 text-muted-foreground">
                                <li>• Professional PDF layout</li>
                                <li>• High-resolution images</li>
                                <li>• Print-ready formatting</li>
                                <li>• Metadata inclusion</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* API Section */}
                <div id="api" className="bg-white rounded-lg p-8 shadow-sm">
                    <h2 className="text-2xl font-bold mb-4">API Endpoints</h2>
                    <p className="text-gray-600 mb-6">
                        Headless service for generating decodable readers with Imagen 4 Fast
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <code className="bg-gray-100 px-3 py-2 rounded text-sm block">POST /api/compile-book</code>
                            <p className="text-sm text-gray-600">Generate complete decodable books with images</p>
                        </div>
                        <div className="space-y-2">
                            <code className="bg-gray-100 px-3 py-2 rounded text-sm block">POST /api/cvc-smoke</code>
                            <p className="text-sm text-gray-600">CVC pattern decodable story test</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-16 text-sm text-gray-500">
                    <p>Powered by Imagen 4 Fast • Built with Next.js and Tailwind CSS</p>
                </div>
            </div>
        </div>
    )
}