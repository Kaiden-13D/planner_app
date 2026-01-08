import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET: 교재 목록 조회
export async function GET() {
    try {
        const textbooks = await prisma.textbook.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { tasks: true } },
            },
        });
        return NextResponse.json(textbooks);
    } catch (error) {
        console.error('Error fetching textbooks:', error);
        return NextResponse.json({ error: 'Failed to fetch textbooks' }, { status: 500 });
    }
}

// POST: 새 교재 등록
export async function POST(request: NextRequest) {
    try {
        const { name, color } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'name is required' }, { status: 400 });
        }

        const textbook = await prisma.textbook.create({
            data: { name, color },
        });

        return NextResponse.json(textbook, { status: 201 });
    } catch (error) {
        console.error('Error creating textbook:', error);
        return NextResponse.json({ error: 'Failed to create textbook' }, { status: 500 });
    }
}

// PATCH: 교재 수정
export async function PATCH(request: NextRequest) {
    try {
        const { id, name, color } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const textbook = await prisma.textbook.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(color !== undefined && { color }),
            },
        });

        return NextResponse.json(textbook);
    } catch (error) {
        console.error('Error updating textbook:', error);
        return NextResponse.json({ error: 'Failed to update textbook' }, { status: 500 });
    }
}

// DELETE: 교재 삭제
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.textbook.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting textbook:', error);
        return NextResponse.json({ error: 'Failed to delete textbook' }, { status: 500 });
    }
}
