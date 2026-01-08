'use client';

import { useEffect, useState } from 'react';

type PeriodType = 'MONTH' | 'WEEK' | 'DAY';
type GoalStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface Goal {
    id: string;
    title: string;
    periodType: PeriodType;
    parentId: string | null;
    status: GoalStatus;
    targetDate: string | null;
    children: Goal[];
}

const periodLabels: Record<PeriodType, string> = {
    MONTH: '월간 목표',
    WEEK: '주간 목표',
    DAY: '일간 목표',
};

const statusLabels: Record<GoalStatus, { label: string; badge: string }> = {
    TODO: { label: '예정', badge: 'badge-secondary' },
    IN_PROGRESS: { label: '진행중', badge: 'badge-warning' },
    DONE: { label: '완료', badge: 'badge-success' },
};

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('WEEK');

    // Form state
    const [title, setTitle] = useState('');
    const [periodType, setPeriodType] = useState<PeriodType>('WEEK');
    const [parentId, setParentId] = useState('');
    const [targetDate, setTargetDate] = useState('');

    useEffect(() => {
        fetchGoals();
    }, []);

    async function fetchGoals() {
        try {
            const res = await fetch('/api/goals');
            const data = await res.json();
            setGoals(data);
        } catch (error) {
            console.error('Failed to fetch goals:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    periodType,
                    parentId: parentId || null,
                    targetDate: targetDate || null,
                }),
            });
            setShowModal(false);
            resetForm();
            fetchGoals();
        } catch (error) {
            console.error('Failed to create goal:', error);
        }
    }

    async function updateStatus(goal: Goal, newStatus: GoalStatus) {
        try {
            await fetch('/api/goals', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: goal.id,
                    status: newStatus,
                }),
            });
            fetchGoals();
        } catch (error) {
            console.error('Failed to update goal:', error);
        }
    }

    async function deleteGoal(id: string) {
        if (!confirm('정말 삭제하시겠습니까? 하위 목표도 함께 삭제됩니다.')) return;
        try {
            await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
            fetchGoals();
        } catch (error) {
            console.error('Failed to delete goal:', error);
        }
    }

    function resetForm() {
        setTitle('');
        setPeriodType('WEEK');
        setParentId('');
        setTargetDate('');
    }

    // Filter by period
    const filteredGoals = goals.filter(g => g.periodType === selectedPeriod && !g.parentId);
    const parentGoals = goals.filter(g => g.periodType !== 'DAY');

    // Get children for a goal
    function getChildren(goalId: string): Goal[] {
        return goals.filter(g => g.parentId === goalId);
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">목표 관리</h1>
                <p className="page-subtitle">월간, 주간, 일간 목표를 계층적으로 관리하세요</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + 목표 추가
                </button>
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    {(['MONTH', 'WEEK', 'DAY'] as PeriodType[]).map((period) => (
                        <button
                            key={period}
                            className={`btn ${selectedPeriod === period ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSelectedPeriod(period)}
                        >
                            {periodLabels[period]}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
                </div>
            ) : filteredGoals.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '16px' }}>🎯</p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {periodLabels[selectedPeriod]}가 없습니다
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredGoals.map((goal) => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            getChildren={getChildren}
                            updateStatus={updateStatus}
                            deleteGoal={deleteGoal}
                        />
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">목표 추가</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">목표 내용 *</label>
                                <input
                                    className="input"
                                    placeholder="예: 이번 주 강의 완료하기"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">목표 유형 *</label>
                                <select
                                    className="input"
                                    value={periodType}
                                    onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                                >
                                    <option value="MONTH">월간 목표</option>
                                    <option value="WEEK">주간 목표</option>
                                    <option value="DAY">일간 목표</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">상위 목표 (선택)</label>
                                <select
                                    className="input"
                                    value={parentId}
                                    onChange={(e) => setParentId(e.target.value)}
                                >
                                    <option value="">없음</option>
                                    {parentGoals.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            [{periodLabels[g.periodType]}] {g.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label className="label">목표 날짜</label>
                                <input
                                    className="input"
                                    type="date"
                                    value={targetDate}
                                    onChange={(e) => setTargetDate(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                목표 추가하기
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function GoalCard({
    goal,
    getChildren,
    updateStatus,
    deleteGoal,
    depth = 0
}: {
    goal: Goal;
    getChildren: (id: string) => Goal[];
    updateStatus: (goal: Goal, status: GoalStatus) => void;
    deleteGoal: (id: string) => void;
    depth?: number;
}) {
    const children = getChildren(goal.id);
    const statusInfo = statusLabels[goal.status];

    return (
        <div style={{ marginLeft: depth * 24 }}>
            <div className={`card ${goal.status === 'DONE' ? '' : goal.status === 'IN_PROGRESS' ? 'debt-card warning' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                        className={`checkbox ${goal.status === 'DONE' ? 'checked' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => updateStatus(goal, goal.status === 'DONE' ? 'TODO' : 'DONE')}
                    >
                        {goal.status === 'DONE' && '✓'}
                    </div>
                    <span
                        style={{
                            flex: 1,
                            textDecoration: goal.status === 'DONE' ? 'line-through' : 'none',
                            opacity: goal.status === 'DONE' ? 0.6 : 1,
                        }}
                    >
                        {goal.title}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                            className="input"
                            style={{ width: 'auto', padding: '6px 12px' }}
                            value={goal.status}
                            onChange={(e) => updateStatus(goal, e.target.value as GoalStatus)}
                        >
                            <option value="TODO">예정</option>
                            <option value="IN_PROGRESS">진행중</option>
                            <option value="DONE">완료</option>
                        </select>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteGoal(goal.id)}>
                            삭제
                        </button>
                    </div>
                </div>
                {goal.targetDate && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px', marginLeft: '32px' }}>
                        📅 {new Date(goal.targetDate).toLocaleDateString('ko-KR')}
                    </p>
                )}
            </div>
            {children.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {children.map((child) => (
                        <GoalCard
                            key={child.id}
                            goal={child}
                            getChildren={getChildren}
                            updateStatus={updateStatus}
                            deleteGoal={deleteGoal}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
