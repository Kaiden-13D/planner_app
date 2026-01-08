'use client';

import { useEffect, useState } from 'react';

interface DebtData {
  unwatchedLectureMinutes: number;
  unreviewedLectureMinutes: number;
  unreadPages: number;
  overdueAssignments: number;
  urgentAssignments: number;
  unresolvedQuestions: number;
  totalDebtScore: number;
  details: {
    unwatchedLectures: { subject: string; lecNum: number; partNum: number | null; duration: number }[];
    unreadBooks: { title: string; chapterNum: number; pages: number }[];
    overdueAssignmentList: { title: string; deadlineAt: string; progressRate: number }[];
    urgentAssignmentList: { title: string; deadlineAt: string; progressRate: number }[];
  };
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}

function getDebtLevel(score: number): 'safe' | 'warning' | 'danger' {
  if (score < 50) return 'safe';
  if (score < 150) return 'warning';
  return 'danger';
}

function getDebtMessage(level: 'safe' | 'warning' | 'danger'): string {
  switch (level) {
    case 'safe': return '잘 하고 있어요! 지금처럼 유지하세요 💪';
    case 'warning': return '조금씩 밀리고 있어요. 오늘 조금 더 집중해보세요 📚';
    case 'danger': return '위험합니다! 지금 당장 공부를 시작하세요 🔥';
  }
}

export default function Dashboard() {
  const [debtData, setDebtData] = useState<DebtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDebtData();
  }, []);

  async function fetchDebtData() {
    try {
      const res = await fetch('/api/debt');
      if (!res.ok) throw new Error('Failed to fetch debt data');
      const data = await res.json();
      setDebtData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">대시보드</h1>
          <p className="page-subtitle">지식 부채 현황을 한눈에 확인하세요</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">대시보드</h1>
          <p className="page-subtitle">지식 부채 현황을 한눈에 확인하세요</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: 'var(--danger)' }}>⚠️ 데이터를 불러올 수 없습니다</p>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
            Supabase 연결을 확인하세요
          </p>
        </div>
      </div>
    );
  }

  // Demo data if no data yet
  const data = debtData || {
    unwatchedLectureMinutes: 0,
    unreviewedLectureMinutes: 0,
    unreadPages: 0,
    overdueAssignments: 0,
    urgentAssignments: 0,
    unresolvedQuestions: 0,
    totalDebtScore: 0,
    details: {
      unwatchedLectures: [],
      unreadBooks: [],
      overdueAssignmentList: [],
      urgentAssignmentList: [],
    }
  };

  const debtLevel = getDebtLevel(data.totalDebtScore);
  const progressPercent = Math.min(data.totalDebtScore / 300 * 100, 100);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">대시보드</h1>
        <p className="page-subtitle">지식 부채 현황을 한눈에 확인하세요</p>
      </div>

      {/* Main Debt Card */}
      <div className={`card debt-card ${debtLevel}`} style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <span className="card-title">🔥 현재 지식 부채</span>
          <span className={`badge badge-${debtLevel}`}>
            {debtLevel === 'safe' ? '안전' : debtLevel === 'warning' ? '주의' : '위험'}
          </span>
        </div>

        <div className={`debt-value ${debtLevel}`}>
          {data.totalDebtScore}점
        </div>

        <div className="progress-bar">
          <div
            className={`progress-fill ${debtLevel}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {getDebtMessage(debtLevel)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎬</div>
          <div className="stat-value">{formatMinutes(data.unwatchedLectureMinutes)}</div>
          <div className="stat-label">미시청 강의</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-value">{formatMinutes(data.unreviewedLectureMinutes)}</div>
          <div className="stat-label">미복습 강의</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{data.unreadPages}p</div>
          <div className="stat-label">미독 페이지</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value" style={{ color: data.overdueAssignments > 0 ? 'var(--danger)' : 'inherit' }}>
            {data.overdueAssignments}개
          </div>
          <div className="stat-label">마감 지난 과제</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-value" style={{ color: data.urgentAssignments > 0 ? 'var(--warning)' : 'inherit' }}>
            {data.urgentAssignments}개
          </div>
          <div className="stat-label">마감 임박 (24h)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">❓</div>
          <div className="stat-value">{data.unresolvedQuestions}개</div>
          <div className="stat-label">미해결 질문</div>
        </div>
      </div>

      {/* Urgent Items */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Overdue Assignments */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🚨 마감 지난 과제</span>
          </div>
          {data.details.overdueAssignmentList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              없음 ✅
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.details.overdueAssignmentList.map((assignment, idx) => (
                <div key={idx} className="checkbox-item" style={{ background: 'var(--danger-soft)' }}>
                  <span style={{ flex: 1 }}>{assignment.title}</span>
                  <span className="badge badge-danger">{assignment.progressRate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Urgent Assignments */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⏰ 마감 임박 과제</span>
          </div>
          {data.details.urgentAssignmentList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              없음 ✅
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.details.urgentAssignmentList.map((assignment, idx) => (
                <div key={idx} className="checkbox-item" style={{ background: 'var(--warning-soft)' }}>
                  <span style={{ flex: 1 }}>{assignment.title}</span>
                  <span className="badge badge-warning">{assignment.progressRate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <span className="card-title">⚡ 빠른 작업</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a href="/lectures" className="btn btn-primary">강의 추가</a>
          <a href="/assignments" className="btn btn-primary">과제 추가</a>
          <a href="/books" className="btn btn-secondary">도서 추가</a>
          <a href="/goals" className="btn btn-secondary">목표 설정</a>
        </div>
      </div>
    </div>
  );
}
