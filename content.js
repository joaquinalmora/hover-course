const SELECTOR = 'div[data-automation-id="promptOption"]';
const CONTAINER_PREFIX = '[id^="wd-FacetedSearchResultList-"]';

let courseListContainer = null;
function getCourseContainer() {
  if (courseListContainer && document.body.contains(courseListContainer)) {
    return courseListContainer;
  }
  const candidates = Array.from(document.querySelectorAll(CONTAINER_PREFIX));
  courseListContainer = candidates.reduce((best, c) => {
    const count = c.querySelectorAll(SELECTOR).length;
    const bestCount = best ? best.querySelectorAll(SELECTOR).length : -1;
    return count > bestCount ? c : best;
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
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}


document.addEventListener('mouseover', async (e) => {
  const el = e.target.closest(SELECTOR);
  if (!el) return;
  const container = getCourseContainer();
  if (!container || !container.contains(el)) return;

  const courseText = el.textContent.trim();
  const rect = el.getBoundingClientRect();
  showTooltip(`Loading info for ${courseText}...`,
              rect.left + window.scrollX,
              rect.bottom + window.scrollY + 5);
});

document.addEventListener('mouseout', (e) => {
  const el = e.target.closest(SELECTOR);
  const container = getCourseContainer();
  if (!el || !container || !container.contains(el)) return;
  hideTooltip();
});