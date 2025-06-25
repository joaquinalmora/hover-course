const SELECTOR = 'div[data-automation-id="promptOption"]';
const CONTAINER_PREFIX = '[id^="wd-FacetedSearchResultList-"]';
let courseListContainer = null;
function getCourseContainer() {
  if (courseListContainer && document.body.contains(courseListContainer)) return courseListContainer;
  const candidates = Array.from(document.querySelectorAll(CONTAINER_PREFIX));
  courseListContainer = candidates.reduce((best, c) => {
    return c.querySelectorAll(SELECTOR).length > (best?.querySelectorAll(SELECTOR).length || -1)
      ? c
      : best;
  }, null);
  return courseListContainer;
}
let tooltip = null;
function getTooltip() {
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'course-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
  }
  return tooltip;
}
function showTooltip(text, x, y) {
  const tip = getTooltip();
  tip.textContent = text;
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
  tip.style.display = 'block';
}
function hideTooltip() {
  if (tooltip) tooltip.style.display = 'none';
}
document.addEventListener('mouseover', async e => {
  const el = e.target.closest(SELECTOR);
  if (!el) return;
  const container = getCourseContainer();
  if (!container || !container.contains(el)) return;

  const fullText = el.textContent.trim().split(' - ')[0];
  const tokens = fullText.split(' ');
  if (tokens.length < 2) return;
  const subjectRaw = tokens[0];
  if (!subjectRaw.includes('_')) return;
  const subject = subjectRaw.split('_')[0];
  const [course, section] = tokens[1].split('-');

  const rect = el.getBoundingClientRect();
  const x = rect.left + window.scrollX;
  const y = rect.bottom + window.scrollY + 5;

  showTooltip('Loading grades...', x, y);

  try {
    const grades = await fetchGrades(null,subject, course, section);
    console.log('RAW GRADES DATA:', grades);

    const dist = grades.grades
    const gradeText = Object.entries(dist)
      .map(([grade, count]) => `${grade}: ${count}`)
      .join(', ');
      showTooltip(`Avg: ${grades.average}$ ${gradeText}`, x, y);
      } catch {
        showTooltip('Grades unavailable', x, y);
  }
});
document.addEventListener('mouseout', e => {
  const el = e.target.closest(SELECTOR);
  const container = getCourseContainer();
  if (!el || !container || !container.contains(el)) return;
  hideTooltip();
});