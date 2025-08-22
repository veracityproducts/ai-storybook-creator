// Comprehensive phonics patterns for decodable readers
import type { PhonicsConfig } from "@/lib/decodability/schemas"

export interface PhonicsPattern {
  id: string
  name: string
  description: string
  level: "beginner" | "intermediate" | "advanced"
  ageRange: string
  config: Omit<PhonicsConfig, 'characterMappings'>
  examples: string[]
}

export const PHONICS_PATTERNS: PhonicsPattern[] = [
  // BEGINNER PATTERNS
  {
    id: "cvc-short-a",
    name: "CVC Short A",
    description: "Consonant-Vowel-Consonant words with short 'a' sound",
    level: "beginner",
    ageRange: "4-6",
    config: {
      patternId: "cvc-short-a",
      graphemesAllowed: ["a", "m", "s", "t", "p", "n", "c", "d", "b", "f", "g", "h", "j", "k", "l", "r", "v", "w", "x", "z"],
      approvedWords: [
        "am", "an", "at", "as", "ad",
        "bat", "cat", "fat", "hat", "mat", "pat", "rat", "sat", "vat",
        "bad", "dad", "had", "lad", "mad", "pad", "sad",
        "bag", "gag", "hag", "lag", "nag", "rag", "sag", "tag", "wag",
        "ban", "can", "fan", "man", "pan", "ran", "tan", "van",
        "cap", "gap", "lap", "map", "nap", "rap", "sap", "tap", "zap",
        "cab", "dab", "gab", "jab", "lab", "nab", "tab"
      ],
      heartWords: ["the", "I", "to", "a"],
      bannedWords: [],
      maxSentencesPerPage: 2,
      allowedPunctuation: [".", "!", "?"],
      properNounsPolicy: "none"
    },
    examples: ["The cat sat on the mat.", "I am sad.", "Dad had a hat."]
  },
  
  {
    id: "cvc-short-i",
    name: "CVC Short I",
    description: "Consonant-Vowel-Consonant words with short 'i' sound",
    level: "beginner",
    ageRange: "4-6",
    config: {
      patternId: "cvc-short-i",
      graphemesAllowed: ["i", "b", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w", "x", "z"],
      approvedWords: [
        "it", "is", "if", "in",
        "big", "dig", "fig", "gig", "jig", "pig", "rig", "wig",
        "bid", "did", "hid", "kid", "lid", "rid",
        "bin", "din", "fin", "gin", "kin", "pin", "sin", "tin", "win",
        "bit", "fit", "hit", "kit", "lit", "pit", "sit", "wit",
        "dip", "hip", "lip", "nip", "rip", "sip", "tip", "zip",
        "bib", "fib", "jib", "nib", "rib"
      ],
      heartWords: ["the", "I", "to", "a", "is", "it"],
      bannedWords: [],
      maxSentencesPerPage: 2,
      allowedPunctuation: [".", "!", "?"],
      properNounsPolicy: "none"
    },
    examples: ["The pig is big.", "I sit on it.", "The kid hid the lid."]
  },

  {
    id: "cvc-short-o",
    name: "CVC Short O",
    description: "Consonant-Vowel-Consonant words with short 'o' sound",
    level: "beginner",
    ageRange: "4-6",
    config: {
      patternId: "cvc-short-o",
      graphemesAllowed: ["o", "b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w"],
      approvedWords: [
        "on", "of",
        "bob", "cob", "gob", "job", "lob", "mob", "rob", "sob",
        "cod", "god", "mod", "nod", "pod", "rod", "sod",
        "bog", "cog", "dog", "fog", "hog", "jog", "log",
        "cop", "hop", "lop", "mop", "pop", "sop", "top",
        "cot", "dot", "got", "hot", "jot", "lot", "not", "pot", "rot", "tot",
        "box", "cox", "fox", "pox", "sox"
      ],
      heartWords: ["the", "I", "to", "a", "of", "on"],
      bannedWords: [],
      maxSentencesPerPage: 2,
      allowedPunctuation: [".", "!", "?"],
      properNounsPolicy: "none"
    },
    examples: ["The dog is hot.", "I got a box.", "The fox is on top."]
  },

  // INTERMEDIATE PATTERNS
  {
    id: "cvce-long-a",
    name: "CVCe Long A",
    description: "Consonant-Vowel-Consonant-e words with long 'a' sound (magic e)",
    level: "intermediate",
    ageRange: "5-7",
    config: {
      patternId: "cvce-long-a",
      graphemesAllowed: ["a", "e", "b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w"],
      approvedWords: [
        "bake", "cake", "fake", "lake", "make", "rake", "sake", "take", "wake",
        "bale", "dale", "gale", "hale", "kale", "male", "pale", "sale", "tale", "vale", "wale",
        "came", "dame", "fame", "game", "lame", "name", "same", "tame",
        "bane", "cane", "dane", "jane", "lane", "mane", "pane", "sane", "vane", "wane",
        "cape", "gape", "nape", "tape",
        "bare", "care", "dare", "fare", "hare", "mare", "pare", "rare", "tare", "ware",
        "base", "case", "vase",
        "date", "fate", "gate", "hate", "late", "mate", "rate"
      ],
      heartWords: ["the", "I", "to", "a", "make", "take", "came", "name"],
      bannedWords: [],
      maxSentencesPerPage: 2,
      allowedPunctuation: [".", "!", "?"],
      properNounsPolicy: "limited"
    },
    examples: ["I can make a cake.", "The lake is by the gate.", "Jane came late to the game."]
  },

  {
    id: "blends-initial",
    name: "Initial Consonant Blends",
    description: "Words beginning with consonant blends (bl, cl, fl, gl, pl, sl, br, cr, dr, fr, gr, pr, tr)",
    level: "intermediate",
    ageRange: "5-7",
    config: {
      patternId: "blends-initial",
      graphemesAllowed: ["a", "e", "i", "o", "u", "b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w"],
      approvedWords: [
        // bl- blends
        "black", "blade", "blame", "blank", "blast", "blaze", "bleak", "blend", "bless", "blind", "blink", "block", "blood", "bloom", "blown", "blue",
        // cl- blends  
        "clad", "clam", "clap", "class", "claw", "clay", "clean", "clear", "click", "cliff", "climb", "clip", "clock", "close", "cloth", "cloud", "clown",
        // fl- blends
        "flag", "flake", "flame", "flap", "flash", "flat", "flaw", "flax", "fled", "flee", "flesh", "flew", "flex", "flick", "flip", "flock", "flood", "floor", "flow", "flown",
        // gl- blends
        "glad", "gland", "glass", "gleam", "glen", "glide", "globe", "gloom", "glow", "glue",
        // pl- blends
        "place", "plain", "plan", "plant", "plate", "play", "plaza", "plead", "please", "pledge", "plot", "plow", "pluck", "plug", "plum", "plus",
        // sl- blends
        "slab", "slam", "slap", "slash", "slate", "slave", "sled", "sleep", "sleet", "slept", "slice", "slick", "slide", "slim", "slip", "slit", "slow", "slug"
      ],
      heartWords: ["the", "I", "to", "a", "play", "black", "blue", "please"],
      bannedWords: [],
      maxSentencesPerPage: 2,
      allowedPunctuation: [".", "!", "?"],
      properNounsPolicy: "limited"
    },
    examples: ["The black cat can climb.", "I like to play in the snow.", "Please close the glass door."]
  },

  // ADVANCED PATTERNS
  {
    id: "digraphs-ch-sh-th",
    name: "Consonant Digraphs (ch, sh, th)",
    description: "Words with consonant digraphs ch, sh, and th",
    level: "advanced",
    ageRange: "6-8",
    config: {
      patternId: "digraphs-ch-sh-th",
      graphemesAllowed: ["a", "e", "i", "o", "u", "b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w"],
      approvedWords: [
        // ch words
        "chair", "chain", "chalk", "champ", "chance", "change", "chant", "chap", "chart", "chase", "chat", "cheap", "cheat", "check", "cheek", "cheer", "chess", "chest", "chew", "chick", "chief", "child", "chill", "chimp", "chin", "chip", "chop", "chose", "chunk",
        // sh words
        "shade", "shake", "shall", "shame", "shape", "share", "shark", "sharp", "shave", "shed", "sheep", "sheet", "shelf", "shell", "shine", "ship", "shirt", "shock", "shoe", "shook", "shoot", "shop", "shore", "short", "shot", "shout", "show", "shut",
        // th words
        "thank", "that", "thaw", "theft", "their", "them", "then", "there", "these", "they", "thick", "thin", "thing", "think", "third", "this", "thorn", "those", "three", "threw", "throw", "thumb", "thump"
      ],
      heartWords: ["the", "I", "to", "a", "they", "there", "these", "this", "that", "then", "them", "their"],
      bannedWords: [],
      maxSentencesPerPage: 3,
      allowedPunctuation: [".", "!", "?", ","],
      properNounsPolicy: "limited"
    },
    examples: ["The sheep is in the shade.", "I think they are there.", "She chose the red shirt."]
  },

  {
    id: "vowel-teams-ai-ay",
    name: "Vowel Teams (ai, ay)",
    description: "Words with vowel teams ai and ay making the long a sound",
    level: "advanced",
    ageRange: "6-8",
    config: {
      patternId: "vowel-teams-ai-ay",
      graphemesAllowed: ["a", "i", "y", "b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "v", "w"],
      approvedWords: [
        // ai words
        "aid", "aim", "air", "bait", "brain", "chain", "chair", "claim", "drain", "faint", "fair", "faith", "gain", "grain", "hair", "jail", "laid", "maid", "mail", "main", "nail", "paid", "pain", "pair", "plain", "rain", "sail", "snail", "stain", "tail", "train", "trail", "wait", "waist",
        // ay words
        "bay", "clay", "day", "gray", "hay", "jay", "lay", "may", "pay", "play", "pray", "ray", "say", "spray", "stay", "stray", "sway", "today", "tray", "way"
      ],
      heartWords: ["the", "I", "to", "a", "play", "say", "day", "way", "today"],
      bannedWords: [],
      maxSentencesPerPage: 3,
      allowedPunctuation: [".", "!", "?", ","],
      properNounsPolicy: "limited"
    },
    examples: ["I like to play in the rain.", "The gray cat has a long tail.", "Today we will sail on the bay."]
  }
]

// Helper functions
export function getPhonicsPattern(id: string): PhonicsPattern | undefined {
  return PHONICS_PATTERNS.find(pattern => pattern.id === id)
}

export function getPhonicsPatternsByLevel(level: "beginner" | "intermediate" | "advanced"): PhonicsPattern[] {
  return PHONICS_PATTERNS.filter(pattern => pattern.level === level)
}

export function createPhonicsConfig(patternId: string, characterMappings?: Record<string, string>): PhonicsConfig {
  const pattern = getPhonicsPattern(patternId)
  if (!pattern) {
    throw new Error(`Phonics pattern '${patternId}' not found`)
  }

  return {
    ...pattern.config,
    characterMappings: characterMappings || getDefaultCharacterMappings()
  }
}

export function getDefaultCharacterMappings(): Record<string, string> {
  return {
    "man": "Sam, a friendly cartoon red fox character with red-orange fur, white chest and belly, bushy tail with white tip, oval face with pronounced cheekbones, large triangular ears with black tips, small black nose, large almond-shaped brown eyes with cheerful expression, wearing a bright blue baseball cap, green t-shirt with small white paw print, and sturdy brown hiking boots",
    "Sam": "Sam, a friendly cartoon red fox character with red-orange fur, white chest and belly, bushy tail with white tip, oval face with pronounced cheekbones, large triangular ears with black tips, small black nose, large almond-shaped brown eyes with cheerful expression, wearing a bright blue baseball cap, green t-shirt with small white paw print, and sturdy brown hiking boots",
    "I": "Sam, a friendly cartoon red fox character with red-orange fur, white chest and belly, bushy tail with white tip, oval face with pronounced cheekbones, large triangular ears with black tips, small black nose, large almond-shaped brown eyes with cheerful expression, wearing a bright blue baseball cap, green t-shirt with small white paw print, and sturdy brown hiking boots",
    "woman": "Emma, a cheerful cartoon rabbit character with soft gray fur, wearing a yellow sundress with flower patterns, pink sandals, and bright sparkling eyes",
    "Emma": "Emma, a cheerful cartoon rabbit character with soft gray fur, wearing a yellow sundress with flower patterns, pink sandals, and bright sparkling eyes",
    "she": "Emma, a cheerful cartoon rabbit character with soft gray fur, wearing a yellow sundress with flower patterns, pink sandals, and bright sparkling eyes",
    "Mom": "Mom, a caring adult fox character with reddish-brown fur, wearing a blue blouse and khaki pants, with a gentle expression and kind eyes",
    "Dad": "Dad, a gentle adult wolf character with dark gray fur, wearing a green polo shirt and brown pants, with a strong build and friendly demeanor"
  }
}
