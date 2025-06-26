console.log(" grades.js loaded");

const API_V3_BASE = 'https://ubcgrades.com/api/v3';
const API_V2_BASE = 'https://ubcgrades.com/api/v2';
const CAMPUS = 'UBCO';

let v3TermsCache = null;
let v2TermsCache = null;
let sectionsCache = new Map();
let instructorsCache = new Map();

async function fetchV3Terms() {
  if (v3TermsCache) return v3TermsCache;
  
  try {
    const response = await fetch(`${API_V3_BASE}/yearsessions/${CAMPUS}`);
    if (!response.ok) throw new Error(`Failed to fetch v3 terms: ${response.status}`);
    
    const terms = await response.json();
    v3TermsCache = terms.sort((a, b) => b.localeCompare(a));
    console.log('V3 terms cache initialized:', v3TermsCache);
    return v3TermsCache;
  } catch (error) {
    console.error('Failed to initialize v3 terms cache:', error);
    v3TermsCache = ['2023W', '2023S', '2022W', '2022S', '2021W', '2021S'];
    return v3TermsCache;
  }
}

async function fetchV2Terms() {
  if (v2TermsCache) return v2TermsCache;
  
  try {
    const response = await fetch(`${API_V2_BASE}/yearsessions/${CAMPUS}`);
    if (!response.ok) throw new Error(`Failed to fetch v2 terms: ${response.status}`);
    
    const terms = await response.json();
    v2TermsCache = terms.sort((a, b) => b.localeCompare(a));
    console.log('V2 terms cache initialized:', v2TermsCache);
    return v2TermsCache;
  } catch (error) {
    console.error('Failed to initialize v2 terms cache:', error);
    v2TermsCache = [];
    return v2TermsCache;
  }
}

async function getSections(apiBase, term, subject, course) {
  const cacheKey = `${apiBase}-${term}-${subject}-${course}`;
  
  if (sectionsCache.has(cacheKey)) {
    return sectionsCache.get(cacheKey);
  }
  
  try {
    const response = await fetch(`${apiBase}/sections/${CAMPUS}/${term}/${subject}/${course}`);
    if (!response.ok) {
      sectionsCache.set(cacheKey, []);
      return [];
    }
    
    const sections = await response.json();
    sectionsCache.set(cacheKey, sections);
    return sections;
  } catch (error) {
    console.error(`Failed to fetch sections for ${subject} ${course} in ${term}:`, error);''
    sectionsCache.set(cacheKey, []);
    return [];
  }
}

async function tryFetchGradesForSection(apiBase, term, subject, course, section) {
  try {
    const url = `${apiBase}/grades/${CAMPUS}/${term}/${subject}/${course}/${section}`;
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

async function tryFetchCourseGrades(apiBase, term, subject, course) {
  try {
    const url = `${apiBase}/grades/${CAMPUS}/${term}/${subject}/${course}`;
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

async function tryTermWithAPI(apiBase, term, subject, course, requestedSection) {
  console.log(`Trying term: ${term} for ${subject} ${course} with ${apiBase}`);
  
  if (requestedSection) {
    const result = await tryFetchGradesForSection(apiBase, term, subject, course, requestedSection);
    if (result.success) {
      console.log(`Found grades for ${subject} ${course}-${requestedSection} in ${term}`);
      return result;
    }
  }
  
  const sections = await getSections(apiBase, term, subject, course);
  
  for (const section of sections) {
    if (section === requestedSection) continue;
    
    const result = await tryFetchGradesForSection(apiBase, term, subject, course, section);
    if (result.success) {
      console.log(`Found grades for ${subject} ${course}-${section} in ${term}`);
      return result;
    }
  }
  
  const courseResult = await tryFetchCourseGrades(apiBase, term, subject, course);
  if (courseResult.success) {
    console.log(`Found course-level grades for ${subject} ${course} in ${term}`);
    return courseResult;
  }
  
  return { success: false };
}

async function fetchWithDualFallback(subject, course, requestedSection) {
  const v3Terms = await fetchV3Terms();
  
  for (const term of v3Terms) {
    const result = await tryTermWithAPI(API_V3_BASE, term, subject, course, requestedSection);
    if (result.success) {
      return result;
    }
  }
  
  console.log('Phase 1 (v3) complete, trying Phase 2 (v2)');
  
  const v2Terms = await fetchV2Terms();
  const oldestV3Term = v3Terms[v3Terms.length - 1];
  const filteredV2Terms = v2Terms.filter(term => term < oldestV3Term);
  
  for (const term of filteredV2Terms) {
    const result = await tryTermWithAPI(API_V2_BASE, term, subject, course, requestedSection);
    if (result.success) {
      return result;
    }
  }
  
  throw new Error(`No grades data found for ${subject} ${course} across all terms`);
}

async function fetchGrades(yearsession, subject, course, section) {
  const result = await fetchWithDualFallback(subject, course, section);
  return {
    ...result.data,
    _usedTerm: result.usedTerm,
    _usedSection: result.usedSection
  };
}

async function fetchInstructors(term, subject, course) {
  console.log('DEBUG fetchInstructors called with', term, subject, course);
  
  const cacheKey = `UBCO|${term}|${subject}|${course}`;
  
  if (instructorsCache.has(cacheKey)) {
    return instructorsCache.get(cacheKey);
  }
  
  try {
    const url = `${API_V3_BASE}/course-statistics/teaching-team/UBCO/${subject}/${course}`;
    console.log('DEBUG fetchInstructors fetching URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      instructorsCache.set(cacheKey, []);
      return [];
    }
    
    const responseData = await response.json();
    console.log('RAW teaching-team response for', subject, course, responseData);
    
    const instructorsArray = responseData;
    const filteredList = instructorsArray.filter(instructor => {
      return instructor.yearsessions && instructor.yearsessions[term];
    });
    
    console.log('FILTERED instructors for', term, subject, course, filteredList);
    
    instructorsCache.set(cacheKey, filteredList);
    return filteredList;
  } catch (error) {
    console.error(`Failed to fetch instructors for ${subject} ${course} in ${term}:`, error);
    instructorsCache.set(cacheKey, []);
    return [];
  }
}

window.fetchGrades = fetchGrades;
window.fetchWithDualFallback = fetchWithDualFallback;
window.fetchInstructors = fetchInstructors;