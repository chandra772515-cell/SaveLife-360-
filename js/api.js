/**
 * SaveLife 360 - Emergency Response Platform
 * Central REST-Ready API Client Layer
 * Can be effortlessly swapped with fetch() calls to a backend.
 */

(function(window) {
  'use strict';

  const store = window.SaveLifeDataStore;

  const API = {
    // Authentication
    async login(role, email, password) {
      const state = store.getState();
      const user = state.users.find(u => u.role.toUpperCase() === role.toUpperCase());
      if (user) {
        localStorage.setItem('SAVELIFE360_AUTH_USER', JSON.stringify(user));
        return { success: true, user };
      }
      // Demo fallback if user not strictly matched
      const fallbackUser = {
        id: 'usr_' + role.toLowerCase() + '_' + Date.now(),
        name: role === 'PUBLIC' ? 'Public User' : (role === 'DRIVER' ? 'Verified Driver' : 'Hospital Coordinator'),
        email: email || (role.toLowerCase() + '@savelife360.org'),
        role: role.toUpperCase(),
        status: 'ACTIVE'
      };
      localStorage.setItem('SAVELIFE360_AUTH_USER', JSON.stringify(fallbackUser));
      return { success: true, user: fallbackUser };
    },

    async getCurrentUser() {
      const stored = localStorage.getItem('SAVELIFE360_AUTH_USER');
      if (stored) {
        try { return JSON.parse(stored); } catch (e) { }
      }
      return null;
    },

    async logout() {
      localStorage.removeItem('SAVELIFE360_AUTH_USER');
      return { success: true };
    },

    // Emergency Workflow APIs
    async getActiveEmergency() {
      const state = store.getState();
      return state.emergencies.find(e => !['COMPLETED', 'CANCELLED'].includes(e.status)) || null;
    },

    async createEmergency(payload) {
      const state = store.getState();
      const currentUser = await this.getCurrentUser();
      
      const newEmergency = {
        id: 'emg_' + Date.now(),
        userId: currentUser ? currentUser.id : 'usr_pub_1',
        userName: currentUser ? currentUser.name : 'Emergency Caller',
        userPhone: currentUser ? currentUser.phone : '+1 (555) 019-2834',
        type: payload.type || 'Cardiac Emergency',
        level: payload.level || 'CRITICAL',
        notes: payload.notes || 'Immediate medical intervention requested.',
        pickupLocation: payload.pickupLocation || {
          address: '742 Evergreen Terrace, Sector 4',
          latitude: 12.9716 + 0.005,
          longitude: 77.5946 + 0.003
        },
        ambulanceId: null,
        hospitalId: null,
        status: 'REQUESTED',
        createdAt: new Date().toISOString(),
        distanceKm: 3.2,
        etaMinutes: 6,
        logs: [
          { time: 'Just now', title: 'Request Created', desc: 'Emergency broadcast triggered by citizen.' }
        ]
      };

      state.emergencies.unshift(newEmergency);
      
      // Auto transition to SEARCHING FOR AMBULANCE
      newEmergency.status = 'SEARCHING FOR AMBULANCE';
      newEmergency.logs.push({
        time: 'Just now',
        title: 'Searching Fleet',
        desc: 'Broadcasting to nearest certified emergency response units.'
      });

      // Notify Driver role of new emergency
      state.notifications.DRIVER.unshift({
        id: 'notif_' + Date.now(),
        time: 'Just now',
        title: '🚨 NEW EMERGENCY ALERT',
        text: `${newEmergency.level} ${newEmergency.type} at ${newEmergency.pickupLocation.address}. ETA ~6 min.`,
        type: 'critical',
        read: false,
        emergencyId: newEmergency.id
      });

      store.save();
      return { success: true, emergency: newEmergency };
    },

    async assignAmbulance(emergencyId, ambulanceId) {
      const state = store.getState();
      const emergency = state.emergencies.find(e => e.id === emergencyId);
      const amb = state.ambulances.find(a => a.id === ambulanceId) || state.ambulances[0];
      
      if (!emergency) return { success: false, message: 'Emergency not found' };

      emergency.ambulanceId = amb.id;
      emergency.status = 'AMBULANCE ASSIGNED';
      emergency.distanceKm = 3.2;
      emergency.etaMinutes = 7;
      emergency.logs.push({
        time: 'Just now',
        title: 'Ambulance Assigned',
        desc: `Unit ${amb.vehicleNumber} (${amb.driverName}) assigned.`
      });

      amb.status = 'ON_THE_WAY';
      amb.currentEmergencyId = emergency.id;

      // Notify Public
      state.notifications.PUBLIC.unshift({
        id: 'notif_' + Date.now(),
        time: 'Just now',
        title: 'Ambulance Assigned',
        text: `Unit ${amb.vehicleNumber} driven by ${amb.driverName} is preparing for dispatch.`,
        type: 'info',
        read: false
      });

      store.save();
      return { success: true, emergency, ambulance: amb };
    },

    async acceptEmergency(emergencyId, driverId) {
      const state = store.getState();
      const emergency = state.emergencies.find(e => e.id === emergencyId);
      if (!emergency) return { success: false, message: 'Emergency not found' };

      const amb = state.ambulances.find(a => a.driverId === driverId) || state.ambulances[0];
      emergency.ambulanceId = amb.id;
      emergency.status = 'DRIVER EN ROUTE';
      emergency.logs.push({
        time: 'Just now',
        title: 'Driver En Route',
        desc: `${amb.driverName} accepted and is speeding to patient location.`
      });

      amb.status = 'ON_THE_WAY';
      amb.currentEmergencyId = emergency.id;

      state.notifications.PUBLIC.unshift({
        id: 'notif_' + Date.now(),
        time: 'Just now',
        title: 'Ambulance On The Way',
        text: `${amb.driverName} is en route. Approaching in ${emergency.etaMinutes} minutes.`,
        type: 'critical',
        read: false
      });

      store.save();
      return { success: true, emergency };
    },

    async pickupPatient(emergencyId) {
      const state = store.getState();
      const emergency = state.emergencies.find(e => e.id === emergencyId);
      if (!emergency) return { success: false };

      emergency.status = 'PATIENT PICKED UP';
      emergency.logs.push({
        time: 'Just now',
        title: 'Patient Picked Up',
        desc: 'Paramedics on scene. Patient secured in ambulance.'
      });

      const amb = state.ambulances.find(a => a.id === emergency.ambulanceId);
      if (amb) amb.status = 'PATIENT_ON_BOARD';

      state.notifications.PUBLIC.unshift({
        id: 'notif_' + Date.now(),
        time: 'Just now',
        title: 'Patient Picked Up',
        text: 'Patient is on board with paramedics. Selecting optimal hospital.',
        type: 'success',
        read: false
      });

      store.save();
      return { success: true, emergency };
    },

    async selectHospital(emergencyId, hospitalId) {
      const state = store.getState();
      const emergency = state.emergencies.find(e => e.id === emergencyId);
      const hospital = state.hospitals.find(h => h.id === hospitalId) || state.hospitals[0];
      if (!emergency) return { success: false };

      emergency.hospitalId = hospital.id;
      emergency.status = 'HOSPITAL NOTIFIED';
      emergency.distanceKm = hospital.distanceKm || 4.2;
      emergency.etaMinutes = hospital.etaMinutes || 9;
      emergency.logs.push({
        time: 'Just now',
        title: 'Hospital Notified',
        desc: `Transmitting patient triage vitals to ${hospital.name}.`
      });

      // Hospital receives incoming alert
      state.notifications.HOSPITAL.unshift({
        id: 'notif_' + Date.now(),
        time: 'Just now',
        title: `🚨 INCOMING: ${emergency.level} CASE`,
        text: `Ambulance approaching ${hospital.name} with ${emergency.type}. ETA ~${emergency.etaMinutes} min.`,
        type: 'critical',
        read: false,
        emergencyId: emergency.id
      });

      store.save();
      return { success: true, emergency, hospital };
    },

    async acceptHospitalCase(emergencyId) {
      const state = store.getState();
      const emergency = state.emergencies.find(e => e.id === emergencyId);
      if (!emergency) return { success: false };

      const hospital = state.hospitals.find(h => h.id === emergency.hospitalId) || state.hospitals[0];

      emergency.status = 'HOSPITAL ACCEPTED';
      emergency.logs.push({
        time: 'Just now',
        title: 'Hospital Accepted',
        desc: `${hospital.name} confirmed trauma team and ER bed reserved.`
      });

      // Update bed reservation
      if (hospital.beds && hospital.beds.emergency > 0) {
        hospital.beds.emergency -= 1;
      }

      state.notifications.DRIVER.unshift({
        id: 'notif_' + Date.now(),
        time: 'Just now',
        title: '✓ Hospital Confirmed Ready',
        text: `${hospital.name} accepted patient. Trauma bay prepared.`,
        type: 'success',
        read: false
      });

      state.notifications.PUBLIC.unshift({
        id: 'notif_' + Date.now(),
        time: 'Just now',
        title: 'Hospital Prepared',
        text: `${hospital.name} is ready for immediate arrival.`,
        type: 'success',
        read: false
      });

      store.save();
      return { success: true, emergency };
    },

    async rejectHospitalCase(emergencyId, reason) {
      const state = store.getState();
      const emergency = state.emergencies.find(e => e.id === emergencyId);
      if (!emergency) return { success: false };

      emergency.status = 'HOSPITAL UNAVAILABLE';
      emergency.logs.push({
        time: 'Just now',
        title: 'Hospital Redirect',
        desc: `Hospital unable to accommodate (${reason || 'Capacity full'}). Rerouting immediately.`
      });

      // Recommend next hospital automatically
      const altHospital = state.hospitals.find(h => h.id !== emergency.hospitalId && h.emergencyStatus === 'ACCEPTING');
      if (altHospital) {
        emergency.hospitalId = altHospital.id;
        emergency.status = 'HOSPITAL NOTIFIED';
        emergency.logs.push({
          time: 'Just now',
          title: 'Re-routing',
          desc: `Redirected to ${altHospital.name}. Notifying trauma team.`
        });
      }

      state.notifications.DRIVER.unshift({
        id: 'notif_' + Date.now(),
        time: 'Just now',
        title: '⚠️ Hospital Redirected',
        text: `Rerouting to ${altHospital ? altHospital.name : 'Next available facility'}.`,
        type: 'warning',
        read: false
      });

      store.save();
      return { success: true, emergency, alternativeHospital: altHospital };
    },

    async arriveHospital(emergencyId) {
      const state = store.getState();
      const emergency = state.emergencies.find(e => e.id === emergencyId);
      if (!emergency) return { success: false };

      emergency.status = 'ARRIVED';
      emergency.logs.push({
        time: 'Just now',
        title: 'Ambulance Arrived',
        desc: 'Ambulance has pulled into the hospital emergency intake bay.'
      });

      store.save();
      return { success: true, emergency };
    },

    async completeEmergency(emergencyId) {
      const state = store.getState();
      const emergency = state.emergencies.find(e => e.id === emergencyId);
      if (!emergency) return { success: false };

      emergency.status = 'COMPLETED';
      emergency.logs.push({
        time: 'Just now',
        title: 'Emergency Completed',
        desc: 'Patient handed over to emergency medical department. Trip concluded.'
      });

      // Free ambulance
      const amb = state.ambulances.find(a => a.id === emergency.ambulanceId);
      if (amb) {
        amb.status = 'AVAILABLE';
        amb.currentEmergencyId = null;
        amb.tripsCompleted = (amb.tripsCompleted || 0) + 1;
      }

      // Add to history
      state.history.unshift({
        id: 'hist_' + Date.now(),
        userId: emergency.userId,
        type: emergency.type,
        level: emergency.level,
        ambulanceId: emergency.ambulanceId,
        hospitalId: emergency.hospitalId,
        hospitalName: (state.hospitals.find(h => h.id === emergency.hospitalId) || {}).name || 'Metro Central',
        pickupAddress: emergency.pickupLocation.address,
        date: new Date().toISOString().split('T')[0],
        durationMinutes: 14,
        status: 'COMPLETED',
        outcome: 'Successfully admitted and stabilized at emergency intake.'
      });

      store.save();
      return { success: true, emergency };
    },

    async cancelEmergency(emergencyId) {
      const state = store.getState();
      const emergency = state.emergencies.find(e => e.id === emergencyId);
      if (!emergency) return { success: false };

      emergency.status = 'CANCELLED';
      emergency.logs.push({
        time: 'Just now',
        title: 'Request Cancelled',
        desc: 'Emergency request was cancelled.'
      });

      const amb = state.ambulances.find(a => a.id === emergency.ambulanceId);
      if (amb) {
        amb.status = 'AVAILABLE';
        amb.currentEmergencyId = null;
      }

      store.save();
      return { success: true, emergency };
    },

    // Query APIs
    async getAvailableAmbulances() {
      const state = store.getState();
      return state.ambulances.filter(a => a.status === 'AVAILABLE');
    },

    async getNearbyHospitals() {
      const state = store.getState();
      return state.hospitals;
    },

    async getHospitalById(id) {
      const state = store.getState();
      return state.hospitals.find(h => h.id === id) || state.hospitals[0];
    },

    async updateHospitalBeds(hospitalId, bedData) {
      const state = store.getState();
      const hsp = state.hospitals.find(h => h.id === hospitalId) || state.hospitals[0];
      if (hsp) {
        hsp.beds = Object.assign(hsp.beds || {}, bedData);
        store.save();
        return { success: true, hospital: hsp };
      }
      return { success: false };
    },

    async updateHospitalStatus(hospitalId, status) {
      const state = store.getState();
      const hsp = state.hospitals.find(h => h.id === hospitalId) || state.hospitals[0];
      if (hsp) {
        hsp.emergencyStatus = status;
        store.save();
        return { success: true, hospital: hsp };
      }
      return { success: false };
    },

    async updateDriverStatus(status) {
      const state = store.getState();
      const driver = state.users.find(u => u.role === 'DRIVER');
      if (driver) {
        driver.status = status;
      }
      const amb = state.ambulances[0];
      if (amb) {
        amb.status = status === 'ONLINE' ? 'AVAILABLE' : 'OFFLINE';
      }
      store.save();
      return { success: true, status };
    },

    async getNotifications(role) {
      const state = store.getState();
      return state.notifications[role.toUpperCase()] || [];
    },

    async addNotification(role, notif) {
      const state = store.getState();
      const targetList = state.notifications[role.toUpperCase()];
      if (targetList) {
        targetList.unshift(Object.assign({
          id: 'notif_' + Date.now(),
          time: 'Just now',
          read: false
        }, notif));
        store.save();
      }
    },

    async resetDemoData() {
      store.reset();
      return { success: true };
    }
  };

  window.SaveLifeAPI = API;

})(window);
