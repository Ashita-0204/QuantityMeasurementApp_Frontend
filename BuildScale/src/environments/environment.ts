export const environment = {
  production: false,
  apiUrl: (window as any).__env?.apiUrl || 'https://quantitymeasurementappbackend.onrender.com'
};