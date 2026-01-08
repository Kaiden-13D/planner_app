import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getAuthUserId, unauthorized } from '@/app/lib/auth';

// GET: 질문 로그 목록 조회
export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return unauthorized();

        const { searchParams } = new URL(request.url);
        const unresolved = searchParams.get('unresolved');

        const questions = await prisma.questionLog.findMany({
            where: {
                userId,
                ...(unresolved === 'true' && { isResolved: false }),
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
}

// POST: 새 질문 생성
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return unauthorized();

        const { courseId, textbookId, lectureNo, partNo, slideNo, chapterNo, pageNo, content } = await request.json();
        if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 });

        const question = await prisma.questionLog.create({
            data: {
                userId,
                courseId: courseId || null,
                textbookId: textbookId || null,
                lectureNo: lectureNo || null,
                partNo: partNo || null,
                slideNo: slideNo || null,
                chapterNo: chapterNo || null,
                pageNo: pageNo || null,
                content,
            },
        });

        return NextResponse.json(question, { status: 201 });
    } catch (error) {
        console.error('Error creating question:', error);
        return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }
}

// PATCH: 질문 수정
export async function PATCH(request: NextRequest) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return unauthorized();

        const { id, content, isResolved } = await request.json();
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

        const question = await prisma.questionLog.update({
            where: { id, userId },
            data: {
                ...(content !== undefined && { content }),
                ...(isResolved !== undefined && { isResolved }),
            },
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error('Error updating question:', error);
        return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }
}

// DELETE: 질문 삭제
export async function DELETE(request: NextRequest) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return unauthorized();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

        await prisma.questionLog.delete({ where: { id, userId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting question:', error);
        return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }
}
