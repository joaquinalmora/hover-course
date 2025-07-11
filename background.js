let UBC_RMP_SCHOOL_ID = "U2Nob29sLTU0MzY=";


async function lookupUBCSchoolID() {
  try {
    const response = await fetch('https://www.ratemyprofessors.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic dGVzdDp0ZXN0',
      },
      body: JSON.stringify(SCHOOL_SEARCH_QUERY)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error('GraphQL errors found');
    }

    const edges = data?.data?.searchSchool?.edges;
    
    if (!edges || edges.length === 0) {
      throw new Error('No schools found in response');
    }

    const firstSchool = edges[0];
    if (!firstSchool || !firstSchool.node || !firstSchool.node.id) {
      throw new Error('Invalid school data structure');
    }

    const schoolId = firstSchool.node.id;

    UBC_RMP_SCHOOL_ID = schoolId;
    await chrome.storage.local.set({ UBC_RMP_SCHOOL_ID: schoolId });

    return schoolId;

  } catch (error) {
    return null;
  }
}

async function getStoredSchoolID() {
  try {
    const result = await chrome.storage.local.get('UBC_RMP_SCHOOL_ID');
    return result.UBC_RMP_SCHOOL_ID || null;
  } catch (error) {
    return null;
  }
}

chrome.runtime.onStartup.addListener(async () => {
  const storedId = await getStoredSchoolID();
  if (storedId) {
    UBC_RMP_SCHOOL_ID = storedId;
  } else {
    await lookupUBCSchoolID();
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await lookupUBCSchoolID();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getUBCSchoolID') {
    sendResponse({ schoolId: UBC_RMP_SCHOOL_ID });
  } else if (request.action === 'getProfessors') {
    handleProfessorSearch(request, sendResponse);
    return true;
  }
});

async function handleProfessorSearch(request, sendResponse) {
  try {
    const { name, schoolId } = request;
    
    const teacherSearchQuery = {
      query: `
        query SearchTeachers($query: TeacherSearchQuery!) {
          newSearch {
            teachers(query: $query) {
              edges {
                node {
                  id
                  legacyId
                  firstName
                  lastName
                  school {
                    name
                    id
                  }
                  department
                  avgRating
                  avgDifficulty
                  numRatings
                  wouldTakeAgainPercent
                }
              }
            }
          }
        }
      `,
      variables: {
        query: {
          text: name,
          schoolID: UBC_RMP_SCHOOL_ID || "U2Nob29sLTU0MzY="
        }
      }
    };
    
    const response = await fetch('https://www.ratemyprofessors.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic dGVzdDp0ZXN0',
      },
      body: JSON.stringify(teacherSearchQuery)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.errors) {
      sendResponse({ success: false, error: 'GraphQL error occurred' });
      return;
    }
    
    const edges = data?.data?.newSearch?.teachers?.edges;
    
    if (!edges || edges.length === 0) {
      sendResponse({ success: false, error: `No match found for ${name}` });
      return;
    }
    
    const professor = edges[0].node;
    
    sendResponse({ success: true, professor: professor });
    
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

(async () => {
  const storedId = await getStoredSchoolID();
  if (storedId) {
    UBC_RMP_SCHOOL_ID = storedId;
  } else {
    await lookupUBCSchoolID();
  }
})();
