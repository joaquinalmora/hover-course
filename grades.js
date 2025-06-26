console.log(" grades.js loaded");

const API_BASE_URL = 'https://ubcgrades.com/api/v3';
const CAMPUS = 'UBCO';

// Cache objects
let termsCache = null;
let sectionsCache = new Map(); // key: `${term}-${subject}-${course}`, value: sections array

// Initialize terms cache
async function initializeTermsCache() {
  if (termsCache) return termsCache;
  
  try {
    const response = await fetch(`${API_BASE_URL}/yearsessions/${CAMPUS}`);
    if (!response.ok) throw new Error(`Failed to fetch terms: ${response.status}`);
    
    const terms = await response.json();
    // Sort newest to oldest (assuming format like "2023W", "2023S")
    termsCache = terms.sort((a, b) => b.localeCompare(a));
    console.log('Terms cache initialized:', termsCache);
    return termsCache;
  } catch (error) {
    console.error('Failed to initialize terms cache:', error);
    // Fallback to a reasonable default list
    termsCache = ['2023W', '2023S', '2022W', '2022S', '2021W', '2021S'];
    return termsCache;
  }
}

// Get sections for a specific course and term
async function getSections(term, subject, course) {
  const cacheKey = `${term}-${subject}-${course}`;
  
  if (sectionsCache.has(cacheKey)) {
    return sectionsCache.get(cacheKey);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/sections/${CAMPUS}/${term}/${subject}/${course}`);
    if (!response.ok) {
      sectionsCache.set(cacheKey, []);
      return [];
    }
    
    const sections = await response.json();
    sectionsCache.set(cacheKey, sections);
    return sections;
  } catch (error) {
    console.error(`Failed to fetch sections for ${subject} ${course} in ${term}:`, error);
    sectionsCache.set(cacheKey, []);
    return [];
  }
}

// Try to fetch grades for a specific section
async function tryFetchGradesForSection(term, subject, course, section) {
  try {
    const url = `${API_BASE_URL}/grades/${CAMPUS}/${term}/${subject}/${course}/${section}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data, usedTerm: term, usedSection: section };
    }
    
    return { success: false, status: response.status };
  } catch (error) {
    console.error(`Network error fetching grades for ${subject} ${course}-${section} in ${term}:`, error);
    return { success: false, error };
  }
}

// Try to fetch course-level grades (fallback)
async function tryFetchCourseGrades(term, subject, course) {
  try {
    const url = `${API_BASE_URL}/grades/${CAMPUS}/${term}/${subject}/${course}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data, usedTerm: term, usedSection: null };
    }
    
    return { success: false, status: response.status };
  } catch (error) {
    console.error(`Network error fetching course grades for ${subject} ${course} in ${term}:`, error);
    return { success: false, error };
  }
}

// Main function with comprehensive fallback logic
async function fetchGradesWithFallback(subject, course, requestedSection) {
  // Initialize terms cache
  const terms = await initializeTermsCache();
  let lastTriedTerm = null;
  
  // Iterate through terms newest to oldest
  for (const term of terms) {
    lastTriedTerm = term;
    console.log(`Trying term: ${term} for ${subject} ${course}`);
    
    // Step 1: Try the requested section first if provided
    if (requestedSection) {
      const result = await tryFetchGradesForSection(term, subject, course, requestedSection);
      if (result.success) {
        console.log(`Found grades for ${subject} ${course}-${requestedSection} in ${term}`);
        return result;
      }
    }
    
    // Step 2: Get all available sections for this term and course
    const sections = await getSections(term, subject, course);
    
    // Step 3: Try each section until one succeeds
    for (const section of sections) {
      // Skip the requested section if we already tried it
      if (section === requestedSection) continue;
      
      const result = await tryFetchGradesForSection(term, subject, course, section);
      if (result.success) {
        console.log(`Found grades for ${subject} ${course}-${section} in ${term}`);
        return result;
      }
    }
    
    console.log(`No section-level data found for ${subject} ${course} in ${term}`);
  }
  
  // Step 4: Final course-level fallback using the last tried term
  if (lastTriedTerm) {
    console.log(`Trying course-level fallback for ${subject} ${course} in ${lastTriedTerm}`);
    const result = await tryFetchCourseGrades(lastTriedTerm, subject, course);
    if (result.success) {
      console.log(`Found course-level grades for ${subject} ${course} in ${lastTriedTerm}`);
      return result;
    }
  }
  
  // No data found anywhere
  throw new Error(`No grades data found for ${subject} ${course} across all terms`);
}

// Legacy function for backward compatibility (updated to use new system)
async function fetchGrades(yearsession, subject, course, section) {
  const result = await fetchGradesWithFallback(subject, course, section);
  // Return data in the expected format for backward compatibility
  return {
    ...result.data,
    _usedTerm: result.usedTerm,
    _usedSection: result.usedSection
  };
}

// Export both functions
window.fetchGrades = fetchGrades;
window.fetchGradesWithFallback = fetchGradesWithFallback;