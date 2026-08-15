import { EmotionType } from '../types/script';

export interface SpeechBubbleProps {
  text: string;
  displayedText: string;
  speakerName: string;
  x: number; // Anchor point (character head)
  y: number;
  emotion?: EmotionType;
  maxWidth?: number;
}

export class SpeechBubbleRenderer {
  public static drawBubble(ctx: CanvasRenderingContext2D, props: SpeechBubbleProps) {
    const { displayedText, speakerName, x, y, emotion = 'neutral', maxWidth = 220 } = props;
    if (!displayedText || displayedText.length === 0) return;

    ctx.save();

    // Font settings
    const fontSize = 12;
    ctx.font = `600 ${fontSize}px "VT323", "Press Start 2P", monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Word wrap text into lines
    const words = displayedText.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine.length === 0 ? words[i] : `${currentLine} ${words[i]}`;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // Measure bounding box
    const lineHeight = 16;
    let maxLineWidth = 0;
    lines.forEach((line) => {
      const w = ctx.measureText(line).width;
      if (w > maxLineWidth) maxLineWidth = w;
    });

    const paddingX = 10;
    const paddingY = 8;
    const headerHeight = 14;
    const boxW = Math.max(maxLineWidth + paddingX * 2, 90);
    const boxH = lines.length * lineHeight + paddingY * 2 + headerHeight;

    // Center bubble horizontally over character, position above head
    const boxX = Math.round(x - boxW / 2);
    const boxY = Math.round(y - boxH - 24);

    // Color theme based on emotion
    let bubbleBg = '#ffffff';
    let borderColor = '#0f172a';
    let headerColor = '#3b82f6';

    if (emotion === 'angry' || emotion === 'panic') {
      borderColor = '#dc2626';
      headerColor = '#ef4444';
      bubbleBg = '#fff5f5';
    } else if (emotion === 'smirk' || emotion === 'smug') {
      borderColor = '#059669';
      headerColor = '#10b981';
      bubbleBg = '#f0fdf4';
    } else if (emotion === 'cringe' || emotion === 'cry') {
      borderColor = '#7c3aed';
      headerColor = '#8b5cf6';
      bubbleBg = '#faf5ff';
    } else if (emotion === 'shock' || emotion === 'confused') {
      borderColor = '#d97706';
      headerColor = '#f59e0b';
      bubbleBg = '#fffbeb';
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(boxX + 3, boxY + 3, boxW, boxH);

    // Main Bubble Box
    ctx.fillStyle = bubbleBg;
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // Pixel Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Bubble Tail pointing to speaker
    const tailX = Math.round(x);
    const tailY = boxY + boxH;

    ctx.fillStyle = bubbleBg;
    ctx.beginPath();
    ctx.moveTo(tailX - 6, tailY);
    ctx.lineTo(tailX, tailY + 8);
    ctx.lineTo(tailX + 6, tailY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tailX - 6, tailY);
    ctx.lineTo(tailX, tailY + 8);
    ctx.lineTo(tailX + 6, tailY);
    ctx.stroke();

    // Speaker Name Header Pill
    ctx.fillStyle = headerColor;
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.fillText(speakerName.toUpperCase(), boxX + paddingX, boxY + 6);

    // Dialogue Text lines
    ctx.fillStyle = '#0f172a';
    ctx.font = `600 ${fontSize}px "VT323", monospace`;
    lines.forEach((line, idx) => {
      ctx.fillText(line, boxX + paddingX, boxY + headerHeight + paddingY + idx * lineHeight);
    });

    ctx.restore();
  }
}
