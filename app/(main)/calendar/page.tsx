'use client';

import { useEffect, useState } from 'react';

interface Course {
    id: string;
    name: string;
    color: string | null;
}

interface Textbook {
    id: string;
    name: string;
    color: string | null;
}

interface DailyTask {
    id: string;
    date: string;
    content: string;
    isDone: boolean;
    course: Course | null;
    textbook: Textbook | null;
}

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    tasks: DailyTask[];
}

export default function CalendarPage() {
    const [tasks, setTasks] = useState<DailyTask[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [textbooks, setTextbooks] = useState<Textbook[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [refType, setRefType] = useState<'none' | 'course' | 'textbook'>('none');
    const [courseId, setCourseId] = useState('');
    const [textbookId, setTextbookId] = useState('');

    // 강의 세부 정보
    const [lectureNum, setLectureNum] = useState('');
    const [partNum, setPartNum] = useState('');
    const [lectureAction, setLectureAction] = useState<'watch' | 'review'>('watch');

    // 교재 세부 정보
    const [chapterNum, setChapterNum] = useState('');
    const [pageStart, setPageStart] = useState('');
    const [pageEnd, setPageEnd] = useState('');
    const [bookAction, setBookAction] = useState<'read' | 'review'>('read');

    // 일반 Task
    const [customContent, setCustomContent] = useState('');

    useEffect(() => { fetchData(); }, [currentDate]);

    async function fetchData() {
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 0);

            const [tasksRes, coursesRes, textbooksRes] = await Promise.all([
                fetch(`/api/tasks?start=${start.toISOString()}&end=${end.toISOString()}`),
                fetch('/api/courses'),
                fetch('/api/textbooks'),
            ]);

            setTasks(await tasksRes.json());
            setCourses(await coursesRes.json());
            setTextbooks(await textbooksRes.json());
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
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days: CalendarDay[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const dayTasks = tasks.filter((t) => {
                const taskDate = new Date(t.date);
                return taskDate.toDateString() === date.toDateString();
            });

            days.push({
                date,
                isCurrentMonth: date.getMonth() === month,
                isToday: date.toDateString() === today.toDateString(),
                tasks: dayTasks,
            });
        }

        return days;
    }

    function buildContent(): string {
        if (refType === 'course') {
            const course = courses.find(c => c.id === courseId);
            const actionText = lectureAction === 'watch' ? '시청' : '복습';
            let content = `Lecture ${lectureNum}`;
            if (partNum) content += ` Part ${partNum}`;
            content += ` ${actionText}`;
            return content;
        } else if (refType === 'textbook') {
            const actionText = bookAction === 'read' ? '읽기' : '복습';
            let content = '';
            if (chapterNum) content = `${chapterNum}장 `;
            if (pageStart && pageEnd) {
                content += `(p.${pageStart}-${pageEnd}) `;
            } else if (pageStart) {
                content += `(p.${pageStart}~) `;
            }
            content += actionText;
            return content.trim();
        }
        return customContent;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedDate) return;

        const content = buildContent();
        if (!content.trim()) return;

        try {
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate.toISOString(),
                    content,
                    courseId: refType === 'course' ? courseId : null,
                    textbookId: refType === 'textbook' ? textbookId : null,
                }),
            });
            resetForm();
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    }

    async function toggleTask(task: DailyTask) {
        try {
            await fetch('/api/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: task.id, isDone: !task.isDone }),
            });
            fetchData();
        } catch (error) {
            console.error('Failed to toggle task:', error);
        }
    }

    async function deleteTask(id: string) {
        try {
            await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
            fetchData();
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }

    function resetForm() {
        setRefType('none');
        setCourseId('');
        setTextbookId('');
        setLectureNum('');
        setPartNum('');
        setLectureAction('watch');
        setChapterNum('');
        setPageStart('');
        setPageEnd('');
        setBookAction('read');
        setCustomContent('');
    }

    function openModal(date: Date) {
        setSelectedDate(date);
        setShowModal(true);
    }

    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const calendarDays = getCalendarDays();
    const selectedTasks = selectedDate ? tasks.filter((t) => new Date(t.date).toDateString() === selectedDate.toDateString()) : [];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">📅 캘린더</h1>
                <p className="page-subtitle">날짜별로 Task를 관리하세요</p>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>← 이전</button>
                    <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date())}>오늘</button>
                    <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>다음 →</button>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                    {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                </h2>
                <div style={{ width: '200px' }} />
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>로딩 중...</div>
            ) : (
                <div style={{ display: 'flex', gap: '24px' }}>
                    {/* Calendar Grid */}
                    <div className="card" style={{ flex: 2, padding: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                            {weekDays.map((day, idx) => (
                                <div key={day} style={{ textAlign: 'center', padding: '8px', fontWeight: '600', color: idx === 0 ? 'var(--danger)' : idx === 6 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                            {calendarDays.map((day, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => openModal(day.date)}
                                    style={{
                                        minHeight: '80px',
                                        padding: '8px',
                                        background: day.isToday ? 'rgba(99, 102, 241, 0.15)' : selectedDate?.toDateString() === day.date.toDateString() ? 'rgba(99, 102, 241, 0.1)' : day.isCurrentMonth ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                        borderRadius: '8px',
                                        opacity: day.isCurrentMonth ? 1 : 0.4,
                                        cursor: 'pointer',
                                        border: day.isToday ? '2px solid var(--accent-primary)' : selectedDate?.toDateString() === day.date.toDateString() ? '2px solid var(--accent-secondary)' : '2px solid transparent',
                                    }}
                                >
                                    <div style={{ fontWeight: day.isToday ? '700' : '500', color: day.isToday ? 'var(--accent-primary)' : 'inherit', marginBottom: '4px' }}>
                                        {day.date.getDate()}
                                    </div>
                                    {day.tasks.slice(0, 2).map((task) => (
                                        <div
                                            key={task.id}
                                            style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 4px',
                                                marginBottom: '2px',
                                                borderRadius: '4px',
                                                background: task.course?.color || task.textbook?.color || 'var(--bg-card)',
                                                color: 'white',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                textDecoration: task.isDone ? 'line-through' : 'none',
                                                opacity: task.isDone ? 0.6 : 1,
                                            }}
                                        >
                                            {task.content}
                                        </div>
                                    ))}
                                    {day.tasks.length > 2 && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{day.tasks.length - 2} more</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected Date Panel */}
                    <div className="card" style={{ flex: 1, minWidth: '280px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>
                            📌 {selectedDate ? `${selectedDate.getMonth() + 1}/${selectedDate.getDate()} Tasks` : '날짜를 선택하세요'}
                        </h3>
                        {selectedDate && (
                            <>
                                {selectedTasks.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Task가 없습니다</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                        {selectedTasks.map((task) => (
                                            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px', borderLeft: `3px solid ${task.course?.color || task.textbook?.color || 'var(--border-color)'}` }}>
                                                <input type="checkbox" checked={task.isDone} onChange={() => toggleTask(task)} />
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ textDecoration: task.isDone ? 'line-through' : 'none', color: task.isDone ? 'var(--text-muted)' : 'inherit' }}>{task.content}</span>
                                                    {(task.course || task.textbook) && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {task.course?.name || task.textbook?.name}
                                                        </div>
                                                    )}
                                                </div>
                                                <button className="btn btn-danger btn-sm" onClick={() => deleteTask(task.id)}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowModal(true)}>
                                    + Task 추가
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && selectedDate && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">📌 {selectedDate.getMonth() + 1}/{selectedDate.getDate()} Task 추가</h2>
                            <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {/* Task 유형 선택 */}
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">Task 유형</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button type="button" className={`btn ${refType === 'course' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRefType('course')} style={{ flex: 1 }}>📚 강의</button>
                                    <button type="button" className={`btn ${refType === 'textbook' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRefType('textbook')} style={{ flex: 1 }}>📖 교재</button>
                                    <button type="button" className={`btn ${refType === 'none' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRefType('none')} style={{ flex: 1 }}>✏️ 기타</button>
                                </div>
                            </div>

                            {/* 강의 선택 및 세부 설정 */}
                            {refType === 'course' && (
                                <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label className="label">강의 선택 *</label>
                                        <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                                            <option value="">선택하세요</option>
                                            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label className="label">Lecture 번호 *</label>
                                            <input className="input" type="number" placeholder="1" value={lectureNum} onChange={(e) => setLectureNum(e.target.value)} required min="1" />
                                        </div>
                                        <div>
                                            <label className="label">Part (선택)</label>
                                            <input className="input" type="number" placeholder="없으면 비워두세요" value={partNum} onChange={(e) => setPartNum(e.target.value)} min="1" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">활동</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button type="button" className={`btn btn-sm ${lectureAction === 'watch' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLectureAction('watch')} style={{ flex: 1 }}>📺 시청</button>
                                            <button type="button" className={`btn btn-sm ${lectureAction === 'review' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLectureAction('review')} style={{ flex: 1 }}>🔄 복습</button>
                                        </div>
                                    </div>

                                    {courseId && lectureNum && (
                                        <div style={{ marginTop: '12px', padding: '8px', background: 'var(--bg-card)', borderRadius: '6px' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>미리보기: </span>
                                            <strong>{courses.find(c => c.id === courseId)?.name}</strong> - {buildContent()}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 교재 선택 및 세부 설정 */}
                            {refType === 'textbook' && (
                                <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label className="label">교재 선택 *</label>
                                        <select className="input" value={textbookId} onChange={(e) => setTextbookId(e.target.value)} required>
                                            <option value="">선택하세요</option>
                                            {textbooks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <label className="label">챕터 (선택)</label>
                                        <input className="input" type="number" placeholder="예: 3" value={chapterNum} onChange={(e) => setChapterNum(e.target.value)} min="1" />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label className="label">시작 페이지</label>
                                            <input className="input" type="number" placeholder="예: 50" value={pageStart} onChange={(e) => setPageStart(e.target.value)} min="1" />
                                        </div>
                                        <div>
                                            <label className="label">끝 페이지</label>
                                            <input className="input" type="number" placeholder="예: 75" value={pageEnd} onChange={(e) => setPageEnd(e.target.value)} min="1" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">활동</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button type="button" className={`btn btn-sm ${bookAction === 'read' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setBookAction('read')} style={{ flex: 1 }}>📖 읽기</button>
                                            <button type="button" className={`btn btn-sm ${bookAction === 'review' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setBookAction('review')} style={{ flex: 1 }}>🔄 복습</button>
                                        </div>
                                    </div>

                                    {textbookId && (chapterNum || pageStart) && (
                                        <div style={{ marginTop: '12px', padding: '8px', background: 'var(--bg-card)', borderRadius: '6px' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>미리보기: </span>
                                            <strong>{textbooks.find(t => t.id === textbookId)?.name}</strong> - {buildContent()}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 일반 Task */}
                            {refType === 'none' && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label className="label">Task 내용 *</label>
                                    <input className="input" placeholder="자유롭게 입력하세요" value={customContent} onChange={(e) => setCustomContent(e.target.value)} required autoFocus />
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Task 추가</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
