// Dynamic runtime environment configuration for frontend
(function () {
  var hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
  var origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
  var isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  var isVercel = hostname.indexOf('vercel.app') !== -1;
  var renderBackend = 'https://clinic-website-ndzj.onrender.com/api';

  var apiUrl;
  if (isLocal) {
    apiUrl = 'http://localhost:8080/api';
  } else if (isVercel) {
    apiUrl = renderBackend;
  } else if (origin) {
    apiUrl = origin + '/api';
  } else {
    apiUrl = renderBackend;
  }

  window.__ENV__ = {
    VITE_API_BASE_URL: apiUrl
  };
})();
