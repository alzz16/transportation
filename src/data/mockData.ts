export interface Location {
  id: string;
  name: string;
  type: 'subway' | 'bus';
  detail: string; // 예: "3호선", "경의중앙선", "지선 7727"
}

export interface RouteSegment {
  id: string;
  type: 'walk' | 'subway' | 'bus';
  lineName?: string; // 예: "3호선", "경의중앙선", "9401번"
  startName: string;
  endName: string;
  durationMinutes: number; // 소요시간
  distanceMeters?: number;
  fastTransferSection?: string; // 예: "4-1"
  direction?: string; // 예: "대화행", "지평행"
}

export interface TransitRoute {
  id: string;
  title: string;
  totalDuration: number; // 총 소요 시간 (분)
  totalFare: number; // 총 요금 (원)
  segments: RouteSegment[];
  departureDelayMinutes?: number; // 출발 대기 시간
}

export interface IncidentInfo {
  id: string;
  transitName: string; // 교통수단명 (예: "3호선", "경의중앙선")
  level: 'normal' | 'warning' | 'emergency';
  title: string;
  description: string;
  updatedAt: string; // 업데이트 시점
  sourceName?: string; // 정보 출처 사이트명
  sourceUrl?: string; // 정보 출처 사이트 링크
}

// 1. 역 및 정류장 목록
export const mockLocations: Location[] = [
  { id: 'loc-wondang', name: '원당역', type: 'subway', detail: '3호선' },
  { id: 'loc-daegok', name: '대곡역', type: 'subway', detail: '3호선 · 경의중앙선' },
  { id: 'loc-hangongdae', name: '한국항공대역', type: 'subway', detail: '경의중앙선' },
  { id: 'loc-seoul', name: '서울역', type: 'subway', detail: '1호선 · 4호선 · 공항철도' },
  { id: 'loc-hongdae', name: '홍대입구역', type: 'subway', detail: '2호선 · 공항철도' },
  { id: 'loc-gangnam', name: '강남역', type: 'subway', detail: '2호선 · 신분당선' },
  { id: 'loc-pangyo', name: '판교역', type: 'subway', detail: '신분당선 · 경강선' },
  { id: 'loc-jamsil', name: '잠실역', type: 'subway', detail: '2호선 · 8호선' },
  { id: 'loc-bus-hangongdae-gate', name: '항공대정문 정류장', type: 'bus', detail: '7727 · 760' },
  { id: 'loc-bus-sinchon', name: '신촌오거리 정류장', type: 'bus', detail: '7727' }
];

// 2. 동적 시간표 생성 헬퍼 함수
// 현재 시간을 기준으로 특정 간격(interval)마다 열차가 도착하는 시간표를 생성합니다.
export const generateTimetable = (baseTime: Date, intervalMinutes: number, count = 10): string[] => {
  const times: string[] = [];
  const start = new Date(baseTime.getTime() - 10 * 60 * 1000); // 10분 전부터 생성

  for (let i = 0; i < count; i++) {
    const time = new Date(start.getTime() + i * intervalMinutes * 60 * 1000);
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    times.push(`${hours}:${minutes}`);
  }
  return times;
};

// 3. 실시간 특이사항 풀 (Incidents)
export const mockIncidents: IncidentInfo[] = [
  {
    id: 'inc-1',
    transitName: '3호선',
    level: 'warning',
    title: '출퇴근 시간대 승객 집중 혼잡',
    description: '원당역 ~ 대곡역 구간 상하행선 열차가 승하차 지연으로 인해 약 2~3분 가량 연쇄 지연될 수 있습니다. 안전사고에 주의하시기 바랍니다.',
    updatedAt: '5분 전',
    sourceName: '서울교통공사 실시간 운행정보',
    sourceUrl: 'http://www.seoulmetro.co.kr'
  },
  {
    id: 'inc-2',
    transitName: '경의중앙선',
    level: 'emergency',
    title: '화전역 선로 장애 발생 (열차 지연)',
    description: '화전역 인근 선로 신호 장애 복구 작업으로 인해 경의중앙선 상하행선 열차 운행이 약 15~30분 이상 지연 운행되고 있습니다. 타 대중교통 이용을 권장합니다.',
    updatedAt: '12분 전',
    sourceName: '코레일 철도교통정보센터',
    sourceUrl: 'https://info.korail.com'
  },
  {
    id: 'inc-3',
    transitName: '7727번 버스',
    level: 'normal',
    title: '버스 정상 운행 중',
    description: '현재 돌발 우회 및 정체 요인 없이 예정된 배차 간격(12분)에 맞춰 정상 소통 중입니다.',
    updatedAt: '방금 전',
    sourceName: '경기도 버스정보시스템',
    sourceUrl: 'https://www.gbis.go.kr'
  },
  {
    id: 'inc-4',
    transitName: '2호선',
    level: 'normal',
    title: '안전 운행 소통 원활',
    description: '서울 메트로 전 구간 신호 장애 및 지연 없이 안정적으로 운행되고 있습니다.',
    updatedAt: '3분 전',
    sourceName: '서울시 교통정보시스템 (TOPIS)',
    sourceUrl: 'https://topis.seoul.go.kr'
  },
  {
    id: 'inc-5',
    transitName: '신분당선',
    level: 'warning',
    title: '정전 예방 공사로 인한 일부 감속',
    description: '양재 ~ 판교 구간 터널 내 안전 점검으로 인해 일부 열차가 서행 운행 중입니다. 약 2분 미만의 지연이 발생할 수 있습니다.',
    updatedAt: '20분 전',
    sourceName: '신분당선(주) 공식 운행 정보',
    sourceUrl: 'https://www.shinbundang.co.kr'
  }
];

