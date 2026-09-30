/**
 * SaveLife 360 - Emergency Response Platform
 * Global Application Controller & Demo Mode Tooling
 */

(function(window) {
  'use strict';

  const MainApp = {
    init() {
      this.setupMobileMenu();
      this.setupDemoFloatingBadge();
      this.setupActiveNavigation();
      this.setupRoadAlertSimulation();
    },

    setupMobileMenu() {
      const toggleBtn = document.querySelector('.sidebar-toggle-btn');
      const sidebar = document.querySelector('.app-sidebar');
      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
          sidebar.classList.toggle('open');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
          if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target) && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
          }
        });
      }
    },

    setupActiveNavigation() {
      const currentPath = window.location.pathname.toLowerCase();
      const navLinks = document.querySelectorAll('.sidebar-link, .nav-links a, .mobile-nav-item');
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.endsWith(href.toLowerCase().replace(/^\.\.\//, ''))) {
          link.classList.add('active');
        }
      });
    },

    // Floating Demo Bar for evaluator convenience
    setupDemoFloatingBadge() {
      if (document.getElementById('demo-floating-controller')) return;

      const badge = document.createElement('div');
      badge.id = 'demo-floating-controller';
      badge.className = 'demo-floating-badge';
      badge.innerHTML = `
        <span class="demo-pill">DEMO MODE</span>
        <span>⚙️ Switch Portal / Step</span>
      `;

      badge.addEventListener('click', () => {
        this.openDemoModal();
      });

      document.body.appendChild(badge);
    },

    openDemoModal() {
      let modal = document.getElementById('demo-controller-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'demo-controller-modal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
          <div class="modal-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
              <h3 style="display:flex; align-items:center; gap:0.5rem;">
                <span style="color:var(--primary-accent);">🚑</span> SaveLife 360 &bull; Demo Controller
              </h3>
              <button id="close-demo-modal" style="font-size:1.5rem; color:var(--text-muted);">&times;</button>
            </div>

            <div style="background:var(--bg-muted); border:1px solid var(--border-color); padding:1rem; border-radius:var(--radius-md); margin-bottom:1.5rem; font-size:0.85rem;">
              <strong>Evaluator Quick Controls:</strong> Easily switch roles to experience the end-to-end emergency flow across Public, Driver, and Hospital portals.
            </div>

            <h4 style="margin-bottom:0.75rem; font-size:0.95rem;">1. Jump to Portal:</h4>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.75rem; margin-bottom:1.5rem;">
              <button class="btn btn-secondary btn-sm" id="btn-jump-public" style="flex-direction:column; padding:0.85rem 0.5rem; text-align:center;">
                <span style="font-size:1.4rem;">👤</span>
                <span style="font-weight:700;">Public Portal</span>
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-jump-driver" style="flex-direction:column; padding:0.85rem 0.5rem; text-align:center;">
                <span style="font-size:1.4rem;">🚑</span>
                <span style="font-weight:700;">Driver Portal</span>
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-jump-hospital" style="flex-direction:column; padding:0.85rem 0.5rem; text-align:center;">
                <span style="font-size:1.4rem;">🏥</span>
                <span style="font-weight:700;">Hospital Portal</span>
              </button>
            </div>

            <h4 style="margin-bottom:0.75rem; font-size:0.95rem;">2. Emergency Workflow Simulator:</h4>
            <div style="display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.5rem;">
              <button class="btn btn-emergency btn-sm" id="btn-trigger-emergency">
                🚨 Trigger New Emergency (Accident / Cardiac)
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-advance-step">
                ⏩ Advance Emergency to Next State
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-simulate-road-alert">
                🚗 Test "Ambulance Approaching" Road Alert
              </button>
            </div>

            <div style="border-top:1px solid var(--border-color); padding-top:1rem; display:flex; justify-content:space-between; align-items:center;">
              <button class="btn btn-outline-danger btn-sm" id="btn-reset-demo">
                ↺ Reset All Demo Data
              </button>
              <span class="badge badge-demo">DEMO MODE ACTIVE</span>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        // Bind events
        modal.querySelector('#close-demo-modal').addEventListener('click', () => {
          modal.classList.remove('open');
        });

        // Determine relative base
        const isSubfolder = window.location.pathname.includes('/public/') || 
                            window.location.pathname.includes('/driver/') || 
                            window.location.pathname.includes('/hospital/');
        const prefix = isSubfolder ? '../' : '';

        modal.querySelector('#btn-jump-public').addEventListener('click', () => {
          window.SaveLifeAuth.loginAsRole('PUBLIC');
          window.location.href = prefix + 'public/dashboard.html';
        });

        modal.querySelector('#btn-jump-driver').addEventListener('click', () => {
          window.SaveLifeAuth.loginAsRole('DRIVER');
          window.location.href = prefix + 'driver/dashboard.html';
        });

        modal.querySelector('#btn-jump-hospital').addEventListener('click', () => {
          window.SaveLifeAuth.loginAsRole('HOSPITAL');
          window.location.href = prefix + 'hospital/dashboard.html';
        });

        modal.querySelector('#btn-trigger-emergency').addEventListener('click', async () => {
          await window.SaveLifeAPI.createEmergency({
            type: 'Cardiac Emergency',
            level: 'CRITICAL',
            notes: 'Sudden onset chest pain with breathlessness.'
          });
          window.SaveLifeNotifications.show('🚨 Emergency Created', 'Broadcast sent to all response units.', 'critical');
          modal.classList.remove('open');
          setTimeout(() => {
            window.location.href = prefix + 'public/tracking.html';
          }, 800);
        });

        modal.querySelector('#btn-advance-step').addEventListener('click', async () => {
          const emg = await window.SaveLifeAPI.getActiveEmergency();
          if (!emg) {
            window.SaveLifeNotifications.show('No Active Emergency', 'Trigger a new emergency first.', 'warning');
            return;
          }

          if (emg.status === 'REQUESTED' || emg.status === 'SEARCHING FOR AMBULANCE') {
            await window.SaveLifeAPI.assignAmbulance(emg.id, 'amb_1');
            window.SaveLifeNotifications.show('Ambulance Assigned', 'Unit AMB-704 assigned to emergency.', 'info');
          } else if (emg.status === 'AMBULANCE ASSIGNED') {
            await window.SaveLifeAPI.acceptEmergency(emg.id, 'usr_drv_1');
            window.SaveLifeNotifications.show('Driver En Route', 'Driver Marcus Vance is on the way.', 'critical');
          } else if (emg.status === 'DRIVER EN ROUTE') {
            await window.SaveLifeAPI.pickupPatient(emg.id);
            window.SaveLifeNotifications.show('Patient Picked Up', 'Patient on board with paramedics.', 'success');
          } else if (emg.status === 'PATIENT PICKED UP') {
            await window.SaveLifeAPI.selectHospital(emg.id, 'hsp_1');
            window.SaveLifeNotifications.show('Hospital Notified', 'Transmitting case to Metro Health Central.', 'warning');
          } else if (emg.status === 'HOSPITAL NOTIFIED') {
            await window.SaveLifeAPI.acceptHospitalCase(emg.id);
            window.SaveLifeNotifications.show('Hospital Accepted', 'Trauma bay reserved and team prepared.', 'success');
          } else if (emg.status === 'HOSPITAL ACCEPTED') {
            await window.SaveLifeAPI.arriveHospital(emg.id);
            window.SaveLifeNotifications.show('Arrived at Hospital', 'Ambulance has pulled into ER bay.', 'info');
          } else if (emg.status === 'ARRIVED') {
            await window.SaveLifeAPI.completeEmergency(emg.id);
            window.SaveLifeNotifications.show('Trip Completed', 'Patient transferred to ER staff.', 'success');
          }
          modal.classList.remove('open');
        });

        modal.querySelector('#btn-simulate-road-alert').addEventListener('click', () => {
          modal.classList.remove('open');
          MainApp.showRoadAlertBanner();
        });

        modal.querySelector('#btn-reset-demo').addEventListener('click', async () => {
          await window.SaveLifeAPI.resetDemoData();
          window.SaveLifeNotifications.show('Demo Data Reset', 'Platform restored to initial demo state.', 'info');
          setTimeout(() => {
            window.location.reload();
          }, 600);
        });
      }

      modal.classList.add('open');
    },

    setupRoadAlertSimulation() {
      // Allow testing road alert anywhere via query parameter or button
      if (window.location.search.includes('test_alert=true')) {
        setTimeout(() => this.showRoadAlertBanner(), 1500);
      }
    },

    showRoadAlertBanner() {
      let banner = document.getElementById('floating-road-alert-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'floating-road-alert-banner';
        banner.style.position = 'fixed';
        banner.style.top = '20px';
        banner.style.left = '50%';
        banner.style.transform = 'translateX(-50%)';
        banner.style.zIndex = '9999';
        banner.style.width = '90%';
        banner.style.maxWidth = '680px';
        banner.innerHTML = `
          <div class="road-alert-banner" style="background:#FFF3CD; border:2px solid #D4A017; box-shadow:0 10px 30px rgba(0,0,0,0.25);">
            <div class="road-alert-icon-wrap" style="background:#D4A017; color:#fff; font-size:1.8rem;">🚨</div>
            <div style="flex-grow:1;">
              <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
                <h4 style="color:#856404; font-size:1.05rem; font-weight:800;">EMERGENCY AMBULANCE APPROACHING</h4>
                <span class="badge badge-demo">DEMO ROAD SAFETY</span>
              </div>
              <p style="color:#533f03; font-size:0.9rem; line-height:1.4;">
                <strong>An emergency ambulance is approaching your route. Please slow down and give way safely.</strong>
              </p>
              <div style="font-size:0.75rem; color:#856404; margin-top:0.4rem;">
                Vehicle ID: AMB-704-CR &bull; Speed: 62 km/h &bull; Distance: 450m behind you
              </div>
            </div>
            <button id="close-road-alert" style="background:none; border:none; font-size:1.4rem; color:#856404; cursor:pointer;">&times;</button>
          </div>
        `;
        document.body.appendChild(banner);

        window.SaveLifeNotifications.show('🚨 Road Alert Broadcast', 'Give way safely to approaching ambulance.', 'critical');

        banner.querySelector('#close-road-alert').addEventListener('click', () => {
          banner.remove();
        });

        // Auto dismiss after 10s
        setTimeout(() => {
          if (banner.parentNode) banner.remove();
        }, 10000);
      }
    }
  };

  window.SaveLifeMain = MainApp;

  document.addEventListener('DOMContentLoaded', () => {
    MainApp.init();
  });

})(window);
