import React, { useState } from 'react';
import { ChevronLeft, Plus, Calendar, CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSyncState } from '../lib/store';

export type Task = {
  id: string;
  title: string;
  date: string;
  completed: boolean;
};

export function TasksScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useSyncState<Task[]>('ks_tasks', []);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  
  const [filterMode, setFilterMode] = useState<'all' | 'urgent'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskDate.trim()) return;
    setTasks([...(tasks || []), { id: Date.now().toString(), title: newTaskTitle, date: newTaskDate, completed: false }]);
    setNewTaskTitle('');
    setNewTaskDate('');
  };

  const toggleTask = (id: string) => {
    setTasks((tasks || []).map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getTaskStatus = (dateStr: string) => {
    const taskDate = new Date(dateStr);
    taskDate.setHours(0, 0, 0, 0);
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 2) return 'urgent';
    return 'upcoming';
  };

  // Generate next 14 days for visual calendar
  const calendarDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 3); // Start 3 days ago to show some history
    return d;
  });

  const formatDateString = (d: Date) => {
    const offset = d.getTimezoneOffset()
    d = new Date(d.getTime() - (offset*60*1000))
    return d.toISOString().split('T')[0]
  };

  // Filtering
  let displayedTasks = (tasks || []).filter(t => !t.completed);
  
  if (filterMode === 'urgent') {
    displayedTasks = displayedTasks.filter(t => {
      const status = getTaskStatus(t.date);
      return status === 'overdue' || status === 'today' || status === 'urgent';
    });
  }
  
  if (selectedDate) {
    displayedTasks = displayedTasks.filter(t => t.date === selectedDate);
  }

  const completedTasks = selectedDate 
    ? (tasks || []).filter(t => t.completed && t.date === selectedDate)
    : (tasks || []).filter(t => t.completed);

  // Group pending tasks by status for 'all' mode
  const overdueTasks = displayedTasks.filter(t => getTaskStatus(t.date) === 'overdue');
  const otherPendingTasks = displayedTasks.filter(t => getTaskStatus(t.date) !== 'overdue');

  return (
    <div className="p-4 space-y-6 flex flex-col min-h-screen bg-gray-50 dark:bg-[#121212]">
      <header className="flex items-center mb-2">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t("schedule_tasks")}</h1>
      </header>

      {/* View Toggles */}
      <div className="flex bg-gray-200/50 dark:bg-gray-800 p-1 rounded-xl">
        <button 
          onClick={() => { setFilterMode('all'); setSelectedDate(null); }}
          className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${filterMode === 'all' && !selectedDate ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {t("all_tasks")}
        </button>
        <button 
          onClick={() => { setFilterMode('urgent'); setSelectedDate(null); }}
          className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${filterMode === 'urgent' && !selectedDate ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {t("urgent_overdue")}
        </button>
      </div>

      {/* Visual Calendar Tape */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t("calendar_view")}</h2>
          {selectedDate && (
             <button onClick={() => setSelectedDate(null)} className="text-xs text-primary font-bold">{t("clear_date")}</button>
          )}
        </div>
        <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide -mx-2 px-2">
          {calendarDays.map((date, idx) => {
            const dateStr = formatDateString(date);
            const isToday = date.getTime() === today.getTime();
            const isSelected = selectedDate === dateStr;
            const hasPending = (tasks || []).some(t => t.date === dateStr && !t.completed);
            const hasOverdue = (tasks || []).some(t => t.date === dateStr && !t.completed && getTaskStatus(t.date) === 'overdue');
            
            return (
              <button 
                key={idx}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`flex-shrink-0 w-14 flex flex-col items-center justify-center py-2 rounded-xl border transition-colors ${isSelected ? 'bg-primary border-primary text-white shadow-md' : isToday ? 'bg-primary/5 dark:bg-primary/20 border-primary/30 text-primary dark:text-primary-light' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
              >
                <span className="text-[10px] font-medium uppercase opacity-70 mb-1">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                <div className="h-1.5 mt-1.5 flex items-center justify-center">
                  {hasOverdue ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  ) : hasPending ? (
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={addTask} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{t("add_new_task")}</h2>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder={t("task_placeholder")}
          className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <div className="flex space-x-3">
          <input
            type="date"
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
            className="flex-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button type="submit" disabled={!newTaskTitle || !newTaskDate} className="bg-primary text-white p-2 px-4 rounded-lg font-bold disabled:opacity-50">
            <Plus size={20} />
          </button>
        </div>
      </form>

      <div className="space-y-6 pb-20">
        
        {overdueTasks.length > 0 && !selectedDate && (
           <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3 border border-orange-100 dark:border-orange-800/30">
            <h3 className="text-xs font-bold text-orange-600 dark:text-orange-400 tracking-wider uppercase mb-3 flex items-center">
               <AlertCircle size={14} className="mr-1.5" /> {t("overdue_tasks")}
            </h3>
            <div className="space-y-2">
              {overdueTasks.map((task) => (
                <div key={task.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                    <button onClick={() => toggleTask(task.id)} className="text-gray-300 dark:text-gray-600 hover:text-primary transition-colors">
                      <Circle size={24} />
                    </button>
                    <div className="flex-1 truncate">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                      <div className="flex items-center text-xs text-orange-600 dark:text-orange-400 mt-0.5 font-medium">
                        <Calendar size={12} className="mr-1" />
                        {task.date} (Overdue)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherPendingTasks.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-3 px-1">{selectedDate ? `${t("tasks_on")} ${selectedDate}` : t("upcoming")}</h3>
            <div className="space-y-2">
              {otherPendingTasks.map((task) => {
                 const status = getTaskStatus(task.date);
                 return (
                  <div key={task.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                      <button onClick={() => toggleTask(task.id)} className="text-gray-300 dark:text-gray-600 hover:text-primary transition-colors">
                        <Circle size={24} />
                      </button>
                      <div className="flex-1 truncate">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <Calendar size={12} className="mr-1" />
                          <span className={status === 'today' ? 'text-primary font-bold' : ''}>
                             {status === 'today' ? 'Today' : task.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                 );
              })}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && filterMode !== 'urgent' && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-3 mt-6 px-1">{t("completed")}</h3>
            <div className="space-y-2 opacity-70">
              {completedTasks.map((task) => (
                <div key={task.id} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                    <button onClick={() => toggleTask(task.id)} className="text-green-500 dark:text-green-400">
                      <CheckCircle2 size={24} />
                    </button>
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate line-through">{task.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {displayedTasks.length === 0 && completedTasks.length === 0 && (
          <div className="text-center py-10 opacity-50">
            <Clock size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">{t("no_tasks")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

