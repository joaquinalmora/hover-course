"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/ratemyprofessor-api/dist/index.js
  var require_dist = __commonJS({
    "node_modules/ratemyprofessor-api/dist/index.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.searchProfessorsAtSchoolId = searchProfessorsAtSchoolId;
      exports.searchSchool = searchSchool2;
      exports.getProfessorRatingAtSchoolId = getProfessorRatingAtSchoolId2;
      var API_LINK = "https://www.ratemyprofessors.com/graphql";
      var HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json",
        Authorization: "Basic dGVzdDp0ZXN0",
        "Sec-GPC": "1",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        Priority: "u=4"
      };
      var TEACHER_BODY_QUERY = '"query TeacherSearchResultsPageQuery(\\n  $query: TeacherSearchQuery!\\n  $schoolID: ID\\n  $includeSchoolFilter: Boolean!\\n) {\\n  search: newSearch {\\n    ...TeacherSearchPagination_search_1ZLmLD\\n  }\\n  school: node(id: $schoolID) @include(if: $includeSchoolFilter) {\\n    __typename\\n    ... on School {\\n      name\\n    }\\n    id\\n  }\\n}\\n\\nfragment TeacherSearchPagination_search_1ZLmLD on newSearch {\\n  teachers(query: $query, first: 8, after: \\"\\") {\\n    didFallback\\n    edges {\\n      cursor\\n      node {\\n        ...TeacherCard_teacher\\n        id\\n        __typename\\n      }\\n    }\\n    pageInfo {\\n      hasNextPage\\n      endCursor\\n    }\\n    resultCount\\n    filters {\\n      field\\n      options {\\n        value\\n        id\\n      }\\n    }\\n  }\\n}\\n\\nfragment TeacherCard_teacher on Teacher {\\n  id\\n  legacyId\\n  avgRating\\n  numRatings\\n  ...CardFeedback_teacher\\n  ...CardSchool_teacher\\n  ...CardName_teacher\\n  ...TeacherBookmark_teacher\\n}\\n\\nfragment CardFeedback_teacher on Teacher {\\n  wouldTakeAgainPercent\\n  avgDifficulty\\n}\\n\\nfragment CardSchool_teacher on Teacher {\\n  department\\n  school {\\n    name\\n    id\\n  }\\n}\\n\\nfragment CardName_teacher on Teacher {\\n  firstName\\n  lastName\\n}\\n\\nfragment TeacherBookmark_teacher on Teacher {\\n  id\\n  isSaved\\n}\\n"';
      var SCHOOL_BODY_QUERY = `"query NewSearchSchoolsQuery(\\n  $query: SchoolSearchQuery!\\n) {\\n  newSearch {\\n    schools(query: $query) {\\n      edges {\\n        cursor\\n        node {\\n          id\\n          legacyId\\n          name\\n          city\\n          state\\n          departments {\\n            id\\n            name\\n          }\\n          numRatings\\n          avgRatingRounded\\n          summary {\\n            campusCondition\\n            campusLocation\\n            careerOpportunities\\n            clubAndEventActivities\\n            foodQuality\\n            internetSpeed\\n            libraryCondition\\n            schoolReputation\\n            schoolSafety\\n            schoolSatisfaction\\n            socialActivities\\n          }\\n        }\\n      }\\n      pageInfo {\\n        hasNextPage\\n        endCursor\\n      }\\n    }\\n  }\\n}\\n"`;
      function searchProfessorsAtSchoolId(professorName, schoolId) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const response = yield fetch(API_LINK, {
              credentials: "include",
              headers: HEADERS,
              body: `{"query":${TEACHER_BODY_QUERY},"variables":{"query":{"text":"${professorName}","schoolID":"${schoolId}","fallback":true,"departmentID":null},"schoolID":"${schoolId}","includeSchoolFilter":true}}`,
              method: "POST",
              mode: "cors"
            });
            if (!response.ok) {
              throw new Error("Network response from RMP not OK");
            }
            const data = yield response.json();
            return data.data.search.teachers.edges;
          } catch (error) {
            console.error(error);
          }
        });
      }
      function searchSchool2(schoolName) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const response = yield fetch("https://www.ratemyprofessors.com/graphql", {
              credentials: "include",
              headers: HEADERS,
              body: `{"query":${SCHOOL_BODY_QUERY},"variables":{"query":{"text":"${schoolName}"}}}`,
              method: "POST",
              mode: "cors"
            });
            if (!response.ok) {
              throw new Error("Network response from RMP not OK");
            }
            const data = yield response.json();
            return data.data.newSearch.schools.edges;
          } catch (error) {
            console.error(error);
          }
        });
      }
      function getProfessorRatingAtSchoolId2(professorName, schoolId) {
        return __awaiter(this, void 0, void 0, function* () {
          const searchResults = yield searchProfessorsAtSchoolId(professorName, schoolId);
          if (searchResults === void 0 || searchResults.length == 0) {
            return {
              avgRating: -1,
              avgDifficulty: -1,
              wouldTakeAgainPercent: -1,
              numRatings: 0,
              formattedName: professorName,
              department: "",
              link: ""
            };
          }
          const professorResult = searchResults[0];
          return {
            avgRating: professorResult.node.avgRating,
            avgDifficulty: professorResult.node.avgDifficulty,
            wouldTakeAgainPercent: professorResult.node.wouldTakeAgainPercent,
            numRatings: professorResult.node.numRatings,
            formattedName: professorResult.node.firstName + " " + professorResult.node.lastName,
            department: professorResult.node.department,
            link: "https://www.ratemyprofessors.com/professor/" + professorResult.node.legacyId
          };
        });
      }
    }
  });

  // src/content.ts
  var import_ratemyprofessor_api = __toESM(require_dist());
  var _ubcoId = null;
  async function getUBCOid() {
    if (_ubcoId)
      return _ubcoId;
    const schools = await (0, import_ratemyprofessor_api.searchSchool)("University of British Columbia Okanagan");
    _ubcoId = schools?.[0]?.node?.id || null;
    return _ubcoId;
  }
  var SELECTOR = 'div[data-automation-id="promptOption"]';
  document.addEventListener("mouseover", async (e) => {
    const el = e.target;
    const targetEl = el.closest(SELECTOR);
    if (!targetEl)
      return;
    if (!location.pathname.includes("/d/inst/"))
      return;
    const profName = targetEl.textContent?.trim();
    if (!profName)
      return;
    console.log("Hovering over instructor:", profName);
    try {
      const schoolId = await getUBCOid();
      if (schoolId) {
        console.log("Fetching RMP rating for:", profName, "at school ID:", schoolId);
        const rating = await (0, import_ratemyprofessor_api.getProfessorRatingAtSchoolId)(profName, schoolId);
        if (rating) {
          console.log("RMP Rating found:", rating);
          let tip = document.getElementById("rmp-tooltip");
          if (!tip) {
            tip = document.createElement("div");
            tip.id = "rmp-tooltip";
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
          tip.textContent = `RMP: ${rating.avgRating.toFixed(1)} \u2605 (n=${rating.numRatings})`;
          tip.style.left = `${rect.right + window.scrollX + 10}px`;
          tip.style.top = `${rect.top + window.scrollY}px`;
          tip.style.display = "block";
        } else {
          console.log("No RMP rating found for:", profName);
        }
      }
    } catch (error) {
      console.error("Error fetching RMP rating:", error);
    }
  });
  document.addEventListener("mouseout", (e) => {
    const el = e.target;
    const targetEl = el.closest(SELECTOR);
    if (!targetEl)
      return;
    const tip = document.getElementById("rmp-tooltip");
    if (tip) {
      tip.style.display = "none";
    }
  });
})();
