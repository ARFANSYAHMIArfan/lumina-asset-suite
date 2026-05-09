import axios from 'axios';
import { supabase } from './supabase';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Inject Supabase JWT into every request
api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// ===== Auth =====
export const apiSignup = (email, password) => api.post('/auth/signup', { email, password });
export const apiLogin = (email, password) => api.post('/auth/login', { email, password });
export const apiMe = () => api.get('/auth/me');
export const apiLogout = () => api.post('/auth/logout');

// ===== Assets =====
export const apiListAssets = () => api.get('/assets');
export const apiCreateAsset = (data) => api.post('/assets', data);
export const apiUpdateAsset = (id, data) => api.patch(`/assets/${id}`, data);
export const apiDeleteAsset = (id) => api.delete(`/assets/${id}`);
export const apiRequestUploadUrl = (filename, contentType, assetType) =>
  api.post('/assets/upload-url', {
    filename,
    content_type: contentType,
    asset_type: assetType,
  });

// Direct PUT to R2 presigned URL
export const uploadFileToR2 = async (uploadUrl, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress((e.loaded / e.total) * 100);
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
};

// ===== Queue =====
export const apiListQueue = () => api.get('/queue');
export const apiAddToQueue = (assetId) => api.post('/queue', { asset_id: assetId });
export const apiRemoveFromQueue = (id) => api.delete(`/queue/${id}`);
export const apiClearQueue = () => api.delete('/queue');
export const apiReorderQueue = (itemIds) => api.post('/queue/reorder', { item_ids: itemIds });

// ===== History =====
export const apiListHistory = (limit = 100) => api.get('/history', { params: { limit } });
export const apiAddHistory = (entry) => api.post('/history', entry);
export const apiClearHistory = () => api.delete('/history');
