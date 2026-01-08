import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export interface DebtData {
    // 미시청 강의 시간 (분)
    unwatchedLectureMinutes: number;
    // 미복습 강의 시간 (분)
    unreviewedLectureMinutes: number;
    // 미독 페이지 수
    unreadPages: number;
    // 마감 지난 과제 수
    overdueAssignments: number;
    // 마감 임박 과제 (24시간 이내)
    urgentAssignments: number;
    // 미해결 질문 수
    unresolvedQuestions: number;
    // 총 부채 점수 (가중치 적용)
    totalDebtScore: number;
    // 세부 항목
    details: {
        unwatchedLectures: { subject: string; lecNum: number; partNum: number | null; duration: number }[];
        unreadBooks: { title: string; chapterNum: number; pages: number }[];
        overdueAssignmentList: { title: string; deadlineAt: Date; progressRate: number }[];
        urgentAssignmentList: { title: string; deadlineAt: Date; progressRate: number }[];
    };
}

// GET: 지식 부채 계산
export async function GET() {
    try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // 미시청 강의 조회
        const unwatchedLectures = await prisma.lecture.findMany({
            where: { isWatched: false },
            select: { subject: true, lecNum: true, partNum: true, duration: true },
        });

        // 미복습 강의 조회 (시청했지만 복습 안함)
        const unreviewedLectures = await prisma.lecture.findMany({
            where: { isWatched: true, isReviewed: false },
            select: { duration: true },
        });

        // 미완료 도서 챕터 조회
        const unreadBooks = await prisma.book.findMany({
            where: { isCompleted: false },
            select: { title: true, chapterNum: true, pageStart: true, pageEnd: true },
        });

        // 마감 지난 과제 조회
        const overdueAssignments = await prisma.assignment.findMany({
            where: {
                deadlineAt: { lt: now },
                progressRate: { lt: 100 },
            },
            select: { title: true, deadlineAt: true, progressRate: true },
        });

        // 마감 임박 과제 조회 (24시간 이내)
        const urgentAssignments = await prisma.assignment.findMany({
            where: {
                deadlineAt: { gte: now, lt: tomorrow },
                progressRate: { lt: 100 },
            },
            select: { title: true, deadlineAt: true, progressRate: true },
        });

        // 미해결 질문 수
        const unresolvedQuestions = await prisma.questionLog.count({
            where: { isResolved: false },
        });

        // 계산
        const unwatchedLectureMinutes = unwatchedLectures.reduce((sum, l) => sum + l.duration, 0);
        const unreviewedLectureMinutes = unreviewedLectures.reduce((sum, l) => sum + l.duration, 0);
        const unreadPages = unreadBooks.reduce((sum, b) => sum + (b.pageEnd - b.pageStart + 1), 0);

        // 부채 점수 계산 (가중치: 마감 지난 과제 = 50점, 임박 = 30점, 강의 1시간 = 10점, 페이지 10개 = 5점, 질문 1개 = 2점)
        const totalDebtScore =
            overdueAssignments.length * 50 +
            urgentAssignments.length * 30 +
            (unwatchedLectureMinutes / 60) * 10 +
            (unreadPages / 10) * 5 +
            unresolvedQuestions * 2;

        const debtData: DebtData = {
            unwatchedLectureMinutes,
            unreviewedLectureMinutes,
            unreadPages,
            overdueAssignments: overdueAssignments.length,
            urgentAssignments: urgentAssignments.length,
            unresolvedQuestions,
            totalDebtScore: Math.round(totalDebtScore),
            details: {
                unwatchedLectures,
                unreadBooks: unreadBooks.map(b => ({
                    title: b.title,
                    chapterNum: b.chapterNum,
                    pages: b.pageEnd - b.pageStart + 1,
                })),
                overdueAssignmentList: overdueAssignments,
                urgentAssignmentList: urgentAssignments,
            },
        };

        return NextResponse.json(debtData);
    } catch (error) {
        console.error('Error calculating debt:', error);
        return NextResponse.json({ error: 'Failed to calculate debt' }, { status: 500 });
    }
}
