'use client';

import { useEffect, useState } from 'react';

interface Assignment {
    id: string;
    title: string;
    subject: string | null;
    deadlineAt: string;
    progressRate: number;
}

interface Goal {
    id: string;
    title: string;
    periodType: 'MONTH' | 'WEEK' | 'DAY';
    status: string;
    targetDate: string | null;
}

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    assignments: Assignment[];
    goals: Goal[];
}

function isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
}

function isUrgent(dateStr: string): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
}

export default function CalendarPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [assignmentsRes, goalsRes] = await Promise.all([
                fetch('/api/assignments'),
                fetch('/api/goals'),
            ]);
            setAssignments(await assignmentsRes.json());
            setGoals(await goalsRes.json());
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }

    function getCalendarDays(): CalendarDay[] {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days: CalendarDay[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const dateStr = date.toISOString().split('T')[0];

            const dayAssignments = assignments.filter(a => {
                const deadlineDate = new Date(a.deadlineAt).toISOString().split('T')[0];
                return deadlineDate === dateStr;
            });

            const dayGoals = goals.filter(g => {
                if (!g.targetDate) return false;
                const targetDateStr = new Date(g.targetDate).toISOString().split('T')[0];
                return targetDateStr === dateStr;
            });

            days.push({
                date,
                isCurrentMonth: date.getMonth() === month,
                isToday: date.getTime() === today.getTime(),
                assignments: dayAssignments,
                goals: dayGoals,
            });
        }

        return days;
    }

    function prevMonth() {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }

    function nextMonth() {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }

    function goToToday() {
        setCurrentDate(new Date());
    }

    const calendarDays = getCalendarDays();
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">캘린더</h1>
                <p className="page-subtitle">마감일과 목표 일정을 한눈에 확인하세요</p>
            </div>

            {/* Calendar Navigation */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={prevMonth}>
                        ← 이전
                    </button>
                    <button className="btn btn-secondary" onClick={goToToday}>
                        오늘
                    </button>
                    <button className="btn btn-secondary" onClick={nextMonth}>
                        다음 →
                    </button>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                    {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                </h2>
                <div style={{ width: '200px' }}></div>
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
                </div>
            ) : (
                <div className="card" style={{ padding: '16px' }}>
                    {/* Week day headers */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '4px',
                        marginBottom: '8px'
                    }}>
                        {weekDays.map((day, idx) => (
                            <div
                                key={day}
                                style={{
                                    textAlign: 'center',
                                    padding: '8px',
                                    fontWeight: '600',
                                    color: idx === 0 ? 'var(--danger)' : idx === 6 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                }}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '4px',
                    }}>
                        {calendarDays.map((day, idx) => (
                            <div
                                key={idx}
                                style={{
                                    minHeight: '100px',
                                    padding: '8px',
                                    background: day.isToday
                                        ? 'rgba(99, 102, 241, 0.15)'
                                        : day.isCurrentMonth
                                            ? 'var(--bg-tertiary)'
                                            : 'var(--bg-secondary)',
                                    borderRadius: '8px',
                                    opacity: day.isCurrentMonth ? 1 : 0.5,
                                    border: day.isToday ? '2px solid var(--accent-primary)' : 'none',
                                }}
                            >
                                <div style={{
                                    fontWeight: day.isToday ? '700' : '500',
                                    marginBottom: '4px',
                                    color: day.isToday ? 'var(--accent-primary)' : 'inherit',
                                }}>
                                    {day.date.getDate()}
                                </div>

                                {/* Assignments */}
                                {day.assignments.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className={isOverdue(assignment.deadlineAt) && assignment.progressRate < 100 ? 'blink' : ''}
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '2px 4px',
                                            marginBottom: '2px',
                                            borderRadius: '4px',
                                            background: assignment.progressRate === 100
                                                ? 'var(--success-soft)'
                                                : isOverdue(assignment.deadlineAt)
                                                    ? 'var(--danger-soft)'
                                                    : isUrgent(assignment.deadlineAt)
                                                        ? 'var(--warning-soft)'
                                                        : 'var(--bg-card)',
                                            color: assignment.progressRate === 100
                                                ? 'var(--success)'
                                                : isOverdue(assignment.deadlineAt)
                                                    ? 'var(--danger)'
                                                    : isUrgent(assignment.deadlineAt)
                                                        ? 'var(--warning)'
                                                        : 'var(--text-primary)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                        title={`${assignment.title} (${assignment.progressRate}%)`}
                                    >
                                        📝 {assignment.title}
                                    </div>
                                ))}

                                {/* Goals */}
                                {day.goals.map((goal) => (
                                    <div
                                        key={goal.id}
                                        style={{
                                            fontSize: '0.75rem',
                                            padding: '2px 4px',
                                            marginBottom: '2px',
                                            borderRadius: '4px',
                                            background: goal.status === 'DONE'
                                                ? 'var(--success-soft)'
                                                : 'rgba(99, 102, 241, 0.15)',
                                            color: goal.status === 'DONE'
                                                ? 'var(--success)'
                                                : 'var(--accent-primary)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            textDecoration: goal.status === 'DONE' ? 'line-through' : 'none',
                                        }}
                                        title={goal.title}
                                    >
                                        🎯 {goal.title}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="card" style={{ marginTop: '16px' }}>
                <div className="card-header">
                    <span className="card-title">범례</span>
                </div>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--danger-soft)' }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>마감 지남</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--warning-soft)' }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>마감 임박</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'var(--success-soft)' }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>완료</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)' }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>목표</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
