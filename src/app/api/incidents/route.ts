import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');

    if (!routeId) {
      // routeId 가 없으면 전체 실시간 돌발 정보 반환
      const allIncidents = await prisma.incident.findMany({
        orderBy: { updatedAt: 'desc' },
      });
      return NextResponse.json(allIncidents);
    }

    // 1. 해당 경로가 포함한 모든 세그먼트 조회
    const routeWithSegments = await prisma.route.findUnique({
      where: { id: routeId },
      include: { segments: true },
    });

    if (!routeWithSegments) {
      return NextResponse.json({ error: '해당 경로를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 2. 경로 세그먼트의 노선 이름(lineName) 배열 추출
    const lineNames = routeWithSegments.segments
      .map((seg) => seg.lineName)
      .filter((name): name is string => !!name);

    if (lineNames.length === 0) {
      return NextResponse.json([]);
    }

    // 3. 노선명 배열과 매칭되는 실시간 Incident 조회 (IN 연산 처리)
    // lineName 예: "3호선", "경의중앙선", "7727번 버스"
    // DB의 transitName과 대소문자/공백 완화 매칭을 위해 Contains 또는 In 필터 수행
    const matchedIncidents = await prisma.incident.findMany({
      where: {
        OR: lineNames.map((line) => ({
          transitName: {
            contains: line.split(' ')[0], // "7727번" 또는 "3호선" 앞 단어 기준 매칭
          },
        })),
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(matchedIncidents);
  } catch (error: any) {
    console.error('API /api/incidents error:', error);
    return NextResponse.json({ error: '서버 에러가 발생했습니다.', details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
