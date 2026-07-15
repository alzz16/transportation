import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startLocId = searchParams.get('start');
    const endLocId = searchParams.get('end');

    if (!startLocId || !endLocId) {
      return NextResponse.json({ error: '출발지(start)와 도착지(end) 파라미터가 누락되었습니다.' }, { status: 400 });
    }

    // 1. 데이터베이스에서 모든 경로 조회 (연계된 세그먼트와 장소 조인)
    const routesData = await prisma.route.findMany({
      include: {
        segments: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            startLocation: true,
            endLocation: true,
          },
        },
      },
    });

    // 2. 출발지와 도착지가 일치하는 경로만 필터링
    const matchedRoutes = routesData.filter((route) => {
      if (route.segments.length === 0) return false;
      const firstSegment = route.segments[0];
      const lastSegment = route.segments[route.segments.length - 1];
      return firstSegment.startLocationId === startLocId && lastSegment.endLocationId === endLocId;
    });

    // 3. 클라이언트 통신용 규격 포맷팅
    const formattedRoutes = matchedRoutes.map((route) => ({
      id: route.id,
      title: route.title,
      totalDuration: route.totalDuration,
      totalFare: route.totalFare,
      segments: route.segments.map((seg) => ({
        id: seg.id,
        type: seg.type,
        lineName: seg.lineName,
        startLocation: {
          id: seg.startLocation.id,
          name: seg.startLocation.name,
          type: seg.startLocation.type,
          detail: seg.startLocation.detail,
          latitude: seg.startLocation.latitude,
          longitude: seg.startLocation.longitude,
        },
        endLocation: {
          id: seg.endLocation.id,
          name: seg.endLocation.name,
          type: seg.endLocation.type,
          detail: seg.endLocation.detail,
          latitude: seg.endLocation.latitude,
          longitude: seg.endLocation.longitude,
        },
        durationMinutes: seg.durationMinutes,
        fastTransferSection: seg.fastTransferSection,
        direction: seg.direction,
      })),
    }));

    return NextResponse.json(formattedRoutes);
  } catch (error: any) {
    console.error('API /api/routes error:', error);
    return NextResponse.json({ error: '서버 에러가 발생했습니다.', details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
