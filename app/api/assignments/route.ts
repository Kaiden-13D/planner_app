import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET: 과제 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject');
        const upcoming = searchParams.get('upcoming');

        const now = new Date();

        const assignments = await prisma.assignment.findMany({
            where: {
                ...(subject && { subject }),
                ...(upcoming === 'true' && { deadlineAt: { gte: now } }),
            },
            include: {
                subtasks: {
                    orderBy: { order: 'asc' },
                },
                questions: true,
            },
            orderBy: { deadlineAt: 'asc' },
        });

        return NextResponse.json(assignments);
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}

// POST: 새 과제 생성 (Subtask 포함)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, subject, deadlineAt, subtasks } = body;

        if (!title || !deadlineAt) {
            return NextResponse.json(
                { error: 'title and deadlineAt are required' },
                { status: 400 }
            );
        }

        const assignment = await prisma.assignment.create({
            data: {
                title,
                subject: subject || null,
                deadlineAt: new Date(deadlineAt),
                subtasks: subtasks && subtasks.length > 0 ? {
                    create: subtasks.map((content: string, index: number) => ({
                        content,
                        order: index,
                    })),
                } : undefined,
            },
            include: {
                subtasks: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        return NextResponse.json(assignment, { status: 201 });
    } catch (error) {
        console.error('Error creating assignment:', error);
        return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }
}

// PATCH: 과제 수정
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, title, subject, deadlineAt } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const assignment = await prisma.assignment.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(subject !== undefined && { subject }),
                ...(deadlineAt !== undefined && { deadlineAt: new Date(deadlineAt) }),
            },
            include: {
                subtasks: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        return NextResponse.json(assignment);
    } catch (error) {
        console.error('Error updating assignment:', error);
        return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
    }
}

// DELETE: 과제 삭제 (Subtasks도 cascade 삭제)
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.assignment.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting assignment:', error);
        return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
    }
}
