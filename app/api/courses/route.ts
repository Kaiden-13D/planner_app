import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getAuthUserId, unauthorized } from '@/app/lib/auth';

// GET: 강의 목록 조회
export async function GET() {
    try {
        const userId = await getAuthUserId();
        if (!userId) return unauthorized();

        const courses = await prisma.course.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { tasks: true } } },
        });
        return NextResponse.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

// POST: 새 강의 등록
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return unauthorized();

        const { name, color } = await request.json();
        if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

        const course = await prisma.course.create({
            data: { userId, name, color },
        });
        return NextResponse.json(course, { status: 201 });
    } catch (error) {
        console.error('Error creating course:', error);
        return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }
}

// PATCH: 강의 수정
export async function PATCH(request: NextRequest) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return unauthorized();

        const { id, name, color } = await request.json();
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

        const course = await prisma.course.update({
            where: { id, userId },
            data: { ...(name !== undefined && { name }), ...(color !== undefined && { color }) },
        });
        return NextResponse.json(course);
    } catch (error) {
        console.error('Error updating course:', error);
        return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
    }
}

// DELETE: 강의 삭제
export async function DELETE(request: NextRequest) {
    try {
        const userId = await getAuthUserId();
        if (!userId) return unauthorized();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

        await prisma.course.delete({ where: { id, userId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting course:', error);
        return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }
}
