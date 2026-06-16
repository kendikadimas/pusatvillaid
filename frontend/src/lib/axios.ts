import axios from 'axios';

const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_BACKEND_URL + '/api/v1'),
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

export default axiosClient;
