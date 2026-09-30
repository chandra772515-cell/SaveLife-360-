/**
 * SaveLife 360 - Emergency Response Platform
 * Ambulance Driver Portal Logic & Navigation HUD
 */

(function(window) {
  'use strict';

  const DriverPortal = {
    init() {
      const page = this.detectCurrentPage();
      this.setupDriverStatusToggle();

      if (page === 'dashboard') this.initDashboard();
      else if (page === 'requests') this.initRequestsPage();
      else if (page === 'active') this.initActiveEmergency();
      else if (page === 'navigation') this.initNavigation();
      else if (page === 'hospitals') this.initHospitalSelection();
      else if (page === 'history') this.initHistory();
    },

    detectCurrentPage() {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('requests.html')) return 'requests';
      if (path.includes('active-emergency.html')) return 'active';
      if (path.includes('navigation.html')) return 'navigation';
      if (path.includes('hospitals.html')) return 'hospitals';
      if (path.includes('history.html')) return 'history';
      return 'dashboard';
    },

    setupDriverStatusToggle() {
      const toggleBtn = document.getElementById('driver-status-toggle');
      const statusBadge = document.getElementById('driver-status-badge');
      if (!toggleBtn) return;

      const state = window.SaveLifeDataStore.getState();
      const driver = state.users.find(u => u.role === 'DRIVER');
      let currentStatus = (driver && driver.status) || 'ONLINE';

      const renderStatus = () => {
        if (currentStatus === 'ONLINE') {
          if (statusBadge) {
            statusBadge.className = 'badge badge-success';
            statusBadge.innerHTML = '<span class="status-dot pulse"></span> ONLINE';
          }
          toggleBtn.className = 'btn btn-secondary btn-sm';
          toggleBtn.textContent = 'Go Offline';
        } else {
          if (statusBadge) {
            statusBadge.className = 'badge badge-muted';
            statusBadge.innerHTML = '<span class="status-dot"></span> OFFLINE';
          }
          toggleBtn.className = 'btn btn-success btn-sm';
          toggleBtn.textContent = 'Go Online';
        }
      };

      renderStatus();

      toggleBtn.addEventListener('click', async () => {
        currentStatus = currentStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
        await window.SaveLifeAPI.updateDriverStatus(currentStatus);
        renderStatus();
        window.SaveLifeNotifications.show(
          'Driver Status Updated',
          currentStatus === 'ONLINE' ? 'You are ONLINE and eligible for emergency calls.' : 'You are OFFLINE. No dispatches will be assigned.',
          currentStatus === 'ONLINE' ? 'success' : 'warning'
        );
      });
    },

    /* =========================================================================
       1. Driver Dashboard
       ========================================================================= */
    async initDashboard() {
      const emg = await window.SaveLifeAPI.getActiveEmergency();
      const activeCard = document.getElementById('driver-active-task-card');
      const noTaskCard = document.getElementById('driver-no-task-card');

      if (emg && !['COMPLETED', 'CANCELLED'].includes(emg.status)) {
        if (activeCard) {
          activeCard.style.display = 'block';
          document.getElementById('task-emg-type').textContent = emg.type;
          document.getElementById('task-emg-level').textContent = emg.level;
          document.getElementById('task-emg-level').className = `badge badge-${emg.level.toLowerCase()}`;
          document.getElementById('task-emg-status').textContent = emg.status;
          document.getElementById('task-emg-address').textContent = emg.pickupLocation.address;
          document.getElementById('task-emg-eta').textContent = emg.etaMinutes + ' min';
        }
        if (noTaskCard) noTaskCard.style.display = 'none';
      } else {
        if (activeCard) activeCard.style.display = 'none';
        if (noTaskCard) noTaskCard.style.display = 'block';
      }

      // Check incoming requests badge
      const requestsBadge = document.getElementById('driver-new-requests-count');
      if (requestsBadge) {
        requestsBadge.textContent = (emg && emg.status === 'SEARCHING FOR AMBULANCE') ? '1' : '0';
      }
    },

    /* =========================================================================
       2. Driver Incoming Requests
       ========================================================================= */
    async initRequestsPage() {
      const container = document.getElementById('driver-requests-container');
      const emptyState = document.getElementById('driver-requests-empty');

      const render = async () => {
        const emg = await window.SaveLifeAPI.getActiveEmergency();

        if (emg && (emg.status === 'SEARCHING FOR AMBULANCE' || emg.status === 'REQUESTED' || emg.status === 'AMBULANCE ASSIGNED')) {
          if (emptyState) emptyState.style.display = 'none';
          if (container) {
            container.style.display = 'block';
            container.innerHTML = `
              <div class="card" style="border: 2px solid var(--critical); box-shadow: var(--shadow-lg); animation: alertPulse 3s infinite;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem;">
                  <div>
                    <span class="badge badge-critical" style="margin-bottom:0.5rem; font-size:0.85rem;">🚨 NEW EMERGENCY BROADCAST</span>
                    <h2 style="font-size:1.6rem; color:var(--critical); font-weight:800;">Emergency Level: ${emg.level}</h2>
                    <h4 style="font-size:1.15rem; margin-top:0.25rem;">${emg.type}</h4>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:1.8rem; font-weight:800; color:var(--text-primary);">${emg.distanceKm || '3.2'} km</div>
                    <span style="font-size:0.85rem; color:var(--text-secondary); font-weight:600;">Estimated Time: ${emg.etaMinutes || '7'} min</span>
                  </div>
                </div>

                <div style="background:var(--bg-muted); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem;">
                  <div style="margin-bottom:0.6rem;">
                    <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Pickup Location:</span>
                    <p style="font-size:1.05rem; font-weight:700; color:var(--text-primary);">📍 ${emg.pickupLocation.address}</p>
                  </div>
                  <div>
                    <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Caller Notes:</span>
                    <p style="font-size:0.9rem; color:var(--text-secondary);">${emg.notes || 'Immediate assistance requested.'}</p>
                  </div>
                </div>

                <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1rem;">
                  <button class="btn btn-emergency btn-lg" id="btn-driver-accept" style="font-size:1.2rem; padding:1.2rem;">
                    ✓ ACCEPT EMERGENCY
                  </button>
                  <button class="btn btn-secondary btn-lg" id="btn-driver-decline">
                    ✕ DECLINE
                  </button>
                </div>
              </div>
            `;

            // Bind Accept
            document.getElementById('btn-driver-accept')?.addEventListener('click', async () => {
              await window.SaveLifeAPI.acceptEmergency(emg.id, 'usr_drv_1');
              window.SaveLifeNotifications.show('Emergency Accepted', 'Navigation route locked. Proceed to patient.', 'success');
              setTimeout(() => {
                window.location.href = 'active-emergency.html';
              }, 500);
            });

            // Bind Decline
            document.getElementById('btn-driver-decline')?.addEventListener('click', () => {
              if (confirm('Decline this emergency call? It will be routed to the next ambulance.')) {
                window.SaveLifeNotifications.show('Call Declined', 'Broadcast forwarded to fleet.', 'info');
                container.style.display = 'none';
                if (emptyState) emptyState.style.display = 'block';
              }
            });
          }
        } else {
          if (container) container.style.display = 'none';
          if (emptyState) emptyState.style.display = 'block';
        }
      };

      render();
      window.addEventListener('sl360-state-changed', render);
    },

    /* =========================================================================
       3. Active Emergency Screen
       ========================================================================= */
    async initActiveEmergency() {
      const mapContainer = document.getElementById('driver-active-map');
      if (mapContainer) {
        new window.SaveLifeMap('driver-active-map');
      }

      const updateActiveUI = async () => {
        const emg = await window.SaveLifeAPI.getActiveEmergency();
        const activeWrapper = document.getElementById('active-emergency-view');
        const noActiveWrapper = document.getElementById('no-active-emergency-view');

        if (!emg || ['COMPLETED', 'CANCELLED'].includes(emg.status)) {
          if (activeWrapper) activeWrapper.style.display = 'none';
          if (noActiveWrapper) noActiveWrapper.style.display = 'block';
          return;
        }

        if (activeWrapper) activeWrapper.style.display = 'block';
        if (noActiveWrapper) noActiveWrapper.style.display = 'none';

        // Update fields
        document.getElementById('active-pickup-address').textContent = emg.pickupLocation.address;
        document.getElementById('active-emg-type-text').textContent = emg.type;
        document.getElementById('active-emg-level-text').textContent = emg.level;
        document.getElementById('active-emg-level-text').className = `badge badge-${emg.level.toLowerCase()}`;
        document.getElementById('active-eta-text').textContent = emg.etaMinutes + ' min';
        document.getElementById('active-distance-text').textContent = (emg.distanceKm || 3.2) + ' km';

        const stageTitle = document.getElementById('active-stage-title');
        const pickupBtn = document.getElementById('btn-patient-picked-up');
        const selectHospitalBtn = document.getElementById('btn-select-hospital');
        const navBtn = document.getElementById('btn-navigate-patient');

        // Check if patient picked up
        const isPickedUp = ['PATIENT PICKED UP', 'HOSPITAL NOTIFIED', 'HOSPITAL ACCEPTED', 'EN ROUTE TO HOSPITAL', 'ARRIVED'].includes(emg.status);

        if (isPickedUp) {
          if (stageTitle) {
            stageTitle.innerHTML = '<span style="color:var(--success);">✓ PATIENT ON BOARD</span>';
          }
          if (pickupBtn) pickupBtn.style.display = 'none';
          if (selectHospitalBtn) selectHospitalBtn.style.display = 'inline-flex';
          if (navBtn) {
            navBtn.textContent = '🧭 Navigate to Hospital';
            navBtn.href = 'navigation.html?dest=hospital';
          }
        } else {
          if (stageTitle) {
            stageTitle.innerHTML = '<span style="color:var(--critical);">🚨 EN ROUTE TO PATIENT</span>';
          }
          if (pickupBtn) pickupBtn.style.display = 'inline-flex';
          if (selectHospitalBtn) selectHospitalBtn.style.display = 'none';
          if (navBtn) {
            navBtn.textContent = '🧭 Navigate to Patient';
            navBtn.href = 'navigation.html?dest=patient';
          }
        }
      };

      updateActiveUI();
      window.addEventListener('sl360-state-changed', updateActiveUI);

      // Handle "Patient Picked Up"
      document.getElementById('btn-patient-picked-up')?.addEventListener('click', async () => {
        const emg = await window.SaveLifeAPI.getActiveEmergency();
        if (emg) {
          await window.SaveLifeAPI.pickupPatient(emg.id);
          window.SaveLifeNotifications.show('Patient Picked Up', 'Status updated to PATIENT ON BOARD. Please select hospital.', 'success');
          updateActiveUI();
        }
      });
    },

    /* =========================================================================
       4. Navigation HUD Screen
       ========================================================================= */
    initNavigation() {
      const speedEl = document.getElementById('nav-speed');
      const distEl = document.getElementById('nav-distance');
      const etaEl = document.getElementById('nav-eta');

      let speed = 62;
      let dist = 2.4;
      let eta = 5;

      // Realistic HUD simulation
      setInterval(() => {
        speed = Math.floor(58 + Math.random() * 8);
        if (speedEl) speedEl.textContent = speed + ' km/h';

        if (dist > 0.2) {
          dist = Math.max(0.1, +(dist - 0.05).toFixed(2));
          if (distEl) distEl.textContent = dist + ' km';
        }
      }, 1500);

      // Arrival trigger button
      document.getElementById('btn-nav-arrived')?.addEventListener('click', async () => {
        const emg = await window.SaveLifeAPI.getActiveEmergency();
        if (emg) {
          if (['HOSPITAL ACCEPTED', 'HOSPITAL NOTIFIED', 'EN ROUTE TO HOSPITAL'].includes(emg.status)) {
            await window.SaveLifeAPI.arriveHospital(emg.id);
            window.SaveLifeNotifications.show('Arrived at Hospital Bay', 'Transfer patient to emergency room staff.', 'info');
            setTimeout(() => {
              window.location.href = 'active-emergency.html';
            }, 800);
          } else {
            await window.SaveLifeAPI.pickupPatient(emg.id);
            window.SaveLifeNotifications.show('Arrived at Patient Scene', 'Securing patient into ambulance.', 'success');
            setTimeout(() => {
              window.location.href = 'active-emergency.html';
            }, 800);
          }
        }
      });
    },

    /* =========================================================================
       5. Hospital Selection for Driver
       ========================================================================= */
    async initHospitalSelection() {
      const container = document.getElementById('driver-hospitals-grid');
      if (!container) return;

      const hospitals = await window.SaveLifeAPI.getNearbyHospitals();
      const emg = await window.SaveLifeAPI.getActiveEmergency();

      container.innerHTML = hospitals.map(h => `
        <div class="card card-hover" style="border: ${emg && emg.hospitalId === h.id ? '2px solid var(--success)' : '1px solid var(--border-color)'};">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
            <div>
              <h3 style="font-size:1.25rem;">🏥 ${h.name}</h3>
              <p style="font-size:0.85rem; color:var(--text-secondary);">📍 ${h.address}</p>
            </div>
            <span class="badge ${h.emergencyStatus === 'ACCEPTING' ? 'badge-success' : (h.emergencyStatus === 'LIMITED' ? 'badge-high' : 'badge-critical')}">
              ${h.emergencyStatus}
            </span>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; background:var(--bg-muted); padding:1rem; border-radius:var(--radius-md); margin-bottom:1.25rem; font-size:0.9rem;">
            <div>
              <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Distance & ETA:</span>
              <div style="font-weight:800; font-size:1.1rem; color:var(--text-primary);">${h.distanceKm} km &bull; ~${h.etaMinutes} min</div>
            </div>
            <div>
              <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">ER Department:</span>
              <div style="font-weight:800; color:var(--success);">${h.emergencyStatus === 'ACCEPTING' ? 'AVAILABLE' : (h.emergencyStatus === 'LIMITED' ? 'LIMITED' : 'BUSY')}</div>
            </div>
            <div>
              <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">ICU Status:</span>
              <div style="font-weight:800; color:${h.beds.icu > 0 ? 'var(--success)' : 'var(--critical)'};">
                ${h.beds.icu > 0 ? `${h.beds.icu} BEDS AVAILABLE` : 'FULL'}
              </div>
            </div>
            <div>
              <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Emergency Beds:</span>
              <div style="font-weight:800; color:var(--text-primary);">${h.beds.emergency} Open</div>
            </div>
          </div>

          <button class="btn btn-emergency btn-block select-hospital-btn" data-id="${h.id}">
            [ SELECT HOSPITAL ]
          </button>
        </div>
      `).join('');

      // Bind selection buttons
      container.querySelectorAll('.select-hospital-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const hspId = btn.dataset.id;
          const activeEmg = await window.SaveLifeAPI.getActiveEmergency();
          if (activeEmg) {
            await window.SaveLifeAPI.selectHospital(activeEmg.id, hspId);
            window.SaveLifeNotifications.show('Hospital Selected', 'Emergency telemetry transmitted. Awaiting hospital clearance.', 'success');
            setTimeout(() => {
              window.location.href = 'active-emergency.html';
            }, 600);
          } else {
            window.SaveLifeNotifications.show('No Active Emergency', 'Trigger or accept an emergency first.', 'warning');
          }
        });
      });
    },

    /* =========================================================================
       6. Driver History
       ========================================================================= */
    initHistory() {
      const tableBody = document.getElementById('driver-history-body');
      if (!tableBody) return;

      const state = window.SaveLifeDataStore.getState();
      const history = state.history || [];

      tableBody.innerHTML = history.map(h => `
        <tr>
          <td><span class="mono" style="font-weight:700;">#${h.id}</span></td>
          <td><strong>${h.type}</strong></td>
          <td><span class="badge badge-${h.level.toLowerCase()}">${h.level}</span></td>
          <td>${h.pickupAddress}</td>
          <td>🏥 ${h.hospitalName}</td>
          <td>${h.durationMinutes} min</td>
          <td>⭐ 5.0</td>
        </tr>
      `).join('');
    }
  };

  window.SaveLifeDriver = DriverPortal;

  document.addEventListener('DOMContentLoaded', () => {
    DriverPortal.init();
  });

})(window);
