/**
 * 기기 고유의 익명 식별자(Device ID)를 발급 및 관리하는 유틸리티입니다.
 * 브라우저 표준 웹 암호화 API(Web Crypto API)를 사용해 엄격한 표준 UUID v4 규격을 발급합니다.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'anonymous-user';

  let deviceId = localStorage.getItem('transit-device-id');
  if (!deviceId) {
    try {
      // 최신 브라우저가 지원하는 표준 UUID v4 생성 API 사용
      deviceId = window.crypto.randomUUID();
    } catch (e) {
      // 구형 브라우저 포백용 랜덤 UUID v4 수동 매핑 생성
      deviceId = '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    }
    localStorage.setItem('transit-device-id', deviceId);
  }
  
  return deviceId;
}
