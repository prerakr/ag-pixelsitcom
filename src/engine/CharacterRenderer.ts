import { CharacterDefinition, CharacterRuntimeState } from '../types/character';
import { Direction, EmoteIconType } from '../types/script';

export class CharacterRenderer {
  public static drawCharacter(
    ctx: CanvasRenderingContext2D,
    character: CharacterDefinition,
    state: CharacterRuntimeState,
    showNameTag = true
  ) {
    const { visual } = character;
    const { x, y, facing, isMoving, animFrame, isSitting, currentEmote } = state;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    // Walk bobbing offset
    const walkBob = isMoving ? (animFrame % 2 === 0 ? 0 : -2) : 0;
    const isJimGaze = state.currentAction === 'jim_stare';

    // 1. Shadow beneath character
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Legs & Shoes
    if (!isSitting) {
      const legOffset = isMoving ? (animFrame === 1 ? 3 : animFrame === 3 ? -3 : 0) : 0;
      ctx.fillStyle = visual.pantsColor;

      if (facing === 'up' || facing === 'down') {
        // Left leg
        ctx.fillRect(-6, 4 + walkBob, 4, 8 + (isMoving && animFrame === 1 ? -2 : 0));
        // Right leg
        ctx.fillRect(2, 4 + walkBob, 4, 8 + (isMoving && animFrame === 3 ? -2 : 0));

        // Shoes
        ctx.fillStyle = visual.shoesColor;
        ctx.fillRect(-7, 11 + walkBob + (isMoving && animFrame === 1 ? -2 : 0), 5, 3);
        ctx.fillRect(2, 11 + walkBob + (isMoving && animFrame === 3 ? -2 : 0), 5, 3);
      } else {
        // Side view (left / right)
        ctx.fillRect(-3 + legOffset, 4 + walkBob, 6, 8);
        ctx.fillStyle = visual.shoesColor;
        const shoeDir = facing === 'left' ? -5 : 2;
        ctx.fillRect(shoeDir + legOffset, 11 + walkBob, 6, 3);
      }
    } else {
      // Sitting legs
      ctx.fillStyle = visual.pantsColor;
      ctx.fillRect(-5, 6, 10, 5);
      ctx.fillStyle = visual.shoesColor;
      ctx.fillRect(-6, 10, 12, 3);
    }

    // 3. Torso & Clothes
    const torsoY = -6 + walkBob;
    const bodyW = visual.bodyType === 'large' ? 16 : visual.bodyType === 'petite' ? 10 : 13;
    const bodyHalf = bodyW / 2;

    // Base shirt / jacket
    ctx.fillStyle = visual.shirtColor;
    ctx.fillRect(-bodyHalf, torsoY, bodyW, 11);

    // Collar / Cardigan details
    if (visual.accessory === 'cardigan') {
      ctx.fillStyle = '#f7fafc'; // Inner blouse
      ctx.fillRect(-2, torsoY, 4, 6);
      ctx.fillStyle = visual.shirtColor; // Cardigan lapels
      ctx.fillRect(-bodyHalf, torsoY, 3, 10);
      ctx.fillRect(bodyHalf - 3, torsoY, 3, 10);
    } else if (visual.tieColor && (facing === 'down' || facing === 'left' || facing === 'right')) {
      // Tie
      ctx.fillStyle = visual.tieColor;
      ctx.fillRect(-1.5, torsoY + 2, 3, 8);
      ctx.fillRect(-1, torsoY + 10, 2, 2);
    }

    // 4. Arms
    const armY = torsoY + 1;
    ctx.fillStyle = visual.shirtColor;
    if (facing === 'down' || facing === 'up') {
      const leftArmSwing = isMoving ? (animFrame === 1 ? -2 : 2) : 0;
      const rightArmSwing = isMoving ? (animFrame === 3 ? -2 : 2) : 0;
      ctx.fillRect(-bodyHalf - 3, armY + leftArmSwing, 3, 8);
      ctx.fillRect(bodyHalf, armY + rightArmSwing, 3, 8);

      // Hands
      ctx.fillStyle = visual.skinColor;
      ctx.fillRect(-bodyHalf - 3, armY + 7 + leftArmSwing, 3, 3);
      ctx.fillRect(bodyHalf, armY + 7 + rightArmSwing, 3, 3);
    } else {
      // Side arm
      const armSwing = isMoving ? (animFrame % 2 === 1 ? 2 : -2) : 0;
      ctx.fillRect(-2 + armSwing, armY, 4, 8);
      ctx.fillStyle = visual.skinColor;
      ctx.fillRect(-2 + armSwing, armY + 7, 4, 3);
    }

    // 5. Head
    const headY = -19 + walkBob;
    const headW = 12;
    const headH = 13;

    // Face skin
    ctx.fillStyle = visual.skinColor;
    ctx.fillRect(-headW / 2, headY, headW, headH);

    // 6. Hair & Facial Features based on Direction & Style
    ctx.fillStyle = visual.hairColor;

    if (facing === 'up') {
      // Back of head
      ctx.fillRect(-headW / 2 - 1, headY - 2, headW + 2, headH - 2);
      if (visual.hairStyle === 'curls' || visual.hairStyle === 'floppy') {
        ctx.fillRect(-headW / 2 - 2, headY, headW + 4, headH);
      }
      if (visual.hairStyle === 'tight_bun') {
        ctx.fillRect(-3, headY - 6, 6, 5); // Angela's tight blonde bun
      }
    } else {
      // Hair top
      ctx.fillRect(-headW / 2 - 1, headY - 2, headW + 2, 4);

      if (visual.hairStyle === 'middle_part') {
        // Dwight's iconic middle part
        ctx.fillRect(-headW / 2 - 1, headY, 5, 7);
        ctx.fillRect(headW / 2 - 4, headY, 5, 7);
      } else if (visual.hairStyle === 'floppy') {
        // Jim's messy floppy hair
        ctx.fillRect(-headW / 2 - 2, headY, 6, 8);
        ctx.fillRect(headW / 2 - 3, headY, 4, 6);
        ctx.fillRect(-3, headY - 3, 8, 3);
      } else if (visual.hairStyle === 'curls') {
        // Pam's wavy curls
        ctx.fillRect(-headW / 2 - 2, headY, 4, headH + 2);
        ctx.fillRect(headW / 2 - 2, headY, 4, headH + 2);
      } else if (visual.hairStyle === 'tight_bun') {
        ctx.fillRect(-headW / 2 - 1, headY, headW + 2, 3);
        ctx.fillRect(-3, headY - 5, 6, 4);
      } else if (visual.hairStyle === 'balding') {
        // Kevin's balding side hair
        ctx.fillStyle = visual.hairColor;
        ctx.fillRect(-headW / 2 - 1, headY + 3, 3, 5);
        ctx.fillRect(headW / 2 - 2, headY + 3, 3, 5);
      } else {
        // Default short / slicked
        ctx.fillRect(-headW / 2 - 1, headY, headW + 2, 4);
      }

      // Eyes & Expression
      ctx.fillStyle = '#1a202c';
      if (facing === 'down' || isJimGaze) {
        // Facing camera (or Jim doing his camera stare)
        const eyeXOffset = isJimGaze ? 1 : 0;
        ctx.fillRect(-4 + eyeXOffset, headY + 5, 2, 2);
        ctx.fillRect(2 + eyeXOffset, headY + 5, 2, 2);

        // Eyebrows / Smirk if Jim
        if (isJimGaze) {
          ctx.fillStyle = '#4a5568';
          ctx.fillRect(-4, headY + 3, 3, 1); // Raised eyebrow
          ctx.fillRect(2, headY + 4, 3, 1);
          // Subtle smirk
          ctx.fillStyle = '#9b2c2c';
          ctx.fillRect(1, headY + 9, 3, 1);
        }

        // Glasses for Dwight
        if (visual.glasses) {
          ctx.strokeStyle = visual.glassesColor || '#4a5568';
          ctx.lineWidth = 1;
          ctx.strokeRect(-5, headY + 4, 4, 4);
          ctx.strokeRect(1, headY + 4, 4, 4);
          ctx.fillRect(-1, headY + 5, 2, 1); // Bridge
        }

        // Stanley's Mustache
        if (visual.facialHair === 'mustache') {
          ctx.fillStyle = '#1a202c';
          ctx.fillRect(-4, headY + 8, 8, 2);
        }
      } else if (facing === 'left') {
        ctx.fillRect(-4, headY + 5, 2, 2);
        if (visual.glasses) {
          ctx.strokeStyle = '#4a5568';
          ctx.strokeRect(-5, headY + 4, 3, 4);
        }
      } else if (facing === 'right') {
        ctx.fillRect(2, headY + 5, 2, 2);
        if (visual.glasses) {
          ctx.strokeStyle = '#4a5568';
          ctx.strokeRect(2, headY + 4, 3, 4);
        }
      }

      // Mouth (speaking animation toggle)
      if (state.currentSpeech && !isJimGaze) {
        const isMouthOpen = Math.floor(Date.now() / 150) % 2 === 0;
        ctx.fillStyle = '#742a2a';
        if (facing === 'down') {
          ctx.fillRect(-2, headY + 9, 4, isMouthOpen ? 2 : 1);
        } else if (facing === 'left') {
          ctx.fillRect(-4, headY + 9, 2, isMouthOpen ? 2 : 1);
        } else if (facing === 'right') {
          ctx.fillRect(2, headY + 9, 2, isMouthOpen ? 2 : 1);
        }
      }
    }

    // 7. Floating Emote Icon
    if (currentEmote) {
      this.drawEmoteBubble(ctx, currentEmote.icon, 0, headY - 14);
    }

    // 8. Name Tag
    if (showNameTag) {
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      const textMetrics = ctx.measureText(character.nickname || character.name.split(' ')[0]);
      const tagW = textMetrics.width + 6;
      const tagY = headY - 8;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(-tagW / 2, tagY - 8, tagW, 10);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.strokeRect(-tagW / 2, tagY - 8, tagW, 10);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(character.nickname || character.name.split(' ')[0], 0, tagY);
    }

    ctx.restore();
  }

