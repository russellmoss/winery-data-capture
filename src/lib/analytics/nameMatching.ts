// src/lib/analytics/nameMatching.ts
export function normalizeAssociateName(name: string): string {
  if (!name) return 'Unknown'
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function calculateLevenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  
  return dp[m][n]
}

export function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 100
  const distance = calculateLevenshteinDistance(str1, str2)
  return ((maxLen - distance) / maxLen) * 100
}

// Common name variations mapping
const NAME_VARIATIONS: Record<string, string[]> = {
  'robert': ['bob', 'rob', 'bobby'],
  'michael': ['mike', 'mick', 'mickey'],
  'william': ['will', 'bill', 'billy'],
  'elizabeth': ['liz', 'beth', 'betty', 'eliza'],
  'margaret': ['maggie', 'meg', 'peggy'],
  'richard': ['rick', 'dick', 'rich'],
  'christopher': ['chris', 'kit'],
  'jennifer': ['jen', 'jenny'],
  'patricia': ['pat', 'patty', 'trish'],
  'james': ['jim', 'jimmy', 'jamie'],
  'john': ['jack', 'johnny'],
  'joseph': ['joe', 'joey'],
  'thomas': ['tom', 'tommy'],
  'charles': ['charlie', 'chuck'],
  'daniel': ['dan', 'danny'],
  'matthew': ['matt', 'matty'],
  'anthony': ['tony'],
  'donald': ['don', 'donnie'],
  'kenneth': ['ken', 'kenny'],
  'steven': ['steve'],
  'edward': ['ed', 'eddie'],
  'brian': ['bri'],
  'ronald': ['ron', 'ronnie'],
  'timothy': ['tim', 'timmy'],
  'jason': ['jay'],
  'jeffrey': ['jeff'],
  'ryan': ['ry'],
  'jacob': ['jake'],
  'nicholas': ['nick', 'nicky'],
  'jonathan': ['jon', 'johnny'],
  'joshua': ['josh'],
  'andrew': ['andy', 'drew'],
  'alexander': ['alex', 'al'],
  'russell': ['russ']
}

export function findBestAssociateMatch(
  metadataName: string,
  knownAssociates: string[],
  threshold: number = 85
): { match: string; confidence: number } | null {
  if (!metadataName || knownAssociates.length === 0) {
    return null
  }
  
  const normalizedInput = normalizeAssociateName(metadataName)
  let bestMatch = ''
  let bestScore = 0
  
  for (const associate of knownAssociates) {
    if (associate === 'Unknown' || associate.includes('***')) continue
    
    const normalizedAssociate = normalizeAssociateName(associate)
    
    // Direct match
    if (normalizedInput === normalizedAssociate) {
      return { match: associate, confidence: 100 }
    }
    
    // Check for name variations
    let isVariation = false
    for (const [fullName, variations] of Object.entries(NAME_VARIATIONS)) {
      if (normalizedInput === fullName && variations.includes(normalizedAssociate)) {
        isVariation = true
        break
      }
      if (normalizedAssociate === fullName && variations.includes(normalizedInput)) {
        isVariation = true
        break
      }
    }
    
    if (isVariation) {
      return { match: associate, confidence: 95 }
    }
    
    // Fuzzy matching
    const similarity = calculateSimilarity(normalizedInput, normalizedAssociate)
    if (similarity > bestScore) {
      bestScore = similarity
      bestMatch = associate
    }
  }
  
  if (bestScore >= threshold) {
    return { match: bestMatch, confidence: bestScore }
  }
  
  return null
}
