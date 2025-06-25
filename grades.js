console.log(" grades.js loaded");

const API_BASE_URL = 'https://ubcgrades.com/api/v3';
const CAMPUS      = 'UBCO';
const DEFAULT_TERM = '2023W';



async function fetchGrades(yearsession, subject, course, section){
    const base = API_BASE_URL;
    const term = DEFAULT_TERM;
    const urlSection = `${base}/grades/${CAMPUS}/${term}/${subject}/${course}/${section}`;

    let res = await fetch(urlSection);
    if (res.ok) {
        return await res.json();
    }

    const urlCourse = `${base}/grades/${CAMPUS}/${term}/${subject}/${course}`;
    res = await fetch(urlCourse);
    if (res.ok) {
        return await res.json();
    }
    throw new Error(`Failed to fetch grades for ${subject} ${course}-${section}`);


}

window.fetchGrades = fetchGrades;