import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. 프리셋 리스트 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'anonymous-user';

    const presets = await prisma.preset.findMany({
      where: { userId },
      include: {
        startLocation: true,
        endLocation: true,
        route: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 프론트엔드가 기대하는 JSON 배열 구조로 변환
    const formattedPresets = presets.map((p) => ({
      id: p.id,
      title: p.title,
      startLocation: {
        id: p.startLocation.id,
        name: p.startLocation.name,
        type: p.startLocation.type,
        detail: p.startLocation.detail,
        latitude: p.startLocation.latitude,
        longitude: p.startLocation.longitude,
      },
      endLocation: {
        id: p.endLocation.id,
        name: p.endLocation.name,
        type: p.endLocation.type,
        detail: p.endLocation.detail,
        latitude: p.endLocation.latitude,
        longitude: p.endLocation.longitude,
      },
      routeId: p.routeId,
      routeTitle: p.route.title,
      createdAt: p.createdAt.getTime(),
    }));

    return NextResponse.json(formattedPresets);
  } catch (error: any) {
    console.error('GET /api/presets error:', error);
    return NextResponse.json({ error: '프리셋 조회에 실패했습니다.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// 2. 프리셋 등록 (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, startLocationId, endLocationId, routeId, userId = 'anonymous-user' } = body;

    if (!title || !startLocationId || !endLocationId || !routeId) {
      return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
    }

    // 중복 등록 방지 (동일 출발지, 도착지, 경로가 있는 프리셋 걸러냄)
    const existing = await prisma.preset.findFirst({
      where: {
        userId,
        startLocationId,
        endLocationId,
        routeId,
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const newPreset = await prisma.preset.create({
      data: {
        title,
        userId,
        startLocationId,
        endLocationId,
        routeId,
      },
      include: {
        startLocation: true,
        endLocation: true,
        route: true,
      },
    });

    const formatted = {
      id: newPreset.id,
      title: newPreset.title,
      startLocation: newPreset.startLocation,
      endLocation: newPreset.endLocation,
      routeId: newPreset.routeId,
      routeTitle: newPreset.route.title,
      createdAt: newPreset.createdAt.getTime(),
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('POST /api/presets error:', error);
    return NextResponse.json({ error: '프리셋 저장에 실패했습니다.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// 3. 프리셋 삭제 (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '삭제할 프리셋 ID가 없습니다.' }, { status: 400 });
    }

    await prisma.preset.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: '성공적으로 삭제되었습니다.' });
  } catch (error: any) {
    console.error('DELETE /api/presets error:', error);
    return NextResponse.json({ error: '프리셋 삭제에 실패했습니다.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
