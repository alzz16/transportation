import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: '메시지가 누락되었습니다.' }, { status: 400 });
    }

    // 1. 데이터베이스(Supabase)로부터 모든 실시간 관련 정보 조회
    const locations = await prisma.location.findMany();
    const incidents = await prisma.incident.findMany();
    
    // 경로 & 연관 세그먼트(장소 조인 포함) 정방향 정렬
    const routes = await prisma.route.findMany({
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

    // 2. LLM용 데이터 모델 맥락(Context) 조립
    const formattedLocations = locations.map(loc => 
      `- [${loc.type === 'subway_station' ? '지하철역' : '정류소'}] ${loc.name} (위도: ${loc.latitude || 'N/A'}, 경도: ${loc.longitude || 'N/A'})`
    ).join('\n');

    const formattedIncidents = incidents.map(inc => 
      `- [노선: ${inc.transitName}] 수준: ${inc.level.toUpperCase()} / 제목: ${inc.title}\n  세부: ${inc.description}\n  출처: ${inc.sourceName}`
    ).join('\n');

    const formattedRoutes = routes.map(route => {
      const segs = route.segments.map(seg => 
        `   * 순서 ${seg.sequenceOrder} [수단: ${seg.type === 'walk' ? '도보' : seg.lineName}] ${seg.startLocation.name} -> ${seg.endLocation.name} (${seg.durationMinutes}분 소요, 방면: ${seg.direction || '없음'}, 빠른환승구간: ${seg.fastTransferSection || '없음'})`
      ).join('\n');
      
      return `- 경로명: "${route.title}" (ID: ${route.id})\n  총 소요시간: ${route.totalDuration}분 / 총 요금: ${route.totalFare}원\n  이동 구간:\n${segs}`;
    }).join('\n\n');

    const context = `
[대중교통 서비스 'TransitFlow' 실시간 데이터베이스 상황판]

1. 정류소/지하철역 목록 (Locations):
${formattedLocations}

2. 시스템에 등록된 전체 추천 경로 및 세그먼트 스펙 (Routes & Segments):
${formattedRoutes}

3. 실시간 교통 돌발 상황/지연 경보 (Incidents):
${formattedIncidents || '현재 발령된 돌발 상황이 없습니다.'}
`;

    // 3. GROQ API 키 검출
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GROQ_API_KEY가 환경 변수에 제공되지 않았습니다.');
      return NextResponse.json({ 
        reply: "⚠️ 서버에 GROQ_API_KEY 환경 변수가 세팅되어 있지 않습니다. 챗봇을 작동하려면 로컬 `.env` 혹은 Vercel 환경 변수에 발급한 API 키를 적용해 주십시오." 
      });
    }

    // 4. GROQ API 호출 (OpenAI 호환 포트 사용)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // GROQ 추천 경량/고성능 모델 사용
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `당신은 대중교통 환승 검색 서비스 'TransitFlow'의 AI 안내 비서입니다.
아래 제공되는 데이터베이스의 실시간 현황 자료(Context)를 철저히 신뢰하고 기반하여 사용자의 질문에 한국어로 명료하고 친절하게 답변해 주십시오.

[지침]
1. 반드시 주어진 'TransitFlow 상황판' 컨텍스트 정보에 명시된 노선, 정류소명, 소요시간, 요금, 지연(Incident) 정보만을 바탕으로 응답하세요.
2. 컨텍스트 데이터에 존재하지 않는 정보나 임의의 교통 정보는 추측해서 답변하지 말고, "제공된 데이터에서 해당 정보를 찾을 수 없습니다"라고 답하세요.
3. 실시간 사건사고 경보(Incidents) 정보에 지연 등이 있으면 그 사실을 강조하여 우회 경로를 적극 추천해 주세요.
4. 존댓말로 친절하게 답변하세요.

${context}`
          },
          // 대화 이력 전달
          ...history,
          { role: 'user', content: message }
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GROQ API Response Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '응답을 생성하지 못했습니다.';

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: '챗봇 응답 생성에 실패했습니다.', details: error.message }, { status: 500 });
  }
}
