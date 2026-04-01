import axios from 'axios';
import type { AppNotification } from '../types/notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getMyNotifications(): Promise<AppNotification[]> {
  const token = localStorage.getItem('token');

  const response = await axios.get(`${API_URL}/notifications/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return Array.isArray(response.data) ? response.data : response.data?.data || [];
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  const token = localStorage.getItem('token');

  await axios.patch(
    `${API_URL}/notifications/${notificationId}/read`,
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const token = localStorage.getItem('token');

  await axios.patch(
    `${API_URL}/notifications/read-all`,
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
}