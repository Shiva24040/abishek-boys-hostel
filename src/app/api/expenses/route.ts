import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {};
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const categorySummary: { [key: string]: number } = {};
    expenses.forEach((e) => {
      categorySummary[e.category] = (categorySummary[e.category] || 0) + e.amount;
    });

    const formatted = expenses.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      amount: e.amount,
      date: e.date.toISOString(),
      description: e.description,
      recordedBy: e.recordedBy,
    }));

    return NextResponse.json({
      success: true,
      totalAmount,
      categorySummary,
      expenses: formatted,
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, amount, date, description, recordedBy } = body;

    const parsedAmount = parseFloat(amount);
    if (!title || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Valid title and amount are required' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        title: title.trim(),
        category: category || 'OTHER',
        amount: parsedAmount,
        date: date ? new Date(date) : new Date(),
        description: description || null,
        recordedBy: recordedBy || 'Admin',
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error('Error recording expense:', error);
    return NextResponse.json({ error: 'Failed to record expense' }, { status: 500 });
  }
}
