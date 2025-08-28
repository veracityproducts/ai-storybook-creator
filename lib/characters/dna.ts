// Character DNA registry (versioned, layered descriptors)
// Central source of truth so prompts and QA can be character-agnostic

export interface CharacterDNA {
  id: string
  name: string
  identity: string
  physical: string
  styleIdentity: string
  behavioral: string
  context: string
}

export function composeDNA(dna: CharacterDNA): string {
  // Compose a single, stable descriptor block for prompts (verbatim reuse)
  return `${dna.name}, ${dna.identity}, ${dna.physical}, ${dna.styleIdentity}, ${dna.behavioral}, ${dna.context}`
}

// Registry entries
export const Sam_v1: CharacterDNA = {
  id: "Sam_v1",
  name: "Sam",
  identity: "a friendly cartoon red fox character for children's books",
  physical: "red-orange fur, white chest and belly, bushy tail with white tip, oval face with pronounced cheekbones, large triangular ears with black tips, small black nose, large almond-shaped brown eyes",
  styleIdentity: "wearing a bright blue baseball cap, green t-shirt with a small white paw print, khaki shorts, and sturdy brown hiking boots; no backpack",
  behavioral: "cheerful and curious expression, kind demeanor, open posture",
  context: "3D Pixar-like cartoon style with smooth textures and warm daylight lighting",
}

export const Emma_v1: CharacterDNA = {
  id: "Emma_v1",
  name: "Emma",
  identity: "a cheerful cartoon rabbit character for children's books",
  physical: "soft gray fur, round friendly face, bright sparkling eyes, long upright rabbit ears, small round cotton tail; short rounded muzzle; no bushy fox tail",
  styleIdentity: "wearing a yellow sundress with flower patterns and pink sandals",
  behavioral: "warm friendly smile, gentle posture, calm demeanor",
  context: "3D Pixar-like cartoon style with smooth textures and warm daylight lighting",
}

export const Mom_v1: CharacterDNA = {
  id: "Mom_v1",
  name: "Mom",
  identity: "a caring adult fox character",
  physical: "reddish-brown fur, soft facial features, kind eyes",
  styleIdentity: "wearing a blue blouse and khaki pants",
  behavioral: "gentle supportive expression, relaxed posture",
  context: "3D Pixar-like cartoon style with smooth textures and warm daylight lighting",
}

export const Dad_v1: CharacterDNA = {
  id: "Dad_v1",
  name: "Dad",
  identity: "a gentle adult wolf character",
  physical: "dark gray fur, strong build, friendly demeanor",
  styleIdentity: "wearing a green polo shirt and brown pants",
  behavioral: "calm confident expression, supportive stance",
  context: "3D Pixar-like cartoon style with smooth textures and warm daylight lighting",
}

export const Pig_v1: CharacterDNA = {
  id: "Pig_v1",
  name: "a cheerful big pink pig",
  identity: "a child-friendly cartoon farm animal",
  physical: "soft pink skin, round body, curly tail, small triangular ears, button nose, bright friendly eyes",
  styleIdentity: "clean simple shapes with soft highlights",
  behavioral: "happy expression, gentle and approachable",
  context: "3D Pixar-like cartoon style with smooth textures and warm daylight lighting",
}

export const Lily_v1: CharacterDNA = {
  id: "Lily_v1",
  name: "Lily",
  identity: "a gentle cartoon deer fawn character for children's books",
  physical: "warm tan fur with subtle white spots on back, large rounded ears with light inner fur, big brown eyes, small black nose, short white tail with tan top; no antlers (young doe); slender short muzzle",
  styleIdentity: "wearing a light purple cardigan, white dress, and brown ankle boots",
  behavioral: "kind, a little shy but brave; soft smile; relaxed posture",
  context: "3D Pixar-like cartoon style with smooth textures and warm daylight lighting",
}

export const Ollie_v1: CharacterDNA = {
  id: "Ollie_v1",
  name: "Ollie",
  identity: "a playful cartoon raccoon character for children's books",
  physical: "gray fur with distinct black eye mask, small rounded ears, ringed bushy tail (dark and light bands), bright curious eyes, small black nose",
  styleIdentity: "wearing a red hoodie, dark gray shorts, and blue sneakers",
  behavioral: "mischievous but friendly; energetic stance; eager expression",
  context: "3D Pixar-like cartoon style with smooth textures and warm daylight lighting",
}


export const CHARACTER_DNA_REGISTRY: CharacterDNA[] = [
  Sam_v1,
  Emma_v1,
  Mom_v1,
  Dad_v1,
  Pig_v1,
  Lily_v1,
  Ollie_v1,
]

