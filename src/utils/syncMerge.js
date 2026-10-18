// P2P 동기화용 병합 유틸리티
// 경기는 "선수 쌍(pair)" 단위로 식별하고, updatedAt(저장 시각)이 더 최신인 쪽을 채택합니다.

export const pairKey = (m) => [m.playerAId, m.playerBId].sort().join('___');

// other의 점수 방향(A/B)을 base 기준으로 맞춤
function orientTo(base, other) {
  if (other.playerAId === base.playerAId) {
    return {
      ...base,
      playerASets: other.playerASets,
      playerBSets: other.playerBSets,
      status: other.status,
      winnerId: other.winnerId,
      updatedAt: other.updatedAt || 0,
    };
  }
  return {
    ...base,
    playerASets: other.playerBSets,
    playerBSets: other.playerASets,
    status: other.status,
    winnerId: other.winnerId,
    updatedAt: other.updatedAt || 0,
  };
}

// baseMatches(구조 기준)에 incoming 중 더 최신인 점수만 반영한 새 배열을 반환
export function mergeIncomingMatches(baseMatches, incoming) {
  const incomingMap = {};
  (incoming || []).forEach((m) => {
    if (m && m.playerAId && m.playerBId) incomingMap[pairKey(m)] = m;
  });
  return (baseMatches || []).map((b) => {
    const inc = incomingMap[pairKey(b)];
    if (inc && (inc.updatedAt || 0) > (b.updatedAt || 0)) return orientTo(b, inc);
    return b;
  });
}

export const randomDigits = (n) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
