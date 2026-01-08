'use client';

import { useEffect, useState } from 'react';

interface Course {
    id: string;
    name: string;
    color: string | null;
    _count: { tasks: number };
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    useEffect(() => { fetchCourses(); }, []);

    async function fetchCourses() {
        try {
            const res = await fetch('/api/courses');
            setCourses(await res.json());
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color }),
            });
            setName('');
            setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
            fetchCourses();
        } catch (error) {
            console.error('Failed to create course:', error);
        }
    }

    async function handleUpdate(id: string) {
        try {
            await fetch('/api/courses', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name: editName }),
            });
            setEditingId(null);
            fetchCourses();
        } catch (error) {
            console.error('Failed to update course:', error);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await fetch(`/api/courses?id=${id}`, { method: 'DELETE' });
            fetchCourses();
        } catch (error) {
            console.error('Failed to delete course:', error);
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">📚 강의 목록</h1>
                <p className="page-subtitle">수강 중인 강의를 등록하세요</p>
            </div>

            {/* 추가 폼 */}
            <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="label">강의명</label>
                        <input
                            className="input"
                            placeholder="예: 알고리즘, 운영체제"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">색상</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {COLORS.map((c) => (
                                <div
                                    key={c}
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: c,
                                        cursor: 'pointer',
                                        border: color === c ? '3px solid white' : '3px solid transparent',
                                        boxShadow: color === c ? '0 0 0 2px ' + c : 'none',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary">+ 추가</button>
                </div>
            </form>

            {/* 강의 목록 */}
            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
                </div>
            ) : courses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '16px' }}>📚</p>
                    <p style={{ color: 'var(--text-secondary)' }}>등록된 강의가 없습니다</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {courses.map((course) => (
                        <div key={course.id} className="card" style={{ borderLeft: `4px solid ${course.color || '#6366f1'}` }}>
                            {editingId === course.id ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        className="input"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        autoFocus
                                    />
                                    <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(course.id)}>저장</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>취소</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{course.name}</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                                            {course._count.tasks}개의 Task
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => { setEditingId(course.id); setEditName(course.name); }}
                                        >
                                            수정
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course.id)}>
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
