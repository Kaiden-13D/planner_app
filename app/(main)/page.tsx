'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DailyTask {
  id: string;
  date: string;
  content: string;
  isDone: boolean;
  course: { name: string; color: string | null } | null;
  textbook: { name: string; color: string | null } | null;
}

interface Goal {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

type ViewMode = 'DAY' | 'WEEK' | 'MONTH';

function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('DAY');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => { fetchData(); }, [viewMode, currentDate]);

  async function fetchData() {
    setLoading(true);
    try {
      let start: Date, end: Date;

      if (viewMode === 'DAY') {
        start = new Date(currentDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(currentDate);
        end.setHours(23, 59, 59, 999);
      } else if (viewMode === 'WEEK') {
        const range = getWeekRange(currentDate);
        start = range.start;
        end = range.end;
      } else {
        const range = getMonthRange(currentDate);
        start = range.start;
        end = range.end;
      }

      const [tasksRes, goalsRes] = await Promise.all([
        fetch(`/api/tasks?start=${start.toISOString()}&end=${end.toISOString()}`),
        fetch(`/api/goals?periodType=${viewMode}&year=${currentDate.getFullYear()}&month=${currentDate.getMonth() + 1}`),
      ]);

      const tasksData = await tasksRes.json();
      const goalsData = await goalsRes.json();

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setGoals(Array.isArray(goalsData) ? goalsData.filter((g: Goal & { periodType: string }) => g.periodType === viewMode) : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  function navigate(delta: number) {
    const newDate = new Date(currentDate);
    if (viewMode === 'DAY') newDate.setDate(newDate.getDate() + delta);
    else if (viewMode === 'WEEK') newDate.setDate(newDate.getDate() + delta * 7);
    else newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function getTitle() {
    if (viewMode === 'DAY') {
      return `📌 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][currentDate.getDay()]})`;
    } else if (viewMode === 'WEEK') {
      const { start, end } = getWeekRange(currentDate);
      const weekNum = Math.ceil(currentDate.getDate() / 7);
      return `📆 ${currentDate.getMonth() + 1}월 ${weekNum}주차 (${formatDate(start)} ~ ${formatDate(end)})`;
    } else {
      return `📅 ${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
    }
  }

  const completedTasks = tasks.filter(t => t.isDone).length;
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const completedGoals = goals.filter(g => g.status === 'DONE').length;

  const statusEmoji = { TODO: '⬜', IN_PROGRESS: '🔄', DONE: '✅' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">대시보드</h1>
        <p className="page-subtitle">학습 현황을 확인하세요</p>
      </div>

      {/* 뷰 모드 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['DAY', 'WEEK', 'MONTH'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            className={`btn ${viewMode === mode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode(mode)}
          >
            {mode === 'DAY' ? '📌 일간' : mode === 'WEEK' ? '📆 주간' : '📅 월간'}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>←</button>
          <button className="btn btn-secondary btn-sm" onClick={goToToday}>오늘</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(1)}>→</button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>로딩 중...</div>
      ) : (
        <>
          {/* 기간 타이틀 및 진도 */}
          <div className="card" style={{
            marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
            border: '1px solid var(--accent-primary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>{getTitle()}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  ✅ Task: {completedTasks} / {tasks.length} 완료
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  🎯 목표: {completedGoals} / {goals.length} 달성
                </p>
              </div>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: `conic-gradient(var(--accent-primary) ${completionRate * 3.6}deg, var(--bg-tertiary) 0deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: '700',
                }}>
                  {completionRate}%
                </div>
              </div>
            </div>
          </div>

          {/* 2열 레이아웃 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* 목표 카드 */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <span className="card-title">🎯 {viewMode === 'DAY' ? '일간' : viewMode === 'WEEK' ? '주간' : '월간'} 목표</span>
                <Link href="/goals"><button className="btn btn-secondary btn-sm">관리</button></Link>
              </div>
              {goals.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>설정된 목표가 없습니다</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {goals.slice(0, 5).map((goal) => (
                    <div key={goal.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                      <span>{statusEmoji[goal.status]}</span>
                      <span style={{ flex: 1, textDecoration: goal.status === 'DONE' ? 'line-through' : 'none', color: goal.status === 'DONE' ? 'var(--text-muted)' : 'inherit' }}>{goal.title}</span>
                    </div>
                  ))}
                  {goals.length > 5 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>+{goals.length - 5}개 더...</p>}
                </div>
              )}
            </div>

            {/* Task 카드 */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <span className="card-title">✅ Task 목록</span>
                <Link href="/calendar"><button className="btn btn-secondary btn-sm">캘린더</button></Link>
              </div>
              {tasks.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>등록된 Task가 없습니다</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {tasks.map((task) => (
                    <div key={task.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${task.course?.color || task.textbook?.color || 'var(--border-color)'}`,
                    }}>
                      <span>{task.isDone ? '✅' : '⬜'}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ textDecoration: task.isDone ? 'line-through' : 'none', color: task.isDone ? 'var(--text-muted)' : 'inherit' }}>{task.content}</span>
                        {(task.course || task.textbook) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {task.course?.name || task.textbook?.name}
                          </div>
                        )}
                      </div>
                      {viewMode !== 'DAY' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatDate(new Date(task.date))}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 빠른 시작 */}
          <div className="card" style={{ marginTop: '24px' }}>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>🚀 빠른 시작</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/courses"><button className="btn btn-primary">📚 강의 등록</button></Link>
              <Link href="/textbooks"><button className="btn btn-secondary">📖 교재 등록</button></Link>
              <Link href="/calendar"><button className="btn btn-secondary">📅 Task 추가</button></Link>
              <Link href="/goals"><button className="btn btn-secondary">🎯 목표 설정</button></Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
