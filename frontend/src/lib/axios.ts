import axios from 'axios';

const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_BACKEND_URL + '/api/v1'),
    timeout: 30000,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const isAdminApi = config.url?.startsWith('/admin') || config.url?.includes('/admin/');
        const token = isAdminApi 
            ? localStorage.getItem('admin_token') 
            : (localStorage.getItem('user_token') || localStorage.getItem('admin_token'));
            
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Auto-logout admin on 401/403 from admin endpoints
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== 'undefined') {
            const url = error.config?.url || '';
            const isAdminApi = url.startsWith('/admin') || url.includes('/admin/');
            const status = error.response?.status;
            const code = error.response?.data?.code;

            // Skip the login endpoint itself
            const isLoginEndpoint = url === '/admin/login';

            if (isAdminApi && !isLoginEndpoint && (status === 401 || (status === 403 && code === 'SESSION_EXPIRED'))) {
                localStorage.removeItem('admin_token');
                const message = error.response?.data?.message || 'Sesi admin telah berakhir. Silakan login kembali.';
                sessionStorage.setItem('admin_logout_reason', message);
                window.location.href = '/admin/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
