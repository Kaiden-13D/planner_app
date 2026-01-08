import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

type RefType = 'LECTURE' | 'ASSIGNMENT';

// GET: 질문 로그 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const refType = searchParams.get('refType') as RefType | null;
        const lectureId = searchParams.get('lectureId');
        const assignmentId = searchParams.get('assignmentId');
        const unresolved = searchParams.get('unresolved');

        const questions = await prisma.questionLog.findMany({
            where: {
                ...(refType && { refType }),
                ...(lectureId && { lectureId }),
                ...(assignmentId && { assignmentId }),
                ...(unresolved === 'true' && { isResolved: false }),
            },
            include: {
                lecture: true,
                assignment: true,
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
        const body = await request.json();
        const { refType, lectureId, assignmentId, slideNum, content } = body;

        if (!refType || !content) {
            return NextResponse.json(
                { error: 'refType and content are required' },
                { status: 400 }
            );
        }

        if (refType === 'LECTURE' && !lectureId) {
            return NextResponse.json(
                { error: 'lectureId is required for LECTURE type' },
                { status: 400 }
            );
        }

        if (refType === 'ASSIGNMENT' && !assignmentId) {
            return NextResponse.json(
                { error: 'assignmentId is required for ASSIGNMENT type' },
                { status: 400 }
            );
        }

        const question = await prisma.questionLog.create({
            data: {
                refType: refType as RefType,
                lectureId: lectureId || null,
                assignmentId: assignmentId || null,
                slideNum: slideNum || null,
                content,
            },
            include: {
                lecture: true,
                assignment: true,
            },
        });

        return NextResponse.json(question, { status: 201 });
    } catch (error) {
        console.error('Error creating question:', error);
        return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }
}

// PATCH: 질문 해결 상태 수정
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, isResolved, content } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const question = await prisma.questionLog.update({
            where: { id },
            data: {
                ...(isResolved !== undefined && { isResolved }),
                ...(content !== undefined && { content }),
            },
            include: {
                lecture: true,
                assignment: true,
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
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.questionLog.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting question:', error);
        return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }
}
