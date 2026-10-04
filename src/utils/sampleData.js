/**
 * Preset data extracted directly from user's paper sheet (1777725049075.jpg)
 * "정정회 (정정숙 회장, 정용호 총무)"
 */

export const PAPER_SAMPLE_PLAYERS = [
  { id: 1, name: '영실', division: '7부', avatarColor: '#3b82f6' },
  { id: 2, name: '두석', division: '8부', avatarColor: '#8b5cf6' },
  { id: 3, name: '경숙', division: '7부', avatarColor: '#ec4899' },
  { id: 4, name: '성욱', division: '6부', avatarColor: '#10b981' },
  { id: 5, name: '용호', division: '8부', avatarColor: '#f59e0b' },
  { id: 6, name: '정숙', division: '6부', avatarColor: '#06b6d4' },
  { id: 7, name: '명옥', division: '5부', avatarColor: '#6366f1' },
  { id: 8, name: '민호', division: '8부', avatarColor: '#84cc16' },
  { id: 9, name: '영미', division: '8부', avatarColor: '#f43f5e' },
];

export function generatePaperSampleMatches(players) {
  // Pre-filled matches based on paper matrix
  const matrixData = [
    // [p1, p2, score1, score2, status]
    [1, 2, 1, 3, 'completed'],
    [1, 3, 1, 3, 'completed'],
    [1, 4, 2, 3, 'completed'],
    [1, 5, 3, 2, 'completed'],
    [1, 6, 2, 3, 'completed'],
    [1, 7, 1, 3, 'completed'],
    [1, 8, 3, 0, 'completed'],
    [1, 9, 3, 1, 'completed'],

    [2, 3, 2, 3, 'completed'],
    [2, 4, 1, 3, 'completed'],
    [2, 5, 3, 2, 'completed'],
    [2, 6, 3, 1, 'completed'],
    [2, 7, 3, 2, 'completed'],
    [2, 8, 0, 0, 'forfeit'], // X on paper
    [2, 9, 2, 3, 'completed'],

    [3, 4, 3, 0, 'completed'],
    [3, 5, 3, 2, 'completed'],
    [3, 6, 3, 1, 'completed'],
    [3, 7, 2, 3, 'completed'],
    [3, 8, 1, 3, 'completed'],
    [3, 9, 3, 1, 'completed'],

    [4, 5, 2, 3, 'completed'],
    [4, 6, 3, 1, 'completed'],
    [4, 7, 3, 0, 'completed'],
    [4, 8, 3, 0, 'completed'],
    [4, 9, 0, 3, 'completed'],

    [5, 6, 2, 3, 'completed'],
    [5, 7, 0, 3, 'completed'],
    [5, 8, 0, 0, 'forfeit'],
    [5, 9, 2, 3, 'completed'],

    [6, 7, 0, 3, 'completed'],
    [6, 8, 3, 0, 'completed'],
    [6, 9, 3, 1, 'completed'],

    [7, 8, 3, 0, 'completed'],
    [7, 9, 2, 3, 'completed'],

    [8, 9, 0, 0, 'forfeit'],
  ];

  const matches = [];
  let orderNumber = 1;

  matrixData.forEach(([p1, p2, s1, s2, status]) => {
    let winnerId = null;
    if (status === 'completed') {
      winnerId = s1 > s2 ? p1 : p2;
    }

    matches.push({
      id: `M_${p1}_${p2}`,
      orderNumber: orderNumber++,
      round: Math.ceil(orderNumber / 4),
      playerAId: p1,
      playerBId: p2,
      playerASets: s1,
      playerBSets: s2,
      status: status,
      winnerId: winnerId,
    });
  });

  return matches;
}
