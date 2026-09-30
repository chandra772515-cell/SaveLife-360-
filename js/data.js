/**
 * SaveLife 360 - Emergency Response Platform
 * Data Store & Persistence Layer (Mock Database)
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'SAVELIFE360_STATE_V1';

  // Realistic initial mock data centered around a city (demo area: e.g. Metro / San Francisco / Delhi / NYC styled coords)
  // Let's use clean demo coordinates around (12.9716, 77.5946 - Metro Bangalore / or 37.7749, -122.4194)
  const BASE_LAT = 12.9716;
  const BASE_LNG = 77.5946;

  const INITIAL_DATA = {
    users: [
      {
        id: 'usr_pub_1',
        name: 'Sarah Jenkins',
        email: 'sarah.j@example.com',
        phone: '+1 (555) 234-8901',
        role: 'PUBLIC',
        status: 'ACTIVE'
      },
      {
        id: 'usr_drv_1',
        name: 'Marcus Vance',
        email: 'driver.marcus@savelife360.org',
        phone: '+1 (555) 782-4419',
        license: 'DL-9948201-X',
        vehicleNumber: 'AMB-704-CR',
        organization: 'Metro Rapid Medical Services',
        isVerified: true,
        role: 'DRIVER',
        status: 'ONLINE'
      },
      {
        id: 'usr_hsp_1',
        name: 'Dr. Evelyn Reed (ER Desk)',
        email: 'erdesk@metrohealth.org',
        phone: '+1 (555) 433-2000',
        hospitalId: 'hsp_1',
        role: 'HOSPITAL',
        status: 'ACTIVE'
      }
    ],

    ambulances: [
      {
        id: 'amb_1',
        driverId: 'usr_drv_1',
        driverName: 'Marcus Vance',
        driverPhone: '+1 (555) 782-4419',
        vehicleNumber: 'AMB-704-CR',
        type: 'Advanced Cardiac Life Support (ACLS)',
        equipment: ['Defibrillator', 'Ventilator', 'ECG Monitor', 'Oxygen Supply'],
        latitude: BASE_LAT + 0.012,
        longitude: BASE_LNG - 0.008,
        status: 'AVAILABLE', // AVAILABLE, ON_THE_WAY, PATIENT_ON_BOARD, OFFLINE
        currentEmergencyId: null,
        rating: 4.9,
        tripsCompleted: 342
      },
      {
        id: 'amb_2',
        driverId: 'usr_drv_2',
        driverName: 'Rajesh Sharma',
        driverPhone: '+1 (555) 341-9922',
        vehicleNumber: 'AMB-302-BLS',
        type: 'Basic Life Support (BLS)',
        equipment: ['Stretcher', 'Basic Oxygen', 'First Aid Trauma Kit'],
        latitude: BASE_LAT - 0.015,
        longitude: BASE_LNG + 0.012,
        status: 'AVAILABLE',
        currentEmergencyId: null,
        rating: 4.8,
        tripsCompleted: 218
      },
      {
        id: 'amb_3',
        driverId: 'usr_drv_3',
        driverName: 'Elena Rostova',
        driverPhone: '+1 (555) 890-1123',
        vehicleNumber: 'AMB-510-ALS',
        type: 'Neonatal & Pediatric Intensive Care',
        equipment: ['Incubator', 'Pediatric Monitor', 'Infusion Pumps'],
        latitude: BASE_LAT + 0.022,
        longitude: BASE_LNG + 0.018,
        status: 'AVAILABLE',
        currentEmergencyId: null,
        rating: 5.0,
        tripsCompleted: 489
      }
    ],

    hospitals: [
      {
        id: 'hsp_1',
        name: 'Metro Health Central Hospital',
        address: '450 Healthcare Boulevard, Metro Central',
        phone: '+1 (555) 433-2000',
        latitude: BASE_LAT + 0.018,
        longitude: BASE_LNG + 0.015,
        emergencyStatus: 'ACCEPTING', // ACCEPTING, LIMITED, NOT_ACCEPTING
        distanceKm: 3.8,
        etaMinutes: 8,
        facilities: ['Level 1 Trauma Center', '24/7 Cardiac Cath Lab', 'Stroke Care Unit', 'Helipad'],
        beds: {
          emergency: 6,
          emergencyTotal: 18,
          icu: 3,
          icuTotal: 12,
          general: 24,
          generalTotal: 120
        },
        doctorsOnDuty: 8
      },
      {
        id: 'hsp_2',
        name: 'St. Jude Memorial Trauma & Surgical Institute',
        address: '120 West River Parkway',
        phone: '+1 (555) 882-9100',
        latitude: BASE_LAT - 0.012,
        longitude: BASE_LNG - 0.016,
        emergencyStatus: 'ACCEPTING',
        distanceKm: 4.9,
        etaMinutes: 11,
        facilities: ['Comprehensive Burn Care', 'Trauma Resuscitation', 'Pediatric ICU'],
        beds: {
          emergency: 4,
          emergencyTotal: 14,
          icu: 2,
          icuTotal: 10,
          general: 15,
          generalTotal: 85
        },
        doctorsOnDuty: 6
      },
      {
        id: 'hsp_3',
        name: 'Northpoint Community Emergency Hospital',
        address: '88 Northpoint Avenue, Suite 100',
        phone: '+1 (555) 612-4040',
        latitude: BASE_LAT + 0.028,
        longitude: BASE_LNG - 0.014,
        emergencyStatus: 'LIMITED',
        distanceKm: 6.2,
        etaMinutes: 14,
        facilities: ['Urgent ER Care', 'Orthopedic Surgery', 'CT/MRI Diagnostics'],
        beds: {
          emergency: 2,
          emergencyTotal: 10,
          icu: 1,
          icuTotal: 6,
          general: 8,
          generalTotal: 50
        },
        doctorsOnDuty: 4
      },
      {
        id: 'hsp_4',
        name: 'Apex Super Specialty Care',
        address: '77 Technology Expressway',
        phone: '+1 (555) 799-3131',
        latitude: BASE_LAT - 0.025,
        longitude: BASE_LNG + 0.025,
        emergencyStatus: 'NOT_ACCEPTING',
        distanceKm: 8.5,
        etaMinutes: 19,
        facilities: ['Organ Transplant', 'Neurosciences', 'Cardiology'],
        beds: {
          emergency: 0,
          emergencyTotal: 12,
          icu: 0,
          icuTotal: 8,
          general: 4,
          generalTotal: 60
        },
        doctorsOnDuty: 2
      }
    ],

    emergencies: [
      {
        id: 'emg_active_demo',
        userId: 'usr_pub_1',
        userName: 'Sarah Jenkins',
        userPhone: '+1 (555) 234-8901',
        type: 'Breathing Emergency',
        level: 'HIGH', // CRITICAL, HIGH, MODERATE
        notes: 'Severe respiratory distress, patient conscious but gasping.',
        pickupLocation: {
          address: '742 Evergreen Terrace, Sector 4',
          latitude: BASE_LAT + 0.005,
          longitude: BASE_LNG + 0.003
        },
        ambulanceId: 'amb_1',
        hospitalId: 'hsp_1',
        status: 'DRIVER EN ROUTE', // State machine definition
        createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
        distanceKm: 2.4,
        etaMinutes: 5,
        logs: [
          { time: '4m ago', title: 'Request Created', desc: 'Emergency broadcast triggered by user.' },
          { time: '3m ago', title: 'Ambulance Assigned', desc: 'Unit AMB-704-CR (Driver Marcus Vance) accepted.' },
          { time: '2m ago', title: 'Driver En Route', desc: 'Ambulance speeding towards patient location.' }
        ]
      }
    ],

    history: [
      {
        id: 'emg_hist_1',
        userId: 'usr_pub_1',
        type: 'Cardiac Emergency',
        level: 'CRITICAL',
        ambulanceId: 'amb_1',
        hospitalId: 'hsp_1',
        hospitalName: 'Metro Health Central Hospital',
        pickupAddress: '22 Elm Street, Apt 4B',
        date: '2026-09-24',
        durationMinutes: 18,
        status: 'COMPLETED',
        outcome: 'Patient stabilized in cardiac cath lab within 24 minutes.'
      },
      {
        id: 'emg_hist_2',
        userId: 'usr_pub_1',
        type: 'Accident',
        level: 'HIGH',
        ambulanceId: 'amb_2',
        hospitalId: 'hsp_2',
        hospitalName: 'St. Jude Memorial Trauma & Surgical Institute',
        pickupAddress: 'Highway Junction 14',
        date: '2026-09-11',
        durationMinutes: 22,
        status: 'COMPLETED',
        outcome: 'Fracture reduction and wound management completed.'
      }
    ],

    notifications: {
      PUBLIC: [
        { id: 'notif_1', time: 'Just now', title: 'Ambulance Approaching', text: 'Unit AMB-704-CR is 2.4 km away, ETA 5 minutes.', type: 'critical', read: false },
        { id: 'notif_2', time: '3 min ago', title: 'Driver Assigned', text: 'Marcus Vance has accepted your emergency request.', type: 'info', read: true }
      ],
      DRIVER: [
        { id: 'notif_3', time: '4 min ago', title: 'New Emergency Assigned', text: 'Breathing emergency at 742 Evergreen Terrace.', type: 'critical', read: false },
        { id: 'notif_4', time: '1 hour ago', title: 'Shift Started', text: 'You are marked ONLINE and ready for dispatch.', type: 'success', read: true }
      ],
      HOSPITAL: [
        { id: 'notif_5', time: '2 min ago', title: 'Incoming ACLS Unit', text: 'AMB-704-CR en route with high respiratory case. ETA ~12m.', type: 'warning', read: false },
        { id: 'notif_6', time: '20 min ago', title: 'Bed Status Update', text: 'Trauma Bay 2 cleared and sanitized.', type: 'info', read: true }
      ]
    },

    driverLocation: {
      latitude: BASE_LAT + 0.009,
      longitude: BASE_LNG - 0.003,
      speedKmh: 58,
      heading: 'NE'
    }
  };

  class DataStore {
    constructor() {
      this.init();
    }

    init() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
        this.save();
      } else {
        try {
          this.state = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse state, resetting to initial', e);
          this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
          this.save();
        }
      }
    }

    getState() {
      return this.state;
    }

    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('sl360-state-changed', { detail: this.state }));
    }

    reset() {
      this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
      this.save();
    }
  }

  window.SaveLifeDataStore = new DataStore();

  // Listen to storage events from other browser tabs
  window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_KEY) {
      try {
        window.SaveLifeDataStore.state = JSON.parse(e.newValue);
        window.dispatchEvent(new CustomEvent('sl360-state-changed', { detail: window.SaveLifeDataStore.state }));
      } catch (err) {
        console.error('Error handling storage event', err);
      }
    }
  });

})(window);
