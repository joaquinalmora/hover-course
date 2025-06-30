// Background script for Course Hover extension
// Handles RateMyProfessors school ID lookup on startup

let UBC_RMP_SCHOOL_ID = "U2Nob29sLTU0MzY="; // Base64 encoded UBC school ID


// Function to lookup UBC school ID from RateMyProfessors
async function lookupUBCSchoolID() {
  try {
    console.log('🔍 Looking up UBC school ID from RateMyProfessors...');
    
    const response = await fetch('https://www.ratemyprofessors.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic dGVzdDp0ZXN0', // Basic auth for RMP GraphQL
      },
      body: JSON.stringify(SCHOOL_SEARCH_QUERY)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📡 schoolSearch response =', data);
    
    // Log any GraphQL errors
    if (data.errors) {
      console.log('🚨 GraphQL errors found:', data.errors);
    } else {
      console.log('✅ No GraphQL errors in response');
    }

    // Parse the response to find UBC using searchSchool path
    const edges = data?.data?.searchSchool?.edges;
    console.log('🔍 Raw edges value:', edges);
    
    if (!edges || edges.length === 0) {
      console.error('❌ No schools found in response, edges =', edges);
      throw new Error('No schools found in response');
    }

    // Extract the first school's ID
    const firstSchool = edges[0];
    if (!firstSchool || !firstSchool.node || !firstSchool.node.id) {
      console.error('❌ Invalid school data structure:', firstSchool);
      throw new Error('Invalid school data structure');
    }

    const schoolId = firstSchool.node.id;
    console.log('🎓 Found school:', firstSchool.node);
    console.log('✅ UBC schoolID =', schoolId);

    // Store the school ID persistently
    UBC_RMP_SCHOOL_ID = schoolId;
    await chrome.storage.local.set({ UBC_RMP_SCHOOL_ID: schoolId });
    console.log('💾 UBC school ID stored successfully');

    return schoolId;

  } catch (error) {
    console.error('❌ Failed to lookup UBC school ID:', error);
    console.error('❌ Error details:', error.message);
    return null;
  }
}

// Function to get stored school ID
async function getStoredSchoolID() {
  try {
    const result = await chrome.storage.local.get('UBC_RMP_SCHOOL_ID');
    return result.UBC_RMP_SCHOOL_ID || null;
  } catch (error) {
    console.error('❌ Failed to retrieve stored school ID:', error);
    return null;
  }
}

// Initialize on extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('🚀 Extension startup - checking UBC school ID...');
  
  // Check if we already have the school ID stored
  const storedId = await getStoredSchoolID();
  if (storedId) {
    UBC_RMP_SCHOOL_ID = storedId;
    console.log('✅ UBC schoolID = ' + storedId + ' (from storage)');
  } else {
    // Look it up if not stored
    await lookupUBCSchoolID();
  }
});

// Also run on extension install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('🔧 Extension installed - looking up UBC school ID...');
  await lookupUBCSchoolID();
});

// Expose function for content scripts to access the school ID
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getUBCSchoolID') {
    sendResponse({ schoolId: UBC_RMP_SCHOOL_ID });
  } else if (request.action === 'getProfessors') {
    // Handle professor search requests
    handleProfessorSearch(request, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

// Function to search for professors on RateMyProfessors
async function handleProfessorSearch(request, sendResponse) {
  try {
    const { name, schoolId } = request;
    console.log('🔍 Searching for professor:', name, 'at school:', UBC_RMP_SCHOOL_ID);
    
    // Build GraphQL query for teacher search
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
    
    // Fetch professor data from RateMyProfessors
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
    console.log('📡 Teacher search response =', data);
    
    // Check for GraphQL errors
    if (data.errors) {
      console.log('🚨 GraphQL errors:', data.errors);
      sendResponse({ success: false, error: 'GraphQL error occurred' });
      return;
    }
    
    // Extract teacher results
    const edges = data?.data?.newSearch?.teachers?.edges;
    console.log('🔍 Teacher edges found:', edges);
    
    if (!edges || edges.length === 0) {
      console.log('❌ No teachers found for:', name);
      sendResponse({ success: false, error: `No match found for ${name}` });
      return;
    }
    
    // Take the first (best) match
    const professor = edges[0].node;
    console.log('✅ Professor found:', professor);
    
    sendResponse({ success: true, professor: professor });
    
  } catch (error) {
    console.error('❌ Error searching for professor:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Run lookup immediately when background script loads
(async () => {
  console.log('📋 Background script loaded - initializing UBC school ID lookup...');
  
  // Check storage first
  const storedId = await getStoredSchoolID();
  if (storedId) {
    UBC_RMP_SCHOOL_ID = storedId;
    console.log('✅ UBC schoolID = ' + storedId + ' (from storage)');
  } else {
    // Look it up if not stored
    await lookupUBCSchoolID();
  }
})();
