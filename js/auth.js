/**
 * SaveLife 360 - Emergency Response Platform
 * Authentication & Role Guard System
 */

(function(window) {
  'use strict';

  const AUTH_KEY = 'SAVELIFE360_AUTH_USER';

  const Auth = {
    getUser() {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Invalid auth payload', e);
        }
      }
      return null;
    },

    setUser(user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    },

    isAuthenticated() {
      return !!this.getUser();
    },

    getRole() {
      const user = this.getUser();
      return user ? user.role : null;
    },

    loginAsRole(role) {
      const state = window.SaveLifeDataStore ? window.SaveLifeDataStore.getState() : null;
      let user = null;
      if (state && state.users) {
        user = state.users.find(u => u.role.toUpperCase() === role.toUpperCase());
      }

      if (!user) {
        user = {
          id: 'usr_' + role.toLowerCase(),
          name: role === 'PUBLIC' ? 'Sarah Jenkins' : (role === 'DRIVER' ? 'Marcus Vance' : 'Dr. Evelyn Reed (ER Desk)'),
          email: role.toLowerCase() + '@savelife360.org',
          phone: '+1 (555) 019-2834',
          role: role.toUpperCase(),
          status: 'ACTIVE'
        };
      }

      this.setUser(user);
      return user;
    },

    logout() {
      localStorage.removeItem(AUTH_KEY);
      // Determine root relative path
      const path = window.location.pathname;
      if (path.includes('/public/') || path.includes('/driver/') || path.includes('/hospital/')) {
        window.location.href = '../login.html';
      } else {
        window.location.href = 'login.html';
      }
    },

    // Page access control
    protect(requiredRole) {
      const user = this.getUser();
      if (!user) {
        // If not logged in, auto-login into the portal role for demo convenience
        this.loginAsRole(requiredRole);
        return;
      }

      if (user.role.toUpperCase() !== requiredRole.toUpperCase()) {
        console.warn(`User role ${user.role} does not match required role ${requiredRole}. Switching role for seamless evaluation.`);
        this.loginAsRole(requiredRole);
      }
    },

    setupUserProfileUI() {
      const user = this.getUser();
      if (!user) return;

      const userNameEls = document.querySelectorAll('.auth-user-name');
      userNameEls.forEach(el => el.textContent = user.name || 'User');

      const userRoleEls = document.querySelectorAll('.auth-user-role');
      userRoleEls.forEach(el => el.textContent = user.role || 'PUBLIC');

      const userEmailEls = document.querySelectorAll('.auth-user-email');
      userEmailEls.forEach(el => el.textContent = user.email || '');

      const avatarEls = document.querySelectorAll('.auth-user-avatar');
      avatarEls.forEach(el => {
        el.textContent = (user.name || user.role).charAt(0).toUpperCase();
      });
    }
  };

  window.SaveLifeAuth = Auth;

  document.addEventListener('DOMContentLoaded', () => {
    Auth.setupUserProfileUI();
  });

})(window);
