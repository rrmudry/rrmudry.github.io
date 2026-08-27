/**
 * NGSS 9-12 Science Standards Explorer App
 * Pure JavaScript Filtering, Search, Interactive PE Modal & 8 SEPs Practice Hub
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const standards = window.NGSS_STANDARDS_DATA || [];
    const sepList = window.NGSS_SEP_DATA || [];

    let currentViewMode = 'PE'; // 'PE' (Performance Expectations) or 'SEP' (8 Science Practices)
    let searchQuery = '';
    let selectedDomain = 'ALL';
    let selectedIS = 'ALL';
    let selectedDimension = 'ALL';
    let savedBookmarks = new Set();

    // --- DOM Elements ---
    const viewBtnPE = document.getElementById('viewBtnPE');
    const viewBtnSEP = document.getElementById('viewBtnSEP');
    const sepViewHeader = document.getElementById('sepViewHeader');
    const peFiltersContainer = document.getElementById('peFiltersContainer');

    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const domainBtns = document.querySelectorAll('.chip-btn[data-domain]');
    const isBtns = document.querySelectorAll('.chip-btn[data-is]');
    const dimensionBtns = document.querySelectorAll('.chip-btn[data-dimension]');
    
    const standardsGrid = document.getElementById('standardsGrid');
    const sepGrid = document.getElementById('sepGrid');
    const resultsCountEl = document.getElementById('resultsCount');
    const activeFilterLabelEl = document.getElementById('activeFilterLabel');

    // Counts
    const countAllEl = document.getElementById('countAll');
    const countPSEl = document.getElementById('countPS');
    const countESSEl = document.getElementById('countESS');
    const countLSEl = document.getElementById('countLS');
    const countETSEl = document.getElementById('countETS');
    const countSavedEl = document.getElementById('countSaved');

    // PE Standard Modal Elements
    const modal = document.getElementById('standardModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalCode = document.getElementById('modalCode');
    const modalDomainPill = document.getElementById('modalDomainPill');
    const modalISPill = document.getElementById('modalISPill');
    const modalTitle = document.getElementById('modalTitle');
    const modalPE = document.getElementById('modalPE');
    const modalClarification = document.getElementById('modalClarification');
    const modalClarificationWrapper = document.getElementById('modalClarificationWrapper');
    const modalBoundary = document.getElementById('modalBoundary');
    const modalBoundaryWrapper = document.getElementById('modalBoundaryWrapper');
    const modalSEP = document.getElementById('modalSEP');
    const modalDCI = document.getElementById('modalDCI');
    const modalCCC = document.getElementById('modalCCC');
    const modalUnitBtn = document.getElementById('modalUnitBtn');
    const modalSaveBtn = document.getElementById('modalSaveBtn');

    // SEP Practice Modal Elements
    const sepModal = document.getElementById('sepModal');
    const closeSepModalBtn = document.getElementById('closeSepModalBtn');
    const closeSepModalBtnBottom = document.getElementById('closeSepModalBtnBottom');
    const sepModalBadge = document.getElementById('sepModalBadge');
    const sepModalIcon = document.getElementById('sepModalIcon');
    const sepModalTitle = document.getElementById('sepModalTitle');
    const sepModalTagline = document.getElementById('sepModalTagline');
    const sepModalQuestion = document.getElementById('sepModalQuestion');
    const sepModalSummary = document.getElementById('sepModalSummary');
    const sepModalExpectations = document.getElementById('sepModalExpectations');
    const sepModalSkills = document.getElementById('sepModalSkills');
    const sepModalApplications = document.getElementById('sepModalApplications');
    const sepModalStandards = document.getElementById('sepModalStandards');
    const sepModalFilterStandardsBtn = document.getElementById('sepModalFilterStandardsBtn');

    let currentModalItem = null;
    let currentModalSEP = null;

    // --- LocalStorage ---
    function loadSavedBookmarks() {
        const saved = localStorage.getItem('ngss_bookmarks');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                savedBookmarks = new Set(parsed);
            } catch (e) {}
        }
    }

    function saveBookmarksToStorage() {
        localStorage.setItem('ngss_bookmarks', JSON.stringify(Array.from(savedBookmarks)));
    }

    function toggleBookmark(code, event) {
        if (event) event.stopPropagation();
        if (savedBookmarks.has(code)) {
            savedBookmarks.delete(code);
        } else {
            savedBookmarks.add(code);
        }
        saveBookmarksToStorage();
        render();

        if (currentModalItem && currentModalItem.code === code) {
            updateModalBookmarkBtn(code);
        }
    }

    // --- SEP Helpers ---
    const SEP_NUMBER_MAP = {
        'asking questions and defining problems': 1,
        'developing and using models': 2,
        'planning and carrying out investigations': 3,
        'analyzing and interpreting data': 4,
        'using mathematics and computational thinking': 5,
        'constructing explanations and designing solutions': 6,
        'engaging in argument from evidence': 7,
        'obtaining, evaluating, and communicating information': 8
    };

    function getSEPNumber(sepName) {
        if (!sepName) return null;
        return SEP_NUMBER_MAP[sepName.toLowerCase().trim()] || null;
    }

    function formatSEPDisplay(sepName) {
        if (!sepName) return '';
        const num = getSEPNumber(sepName);
        return num ? `SEP ${num}: ${sepName}` : sepName;
    }

    function findSEPObject(query) {
        if (!query) return null;
        const q = String(query).toLowerCase().trim();

        // 1. Direct ID / code match
        let found = sepList.find(s => s.id === q || s.code.toLowerCase() === q);
        if (found) return found;

        // 2. Number match
        const numMatch = q.match(/(\d+)/);
        if (numMatch) {
            const num = parseInt(numMatch[1], 10);
            found = sepList.find(s => s.number === num);
            if (found) return found;
        }

        // 3. Name or keyword match
        found = sepList.find(s => s.name.toLowerCase().includes(q) || q.includes(s.name.toLowerCase()));
        if (found) return found;

        return null;
    }

    function getStandardsForSEP(sepObj) {
        if (!sepObj) return [];
        return standards.filter(std => {
            if (std.code === sepObj.code) return true;
            if (!std.sep) return false;
            return std.sep.toLowerCase().includes(sepObj.name.toLowerCase()) ||
                   sepObj.name.toLowerCase().includes(std.sep.toLowerCase());
        });
    }

    // --- View Switching ---
    function setViewMode(mode) {
        currentViewMode = mode;
        if (mode === 'SEP') {
            viewBtnSEP.classList.add('active');
            viewBtnSEP.setAttribute('aria-selected', 'true');
            viewBtnPE.classList.remove('active');
            viewBtnPE.setAttribute('aria-selected', 'false');

            sepViewHeader.classList.remove('hidden');
            peFiltersContainer.classList.add('hidden');

            standardsGrid.classList.add('hidden');
            sepGrid.classList.remove('hidden');

            activeFilterLabelEl.textContent = 'Dimension: 8 Science & Engineering Practices (9–12)';
        } else {
            viewBtnPE.classList.add('active');
            viewBtnPE.setAttribute('aria-selected', 'true');
            viewBtnSEP.classList.remove('active');
            viewBtnSEP.setAttribute('aria-selected', 'false');

            sepViewHeader.classList.add('hidden');
            peFiltersContainer.classList.remove('hidden');

            sepGrid.classList.add('hidden');
            standardsGrid.classList.remove('hidden');

            activeFilterLabelEl.textContent = `Domain: ${getDomainLabel(selectedDomain)}`;
        }
        render();
    }

    // --- Filtering Logic for PEs ---
    function filterStandards() {
        return standards.filter(item => {
            // 1. Domain Filter
            if (selectedDomain === 'SAVED') {
                if (!savedBookmarks.has(item.code)) return false;
            } else if (selectedDomain !== 'ALL' && item.domainCode !== selectedDomain) {
                return false;
            }

            // 2. CA Instructional Segment (IS) Filter
            if (selectedIS !== 'ALL') {
                if (item.is !== selectedIS) return false;
            }

            // 3. Search Query Filter
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase().trim();
                const matchesCode = item.code.toLowerCase().includes(q);
                const matchesTitle = item.title.toLowerCase().includes(q);
                const matchesPE = item.pe.toLowerCase().includes(q);

                // Check SEP including its number (e.g. "sep 4", "sep4", "analyzing")
                const sepNum = getSEPNumber(item.sep);
                const sepSearchString = sepNum 
                    ? `sep ${sepNum} sep${sepNum} ${item.sep.toLowerCase()}` 
                    : (item.sep ? item.sep.toLowerCase() : '');
                const matchesSEP = sepSearchString.includes(q);

                const matchesDCI = item.dci ? item.dci.toLowerCase().includes(q) : false;
                const matchesCCC = item.ccc ? item.ccc.toLowerCase().includes(q) : false;
                const matchesKeywords = item.keywords ? item.keywords.some(k => k.toLowerCase().includes(q)) : false;

                if (!matchesCode && !matchesTitle && !matchesPE && !matchesSEP && !matchesDCI && !matchesCCC && !matchesKeywords) {
                    return false;
                }
            }

            // 4. Dimension Focus Filter
            if (selectedDimension === 'SEP' && !item.sep) return false;
            if (selectedDimension === 'DCI' && !item.dci) return false;
            if (selectedDimension === 'CCC' && !item.ccc) return false;

            return true;
        });
    }

    function filterSEPs() {
        if (!searchQuery.trim()) return sepList;
        const q = searchQuery.toLowerCase().trim();
        return sepList.filter(sep => {
            if (sep.code.toLowerCase().includes(q)) return true;
            if (sep.name.toLowerCase().includes(q)) return true;
            if (sep.tagline.toLowerCase().includes(q)) return true;
            if (sep.summary.toLowerCase().includes(q)) return true;
            if (sep.essentialQuestion.toLowerCase().includes(q)) return true;
            if (sep.keywords && sep.keywords.some(k => k.toLowerCase().includes(q))) return true;
            if (sep.keySkills && sep.keySkills.some(s => s.toLowerCase().includes(q))) return true;
            return false;
        });
    }

    function updateCounts() {
        const counts = { ALL: standards.length, PS: 0, ESS: 0, LS: 0, ETS: 0, SAVED: savedBookmarks.size };
        standards.forEach(item => {
            if (counts[item.domainCode] !== undefined) {
                counts[item.domainCode]++;
            }
        });

        countAllEl.textContent = counts.ALL;
        countPSEl.textContent = counts.PS;
        countESSEl.textContent = counts.ESS;
        countLSEl.textContent = counts.LS;
        countETSEl.textContent = counts.ETS;
        countSavedEl.textContent = counts.SAVED;
    }

    // --- Render PE Standards Grid ---
    function renderPEGrid() {
        standardsGrid.innerHTML = '';
        const filtered = filterStandards();
        resultsCountEl.textContent = `Showing ${filtered.length} standard${filtered.length === 1 ? '' : 's'}`;

        if (filtered.length === 0) {
            standardsGrid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No Matching NGSS Standards Found</h3>
                    <p style="margin-top: 0.4rem;">Try adjusting your search terms or selecting another domain/segment filter.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(item => {
            const isSaved = savedBookmarks.has(item.code);
            const card = document.createElement('article');
            card.className = 'standard-card';

            // Set domain glow variable
            let domainVar = '--ps-color';
            let glowVar = '--ps-glow';
            if (item.domainCode === 'ESS') { domainVar = '--ess-color'; glowVar = '--ess-glow'; }
            else if (item.domainCode === 'LS') { domainVar = '--ls-color'; glowVar = '--ls-glow'; }
            else if (item.domainCode === 'ETS') { domainVar = '--ets-color'; glowVar = '--ets-glow'; }
            else if (item.domainCode === 'SEP') { domainVar = '--sep-color'; glowVar = '--ps-glow'; }

            card.style.setProperty('--card-accent', `var(${domainVar})`);
            card.style.setProperty('--card-glow', `var(${glowVar})`);

            card.innerHTML = `
                <div class="card-header">
                    <span class="code-badge">${item.code}</span>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        ${item.is ? `<span class="domain-pill" style="background: rgba(0,243,255,0.1); color: var(--ps-color); border-color: rgba(0,243,255,0.3);">${item.is}</span>` : ''}
                        <span class="domain-pill">${item.domain}</span>
                    </div>
                </div>
                <div>
                    <h3 class="card-title">${item.title}</h3>
                    <p class="card-pe-preview">${item.pe}</p>
                </div>
                <div class="dimensions-container">
                    ${item.sep ? `<span class="dim-pill dim-sep" title="Click to inspect this Practice (SEP)">🔵 ${formatSEPDisplay(item.sep)}</span>` : ''}
                    ${item.dci ? `<span class="dim-pill dim-dci">🟠 ${item.dci}</span>` : ''}
                    ${item.ccc ? `<span class="dim-pill dim-ccc">🟢 ${item.ccc}</span>` : ''}
                </div>
                <div class="card-footer">
                    <span class="topic-tag">📌 ${item.topic}</span>
                    <button class="bookmark-btn ${isSaved ? 'saved' : ''}" aria-label="Bookmark Standard" title="${isSaved ? 'Remove Bookmark' : 'Save Bookmark'}">
                        ${isSaved ? '★' : '☆'}
                    </button>
                </div>
            `;

            // Card Click opens PE modal
            card.addEventListener('click', () => openModal(item));

            // Blue SEP badge click inside card opens SEP Guide directly!
            const sepPill = card.querySelector('.dim-pill.dim-sep');
            if (sepPill && item.sep) {
                sepPill.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openSEPModal(item.sep);
                });
            }

            // Bookmark button click
            const bookmarkBtn = card.querySelector('.bookmark-btn');
            bookmarkBtn.addEventListener('click', (e) => toggleBookmark(item.code, e));

            standardsGrid.appendChild(card);
        });
    }

    // --- Render 8 Science Practices Grid ---
    function renderSEPGrid() {
        sepGrid.innerHTML = '';
        const filteredSEPs = filterSEPs();
        resultsCountEl.textContent = `Showing ${filteredSEPs.length} Science & Engineering Practice${filteredSEPs.length === 1 ? '' : 's'}`;

        if (filteredSEPs.length === 0) {
            sepGrid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No Matching Science Practices Found</h3>
                    <p style="margin-top: 0.4rem;">Try searching for error analysis, models, mathematics, or questions.</p>
                </div>
            `;
            return;
        }

        filteredSEPs.forEach(sep => {
            const matchedStds = getStandardsForSEP(sep);
            const card = document.createElement('article');
            card.className = 'sep-card';
            card.style.setProperty('--sep-accent', sep.color || 'var(--sep-color)');

            card.innerHTML = `
                <div>
                    <div class="sep-card-top">
                        <div class="sep-icon-wrapper">
                            ${sep.icon}
                        </div>
                        <span class="sep-number-badge">PRACTICE ${sep.number} OF 8</span>
                    </div>

                    <h3 class="sep-card-title">SEP ${sep.number}: ${sep.name}</h3>
                    <p class="sep-card-tagline">${sep.tagline}</p>
                </div>

                <div class="sep-card-qbox">
                    <strong>Essential Focus:</strong> "${sep.essentialQuestion}"
                </div>

                <div class="sep-card-footer">
                    <span class="sep-standards-count">
                        <span>📚</span> ${matchedStds.length} Aligned Standard${matchedStds.length === 1 ? '' : 's'}
                    </span>
                    <span class="sep-inspect-action">
                        <span>Inspect 9–12 Guide</span> ↗
                    </span>
                </div>
            `;

            card.addEventListener('click', () => openSEPModal(sep.id));
            sepGrid.appendChild(card);
        });
    }

    function render() {
        updateCounts();
        if (currentViewMode === 'SEP') {
            renderSEPGrid();
        } else {
            renderPEGrid();
        }
    }

    function getDomainLabel(domainCode) {
        switch (domainCode) {
            case 'PS': return 'Physical Science';
            case 'ESS': return 'Earth & Space';
            case 'LS': return 'Life Science';
            case 'ETS': return 'Engineering';
            case 'SAVED': return 'Bookmarks';
            default: return 'All Domains';
        }
    }

    // --- PE Modal Handler ---
    function openModal(item) {
        currentModalItem = item;
        modalCode.textContent = item.code;
        modalDomainPill.textContent = item.domain;
        
        if (item.is) {
            modalISPill.style.display = 'inline-block';
            modalISPill.textContent = `CA ${item.is}`;
        } else {
            modalISPill.style.display = 'none';
        }

        modalTitle.textContent = item.title;
        modalPE.textContent = item.pe;

        let domainVar = 'var(--ps-color)';
        if (item.domainCode === 'ESS') domainVar = 'var(--ess-color)';
        else if (item.domainCode === 'LS') domainVar = 'var(--ls-color)';
        else if (item.domainCode === 'ETS') domainVar = 'var(--ets-color)';
        else if (item.domainCode === 'SEP') domainVar = 'var(--sep-color)';
        modalCode.style.color = domainVar;

        if (item.clarification) {
            modalClarificationWrapper.style.display = 'block';
            modalClarification.textContent = item.clarification;
        } else {
            modalClarificationWrapper.style.display = 'none';
        }

        if (item.boundary) {
            modalBoundaryWrapper.style.display = 'block';
            modalBoundary.textContent = item.boundary;
        } else {
            modalBoundaryWrapper.style.display = 'none';
        }

        if (item.sep) {
            modalSEP.style.display = 'inline-flex';
            modalSEP.innerHTML = `🔵 <strong>Practice:</strong> ${formatSEPDisplay(item.sep)} <span style="margin-left: 4px; opacity: 0.8;">↗</span>`;
            modalSEP.onclick = (e) => {
                e.stopPropagation();
                openSEPModal(item.sep);
            };
        } else {
            modalSEP.style.display = 'none';
            modalSEP.onclick = null;
        }

        modalDCI.innerHTML = item.dci ? `🟠 <strong>DCI:</strong> ${item.dci}` : '';
        modalCCC.innerHTML = item.ccc ? `🟢 <strong>CCC:</strong> ${item.ccc}` : '';

        if (item.unitLink) {
            modalUnitBtn.href = item.unitLink;
            modalUnitBtn.style.display = 'inline-flex';
        } else {
            modalUnitBtn.style.display = 'none';
        }

        updateModalBookmarkBtn(item.code);
        modal.classList.remove('hidden');
    }

    function updateModalBookmarkBtn(code) {
        const isSaved = savedBookmarks.has(code);
        modalSaveBtn.innerHTML = isSaved ? '★ Bookmarked' : '☆ Bookmark Standard';
        modalSaveBtn.style.color = isSaved ? 'var(--accent-gold)' : 'var(--text-primary)';
    }

    function closeModal() {
        modal.classList.add('hidden');
        currentModalItem = null;
    }

    // --- SEP Modal Handler ---
    function openSEPModal(query) {
        const sep = findSEPObject(query);
        if (!sep) return;

        currentModalSEP = sep;

        sepModalBadge.textContent = `PRACTICE ${sep.number} OF 8`;
        sepModalIcon.textContent = sep.icon;
        sepModalTitle.textContent = `SEP ${sep.number}: ${sep.name}`;
        sepModalTagline.textContent = sep.tagline;
        sepModalQuestion.textContent = `"${sep.essentialQuestion}"`;
        
        sepModalSummary.innerHTML = `<p>${sep.summary}</p>`;
        
        sepModalExpectations.innerHTML = `
            <ul>
                ${sep.highSchoolExpectations.map(exp => `<li>${exp}</li>`).join('')}
            </ul>
        `;

        sepModalSkills.innerHTML = `
            <ul>
                ${sep.keySkills.map(skill => {
                    if (skill.includes(':')) {
                        const parts = skill.split(':');
                        return `<li><strong style="color: #60a5fa;">${parts[0]}:</strong>${parts.slice(1).join(':')}</li>`;
                    }
                    return `<li>${skill}</li>`;
                }).join('')}
            </ul>
        `;

        sepModalApplications.innerHTML = `
            <ul>
                ${sep.physicsApplications.map(app => `<li>${app}</li>`).join('')}
            </ul>
        `;

        // Render connected standards
        const matchedStds = getStandardsForSEP(sep);
        sepModalStandards.innerHTML = '';
        if (matchedStds.length === 0) {
            sepModalStandards.innerHTML = `<span style="color: #94a3b8; font-size: 0.85rem;">Integrated across general physical science inquiry investigations.</span>`;
        } else {
            matchedStds.forEach(std => {
                const btn = document.createElement('button');
                btn.className = 'sep-linked-std-pill';
                btn.title = `Click to view ${std.code}: ${std.title}`;
                btn.innerHTML = `
                    <span style="color: #00f3ff; font-weight: 700;">${std.code}</span>
                    <span style="color: #cbd5e1; font-weight: 500;">${std.title}</span>
                `;
                btn.addEventListener('click', () => {
                    closeSEPModal();
                    setViewMode('PE');
                    openModal(std);
                });
                sepModalStandards.appendChild(btn);
            });
        }

        // Action button to filter matching standards in main explorer view
        sepModalFilterStandardsBtn.onclick = () => {
            closeSEPModal();
            setViewMode('PE');
            searchQuery = `sep ${sep.number}`;
            searchInput.value = `sep ${sep.number}`;
            clearSearchBtn.classList.add('active');
            render();
        };

        sepModal.classList.remove('hidden');
    }

    function closeSEPModal() {
        sepModal.classList.add('hidden');
        currentModalSEP = null;
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // View Mode Switcher
        viewBtnPE.addEventListener('click', () => setViewMode('PE'));
        viewBtnSEP.addEventListener('click', () => setViewMode('SEP'));

        // Search Input
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            clearSearchBtn.classList.toggle('active', searchQuery.length > 0);
            render();
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.classList.remove('active');
            render();
        });

        // Domain Buttons
        domainBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                domainBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedDomain = btn.dataset.domain;
                render();
            });
        });

        // Instructional Segment (IS) Buttons
        isBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                isBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedIS = btn.dataset.is;
                render();
            });
        });

        // Dimension Buttons
        dimensionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dimensionBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedDimension = btn.dataset.dimension;
                
                // If user specifically clicks "Practices (SEP)", give them the option or switch to SEP view!
                if (selectedDimension === 'SEP') {
                    setViewMode('SEP');
                } else {
                    if (currentViewMode === 'SEP') {
                        setViewMode('PE');
                    }
                    render();
                }
            });
        });

        // PE Modal Controls
        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        modalSaveBtn.addEventListener('click', () => {
            if (currentModalItem) {
                toggleBookmark(currentModalItem.code);
            }
        });

        // SEP Modal Controls
        closeSepModalBtn.addEventListener('click', closeSEPModal);
        closeSepModalBtnBottom.addEventListener('click', closeSEPModal);
        sepModal.addEventListener('click', (e) => {
            if (e.target === sepModal) closeSEPModal();
        });

        // Escape Key Modal Close
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!sepModal.classList.contains('hidden')) {
                    closeSEPModal();
                } else if (!modal.classList.contains('hidden')) {
                    closeModal();
                }
            }
        });
    }

    // --- Init ---
    function init() {
        loadSavedBookmarks();
        setupEventListeners();
        render();
    }

    init();
});
