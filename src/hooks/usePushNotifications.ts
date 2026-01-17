import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSound } from './useNotificationSound';

interface NotificationPreferences {
  enabled: boolean;
  dueToday: boolean;
  dueTomorrow: boolean;
  overdue: boolean;
  payments: boolean;
  soundEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: false,
  dueToday: true,
  dueTomorrow: true,
  overdue: true,
  payments: true,
  soundEnabled: true,
};

export function usePushNotifications() {
  const { user } = useAuth();
  const { playSound } = useNotificationSound();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Check if notifications are supported
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }

    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('pushNotificationPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!isSupported) return false;

    try {
      await navigator.serviceWorker.register('/sw-push.js');
      setIsRegistered(true);
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }, [isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await registerServiceWorker();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [isSupported, registerServiceWorker]);

  // Show a local notification with optional sound
  const showNotification = useCallback(async (
    title: string,
    options?: {
      body?: string;
      tag?: string;
      data?: Record<string, unknown>;
      requireInteraction?: boolean;
      soundType?: 'alert' | 'success' | 'warning' | 'urgent';
    }
  ) => {
    if (permission !== 'granted') return false;

    try {
      // Play sound if enabled
      if (preferences.soundEnabled) {
        playSound(options?.soundType || 'alert');
      }

      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body: options?.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options?.tag || 'default',
        data: options?.data,
        requireInteraction: options?.requireInteraction || false,
      });
      return true;
    } catch {
      return false;
    }
  }, [permission, preferences.soundEnabled, playSound]);

  // Check for due installments and show notifications
  const checkDueInstallments = useCallback(async () => {
    if (!user || permission !== 'granted' || !preferences.enabled) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Check for installments due today
      if (preferences.dueToday) {
        const { data: dueToday } = await supabase
          .from('installments')
          .select('*, clients!inner(name, whatsapp)')
          .eq('due_date', todayStr)
          .eq('status', 'Pendente')
          .limit(5);

        if (dueToday && dueToday.length > 0) {
          const total = dueToday.reduce((sum, i) => sum + i.amount_due, 0);
          showNotification('⏰ Vencimentos Hoje', {
            body: `${dueToday.length} parcela(s) vencem hoje - Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            tag: 'due-today',
            data: { type: 'due_today' },
            requireInteraction: true,
            soundType: 'warning',
          });
        }
      }

      // Check for installments due tomorrow
      if (preferences.dueTomorrow) {
        const { data: dueTomorrow } = await supabase
          .from('installments')
          .select('*, clients!inner(name)')
          .eq('due_date', tomorrowStr)
          .eq('status', 'Pendente')
          .limit(5);

        if (dueTomorrow && dueTomorrow.length > 0) {
          showNotification('📅 Vencimentos Amanhã', {
            body: `${dueTomorrow.length} parcela(s) vencem amanhã`,
            tag: 'due-tomorrow',
            data: { type: 'due_tomorrow' },
            soundType: 'alert',
          });
        }
      }

      // Check for overdue installments
      if (preferences.overdue) {
        const { data: overdue } = await supabase
          .from('installments')
          .select('*, clients!inner(name)')
          .eq('status', 'Atrasado')
          .limit(10);

        if (overdue && overdue.length > 0) {
          const total = overdue.reduce((sum, i) => sum + i.amount_due, 0);
          showNotification('🚨 Parcelas em Atraso', {
            body: `${overdue.length} parcela(s) atrasada(s) - Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            tag: 'overdue',
            data: { type: 'overdue' },
            requireInteraction: true,
            soundType: 'urgent',
          });
        }
      }
    } catch {
      // Error checking installments
    }
  }, [user, permission, preferences, showNotification]);

  // Start/stop periodic checks
  useEffect(() => {
    if (preferences.enabled && permission === 'granted' && user) {
      // Check immediately
      checkDueInstallments();
      
      // Then check every 30 minutes
      const interval = setInterval(checkDueInstallments, 30 * 60 * 1000);
      setCheckInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (checkInterval) {
      clearInterval(checkInterval);
      setCheckInterval(null);
    }
  }, [preferences.enabled, permission, user, checkDueInstallments]);

  // Save preferences
  const updatePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem('pushNotificationPreferences', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Enable notifications (request permission + register SW + enable prefs)
  const enableNotifications = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) {
      updatePreferences({ enabled: true });
      // Trigger immediate check
      setTimeout(checkDueInstallments, 1000);
    }
    return granted;
  }, [requestPermission, updatePreferences, checkDueInstallments]);

  // Disable notifications
  const disableNotifications = useCallback(() => {
    updatePreferences({ enabled: false });
  }, [updatePreferences]);

  return {
    isSupported,
    permission,
    isRegistered,
    preferences,
    enableNotifications,
    disableNotifications,
    updatePreferences,
    showNotification,
    checkDueInstallments,
  };
}
