'use client';

import { useEffect, useState } from 'react';

interface Course {
    id: string;
    name: string;
}

interface Textbook {
    id: string;
    name: string;
}

interface QuestionLog {
    id: string;
    courseId: string | null;
    textbookId: string | null;
    lectureNo: number | null;
    partNo: number | null;
    slideNo: number | null;
    chapterNo: number | null;
    pageNo: number | null;
    content: string;
    isResolved: boolean;
    createdAt: string;
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<QuestionLog[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [textbooks, setTextbooks] = useState<Textbook[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');

    // Form state
    const [refType, setRefType] = useState<'none' | 'course' | 'textbook'>('none');
    const [courseId, setCourseId] = useState('');
    const [textbookId, setTextbookId] = useState('');
    const [content, setContent] = useState('');

    // 강의 세부정보
    const [lectureNo, setLectureNo] = useState('');
    const [partNo, setPartNo] = useState('');
    const [slideNo, setSlideNo] = useState('');

    // 교재 세부정보
    const [chapterNo, setChapterNo] = useState('');
    const [pageNo, setPageNo] = useState('');

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        try {
            const [questionsRes, coursesRes, textbooksRes] = await Promise.all([
                fetch('/api/questions'),
                fetch('/api/courses'),
                fetch('/api/textbooks'),
            ]);
            setQuestions(await questionsRes.json());
            setCourses(await coursesRes.json());
            setTextbooks(await textbooksRes.json());
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
                    courseId: refType === 'course' ? courseId : null,
                    textbookId: refType === 'textbook' ? textbookId : null,
                    lectureNo: refType === 'course' && lectureNo ? parseInt(lectureNo) : null,
                    partNo: refType === 'course' && partNo ? parseInt(partNo) : null,
                    slideNo: refType === 'course' && slideNo ? parseInt(slideNo) : null,
                    chapterNo: refType === 'textbook' && chapterNo ? parseInt(chapterNo) : null,
                    pageNo: refType === 'textbook' && pageNo ? parseInt(pageNo) : null,
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
                body: JSON.stringify({ id: question.id, isResolved: !question.isResolved }),
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
        setRefType('none');
        setCourseId('');
        setTextbookId('');
        setContent('');
        setLectureNo('');
        setPartNo('');
        setSlideNo('');
        setChapterNo('');
        setPageNo('');
    }

    function getRefInfo(q: QuestionLog) {
        if (q.courseId) {
            const course = courses.find((c) => c.id === q.courseId);
            let info = `📚 ${course?.name || '강의'}`;
            if (q.lectureNo) info += ` Lec ${q.lectureNo}`;
            if (q.partNo) info += ` Part ${q.partNo}`;
            if (q.slideNo) info += ` Slide ${q.slideNo}`;
            return info;
        }
        if (q.textbookId) {
            const textbook = textbooks.find((t) => t.id === q.textbookId);
            let info = `📖 ${textbook?.name || '교재'}`;
            if (q.chapterNo) info += ` ${q.chapterNo}장`;
            if (q.pageNo) info += ` p.${q.pageNo}`;
            return info;
        }
        return '';
    }

    const filteredQuestions = questions.filter((q) => {
        if (filter === 'unresolved') return !q.isResolved;
        if (filter === 'resolved') return q.isResolved;
        return true;
    });

    const unresolvedCount = questions.filter((q) => !q.isResolved).length;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">❓ 질문 로그</h1>
                <p className="page-subtitle">학습 중 생긴 질문을 기록하고 관리하세요</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 질문 추가</button>
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>전체 ({questions.length})</button>
                    <button className={`btn ${filter === 'unresolved' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('unresolved')}>❌ 미해결 ({unresolvedCount})</button>
                    <button className={`btn ${filter === 'resolved' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('resolved')}>✅ 해결됨</button>
                </div>
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>로딩 중...</div>
            ) : filteredQuestions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '16px' }}>❓</p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {filter === 'all' ? '등록된 질문이 없습니다' : filter === 'unresolved' ? '미해결 질문이 없습니다 🎉' : '해결된 질문이 없습니다'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredQuestions.map((question) => (
                        <div key={question.id} className="card" style={{
                            opacity: question.isResolved ? 0.7 : 1,
                            borderLeft: `4px solid ${question.isResolved ? 'var(--success)' : 'var(--warning)'}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <button
                                    onClick={() => toggleResolved(question)}
                                    style={{
                                        fontSize: '1.5rem',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                    }}
                                    title={question.isResolved ? '미해결로 변경' : '해결됨으로 변경'}
                                >
                                    {question.isResolved ? '✅' : '⬜'}
                                </button>
                                <div style={{ flex: 1 }}>
                                    <p style={{
                                        textDecoration: question.isResolved ? 'line-through' : 'none',
                                        marginBottom: '8px',
                                        fontSize: '1rem',
                                        color: question.isResolved ? 'var(--text-muted)' : 'inherit',
                                    }}>
                                        {question.content}
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {getRefInfo(question) && (
                                            <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>{getRefInfo(question)}</span>
                                        )}
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {new Date(question.createdAt).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                </div>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteQuestion(question.id)}>삭제</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">질문 추가</h2>
                            <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">연관 자료</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button type="button" className={`btn ${refType === 'none' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRefType('none')} style={{ flex: 1 }}>없음</button>
                                    <button type="button" className={`btn ${refType === 'course' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRefType('course')} style={{ flex: 1 }}>📚 강의</button>
                                    <button type="button" className={`btn ${refType === 'textbook' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRefType('textbook')} style={{ flex: 1 }}>📖 교재</button>
                                </div>
                            </div>

                            {refType === 'course' && (
                                <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label className="label">강의 선택 *</label>
                                        <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                                            <option value="">선택하세요</option>
                                            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label className="label">Lecture No</label>
                                            <input className="input" type="number" placeholder="1" value={lectureNo} onChange={(e) => setLectureNo(e.target.value)} min="1" />
                                        </div>
                                        <div>
                                            <label className="label">Part No</label>
                                            <input className="input" type="number" placeholder="1" value={partNo} onChange={(e) => setPartNo(e.target.value)} min="1" />
                                        </div>
                                        <div>
                                            <label className="label">Slide No</label>
                                            <input className="input" type="number" placeholder="15" value={slideNo} onChange={(e) => setSlideNo(e.target.value)} min="1" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {refType === 'textbook' && (
                                <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label className="label">교재 선택 *</label>
                                        <select className="input" value={textbookId} onChange={(e) => setTextbookId(e.target.value)} required>
                                            <option value="">선택하세요</option>
                                            {textbooks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label className="label">챕터</label>
                                            <input className="input" type="number" placeholder="3" value={chapterNo} onChange={(e) => setChapterNo(e.target.value)} min="1" />
                                        </div>
                                        <div>
                                            <label className="label">페이지</label>
                                            <input className="input" type="number" placeholder="42" value={pageNo} onChange={(e) => setPageNo(e.target.value)} min="1" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: '24px' }}>
                                <label className="label">질문 내용 *</label>
                                <textarea className="input" placeholder="이해가 안 되는 부분을 적어주세요..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} required style={{ resize: 'vertical' }} />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>질문 추가</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
