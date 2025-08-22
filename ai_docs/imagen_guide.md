# Google Imagen API Guide

A comprehensive guide for using Google's Imagen text-to-image generation API on Vertex AI.

## Table of Contents
- [Overview](#overview)
- [Available Models](#available-models)
- [Setup and Authentication](#setup-and-authentication)
- [API Usage](#api-usage)
  - [Basic Image Generation](#basic-image-generation)
  - [Advanced Parameters](#advanced-parameters)
  - [Using Python SDK](#using-python-sdk)
- [Prompt Writing Guide](#prompt-writing-guide)
  - [Basic Structure](#basic-structure)
  - [Photography Styles](#photography-styles)
  - [Artistic Styles](#artistic-styles)
  - [Advanced Techniques](#advanced-techniques)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

Imagen is Google's advanced text-to-image generation model available through Vertex AI. It can create high-quality, photorealistic images from text descriptions and supports various artistic styles.

Key Features:
- High-quality image generation from text prompts
- Multiple aspect ratios (1:1, 3:4, 4:3, 16:9, 9:16)
- Support for multiple languages
- Digital watermarking with SynthID
- Responsible AI safety filtering
- Image upscaling capabilities

## Available Models

### Latest Models (Recommended)
- **`imagen-3.0-generate-002`** - Latest Imagen 3 model with best quality
- **`imagen-3.0-generate-001`** - Standard Imagen 3 model
- **`imagen-3.0-fast-generate-001`** - Faster generation, slightly lower quality

### Imagen 4 Models (Preview)
- **`imagen-4.0-generate-001`** - Latest Imagen 4 standard model
- **`imagen-4.0-fast-generate-001`** - Fast Imagen 4 variant
- **`imagen-4.0-ultra-generate-001`** - Ultra quality Imagen 4

### Legacy Models
- **`imagegeneration@006`** - Previous generation
- **`imagegeneration@005`** - Older version
- **`imagegeneration@002`** - Legacy model

## Setup and Authentication

### Prerequisites
1. Google Cloud Project with billing enabled
2. Vertex AI API enabled
3. Authentication configured

### Enable Vertex AI API
```bash
gcloud services enable aiplatform.googleapis.com
```

### Install Required Libraries

#### Python
```bash
pip install --upgrade google-cloud-aiplatform
# or for the new Gen AI SDK
pip install --upgrade google-genai
```

### Authentication
```bash
gcloud auth application-default login
```

## API Usage

### Basic Image Generation

#### REST API Example
```bash
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/imagen-3.0-generate-002:predict \
  -d '{
    "instances": [
      {
        "prompt": "A serene mountain landscape at sunset with a lake in the foreground"
      }
    ],
    "parameters": {
      "sampleCount": 1
    }
  }'
```

### Advanced Parameters

```json
{
  "instances": [{
    "prompt": "Your text prompt here"
  }],
  "parameters": {
    "sampleCount": 4,              // Number of images (1-4)
    "aspectRatio": "16:9",         // Aspect ratio
    "addWatermark": true,          // Add SynthID watermark
    "enhancePrompt": true,         // LLM-based prompt enhancement
    "language": "en",              // Prompt language
    "personGeneration": "allow_adult",  // Person generation settings
    "safetySetting": "block_medium_and_above",  // Safety filter level
    "sampleImageSize": "2K",       // Output resolution (1K or 2K)
    "seed": 12345,                 // For deterministic output (requires watermark=false)
    "outputOptions": {
      "mimeType": "image/png",
      "compressionQuality": 75     // For JPEG only
    }
  }
}
```

### Using Python SDK

#### New Gen AI SDK (Recommended)
```python
from google import genai
from google.genai.types import GenerateImagesConfig

# Setup
client = genai.Client()

# Generate image
image = client.models.generate_images(
    model="imagen-3.0-generate-002",
    prompt="A futuristic cityscape with flying cars at dusk",
    config=GenerateImagesConfig(
        image_size="2K",
    ),
)

# Save the image
image.generated_images[0].image.save("output.png")
```

#### Legacy Vertex AI SDK
```python
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel

# Initialize
vertexai.init(project="YOUR_PROJECT_ID", location="us-central1")
model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-002")

# Generate images
response = model.generate_images(
    prompt="A cozy coffee shop interior with warm lighting",
    number_of_images=4,
    aspect_ratio="16:9",
    safety_filter_level="block_medium_and_above",
    person_generation="allow_adult",
)

# Save first image
response.images[0].save("coffee_shop.png")
```

## Prompt Writing Guide

### Basic Structure

A good prompt typically includes three elements:

1. **Subject**: The main focus of the image
2. **Context/Background**: The environment or setting
3. **Style**: The artistic approach or medium

Example: "A _sketch_ (**style**) of a _modern apartment building_ (**subject**) surrounded by _skyscrapers_ (**context**)"

### Photography Styles

#### Camera Settings
- **Proximity**: "close-up", "zoomed out", "medium shot"
- **Position**: "aerial photo", "from below", "eye level"
- **Lighting**: "natural lighting", "dramatic lighting", "golden hour"
- **Effects**: "motion blur", "soft focus", "bokeh", "depth of field"

#### Lens Types
- **35mm**: Standard portraits
- **50mm**: Natural perspective
- **Fisheye**: Distorted wide angle
- **Macro**: Extreme close-ups
- **Wide angle**: Landscapes

#### Film Types
- "black and white photo"
- "polaroid"
- "film noir"
- "vintage film"

### Artistic Styles

#### Drawing & Painting
- "pencil sketch"
- "charcoal drawing"
- "watercolor painting"
- "oil painting"
- "digital art"
- "pastel painting"

#### Art Movements
- "impressionist painting"
- "renaissance style"
- "pop art"
- "art deco"
- "surrealist"
- "minimalist"

### Advanced Techniques

#### Quality Modifiers
- **General**: "high-quality", "beautiful", "professional"
- **Photos**: "4K", "HDR", "studio photo"
- **Art**: "detailed", "masterpiece", "award-winning"

#### Text in Images (Imagen 3+)
- Keep text under 25 characters
- Use quotes around the exact text
- Specify font style: "bold font", "handwritten", "serif"
- Example: `A poster with the text "Summer Sale" in bold red letters`

#### Negative Prompts (Legacy models only)
- Describe what you DON'T want
- Use plain descriptions: "wall, frame" 
- Avoid "no" or "don't"

## Best Practices

### 1. Iterate and Refine
Start with a basic prompt, then add details:
- Basic: "A park in spring"
- Better: "A park in spring next to a lake"
- Best: "A park in spring next to a lake, golden hour, red wildflowers"

### 2. Be Specific About Style
Instead of "nice image", use:
- "professional photography"
- "studio lighting"
- "shallow depth of field"

### 3. Use Aspect Ratios Effectively
- **1:1** - Social media posts, profile pictures
- **3:4** - Portraits, vertical compositions
- **4:3** - Traditional photography, general use
- **16:9** - Landscapes, cinematic shots
- **9:16** - Mobile-first content, stories

### 4. Leverage Prompt Enhancement
Keep `enhancePrompt: true` for better results (default)

### 5. Consider Safety Settings
- `block_low_and_above`: Strictest filtering
- `block_medium_and_above`: Balanced (default)
- `block_only_high`: More permissive

## Examples

### Photorealistic Portrait
```
Prompt: "A professional portrait of a woman in her 30s, 35mm lens, natural lighting, 
shallow depth of field, warm tones, outdoor urban setting"
Settings: aspectRatio: "3:4", sampleImageSize: "2K"
```

### Product Photography
```
Prompt: "Studio photo of a luxury watch on white background, professional product 
photography, dramatic lighting, macro lens, high detail"
Settings: aspectRatio: "1:1", enhancePrompt: true
```

### Artistic Landscape
```
Prompt: "Impressionist painting of a lavender field in Provence at sunset, 
purple and orange color palette, visible brushstrokes"
Settings: aspectRatio: "16:9", personGeneration: "dont_allow"
```

### Logo Design
```
Prompt: "A minimalist logo for a tech company called 'Nexus' on solid blue 
background, modern design, geometric shapes"
Settings: aspectRatio: "1:1", addWatermark: false, seed: 42
```

### Architectural Visualization
```
Prompt: "Aerial photo of a futuristic sustainable city with green rooftops, 
solar panels, and vertical gardens, golden hour lighting"
Settings: aspectRatio: "16:9", sampleImageSize: "2K"
```

## Troubleshooting

### Common Issues

1. **403 Forbidden Error**
   - Ensure Vertex AI API is enabled
   - Check authentication credentials
   - Verify project permissions

2. **Filtered Results**
   - Adjust safety settings
   - Modify prompt to avoid restricted content
   - Check personGeneration settings

3. **Poor Quality Results**
   - Enable prompt enhancement
   - Add quality modifiers to prompt
   - Use latest model version
   - Try different aspect ratios

### Rate Limits
- Default quota varies by region and model
- Monitor usage in Cloud Console
- Request quota increases if needed

## Book Illustration Example

### Using Gemini with Imagen for Book Illustrations

The included Jupyter notebook (`Copy_of_Book_illustration.ipynb`) demonstrates an advanced use case combining Gemini's language capabilities with Imagen's image generation to illustrate books. Key features:

1. **Multi-modal Processing**: Process text books or audiobooks
2. **Character Generation**: Automatically extract character descriptions and generate portraits
3. **Chapter Illustrations**: Create scene illustrations for each chapter
4. **Style Consistency**: Define and maintain artistic style throughout

### Example Workflow

```python
# 1. Upload book using File API
book = client.files.upload(file="book.txt")

# 2. Start chat with structured output
from pydantic import BaseModel

class Prompts(BaseModel):
    name: str
    prompt: str

chat = client.chats.create(
    model="gemini-2.5-flash",
    config=types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=list[Prompts],
    ),
)

# 3. Define artistic style
style = "watercolor painting, golden age illustration, pastoral scenes"

# 4. Generate character portraits
response = chat.send_message("Describe main characters for illustration...")
characters = json.loads(response.text)

# 5. Generate images
for character in characters:
    image = client.models.generate_images(
        model="imagen-3.0-generate-002",
        prompt=character['prompt'] + style,
        config=GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="9:16"
        )
    )
```

### Tips for Book Illustration

1. **Consistent Character Descriptions**: Store character prompts and reuse them across chapters
2. **Style Maintenance**: Define style once and append to all prompts
3. **Chapter Context**: Ask Gemini to include relevant characters in chapter illustrations
4. **Avoid Text**: Use system instructions to prevent text in images
5. **Family-Friendly**: Set appropriate safety filters for children's books

## Additional Resources

- [Official Vertex AI Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview)
- [Model Cards and Specifications](https://console.cloud.google.com/vertex-ai/publishers/google/model-garden/)
- [Pricing Information](https://cloud.google.com/vertex-ai/pricing)
- [Responsible AI Guidelines](https://cloud.google.com/vertex-ai/generative-ai/docs/image/responsible-ai-imagen)
- [Imagen Prompt Guide](https://ai.google.dev/gemini-api/docs/imagen-prompt-guide)
- [Example Notebooks](https://github.com/google-gemini/cookbook)
  - Book Illustration Example (included in this directory)
  - [Zoom on Earth](https://github.com/google-gemini/cookbook/blob/main/examples/Zoom_on_earth.ipynb)
  - [Generative Designs](https://github.com/google-gemini/cookbook/blob/main/examples/Generative_designs.ipynb)