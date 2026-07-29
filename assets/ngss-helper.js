/**
 * NGSS Cross-Site Integration Helper
 * Allows any Unit Dashboard, Lesson Plan, or Web App across rrmudry.github.io
 * to pull, query, and render interactive NGSS Standards badges & details.
 */

(function () {
    const NGSSHelper = {
        /**
         * Get standard object by code (e.g. 'HS-PS2-1')
         */
        getStandard: function (code) {
            const data = window.NGSS_STANDARDS_DATA || [];
            return data.find(item => item.code.toUpperCase() === code.toUpperCase()) || null;
        },

        /**
         * Get standards for an Instructional Segment (e.g. 'IS1', 'IS2', etc.)
         */
        getStandardsByIS: function (isCode) {
            const data = window.NGSS_STANDARDS_DATA || [];
            return data.filter(item => item.is === isCode.toUpperCase());
        },

        /**
         * Get standards by domain code ('PS', 'ESS', 'LS', 'ETS')
         */
        getStandardsByDomain: function (domainCode) {
            const data = window.NGSS_STANDARDS_DATA || [];
            return data.filter(item => item.domainCode === domainCode.toUpperCase());
        },

        /**
         * Get standards by an array of codes
         */
        getStandardsByCodes: function (codesArray) {
            const data = window.NGSS_STANDARDS_DATA || [];
            const set = new Set(codesArray.map(c => c.toUpperCase()));
            return data.filter(item => set.has(item.code.toUpperCase()));
        },

        /**
         * Render an interactive NGSS Standards Banner inside a target HTML container.
         * @param {Array<string>} codesArray - e.g. ['HS-PS2-4', 'HS-PS2-5', 'HS-PS3-5']
         * @param {string} containerId - Target element ID
         */
        renderStandardsBanner: function (codesArray, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const items = this.getStandardsByCodes(codesArray);
            if (items.length === 0) return;

            let html = `
                <div class="ngss-banner-card" style="background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(0, 243, 255, 0.2); border-radius: 16px; padding: 1.25rem; margin-top: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <h4 style="font-size: 0.85rem; font-weight: 700; color: #00f3ff; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 0.4rem;">
                            <span>📚</span> NGSS Target Standards Alignment
                        </h4>
                        <a href="ngss-explorer/index.html" target="_blank" style="font-size: 0.75rem; color: #94a3b8; text-decoration: none; font-weight: 600;">Open Full Explorer ↗</a>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
            `;

            items.forEach(std => {
                html += `
                    <button class="ngss-pill-btn" data-ngss-code="${std.code}" style="background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255, 255, 255, 0.15); color: #f8fafc; padding: 0.4rem 0.75rem; border-radius: 10px; font-family: inherit; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 0.4rem;">
                        <span style="color: #00f3ff; font-weight: 700;">${std.code}</span>
                        <span style="color: #cbd5e1; font-weight: 500;">${std.title}</span>
                    </button>
                `;
            });

            html += `
                    </div>
                </div>
            `;

            container.innerHTML = html;

            // Attach click listeners to launch popover modal
            const btns = container.querySelectorAll('.ngss-pill-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const code = btn.dataset.ngssCode;
                    this.showStandardModal(code);
                });
            });
        },

        /**
         * Show standard detail modal popover on any page
         */
        showStandardModal: function (code) {
            const std = this.getStandard(code);
            if (!std) return;

            let modalEl = document.getElementById('ngss-helper-modal');
            if (!modalEl) {
                modalEl = document.createElement('div');
                modalEl.id = 'ngss-helper-modal';
                modalEl.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(3, 7, 18, 0.85); backdrop-filter: blur(10px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 9999; padding: 1rem; opacity: 1; transition: opacity 0.3s ease;
                `;
                document.body.appendChild(modalEl);
            }

            modalEl.innerHTML = `
                <div style="background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(0, 243, 255, 0.4); border-radius: 20px; padding: 2rem; max-width: 650px; width: 100%; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.8); position: relative; color: #f8fafc;">
                    <button id="closeNgssHelperModal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; font-size: 1.2rem; cursor: pointer;">&times;</button>
                    <div style="display: flex; gap: 0.6rem; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 1.4rem; font-weight: 800; color: #00f3ff;">${std.code}</span>
                        <span style="font-size: 0.75rem; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 6px; color: #94a3b8;">${std.domain}</span>
                        ${std.is ? `<span style="font-size: 0.75rem; background: rgba(0,243,255,0.15); padding: 2px 8px; border-radius: 6px; color: #00f3ff;">${std.is}</span>` : ''}
                    </div>
                    <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem; color: #fff;">${std.title}</h3>
                    
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.3rem;">Performance Expectation</div>
                        <div style="background: rgba(0,0,0,0.4); border-radius: 10px; padding: 0.85rem; font-size: 0.95rem; line-height: 1.5; color: #e2e8f0;">${std.pe}</div>
                    </div>

                    ${std.clarification ? `
                        <div style="margin-bottom: 1rem;">
                            <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.3rem;">Clarification Statement</div>
                            <div style="background: rgba(0,0,0,0.3); border-radius: 10px; padding: 0.75rem; font-size: 0.85rem; color: #cbd5e1;">${std.clarification}</div>
                        </div>
                    ` : ''}

                    <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 1rem;">
                        ${std.sep ? `<span style="font-size: 0.75rem; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); padding: 4px 8px; border-radius: 6px;">🔵 ${std.sep}</span>` : ''}
                        ${std.dci ? `<span style="font-size: 0.75rem; background: rgba(249, 115, 22, 0.2); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.4); padding: 4px 8px; border-radius: 6px;">🟠 ${std.dci}</span>` : ''}
                        ${std.ccc ? `<span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 4px 8px; border-radius: 6px;">🟢 ${std.ccc}</span>` : ''}
                    </div>

                    <div style="margin-top: 1.5rem; text-align: right;">
                        <a href="ngss-explorer/index.html" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #00f3ff 0%, #3b82f6 100%); color: #020617; font-weight: 700; padding: 0.6rem 1.2rem; border-radius: 10px; text-decoration: none; font-size: 0.85rem;">Open in NGSS Explorer ↗</a>
                    </div>
                </div>
            `;

            modalEl.style.display = 'flex';

            const closeBtn = document.getElementById('closeNgssHelperModal');
            if (closeBtn) {
                closeBtn.onclick = () => { modalEl.style.display = 'none'; };
            }
            modalEl.onclick = (e) => {
                if (e.target === modalEl) modalEl.style.display = 'none';
            };
        }
    };

    window.NGSSHelper = NGSSHelper;
})();
