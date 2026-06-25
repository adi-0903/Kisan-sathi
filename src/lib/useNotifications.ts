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
        const task = pendingTasks[0];
        
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
