/**
 * SaveLife 360 - Emergency Response Platform
 * Notifications System & Audio Sounder
 */

(function(window) {
  'use strict';

  // Synthetic Audio Beep / Siren using Web Audio API (No external assets required)
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playAlertChime(type) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'critical') {
        // High-priority urgent double beep
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1174.66, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Gentle bell chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  const Notifications = {
    init() {
      this.ensureContainer();
      this.renderBellBadges();
      this.listenToStateUpdates();
    },

    ensureContainer() {
      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
      }
      return container;
    },

    show(title, message, type = 'info', playSound = true) {
      const container = this.ensureContainer();

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;

      let icon = '🔔';
      if (type === 'critical') icon = '🚨';
      else if (type === 'success') icon = '✓';
      else if (type === 'warning') icon = '⚠️';

      toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-body">
          <div class="toast-title">${title}</div>
          <div class="toast-desc">${message}</div>
        </div>
        <button class="toast-close" title="Close">&times;</button>
      `;

      container.appendChild(toast);

      if (playSound) {
        playAlertChime(type);
      }

      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 200);
      });

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 250);
        }
      }, 6000);
    },

    renderBellBadges() {
      const role = window.SaveLifeAuth ? window.SaveLifeAuth.getRole() : 'PUBLIC';
      if (!role) return;

      const state = window.SaveLifeDataStore ? window.SaveLifeDataStore.getState() : null;
      if (!state || !state.notifications) return;

      const notifs = state.notifications[role.toUpperCase()] || [];
      const unreadCount = notifs.filter(n => !n.read).length;

      const badgeEls = document.querySelectorAll('.notification-unread-count');
      badgeEls.forEach(el => {
        el.textContent = unreadCount;
        el.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
      });
    },

    listenToStateUpdates() {
      window.addEventListener('sl360-state-changed', () => {
        this.renderBellBadges();
      });
    }
  };

  window.SaveLifeNotifications = Notifications;

  document.addEventListener('DOMContentLoaded', () => {
    Notifications.init();
  });

})(window);
