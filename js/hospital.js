/**
 * SaveLife 360 - Emergency Response Platform
 * Hospital Office Portal Logic, Incoming Ambulance Intake & Bed Management
 */

(function(window) {
  'use strict';

  const HospitalPortal = {
    init() {
      const page = this.detectCurrentPage();
      this.setupHospitalStatusToggle();

      if (page === 'dashboard') this.initDashboard();
      else if (page === 'incoming') this.initIncomingPage();
      else if (page === 'beds') this.initBedsPage();
      else if (page === 'emergency-dept') this.initEmergencyDeptPage();
      else if (page === 'patients') this.initPatientsPage();
      else if (page === 'history') this.initHistoryPage();
    },

    detectCurrentPage() {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('incoming.html')) return 'incoming';
      if (path.includes('beds.html')) return 'beds';
      if (path.includes('emergency-department.html')) return 'emergency-dept';
      if (path.includes('patients.html')) return 'patients';
      if (path.includes('history.html')) return 'history';
      return 'dashboard';
    },

    setupHospitalStatusToggle() {
      const statusSelect = document.getElementById('hospital-intake-status-select');
      const statusBadge = document.getElementById('hospital-status-badge');
      if (!statusSelect) return;

      const state = window.SaveLifeDataStore.getState();
      const hospital = state.hospitals.find(h => h.id === 'hsp_1') || state.hospitals[0];

      const render = () => {
        statusSelect.value = hospital.emergencyStatus;
        if (statusBadge) {
          if (hospital.emergencyStatus === 'ACCEPTING') {
            statusBadge.className = 'badge badge-success';
            statusBadge.innerHTML = '<span class="status-dot pulse"></span> ACCEPTING EMERGENCIES';
          } else if (hospital.emergencyStatus === 'LIMITED') {
            statusBadge.className = 'badge badge-high';
            statusBadge.innerHTML = '<span class="status-dot"></span> LIMITED CAPACITY';
          } else {
            statusBadge.className = 'badge badge-critical';
            statusBadge.innerHTML = '<span class="status-dot"></span> NOT ACCEPTING';
          }
        }
      };

      render();

      statusSelect.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        await window.SaveLifeAPI.updateHospitalStatus('hsp_1', newStatus);
        hospital.emergencyStatus = newStatus;
        render();
        window.SaveLifeNotifications.show('Hospital Intake Status Updated', `Status changed to ${newStatus}.`, 'info');
      });
    },

    /* =========================================================================
       1. Hospital Dashboard
       ========================================================================= */
    async initDashboard() {
      const emg = await window.SaveLifeAPI.getActiveEmergency();
      const state = window.SaveLifeDataStore.getState();
      const hospital = state.hospitals.find(h => h.id === 'hsp_1') || state.hospitals[0];

      // Update counters
      const erBedEl = document.getElementById('dash-er-beds');
      const icuBedEl = document.getElementById('dash-icu-beds');
      const docEl = document.getElementById('dash-doctors-count');
      const incomingCountEl = document.getElementById('dash-incoming-count');

      if (erBedEl) erBedEl.textContent = hospital.beds.emergency;
      if (icuBedEl) icuBedEl.textContent = hospital.beds.icu;
      if (docEl) docEl.textContent = hospital.doctorsOnDuty;

      const isIncoming = emg && (emg.hospitalId === 'hsp_1' || !emg.hospitalId) && ['HOSPITAL NOTIFIED', 'HOSPITAL ACCEPTED', 'EN ROUTE TO HOSPITAL', 'DRIVER EN ROUTE'].includes(emg.status);
      if (incomingCountEl) incomingCountEl.textContent = isIncoming ? '1' : '0';

      const incomingBanner = document.getElementById('dash-incoming-banner');
      if (incomingBanner) {
        if (isIncoming) {
          incomingBanner.style.display = 'block';
          document.getElementById('dash-incoming-type').textContent = emg.type;
          document.getElementById('dash-incoming-level').textContent = emg.level;
          document.getElementById('dash-incoming-level').className = `badge badge-${emg.level.toLowerCase()}`;
          document.getElementById('dash-incoming-eta').textContent = (emg.etaMinutes || 7) + ' min';
        } else {
          incomingBanner.style.display = 'none';
        }
      }
    },

    /* =========================================================================
       2. Incoming Ambulance Case Review
       ========================================================================= */
    async initIncomingPage() {
      const container = document.getElementById('incoming-case-container');
      const emptyState = document.getElementById('incoming-case-empty');

      const render = async () => {
        const emg = await window.SaveLifeAPI.getActiveEmergency();
        const state = window.SaveLifeDataStore.getState();
        const hospital = state.hospitals.find(h => h.id === 'hsp_1') || state.hospitals[0];

        const hasIncoming = emg && !['COMPLETED', 'CANCELLED'].includes(emg.status);

        if (hasIncoming) {
          if (emptyState) emptyState.style.display = 'none';
          if (container) {
            container.style.display = 'block';

            const isAccepted = ['HOSPITAL ACCEPTED', 'EN ROUTE TO HOSPITAL', 'ARRIVED'].includes(emg.status);

            container.innerHTML = `
              <div class="card" style="border: 2px solid ${isAccepted ? 'var(--success)' : 'var(--critical)'}; box-shadow: var(--shadow-lg);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem;">
                  <div>
                    <span class="badge ${isAccepted ? 'badge-success' : 'badge-critical'}" style="margin-bottom:0.5rem;">
                      ${isAccepted ? '✓ HOSPITAL ACCEPTED' : '🚨 INCOMING AMBULANCE ALERT'}
                    </span>
                    <h2 style="font-size:1.75rem; font-weight:800; margin-top:0.25rem;">
                      Emergency Level: <span class="text-${emg.level.toLowerCase()}">${emg.level}</span>
                    </h2>
                    <p style="font-size:1.05rem; font-weight:700; color:var(--text-primary); margin-top:0.25rem;">
                      Condition: ${emg.type} &bull; Patient: ${emg.userName || 'Female, ~38 yrs'}
                    </p>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:2.2rem; font-weight:800; color:var(--primary-accent);">${emg.etaMinutes || 7} min</div>
                    <span style="font-size:0.85rem; color:var(--text-secondary); font-weight:600;">Distance: ${emg.distanceKm || 3.1} km</span>
                  </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:1rem; background:var(--bg-muted); padding:1.25rem; border-radius:var(--radius-md); margin-bottom:1.5rem;">
                  <div>
                    <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Emergency Department:</span>
                    <h4 style="color:var(--success); font-weight:800;">AVAILABLE</h4>
                  </div>
                  <div>
                    <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Beds Status:</span>
                    <h4 style="color:var(--text-primary); font-weight:800;">${hospital.beds.emergency} ER Beds &bull; ${hospital.beds.icu} ICU Available</h4>
                  </div>
                  <div>
                    <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Responding Unit:</span>
                    <p style="font-weight:700;">AMB-704-CR (ACLS equipped)</p>
                  </div>
                  <div>
                    <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Pickup Location:</span>
                    <p style="font-weight:700;">${emg.pickupLocation.address}</p>
                  </div>
                </div>

                ${isAccepted ? `
                  <div style="background:#EDF7ED; border:1px solid #A5D6A7; border-radius:var(--radius-md); padding:1.5rem; margin-bottom:1.5rem;">
                    <h4 style="color:var(--success); font-size:1.15rem; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem;">
                      ✓ Case Confirmed & Intake Preparation Protocol Active
                    </h4>
                    <ul style="list-style:none; display:flex; flex-direction:column; gap:0.5rem; font-size:0.9rem;">
                      <li style="display:flex; align-items:center; gap:0.5rem;">
                        <input type="checkbox" checked disabled> <span>Trauma Resuscitation Bay 1 Assigned & Sanitized</span>
                      </li>
                      <li style="display:flex; align-items:center; gap:0.5rem;">
                        <input type="checkbox" checked disabled> <span>On-Call Trauma Team & Pulmonologist Alerted</span>
                      </li>
                      <li style="display:flex; align-items:center; gap:0.5rem;">
                        <input type="checkbox" checked disabled> <span>High-Flow Oxygen & Ventilator Line Prepped</span>
                      </li>
                    </ul>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.9rem; color:var(--text-secondary);">Ambulance driver and patient have received your arrival clearance.</span>
                    <button class="btn btn-secondary" onclick="window.location.href='patients.html'">Open Clinical Triage File</button>
                  </div>
                ` : `
                  <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.25rem;">
                    <button class="btn btn-emergency btn-lg" id="btn-hospital-accept" style="font-size:1.15rem;">
                      ✓ ACCEPT CASE & RESERVE BAY
                    </button>
                    <button class="btn btn-secondary btn-lg" id="btn-hospital-reject">
                      ✕ CANNOT TREAT
                    </button>
                  </div>
                `}
              </div>
            `;

            // Bind Actions
            document.getElementById('btn-hospital-accept')?.addEventListener('click', async () => {
              await window.SaveLifeAPI.acceptHospitalCase(emg.id);
              window.SaveLifeNotifications.show('Case Accepted', 'ER bay reserved. Driver & Public notified.', 'success');
              render();
            });

            document.getElementById('btn-hospital-reject')?.addEventListener('click', async () => {
              const reason = prompt('Please specify reason (e.g. ICU full, emergency surgery backlog):', 'Critical bed capacity reached');
              if (reason) {
                const res = await window.SaveLifeAPI.rejectHospitalCase(emg.id, reason);
                window.SaveLifeNotifications.show(
                  'Hospital Cannot Treat This Emergency',
                  `SEARCHING FOR ANOTHER SUITABLE HOSPITAL... Automatically redirected to ${res.alternativeHospital ? res.alternativeHospital.name : 'nearest trauma center'}.`,
                  'warning'
                );
                render();
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
       3. Real-Time Bed & Capacity Management
       ========================================================================= */
    async initBedsPage() {
      const state = window.SaveLifeDataStore.getState();
      const hospital = state.hospitals.find(h => h.id === 'hsp_1') || state.hospitals[0];

      const erVal = document.getElementById('count-er-beds');
      const icuVal = document.getElementById('count-icu-beds');
      const genVal = document.getElementById('count-gen-beds');

      const updateLabels = () => {
        if (erVal) erVal.textContent = hospital.beds.emergency;
        if (icuVal) icuVal.textContent = hospital.beds.icu;
        if (genVal) genVal.textContent = hospital.beds.general;
      };

      updateLabels();

      const bindCounter = (btnId, bedType, delta) => {
        document.getElementById(btnId)?.addEventListener('click', async () => {
          const newVal = Math.max(0, (hospital.beds[bedType] || 0) + delta);
          hospital.beds[bedType] = newVal;
          await window.SaveLifeAPI.updateHospitalBeds(hospital.id, hospital.beds);
          updateLabels();
          window.SaveLifeNotifications.show('Bed Capacity Updated', `${bedType.toUpperCase()} capacity is now ${newVal}.`, 'info', false);
        });
      };

      bindCounter('btn-er-minus', 'emergency', -1);
      bindCounter('btn-er-plus', 'emergency', +1);
      bindCounter('btn-icu-minus', 'icu', -1);
      bindCounter('btn-icu-plus', 'icu', +1);
      bindCounter('btn-gen-minus', 'general', -1);
      bindCounter('btn-gen-plus', 'general', +1);
    },

    /* =========================================================================
       4. Emergency Department Readiness
       ========================================================================= */
    initEmergencyDeptPage() {
      // Static clinical overview with real-time indicators
    },

    /* =========================================================================
       5. Hospital-Only Patient Triage Records (Secure view)
       ========================================================================= */
    initPatientsPage() {
      const tableBody = document.getElementById('hospital-patients-body');
      if (!tableBody) return;

      const mockPatients = [
        {
          id: 'PT-9942',
          name: 'Sarah Jenkins',
          age: 38,
          gender: 'F',
          type: 'Breathing Emergency (Severe Asthma/COPD)',
          triage: 'Level 2 - Emergent',
          vitals: 'HR 118, BP 142/92, SpO2 88%',
          assignedDr: 'Dr. Evelyn Reed (Trauma Lead)',
          status: 'IN TRANSIT (ETA 6m)'
        },
        {
          id: 'PT-9938',
          name: 'David Miller',
          age: 54,
          gender: 'M',
          type: 'Acute Myocardial Infarction',
          triage: 'Level 1 - Resuscitation',
          vitals: 'HR 62, BP 90/60, SpO2 94%',
          assignedDr: 'Dr. Robert Chen (Cardiology)',
          status: 'ADMITTED (Cath Lab)'
        },
        {
          id: 'PT-9915',
          name: 'Lucas Graham',
          age: 27,
          gender: 'M',
          type: 'Motorcycle Collision / Femur Trauma',
          triage: 'Level 2 - Emergent',
          vitals: 'HR 98, BP 124/80, SpO2 99%',
          assignedDr: 'Dr. Priya Nair (Orthopedics)',
          status: 'STABILIZED (OR 3)'
        }
      ];

      tableBody.innerHTML = mockPatients.map(p => `
        <tr>
          <td><span class="mono" style="font-weight:700;">#${p.id}</span></td>
          <td><strong>${p.name}</strong> (${p.age}${p.gender})</td>
          <td>${p.type}</td>
          <td><span class="badge ${p.triage.includes('Level 1') ? 'badge-critical' : 'badge-high'}">${p.triage}</span></td>
          <td><span class="mono" style="font-size:0.8rem;">${p.vitals}</span></td>
          <td>${p.assignedDr}</td>
          <td><span class="badge badge-info">${p.status}</span></td>
        </tr>
      `).join('');
    },

    /* =========================================================================
       6. Hospital Admission History
       ========================================================================= */
    initHistoryPage() {
      const tableBody = document.getElementById('hospital-history-body');
      if (!tableBody) return;

      const state = window.SaveLifeDataStore.getState();
      const history = state.history || [];

      tableBody.innerHTML = history.map(h => `
        <tr>
          <td><span class="mono" style="font-weight:700;">#${h.id}</span></td>
          <td><strong>${h.type}</strong></td>
          <td><span class="badge badge-${h.level.toLowerCase()}">${h.level}</span></td>
          <td>${h.pickupAddress}</td>
          <td>${h.durationMinutes} min intake</td>
          <td><span class="badge badge-success">ADMITTED</span></td>
          <td><span style="font-size:0.85rem; color:var(--text-secondary);">${h.outcome}</span></td>
        </tr>
      `).join('');
    }
  };

  window.SaveLifeHospital = HospitalPortal;

  document.addEventListener('DOMContentLoaded', () => {
    HospitalPortal.init();
  });

})(window);
