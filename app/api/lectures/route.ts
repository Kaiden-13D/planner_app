import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET: 강의 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject');

        const lectures = await prisma.lecture.findMany({
            where: subject ? { subject } : {},
            include: {
                questions: true,
            },
            orderBy: [
                { subject: 'asc' },
                { lecNum: 'asc' },
                { partNum: 'asc' },
            ],
        });

        return NextResponse.json(lectures);
    } catch (error) {
        console.error('Error fetching lectures:', error);
        return NextResponse.json({ error: 'Failed to fetch lectures' }, { status: 500 });
    }
}

// POST: 새 강의 생성 (일괄 등록 지원)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // 일괄 등록: lectures 배열이 있으면 여러 개 생성
        if (Array.isArray(body.lectures)) {
            const lectures = await prisma.lecture.createMany({
                data: body.lectures.map((lec: {
                    subject: string;
                    lecNum: number;
                    partNum?: number;
                    title?: string;
                    duration: number;
                }) => ({
                    subject: lec.subject,
                    lecNum: lec.lecNum,
                    partNum: lec.partNum || null,
                    title: lec.title || null,
                    duration: lec.duration,
                })),
            });
            return NextResponse.json({ count: lectures.count }, { status: 201 });
        }

        // 단일 생성
        const { subject, lecNum, partNum, title, duration } = body;

        if (!subject || lecNum === undefined || !duration) {
            return NextResponse.json(
                { error: 'subject, lecNum, and duration are required' },
                { status: 400 }
            );
        }

        const lecture = await prisma.lecture.create({
            data: {
                subject,
                lecNum,
                partNum: partNum || null,
                title: title || null,
                duration,
            },
        });

        return NextResponse.json(lecture, { status: 201 });
    } catch (error) {
        console.error('Error creating lecture:', error);
        return NextResponse.json({ error: 'Failed to create lecture' }, { status: 500 });
    }
}

// PATCH: 강의 상태 수정 (시청/복습 체크)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, isWatched, isReviewed, title } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const lecture = await prisma.lecture.update({
            where: { id },
            data: {
                ...(isWatched !== undefined && {
                    isWatched,
                    watchedAt: isWatched ? new Date() : null,
                }),
                ...(isReviewed !== undefined && { isReviewed }),
                ...(title !== undefined && { title }),
            },
        });

        return NextResponse.json(lecture);
    } catch (error) {
        console.error('Error updating lecture:', error);
        return NextResponse.json({ error: 'Failed to update lecture' }, { status: 500 });
    }
}

// DELETE: 강의 삭제
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.lecture.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting lecture:', error);
        return NextResponse.json({ error: 'Failed to delete lecture' }, { status: 500 });
    }
}
