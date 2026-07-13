import axios from 'axios';

// Base URL for your Django backend
//const BASE_URL = 'prime-cordi-fed-devo-7c4aa839.koyeb.app//api';
// GOOD: Use relative path (Nginx will handle the rest)
//const API_URL = import.meta.env.VITE_API_URL || ''; 
// ✅ CORRECT: Use relative path or env var
// If using relative path:
//const api = axios.create({ baseURL: '/api' }); 


// OR if using VITE_API_URL (recommended):
//const API_URL = import.meta.env.VITE_API_URL  || 'http://backend:8000'; // Fallback for local dev
//const api = axios.create({ baseURL: API_URL });
// ✅ 1. Define the Base URL correctly
// Use VITE_API_URL if set. If not provided, default to relative '/api' for deployed builds
const VITE_API_URL = 'https://prime-cordi-fed-devo-7c4aa839.koyeb.app'; // Replace with your actual backend URL
const RAW_API = import.meta.env.VITE_API_URL || '';
const API_BASE = RAW_API ? `${RAW_API.replace(/\/$/, '')}/api` : '/api';

console.log('API_Base:', API_BASE);


// Accept either a Render backend URL or the local proxy path.
//const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
//const trimmedApiUrl = rawApiUrl.replace(/\/$/, '');
//const API_BASE_URL = trimmedApiUrl.endsWith('/api')
  //? trimmedApiUrl
  //: `${trimmedApiUrl}/api`;

//if (!import.meta.env.VITE_API_URL) {
  //console.warn('⚠️ VITE_API_URL is not defined, falling back to /api');
  //console.warn('👉 Set VITE_API_URL to your backend host or /api if using the frontend proxy.');
//}

console.log('🚀 RAW VITE_API_URL:', rawApiUrl);
console.log('🚀 API_BASE_URL:', API_BASE_URL);



// ✅ 2. Create the Axios instance ONCE
const api = axios.create({
  baseURL: `${API_BASE}/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// If you use Axios:const
//const api=axios.create({
  //baseURL: API_URL, // If empty, it uses relative path like /api/...
//});

// Create axios instance
//const api = axios.create({
  //baseURL: BASE_URL,
  //headers: {
 //  'Content-Type': 'application/json',
// },
//});

// JWT Interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't override Content-Type for FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Response Interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If token expired (401) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Refresh token (call full path directly to avoid interceptor recursion)
        const refreshResponse = await axios.post(
          `${API_BASE}/auth/users/token/refresh/`,
          { refresh: refreshToken }
        );

        // Update tokens
        localStorage.setItem('access_token', refreshResponse.data.access);
        localStorage.setItem('refresh_token', refreshResponse.data.refresh);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/users/login/', {
      username,
      password,
    });
    return response;
  },

  register: async (userData) => {
    const response = await api.post('/auth/users/register/', userData);
    return response;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await axios.post('/auth/users/logout/', { refresh: refreshToken });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/users/token/refresh/', { refresh: refreshToken });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    return response;
  },

  changePassword: async (oldPassword, newPassword, newPassword2) => {
    const response = await api.put('/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password2: newPassword2,
    });
    return response;
  },
};
 // ─── User API (Profile Management) ────────────────────────────────
const userAPI = {
   // New methods for admin user management
  getAll: async () => {
    const response = await api.get('/auth/user-list/');
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/auth/user_detail/${id}/`);
    return response;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/auth/user_update/${id}/`, userData);
    return response;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/auth/user_delete/${id}/`);
    return response;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile/', userData);
    return response;
  },

  deleteAccount: async () => {
    const response = await api.delete('/auth/profile/');
    return response;
  },
};


