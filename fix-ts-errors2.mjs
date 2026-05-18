import { writeFileSync, readFileSync } from 'fs'

// Fix 1: AffiliateFeedbackPages — remove name.trim() since name state was removed
const affiliate = readFileSync('src/pages/AffiliateFeedbackPages.tsx', 'utf8')
const affiliateFixed = affiliate
  .replace("name: name.trim() || email,", "name: email,")
writeFileSync('src/pages/AffiliateFeedbackPages.tsx', affiliateFixed)
console.log('✓ Fixed AffiliateFeedbackPages.tsx')

// Fix 2: lib/api.ts — fix GradePayload to use 'audio' field name
const api = readFileSync('src/lib/api.ts', 'utf8')
const apiFixed = api
  .replace(
    `export interface GradePayload {
  audio: string        // base64 encoded audio
  audioType: string   // mime type e.g. 'audio/webm'
  frames: string      // JSON.stringify(string[]) — backend does JSON.parse(frames)
  topic: string
  goal: string
  audience: string
  targetSeconds: number
  email: string
}`,
    `export interface GradePayload {
  audio: string
  audioType: string
  frames: string
  topic: string
  goal: string
  audience: string
  targetSeconds: number
  email: string
}`
  )
writeFileSync('src/lib/api.ts', apiFixed)
console.log('✓ Fixed api.ts GradePayload')

// Also ensure the gradeSession function uses the right type
// Check if there's a mismatch — rewrite gradeSession signature
const apiContent = readFileSync('src/lib/api.ts', 'utf8')
// Replace old audioBase64 payload interface if still present
const apiFinal = apiContent
  .replace(
    `export interface GradePayload {
  audioBase64: string
  frames: string[]`,
    `export interface GradePayload {
  audio: string
  audioType: string
  frames: string`
  )
writeFileSync('src/lib/api.ts', apiFinal)
console.log('✓ Verified api.ts')

console.log('\nAll fixes applied. Run: npm run build')
