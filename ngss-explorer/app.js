/**
 * NGSS 9-12 Science Standards Explorer App
 * Pure JavaScript Filtering, Search, & Interactive Modal Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const standards = window.NGSS_STANDARDS_DATA || [];
    let searchQuery = '';
    let selectedDomain = 'ALL';
    let selectedIS = 'ALL';
    let selectedDimension = 'ALL';
    let savedBookmarks = new Set();

    // --- DOM Elements ---
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const domainBtns = document.querySelectorAll('.chip-btn[data-domain]');
    const isBtns = document.querySelectorAll('.chip-btn[data-is]');
    const dimensionBtns = document.querySelectorAll('.chip-btn[data-dimension]');
    const standardsGrid = document.getElementById('standardsGrid');
    const resultsCountEl = document.getElementById('resultsCount');
    const activeFilterLabelEl = document.getElementById('activeFilterLabel');

    // Counts
    const countAllEl = document.getElementById('countAll');
    const countPSEl = document.getElementById('countPS');
    const countESSEl = document.getElementById('countESS');
    const countLSEl = document.getElementById('countLS');
    const countETSEl = document.getElementById('countETS');
    const countSavedEl = document.getElementById('countSaved');

    // Modal Elements
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

    let currentModalItem = null;

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

    // --- SEP Number Index Mapping ---
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

    // --- Filtering Logic ---
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

    // --- Render Grid ---
    function render() {
        updateCounts();
        const filtered = filterStandards();

        resultsCountEl.textContent = `Showing ${filtered.length} of ${standards.length} standards`;
        activeFilterLabelEl.textContent = `Domain: ${getDomainLabel(selectedDomain)}${selectedIS !== 'ALL' ? ' | ' + selectedIS : ''}`;

        standardsGrid.innerHTML = '';

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
                    ${item.sep ? `<span class="dim-pill dim-sep">🔵 ${formatSEPDisplay(item.sep)}</span>` : ''}
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

            // Card Click opens modal
            card.addEventListener('click', () => openModal(item));

            // Bookmark button click
            const bookmarkBtn = card.querySelector('.bookmark-btn');
            bookmarkBtn.addEventListener('click', (e) => toggleBookmark(item.code, e));

            standardsGrid.appendChild(card);
        });
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

    // --- Modal Handler ---
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

        modalSEP.innerHTML = item.sep ? `🔵 <strong>Practice:</strong> ${formatSEPDisplay(item.sep)}` : '';
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

    // --- Event Listeners ---
    function setupEventListeners() {
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
                render();
            });
        });

        // Modal Controls
        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        modalSaveBtn.addEventListener('click', () => {
            if (currentModalItem) {
                toggleBookmark(currentModalItem.code);
            }
        });

        // Escape Key Modal Close
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
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
