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

interface Goal {
    id: string;
    title: string;
    periodType: 'MONTH' | 'WEEK' | 'DAY';
    startDate: string;
    endDate: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

type Tab = 'MONTH' | 'WEEK' | 'DAY';
type GoalType = 'lecture' | 'textbook' | 'assignment' | 'other';

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
    const [courses, setCourses] = useState<Course[]>([]);
    const [textbooks, setTextbooks] = useState<Textbook[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('MONTH');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);

    // 공통 Form state
    const [goalType, setGoalType] = useState<GoalType>('lecture');

    // ===== 월간: 강의 전체 계획 =====
    const [courseId, setCourseId] = useState('');
    const [totalLectures, setTotalLectures] = useState('');  // 전체 강의 수
    const [monthlyAction, setMonthlyAction] = useState<'complete' | 'partial'>('complete');
    const [monthlyLectureEnd, setMonthlyLectureEnd] = useState('');  // 부분 완강 시

    // ===== 주간: 강의 범위 =====
    const [weeklyLectureStart, setWeeklyLectureStart] = useState('');
    const [weeklyLectureEnd, setWeeklyLectureEnd] = useState('');
    const [weeklyAction, setWeeklyAction] = useState<'watch' | 'review'>('watch');

    // ===== 일간: 개별 강의 =====
    const [dailyLectureNum, setDailyLectureNum] = useState('');
    const [hasParts, setHasParts] = useState(false);
    const [dailyPartNum, setDailyPartNum] = useState('');
    const [duration, setDuration] = useState('');  // 러닝타임 (분)
    const [dailyAction, setDailyAction] = useState<'watch' | 'review'>('watch');

    // ===== 교재 (공통) =====
    const [textbookId, setTextbookId] = useState('');
    const [chapterStart, setChapterStart] = useState('');
    const [chapterEnd, setChapterEnd] = useState('');
    const [pageStart, setPageStart] = useState('');
    const [pageEnd, setPageEnd] = useState('');
    const [bookAction, setBookAction] = useState<'read' | 'review'>('read');

    // ===== 과제 =====
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [relatedCourseId, setRelatedCourseId] = useState('');
    const [deadlineDate, setDeadlineDate] = useState('');
    const [deadlineTime, setDeadlineTime] = useState('23:59');
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

    // ===== 기타 =====
    const [otherContent, setOtherContent] = useState('');

    useEffect(() => { fetchData(); }, [activeTab, currentDate]);

