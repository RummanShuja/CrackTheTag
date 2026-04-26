(() => {
  let data = null;
  let lastSlug = null;
  let dropdownOpen = false;

  function getSlugFromUrl() {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
  }

  function getTitleElement() {
    return document.querySelector(
      'div.text-title-large a[href^="/problems/"]'
    );
  }

  function isDarkMode() {
    return document.documentElement.classList.contains("dark");
  }

  function getTagsRow() {
    const allElements = document.querySelectorAll("a, button, div, span");
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const text = el.textContent.trim();
      if (
        (text === "Companies" || text === "Topics") &&
        el.closest("div.mt-1, div.flex")
      ) {
        const row =
          el.closest("div.mt-1") ||
          el.closest("div.flex.gap-1") ||
          el.parentElement;
        if (row) return row;
      }
    }

    const svgs = document.querySelectorAll("svg");
    for (let j = 0; j < svgs.length; j++) {
      const parent = svgs[j].closest("a, button");
      if (parent && parent.textContent.includes("Companies")) {
        return parent.parentElement;
      }
    }

    return null;
  }

  function getUnlockedLockSvg() {
    return '<svg class="ctags-lock-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18 10h-1V7A5 5 0 0 0 7.1 5.7L8.6 7a3.5 3.5 0 0 1 6.9 0v3H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1-1.42V10zM12 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5.5 2.5h-11v-8h11v8z"/></svg>';
  }

  function renderPriorityBadge() {
    const title = getTitleElement();
    if (!title) return;

    const existing = document.getElementById("ctags-priority-badge");
    const slug = getSlugFromUrl();

    if (existing && slug === lastSlug) return;
    if (existing) existing.remove();
    if (!data || !data.meta || !data.meta.tag) return;

    const badge = document.createElement("span");
    badge.id = "ctags-priority-badge";
    badge.className = "ctags-priority-badge";
    badge.textContent = data.meta.tag;
    title.parentElement.insertBefore(badge, title.nextSibling);
  }

  function buildCompanyChips(companies) {
    const container = document.createElement("div");
    container.className = "ctags-company-chips";

    if (!companies || companies.length === 0) {
      const noData = document.createElement("div");
      noData.className = "ctags-no-data";
      noData.textContent = "No company data available for this problem.";
      container.appendChild(noData);
      return container;
    }

    for (let i = 0; i < companies.length; i++) {
      const chip = document.createElement("span");
      chip.className = "ctags-chip";
      chip.textContent = companies[i].name;
      container.appendChild(chip);
    }

    return container;
  }

  function insertCompanyButton(tagsRow) {
    if (document.getElementById("ctags-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "ctags-wrapper";
    wrapper.className = "ctags-wrapper";

    const btn = document.createElement("button");
    btn.className = "ctags-company-btn";
    btn.innerHTML = getUnlockedLockSvg() + "<span>Companies</span>";
    btn.title = "View company tags (CrackTheTag)";

    const dropdown = document.createElement("div");
    dropdown.className = "ctags-dropdown";

    const header = document.createElement("div");
    header.className = "ctags-dropdown-header";

    if (data && data.companies && data.companies.length > 0) {
      const count = data.meta ? data.meta.numCompanies : data.companies.length;
      header.textContent = "Asked by " + count + " companies";
    } else {
      header.textContent = "Companies";
    }

    dropdown.appendChild(header);
    const companies = data ? data.companies || [] : [];
    dropdown.appendChild(buildCompanyChips(companies));

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownOpen = !dropdownOpen;
      dropdown.classList.toggle("ctags-visible", dropdownOpen);
    });

    document.addEventListener(
      "click",
      (e) => {
        if (!wrapper.contains(e.target)) {
          dropdownOpen = false;
          dropdown.classList.remove("ctags-visible");
        }
      },
      true
    );

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);
    tagsRow.appendChild(wrapper);
  }

  function renderCompanyButton() {
    const existing = document.getElementById("ctags-wrapper");
    const slug = getSlugFromUrl();

    if (existing && slug === lastSlug) return;
    if (existing) existing.remove();

    const tagsRow = getTagsRow();
    if (!tagsRow) return;
    insertCompanyButton(tagsRow);
  }

  function cleanup() {
    const badge = document.getElementById("ctags-priority-badge");
    if (badge) badge.remove();
    const wrapper = document.getElementById("ctags-wrapper");
    if (wrapper) wrapper.remove();
    dropdownOpen = false;
  }

  function render() {
    const slug = getSlugFromUrl();
    if (!slug) return;
    renderPriorityBadge();
    renderCompanyButton();
    lastSlug = slug;
  }

  function requestData() {
    const slug = getSlugFromUrl();
    if (!slug || slug === lastSlug) return;

    chrome.runtime.sendMessage(
      { type: "GET_PROBLEM", slug: slug },
      (response) => {
        if (response) {
          data = {
            problem: response.problem,
            meta: response.meta,
            companies: response.companies || [],
          };
          lastSlug = null;
          cleanup();
          render();
        }
      }
    );
  }

  function startObserver() {
    let debounceTimer = null;
    let lastObservedSlug = null;
    let isRendering = false;

    const observer = new MutationObserver(() => {
      if (isRendering) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const slug = getSlugFromUrl();

        if (slug !== lastObservedSlug) {
          cleanup();
          lastSlug = null;
          lastObservedSlug = slug;
          requestData();
          return;
        }

        const needsBadge = !document.getElementById("ctags-priority-badge");
        const needsButton = !document.getElementById("ctags-wrapper");

        if (needsBadge || needsButton) {
          isRendering = true;
          render();
          isRendering = false;
        }
      }, 600);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "GET_DATA") {
      sendResponse({
        problem: data ? data.problem : null,
        meta: data ? data.meta : null,
        companies: data ? data.companies : [],
        theme: isDarkMode() ? "dark" : "light",
      });
    }
  });

  // Initial load
  requestData();
  startObserver();
})();