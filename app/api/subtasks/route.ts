import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// 진도율 업데이트 헬퍼 함수
async function updateAssignmentProgress(assignmentId: string) {
    const subtasks = await prisma.subtask.findMany({
        where: { assignmentId },
    });

    if (subtasks.length === 0) return;

    const completedCount = subtasks.filter(s => s.isDone).length;
    const progressRate = Math.round((completedCount / subtasks.length) * 100);

    await prisma.assignment.update({
        where: { id: assignmentId },
        data: { progressRate },
    });
}

// GET: Subtask 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get('assignmentId');

        if (!assignmentId) {
            return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
        }

        const subtasks = await prisma.subtask.findMany({
            where: { assignmentId },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json(subtasks);
    } catch (error) {
        console.error('Error fetching subtasks:', error);
        return NextResponse.json({ error: 'Failed to fetch subtasks' }, { status: 500 });
    }
}

// POST: 새 Subtask 추가
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { assignmentId, content } = body;

        if (!assignmentId || !content) {
            return NextResponse.json(
                { error: 'assignmentId and content are required' },
                { status: 400 }
            );
        }

        // 현재 최대 order 가져오기
        const maxOrder = await prisma.subtask.findFirst({
            where: { assignmentId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const subtask = await prisma.subtask.create({
            data: {
                assignmentId,
                content,
                order: (maxOrder?.order ?? -1) + 1,
            },
        });

        // 진도율 업데이트
        await updateAssignmentProgress(assignmentId);

        return NextResponse.json(subtask, { status: 201 });
    } catch (error) {
        console.error('Error creating subtask:', error);
        return NextResponse.json({ error: 'Failed to create subtask' }, { status: 500 });
    }
}

// PATCH: Subtask 완료 상태 토글
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, isDone, content } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const subtask = await prisma.subtask.update({
            where: { id },
            data: {
                ...(isDone !== undefined && { isDone }),
                ...(content !== undefined && { content }),
            },
        });

        // 진도율 업데이트
        await updateAssignmentProgress(subtask.assignmentId);

        // 업데이트된 과제 정보 반환
        const assignment = await prisma.assignment.findUnique({
            where: { id: subtask.assignmentId },
            include: {
                subtasks: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        return NextResponse.json({ subtask, assignment });
    } catch (error) {
        console.error('Error updating subtask:', error);
        return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
    }
}

// DELETE: Subtask 삭제
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const subtask = await prisma.subtask.findUnique({
            where: { id },
            select: { assignmentId: true },
        });

        await prisma.subtask.delete({
            where: { id },
        });

        // 진도율 업데이트
        if (subtask) {
            await updateAssignmentProgress(subtask.assignmentId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting subtask:', error);
        return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
    }
}
