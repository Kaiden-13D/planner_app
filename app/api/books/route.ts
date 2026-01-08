import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET: 도서/챕터 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const title = searchParams.get('title');

        const books = await prisma.book.findMany({
            where: title ? { title: { contains: title } } : {},
            orderBy: [
                { title: 'asc' },
                { chapterNum: 'asc' },
            ],
        });

        return NextResponse.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
    }
}

// POST: 새 챕터 생성
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, chapterNum, chapterTitle, pageStart, pageEnd } = body;

        if (!title || chapterNum === undefined || pageStart === undefined || pageEnd === undefined) {
            return NextResponse.json(
                { error: 'title, chapterNum, pageStart, and pageEnd are required' },
                { status: 400 }
            );
        }

        const book = await prisma.book.create({
            data: {
                title,
                chapterNum,
                chapterTitle: chapterTitle || null,
                pageStart,
                pageEnd,
            },
        });

        return NextResponse.json(book, { status: 201 });
    } catch (error) {
        console.error('Error creating book chapter:', error);
        return NextResponse.json({ error: 'Failed to create book chapter' }, { status: 500 });
    }
}

// PATCH: 챕터 완료 상태 수정
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, isCompleted, chapterTitle } = body;

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const book = await prisma.book.update({
            where: { id },
            data: {
                ...(isCompleted !== undefined && { isCompleted }),
                ...(chapterTitle !== undefined && { chapterTitle }),
            },
        });

        return NextResponse.json(book);
    } catch (error) {
        console.error('Error updating book:', error);
        return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
    }
}

// DELETE: 챕터 삭제
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await prisma.book.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting book:', error);
        return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
    }
}
