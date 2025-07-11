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
  }, 300);
}

function parseInstructorFromPrintable(html) {
  const instructorRegex = /"label":"Instructor Teaching"[^}]*"instances":(\[[^\]]*\])/;
  const match = html.match(instructorRegex);
  
  if (!match) {
    return 'TBA';
  }
  
  try {
    const instancesArray = JSON.parse(match[1]);
    
    if (instancesArray.length > 0 && instancesArray[0].text) {
      return instancesArray[0].text;
    } else {
      return 'TBA';
    }
    
  } catch (error) {
    return 'TBA';
  }
}

async function searchProfessorRating(instructorName) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'getProfessors',
      name: instructorName,
      schoolId: '5436'
    }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: 'Runtime error' });
      } else {
        resolve(response);
      }
    });
  });
}

document.addEventListener('mouseover', async e => {
  const el = e.target.closest(SELECTOR);
  if (!el) return;
  const container = getCourseContainer();
  if (!container || !container.contains(el)) return;

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
  
  tip.innerHTML = `
    <div style="width:300px;padding:20px;background:white;border:1px solid #ddd;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:Arial,sans-serif;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:8px;color:#666;font-size:14px;">
        <div style="width:16px;height:16px;border:2px solid #e0e0e0;border-top:2px solid #2E5BBA;border-radius:50%;animation:spin 1s linear infinite;"></div>
        Loading data...
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
  
  tip.style.display = 'block';

  const selectedItem = el.closest('[data-automation-id^="selectedItem_"]');
  const automationId = selectedItem?.getAttribute('data-automation-id');
  
  let instanceId;
  if (automationId) {
    instanceId = automationId.split('_')[1];
  } else {
    return;
  }

  if (instanceId) {
    const objectCode = instanceId.split('$')[0];
    const printableUrl = `${window.location.origin}/ubc/inst/` +
                         `1$${objectCode}/${instanceId}.htmld`;
    
    try {
      const response = await fetch(printableUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (response.ok) {
        const htmlText = await response.text();
        
        const instructorName = parseInstructorFromPrintable(htmlText);
        
        if (instructorName && instructorName !== 'TBA') {
          try {
            const professorData = await searchProfessorRating(instructorName);
            if (professorData.success) {
              window.currentProfessorData = {
                name: instructorName,
                rating: professorData.professor.avgRating,
                difficulty: professorData.professor.avgDifficulty,
                numRatings: professorData.professor.numRatings,
                wouldTakeAgain: professorData.professor.wouldTakeAgainPercent,
                legacyId: professorData.professor.legacyId
              };
            } else {
              window.currentProfessorData = {
                name: instructorName,
                error: professorData.error
              };
            }
          } catch (error) {
            window.currentProfessorData = {
              name: instructorName,
              error: 'Failed to fetch rating'
            };
          }
        } else {
          window.currentProfessorData = {
            name: 'TBA',
            tba: true
          };
        }
      }
      
    } catch (error) {
    }
    
  }

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
      upper: result.data.percentile_75,
      educators: result.data.educators
    });
    
    if (window.currentProfessorData) {
      const profData = window.currentProfessorData;
      const ratingDiv = document.createElement('div');
      ratingDiv.className = 'professor-section';
      
      if (profData.tba) {
        ratingDiv.innerHTML = `
          <div style="text-align: center; padding: 12px; font-size: 12px; color: #6b7280; font-style: italic;">
            Instructor not yet assigned
          </div>
        `;
      } else if (profData.error) {
        ratingDiv.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <div>
              <div style="font-weight: 600; color: #64748b; font-size: 14px;">${profData.name}</div>
              <div style="font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px;">Professor</div>
            </div>
          </div>
          <div style="text-align: center; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px;">
            <div style="font-size: 11px; color: #856404;">Rating data unavailable</div>
          </div>
        `;
      } else {
        const ratingText = profData.rating ? `${profData.rating}/5` : 'N/A';
        const difficultyText = profData.difficulty ? `${profData.difficulty}/5` : 'N/A';
        const wouldTakeAgainText = profData.wouldTakeAgain ? 
          `${profData.wouldTakeAgain % 1 === 0 ? Math.round(profData.wouldTakeAgain) : parseFloat(profData.wouldTakeAgain).toFixed(1)}%` : 'N/A';
        
        const ratingColor = profData.rating ? getColorGradient(profData.rating, 1, 5, false) : '#6b7280';
        const difficultyColor = profData.difficulty ? getColorGradient(profData.difficulty, 1, 5, true) : '#6b7280';
        const wouldTakeAgainColor = profData.wouldTakeAgain ? getColorGradient(profData.wouldTakeAgain, 0, 100, false) : '#6b7280';
        
        
        const professorNameSpan = document.createElement('span');
        professorNameSpan.textContent = profData.name;
        professorNameSpan.className = 'professor-name';
        professorNameSpan.title = 'Click to view on RateMyProfessors';
        
        if (profData.legacyId) {
          professorNameSpan.onclick = (e) => {
            e.stopPropagation();
            window.open(`https://www.ratemyprofessors.com/professor/${profData.legacyId}`, '_blank');
          };
        }
        
        
        const reviewCountText = profData.numRatings ? ` (${profData.numRatings} reviews)` : '';
        
        ratingDiv.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <div id="professor-name-container" style="font-size: 14px;"></div>
              <span style="font-size: 10px; color: #94a3b8; font-style: italic;">${reviewCountText}</span>
            </div>
            <div style="font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 500;">RateMyProfessors</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
            <div style="text-align: center; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="font-size: 16px; font-weight: 800; color: ${ratingColor}; margin-bottom: 1px;">${ratingText}</div>
              <div style="font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Rating</div>
            </div>
            <div style="text-align: center; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="font-size: 16px; font-weight: 800; color: ${difficultyColor}; margin-bottom: 1px;">${difficultyText}</div>
              <div style="font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Difficulty</div>
            </div>
            <div style="text-align: center; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="font-size: 16px; font-weight: 800; color: ${wouldTakeAgainColor}; margin-bottom: 1px;">${wouldTakeAgainText}</div>
              <div style="font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Would Take Again</div>
            </div>
          </div>
        `;
        
        const nameContainer = ratingDiv.querySelector('#professor-name-container');
        nameContainer.appendChild(professorNameSpan);
      }
      
      tip.appendChild(ratingDiv);
    }
    
    const height = tip.offsetHeight;
    tip.style.top = (rect.top + window.scrollY - height - 10) + 'px';
    tip.style.display = 'block';
  } catch (e) {
    tip.innerHTML = `
      <div style="width:300px;padding:20px;background:white;border:1px solid #ddd;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-family:Arial,sans-serif;text-align:center;">
        <div style="color:#dc2626;font-size:14px;font-weight:500;">
          ⚠️ Grade data unavailable
        </div>
        <div style="color:#666;font-size:12px;margin-top:4px;">
          No data found for this course
        </div>
      </div>
    `;
    tip.style.left = x + 'px';
    tip.style.top  = initialY + 'px';
    tip.style.display = 'block';
  }
});


document.addEventListener('mouseout', e => {
  const el = e.target.closest(SELECTOR);
  const container = getCourseContainer();
  if (!el || !container || !container.contains(el)) return;
  
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

function getColorGradient(value, min, max, isReversed = false) {
  const clampedValue = Math.max(min, Math.min(max, value));
  const normalizedValue = (clampedValue - min) / (max - min);
  
  const adjustedValue = isReversed ? 1 - normalizedValue : normalizedValue;
  
  let r, g, b;

  
  if (adjustedValue <= 0.25) {
    const t = adjustedValue / 0.25; 
    r = Math.round(180 + (220 - 180) * t); 
    g = Math.round(10 + (100 - 10) * t); 
    b = Math.round(10 + (25 - 10) * t); 
  } else if (adjustedValue <= 0.5) {

    const t = (adjustedValue - 0.25) / 0.25; 
    r = Math.round(220 + (255 - 220) * t); 
    g = Math.round(100 + (193 - 100) * t); 
    b = Math.round(25 + (38 - 25) * t); 
  } else if (adjustedValue <= 0.75) {
    const t = (adjustedValue - 0.5) / 0.25;
    r = Math.round(255 - (155 - 34) * t); 
  g = Math.round(193 + (197 - 193) * t); 
    b = Math.round(38 + (71 - 38) * t); 
  } else {
    const t = (adjustedValue - 0.75) / 0.25; 
    r = Math.round(100 - (100 - 21) * t); 
    g = Math.round(197 - (197 - 128) * t); 
    b = Math.round(71 + (53 - 71) * t); 
  }
  
  return `rgb(${r}, ${g}, ${b})`;
}