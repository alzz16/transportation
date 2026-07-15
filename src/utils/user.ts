/**
 * 기기 고유의 익명 식별자(Device ID)를 발급 및 관리하는 유틸리티입니다.
 * LocalStorage를 이용해 기기별 고유성을 보존하여 회원 가입 없이도 Supabase에 개인 프리셋을 격리 적재합니다.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'anonymous-user';

  let deviceId = localStorage.getItem('transit-device-id');
  if (!deviceId) {
    // 36진수 랜덤 문자열 결합으로 기기 고유 식별자(Device UUID) 모사 생성
    const p1 = Math.random().toString(36).substring(2, 15);
    const p2 = Math.random().toString(36).substring(2, 15);
    deviceId = `dev-${p1}-${p2}`;
    localStorage.setItem('transit-device-id', deviceId);
  }
  
  return deviceId;
}
