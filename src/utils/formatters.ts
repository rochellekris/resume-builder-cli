// ── Shared formatting utilities ──────────────────────────────────────────────

// Words that should stay lowercase in title case (unless they are the first word)
const LOWERCASE_WORDS = new Set([
    "a", "an", "the",
    "and", "but", "or", "nor", "for", "so", "yet",
    "at", "by", "in", "of", "on", "to", "up", "as",
]);

/**
 * Converts a string to title case, respecting common English rules:
 * - First and last word are always capitalised
 * - Articles, conjunctions, and short prepositions stay lowercase
 * - Words that are already all-caps (e.g. "AWS", "GPA") are left untouched
 * - Dot-separated abbreviations (e.g. "m.s.", "b.s.") are fully uppercased
 * - Short all-letter tokens of 1–4 chars that aren't stop words are uppercased
 *   (e.g. "swe" → "SWE", "ml" → "ML")
 */
export function toTitleCase(str: string): string {
    const words = str.trim().split(/\s+/);
    return words
        .map((word, i) => {
            // Already all-caps (e.g. "AWS", "GPA") — leave untouched
            if (word === word.toUpperCase() && word.length > 1) return word;

            const lower = word.toLowerCase();

            // Dot-separated abbreviation like "m.s." or "b.s." → "M.S."
            if (/^([a-z]\.)+$/.test(lower)) return lower.toUpperCase();

            // Stop words stay lowercase unless first/last
            if (i !== 0 && i !== words.length - 1 && LOWERCASE_WORDS.has(lower)) {
                return lower;
            }

            // Short all-letter tokens (1–4 chars, not stop words) are likely
            // abbreviations: "swe" → "SWE", "ml" → "ML", "ui" → "UI"
            if (/^[a-z]{1,4}$/.test(lower) && !LOWERCASE_WORDS.has(lower)) {
                return lower.toUpperCase();
            }

            // Default: capitalise first letter
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(" ");
}

const MONTHS = new Set([
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
    "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept",
    "oct", "nov", "dec",
]);

/**
 * Capitalises month names in a date string such as "june 2022" → "June 2022"
 * or "present" → "Present". Leaves everything else unchanged.
 */
export function capitalizeDate(date: string): string {
    return date
        .trim()
        .split(/\s+/)
        .map((word) => {
            const lower = word.toLowerCase();
            if (MONTHS.has(lower) || lower === "present") {
                return lower.charAt(0).toUpperCase() + lower.slice(1);
            }
            return word;
        })
        .join(" ");
}
