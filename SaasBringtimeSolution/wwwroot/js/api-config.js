// Konfigurasi API Backend (RestAPIDefault)
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:10007/api';

// Helper Escape HTML Anti-XSS (Global)
function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
window.escHtml = escHtml;

// Global Currency Formatter
window.formatRupiah = function(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
};

// Helper Session Pengguna (Multi-Tenant & Multi-Portal Scoped)
const AuthSession = {
    // Helper Cookie Dasar
    getCookie: function (name) {
        try {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i].trim();
                if (c.indexOf(nameEQ) === 0) {
                    return decodeURIComponent(c.substring(nameEQ.length));
                }
            }
            return null;
        } catch(e) {
            return null;
        }
    },

    setCookie: function (name, value, days) {
        try {
            var expires = "";
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/; SameSite=Lax";
        } catch(e) {}
    },

    // Deteksi Scope Portal saat ini berdasarkan URL
    getCurrentScope: function () {
        var path = (window.location.pathname || '').toLowerCase();
        var segments = path.split('/').filter(Boolean);
        if (segments.length > 0) {
            var first = segments[0];
            if (first === 'donor') return 'donor';
            if (first === 'foundation') return 'foundation';
            if (first === 'admin') return 'admin';
        }
        return 'default';
    },

    getToken: function (scope) {
        scope = scope || this.getCurrentScope();
        try {
            if (scope && scope !== 'default') {
                var scopedToken = localStorage.getItem('bringtime_jwt_token_' + scope);
                if (scopedToken) return scopedToken;
                // Jika di area tenant dan user adalah superadmin, izinkan token admin
                if (scope.indexOf('tenant_') === 0) {
                    var adminToken = localStorage.getItem('bringtime_jwt_token_admin');
                    if (adminToken) return adminToken;
                }
            }
            var token = localStorage.getItem('bringtime_jwt_token') || localStorage.getItem('jwtToken');
            if (token) return token;
            var user = this.getUser(scope);
            return (user && user.token) ? user.token : null;
        } catch (e) {
            return null;
        }
    },

    setToken: function (token, scope) {
        if (!token) return;
        scope = scope || this.getCurrentScope();
        try {
            var expires = new Date();
            expires.setDate(expires.getDate() + 1); // Masa berlaku 1 hari (24 jam)
            var cookieStr = encodeURIComponent(token) + '; path=/; expires=' + expires.toUTCString() + '; SameSite=Lax';

            if (scope && scope !== 'default') {
                localStorage.setItem('bringtime_jwt_token_' + scope, token);
                document.cookie = 'bringtime_jwt_token_' + scope + '=' + cookieStr;
            }
            localStorage.setItem('bringtime_jwt_token', token);
            localStorage.setItem('jwtToken', token);
            document.cookie = 'bringtime_jwt_token=' + cookieStr;
        } catch (e) {}
    },

    removeToken: function (scope) {
        scope = scope || this.getCurrentScope();
        try {
            if (scope && scope !== 'default') {
                localStorage.removeItem('bringtime_jwt_token_' + scope);
                document.cookie = 'bringtime_jwt_token_' + scope + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
            }
            localStorage.removeItem('bringtime_jwt_token');
            localStorage.removeItem('jwtToken');
            document.cookie = 'bringtime_jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
        } catch (e) {}
    },

    getUser: function (scope) {
        scope = scope || this.getCurrentScope();
        try {
            // 1. Coba ambil dari session scoped khusus
            if (scope && scope !== 'default') {
                var scopedData = localStorage.getItem('currentUser_' + scope);
                if (scopedData) return JSON.parse(scopedData);
                // Jika di area tenant dan user adalah superadmin di admin session
                if (scope.indexOf('tenant_') === 0) {
                    var adminData = localStorage.getItem('currentUser_admin');
                    if (adminData) {
                        var adminObj = JSON.parse(adminData);
                        var isSuper = (adminObj.roles && (adminObj.roles.indexOf('Super Admin') !== -1 || adminObj.roles.indexOf('super_admin') !== -1)) || adminObj.roleId === 1 || adminObj.roleId === 4;
                        if (isSuper) return adminObj;
                    }
                }
            }
            // 2. Fallback ke global currentUser
            var data = localStorage.getItem('currentUser');
            if (data) {
                var globalUser = JSON.parse(data);
                // Jika di area admin tapi globalUser bukan Super Admin, periksa apakah ada currentUser_admin
                if (scope === 'admin') {
                    var isSuper = (globalUser.roles && (globalUser.roles.indexOf('Super Admin') !== -1 || globalUser.roles.indexOf('super_admin') !== -1)) || globalUser.roleId === 1 || globalUser.roleId === 4;
                    if (!isSuper) {
                        var adm = localStorage.getItem('currentUser_admin');
                        return adm ? JSON.parse(adm) : null;
                    }
                }
                return globalUser;
            }
            return null;
        } catch (e) {
            return null;
        }
    },

    setUser: function (user, scope) {
        if (!user) return;
        if (!scope) {
            var isSuper = (user.roles && user.roles.indexOf('Super Admin') !== -1) || user.roleId === 1;
            if (isSuper) {
                scope = 'admin';
            } else if (user.foundationSlug) {
                scope = 'tenant_' + user.foundationSlug.toLowerCase();
            } else {
                scope = this.getCurrentScope();
            }
        }

        // Simpan ke storage scoped
        if (scope && scope !== 'default') {
            localStorage.setItem('currentUser_' + scope, JSON.stringify(user));
            if (user.token) {
                this.setToken(user.token, scope);
            }
        }

        // Simpan juga ke global currentUser sebagai pointer aktif
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.token) {
            this.setToken(user.token);
        }

        try {
            var expires = new Date();
            expires.setDate(expires.getDate() + 1); // 1 Hari (24 jam)
            var cookieStr = encodeURIComponent(JSON.stringify(user)) + '; path=/; expires=' + expires.toUTCString() + '; SameSite=Lax';

            // Simpan Cookie scoped khusus portal ini
            if (scope && scope !== 'default') {
                document.cookie = 'bringtime_session_' + scope + '=' + cookieStr;
            }
            // Simpan Cookie fallback global
            document.cookie = 'bringtime_user_session=' + cookieStr;
            document.cookie = 'saaso_user_session=' + cookieStr;
        } catch (e) {}
    },

    clearAll: function () {
        try {
            // 1. Bersihkan semua kunci auth di localStorage
            var keysToRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && (
                    k.indexOf('currentUser') === 0 || 
                    k.indexOf('bringtime_') === 0 || 
                    k.indexOf('jwtToken') === 0 || 
                    k.indexOf('token') === 0 || 
                    k === 'user' ||
                    k === 'currentUser'
                )) {
                    keysToRemove.push(k);
                }
            }
            keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
            localStorage.removeItem('currentUser');
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('bringtime_jwt_token');

            // 2. Bersihkan sessionStorage
            try { sessionStorage.clear(); } catch(e) {}

            // 3. Bersihkan semua cookie sesi
            var cookies = document.cookie.split(";");
            for (var c = 0; c < cookies.length; c++) {
                var cookie = cookies[c];
                var eqPos = cookie.indexOf("=");
                var name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                document.cookie = name + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
                document.cookie = name + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
            }
        } catch (e) {
            console.error('Logout cleanup error:', e);
        }
    },

    removeUser: function (scope) {
        this.clearAll();
    },

    isAuthenticated: function (scope) {
        return !!this.getUser(scope);
    },

    getPublicUrl: function () {
        return '/';
    },

    getLoginUrl: function () {
        return '/Auth/Login';
    },

    getDashboardUrl: function (scope) {
        var user = this.getUser(scope);
        if (!user) return '/Auth/Login';
        var roles = user.roles || [];
        var isSuper = roles.some(function(r) { return (r||'').toLowerCase().includes('super') || (r||'').toLowerCase() === 'admin'; }) || user.roleId === 1;
        if (isSuper) return '/Admin/Dashboard';
        
        var isFoundationAdmin = roles.some(function(r) { return (r||'').toLowerCase().includes('foundation') || (r||'').toLowerCase().includes('yayasan'); });
        if (isFoundationAdmin) {
            return '/Foundation/Dashboard';
        }
        return '/Donor/Dashboard';
    },

    redirectToPublic: function () {
        window.location.href = this.getPublicUrl();
    },

    redirectToLogin: function () {
        window.location.href = this.getLoginUrl();
    },

    redirectToDashboard: function (scope) {
        window.location.href = this.getDashboardUrl(scope);
    },

    requireAuth: function (scope) {
        if (!this.isAuthenticated(scope)) {
            this.redirectToLogin();
        }
    }
};

