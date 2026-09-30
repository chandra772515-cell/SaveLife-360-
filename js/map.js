/**
 * SaveLife 360 - Emergency Response Platform
 * Reusable Map System (Leaflet integration + High-Fidelity Canvas Fallback & Radar)
 * Clearly marked: DEMO DATA
 */

(function(window) {
  'use strict';

  class SaveLifeMap {
    constructor(containerId, options = {}) {
      this.containerId = containerId;
      this.container = document.getElementById(containerId);
      this.options = Object.assign({
        center: [12.9716, 77.5946],
        zoom: 14,
        interactive: true,
        showRoute: true,
        isHeroRadar: false
      }, options);

      this.leafletMap = null;
      this.canvas = null;
      this.ctx = null;
      this.animationFrame = null;
      this.markers = {};
      this.routeLine = null;

      // Simulated Waypoints for smooth demo movement
      this.ambulancePos = {
        lat: this.options.center[0] - 0.012,
        lng: this.options.center[1] + 0.010,
        x: 180,
        y: 290
      };

      this.patientPos = {
        lat: this.options.center[0] + 0.005,
        lng: this.options.center[1] + 0.003,
        x: 320,
        y: 160
      };

      this.hospitalPos = {
        lat: this.options.center[0] + 0.018,
        lng: this.options.center[1] + 0.015,
        x: 480,
        y: 90
      };

      this.init();
    }

    init() {
      if (!this.container) return;

      // Add prominent "DEMO DATA" watermark badge
      const badge = document.createElement('div');
      badge.style.position = 'absolute';
      badge.style.top = '10px';
      badge.style.left = '10px';
      badge.style.zIndex = '999';
      badge.style.background = '#FAF7E4';
      badge.style.border = '1px dashed #E76F00';
      badge.style.color = '#B71C1C';
      badge.style.padding = '4px 10px';
      badge.style.borderRadius = '6px';
      badge.style.fontSize = '0.72rem';
      badge.style.fontWeight = '800';
      badge.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
      badge.style.pointerEvents = 'none';
      badge.innerHTML = '📍 SIMULATED GPS &bull; DEMO DATA';
      this.container.style.position = 'relative';
      this.container.appendChild(badge);

      // Attempt to load Leaflet if available, else canvas
      if (window.L && !this.options.isHeroRadar) {
        this.initLeaflet();
      } else {
        this.initCanvasFallback();
      }
    }

    initLeaflet() {
      try {
        const mapDiv = document.createElement('div');
        mapDiv.style.width = '100%';
        mapDiv.style.height = '100%';
        this.container.appendChild(mapDiv);

        this.leafletMap = window.L.map(mapDiv, {
          zoomControl: true,
          attributionControl: false
        }).setView(this.options.center, this.options.zoom);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(this.leafletMap);

        // Custom HTML Markers
        const patientIcon = window.L.divIcon({
          className: 'custom-map-marker patient-marker',
          html: `<div style="background:#D32F2F; color:#fff; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; box-shadow:0 0 0 5px rgba(211,47,47,0.3); border:2px solid #fff;">📍</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const ambIcon = window.L.divIcon({
          className: 'custom-map-marker amb-marker',
          html: `<div style="background:#C62828; color:#fff; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; box-shadow:0 0 0 8px rgba(198,40,40,0.35); border:2px solid #fff; animation:pulseDot 1.5s infinite;">🚑</div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const hospitalIcon = window.L.divIcon({
          className: 'custom-map-marker hospital-marker',
          html: `<div style="background:#2E7D32; color:#fff; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 0 0 5px rgba(46,125,50,0.3); border:2px solid #fff;">🏥</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        // Add Markers
        this.markers.patient = window.L.marker([this.patientPos.lat, this.patientPos.lng], { icon: patientIcon })
          .addTo(this.leafletMap)
          .bindPopup('<b>Patient Location</b><br>742 Evergreen Terrace (Emergency Caller)');

        this.markers.ambulance = window.L.marker([this.ambulancePos.lat, this.ambulancePos.lng], { icon: ambIcon })
          .addTo(this.leafletMap)
          .bindPopup('<b>Ambulance Unit AMB-704-CR</b><br>Speed: 58 km/h &bull; Driver Marcus Vance');

        this.markers.hospital = window.L.marker([this.hospitalPos.lat, this.hospitalPos.lng], { icon: hospitalIcon })
          .addTo(this.leafletMap)
          .bindPopup('<b>Metro Health Central Hospital</b><br>Emergency Intake Bay: READY');

        // Draw animated polyline route
        const latlngs = [
          [this.ambulancePos.lat, this.ambulancePos.lng],
          [this.patientPos.lat, this.patientPos.lng],
          [this.hospitalPos.lat, this.hospitalPos.lng]
        ];

        this.routeLine = window.L.polyline(latlngs, {
          color: '#C62828',
          weight: 5,
          opacity: 0.85,
          dashArray: '8, 8'
        }).addTo(this.leafletMap);

        this.leafletMap.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });

        this.startSimulatedMovement();
      } catch (err) {
        console.warn('Leaflet initialization failed, falling back to canvas', err);
        this.initCanvasFallback();
      }
    }

    initCanvasFallback() {
      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      this.container.appendChild(canvas);

      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      const resize = () => {
        const rect = this.container.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
        this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      };

      resize();
      window.addEventListener('resize', resize);

      this.startCanvasAnimation();
    }

    startCanvasAnimation() {
      let step = 0;
      let angle = 0;

      const render = () => {
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const ctx = this.ctx;

        if (!ctx) return;

        // Dark radar background or clean light city map
        if (this.options.isHeroRadar) {
          ctx.fillStyle = '#0B131E';
          ctx.fillRect(0, 0, width, height);

          // Radar concentric rings
          ctx.strokeStyle = 'rgba(198, 40, 40, 0.25)';
          ctx.lineWidth = 1;
          const centerX = width / 2;
          const centerY = height / 2;
          const maxR = Math.min(width, height) * 0.45;

          for (let r = maxR * 0.25; r <= maxR; r += maxR * 0.25) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Cross hairs
          ctx.beginPath();
          ctx.moveTo(centerX - maxR, centerY);
          ctx.lineTo(centerX + maxR, centerY);
          ctx.moveTo(centerX, centerY - maxR);
          ctx.lineTo(centerX, centerY + maxR);
          ctx.stroke();

          // Sweeping radar beam
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(angle);
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
          gradient.addColorStop(0, 'rgba(198, 40, 40, 0.4)');
          gradient.addColorStop(1, 'rgba(198, 40, 40, 0.0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, maxR, -0.3, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          angle += 0.03;
        } else {
          // Clean Modern Map Visual
          ctx.fillStyle = '#FAF7E4';
          ctx.fillRect(0, 0, width, height);

          // Grid roads
          ctx.strokeStyle = '#E2DDC8';
          ctx.lineWidth = 28;
          ctx.lineCap = 'round';

          // Arterial streets
          ctx.beginPath();
          ctx.moveTo(0, height * 0.4);
          ctx.lineTo(width, height * 0.4);
          ctx.moveTo(width * 0.35, 0);
          ctx.lineTo(width * 0.35, height);
          ctx.moveTo(0, height * 0.75);
          ctx.lineTo(width, height * 0.75);
          ctx.moveTo(width * 0.7, 0);
          ctx.lineTo(width * 0.7, height);
          ctx.stroke();

          // River / Park
          ctx.fillStyle = '#E8F5E9';
          ctx.beginPath();
          ctx.roundRect(width * 0.05, height * 0.1, width * 0.22, height * 0.25, 12);
          ctx.fill();
        }

        // Calculate ambulance interpolated location along path
        step = (step + 0.003) % 1;
        
        const ptAmbulance = {
          x: width * 0.2 + (width * 0.3) * step,
          y: height * 0.75 - (height * 0.35) * step
        };

        const ptPatient = { x: width * 0.52, y: height * 0.38 };
        const ptHospital = { x: width * 0.82, y: height * 0.25 };

        // Draw emergency route path
        ctx.strokeStyle = '#D32F2F';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(ptAmbulance.x, ptAmbulance.y);
        ctx.lineTo(ptPatient.x, ptPatient.y);
        ctx.lineTo(ptHospital.x, ptHospital.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Patient Marker
        ctx.fillStyle = '#D32F2F';
        ctx.beginPath();
        ctx.arc(ptPatient.x, ptPatient.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📍', ptPatient.x, ptPatient.y);

        // Draw Hospital Marker
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.roundRect(ptHospital.x - 16, ptHospital.y - 16, 32, 32, 8);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('🏥', ptHospital.x, ptHospital.y);

        // Draw Ambulance Marker with siren ring
        const ringScale = (Math.sin(Date.now() / 200) + 1) * 8 + 18;
        ctx.strokeStyle = 'rgba(198, 40, 40, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ptAmbulance.x, ptAmbulance.y, ringScale, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#C62828';
        ctx.beginPath();
        ctx.arc(ptAmbulance.x, ptAmbulance.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('🚑', ptAmbulance.x, ptAmbulance.y);

        this.animationFrame = requestAnimationFrame(render);
      };

      render();
    }

    startSimulatedMovement() {
      if (!this.leafletMap || !this.markers.ambulance) return;

      let progress = 0;
      setInterval(() => {
        progress = (progress + 0.015) % 1;
        const curLat = this.ambulancePos.lat + (this.patientPos.lat - this.ambulancePos.lat) * progress;
        const curLng = this.ambulancePos.lng + (this.patientPos.lng - this.ambulancePos.lng) * progress;
        this.markers.ambulance.setLatLng([curLat, curLng]);
      }, 500);
    }

    destroy() {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      if (this.leafletMap) {
        this.leafletMap.remove();
      }
    }
  }

  window.SaveLifeMap = SaveLifeMap;

})(window);
