'use client';

import { useEffect, useState } from 'react';

interface Goal {
    id: string;
    title: string;
    periodType: 'MONTH' | 'WEEK' | 'DAY';
    startDate: string;
    endDate: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

type Tab = 'MONTH' | 'WEEK' | 'DAY';

function getWeekRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
}

function formatDate(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('MONTH');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');

    useEffect(() => { fetchGoals(); }, [activeTab, currentDate]);

    async function fetchGoals() {
        try {
            const res = await fetch(`/api/goals?periodType=${activeTab}&year=${currentDate.getFullYear()}&month=${currentDate.getMonth() + 1}`);
            const data = await res.json();
            setGoals(Array.isArray(data) ? data.filter((g: Goal) => g.periodType === activeTab) : []);
        } catch (error) {
            console.error('Failed to fetch goals:', error);
        } finally {
            setLoading(false);
        }
    }

    function getDateRange() {
        if (activeTab === 'MONTH') {
            return {
                start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                end: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
            };
        } else if (activeTab === 'WEEK') {
            return getWeekRange(currentDate);
        } else {
            return { start: currentDate, end: currentDate };
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const { start, end } = getDateRange();

        try {
            await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    periodType: activeTab,
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                }),
            });
            setTitle('');
            setShowModal(false);
            fetchGoals();
        } catch (error) {
            console.error('Failed to create goal:', error);
        }
    }

    async function toggleStatus(goal: Goal) {
        const nextStatus = goal.status === 'TODO' ? 'IN_PROGRESS' : goal.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
        try {
            await fetch('/api/goals', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: goal.id, status: nextStatus }),
            });
            fetchGoals();
        } catch (error) {
            console.error('Failed to update goal:', error);
        }
    }

    async function deleteGoal(id: string) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
            fetchGoals();
        } catch (error) {
            console.error('Failed to delete goal:', error);
        }
    }

    function navigate(delta: number) {
        const newDate = new Date(currentDate);
        if (activeTab === 'MONTH') {
            newDate.setMonth(newDate.getMonth() + delta);
        } else if (activeTab === 'WEEK') {
            newDate.setDate(newDate.getDate() + delta * 7);
        } else {
            newDate.setDate(newDate.getDate() + delta);
        }
        setCurrentDate(newDate);
    }

    function getPeriodTitle() {
        const { start, end } = getDateRange();
        if (activeTab === 'MONTH') {
            return `📅 ${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 목표`;
        } else if (activeTab === 'WEEK') {
            const weekNum = Math.ceil(currentDate.getDate() / 7);
            return `📆 ${currentDate.getMonth() + 1}월 ${weekNum}주차 (${formatDate(start)} ~ ${formatDate(end)})`;
        } else {
            return `📌 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][currentDate.getDay()]})`;
        }
    }

    const statusEmoji = { TODO: '⬜', IN_PROGRESS: '🔄', DONE: '✅' };
    const statusColor = { TODO: 'var(--text-secondary)', IN_PROGRESS: 'var(--warning)', DONE: 'var(--success)' };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">🎯 목표 관리</h1>
                <p className="page-subtitle">월간, 주간, 일간 목표를 설정하세요</p>
            </div>

            {/* 탭 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {(['MONTH', 'WEEK', 'DAY'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'MONTH' ? '📅 월간' : tab === 'WEEK' ? '📆 주간' : '📌 일간'}
                    </button>
                ))}
            </div>

            {/* 플래너 카드 */}
            <div className="card" style={{
                border: '2px solid var(--border-color)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                background: 'linear-gradient(to bottom, var(--bg-card), var(--bg-secondary))',
            }}>
                {/* 헤더 */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-color)',
                }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← 이전</button>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{getPeriodTitle()}</h2>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(1)}>다음 →</button>
                </div>

                {/* 목표 리스트 */}
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>로딩 중...</p>
                ) : goals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>아직 목표가 없습니다</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {goals.map((goal) => (
                            <div
                                key={goal.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${statusColor[goal.status]}`,
                                }}
                            >
                                <span
                                    onClick={() => toggleStatus(goal)}
                                    style={{ fontSize: '1.25rem', cursor: 'pointer' }}
                                >
                                    {statusEmoji[goal.status]}
                                </span>
                                <span style={{
                                    flex: 1,
                                    textDecoration: goal.status === 'DONE' ? 'line-through' : 'none',
                                    color: goal.status === 'DONE' ? 'var(--text-muted)' : 'inherit',
                                }}>
                                    {goal.title}
                                </span>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteGoal(goal.id)}>×</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 추가 버튼 */}
                <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '20px' }}
                    onClick={() => setShowModal(true)}
                >
                    + 목표 추가
                </button>
            </div>

            {/* 모달 */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{getPeriodTitle().replace(/📅|📆|📌/, '✨')} 추가</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '24px' }}>
                                <label className="label">목표 내용</label>
                                <input
                                    className="input"
                                    placeholder="이번 기간에 달성할 목표를 입력하세요"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                목표 추가
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
