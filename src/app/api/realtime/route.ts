import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get('routeId') || 'route-optimal-wondang-hangongdae';

  const encoder = new TextEncoder();
  let step = 0;

  // SSE 커넥션을 위한 ReadableStream 스트림 응답 빌드
  const stream = new ReadableStream({
    async start(controller) {
      // 3초 주기로 실시간 노선 트래킹 패킷 발송
      const interval = setInterval(() => {
        step = (step + 1) % 30; // 0~29 단계를 순환하며 이동하는 좌표 궤적 모사

        let payload = {};

        if (routeId.includes('optimal')) {
          // 지하철 경로 트래킹 시나리오
          // 1단계~12단계: 3호선 이동 중
          if (step < 12) {
            const ratio = step / 12;
            // 대곡역 방향으로 이동
            payload = {
              segmentId: 'seg-opt-2',
              lineName: '3호선 (대화행)',
              currentX: 85 + ratio * (200 - 85), // 원당역(85) -> 대곡역(200)
              currentY: 95 + (Math.sin(step) * 2), // 노선 물리 흔들림 연출
              status: '대곡역 방면 정상 운행 중',
            };
          } 
          // 12단계~15단계: 대곡역 환승 대기 중
          else if (step >= 12 && step < 16) {
            payload = {
              segmentId: 'seg-opt-3',
              lineName: '대곡역 환승통로',
              currentX: 200,
              currentY: 95,
              status: '경의중앙선 환승 이동 중 (도보)',
            };
          } 
          // 16단계~29단계: 경의중앙선 이동 중
          else {
            const ratio = (step - 16) / 13;
            payload = {
              segmentId: 'seg-opt-4',
              lineName: '경의중앙선 (용문행)',
              currentX: 200 + ratio * (315 - 200), // 대곡역(200) -> 한국항공대역(315)
              currentY: 95 + (Math.cos(step) * 2),
              status: '한국항공대역 방면 약 2분 지연 운행 중',
            };
          }
        } else {
          // 7727 버스 경로 트래킹 시나리오
          const ratio = step / 29;
          payload = {
            segmentId: 'seg-bus-2',
            lineName: '7727번 버스 (신촌행)',
            currentX: 85 + ratio * (315 - 85), // 원당역(85) -> 항공대입구(315)
            currentY: 95 + Math.sin(step * 0.5) * 15, // 버스 도로 굴곡 물리 연출
            status: '정상 정류장 운행 중 (우회 구간 종료)',
          };
        }

        // SSE 전송용 패킷 포맷팅
        const chunk = `event: location-update\ndata: ${JSON.stringify(payload)}\n\n`;
        
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch (e) {
          // 스트림 세션이 이미 종료되었을 때의 무시 처리
          clearInterval(interval);
        }
      }, 3000);

      // 클라이언트 측에서 윈도우 탭을 닫거나 연결을 해제하면 타이머 클리어
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
