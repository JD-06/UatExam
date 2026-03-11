import { create } from 'zustand';
import api from '../api/client';
import { Notification } from '../types';
import { io, Socket } from 'socket.io-client';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  socket: Socket | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  addNotification: (notification: Notification) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,

  fetchNotifications: async () => {
    try {
      const { data } = await api.get('/notifications');
      set({ notifications: data.notifications, unreadCount: data.unreadCount });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, leida: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, leida: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  connectSocket: (userId: string) => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join-room', userId);
    });

    socket.on('notification', (notification: Notification) => {
      get().addNotification(notification);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
