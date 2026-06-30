import { useEffect, useState } from 'react';
import { useSyncState } from './store';
import { Task } from '../screens/TasksScreen';

export function useNotifications() {
  const [tasks] = useSyncState<Task[]>('ks_tasks', []);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm === 'granted') {
          // Immediately simulate a notification if tasks are due, 
          // just to show it works
          triggerLocalReminder();
      }
    }
  };

  const triggerLocalReminder = () => {
      const pendingTasks = (tasks || []).filter(t => !t.completed);
      if (pendingTasks.length > 0) {
        // Retrieve already notified task IDs from cache
        let notifiedTaskIds: string[] = [];
        try {
          const cached = localStorage.getItem('ks_notified_tasks');
          if (cached) {
            notifiedTaskIds = JSON.parse(cached);
          }
        } catch (e) {
          console.warn("Failed to parse notified tasks cache", e);
        }

        // Find the first task that has not been notified yet
        const task = pendingTasks.find(t => !notifiedTaskIds.includes(t.id));
        if (!task) return;

        // Save to cache to prevent duplicate alerts
        notifiedTaskIds.push(task.id);
        try {
          localStorage.setItem('ks_notified_tasks', JSON.stringify(notifiedTaskIds));
        } catch (e) {
          console.warn("Failed to update notified tasks cache", e);
        }
        
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
           navigator.serviceWorker.ready.then(reg => {
             reg.showNotification("KisanSaathi Reminder", {
               body: `Pending task: ${task.title}. Due: ${task.date}`,
               requireInteraction: true,
               icon: '/vite.svg', // using default icon for now
               badge: '/vite.svg'
             }).catch(err => console.log("SW notification error", err));
           });
        } else {
           new Notification("KisanSaathi Reminder", {
             body: `Pending task: ${task.title}. Due: ${task.date}`,
           });
        }
      }
  };

  useEffect(() => {
    if (permission !== "granted") return;
    
    // Simulate checking for due tasks every minute.
    // In a real PWA with background sync / push API, the Service Worker 
    // would handle triggers while the app is closed.
    const interval = setInterval(() => {
      triggerLocalReminder();
    }, 60000); 

    return () => clearInterval(interval);
  }, [permission, tasks]);

  return { permission, requestPermission };
}