// Content API
const contentAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/content/', { params: filters });
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/content/${id}/`);
    return response;
  },

  getBySection: async (sectionId) => {
    const response = await api.get(`/content/section/${sectionId}/`);
    return response;
  },

  create: async (contentData) => {
    const response = await api.post('/content/', contentData);
    return response;
  },

  update: async (id, contentData) => {
    const response = await api.put(`/content/${id}/`, contentData);
    return response;
  },



  delete: async (id) => {
    const response = await api.delete(`/content/${id}/`);
    return response;
  },
};

// Section API
// Section API
const sectionAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/section/', { params: filters });
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/section/${id}/`);
    return response;
  },

  getByType: async (sectionType) => {
    const response = await api.get(`/section/type/${sectionType}/`);
    return response;
  },

  getBySlug: async (slug) => {
    const response = await api.get(`/section/slug/${slug}/`);
    return response;
  },

  create: async (sectionData) => {
    const response = await api.post('/section/', sectionData);
    return response;
  },

  update: async (id, sectionData) => {
    const response = await api.put(`/section/${id}/`, sectionData);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/section/${id}/`);
    return response;
  },

};

// Quiz API
const quizAPI = {
  getAll: async () => {
    const response = await api.get('/quiz/');
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/quiz/${id}/`);
    return response;
  },

  create: async (quizData) => {
    const response = await api.post('/quiz/', quizData);
    return response;
  },

  update: async (id, quizData) => {
    const response = await api.put(`/quiz/${id}/`, quizData);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/quiz/${id}/`);
    return response;
  },
};

// Question API
const questionAPI = {
  getAll: async () => {
    const response = await api.get('/question/');
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/question/${id}/`);
    return response;
  },

  create: async (questionData) => {
    const response = await api.post('/question/', questionData);
    return response;
  },

  update: async (id, questionData) => {
    const response = await api.put(`/question/${id}/`, questionData);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/question/${id}/`);
    return response;
  },
 
  getByQuiz: async (quizId) => {
    const response = await api.get(`/question/quiz/${quizId}/`);
    return response;
  },

 
};

// ─── Media Upload API ─────────────────────────────────────────────
const mediaUploadAPI = {
  getAll: (filters = {}) =>
    api.get('/media_manager/media_uploads/', { params: filters }),

  getById: (id) =>
    api.get(`/media_manager/media_uploads/${id}/`),

  create: (formData) =>
    api.post('/media_manager/media_uploads/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id, formData) =>
    api.put(`/media_manager/media_uploads/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id) =>
    api.delete(`/media_manager/media_uploads/${id}/`),

  getSignedUrl: (id) =>
    api.get(`/media_manager/media_uploads/${id}/signed_url/`),
};

// ─── Media File API ───────────────────────────────────────────────
const mediaFileAPI = {
  getAll: (filters = {}) =>
    api.get('/media_manager/media_file/', { params: filters }),

  getById: (id) =>
    api.get(`/media_manager/media_file/${id}/`),

  create: (formData) =>
    api.post('/media_manager/media_file/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id, formData) =>
    api.put(`/media_manager/media_file/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id) =>
    api.delete(`/media_manager/media_file/${id}/`),
  getSignedUrl: (id) =>
    api.get(`/media_manager/media_file/${id}/signed_url/`),
};

// ─── External Media API ───────────────────────────────────────────
const mediaExternalAPI = {
  getAll: (filters = {}) =>
    api.get('/media_external_manager/external_media/', { params: filters }),

  getById: (id) =>
    api.get(`/media_external_manager/external_media/${id}/`),

  create: (data) =>
    api.post('/media_external_manager/external_media/', data),

  update: (id, data) =>
    api.put(`/media_external_manager/external_media_downlods/${id}/`, data),

  delete: (id) =>
    api.delete(`/media_external_manager/external_media_downlods/${id}/`),
};

// ─── Media Category API ───────────────────────────────────────────
const mediaCategoryAPI = {
  getAll: () =>
    api.get('/media_manager/media_category/'),

  getById: (id) =>
    api.get(`/media_manager/media_category/${id}/`),

  create: (data) =>
    api.post('/media_manager/media_category/', data),

  update: (id, data) =>
    api.put(`/media_manager/media_category/${id}/`, data),

  delete: (id) =>
    api.delete(`/media_manager/media_category/${id}/`),
};

// ─── Media Tag API ────────────────────────────────────────────────
const mediaTagAPI = {
  getAll: () =>
    api.get('/media_manager/media_tag/'),

  getById: (id) =>
    api.get(`/media_manager/media_tag/${id}/`),

  create: (data) =>
    api.post('/media_manager/media_tag/', data),

  update: (id, data) =>
    api.put(`/media_manager/media_tag/${id}/`, data),

  delete: (id) =>
    api.delete(`/media_manager/media_tag/${id}/`),
};

// ─── Media Download API ───────────────────────────────────────────
const mediaDownloadAPI = {
  getAll: (filters = {}) =>
    api.get('/media_manager/media_download/', { params: filters }),

  getById: (id) =>
    api.get(`/media_manager/media_download/${id}/`),

  create: (data) =>
    api.post('/media_manager/media_download/', data),

  update: (id, data) =>
    api.put(`/media_manager/media_download/${id}/`, data),

  delete: (id) =>
    api.delete(`/media_manager/media_download/${id}/`),
};

// ─── Keep old mediaAPI for backward compatibility ─────────────────
const mediaAPI = {
  getAll: (filters = {}) =>
    api.get('/media_manager/media_file/', { params: filters }),

  getById: (id) =>
    api.get(`/media_manager/media_file/${id}/`),

  create: (formData) =>
    api.post('/media_manager/media_file/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id, formData) =>
    api.put(`/media_manager/media_file/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id) =>
    api.delete(`/media_manager/media_file/${id}/`),
};
// Comparison API
const comparisonAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/comparison/', { params: filters });
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/comparison/${id}/`);
    return response;
  },

  getByType: async (systemType) => {
    const response = await api.get(`/comparison/type/${systemType}/`);
    return response;
  },

  create: async (comparisonData) => {
    const response = await api.post('/comparison/', comparisonData);
    return response;
  },

  update: async (id, comparisonData) => {
    const response = await api.put(`/comparison/${id}/`, comparisonData);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/comparison/${id}/`);
    return response;
  },
};


const caseStudyAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/caseStudy/', { params: filters });  // Changed to /
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/case_study/${id}/`);
    return response;
  },

  getByCountry: async (country) => {
    const response = await api.get(`/country/${country}/`);
    return response;
  },

  create: async (caseStudyData) => {
    const response = await api.post('/caseStudy/', caseStudyData);  // Changed to /
    return response;
  },

  update: async (id, caseStudyData) => {
    const response = await api.put(`/case_study/${id}/`, caseStudyData);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/case_study/${id}/`);
    return response;
  },
};// User Quiz Response API
// User Quiz Response API
const userQuizResponseAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/user-quiz-response/', { params: filters });
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/user-quiz-response/${id}/`);
    return response;
  },

  getByQuiz: async (quizId) => {
    const response = await api.get(`/user-quiz-response/quiz/${quizId}/`);
    return response;
  },

  getStatistics: async (quizId) => {
    const response = await api.get(`/user-quiz-response/quiz/${quizId}/statistics/`);
    return response;
  },

  getAttempts: async () => {
    const response = await api.get('/user-quiz-response/attempts/');
    return response;
  },

  create: async (responseData) => {
    const response = await api.post('/user-quiz-response/', responseData);
    return response;
  },

  update: async (id, responseData) => {
    const response = await api.put(`/user-quiz-response/${id}/`, responseData);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/user-quiz-response/${id}/`);
    return response;
  },
};
// Benefits API
const benefitAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/benefits/', { params: filters });
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/benefits/${id}/`);
    return response;
  },

  getByCategory: async (category) => {
    const response = await api.get(`/benefits/category/${category}/`);
    return response;
  },

  create: async (benefitData) => {
    const response = await api.post('/benefits/', benefitData);
    return response;
  },

  update: async (id, benefitData) => {
    const response = await api.put(`/benefits/${id}/`, benefitData);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/benefits/${id}/`);
    return response;
  },
};

// Drawbacks API
const drawbackAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/drawbacks/', { params: filters });
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/drawbacks/${id}/`);
    return response;
  },

  getByCategory: async (category) => {
    const response = await api.get(`/drawbacks/category/${category}/`);
    return response;
  },

  getBySeverity: async (severity) => {
    const response = await api.get(`/drawbacks/severity/${severity}/`);
    return response;
  },

  create: async (drawbackData) => {
    const response = await api.post('/drawbacks/', drawbackData);
    return response;
  },

  update: async (id, drawbackData) => {
    const response = await api.put(`/drawbacks/${id}/`, drawbackData);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/drawbacks/${id}/`);
    return response;
  },
};

// Export at the end
export {
  authAPI,
  userAPI,
  contentAPI,
  sectionAPI,
  quizAPI,
  questionAPI,
  mediaUploadAPI,
  mediaFileAPI,
  mediaExternalAPI,
  mediaCategoryAPI,
  mediaTagAPI,
  mediaDownloadAPI,
  mediaAPI,
  comparisonAPI,
  caseStudyAPI,
  userQuizResponseAPI,
  benefitAPI,
  drawbackAPI,
  //API_BASE_URL, // Export the actual URL for logging/debugging if needed
};
