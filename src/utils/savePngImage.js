import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

let lastTimeSuffix = '';
let sameSecondCounter = 0;

function getUniqueFilename(baseFilename) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  let timeSuffix = `${hh}${mm}${ss}`;

  if (timeSuffix === lastTimeSuffix) {
    sameSecondCounter += 1;
    timeSuffix = `${timeSuffix}_${sameSecondCounter}`;
  } else {
    lastTimeSuffix = timeSuffix;
    sameSecondCounter = 0;
  }

  if (baseFilename.toLowerCase().endsWith('.png')) {
    return `${baseFilename.slice(0, -4)}_${timeSuffix}.png`;
  }
  return `${baseFilename}_${timeSuffix}.png`;
}

function showDownloadCompletePopup(filename, isMobileOrTablet) {
  const existing = document.getElementById('pingpong-download-complete-modal');
  if (existing) existing.remove();

  const folderPathText = isMobileOrTablet
    ? `내 파일 > Download (다운로드) 폴더\n(/storage/emulated/0/Download/${filename})`
    : `Download 폴더 (~/Downloads/${filename})`;

  const overlay = document.createElement('div');
  overlay.id = 'pingpong-download-complete-modal';
  overlay.setAttribute('data-html2canvas-ignore', 'true');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '100000',
    padding: '16px',
  });

  const card = document.createElement('div');
  Object.assign(card.style, {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    border: '2px solid #38bdf8',
    borderRadius: '16px',
    padding: '24px 20px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  });

  const title = document.createElement('div');
  Object.assign(title.style, {
    fontSize: '20px',
    fontWeight: '900',
    color: '#38bdf8',
    marginBottom: '14px',
  });
  title.textContent = '✅ 다운로드 완료';

  const desc = document.createElement('div');
  Object.assign(desc.style, {
    fontSize: '15px',
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: '12px',
    lineHeight: '1.5',
  });
  desc.textContent = '결과 이미지 파일이 Download 폴더에 자동 저장되었습니다.';

  const pathBox = document.createElement('div');
  Object.assign(pathBox.style, {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '13px',
    color: '#94a3b8',
    wordBreak: 'break-all',
    whiteSpace: 'pre-line',
    lineHeight: '1.5',
    marginBottom: '18px',
    textAlign: 'left',
  });
  pathBox.textContent = `📁 저장 위치:\n${folderPathText}\n\n📄 파일명:\n${filename}`;

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.textContent = '확인';
  Object.assign(confirmBtn.style, {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '900',
    cursor: 'pointer',
  });

  const closePopup = () => {
    if (overlay.parentNode) overlay.remove();
  };

  confirmBtn.onclick = closePopup;
  overlay.onclick = (e) => {
    if (e.target === overlay) closePopup();
  };

  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(pathBox);
  card.appendChild(confirmBtn);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}

// Minimum layout width used for the capture so phone/tablet portrait layouts
// are rendered like a desktop page (no wrapped headers, no clipped tables).
const CAPTURE_MIN_WIDTH = 1200;
// Keep canvas within mobile browser limits (Android Chrome / Samsung Internet).
const MAX_CANVAS_DIMENSION = 16000;
const MAX_CANVAS_AREA = 40_000_000;

/**
 * Measures how wide the element must be so that every horizontally scrollable
 * child (e.g. matrix grid, ranking tables with overflowX: auto) fits without clipping.
 */
function measureRequiredWidth(element) {
  let maxHiddenOverflow = 0;
  element.querySelectorAll('*').forEach((el) => {
    const hidden = el.scrollWidth - el.clientWidth;
    if (hidden > maxHiddenOverflow) maxHiddenOverflow = hidden;
  });
  const ownHidden = Math.max(0, element.scrollWidth - element.clientWidth);
  return Math.ceil(
    Math.max(CAPTURE_MIN_WIDTH, element.offsetWidth + Math.max(maxHiddenOverflow, ownHidden))
  );
}

/**
 * Runs inside html2canvas' cloned document: removes scroll/clip containers and
 * widens the target element so the entire web page content is rendered.
 */
function expandCloneForFullCapture(clonedEl, targetWidth) {
  const view = clonedEl.ownerDocument.defaultView;

  const unclip = (el) => {
    const cs = view.getComputedStyle(el);
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      el.style.overflow = 'visible';
      el.style.overflowX = 'visible';
      el.style.overflowY = 'visible';
    }
    if (cs.maxWidth !== 'none') el.style.maxWidth = 'none';
    if (cs.maxHeight !== 'none') el.style.maxHeight = 'none';
  };

  unclip(clonedEl);
  clonedEl.querySelectorAll('*').forEach(unclip);

  clonedEl.style.boxSizing = 'border-box';
  clonedEl.style.width = `${targetWidth}px`;
  clonedEl.style.minWidth = `${targetWidth}px`;

  // Grow further if any content still overflows after un-clipping
  const finalWidth = Math.max(targetWidth, clonedEl.scrollWidth);
  if (finalWidth > targetWidth) {
    clonedEl.style.width = `${finalWidth}px`;
    clonedEl.style.minWidth = `${finalWidth}px`;
  }
}

function computeSafeScale(desiredScale, width, height) {
  const byDimension = Math.min(MAX_CANVAS_DIMENSION / width, MAX_CANVAS_DIMENSION / height);
  const byArea = Math.sqrt(MAX_CANVAS_AREA / (width * height));
  return Math.max(0.5, Math.min(desiredScale, byDimension, byArea));
}

/**
 * Captures a DOM element via html2canvas and automatically downloads the PNG image
 * to the device's Download folder without triggering Android duplicate-download confirmation popups.
 * The whole web page content is captured regardless of portrait/landscape orientation
 * (horizontally scrolled tables are fully expanded).
 */
export async function captureAndSavePNG(
  element,
  {
    filename,
    backgroundColor = '#0f172a',
    confettiOptions = { particleCount: 60, spread: 70, origin: { y: 0.6 } },
    errorMessage = '결과 이미지 저장 중 오류가 발생했습니다.',
  }
) {
  if (!element) return;

  try {
    // Detect mobile/tablet including Galaxy Tab S9 (which reports Linux Desktop UA with maxTouchPoints > 1)
    const isMobileOrTablet =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1);

    // Render at desktop width so the full page (not just the visible viewport) is captured
    const targetWidth = measureRequiredWidth(element);
    const estimatedHeight = Math.max(element.scrollHeight, 1);
    const captureScale = computeSafeScale(isMobileOrTablet ? 1.5 : 2, targetWidth, estimatedHeight);

    const canvas = await html2canvas(element, {
      scale: captureScale,
      backgroundColor,
      useCORS: true,
      logging: false,
      windowWidth: Math.max(targetWidth, window.innerWidth),
      onclone: (_clonedDoc, clonedEl) => {
        if (clonedEl) expandCloneForFullCapture(clonedEl, targetWidth);
      },
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
      alert('이미지 생성에 실패했습니다.');
      return;
    }

    // Ensure unique filename with _HHMMSS so Android Chrome / Samsung Internet never prompts
    // "파일을 다시 다운로드하시겠습니까?" due to an existing file with the same name in Download.
    const uniqueFilename = getUniqueFilename(filename);

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.download = uniqueFilename;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Keep object URL alive for 60s so mobile download manager finishes reading
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);

    confetti(confettiOptions);

    // Show completion popup with saved path after download is triggered
    setTimeout(() => {
      showDownloadCompletePopup(uniqueFilename, isMobileOrTablet);
    }, 250);
  } catch (e) {
    console.error(e);
    alert(errorMessage);
  }
}
