import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database started...');

  // 기존 데이터 클리닝
  await prisma.preset.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.route.deleteMany();
  await prisma.location.deleteMany();

  // 1. Locations 등록
  const wondang = await prisma.location.create({
    data: {
      id: 'loc-wondang',
      name: '원당역',
      type: 'subway',
      detail: '3호선',
      latitude: 37.6531,
      longitude: 126.8327,
    },
  });

  const daegok = await prisma.location.create({
    data: {
      id: 'loc-daegok',
      name: '대곡역',
      type: 'subway',
      detail: '3호선/경의중앙선/서해선/GTX-A',
      latitude: 37.6316,
      longitude: 126.8111,
    },
  });

  const hangongdae = await prisma.location.create({
    data: {
      id: 'loc-hangongdae',
      name: '한국항공대역',
      type: 'subway',
      detail: '경의중앙선',
      latitude: 37.5996,
      longitude: 126.8653,
    },
  });

  const wondangExit5 = await prisma.location.create({
    data: {
      id: 'loc-wondang-exit5',
      name: '원당역 5번출구 정류소',
      type: 'bus',
      detail: '7727번 버스',
      latitude: 37.6535,
      longitude: 126.8331,
    },
  });

  const hangongdaeFront = await prisma.location.create({
    data: {
      id: 'loc-hangongdae-front',
      name: '항공대정문 정류소',
      type: 'bus',
      detail: '7727번 버스',
      latitude: 37.6001,
      longitude: 126.8649,
    },
  });

  console.log('Locations seeded.');

  // 2. 최적 경로 등록
  const optimalRoute = await prisma.route.create({
    data: {
      id: 'route-optimal-wondang-hangongdae',
      title: '최적 경로 (지하철 환승)',
      totalDuration: 36,
      totalFare: 1650,
    },
  });

  // 최적 경로 세그먼트 등록
  await prisma.segment.createMany({
    data: [
      {
        id: 'seg-opt-1',
        routeId: optimalRoute.id,
        type: 'walk',
        startLocationId: wondang.id,
        endLocationId: wondang.id,
        durationMinutes: 5,
        sequenceOrder: 1,
      },
      {
        id: 'seg-opt-2',
        routeId: optimalRoute.id,
        type: 'subway',
        lineName: '3호선',
        startLocationId: wondang.id,
        endLocationId: daegok.id,
        durationMinutes: 6,
        fastTransferSection: '4-1',
        direction: '대화행',
        sequenceOrder: 2,
      },
      {
        id: 'seg-opt-3',
        routeId: optimalRoute.id,
        type: 'walk',
        startLocationId: daegok.id,
        endLocationId: daegok.id,
        durationMinutes: 3,
        sequenceOrder: 3,
      },
      {
        id: 'seg-opt-4',
        routeId: optimalRoute.id,
        type: 'subway',
        lineName: '경의중앙선',
        startLocationId: daegok.id,
        endLocationId: hangongdae.id,
        durationMinutes: 10,
        fastTransferSection: '2-3',
        direction: '용문/덕소행',
        sequenceOrder: 4,
      },
      {
        id: 'seg-opt-5',
        routeId: optimalRoute.id,
        type: 'walk',
        startLocationId: hangongdae.id,
        endLocationId: hangongdaeFront.id,
        durationMinutes: 12,
        sequenceOrder: 5,
      },
    ],
  });

  // 3. 대체 버스 경로 등록
  const busRoute = await prisma.route.create({
    data: {
      id: 'route-bus-wondang-hangongdae',
      title: '대체 경로 (7727번 버스)',
      totalDuration: 42,
      totalFare: 1500,
    },
  });

  // 대체 버스 경로 세그먼트 등록
  await prisma.segment.createMany({
    data: [
      {
        id: 'seg-bus-1',
        routeId: busRoute.id,
        type: 'walk',
        startLocationId: wondang.id,
        endLocationId: wondangExit5.id,
        durationMinutes: 3,
        sequenceOrder: 1,
      },
      {
        id: 'seg-bus-2',
        routeId: busRoute.id,
        type: 'bus',
        lineName: '7727번 버스',
        startLocationId: wondangExit5.id,
        endLocationId: hangongdaeFront.id,
        durationMinutes: 34,
        direction: '신촌행',
        sequenceOrder: 2,
      },
      {
        id: 'seg-bus-3',
        routeId: busRoute.id,
        type: 'walk',
        startLocationId: hangongdaeFront.id,
        endLocationId: hangongdae.id,
        durationMinutes: 5,
        sequenceOrder: 3,
      },
    ],
  });

  console.log('Routes and Segments seeded.');

  // 4. Incidents (돌발 특이사항) 등록
  await prisma.incident.createMany({
    data: [
      {
        id: 'inc-1',
        transitName: '3호선',
        level: 'warning',
        title: '3호선 삼송역 코레일 구간 신호 장애 (열차 지연)',
        description: '삼송역 코레일 소속 전동열차 신호제어 장치 일시 장애로 인하여 일산선 상하행선 열차가 약 5분~10분 지연되어 운행 중입니다. 복구 작업 완료 후 안전운행에 최선을 다하겠습니다.',
        sourceName: '서울교통공사 실시간 운행정보',
        sourceUrl: 'http://www.seoulmetro.co.kr',
      },
      {
        id: 'inc-2',
        transitName: '경의중앙선',
        level: 'emergency',
        title: '화전역 선로 장애 발생 (열차 지연 및 우회 권장)',
        description: '화전역 인근 선로 신호 장애 복구 작업으로 인해 경의중앙선 상하행선 열차 운행이 약 15~30분 이상 지연 운행되고 있습니다. 바쁘신 분들은 버스 등 다른 대중교통 수단을 이용해 주시기 바랍니다.',
        sourceName: '코레일 철도교통정보센터',
        sourceUrl: 'https://info.korail.com',
      },
      {
        id: 'inc-3',
        transitName: '7727번 버스',
        level: 'normal',
        title: '7727번 버스 우회 운행 종료 및 정상 통행 안내',
        description: '덕양로 우회 통행이 종료되어 기존 정규 정류소(항공대정문 등)에 정상 정차 및 배차 중입니다.',
        sourceName: '경기도 버스정보시스템',
        sourceUrl: 'https://gbis.go.kr',
      },
    ],
  });

  console.log('Incidents seeded.');
  console.log('Seeding database completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
