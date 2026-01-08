'use client';

import { useEffect, useState } from 'react';

interface Book {
    id: string;
    title: string;
    chapterNum: number;
    chapterTitle: string | null;
    pageStart: number;
    pageEnd: number;
    isCompleted: boolean;
}

export default function BooksPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [chapterNum, setChapterNum] = useState('');
    const [chapterTitle, setChapterTitle] = useState('');
    const [pageStart, setPageStart] = useState('');
    const [pageEnd, setPageEnd] = useState('');

    useEffect(() => {
        fetchBooks();
    }, []);

    async function fetchBooks() {
        try {
            const res = await fetch('/api/books');
            const data = await res.json();
            setBooks(data);
        } catch (error) {
            console.error('Failed to fetch books:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    chapterNum: parseInt(chapterNum),
                    chapterTitle: chapterTitle || null,
                    pageStart: parseInt(pageStart),
                    pageEnd: parseInt(pageEnd),
                }),
            });
            setShowModal(false);
            resetForm();
            fetchBooks();
        } catch (error) {
            console.error('Failed to create book chapter:', error);
        }
    }

    async function toggleCompleted(book: Book) {
        try {
            await fetch('/api/books', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: book.id,
                    isCompleted: !book.isCompleted,
                }),
            });
            fetchBooks();
        } catch (error) {
            console.error('Failed to update book:', error);
        }
    }

    async function deleteBook(id: string) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await fetch(`/api/books?id=${id}`, { method: 'DELETE' });
            fetchBooks();
        } catch (error) {
            console.error('Failed to delete book:', error);
        }
    }

    function resetForm() {
        setTitle('');
        setChapterNum('');
        setChapterTitle('');
        setPageStart('');
        setPageEnd('');
    }

    // Group by book title
    const groupedBooks = books.reduce((acc, book) => {
        if (!acc[book.title]) acc[book.title] = [];
        acc[book.title].push(book);
        return acc;
    }, {} as Record<string, Book[]>);

    // Calculate stats per book
    function getBookStats(chapters: Book[]) {
        const totalPages = chapters.reduce((sum, c) => sum + (c.pageEnd - c.pageStart + 1), 0);
        const completedPages = chapters
            .filter(c => c.isCompleted)
            .reduce((sum, c) => sum + (c.pageEnd - c.pageStart + 1), 0);
        const completedChapters = chapters.filter(c => c.isCompleted).length;
        return { totalPages, completedPages, completedChapters, totalChapters: chapters.length };
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">도서 관리</h1>
                <p className="page-subtitle">챕터별 학습 진도를 관리하세요</p>
            </div>

            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginBottom: '24px' }}>
                + 챕터 추가
            </button>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>로딩 중...</p>
                </div>
            ) : Object.keys(groupedBooks).length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '16px' }}>📚</p>
                    <p style={{ color: 'var(--text-secondary)' }}>등록된 도서가 없습니다</p>
                </div>
            ) : (
                Object.entries(groupedBooks).map(([bookTitle, chapters]) => {
                    const stats = getBookStats(chapters);
                    const progress = Math.round((stats.completedPages / stats.totalPages) * 100);

                    return (
                        <div key={bookTitle} className="card" style={{ marginBottom: '16px' }}>
                            <div className="card-header">
                                <div>
                                    <span className="card-title">📖 {bookTitle}</span>
                                    <span style={{ marginLeft: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        ({stats.completedChapters}/{stats.totalChapters} 챕터)
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        {stats.completedPages}/{stats.totalPages}p
                                    </span>
                                    <span className={`badge ${progress === 100 ? 'badge-success' : progress > 50 ? 'badge-warning' : 'badge-danger'}`}>
                                        {progress}%
                                    </span>
                                </div>
                            </div>

                            <div className="progress-bar" style={{ height: '6px', marginBottom: '16px' }}>
                                <div
                                    className={`progress-fill ${progress === 100 ? 'safe' : progress > 50 ? 'warning' : 'danger'}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Ch #</th>
                                            <th>챕터 제목</th>
                                            <th>페이지</th>
                                            <th>상태</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chapters.map((chapter) => (
                                            <tr key={chapter.id} style={{ opacity: chapter.isCompleted ? 0.6 : 1 }}>
                                                <td>{chapter.chapterNum}</td>
                                                <td style={{ textDecoration: chapter.isCompleted ? 'line-through' : 'none' }}>
                                                    {chapter.chapterTitle || '-'}
                                                </td>
                                                <td>{chapter.pageStart} - {chapter.pageEnd} ({chapter.pageEnd - chapter.pageStart + 1}p)</td>
                                                <td>
                                                    <button
                                                        className={`btn btn-sm ${chapter.isCompleted ? 'btn-primary' : 'btn-secondary'}`}
                                                        onClick={() => toggleCompleted(chapter)}
                                                    >
                                                        {chapter.isCompleted ? '✓ 완료' : '읽기'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => deleteBook(chapter.id)}
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
                    );
                })
            )}

            {/* Add Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">챕터 추가</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">도서명 *</label>
                                <input
                                    className="input"
                                    placeholder="예: 클린 코드, 알고리즘 이론"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label className="label">챕터 # *</label>
                                    <input
                                        className="input"
                                        type="number"
                                        placeholder="1"
                                        value={chapterNum}
                                        onChange={(e) => setChapterNum(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">챕터 제목</label>
                                    <input
                                        className="input"
                                        placeholder="예: 소개"
                                        value={chapterTitle}
                                        onChange={(e) => setChapterTitle(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div>
                                    <label className="label">시작 페이지 *</label>
                                    <input
                                        className="input"
                                        type="number"
                                        placeholder="1"
                                        value={pageStart}
                                        onChange={(e) => setPageStart(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">끝 페이지 *</label>
                                    <input
                                        className="input"
                                        type="number"
                                        placeholder="30"
                                        value={pageEnd}
                                        onChange={(e) => setPageEnd(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                챕터 추가하기
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
