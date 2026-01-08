'use client';

import { useEffect, useState } from 'react';

interface Lecture {
    id: string;
    subject: string;
    lecNum: number;
    partNum: number | null;
    title: string | null;
    duration: number;
    isWatched: boolean;
    isReviewed: boolean;
}

export default function LecturesPage() {
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);

    // Form state
    const [subject, setSubject] = useState('');
    const [lecNum, setLecNum] = useState('');
    const [partNum, setPartNum] = useState('');
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');

    // Batch form state
    const [batchSubject, setBatchSubject] = useState('');
    const [batchLecNum, setBatchLecNum] = useState('');
    const [batchStartPart, setBatchStartPart] = useState('1');
    const [batchEndPart, setBatchEndPart] = useState('4');
    const [batchDuration, setBatchDuration] = useState('20');

    useEffect(() => {
        fetchLectures();
    }, []);

    async function fetchLectures() {
        try {
            const res = await fetch('/api/lectures');
            const data = await res.json();
            setLectures(data);
        } catch (error) {
            console.error('Failed to fetch lectures:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await fetch('/api/lectures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    lecNum: parseInt(lecNum),
                    partNum: partNum ? parseInt(partNum) : null,
                    title: title || null,
                    duration: parseInt(duration),
                }),
            });
            setShowModal(false);
            resetForm();
            fetchLectures();
        } catch (error) {
            console.error('Failed to create lecture:', error);
        }
    }

    async function handleBatchSubmit(e: React.FormEvent) {
        e.preventDefault();
        const startP = parseInt(batchStartPart);
        const endP = parseInt(batchEndPart);
        const lectures = [];

        for (let p = startP; p <= endP; p++) {
            lectures.push({
                subject: batchSubject,
                lecNum: parseInt(batchLecNum),
                partNum: p,
                duration: parseInt(batchDuration),
            });
        }

        try {
            await fetch('/api/lectures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lectures }),
            });
            setShowBatchModal(false);
            resetBatchForm();
            fetchLectures();
        } catch (error) {
            console.error('Failed to create batch lectures:', error);
        }
    }

    async function toggleWatched(lecture: Lecture) {
        try {
            await fetch('/api/lectures', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: lecture.id,
                    isWatched: !lecture.isWatched,
                }),
            });
            fetchLectures();
        } catch (error) {
            console.error('Failed to update lecture:', error);
        }
    }

    async function toggleReviewed(lecture: Lecture) {
        try {
            await fetch('/api/lectures', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: lecture.id,
                    isReviewed: !lecture.isReviewed,
                }),
            });
            fetchLectures();
        } catch (error) {
            console.error('Failed to update lecture:', error);
        }
    }

    async function deleteLecture(id: string) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await fetch(`/api/lectures?id=${id}`, { method: 'DELETE' });
            fetchLectures();
        } catch (error) {
            console.error('Failed to delete lecture:', error);
        }
    }

    function resetForm() {
        setSubject('');
        setLecNum('');
        setPartNum('');
        setTitle('');
        setDuration('');
    }

    function resetBatchForm() {
        setBatchSubject('');
        setBatchLecNum('');
        setBatchStartPart('1');
        setBatchEndPart('4');
        setBatchDuration('20');
    }

    // Group lectures by subject
    const groupedLectures = lectures.reduce((acc, lec) => {
        if (!acc[lec.subject]) acc[lec.subject] = [];
        acc[lec.subject].push(lec);
        return acc;
    }, {} as Record<string, Lecture[]>);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">강의 관리</h1>
                <p className="page-subtitle">강의 시청 및 복습 현황을 관리하세요</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + 강의 추가
                </button>
                <button className="btn btn-secondary" onClick={() => setShowBatchModal(true)}>
                    📦 일괄 등록
                </button>
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
                </div>
            ) : Object.keys(groupedLectures).length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '16px' }}>🎬</p>
                    <p style={{ color: 'var(--text-secondary)' }}>등록된 강의가 없습니다</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        위 버튼을 눌러 강의를 추가하세요
                    </p>
                </div>
            ) : (
                Object.entries(groupedLectures).map(([subjectName, subjectLectures]) => (
                    <div key={subjectName} className="card" style={{ marginBottom: '16px' }}>
                        <div className="card-header">
                            <span className="card-title">📚 {subjectName}</span>
                            <span className="badge badge-success">
                                {subjectLectures.filter(l => l.isWatched).length}/{subjectLectures.length} 시청
                            </span>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Lec #</th>
                                        <th>Part</th>
                                        <th>제목</th>
                                        <th>시간</th>
                                        <th>시청</th>
                                        <th>복습</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjectLectures.map((lec) => (
                                        <tr key={lec.id}>
                                            <td>{lec.lecNum}</td>
                                            <td>{lec.partNum || '-'}</td>
                                            <td>{lec.title || '-'}</td>
                                            <td>{lec.duration}분</td>
                                            <td>
                                                <button
                                                    className={`btn btn-sm ${lec.isWatched ? 'btn-primary' : 'btn-secondary'}`}
                                                    onClick={() => toggleWatched(lec)}
                                                >
                                                    {lec.isWatched ? '✓ 완료' : '시청'}
                                                </button>
                                            </td>
                                            <td>
                                                <button
                                                    className={`btn btn-sm ${lec.isReviewed ? 'btn-primary' : 'btn-secondary'}`}
                                                    onClick={() => toggleReviewed(lec)}
                                                    disabled={!lec.isWatched}
                                                >
                                                    {lec.isReviewed ? '✓ 완료' : '복습'}
                                                </button>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => deleteLecture(lec.id)}
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}

            {/* Single Add Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">강의 추가</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">과목명 *</label>
                                <input
                                    className="input"
                                    placeholder="예: 알고리즘, 미적분학"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label className="label">Lecture # *</label>
                                    <input
                                        className="input"
                                        type="number"
                                        placeholder="1"
                                        value={lecNum}
                                        onChange={(e) => setLecNum(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Part # (선택)</label>
                                    <input
                                        className="input"
                                        type="number"
                                        placeholder="1"
                                        value={partNum}
                                        onChange={(e) => setPartNum(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">제목 (선택)</label>
                                <input
                                    className="input"
                                    placeholder="예: 강의 소개"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label className="label">러닝타임 (분) *</label>
                                <input
                                    className="input"
                                    type="number"
                                    placeholder="20"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                추가하기
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Batch Add Modal */}
            {showBatchModal && (
                <div className="modal-overlay" onClick={() => setShowBatchModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">📦 일괄 등록</h2>
                            <button className="modal-close" onClick={() => setShowBatchModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleBatchSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">과목명 *</label>
                                <input
                                    className="input"
                                    placeholder="예: 알고리즘"
                                    value={batchSubject}
                                    onChange={(e) => setBatchSubject(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">Lecture # *</label>
                                <input
                                    className="input"
                                    type="number"
                                    placeholder="1"
                                    value={batchLecNum}
                                    onChange={(e) => setBatchLecNum(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label className="label">시작 Part #</label>
                                    <input
                                        className="input"
                                        type="number"
                                        value={batchStartPart}
                                        onChange={(e) => setBatchStartPart(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">종료 Part #</label>
                                    <input
                                        className="input"
                                        type="number"
                                        value={batchEndPart}
                                        onChange={(e) => setBatchEndPart(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label className="label">각 파트 러닝타임 (분)</label>
                                <input
                                    className="input"
                                    type="number"
                                    value={batchDuration}
                                    onChange={(e) => setBatchDuration(e.target.value)}
                                    required
                                />
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                                💡 Lec {batchLecNum || '#'}의 Part {batchStartPart} ~ {batchEndPart} ({parseInt(batchEndPart) - parseInt(batchStartPart) + 1}개)가 생성됩니다
                            </p>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                일괄 추가하기
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
