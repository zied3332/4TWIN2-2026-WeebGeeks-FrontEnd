import axios from 'axios';
import type { AppNotification } from '../types/notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function authHeaders() {
  const rawToken = localStorage.getItem('token') || localStorage.getItem('access_token');
  const normalizedToken = String(rawToken || '').replace(/^Bearer\s+/i, '').trim();
  return normalizedToken ? { Authorization: `Bearer ${normalizedToken}` } : {};
}

export async function getMyNotifications(signal?: AbortSignal): Promise<AppNotification[]> {
  const response = await axios.get(`${API_URL}/notifications/me`, {
    headers: authHeaders(),
    signal,
  });

  return Array.isArray(response.data) ? response.data : response.data?.data || [];
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  await axios.patch(
    `${API_URL}/notifications/${notificationId}/read`,
    {},
    {
      headers: authHeaders(),
    }
  );
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await axios.patch(
    `${API_URL}/notifications/read-all`,
    {},
    {
      headers: authHeaders(),
    }
  );
}