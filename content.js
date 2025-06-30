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
let hideTimeout = null;

function getTooltip() {
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'course-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.zIndex = '10000';
    document.body.appendChild(tooltip);
    
    // Add mouse events to the tooltip itself to prevent hiding when hovering over it
    tooltip.addEventListener('mouseenter', () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    });
    
    tooltip.addEventListener('mouseleave', () => {
      hideTooltipWithDelay();
    });
  }
  return tooltip;
}
function showTooltip(text, x, y) {
  const tip = getTooltip();
  tip.textContent = text;
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
  tip.style.display = 'block';
  
  // Clear any pending hide timeout
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
}

function hideTooltip() {
  if (tooltip) {
    tooltip.style.display = 'none';
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }
}

function hideTooltipWithDelay() {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
  hideTimeout = setTimeout(() => {
    hideTooltip();
  }, 300); // 300ms delay before hiding
}
document.addEventListener('mouseover', async e => {
  const el = e.target.closest(SELECTOR);
  if (!el) return;
  const container = getCourseContainer();
  if (!container || !container.contains(el)) return;

  // Clear any pending hide timeout when hovering over a course element
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  const fullText = el.textContent.trim().split(' - ')[0];
  const tokens = fullText.split(' ');
  if (tokens.length < 2) return;
  const subjectRaw = tokens[0];
  if (!subjectRaw.includes('_')) return;
  const subject = subjectRaw.split('_')[0];
  const [course, section] = tokens[1].split('-');
  if (!/^\d{3}$/.test(section)) return;

  const rect = el.getBoundingClientRect();
  const x = rect.right + window.scrollX + 10;
  const initialY = rect.top + window.scrollY - 10;
  const tip = getTooltip();
  tip.style.left = x + 'px';
  tip.style.top  = initialY + 'px';
  tip.innerHTML = '';
  tip.textContent = 'Loading grades...';
  tip.style.display = 'block';

  try {
    const result = await fetchWithDualFallback(subject, course, section);
    
    let courseDisplay = `${subject} ${course}`;
    if (result.usedSection) {
      courseDisplay += `-${result.usedSection}`;
    } else {
      courseDisplay += ' (Course-level data)';
    }
    
    tip.innerHTML = '';
    
    renderGradeChart(tip, result.data.grades, {
      term: result.usedTerm,
      course: courseDisplay,
      subject: subject,
      courseNumber: course,
      section: result.usedSection,
      avg: result.data.average.toFixed(1),
      median: result.data.median,
      lower: result.data.percentile_25,
      upper: result.data.percentile_75
    });
    
    if (result.data.educators) {
      const instructorDiv = document.createElement('div');
      instructorDiv.style.cssText = 'margin-top:8px;font-size:11px;color:#666;border-top:1px solid #eee;padding-top:6px;';
      instructorDiv.textContent = `Instructors: ${result.data.educators}`;
      tip.appendChild(instructorDiv);
    }
    
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
  
  // Only hide with delay if we're not moving to the tooltip
  const relatedTarget = e.relatedTarget;
  if (!relatedTarget || (!tooltip.contains(relatedTarget) && relatedTarget !== tooltip)) {
    hideTooltipWithDelay();
  }
});

document.addEventListener('click', e => {
  const clickedCourse = e.target.closest(SELECTOR);
  if (clickedCourse) {
    hideTooltip();
  }
});