  // Draw floating animated emote bubble
  private static drawEmoteBubble(
    ctx: CanvasRenderingContext2D,
    emote: EmoteIconType,
    x: number,
    y: number
  ) {
    const bounce = Math.sin(Date.now() / 120) * 2;
    const ey = y + bounce;

    ctx.save();
    // Bubble background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, ey, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Emote icon
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    switch (emote) {
      case 'exclamation':
        ctx.fillStyle = '#e53e3e';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('!', x, ey);
        break;
      case 'question':
        ctx.fillStyle = '#3182ce';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('?', x, ey);
        break;
      case 'rage':
        ctx.font = '10px serif';
        ctx.fillText('💢', x, ey);
        break;
      case 'sweat':
      case 'panic':
        ctx.font = '10px serif';
        ctx.fillText('💦', x, ey);
        break;
      case 'heart':
        ctx.font = '10px serif';
        ctx.fillText('❤️', x, ey);
        break;
      case 'laugh':
        ctx.font = '10px serif';
        ctx.fillText('😂', x, ey);
        break;
      case 'skull':
        ctx.font = '10px serif';
        ctx.fillText('💀', x, ey);
        break;
      case 'fire':
        ctx.font = '10px serif';
        ctx.fillText('🔥', x, ey);
        break;
      case 'dundie':
        ctx.font = '10px serif';
        ctx.fillText('🏆', x, ey);
        break;
      case 'coffee':
        ctx.font = '10px serif';
        ctx.fillText('☕', x, ey);
        break;
      case 'jello':
        ctx.font = '10px serif';
        ctx.fillText('🍮', x, ey);
        break;
      case 'camera':
        ctx.font = '10px serif';
        ctx.fillText('👀', x, ey);
        break;
      default:
        ctx.font = '10px serif';
        ctx.fillText('✨', x, ey);
    }

    ctx.restore();
  }
}
