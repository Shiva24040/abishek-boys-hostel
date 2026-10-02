import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const menus = await prisma.mealMenu.findMany();

    // Sort by day of week
    menus.sort((a, b) => daysOrder.indexOf(a.dayOfWeek) - daysOrder.indexOf(b.dayOfWeek));

    // Determine today and tomorrow
    const jsDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = new Date().getDay();
    const todayDayName = jsDays[todayIndex];
    const tomorrowDayName = jsDays[(todayIndex + 1) % 7];

    const todayMenu = menus.find((m) => m.dayOfWeek === todayDayName);
    const tomorrowMenu = menus.find((m) => m.dayOfWeek === tomorrowDayName);

    return NextResponse.json({
      success: true,
      todayDayName,
      tomorrowDayName,
      todayMenu,
      tomorrowMenu,
      weeklyMenu: menus,
    });
  } catch (error) {
    console.error('Error fetching mess menu:', error);
    return NextResponse.json({ error: 'Failed to fetch meal menu' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, breakfast, lunch, snacks, dinner, isSpecialDay, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Menu ID is required' }, { status: 400 });
    }

    const updated = await prisma.mealMenu.update({
      where: { id },
      data: {
        breakfast: breakfast || undefined,
        lunch: lunch || undefined,
        snacks: snacks || undefined,
        dinner: dinner || undefined,
        isSpecialDay: isSpecialDay !== undefined ? isSpecialDay : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json({ success: true, menu: updated });
  } catch (error) {
    console.error('Error updating meal menu:', error);
    return NextResponse.json({ error: 'Failed to update menu' }, { status: 500 });
  }
}
