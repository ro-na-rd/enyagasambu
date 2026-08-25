'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CheckCircle, Circle, BookOpen } from '@/lib/icons';

const NAVY = '#0f1e42';
const ORG = '#E85D04';

const categoryColors: Record<string, string> = {
  profile: '#0f1e42',
  certificate: '#d97706',
  promotion: '#7c3aed',
  recruitment: '#059669',
  campaign: '#2563eb',
  policy: '#dc2626',
  referral: ORG,
  training: '#0891b2',
  general: '#6b7280',
};

interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  sort_order: number;
}

interface Guideline {
  title: string;
  content?: string;
  items?: string[];
}

export default function AmbassadorOnboardingPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<{ total: number; completed: number; percentage: number } | null>(null);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'guidelines'>('tasks');

  useEffect(() => {
    Promise.all([
      api.get('/ambassador/onboarding/tasks'),
      api.get('/ambassador/onboarding/progress'),
      api.get('/ambassador/onboarding/guidelines'),
    ])
      .then(([t, p, g]) => {
        setTasks(t.data.tasks);
        setProgress(p.data);
        setGuidelines(g.data.guidelines);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleTask = async (taskId: number) => {
    const res = await api.post(`/ambassador/onboarding/tasks/${taskId}/toggle`);
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: res.data.completed } : t));
    if (progress) {
      const newCompleted = tasks.filter(t => t.id === taskId ? res.data.completed : t.completed).length;
      setProgress({
        ...progress,
        completed: newCompleted,
        percentage: Math.round((newCompleted / progress.total) * 100),
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Onboarding</h1>
        <p className="text-sm text-gray-500 mt-1">Complete your ambassador onboarding tasks</p>
      </div>

      {progress && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">Progress</h2>
            <span className="text-sm font-bold" style={{ color: NAVY }}>{progress.completed}/{progress.total} tasks</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%`, background: `linear-gradient(90deg, ${ORG}, #ff8a3d)` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{progress.percentage}% complete</p>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {(['tasks', 'guidelines'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition ${
              activeTab === tab
                ? 'bg-[#E85D04] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#E85D04] hover:text-[#E85D04]'
            }`}
          >
            {tab === 'tasks' ? 'Onboarding Tasks' : 'Guidelines'}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {tasks.map((task) => {
            const catColor = categoryColors[task.category] || categoryColors.general;
            return (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`w-full text-left bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4 transition hover:shadow-md ${
                  task.completed ? 'border-green-200' : 'border-gray-100'
                }`}
              >
                <div className="shrink-0">
                  {task.completed
                    ? <CheckCircle size={24} className="text-green-500" />
                    : <Circle size={24} className="text-gray-300" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0" style={{ background: `${catColor}18`, color: catColor }}>
                  {task.category}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'guidelines' && (
        <div className="space-y-4">
          {guidelines.map((g, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={18} style={{ color: NAVY }} />
                <h3 className="text-sm font-bold text-gray-800">{g.title}</h3>
              </div>
              {g.content && <p className="text-sm text-gray-600">{g.content}</p>}
              {g.items && (
                <ul className="space-y-2 mt-3">
                  {g.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
