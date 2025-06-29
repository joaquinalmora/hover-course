import { searchSchool, getProfessorRatingAtSchoolId } from "ratemyprofessor-api";

let _ubcoId: string | null = null;

async function getUBCOid(): Promise<string | null> {
  if (_ubcoId) return _ubcoId;
  const schools = await searchSchool("University of British Columbia Okanagan");
  _ubcoId = schools?.[0]?.node?.id || null;
  return _ubcoId;
}

const SELECTOR = 'div[data-automation-id="promptOption"]';

document.addEventListener('mouseover', async (e) => {
  const el = e.target as HTMLElement;
  const targetEl = el.closest(SELECTOR) as HTMLElement;
  if (!targetEl) return;

  // Check if we're on a detail page with instructor info
  if (!location.pathname.includes('/d/inst/')) return;

  const profName = targetEl.textContent?.trim();
  if (!profName) return;

  console.log('Hovering over instructor:', profName);

  try {
    const schoolId = await getUBCOid();
    if (schoolId) {
      console.log('Fetching RMP rating for:', profName, 'at school ID:', schoolId);
      const rating = await getProfessorRatingAtSchoolId(profName, schoolId);
      if (rating) {
        console.log('RMP Rating found:', rating);
        
        // Create tooltip if it doesn't exist
        let tip = document.getElementById('rmp-tooltip') as HTMLElement;
        if (!tip) {
          tip = document.createElement('div');
          tip.id = 'rmp-tooltip';
          tip.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ccc;
            padding: 8px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 9999;
            font-size: 12px;
            color: #444;
            display: none;
          `;
          document.body.appendChild(tip);
        }

        const rect = targetEl.getBoundingClientRect();
        tip.textContent = `RMP: ${rating.avgRating.toFixed(1)} ★ (n=${rating.numRatings})`;
        tip.style.left = `${rect.right + window.scrollX + 10}px`;
        tip.style.top = `${rect.top + window.scrollY}px`;
        tip.style.display = 'block';
      } else {
        console.log('No RMP rating found for:', profName);
      }
    }
  } catch (error) {
    console.error('Error fetching RMP rating:', error);
  }
});

document.addEventListener('mouseout', (e) => {
  const el = e.target as HTMLElement;
  const targetEl = el.closest(SELECTOR);
  if (!targetEl) return;

  const tip = document.getElementById('rmp-tooltip');
  if (tip) {
    tip.style.display = 'none';
  }
});
