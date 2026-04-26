let dataSet = {};
let companyIndex = {};
let dataReady = false;

const MAX_COMPANIES_PER_PROBLEM = 25;

function buildCompanyIndex(data) {
  const index = {};
  const slugs = Object.keys(data);

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const entry = data[slug];
    if (!entry || !entry.companies) continue;

    for (let j = 0; j < entry.companies.length; j++) {
      const company = entry.companies[j];
      const name = company.name;

      if (!index[name]) {
        index[name] = { count: 0, problems: [] };
      }

      index[name].count++;
      index[name].problems.push({
        slug: slug,
        freq: company.freq,
        tag: entry.meta ? entry.meta.tag : null,
      });
    }
  }

  const names = Object.keys(index);
  for (let k = 0; k < names.length; k++) {
    index[names[k]].problems.sort((a, b) => b.freq - a.freq);
  }

  return index;
}

fetch(chrome.runtime.getURL("company_data/final/final.json"))
  .then((res) => res.json())
  .then((data) => {
    dataSet = data;
    companyIndex = buildCompanyIndex(data);
    dataReady = true;
    console.log(
      "[CTags] Loaded " +
        Object.keys(dataSet).length +
        " problems, " +
        Object.keys(companyIndex).length +
        " companies"
    );
  })
  .catch((err) => {
    console.error("[CTags] Failed to load data:", err);
  });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PROBLEM") {
    if (!dataReady) {
      sendResponse({ problem: message.slug, meta: null, companies: [] });
      return true;
    }

    const entry = dataSet[message.slug];
    const meta = entry ? entry.meta : null;
    const companies = entry
      ? entry.companies.slice(0, MAX_COMPANIES_PER_PROBLEM)
      : [];

    sendResponse({
      problem: message.slug,
      meta: meta,
      companies: companies,
    });
    return true;
  }

  if (message.type === "GET_COMPANY_INDEX") {
    sendResponse({
      companyIndex: companyIndex,
      ready: dataReady,
    });
    return true;
  }
});