import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET: 일일 Task 조회 (날짜 범위)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');
        const startStr = searchParams.get('start');
        const endStr = searchParams.get('end');

        let where = {};

        if (dateStr) {
            // 특정 날짜
            const date = new Date(dateStr);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            where = {
                date: { gte: date, lt: nextDay },
            };
        } else if (startStr && endStr) {
            // 날짜 범위
            where = {
                date: { gte: new Date(startStr), lte: new Date(endStr) },
            };
        }

        const tasks = await prisma.dailyTask.findMany({
            where,
            include: {
                course: true,
                textbook: true,
            },
            orderBy: [{ date: 'asc' }, { order: 'asc' }],
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

// POST: 새 Task 생성
export async function POST(request: NextRequest) {
    try {
        const { date, courseId, textbookId, content } = await request.json();

        if (!date || !content) {
            return NextResponse.json({ error: 'date and content are required' }, { status: 400 });
        }

        // 해당 날짜의 마지막 order 값 조회
        const lastTask = await prisma.dailyTask.findFirst({
            where: {
                date: {
                    gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                    lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
                }
            },
            orderBy: { order: 'desc' },
        });

        const task = await prisma.dailyTask.create({
            data: {
                date: new Date(date),
                courseId: courseId || null,
                textbookId: textbookId || null,
                content,
                order: (lastTask?.order || 0) + 1,
            },
            include: {
                course: true,
                textbook: true,
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}

// PATCH: Task 수정 (완료 토글 등)
export async function PATCH(request: NextRequest) {
    try {
        const { id, content, isDone, courseId, textbookId } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const task = await prisma.dailyTask.update({
            where: { id },
            data: {
                ...(content !== undefined && { content }),
                ...(isDone !== undefined && { isDone }),
                ...(courseId !== undefined && { courseId }),
                ...(textbookId !== undefined && { textbookId }),
            },
            include: {
                course: true,
                textbook: true,
            },
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

// DELETE: Task 삭제
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.dailyTask.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
