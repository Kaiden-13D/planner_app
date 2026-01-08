import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { PeriodType, GoalStatus } from '@prisma/client';

// GET: 목표 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const periodType = searchParams.get('periodType') as PeriodType | null;
        const parentId = searchParams.get('parentId');

        const goals = await prisma.goal.findMany({
            where: {
                ...(periodType && { periodType }),
                ...(parentId && { parentId }),
            },
            include: {
                children: true,
                parent: true,
            },
            orderBy: { createdAt: 'desc' },
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
        const body = await request.json();
        const { title, periodType, parentId, targetDate } = body;

        if (!title || !periodType) {
            return NextResponse.json(
                { error: 'title and periodType are required' },
                { status: 400 }
            );
        }

        const goal = await prisma.goal.create({
            data: {
                title,
                periodType: periodType as PeriodType,
                parentId: parentId || null,
                targetDate: targetDate ? new Date(targetDate) : null,
                status: GoalStatus.TODO,
            },
            include: {
                children: true,
                parent: true,
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
        const body = await request.json();
        const { id, title, status, targetDate } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const goal = await prisma.goal.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(status && { status: status as GoalStatus }),
                ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
            },
            include: {
                children: true,
                parent: true,
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

        await prisma.goal.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting goal:', error);
        return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
    }
}
