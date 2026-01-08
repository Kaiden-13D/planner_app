import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET: 목표 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const periodType = searchParams.get('periodType');
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        let where: Record<string, unknown> = {};

        if (periodType) {
            where.periodType = periodType;
        }

        // 특정 년월의 목표 조회
        if (year && month) {
            const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            where.startDate = { lte: endOfMonth };
            where.endDate = { gte: startOfMonth };
        }

        const goals = await prisma.goal.findMany({
            where,
            include: {
                children: {
                    include: {
                        children: true,
                    },
                },
            },
            orderBy: { startDate: 'asc' },
        });

        return NextResponse.json(goals);
    } catch (error) {
        console.error('Error fetching goals:', error);
        return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }
}

// POST: 새 목표 생성
export async function POST(request: NextRequest) {
    try {
        const { title, periodType, startDate, endDate, parentId } = await request.json();

        if (!title || !periodType || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'title, periodType, startDate, endDate are required' },
                { status: 400 }
            );
        }

        const goal = await prisma.goal.create({
            data: {
                title,
                periodType,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                parentId: parentId || null,
            },
        });

        return NextResponse.json(goal, { status: 201 });
    } catch (error) {
        console.error('Error creating goal:', error);
        return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }
}

// PATCH: 목표 수정
export async function PATCH(request: NextRequest) {
    try {
        const { id, title, status, startDate, endDate } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const goal = await prisma.goal.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(status !== undefined && { status }),
                ...(startDate !== undefined && { startDate: new Date(startDate) }),
                ...(endDate !== undefined && { endDate: new Date(endDate) }),
            },
        });

        return NextResponse.json(goal);
    } catch (error) {
        console.error('Error updating goal:', error);
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }
}

// DELETE: 목표 삭제
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.goal.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting goal:', error);
        return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }
}
