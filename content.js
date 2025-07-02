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

// ─── Instructor Parser Function ───
function parseInstructorFromPrintable(html) {
  // Use regex to find the JSON array after "label":"Instructor Teaching"
  const instructorRegex = /"label":"Instructor Teaching"[^}]*"instances":(\[[^\]]*\])/;
  const match = html.match(instructorRegex);
  
  if (!match) {
    return 'TBA';
  }
  
  // Attempt to parse the JSON array
  try {
    const instancesArray = JSON.parse(match[1]);
    
    // Extract the instructor name
    if (instancesArray.length > 0 && instancesArray[0].text) {
      return instancesArray[0].text;
    } else {
      return 'TBA';
    }
    
  } catch (error) {
    return 'TBA';
  }
}

// Function to search for professor ratings
async function searchProfessorRating(instructorName) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'getProfessors',
      name: instructorName,
      schoolId: '5436' // UBC school ID
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Runtime error:', chrome.runtime.lastError);
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

  // Find the wrapper with the automation ID
  const selectedItem = el.closest('[data-automation-id^="selectedItem_"]');
  const automationId = selectedItem?.getAttribute('data-automation-id');
  
  // Parse out the instanceId
  let instanceId;
  if (automationId) {
    instanceId = automationId.split('_')[1];
  } else {
    return;
  }

  // Construct the printable URL
  if (instanceId) {
    const objectCode = instanceId.split('$')[0];
    const printableUrl = `${window.location.origin}/ubc/inst/` +
                         `1$${objectCode}/${instanceId}.htmld`;
    
    // Fetch printable-view HTML
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
        
        // Parse instructor from HTML
        const instructorName = parseInstructorFromPrintable(htmlText);
        
        // Log the instructor name
        console.log('🎓 Instructor:', instructorName);
        
        // Search for professor rating if we have a valid instructor name
        if (instructorName && instructorName !== 'TBA') {
          try {
            const professorData = await searchProfessorRating(instructorName);
            if (professorData.success) {
              console.log('⭐ Professor rating found:', professorData.professor);
              
              // Store professor data for use in tooltip
              window.currentProfessorData = {
                name: instructorName,
                rating: professorData.professor.avgRating,
                difficulty: professorData.professor.avgDifficulty,
                numRatings: professorData.professor.numRatings,
                wouldTakeAgain: professorData.professor.wouldTakeAgainPercent,
                legacyId: professorData.professor.legacyId
              };
            } else {
              console.log('❌ Professor rating not found:', professorData.error);
              window.currentProfessorData = {
                name: instructorName,
                error: professorData.error
              };
            }
          } catch (error) {
            console.error('❌ Error fetching professor data:', error);
            window.currentProfessorData = {
              name: instructorName,
              error: 'Failed to fetch rating'
            };
          }
        } else {
          // Handle TBA case
          window.currentProfessorData = {
            name: 'TBA',
            tba: true
          };
        }
      }
      
    } catch (error) {
      // Silently handle errors
    }
    
  }
  // ────────────────────────────────────────────────

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
      upper: result.data.percentile_75,
      educators: result.data.educators
    });
    
    // Add professor rating information if available
    if (window.currentProfessorData) {
      const profData = window.currentProfessorData;
      const ratingDiv = document.createElement('div');
      ratingDiv.className = 'professor-section';
      
      if (profData.tba) {
        // Simple TBA message
        ratingDiv.innerHTML = `
          <div style="text-align: center; padding: 12px; font-size: 12px; color: #6b7280; font-style: italic;">
            Instructor not yet assigned
          </div>
        `;
      } else if (profData.error) {
        // Error state
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
        // Success state with improved styling
        const ratingText = profData.rating ? `${profData.rating}/5` : 'N/A';
        const difficultyText = profData.difficulty ? `${profData.difficulty}/5` : 'N/A';
        const wouldTakeAgainText = profData.wouldTakeAgain ? 
          `${profData.wouldTakeAgain % 1 === 0 ? Math.round(profData.wouldTakeAgain) : parseFloat(profData.wouldTakeAgain).toFixed(1)}%` : 'N/A';
        
        // Create clickable professor name
        const professorNameSpan = document.createElement('span');
        professorNameSpan.textContent = profData.name;
        professorNameSpan.className = 'professor-name';
        professorNameSpan.title = 'Click to view on RateMyProfessors';
        
        // Make only the name clickable
        if (profData.legacyId) {
          professorNameSpan.onclick = (e) => {
            e.stopPropagation();
            window.open(`https://www.ratemyprofessors.com/professor/${profData.legacyId}`, '_blank');
          };
        }
        
        // Build the review count text
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
              <div style="font-size: 16px; font-weight: 800; color: #059669; margin-bottom: 1px;">${ratingText}</div>
              <div style="font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Rating</div>
            </div>
            <div style="text-align: center; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="font-size: 16px; font-weight: 800; color: #dc2626; margin-bottom: 1px;">${difficultyText}</div>
              <div style="font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Difficulty</div>
            </div>
            <div style="text-align: center; padding: 8px; background: white; border-radius: 6px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="font-size: 16px; font-weight: 800; color: #7c3aed; margin-bottom: 1px;">${wouldTakeAgainText}</div>
              <div style="font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Would Take Again</div>
            </div>
          </div>
        `;
        
        // Insert the clickable name into the name container
        const nameContainer = ratingDiv.querySelector('#professor-name-container');
        nameContainer.appendChild(professorNameSpan);
      }
      
      tip.appendChild(ratingDiv);
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