// 4. 경로 검색 헬퍼 (출발지와 도착지에 맞는 목업 경로 반환)
export const getRoutes = (startId: string, endId: string): TransitRoute[] => {
  // 대표 케이스 1: 원당역 -> 한국항공대역 (지하철 환승 케이스)
  if (
    (startId === 'loc-wondang' && endId === 'loc-hangongdae') ||
    (startId === 'loc-hangongdae' && endId === 'loc-wondang')
  ) {
    const isReverse = startId === 'loc-hangongdae';
    return [
      {
        id: 'route-optimal-wondang-hangongdae',
        title: '최적 경로 (지하철 환승)',
        totalDuration: 36,
        totalFare: 1650,
        segments: [
          {
            id: 'seg-1',
            type: 'walk',
            startName: isReverse ? '한국항공대역' : '원당역',
            endName: isReverse ? '대곡역 방면 탑승장' : '원당역 5번 출구',
            durationMinutes: 5
          },
          {
            id: 'seg-2',
            type: 'subway',
            lineName: isReverse ? '경의중앙선' : '3호선',
            startName: isReverse ? '한국항공대역' : '원당역',
            endName: '대곡역',
            durationMinutes: isReverse ? 10 : 6,
            fastTransferSection: isReverse ? '1-1' : '4-1',
            direction: isReverse ? '문산행' : '대화행'
          },
          {
            id: 'seg-3',
            type: 'walk',
            startName: '대곡역 환승 통로',
            endName: isReverse ? '3호선 승강장' : '경의중앙선 승강장',
            durationMinutes: 3
          },
          {
            id: 'seg-4',
            type: 'subway',
            lineName: isReverse ? '3호선' : '경의중앙선',
            startName: '대곡역',
            endName: isReverse ? '원당역' : '한국항공대역',
            durationMinutes: isReverse ? 6 : 10,
            direction: isReverse ? '오금행' : '서울역/용문행'
          },
          {
            id: 'seg-5',
            type: 'walk',
            startName: isReverse ? '원당역' : '한국항공대역 2번 출구',
            endName: isReverse ? '목적지' : '한국항공대학교 정문',
            durationMinutes: 12
          }
        ]
      },
      {
        id: 'route-alt-wondang-hangongdae',
        title: '대체 우회 경로 (버스 이용)',
        totalDuration: 35,
        totalFare: 1500,
        segments: [
          {
            id: 'seg-alt-1',
            type: 'walk',
            startName: isReverse ? '한국항공대학교 정문' : '원당역',
            endName: isReverse ? '항공대정문 정류장' : '원당역 앞 버스정류장',
            durationMinutes: 5
          },
          {
            id: 'seg-alt-2',
            type: 'bus',
            lineName: '7727번 버스',
            startName: isReverse ? '항공대정문 정류장' : '원당역 앞 버스정류장',
            endName: isReverse ? '원당역 정류장' : '항공대정문 정류장',
            durationMinutes: 25,
            direction: isReverse ? '원당행' : '신촌행'
          },
          {
            id: 'seg-alt-3',
            type: 'walk',
            startName: isReverse ? '원당역 정류장' : '항공대정문 정류장',
            endName: isReverse ? '원당역' : '한국항공대학교 정문',
            durationMinutes: 5
          }
        ]
      }
    ];
  }

  // 대표 케이스 2: 강남역 -> 판교역 (신분당선 직결 케이스)
  if (
    (startId === 'loc-gangnam' && endId === 'loc-pangyo') ||
    (startId === 'loc-pangyo' && endId === 'loc-gangnam')
  ) {
    const isReverse = startId === 'loc-pangyo';
    return [
      {
        id: 'route-optimal-gangnam-pangyo',
        title: '최적 경로 (신분당선 직항)',
        totalDuration: 18,
        totalFare: 2150,
        segments: [
          {
            id: 'seg-1',
            type: 'walk',
            startName: isReverse ? '판교역' : '강남역',
            endName: isReverse ? '신분당선 대합실' : '신분당선 탑승장',
            durationMinutes: 3
          },
          {
            id: 'seg-2',
            type: 'subway',
            lineName: '신분당선',
            startName: isReverse ? '판교역' : '강남역',
            endName: isReverse ? '강남역' : '판교역',
            durationMinutes: 12,
            direction: isReverse ? '신사행' : '광교행'
          },
          {
            id: 'seg-3',
            type: 'walk',
            startName: isReverse ? '강남역 출구' : '판교역 1번 출구',
            endName: isReverse ? '목적지' : '판교테크노밸리',
            durationMinutes: 3
          }
        ]
      }
    ];
  }

  // 기본 포백 케이스 (임의의 출발/도착지에 대해 가변적인 단일 버스/지하철 믹스 경로 동적 생성)
  const startLoc = mockLocations.find(l => l.id === startId);
  const endLoc = mockLocations.find(l => l.id === endId);

  if (!startLoc || !endLoc) return [];

  return [
    {
      id: `route-gen-${startId}-${endId}`,
      title: `${startLoc.name} ${endLoc.name} 경로`,
      totalDuration: 42,
      totalFare: 1500,
      segments: [
        {
          id: 'gen-seg-1',
          type: 'walk',
          startName: startLoc.name,
          endName: '인근 정류장',
          durationMinutes: 7
        },
        {
          id: 'gen-seg-2',
          type: startLoc.type === 'subway' ? 'subway' : 'bus',
          lineName: startLoc.detail.split(' · ')[0] || '지하철',
          startName: startLoc.name,
          endName: '환승 지점',
          durationMinutes: 15,
          direction: '방면 노선'
        },
        {
          id: 'gen-seg-3',
          type: 'walk',
          startName: '환승 통로',
          endName: '환승 탑승장',
          durationMinutes: 5
        },
        {
          id: 'gen-seg-4',
          type: endLoc.type === 'subway' ? 'subway' : 'bus',
          lineName: endLoc.detail.split(' · ')[0] || '버스',
          startName: '환승 지점',
          endName: endLoc.name,
          durationMinutes: 10,
          direction: '목적지 방면'
        },
        {
          id: 'gen-seg-5',
          type: 'walk',
          startName: endLoc.name,
          endName: '목적지',
          durationMinutes: 5
        }
      ]
    }
  ];
};

