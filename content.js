document.addEventListener("mouseover", function (e) {
    console.log("🛠️ [Extension] content.js loaded on", window.location.href);
    const el = e.target;
    if (el.matches(".course-title")) {
      console.log("Hovered:", el.textContent.trim());
      // In future: fetch and show course/professor info
    }
  });