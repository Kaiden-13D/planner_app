'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalCourses: number;
  totalTextbooks: number;
  totalTasks: number;
  completedTasks: number;
  todayTasks: number;
  todayCompleted: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [coursesRes, textbooksRes, tasksRes, todayTasksRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/textbooks'),
        fetch('/api/tasks'),
        fetch(`/api/tasks?date=${today.toISOString()}`),
      ]);

      const courses = await coursesRes.json();
      const textbooks = await textbooksRes.json();
      const tasks = await tasksRes.json();
      const todayTasks = await todayTasksRes.json();

      setStats({
        totalCourses: Array.isArray(courses) ? courses.length : 0,
        totalTextbooks: Array.isArray(textbooks) ? textbooks.length : 0,
        totalTasks: Array.isArray(tasks) ? tasks.length : 0,
        completedTasks: Array.isArray(tasks) ? tasks.filter((t: { isDone: boolean }) => t.isDone).length : 0,
        todayTasks: Array.isArray(todayTasks) ? todayTasks.length : 0,
        todayCompleted: Array.isArray(todayTasks) ? todayTasks.filter((t: { isDone: boolean }) => t.isDone).length : 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({ totalCourses: 0, totalTextbooks: 0, totalTasks: 0, completedTasks: 0, todayTasks: 0, todayCompleted: 0 });
    } finally {
      setLoading(false);
    }
  }

  const today = new Date();
  const completionRate = stats?.todayTasks ? Math.round((stats.todayCompleted / stats.todayTasks) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">대시보드</h1>
        <p className="page-subtitle">오늘의 학습 현황을 확인하세요</p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
        </div>
      ) : (
        <>
          {/* 오늘 진도 카드 */}
          <div className="card" style={{
            marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
            border: '1px solid var(--accent-primary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px' }}>
                  📅 {today.getMonth() + 1}월 {today.getDate()}일 ({['일', '월', '화', '수', '목', '금', '토'][today.getDay()]})
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  오늘 {stats?.todayCompleted || 0} / {stats?.todayTasks || 0} Task 완료
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
                  fontSize: '1.5rem',
                  fontWeight: '700',
                }}>
                  {completionRate}%
                </div>
              </div>
            </div>
          </div>

          {/* 통계 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <Link href="/courses" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                <span style={{ fontSize: '2rem' }}>📚</span>
                <h3 style={{ fontSize: '2rem', fontWeight: '700', marginTop: '8px' }}>{stats?.totalCourses}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>등록된 강의</p>
              </div>
            </Link>
            <Link href="/textbooks" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                <span style={{ fontSize: '2rem' }}>📖</span>
                <h3 style={{ fontSize: '2rem', fontWeight: '700', marginTop: '8px' }}>{stats?.totalTextbooks}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>등록된 교재</p>
              </div>
            </Link>
            <Link href="/calendar" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                <span style={{ fontSize: '2rem' }}>✅</span>
                <h3 style={{ fontSize: '2rem', fontWeight: '700', marginTop: '8px' }}>{stats?.completedTasks} / {stats?.totalTasks}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>완료된 Task</p>
              </div>
            </Link>
            <Link href="/goals" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                <span style={{ fontSize: '2rem' }}>🎯</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '8px' }}>목표 관리</h3>
                <p style={{ color: 'var(--text-secondary)' }}>월간/주간/일간</p>
              </div>
            </Link>
          </div>

          {/* 빠른 시작 */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>🚀 빠른 시작</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/courses"><button className="btn btn-primary">📚 강의 등록</button></Link>
              <Link href="/textbooks"><button className="btn btn-secondary">📖 교재 등록</button></Link>
              <Link href="/calendar"><button className="btn btn-secondary">📅 오늘 Task 추가</button></Link>
              <Link href="/goals"><button className="btn btn-secondary">🎯 목표 설정</button></Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