// 5. 특정 경로에 연관된 특이사항 필터 헬퍼
export const getIncidentsForRoute = (route: TransitRoute): IncidentInfo[] => {
  const activeTransits = route.segments
    .filter(s => s.type !== 'walk')
    .map(s => s.lineName);

  // 해당 경로에서 이용하는 노선만 필터링하고, 없으면 기본적으로 정상 상태 노선도 노출
  const list = mockIncidents.filter(inc =>
    activeTransits.some(t => t && (inc.transitName.includes(t) || t.includes(inc.transitName)))
  );

  // 만약 이용하는 노선에 대해 incident 정보가 없으면 가상으로 정상 상태 카드를 동적 생성
  activeTransits.forEach(t => {
    if (t && !list.some(inc => inc.transitName.includes(t) || t.includes(inc.transitName))) {
      list.push({
        id: `inc-dynamic-${t}`,
        transitName: t,
        level: 'normal',
        title: `${t} 정상 운행`,
        description: `현재 ${t} 구간은 사고 및 공사 지연 소식 없이 안정적으로 정상 소통되고 있습니다.`,
        updatedAt: '방금 전',
        sourceName: '국토교통부 대중교통정보센터',
        sourceUrl: 'https://www.tago.go.kr'
      });
    }
  });

  return list;
};
