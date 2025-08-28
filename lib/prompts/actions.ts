export type ActionCues = { positive: string; negative: string }

function norm(s: string) {
  return (s || "").toLowerCase()
}

export function getActionCues(actionText: string | undefined): ActionCues {
  const a = norm(actionText || "")
  if (!a) return { positive: "", negative: "" }

  // Running / jogging
  if (a.includes("run") || a.includes("jog")) {
    return {
      positive:
        " Depict running: 35mm lens; medium shot, eye-level, 3/4 view; both characters mid-stride; one foot off the ground for each; elbows bent about 90 degrees; slight forward lean; natural arm swing visible; subtle motion blur on legs only; crisp faces; shadow under lifted foot.",
      negative: "no standing still; not both feet planted; not arms hanging at sides",
    }
  }

  // Sitting
  if (a.includes("sit") || a.includes("seated") || a.includes("bench")) {
    return {
      positive:
        " Depict sitting: 35mm lens; medium shot, eye-level; slight lateral angle to reveal hips contacting the bench; both characters seated with hips contacting the bench; knees bent ~90 degrees; feet resting on the ground; hands engaged (e.g., holding the cake plate together). For the rabbit character: long upright ears clearly visible above the head; small round cotton tail visible; no bushy tail.",
      negative: "no upright standing posture; not both legs straight",
    }
  }

  // Standing (baseline)
  if (a.includes("stand") || a.includes("standing")) {
    return {
      positive:
        " Depict standing: medium shot, eye-level; side-by-side composition; hands relaxed at sides; natural posture.",
      negative: "",
    }
  }

  // Default: pass-through
  return { positive: "", negative: "" }
}

