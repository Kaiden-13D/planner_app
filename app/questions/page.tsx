'use client';

import { useEffect, useState } from 'react';

interface Lecture {
    id: string;
    subject: string;
    lecNum: number;
    partNum: number | null;
}

interface Assignment {
    id: string;
    title: string;
}

interface QuestionLog {
    id: string;
    refType: 'LECTURE' | 'ASSIGNMENT';
    lectureId: string | null;
    assignmentId: string | null;
    lecture: Lecture | null;
    assignment: Assignment | null;
    slideNum: number | null;
    content: string;
    isResolved: boolean;
    createdAt: string;
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<QuestionLog[]>([]);
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');

    // Form state
    const [refType, setRefType] = useState<'LECTURE' | 'ASSIGNMENT'>('LECTURE');
    const [lectureId, setLectureId] = useState('');
    const [assignmentId, setAssignmentId] = useState('');
    const [slideNum, setSlideNum] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [questionsRes, lecturesRes, assignmentsRes] = await Promise.all([
                fetch('/api/questions'),
                fetch('/api/lectures'),
                fetch('/api/assignments'),
            ]);
            setQuestions(await questionsRes.json());
            setLectures(await lecturesRes.json());
            setAssignments(await assignmentsRes.json());
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refType,
                    lectureId: refType === 'LECTURE' ? lectureId : null,
                    assignmentId: refType === 'ASSIGNMENT' ? assignmentId : null,
                    slideNum: slideNum ? parseInt(slideNum) : null,
                    content,
                }),
            });
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Failed to create question:', error);
        }
    }

    async function toggleResolved(question: QuestionLog) {
        try {
            await fetch('/api/questions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: question.id,
                    isResolved: !question.isResolved,
                }),
            });
            fetchData();
        } catch (error) {
            console.error('Failed to update question:', error);
        }
    }

    async function deleteQuestion(id: string) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await fetch(`/api/questions?id=${id}`, { method: 'DELETE' });
            fetchData();
        } catch (error) {
            console.error('Failed to delete question:', error);
        }
    }

    function resetForm() {
        setRefType('LECTURE');
        setLectureId('');
        setAssignmentId('');
        setSlideNum('');
        setContent('');
    }

    const filteredQuestions = questions.filter(q => {
        if (filter === 'unresolved') return !q.isResolved;
        if (filter === 'resolved') return q.isResolved;
        return true;
    });

    const unresolvedCount = questions.filter(q => !q.isResolved).length;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">질문 로그</h1>
                <p className="page-subtitle">강의나 과제 중 생긴 질문을 기록하고 관리하세요</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + 질문 추가
                </button>

                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <button
                        className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('all')}
                    >
                        전체 ({questions.length})
                    </button>
                    <button
                        className={`btn ${filter === 'unresolved' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('unresolved')}
                    >
                        미해결 ({unresolvedCount})
                    </button>
                    <button
                        className={`btn ${filter === 'resolved' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('resolved')}
                    >
                        해결됨
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
                </div>
            ) : filteredQuestions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '16px' }}>❓</p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {filter === 'all' ? '등록된 질문이 없습니다' :
                            filter === 'unresolved' ? '미해결 질문이 없습니다 🎉' : '해결된 질문이 없습니다'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredQuestions.map((question) => (
                        <div
                            key={question.id}
                            className={`card ${question.isResolved ? '' : 'debt-card warning'}`}
                            style={{ opacity: question.isResolved ? 0.7 : 1 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div
                                    className={`checkbox ${question.isResolved ? 'checked' : ''}`}
                                    style={{ cursor: 'pointer', marginTop: '2px' }}
                                    onClick={() => toggleResolved(question)}
                                >
                                    {question.isResolved && '✓'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{
                                        textDecoration: question.isResolved ? 'line-through' : 'none',
                                        marginBottom: '8px',
                                    }}>
                                        {question.content}
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {question.lecture && (
                                            <span className="badge badge-success">
                                                🎬 {question.lecture.subject} Lec {question.lecture.lecNum}
                                                {question.lecture.partNum && ` Part ${question.lecture.partNum}`}
                                            </span>
                                        )}
                                        {question.assignment && (
                                            <span className="badge badge-warning">
                                                📝 {question.assignment.title}
                                            </span>
                                        )}
                                        {question.slideNum && (
                                            <span className="badge badge-secondary" style={{ background: 'var(--bg-tertiary)' }}>
                                                Slide #{question.slideNum}
                                            </span>
                                        )}
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {new Date(question.createdAt).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-danger" onClick={() => deleteQuestion(question.id)}>
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">질문 추가</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">연관 유형 *</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        type="button"
                                        className={`btn ${refType === 'LECTURE' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setRefType('LECTURE')}
                                        style={{ flex: 1 }}
                                    >
                                        🎬 강의
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${refType === 'ASSIGNMENT' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setRefType('ASSIGNMENT')}
                                        style={{ flex: 1 }}
                                    >
                                        📝 과제
                                    </button>
                                </div>
                            </div>

                            {refType === 'LECTURE' ? (
                                <div style={{ marginBottom: '16px' }}>
                                    <label className="label">강의 선택 *</label>
                                    <select
                                        className="input"
                                        value={lectureId}
                                        onChange={(e) => setLectureId(e.target.value)}
                                        required
                                    >
                                        <option value="">선택하세요</option>
                                        {lectures.map((lec) => (
                                            <option key={lec.id} value={lec.id}>
                                                {lec.subject} - Lec {lec.lecNum}{lec.partNum ? ` Part ${lec.partNum}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div style={{ marginBottom: '16px' }}>
                                    <label className="label">과제 선택 *</label>
                                    <select
                                        className="input"
                                        value={assignmentId}
                                        onChange={(e) => setAssignmentId(e.target.value)}
                                        required
                                    >
                                        <option value="">선택하세요</option>
                                        {assignments.map((a) => (
                                            <option key={a.id} value={a.id}>{a.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {refType === 'LECTURE' && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label className="label">슬라이드 번호 (선택)</label>
                                    <input
                                        className="input"
                                        type="number"
                                        placeholder="예: 15"
                                        value={slideNum}
                                        onChange={(e) => setSlideNum(e.target.value)}
                                    />
                                </div>
                            )}

                            <div style={{ marginBottom: '24px' }}>
                                <label className="label">질문 내용 *</label>
                                <textarea
                                    className="input"
                                    placeholder="이해가 안 되는 부분을 적어주세요..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={4}
                                    required
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                질문 추가하기
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