    async function fetchData() {
        try {
            const [goalsRes, coursesRes, textbooksRes] = await Promise.all([
                fetch(`/api/goals?periodType=${activeTab}&year=${currentDate.getFullYear()}&month=${currentDate.getMonth() + 1}`),
                fetch('/api/courses'),
                fetch('/api/textbooks'),
            ]);
            const goalsData = await goalsRes.json();
            setGoals(Array.isArray(goalsData) ? goalsData.filter((g: Goal) => g.periodType === activeTab) : []);
            setCourses(await coursesRes.json());
            setTextbooks(await textbooksRes.json());
        } catch (error) {
            console.error('Failed to fetch data:', error);
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

    function buildGoalTitle(): string {
        const course = courses.find(c => c.id === courseId);
        const textbook = textbooks.find(t => t.id === textbookId);

        if (goalType === 'lecture') {
            if (activeTab === 'MONTH') {
                // 월간: "알고리즘 완강 (총 25강)" 또는 "알고리즘 Lec 1~15 완료"
                if (monthlyAction === 'complete') {
                    return `${course?.name || ''} 완강 (총 ${totalLectures}강)`;
                } else {
                    return `${course?.name || ''} Lec 1~${monthlyLectureEnd} 완료`;
                }
            } else if (activeTab === 'WEEK') {
                // 주간: "알고리즘 Lec 5~8 시청"
                const actionText = weeklyAction === 'watch' ? '시청' : '복습';
                let range = `Lec ${weeklyLectureStart}`;
                if (weeklyLectureEnd && weeklyLectureEnd !== weeklyLectureStart) {
                    range += `~${weeklyLectureEnd}`;
                }
                return `${course?.name || ''} ${range} ${actionText}`;
            } else {
                // 일간: "알고리즘 Lec 5 Part 2 시청 (30분)"
                const actionText = dailyAction === 'watch' ? '시청' : '복습';
                let content = `${course?.name || ''} Lec ${dailyLectureNum}`;
                if (hasParts && dailyPartNum) {
                    content += ` Part ${dailyPartNum}`;
                }
                content += ` ${actionText}`;
                if (duration) {
                    content += ` (${duration}분)`;
                }
                return content;
            }
        } else if (goalType === 'textbook') {
            const actionText = bookAction === 'read' ? '읽기' : '복습';
            let range = '';
            if (chapterStart) {
                range = `${chapterStart}장`;
                if (chapterEnd && chapterEnd !== chapterStart) range += `~${chapterEnd}장`;
            }
            if (pageStart && pageEnd) {
                range += ` (p.${pageStart}-${pageEnd})`;
            }
            return `${textbook?.name || ''} ${range} ${actionText}`.trim();
        } else if (goalType === 'assignment') {
            const relatedCourse = courses.find(c => c.id === relatedCourseId);
            const daysLeft = deadlineDate ? Math.ceil((new Date(deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
            const dDay = daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? 'D-Day' : `D+${Math.abs(daysLeft)}`;
            const priorityEmoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
            return `${priorityEmoji} ${assignmentTitle}${relatedCourse ? ` (${relatedCourse.name})` : ''} [${dDay}]`;
        }
        return otherContent;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const { start, end } = getDateRange();
        const title = buildGoalTitle();
        if (!title.trim()) return;

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
            resetForm();
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create goal:', error);
        }
    }

    function resetForm() {
        setGoalType('lecture');
        setCourseId('');
        setTotalLectures('');
        setMonthlyAction('complete');
        setMonthlyLectureEnd('');
        setWeeklyLectureStart('');
        setWeeklyLectureEnd('');
        setWeeklyAction('watch');
        setDailyLectureNum('');
        setHasParts(false);
        setDailyPartNum('');
        setDuration('');
        setDailyAction('watch');
        setTextbookId('');
        setChapterStart('');
        setChapterEnd('');
        setPageStart('');
        setPageEnd('');
        setBookAction('read');
        setAssignmentTitle('');
        setRelatedCourseId('');
        setDeadlineDate('');
        setDeadlineTime('23:59');
        setPriority('medium');
        setOtherContent('');
    }

    async function toggleStatus(goal: Goal) {
        const nextStatus = goal.status === 'TODO' ? 'IN_PROGRESS' : goal.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
        try {
            await fetch('/api/goals', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: goal.id, status: nextStatus }),
            });
            fetchData();
        } catch (error) {
            console.error('Failed to update goal:', error);
        }
    }

    async function deleteGoal(id: string) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
            fetchData();
        } catch (error) {
            console.error('Failed to delete goal:', error);
        }
    }

    function navigate(delta: number) {
        const newDate = new Date(currentDate);
        if (activeTab === 'MONTH') newDate.setMonth(newDate.getMonth() + delta);
        else if (activeTab === 'WEEK') newDate.setDate(newDate.getDate() + delta * 7);
        else newDate.setDate(newDate.getDate() + delta);
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

    // 강의 폼 유효성 체크
    const isLectureValid = () => {
        if (activeTab === 'MONTH') return courseId && totalLectures;
        if (activeTab === 'WEEK') return courseId && weeklyLectureStart;
        return courseId && dailyLectureNum;
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">🎯 목표 관리</h1>
                <p className="page-subtitle">월간, 주간, 일간 목표를 설정하세요</p>
            </div>

            {/* 탭 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {(['MONTH', 'WEEK', 'DAY'] as Tab[]).map((tab) => (
                    <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(tab)}>
                        {tab === 'MONTH' ? '📅 월간' : tab === 'WEEK' ? '📆 주간' : '📌 일간'}
                    </button>
                ))}
            </div>

            {/* 플래너 카드 */}
            <div className="card" style={{ border: '2px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', background: 'linear-gradient(to bottom, var(--bg-card), var(--bg-secondary))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← 이전</button>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{getPeriodTitle()}</h2>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(1)}>다음 →</button>
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>로딩 중...</p>
                ) : goals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}><p style={{ color: 'var(--text-muted)' }}>아직 목표가 없습니다</p></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {goals.map((goal) => (
                            <div key={goal.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: '8px', borderLeft: `4px solid ${statusColor[goal.status]}` }}>
                                <span onClick={() => toggleStatus(goal)} style={{ fontSize: '1.25rem', cursor: 'pointer' }}>{statusEmoji[goal.status]}</span>
                                <span style={{ flex: 1, textDecoration: goal.status === 'DONE' ? 'line-through' : 'none', color: goal.status === 'DONE' ? 'var(--text-muted)' : 'inherit' }}>{goal.title}</span>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteGoal(goal.id)}>×</button>
                            </div>
                        ))}
                    </div>
                )}

                <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setShowModal(true)}>+ 목표 추가</button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">✨ {getPeriodTitle().replace(/📅|📆|📌/, '')} 추가</h2>
                            <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {/* 목표 유형 */}
                            <div style={{ marginBottom: '16px' }}>
                                <label className="label">목표 유형</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                    <button type="button" className={`btn ${goalType === 'lecture' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGoalType('lecture')}>📚 강의</button>
                                    <button type="button" className={`btn ${goalType === 'textbook' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGoalType('textbook')}>📖 교재</button>
                                    <button type="button" className={`btn ${goalType === 'assignment' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGoalType('assignment')}>📝 과제</button>
                                    <button type="button" className={`btn ${goalType === 'other' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGoalType('other')}>✏️ 기타</button>
                                </div>
                            </div>

                            {/* 강의 Form - 기간별로 다름 */}
                            {goalType === 'lecture' && (
                                <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label className="label">강의 선택 *</label>
                                        <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                                            <option value="">선택하세요</option>
                                            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    {/* 월간: 전체 강의 수 + 완강/부분 */}
                                    {activeTab === 'MONTH' && (
                                        <>
                                            <div style={{ marginBottom: '12px' }}>
                                                <label className="label">전체 강의 수 (해당 강의의 총 Lecture 수) *</label>
                                                <input className="input" type="number" placeholder="예: 25" value={totalLectures} onChange={(e) => setTotalLectures(e.target.value)} required min="1" />
                                            </div>
                                            <div style={{ marginBottom: '12px' }}>
                                                <label className="label">목표</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button type="button" className={`btn btn-sm ${monthlyAction === 'complete' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMonthlyAction('complete')} style={{ flex: 1 }}>🎯 완강</button>
                                                    <button type="button" className={`btn btn-sm ${monthlyAction === 'partial' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMonthlyAction('partial')} style={{ flex: 1 }}>📊 일부</button>
                                                </div>
                                            </div>
                                            {monthlyAction === 'partial' && (
                                                <div>
                                                    <label className="label">몇 강까지? (Lec 1 ~ ?)</label>
                                                    <input className="input" type="number" placeholder="예: 15" value={monthlyLectureEnd} onChange={(e) => setMonthlyLectureEnd(e.target.value)} min="1" max={totalLectures || undefined} required />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* 주간: 범위 선택 */}
                                    {activeTab === 'WEEK' && (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                                <div>
                                                    <label className="label">시작 Lec# *</label>
                                                    <input className="input" type="number" placeholder="1" value={weeklyLectureStart} onChange={(e) => setWeeklyLectureStart(e.target.value)} required min="1" />
                                                </div>
                                                <div>
                                                    <label className="label">끝 Lec# (하나면 비워두세요)</label>
                                                    <input className="input" type="number" placeholder="" value={weeklyLectureEnd} onChange={(e) => setWeeklyLectureEnd(e.target.value)} min="1" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="label">활동</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button type="button" className={`btn btn-sm ${weeklyAction === 'watch' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setWeeklyAction('watch')} style={{ flex: 1 }}>📺 시청</button>
                                                    <button type="button" className={`btn btn-sm ${weeklyAction === 'review' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setWeeklyAction('review')} style={{ flex: 1 }}>🔄 복습</button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* 일간: 개별 강의 + 파트 + 러닝타임 */}
                                    {activeTab === 'DAY' && (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                                <div>
                                                    <label className="label">Lecture 번호 *</label>
                                                    <input className="input" type="number" placeholder="1" value={dailyLectureNum} onChange={(e) => setDailyLectureNum(e.target.value)} required min="1" />
                                                </div>
                                                <div>
                                                    <label className="label">러닝타임 (분)</label>
                                                    <input className="input" type="number" placeholder="30" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" />
                                                </div>
                                            </div>
                                            <div style={{ marginBottom: '12px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={hasParts} onChange={(e) => { setHasParts(e.target.checked); if (!e.target.checked) setDailyPartNum(''); }} />
                                                    <span className="label" style={{ margin: 0 }}>파트가 있음 (Part 구분)</span>
                                                </label>
                                            </div>
                                            {hasParts && (
                                                <div style={{ marginBottom: '12px' }}>
                                                    <label className="label">Part 번호</label>
                                                    <input className="input" type="number" placeholder="1" value={dailyPartNum} onChange={(e) => setDailyPartNum(e.target.value)} min="1" />
                                                </div>
                                            )}
                                            <div>
                                                <label className="label">활동</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button type="button" className={`btn btn-sm ${dailyAction === 'watch' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDailyAction('watch')} style={{ flex: 1 }}>📺 시청</button>
                                                    <button type="button" className={`btn btn-sm ${dailyAction === 'review' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDailyAction('review')} style={{ flex: 1 }}>🔄 복습</button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {isLectureValid() && (
                                        <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid var(--accent-primary)' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>미리보기: </span>
                                            <strong>{buildGoalTitle()}</strong>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 교재 Form (동일) */}
                            {goalType === 'textbook' && (
                                <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label className="label">교재 선택 *</label>
                                        <select className="input" value={textbookId} onChange={(e) => setTextbookId(e.target.value)} required>
                                            <option value="">선택하세요</option>
                                            {textbooks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div><label className="label">시작 챕터</label><input className="input" type="number" placeholder="1" value={chapterStart} onChange={(e) => setChapterStart(e.target.value)} min="1" /></div>
                                        <div><label className="label">끝 챕터</label><input className="input" type="number" placeholder="" value={chapterEnd} onChange={(e) => setChapterEnd(e.target.value)} min="1" /></div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div><label className="label">시작 페이지</label><input className="input" type="number" placeholder="1" value={pageStart} onChange={(e) => setPageStart(e.target.value)} min="1" /></div>
                                        <div><label className="label">끝 페이지</label><input className="input" type="number" placeholder="50" value={pageEnd} onChange={(e) => setPageEnd(e.target.value)} min="1" /></div>
                                    </div>
                                    <div>
                                        <label className="label">활동</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button type="button" className={`btn btn-sm ${bookAction === 'read' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setBookAction('read')} style={{ flex: 1 }}>📖 읽기</button>
                                            <button type="button" className={`btn btn-sm ${bookAction === 'review' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setBookAction('review')} style={{ flex: 1 }}>🔄 복습</button>
                                        </div>
                                    </div>
                                    {textbookId && (chapterStart || pageStart) && (
                                        <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid var(--accent-secondary)' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>미리보기: </span><strong>{buildGoalTitle()}</strong>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 과제 Form */}
                            {goalType === 'assignment' && (
                                <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <div style={{ marginBottom: '12px' }}><label className="label">과제명 *</label><input className="input" placeholder="예: HW1 - Policy Gradient 구현" value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} required /></div>
                                    <div style={{ marginBottom: '12px' }}><label className="label">관련 강의 (선택)</label><select className="input" value={relatedCourseId} onChange={(e) => setRelatedCourseId(e.target.value)}><option value="">없음</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div><label className="label">마감 일시 *</label><input className="input" type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} required /></div>
                                        <div><label className="label">시간</label><input className="input" type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} /></div>
                                    </div>
                                    <div><label className="label">우선순위</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button type="button" className={`btn btn-sm ${priority === 'high' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPriority('high')} style={{ flex: 1 }}>🔴 높음</button>
                                            <button type="button" className={`btn btn-sm ${priority === 'medium' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPriority('medium')} style={{ flex: 1 }}>🟡 보통</button>
                                            <button type="button" className={`btn btn-sm ${priority === 'low' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPriority('low')} style={{ flex: 1 }}>🟢 낮음</button>
                                        </div>
                                    </div>
                                    {assignmentTitle && deadlineDate && (
                                        <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-card)', borderRadius: '6px', borderLeft: '3px solid var(--warning)' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>미리보기: </span><strong>{buildGoalTitle()}</strong>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 기타 */}
                            {goalType === 'other' && (
                                <div style={{ marginBottom: '16px' }}><label className="label">목표 내용 *</label><textarea className="input" placeholder="자유롭게 입력하세요" value={otherContent} onChange={(e) => setOtherContent(e.target.value)} rows={3} required style={{ resize: 'vertical' }} /></div>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>목표 추가</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
