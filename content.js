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
  const x = rect.right + window.scrollX + 10;
  const initialY = rect.top + window.scrollY - 10;
  const tip = getTooltip();
  tip.style.left = x + 'px';
  tip.style.top  = initialY + 'px';
  tip.textContent = 'Loading grades...';
  tip.style.display = 'block';

  try {
    const data = await fetchGrades(null, subject, course, section);
    renderGradeChart(tip, data.grades, {
      term:   `${data.year}${data.session}`,
      course: `${subject} ${course}${section ? `-${section}` : ''}`,
      avg:    data.average.toFixed(1),
      median: data.median,
      lower:  data.percentile_25,
      upper:  data.percentile_75
    });
    const height = tip.offsetHeight;
    tip.style.top = (rect.top + window.scrollY - height - 10) + 'px';
    tip.style.display = 'block';
  } catch (e) {
    console.error(e);
    tip.textContent = 'Grades unavailable';
    tip.style.left = x + 'px';
    tip.style.top  = initialY + 'px';
    tip.style.display = 'block';
  }
});


document.addEventListener('mouseout', e => {
  const el = e.target.closest(SELECTOR);
  const container = getCourseContainer();
  if (!el || !container || !container.contains(el)) return;
  hideTooltip();
});