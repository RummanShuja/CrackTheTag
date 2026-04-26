# 🔓 CrackTheTag

**Unlock company tags on LeetCode problems — for free.**

CrackTheTag is a Chrome extension that reveals which companies ask every LeetCode question, without needing a premium subscription.

[Install from Chrome Web Store](https://chromewebstore.google.com/detail/ojiifgpoaehndflkpfmlfmgfglppndem)

---

## ✨ Features

### On LeetCode Problem Pages
- 🏷️ **Unlocked company tags** — see which companies ask each problem
- 🔥 **Priority badges** — High / Medium / Low importance next to the title
- 🎨 **Native UI integration** — matches LeetCode's design perfectly
- 🌙 **Dark + Light mode** — auto-detects your LeetCode theme

### In the Extension Popup
- 📋 **Problem tab** — quick view of current problem's companies and priority
- 🏢 **Companies tab** — browse all 90+ companies and their problems
- 🔍 **Search** — instantly find any company
- 🎛️ **Smart filters**
  - Sort by: Most Problems / Importance / A→Z / Z→A
  - Filter by priority: High / Med / Low (multi-select)
- 💾 **Persistent filters** — your filter settings survive popup close/reopen

---

## 📸 Screenshots
![img1](https://github.com/RummanShuja/CrackTheTag/blob/4a686a5fff88b1c3a93b5cc76de44c3e8dab0d9d/screenshots/img1.png?raw=true)

![img2](https://github.com/RummanShuja/CrackTheTag/blob/4a686a5fff88b1c3a93b5cc76de44c3e8dab0d9d/screenshots/img2.png?raw=true)

![img3](https://github.com/RummanShuja/CrackTheTag/blob/4a686a5fff88b1c3a93b5cc76de44c3e8dab0d9d/screenshots/img3.png?raw=true)

![img4](https://github.com/RummanShuja/CrackTheTag/blob/4a686a5fff88b1c3a93b5cc76de44c3e8dab0d9d/screenshots/img4.png?raw=true)

---

## 🚀 Install

### Chrome Web Store
🕐 Currently under review. Link will be added once approved.

### Manual Install (Developer)
1. Clone this repo
   ```bash
   git clone https://github.com/RummanShuja/CrackTheTag.git
   ```
2. Add your `final.json` data file to `company_data/final/`
3. Open `chrome://extensions` in Chrome
4. Enable **Developer Mode** (top right)
5. Click **Load unpacked** → select the `CrackTheTag` folder
6. Navigate to any LeetCode problem — done!

---

## 📁 Project Structure

```
CrackTheTag/
├── manifest.json          # Extension config (Manifest V3)
├── background.js          # Service worker — loads data, handles tab updates
├── contentScript.js       # Injects UI into LeetCode pages
├── styles.css             # Injected page styles (dark + light mode)
├── popup.html             # Extension popup markup
├── popup.js               # Popup logic — tabs, filters, search
├── popup.css              # Popup styles
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── screenshots/
│   ├── img1.png
│   ├── img2.png
│   ├── img3.png
│   └── img4.png
└── company_data/
    └── final/
        └── final.json     # Company frequency data (not included in repo)
```

---

## 🛠️ Tech Stack

- **Chrome Extension Manifest V3**
- **Vanilla JavaScript** — zero dependencies, zero frameworks
- **CSS** — hand-written, no preprocessors
- **Chrome Storage API** — for persisting filter state

---

## 📊 Data

The company frequency data (`final.json`) is **not included** in this repository.

The data covers **1600+ LeetCode problems** across **100+ companies** including Amazon, Google, Microsoft, Meta, Apple, and more.

Each problem includes:
- List of companies that ask it
- Frequency score per company
- Priority classification (High / Medium / Low)

The extension on the Chrome Web Store comes pre-bundled with this data.

### Attribution

The company data used in this extension is derived from the dataset maintained by:

👉 [LeetCode-Questions-CompanyWise](https://github.com/krishnadey30/LeetCode-Questions-CompanyWise) by [@krishnadey30](https://github.com/krishnadey30)

The raw data has been processed, scored, and classified into priority tiers for use in this extension.

---

## 🤝 Contributing

Found a bug? Have a feature idea? Contributions are welcome!

1. Fork the repo
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

Feel free to open an [Issue](https://github.com/RummanShuja/CrackTheTag/issues) to suggest features or report bugs.

---

## 📝 Changelog

### v1.0.0
- Initial release
- Company tags on problem pages
- Priority badges (High / Medium / Low)
- Extension popup with Problem and Companies tabs
- Search, sort, and multi-select priority filters
- Filter state persistence across popup sessions
- Dark and light mode support

---

## ⚖️ License

MIT License — see [LICENSE](LICENSE) for details.

---

## ⭐ Support

If CrackTheTag helps your interview prep:
- ⭐ **Star this repo**
- 📢 **Share** with friends who grind LeetCode

---

<p align="center">
  <b>Built with ☕ and frustration at locked company tags.</b>
</p>

