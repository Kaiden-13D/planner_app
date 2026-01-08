'use client';

import { useEffect, useState } from 'react';

interface Subtask {
    id: string;
    content: string;
    isDone: boolean;
    order: number;
}

interface Assignment {
    id: string;
    title: string;
    subject: string | null;
    deadlineAt: string;
    progressRate: number;
    subtasks: Subtask[];
}

function formatDeadline(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diff < 0) {
        return `${Math.abs(days)}일 지남`;
    } else if (hours < 24) {
        return `${hours}시간 남음`;
    } else {
        return `${days}일 남음`;
    }
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

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [deadlineDate, setDeadlineDate] = useState('');
    const [deadlineTime, setDeadlineTime] = useState('23:59');
    const [subtaskInput, setSubtaskInput] = useState('');
    const [subtasks, setSubtasks] = useState<string[]>([]);

    // New subtask for existing assignment
    const [newSubtaskContent, setNewSubtaskContent] = useState('');

    useEffect(() => {
        fetchAssignments();
    }, []);

    async function fetchAssignments() {
        try {
            const res = await fetch('/api/assignments');
            const data = await res.json();
            setAssignments(data);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const deadlineAt = new Date(`${deadlineDate}T${deadlineTime}`).toISOString();

        try {
            await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    subject: subject || null,
                    deadlineAt,
                    subtasks,
                }),
            });
            setShowModal(false);
            resetForm();
            fetchAssignments();
        } catch (error) {
            console.error('Failed to create assignment:', error);
        }
    }

    async function toggleSubtask(subtask: Subtask) {
        try {
            await fetch('/api/subtasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: subtask.id,
                    isDone: !subtask.isDone,
                }),
            });
            fetchAssignments();
        } catch (error) {
            console.error('Failed to update subtask:', error);
        }
    }

    async function addSubtask(assignmentId: string) {
        if (!newSubtaskContent.trim()) return;

        try {
            await fetch('/api/subtasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId,
                    content: newSubtaskContent,
                }),
            });
            setNewSubtaskContent('');
            fetchAssignments();
        } catch (error) {
            console.error('Failed to add subtask:', error);
        }
    }

    async function deleteSubtask(id: string) {
        try {
            await fetch(`/api/subtasks?id=${id}`, { method: 'DELETE' });
            fetchAssignments();
        } catch (error) {
            console.error('Failed to delete subtask:', error);
        }
    }

    async function deleteAssignment(id: string) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await fetch(`/api/assignments?id=${id}`, { method: 'DELETE' });
            fetchAssignments();
        } catch (error) {
            console.error('Failed to delete assignment:', error);
        }
    }

    function resetForm() {
        setTitle('');
        setSubject('');
        setDeadlineDate('');
        setDeadlineTime('23:59');
        setSubtaskInput('');
        setSubtasks([]);
    }

    function addSubtaskToForm() {
        if (subtaskInput.trim()) {
            setSubtasks([...subtasks, subtaskInput.trim()]);
            setSubtaskInput('');
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">과제 관리</h1>
                <p className="page-subtitle">과제와 서브태스크를 관리하세요</p>
            </div>

            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginBottom: '24px' }}>
                + 과제 추가
            </button>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
                </div>
            ) : assignments.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</p>
                    <p style={{ color: 'var(--text-secondary)' }}>등록된 과제가 없습니다</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {assignments.map((assignment) => (
                        <div
                            key={assignment.id}
                            className={`card ${isOverdue(assignment.deadlineAt) ? 'debt-card' : isUrgent(assignment.deadlineAt) ? 'debt-card warning' : ''}`}
                        >
                            <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === assignment.id ? null : assignment.id)}>
                                <div>
                                    <span className="card-title">{assignment.title}</span>
                                    {assignment.subject && (
                                        <span style={{ marginLeft: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            ({assignment.subject})
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className={`badge ${isOverdue(assignment.deadlineAt) ? 'badge-danger' : isUrgent(assignment.deadlineAt) ? 'badge-warning' : 'badge-success'}`}>
                                        {formatDeadline(assignment.deadlineAt)}
                                    </span>
                                    <span className="badge badge-success">{assignment.progressRate}%</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{expandedId === assignment.id ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="progress-bar" style={{ height: '6px', marginBottom: '12px' }}>
                                <div
                                    className={`progress-fill ${assignment.progressRate === 100 ? 'safe' : isOverdue(assignment.deadlineAt) ? 'danger' : 'warning'}`}
                                    style={{ width: `${assignment.progressRate}%` }}
                                />
                            </div>

                            {expandedId === assignment.id && (
                                <div style={{ marginTop: '16px' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                        서브태스크 ({assignment.subtasks.filter(s => s.isDone).length}/{assignment.subtasks.length})
                                    </h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                        {assignment.subtasks.map((subtask) => (
                                            <div
                                                key={subtask.id}
                                                className={`checkbox-item ${subtask.isDone ? 'done' : ''}`}
                                                onClick={() => toggleSubtask(subtask)}
                                            >
                                                <div className={`checkbox ${subtask.isDone ? 'checked' : ''}`}>
                                                    {subtask.isDone && '✓'}
                                                </div>
                                                <span style={{ flex: 1 }}>{subtask.content}</span>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={(e) => { e.stopPropagation(); deleteSubtask(subtask.id); }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add new subtask */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            className="input"
                                            placeholder="새 서브태스크 추가..."
                                            value={newSubtaskContent}
                                            onChange={(e) => setNewSubtaskContent(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addSubtask(assignment.id)}
                                        />
                                        <button className="btn btn-primary" onClick={() => addSubtask(assignment.id)}>
                                            추가
                                        </button>
                                    </div>

                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                                        <button className="btn btn-danger btn-sm" onClick={() => deleteAssignment(assignment.id)}>
                                            과제 삭제
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">과제 추가</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">과제명 *</label>
                                <input
                                    className="input"
                                    placeholder="예: 1주차 과제"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">관련 과목</label>
                                <input
                                    className="input"
                                    placeholder="예: 알고리즘"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label className="label">마감일 *</label>
                                    <input
                                        className="input"
                                        type="date"
                                        value={deadlineDate}
                                        onChange={(e) => setDeadlineDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">마감 시간</label>
                                    <input
                                        className="input"
                                        type="time"
                                        value={deadlineTime}
                                        onChange={(e) => setDeadlineTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">서브태스크</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input
                                        className="input"
                                        placeholder="예: 문제 1 풀기"
                                        value={subtaskInput}
                                        onChange={(e) => setSubtaskInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtaskToForm())}
                                    />
                                    <button type="button" className="btn btn-secondary" onClick={addSubtaskToForm}>
                                        추가
                                    </button>
                                </div>
                                {subtasks.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {subtasks.map((st, idx) => (
                                            <div key={idx} className="checkbox-item">
                                                <span style={{ flex: 1 }}>{st}</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => setSubtasks(subtasks.filter((_, i) => i !== idx))}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                과제 추가하기
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
