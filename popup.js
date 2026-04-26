(() => {
  let companyIndex = null;
  const INITIAL_SHOW = 20;

  let filters = {
    search: "",
    sort: "count",
    priorities: [],
    activeTab: "problem",
  };

  // ===== SAVE / RESTORE STATE =====
  function saveState() {
    chrome.storage.local.set({ ctagsFilters: filters });
  }

  function restoreState(callback) {
    chrome.storage.local.get("ctagsFilters", (result) => {
      if (result.ctagsFilters) {
        filters = result.ctagsFilters;
      }
      callback();
    });
  }

  // ===== APPLY RESTORED STATE TO UI =====
  function applyStateToUI() {
    const allBtns = document.querySelectorAll(".tab-btn");
    for (let i = 0; i < allBtns.length; i++) {
      allBtns[i].classList.remove("active");
      if (allBtns[i].getAttribute("data-tab") === filters.activeTab) {
        allBtns[i].classList.add("active");
      }
    }

    const allTabs = document.querySelectorAll(".tab-content");
    for (let j = 0; j < allTabs.length; j++) {
      allTabs[j].classList.remove("active");
    }
    document.getElementById("tab-" + filters.activeTab).classList.add("active");

    document.getElementById("company-search").value = filters.search;

    const sortPills = document.querySelectorAll("#sort-pills .filter-pill");
    for (let k = 0; k < sortPills.length; k++) {
      sortPills[k].classList.remove("active");
      if (sortPills[k].getAttribute("data-sort") === filters.sort) {
        sortPills[k].classList.add("active");
      }
    }

    const priPills = document.querySelectorAll("#priority-pills .filter-pill");
    for (let m = 0; m < priPills.length; m++) {
      const val = priPills[m].getAttribute("data-priority");
      priPills[m].classList.remove("active");

      if (filters.priorities.length === 0 && val === "all") {
        priPills[m].classList.add("active");
      } else if (filters.priorities.indexOf(val) !== -1) {
        priPills[m].classList.add("active");
      }
    }
  }

  // ===== TABS =====
  function initTabs() {
    const btns = document.querySelectorAll(".tab-btn");
    for (let i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        const target = this.getAttribute("data-tab");

        const allBtns = document.querySelectorAll(".tab-btn");
        for (let j = 0; j < allBtns.length; j++) {
          allBtns[j].classList.remove("active");
        }
        this.classList.add("active");

        const allTabs = document.querySelectorAll(".tab-content");
        for (let k = 0; k < allTabs.length; k++) {
          allTabs[k].classList.remove("active");
        }
        document.getElementById("tab-" + target).classList.add("active");

        filters.activeTab = target;
        saveState();
      });
    }
  }

  // ===== DETECT THEME =====
  function detectTheme() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) return;

      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "GET_DATA" },
        (response) => {
          if (chrome.runtime.lastError || !response) return;
          if (response.theme === "light") {
            document.body.classList.add("light");
          }
        }
      );
    });
  }

  // ===== LOAD CURRENT PROBLEM =====
  function loadCurrentProblem() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        document.getElementById("problem").textContent = "No active tab.";
        return;
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "GET_DATA" },
        (response) => {
          const problemEl = document.getElementById("problem");
          const metaEl = document.getElementById("meta");
          const companiesEl = document.getElementById("problem-companies");

          if (chrome.runtime.lastError || !response) {
            problemEl.textContent = "No LeetCode problem detected.";
            return;
          }

          const slug = response.problem || "Unknown";
          const display = slug
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          problemEl.textContent = display;

          if (response.meta && response.meta.tag) {
            metaEl.innerHTML =
              '<span class="meta-tag">' + response.meta.tag + "</span>";
          } else {
            metaEl.innerHTML =
              '<span class="meta-tag" style="opacity:0.4;">No priority data</span>';
          }

          const companies = response.companies || [];
          if (companies.length === 0) {
            companiesEl.innerHTML =
              '<span class="no-data-text">No company data available.</span>';
          } else {
            let html = "";
            for (let i = 0; i < companies.length; i++) {
              html +=
                '<span class="popup-chip">' + companies[i].name + "</span>";
            }
            companiesEl.innerHTML = html;
          }
        }
      );
    });
  }

  // ===== LOAD COMPANY INDEX =====
  function loadCompanyIndex() {
    chrome.runtime.sendMessage(
      { type: "GET_COMPANY_INDEX" },
      (response) => {
        if (chrome.runtime.lastError || !response || !response.ready) {
          document.getElementById("company-list").innerHTML =
            '<div class="loading-text">Data still loading, try again shortly.</div>';
          return;
        }

        companyIndex = response.companyIndex;
        renderCompanyList();
        initSearch();
        initFilters();
      }
    );
  }

  // ===== INIT FILTERS =====
  function initFilters() {
    const sortPills = document.querySelectorAll("#sort-pills .filter-pill");
    for (let i = 0; i < sortPills.length; i++) {
      sortPills[i].addEventListener("click", function () {
        setActivePill("sort-pills", this);
        filters.sort = this.getAttribute("data-sort");
        saveState();
        renderCompanyList();
      });
    }

    const priPills = document.querySelectorAll("#priority-pills .filter-pill");
    for (let k = 0; k < priPills.length; k++) {
      priPills[k].addEventListener("click", function () {
        const value = this.getAttribute("data-priority");
        handlePriorityClick(value, this);
        saveState();
        renderCompanyList();
      });
    }
  }

  function handlePriorityClick(value, el) {
    const allBtn = document.querySelector(
      '#priority-pills .filter-pill[data-priority="all"]'
    );

    if (value === "all") {
      filters.priorities = [];
      const pills = document.querySelectorAll("#priority-pills .filter-pill");
      for (let i = 0; i < pills.length; i++) {
        pills[i].classList.remove("active");
      }
      allBtn.classList.add("active");
      return;
    }

    const idx = filters.priorities.indexOf(value);
    if (idx === -1) {
      filters.priorities.push(value);
      el.classList.add("active");
    } else {
      filters.priorities.splice(idx, 1);
      el.classList.remove("active");
    }

    if (filters.priorities.length === 0) {
      allBtn.classList.add("active");
    } else {
      allBtn.classList.remove("active");
    }

    if (filters.priorities.length === 3) {
      filters.priorities = [];
      const allPills = document.querySelectorAll(
        "#priority-pills .filter-pill"
      );
      for (let j = 0; j < allPills.length; j++) {
        allPills[j].classList.remove("active");
      }
      allBtn.classList.add("active");
    }
  }

  function setActivePill(containerId, activeEl) {
    const pills = document.querySelectorAll("#" + containerId + " .filter-pill");
    for (let i = 0; i < pills.length; i++) {
      pills[i].classList.remove("active");
    }
    activeEl.classList.add("active");
  }

  // ===== PRIORITY MATCHING =====
  function matchesPriority(tag) {
    if (filters.priorities.length === 0) return true;

    for (let i = 0; i < filters.priorities.length; i++) {
      const p = filters.priorities[i];
      if (p === "high" && tag && tag.indexOf("High") !== -1) return true;
      if (p === "medium" && tag && tag.indexOf("Medium") !== -1) return true;
      if (p === "low" && tag && tag.indexOf("Low") !== -1) return true;
    }
    return false;
  }

  // ===== IMPORTANCE SCORE =====
  function getImportanceScore(problems) {
    let score = 0;
    for (let i = 0; i < problems.length; i++) {
      const tag = problems[i].tag || "";
      if (tag.indexOf("High") !== -1) {
        score += 3;
      } else if (tag.indexOf("Medium") !== -1) {
        score += 2;
      } else {
        score += 1;
      }
    }
    return score;
  }

  // ===== FILTER LOGIC =====
  function getFilteredNames() {
    let names = Object.keys(companyIndex);

    if (filters.search) {
      const lower = filters.search.toLowerCase();
      names = names.filter((name) => name.toLowerCase().indexOf(lower) !== -1);
    }

    if (filters.priorities.length > 0) {
      names = names.filter((name) => {
        const problems = companyIndex[name].problems;
        for (let i = 0; i < problems.length; i++) {
          if (matchesPriority(problems[i].tag)) return true;
        }
        return false;
      });
    }

    if (filters.sort === "count") {
      names.sort((a, b) => {
        const countA = getFilteredProblems(companyIndex[a].problems).length;
        const countB = getFilteredProblems(companyIndex[b].problems).length;
        return countB - countA;
      });
    } else if (filters.sort === "importance") {
      names.sort((a, b) => {
        const promsA = getFilteredProblems(companyIndex[a].problems);
        const promsB = getFilteredProblems(companyIndex[b].problems);
        const scoreA = getImportanceScore(promsA);
        const scoreB = getImportanceScore(promsB);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return promsB.length - promsA.length;
      });
    } else if (filters.sort === "az") {
      names.sort((a, b) => a.localeCompare(b));
    } else if (filters.sort === "za") {
      names.sort((a, b) => b.localeCompare(a));
    }

    return names;
  }

  function getFilteredProblems(problems) {
    if (filters.priorities.length === 0) return problems;
    return problems.filter((p) => matchesPriority(p.tag));
  }

  // ===== RENDER COMPANY LIST =====
  function renderCompanyList() {
    const container = document.getElementById("company-list");
    const statsEl = document.getElementById("company-stats");
    container.innerHTML = "";

    const names = getFilteredNames();

    statsEl.textContent = names.length + " companies";

    if (names.length === 0) {
      container.innerHTML =
        '<div class="no-results">No companies match your filters.</div>';
      return;
    }

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const entry = companyIndex[name];
      fragment.appendChild(buildCompanyRow(name, entry));
    }

    container.appendChild(fragment);
  }

  // ===== BUILD COMPANY ROW =====
  function buildCompanyRow(name, entry) {
    const row = document.createElement("div");
    row.className = "company-row";

    const header = document.createElement("div");
    header.className = "company-row-header";

    const nameSpan = document.createElement("span");
    nameSpan.className = "company-name";
    nameSpan.textContent = name;

    const filteredProblems = getFilteredProblems(entry.problems);

    const countSpan = document.createElement("span");
    countSpan.className = "company-count";
    countSpan.textContent = filteredProblems.length + " problems";

    header.appendChild(nameSpan);
    header.appendChild(countSpan);

    const problemsDiv = document.createElement("div");
    problemsDiv.className = "company-problems";

    let isBuilt = false;

    header.addEventListener("click", () => {
      if (!isBuilt) {
        const sorted = filteredProblems.slice().sort(
          (a, b) => getProblemWeight(b) - getProblemWeight(a)
        );
        buildProblemLinks(problemsDiv, sorted);
        isBuilt = true;
      }
      problemsDiv.classList.toggle("expanded");
    });

    row.appendChild(header);
    row.appendChild(problemsDiv);
    return row;
  }

  function getProblemWeight(problem) {
    const tag = problem.tag || "";
    if (tag.indexOf("High") !== -1) return 3 + problem.freq;
    if (tag.indexOf("Medium") !== -1) return 2 + problem.freq;
    return 1 + problem.freq;
  }

  // ===== BUILD PROBLEM LINKS =====
  function buildProblemLinks(container, problems) {
    const showing = Math.min(problems.length, INITIAL_SHOW);

    for (let i = 0; i < showing; i++) {
      container.appendChild(buildProblemLink(problems[i]));
    }

    if (problems.length > INITIAL_SHOW) {
      const moreBtn = document.createElement("button");
      moreBtn.className = "show-more-btn";
      moreBtn.textContent =
        "Show " + (problems.length - INITIAL_SHOW) + " more";

      moreBtn.addEventListener("click", () => {
        moreBtn.remove();
        for (let j = INITIAL_SHOW; j < problems.length; j++) {
          container.appendChild(buildProblemLink(problems[j]));
        }
      });

      container.appendChild(moreBtn);
    }
  }

  // ===== BUILD SINGLE PROBLEM LINK =====
  function buildProblemLink(problem) {
    const link = document.createElement("a");
    link.className = "problem-link";
    link.href = "https://leetcode.com/problems/" + problem.slug + "/";
    link.target = "_blank";
    link.rel = "noopener";

    const nameSpan = document.createElement("span");
    const displayName = problem.slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    nameSpan.textContent = displayName;

    link.appendChild(nameSpan);

    if (problem.tag) {
      const tagSpan = document.createElement("span");
      tagSpan.className = "problem-tag-mini";

      if (problem.tag.indexOf("High") !== -1) {
        tagSpan.classList.add("high");
        tagSpan.textContent = "High";
      } else if (problem.tag.indexOf("Medium") !== -1) {
        tagSpan.classList.add("medium");
        tagSpan.textContent = "Med";
      } else {
        tagSpan.classList.add("low");
        tagSpan.textContent = "Low";
      }

      link.appendChild(tagSpan);
    }

    return link;
  }

  // ===== SEARCH =====
  function initSearch() {
    const searchInput = document.getElementById("company-search");
    let debounceTimer = null;

    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      const value = searchInput.value;
      debounceTimer = setTimeout(() => {
        filters.search = value;
        saveState();
        renderCompanyList();
      }, 200);
    });
  }

  // ===== INIT =====
  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    detectTheme();
    loadCurrentProblem();

    restoreState(() => {
      applyStateToUI();
      loadCompanyIndex();
    });
  });
})();