window.AuthSession = AuthSession;
window.getCookie = AuthSession.getCookie;
window.setCookie = AuthSession.setCookie;

// Injeksi Otomatis Header Authorization Bearer JWT ke Seluruh Panggilan Ajax jQuery
if (typeof jQuery !== 'undefined' || typeof $ !== 'undefined') {
    (function ($) {
        $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
            var token = AuthSession.getToken();
            if (token && (!options.headers || !options.headers['Authorization'])) {
                jqXHR.setRequestHeader('Authorization', 'Bearer ' + token);
            }
        });

        // Interseptor Respon 401 (JWT Expired 1 Hari atau Invalid)
        $(document).ajaxError(function (event, jqXHR, settings, thrownError) {
            if (jqXHR.status === 401) {
                console.warn('JWT Token kadaluwarsa (1 hari) atau tidak valid.');
                var currentPath = (window.location.pathname || '').toLowerCase();
                var isProtectedArea = currentPath.startsWith('/admin') || currentPath.startsWith('/foundation') || currentPath.startsWith('/donor') ||
                    (currentPath.indexOf('/dashboard') !== -1) || (currentPath.indexOf('/campaigns') !== -1) || (currentPath.indexOf('/donations') !== -1);
                if (isProtectedArea) {
                    AuthSession.removeUser();
                    window.location.href = AuthSession.getLoginUrl();
                }
            }
        });
    })(jQuery || $);
}
