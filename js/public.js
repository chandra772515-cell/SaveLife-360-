/**
 * SaveLife 360 - Emergency Response Platform
 * Public Citizen Portal Logic & Emergency Request Wizard
 */

(function(window) {
  'use strict';

  const PublicPortal = {
    init() {
      const page = this.detectCurrentPage();
      if (page === 'dashboard') this.initDashboard();
      else if (page === 'request') this.initRequestWizard();
      else if (page === 'tracking') this.initTracking();
      else if (page === 'hospitals') this.initHospitalsDirectory();
      else if (page === 'history') this.initHistory();
    },

    detectCurrentPage() {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('request-ambulance.html')) return 'request';
      if (path.includes('tracking.html')) return 'tracking';
      if (path.includes('hospitals.html')) return 'hospitals';
      if (path.includes('history.html')) return 'history';
      return 'dashboard';
    },

    /* =========================================================================
       1. Public Dashboard
       ========================================================================= */
    async initDashboard() {
      const activeEmergency = await window.SaveLifeAPI.getActiveEmergency();
      const activeCard = document.getElementById('active-emergency-card');
      const noEmergencyCard = document.getElementById('no-emergency-card');

      if (activeEmergency) {
        if (activeCard) {
          activeCard.style.display = 'block';
          document.getElementById('active-emg-type').textContent = activeEmergency.type;
          document.getElementById('active-emg-level').textContent = activeEmergency.level;
          document.getElementById('active-emg-level').className = `badge badge-${activeEmergency.level.toLowerCase()}`;
          document.getElementById('active-emg-status').textContent = activeEmergency.status;
          document.getElementById('active-emg-eta').textContent = activeEmergency.etaMinutes + ' mins';
          document.getElementById('active-emg-address').textContent = activeEmergency.pickupLocation.address;
        }
        if (noEmergencyCard) noEmergencyCard.style.display = 'none';
      } else {
        if (activeCard) activeCard.style.display = 'none';
        if (noEmergencyCard) noEmergencyCard.style.display = 'block';
      }

      // Populate nearby hospitals preview
      const hospitals = await window.SaveLifeAPI.getNearbyHospitals();
      const hspContainer = document.getElementById('dashboard-hospitals-list');
      if (hspContainer && hospitals) {
        hspContainer.innerHTML = hospitals.slice(0, 3).map(h => `
          <div class="card card-hover" style="margin-bottom: 1rem; padding: 1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
              <div>
                <h4 style="font-size:1.05rem;">🏥 ${h.name}</h4>
                <p style="font-size:0.8rem; color:var(--text-secondary);">${h.address}</p>
              </div>
              <span class="badge ${h.emergencyStatus === 'ACCEPTING' ? 'badge-success' : (h.emergencyStatus === 'LIMITED' ? 'badge-high' : 'badge-critical')}">
                ${h.emergencyStatus}
              </span>
            </div>
            <div style="display:flex; gap:1.5rem; font-size:0.85rem; color:var(--text-secondary); margin-top:0.75rem;">
              <span>📍 <strong>${h.distanceKm} km</strong></span>
              <span>⏱️ ETA <strong>${h.etaMinutes} min</strong></span>
              <span>🛏️ ER Beds: <strong style="color:var(--text-primary);">${h.beds.emergency}</strong></span>
            </div>
          </div>
        `).join('');
      }
    },

    /* =========================================================================
       2. Multi-Step Request Ambulance Wizard (5 Steps)
       ========================================================================= */
    initRequestWizard() {
      let currentStep = 1;
      let selectedType = 'Accident';
      let selectedLevel = 'CRITICAL';
      let detectedLocation = {
        address: '742 Evergreen Terrace, Sector 4',
        latitude: 12.9716 + 0.005,
        longitude: 77.5946 + 0.003
      };

      const stepNodes = document.querySelectorAll('.wizard-step-node');
      const stepContents = document.querySelectorAll('.wizard-step-content');

      const goToStep = (step) => {
        currentStep = step;
        stepNodes.forEach((node, idx) => {
          node.classList.remove('active', 'completed');
          if (idx + 1 === step) node.classList.add('active');
          else if (idx + 1 < step) node.classList.add('completed');
        });

        stepContents.forEach((content) => {
          content.classList.remove('active');
          if (parseInt(content.dataset.step) === step) {
            content.classList.add('active');
          }
        });

        // Trigger special behaviors
        if (step === 4) {
          this.runStep4SearchAnimation(goToStep);
        }
      };

      // Step 1: Geolocation Detection
      const detectLocBtn = document.getElementById('btn-detect-location');
      const locDisplay = document.getElementById('location-status-text');
      const addressInput = document.getElementById('pickup-address-input');

      if (detectLocBtn) {
        detectLocBtn.addEventListener('click', () => {
          locDisplay.innerHTML = '<span class="status-dot pulse" style="color:var(--primary-accent);"></span> Detecting GPS satellite fix...';
          
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                detectedLocation.latitude = pos.coords.latitude;
                detectedLocation.longitude = pos.coords.longitude;
                detectedLocation.address = 'Current GPS Fix: Sector 4 (' + pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4) + ')';
                if (addressInput) addressInput.value = detectedLocation.address;
                locDisplay.innerHTML = '<span style="color:var(--success); font-weight:700;">📍 Accurate Location Detected</span>';
                window.SaveLifeNotifications.show('Location Verified', 'Coordinates confirmed within 8 meters.', 'success');
              },
              () => {
                // Fallback to high-accuracy simulated address
                detectedLocation.address = addressInput && addressInput.value ? addressInput.value : '742 Evergreen Terrace, Sector 4';
                locDisplay.innerHTML = '<span style="color:var(--success); font-weight:700;">📍 Current Location Detected (Demo Area)</span>';
                window.SaveLifeNotifications.show('Location Acquired', 'Using calibrated sector address.', 'info');
              },
              { timeout: 4000 }
            );
          } else {
            locDisplay.innerHTML = '<span style="color:var(--success); font-weight:700;">📍 Location Set</span>';
          }
        });
      }

      document.getElementById('step-1-next')?.addEventListener('click', () => {
        if (addressInput && addressInput.value.trim()) {
          detectedLocation.address = addressInput.value.trim();
        }
        goToStep(2);
      });

      // Step 2: Emergency Type
      const typeCards = document.querySelectorAll('.type-select-card');
      typeCards.forEach(card => {
        card.addEventListener('click', () => {
          typeCards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          selectedType = card.dataset.type;
        });
      });

      document.getElementById('step-2-back')?.addEventListener('click', () => goToStep(1));
      document.getElementById('step-2-next')?.addEventListener('click', () => goToStep(3));

      // Step 3: Emergency Level
      const severityCards = document.querySelectorAll('.severity-card');
      severityCards.forEach(card => {
        card.addEventListener('click', () => {
          severityCards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          selectedLevel = card.dataset.level;
        });
      });

      document.getElementById('step-3-back')?.addEventListener('click', () => goToStep(2));
      document.getElementById('step-3-next')?.addEventListener('click', async () => {
        // Create emergency record in system
        const res = await window.SaveLifeAPI.createEmergency({
          type: selectedType,
          level: selectedLevel,
          notes: document.getElementById('emergency-notes-input')?.value || '',
          pickupLocation: detectedLocation
        });

        window.currentCreatedEmergency = res.emergency;
        goToStep(4);
      });
    },

    runStep4SearchAnimation(goToStep) {
      const searchStatusText = document.getElementById('search-status-text');
      const messages = [
        'Connecting to SaveLife 360 Emergency Dispatch...',
        'Broadcasting alert to nearest certified ambulances...',
        'Checking real-time GPS telemetry and traffic conditions...',
        'Unit AMB-704-CR (Advanced Cardiac Life Support) responding...'
      ];

      let msgIndex = 0;
      const interval = setInterval(() => {
        if (msgIndex < messages.length && searchStatusText) {
          searchStatusText.textContent = messages[msgIndex];
          msgIndex++;
        }
      }, 700);

      setTimeout(async () => {
        clearInterval(interval);
        const emg = window.currentCreatedEmergency || await window.SaveLifeAPI.getActiveEmergency();
        if (emg) {
          await window.SaveLifeAPI.assignAmbulance(emg.id, 'amb_1');
          await window.SaveLifeAPI.acceptEmergency(emg.id, 'usr_drv_1');
        }
        window.SaveLifeNotifications.show('🚑 Ambulance Found!', 'Unit AMB-704-CR assigned and en route.', 'critical');
        goToStep(5);
      }, 3000);
    },

    /* =========================================================================
       3. Live Ambulance Tracking
       ========================================================================= */
    async initTracking() {
      const activeEmergency = await window.SaveLifeAPI.getActiveEmergency();
      const trackingMapContainer = document.getElementById('tracking-live-map');

      let mapInstance = null;
      if (trackingMapContainer) {
        mapInstance = new window.SaveLifeMap('tracking-live-map');
      }

      const updateUI = async () => {
        const emg = await window.SaveLifeAPI.getActiveEmergency();
        if (!emg) {
          const noEmgEl = document.getElementById('tracking-no-emergency');
          const emgDetailsEl = document.getElementById('tracking-content');
          if (noEmgEl) noEmgEl.style.display = 'block';
          if (emgDetailsEl) emgDetailsEl.style.display = 'none';
          return;
        }

        const noEmgEl = document.getElementById('tracking-no-emergency');
        const emgDetailsEl = document.getElementById('tracking-content');
        if (noEmgEl) noEmgEl.style.display = 'none';
        if (emgDetailsEl) emgDetailsEl.style.display = 'grid';

        // Update ETA & Status details
        const etaEl = document.getElementById('tracking-eta-number');
        if (etaEl) etaEl.textContent = emg.etaMinutes || 5;

        const distanceEl = document.getElementById('tracking-distance-number');
        if (distanceEl) distanceEl.textContent = (emg.distanceKm || 2.4) + ' km';

        const statusBadge = document.getElementById('tracking-status-badge');
        if (statusBadge) {
          statusBadge.textContent = emg.status;
          statusBadge.className = 'badge badge-critical';
        }

        const levelBadge = document.getElementById('tracking-level-badge');
        if (levelBadge) {
          levelBadge.textContent = emg.level + ' • ' + emg.type;
          levelBadge.className = `badge badge-${emg.level.toLowerCase()}`;
        }

        // Update Timeline
        const timelineSteps = [
          { key: 'REQUESTED', elId: 'step-req' },
          { key: 'AMBULANCE ASSIGNED', elId: 'step-amb' },
          { key: 'DRIVER EN ROUTE', elId: 'step-enroute' },
          { key: 'PATIENT PICKED UP', elId: 'step-pickup' },
          { key: 'HOSPITAL NOTIFIED', elId: 'step-hospital' },
          { key: 'HOSPITAL ACCEPTED', elId: 'step-hospital' },
          { key: 'ARRIVED', elId: 'step-hospital' },
          { key: 'COMPLETED', elId: 'step-completed' }
        ];

        const statusOrder = [
          'REQUESTED',
          'SEARCHING FOR AMBULANCE',
          'AMBULANCE ASSIGNED',
          'DRIVER EN ROUTE',
          'PATIENT PICKED UP',
          'HOSPITAL SELECTED',
          'HOSPITAL NOTIFIED',
          'HOSPITAL ACCEPTED',
          'EN ROUTE TO HOSPITAL',
          'ARRIVED',
          'COMPLETED'
        ];

        const currentIndex = statusOrder.indexOf(emg.status);

        const setStepState = (elemId, isDone, isActive) => {
          const el = document.getElementById(elemId);
          if (!el) return;
          el.classList.remove('done', 'active');
          if (isDone) el.classList.add('done');
          if (isActive) el.classList.add('active');
        };

        setStepState('step-req', currentIndex >= 0, currentIndex === 0);
        setStepState('step-amb', currentIndex >= 2, currentIndex === 2);
        setStepState('step-enroute', currentIndex >= 3, currentIndex === 3);
        setStepState('step-pickup', currentIndex >= 4, currentIndex === 4);
        setStepState('step-hospital', currentIndex >= 6, currentIndex >= 6 && currentIndex < 10);
        setStepState('step-completed', currentIndex >= 10, currentIndex >= 10);
      };

      updateUI();
      window.addEventListener('sl360-state-changed', updateUI);

      // Cancel button
      const cancelBtn = document.getElementById('btn-cancel-emergency');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
          if (confirm('Are you sure you want to cancel this emergency request?')) {
            const emg = await window.SaveLifeAPI.getActiveEmergency();
            if (emg) {
              await window.SaveLifeAPI.cancelEmergency(emg.id);
              window.SaveLifeNotifications.show('Request Cancelled', 'Emergency dispatch has been stood down.', 'info');
              updateUI();
            }
          }
        });
      }
    },

    /* =========================================================================
       4. Real-Time Hospitals Directory
       ========================================================================= */
    async initHospitalsDirectory() {
      const container = document.getElementById('hospitals-directory-grid');
      const searchInput = document.getElementById('search-hospital-input');
      const statusFilter = document.getElementById('filter-hospital-status');

      const render = async () => {
        let hospitals = await window.SaveLifeAPI.getNearbyHospitals();
        const search = searchInput ? searchInput.value.toLowerCase() : '';
        const filter = statusFilter ? statusFilter.value : 'ALL';

        if (search) {
          hospitals = hospitals.filter(h => h.name.toLowerCase().includes(search) || h.address.toLowerCase().includes(search));
        }

        if (filter !== 'ALL') {
          hospitals = hospitals.filter(h => h.emergencyStatus === filter);
        }

        if (!container) return;

        if (hospitals.length === 0) {
          container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:3rem; background:#fff; border-radius:12px;">No hospitals match your criteria.</div>`;
          return;
        }

        container.innerHTML = hospitals.map(h => `
          <div class="card card-hover" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                <h3 style="font-size:1.15rem; font-weight:800;">🏥 ${h.name}</h3>
                <span class="badge ${h.emergencyStatus === 'ACCEPTING' ? 'badge-success' : (h.emergencyStatus === 'LIMITED' ? 'badge-high' : 'badge-critical')}">
                  ${h.emergencyStatus}
                </span>
              </div>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem;">📍 ${h.address}</p>

              <div style="background:var(--bg-muted); border-radius:var(--radius-md); padding:0.85rem 1rem; margin-bottom:1rem;">
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); text-align:center; gap:0.5rem;">
                  <div>
                    <span style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">ER Beds</span>
                    <h4 style="font-size:1.25rem; font-weight:800; color:var(--text-primary);">${h.beds.emergency} / ${h.beds.emergencyTotal}</h4>
                  </div>
                  <div>
                    <span style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">ICU</span>
                    <h4 style="font-size:1.25rem; font-weight:800; color:var(--text-primary);">${h.beds.icu} / ${h.beds.icuTotal}</h4>
                  </div>
                  <div>
                    <span style="font-size:0.7rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Doctors</span>
                    <h4 style="font-size:1.25rem; font-weight:800; color:var(--text-primary);">${h.doctorsOnDuty}</h4>
                  </div>
                </div>
              </div>

              <div style="font-size:0.825rem; color:var(--text-secondary); margin-bottom:1.25rem;">
                <strong>Key Specialties:</strong>
                <div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-top:0.4rem;">
                  ${h.facilities.map(f => `<span class="badge badge-muted" style="font-size:0.72rem;">${f}</span>`).join('')}
                </div>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:1rem;">
              <span style="font-size:0.85rem; font-weight:600;">🚗 ${h.distanceKm} km &bull; ~${h.etaMinutes} min</span>
              <a href="tel:${h.phone}" class="btn btn-secondary btn-sm">📞 Call ER Desk</a>
            </div>
          </div>
        `).join('');
      };

      if (searchInput) searchInput.addEventListener('input', render);
      if (statusFilter) statusFilter.addEventListener('change', render);
      render();
    },

    /* =========================================================================
       5. Emergency History
       ========================================================================= */
    async initHistory() {
      const state = window.SaveLifeDataStore.getState();
      const historyList = state.history || [];
      const tableBody = document.getElementById('history-table-body');

      if (!tableBody) return;

      if (historyList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;">No emergency records found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = historyList.map(h => `
        <tr>
          <td><span class="mono" style="font-weight:700;">#${h.id}</span></td>
          <td><strong>${h.type}</strong></td>
          <td><span class="badge badge-${h.level.toLowerCase()}">${h.level}</span></td>
          <td>🏥 ${h.hospitalName}</td>
          <td>${h.date} (${h.durationMinutes} mins)</td>
          <td><span class="badge badge-success">${h.status}</span></td>
        </tr>
      `).join('');
    }
  };

  window.SaveLifePublic = PublicPortal;

  document.addEventListener('DOMContentLoaded', () => {
    PublicPortal.init();
  });

})(window);
