import { CharacterDefinition, CharacterRuntimeState, HoldableItemType } from '../types/character';
import { Direction, EmoteIconType } from '../types/script';
import { spriteManager } from './SpriteManager';

/**
 * Pixel-safe hex color shading utility.
 * Darkens or lightens a hex color by a given percentage (-1.0 to 1.0).
 */
function shadeColor(hex: string, percent: number): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return hex;

  let r = (num >> 16) + Math.round(255 * percent);
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * percent);
  let b = (num & 0x0000ff) + Math.round(255 * percent);

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export class CharacterRenderer {
  public static drawCharacter(
    ctx: CanvasRenderingContext2D,
    character: CharacterDefinition,
    state: CharacterRuntimeState,
    showNameTag = true,
    gameTime?: number
  ) {
    const { visual } = character;
    const { x, y, facing, isMoving, animFrame, isSitting, currentEmote } = state;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (visual.heightScale && visual.heightScale > 0) {
      ctx.scale(1, Math.max(0.85, Math.min(1.15, visual.heightScale)));
    }

    const now = gameTime !== undefined ? gameTime : Date.now();
    // Unique seed based on character name length to desynchronize animations
    const charHash = character.id.charCodeAt(0) * 137;

    // Resolve active character state
    const charState =
      state.state ||
      (isSitting
        ? 'sitting_desk'
        : isMoving
        ? state.animSpeed && state.animSpeed < 0.12
          ? 'running'
          : 'walking'
        : 'idle');

    const isSittingState = isSitting || charState === 'sitting_desk' || charState === 'sitting_couch';
    const isRunning = charState === 'running';
    const isSneaking = charState === 'sneaking' || charState === 'tiptoeing';
    const isCowering = charState === 'cowering';
    const isShocked = charState === 'shocked';
    const isFallen = charState === 'fallen';
    const isTyping = charState === 'typing' || state.currentAction === 'type_pc';
    const isDrinking = charState === 'drinking' || state.currentAction === 'drink_coffee';
    const isEating = charState === 'eating' || state.currentAction === 'eat_pretzel' || state.currentAction === 'eat_snack';
    const isJimGaze = charState === 'camera_stare' || state.currentAction === 'jim_stare';

    // 1. Idle Breathing, Walking Bob & Running Lean
    const idleBreathing = !isMoving && !isSittingState ? Math.sin((now + charHash) / 380) * 0.8 : 0;
    // Harmonic sinusoidal walk bob: peaks at passing frames (frames 1 & 3), dips at contact (frames 0 & 2)
    const walkBob = isMoving ? (animFrame % 2 === 1 ? -2 : 0) : idleBreathing;
    const runLean = isRunning && isMoving ? (facing === 'left' ? -2 : facing === 'right' ? 2 : 0) : 0;

    // Panic/Shocked Tremble Jitter
    const shockJitterX = isShocked ? (Math.sin((now + charHash) * 0.05) > 0 ? 1 : -1) : 0;
    const shockJitterY = isShocked ? (Math.cos((now + charHash) * 0.05) > 0 ? 0.8 : -0.8) : 0;

    if (isShocked) {
      ctx.translate(shockJitterX, shockJitterY);
    }

    // Slapstick Fallen Rotation
    if (isFallen) {
      ctx.rotate(-Math.PI / 2);
      ctx.translate(0, 10);
    }

    // 2. Eye Blinking (blink every ~3.5s for 140ms, suppressed during camera stare / shock)
    const isBlinking = !isJimGaze && !isShocked && (now + charHash) % 3600 < 140;

    // 3. Shadow beneath character
    if (!isFallen) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, 14, 12, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Check if rich sprite asset is available from SpriteManager
    const spriteFrame = spriteManager.getCharacterFrame(
      character.id,
      facing,
      animFrame,
      isMoving,
      isSittingState,
      state.currentAction,
      charState
    );

    if (spriteFrame) {
      const { canvas, rect, scale, offsetX, offsetY } = spriteFrame;
      const destW = Math.round(rect.w * scale);
      const destH = Math.round(rect.h * scale);
      const destX = Math.round(-destW / 2 + (offsetX || 0));
      const destY = Math.round(-destH + 15 + walkBob + (isSittingState ? 5 : 0) + (offsetY || 0));

      ctx.imageSmoothingEnabled = false;

      // Handle horizontal mirroring for one-way sprite sheets (e.g. left facing)
      if (rect.flipX) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(
          canvas,
          rect.x,
          rect.y,
          rect.w,
          rect.h,
          -destX - destW,
          destY,
          destW,
          destH
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          canvas,
          rect.x,
          rect.y,
          rect.w,
          rect.h,
          destX,
          destY,
          destW,
          destH
        );
      }

      // Draw Held Item if present
      if (state.heldItem) {
        const itemX = facing === 'left' ? -11 : facing === 'right' ? 11 : 9;
        const itemY = 1 + walkBob;
        CharacterRenderer.drawHeldItem(ctx, state.heldItem, itemX, itemY, facing, now);
      }

      // Draw Floating Emote Bubble
      const headY = destY + 5;
      if (currentEmote) {
        CharacterRenderer.drawEmoteBubble(ctx, currentEmote.icon, 0, headY - 14, now);
      }

      // Draw Name Tag
      if (showNameTag && !isFallen) {
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        const displayName = character.nickname || character.name.split(' ')[0];
        const textMetrics = ctx.measureText(displayName);
        const tagW = textMetrics.width + 6;
        const tagY = headY - 8;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(-tagW / 2, tagY - 8, tagW, 10);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeRect(-tagW / 2, tagY - 8, tagW, 10);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(displayName, 0, tagY);
      }

      ctx.restore();
      return;
    }

    // 4. Procedural Rendering (scaled to match sprite character proportion)
    ctx.scale(1.4, 1.4);

    const strideMult = isRunning ? 1.4 : isSneaking ? 0.6 : 1.0;
    const crouchOffset = isCowering ? 3 : isSneaking ? 2 : 0;

    // --- LEGS & SHOES RENDERING ---
    if (!isSittingState && !isFallen) {
      if (facing === 'up' || facing === 'down') {
        // Front / Back Alternating Stride Kinematics
        // Frame 0: Left leg forward (+2px), Right leg back (-2px)
        // Frame 1: Neutral passing (0px)
        // Frame 2: Right leg forward (+2px), Left leg back (-2px)
        // Frame 3: Neutral passing (0px)
        const leftStrideY = isMoving ? (animFrame === 0 ? 2 * strideMult : animFrame === 2 ? -2 * strideMult : 0) : 0;
        const rightStrideY = isMoving ? (animFrame === 2 ? 2 * strideMult : animFrame === 0 ? -2 * strideMult : 0) : 0;

        const leftKneeLift = isMoving && animFrame === 1 ? -1 : 0;
        const rightKneeLift = isMoving && animFrame === 3 ? -1 : 0;

        ctx.fillStyle = visual.pantsColor;
        // Left Leg
        ctx.fillRect(-6, 4 + walkBob + crouchOffset + leftStrideY, 4, 8 + leftKneeLift);
        // Right Leg
        ctx.fillRect(2, 4 + walkBob + crouchOffset + rightStrideY, 4, 8 + rightKneeLift);

        // Shoes
        ctx.fillStyle = visual.shoesColor;
        ctx.fillRect(-7, 11 + walkBob + crouchOffset + leftStrideY + leftKneeLift, 5, 3);
        ctx.fillRect(2, 11 + walkBob + crouchOffset + rightStrideY + rightKneeLift, 5, 3);
      } else {
        // Profile View (Left / Right): Dual-Leg Kinematics
        // Near Leg (facing direction foreground) + Far Leg (shaded 28% darker background)
        const dirSign = facing === 'left' ? -1 : 1;

        let nearLegOffset = 0;
        let farLegOffset = 0;
        let nearKneeLift = 0;
        let farKneeLift = 0;

        if (isMoving) {
          if (animFrame === 0) {
            // Contact A: Near leg strides forward, far leg strides back
            nearLegOffset = 3.5 * strideMult * dirSign;
            farLegOffset = -3.5 * strideMult * dirSign;
          } else if (animFrame === 1) {
            // Passing A: Near leg straight under center, far leg knee lifted passing forward
            nearLegOffset = 0;
            farLegOffset = -1 * dirSign;
            farKneeLift = -2;
          } else if (animFrame === 2) {
            // Contact B: Far leg strides forward, near leg strides back
            nearLegOffset = -3.5 * strideMult * dirSign;
            farLegOffset = 3.5 * strideMult * dirSign;
          } else if (animFrame === 3) {
            // Passing B: Far leg straight under center, near leg knee lifted passing forward
            nearLegOffset = 1 * dirSign;
            farLegOffset = 0;
            nearKneeLift = -2;
          }
        }

        const farPantsColor = shadeColor(visual.pantsColor, -0.28);
        const farShoeColor = shadeColor(visual.shoesColor, -0.28);

        // 1. Far Leg (Background)
        ctx.fillStyle = farPantsColor;
        ctx.fillRect(-2 + farLegOffset, 4 + walkBob + crouchOffset + farKneeLift, 4, 8);
        ctx.fillStyle = farShoeColor;
        const farShoeDir = facing === 'left' ? -4 : 1;
        ctx.fillRect(farShoeDir + farLegOffset, 11 + walkBob + crouchOffset + farKneeLift, 5, 3);

        // 2. Near Leg (Foreground)
        ctx.fillStyle = visual.pantsColor;
        ctx.fillRect(-3 + nearLegOffset, 4 + walkBob + crouchOffset + nearKneeLift, 4, 8);
        ctx.fillStyle = visual.shoesColor;
        const nearShoeDir = facing === 'left' ? -5 : 2;
        ctx.fillRect(nearShoeDir + nearLegOffset, 11 + walkBob + crouchOffset + nearKneeLift, 5, 3);
      }
    } else if (isSittingState) {
      // Sitting legs (tucked seated posture for office chairs / conference desks)
      ctx.fillStyle = visual.pantsColor;
      ctx.fillRect(-5, 6 + crouchOffset, 10, 5);
      ctx.fillStyle = visual.shoesColor;
      ctx.fillRect(-6, 10 + crouchOffset, 12, 3);
    }

    // --- TORSO & CLOTHES ---
    const torsoY = -6 + walkBob + crouchOffset + (isCowering ? 2 : 0);
    const bodyW = visual.bodyType === 'large' ? 16 : visual.bodyType === 'petite' ? 10 : 13;
    const bodyHalf = bodyW / 2;

    ctx.save();
    if (runLean !== 0) {
      ctx.translate(runLean, 0);
    }

    // Base shirt / jacket
    ctx.fillStyle = visual.shirtColor;
    ctx.fillRect(-bodyHalf, torsoY, bodyW, 11);

    // Collar / Cardigan / Sweater / ID Badge / Tie details
    if (visual.accessory === 'cardigan') {
      ctx.fillStyle = '#f8fafc'; // Inner blouse
      ctx.fillRect(-2, torsoY, 4, 6);
      ctx.fillStyle = visual.shirtColor; // Cardigan lapels
      ctx.fillRect(-bodyHalf, torsoY, 3, 10);
      ctx.fillRect(bodyHalf - 3, torsoY, 3, 10);
    } else if (visual.accessory === 'sweater') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(-bodyHalf, torsoY, bodyW, 2);
      ctx.fillRect(-bodyHalf, torsoY + 9, bodyW, 2);
    } else if (visual.tieColor && (facing === 'down' || facing === 'left' || facing === 'right')) {
      ctx.fillStyle = visual.tieColor;
      ctx.fillRect(-1.5, torsoY + 2, 3, 8);
      ctx.fillRect(-1, torsoY + 10, 2, 2);
    }

    // ID Badge accessory overlay
    if (visual.accessory === 'id_badge' && (facing === 'down' || facing === 'left' || facing === 'right')) {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-1, torsoY, 2, 5); // Lanyard
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-2, torsoY + 4, 4, 5); // Badge card
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-1.5, torsoY + 5, 3, 2); // Photo
    }

    // --- ARMS & HAND ACCESSORIES ---
    const armY = torsoY + 1;
    ctx.fillStyle = visual.shirtColor;

    if (facing === 'down' || facing === 'up') {
      // Harmonic counter-swinging arms
      let leftArmSwing = 0;
      let rightArmSwing = 0;

      if (isShocked) {
        // Raised hands in alarm
        leftArmSwing = -4;
        rightArmSwing = -4;
      } else if (isCowering) {
        // Hands shielding head
        leftArmSwing = -6;
        rightArmSwing = -6;
      } else if (isTyping) {
        // Rapid keyboard tapping
        const tap = Math.sin(now * 0.02) > 0 ? 1 : -1;
        leftArmSwing = 3 + tap;
        rightArmSwing = 3 - tap;
      } else if (isMoving) {
        leftArmSwing = animFrame === 0 ? -3 * strideMult : animFrame === 2 ? 3 * strideMult : 0;
        rightArmSwing = animFrame === 0 ? 3 * strideMult : animFrame === 2 ? -3 * strideMult : 0;
      }

      // Left Arm
      ctx.fillRect(-bodyHalf - 3, armY + leftArmSwing, 3, 8);
      // Right Arm
      ctx.fillRect(bodyHalf, armY + rightArmSwing, 3, 8);

      // Hands
      ctx.fillStyle = visual.skinColor;
      ctx.fillRect(-bodyHalf - 3, armY + 7 + leftArmSwing, 3, 3);
      ctx.fillRect(bodyHalf, armY + 7 + rightArmSwing, 3, 3);

      // Idle Michael Coffee Mug
      if (character.id === 'michael' && !isMoving && facing === 'down' && !state.heldItem) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bodyHalf + 1, armY + 5, 4, 4);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(bodyHalf + 1, armY + 5, 4, 1);
      }

      // Render Dynamic Inventory Held Item
      if (state.heldItem) {
        const itemX = facing === 'down' ? bodyHalf + 1 : -bodyHalf - 4;
        const itemY = armY + 6 + rightArmSwing;
        CharacterRenderer.drawHeldItem(ctx, state.heldItem, itemX, itemY, facing, now);
      }
    } else {
      // Side View Arms
      let armSwing = 0;
      if (isShocked) {
        armSwing = -4;
      } else if (isCowering) {
        armSwing = -6;
      } else if (isTyping) {
        armSwing = 4 + (Math.sin(now * 0.02) > 0 ? 1 : 0);
      } else if (isMoving) {
        armSwing = animFrame === 0 ? -3 * strideMult : animFrame === 2 ? 3 * strideMult : 0;
      }

      ctx.fillRect(-2 + armSwing, armY, 4, 8);
      ctx.fillStyle = visual.skinColor;
      ctx.fillRect(-2 + armSwing, armY + 7, 4, 3);

      if (state.heldItem) {
        const itemX = facing === 'right' ? 3 : -6;
        const itemY = armY + 7 + armSwing;
        CharacterRenderer.drawHeldItem(ctx, state.heldItem, itemX, itemY, facing, now);
      }
    }

    ctx.restore(); // Restore runLean

    // --- HEAD & FACIAL FEATURES ---
    const headY = -19 + walkBob + crouchOffset + (isCowering ? 3 : 0);
    const headW = 12;
    const headH = 13;

    // Face skin
    ctx.fillStyle = visual.skinColor;
    ctx.fillRect(-headW / 2, headY, headW, headH);

    // Hair Top & Back
    ctx.fillStyle = visual.hairColor;

    if (facing === 'up') {
      // Back of head
      ctx.fillRect(-headW / 2 - 1, headY - 2, headW + 2, headH - 2);
      if (visual.hairStyle === 'curls' || visual.hairStyle === 'floppy') {
        ctx.fillRect(-headW / 2 - 2, headY, headW + 4, headH);
      }
      if (visual.hairStyle === 'tight_bun') {
        ctx.fillRect(-3, headY - 6, 6, 5); // Angela's bun
      }
      if (visual.hairStyle === 'slicked') {
        ctx.fillRect(-headW / 2 - 1, headY - 2, headW + 2, headH);
      }
      if (visual.hairStyle === 'wild') {
        ctx.fillRect(-headW / 2 - 3, headY - 4, headW + 6, headH + 2);
      }
    } else {
      // Front & Profile Hair Top
      ctx.fillRect(-headW / 2 - 1, headY - 2, headW + 2, 4);

      if (visual.hairStyle === 'middle_part') {
        ctx.fillRect(-headW / 2 - 1, headY, 5, 7);
        ctx.fillRect(headW / 2 - 4, headY, 5, 7);
      } else if (visual.hairStyle === 'floppy') {
        ctx.fillRect(-headW / 2 - 2, headY, 6, 8);
        ctx.fillRect(headW / 2 - 3, headY, 4, 6);
        ctx.fillRect(-3, headY - 3, 8, 3);
      } else if (visual.hairStyle === 'curls') {
        ctx.fillRect(-headW / 2 - 2, headY, 4, headH + 2);
        ctx.fillRect(headW / 2 - 2, headY, 4, headH + 2);
      } else if (visual.hairStyle === 'tight_bun') {
        ctx.fillRect(-headW / 2 - 1, headY, headW + 2, 3);
        ctx.fillRect(-3, headY - 5, 6, 4);
      } else if (visual.hairStyle === 'balding') {
        ctx.fillRect(-headW / 2 - 1, headY + 3, 3, 5);
        ctx.fillRect(headW / 2 - 2, headY + 3, 3, 5);
      } else if (visual.hairStyle === 'slicked') {
        ctx.fillRect(-headW / 2 - 1, headY - 3, headW + 2, 5);
        ctx.fillRect(-headW / 2 - 1, headY + 1, 3, 6);
        ctx.fillRect(headW / 2 - 2, headY + 1, 3, 6);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(-headW / 2 + 2, headY - 2, headW - 4, 1);
        ctx.fillStyle = visual.hairColor;
      } else if (visual.hairStyle === 'wild') {
        ctx.fillRect(-headW / 2 - 3, headY - 5, headW + 6, 6);
        ctx.fillRect(-headW / 2 - 3, headY - 1, 4, 8);
        ctx.fillRect(headW / 2 - 1, headY - 1, 4, 8);
        ctx.fillRect(-headW / 2 - 1, headY - 6, 5, 3);
        ctx.fillRect(headW / 2 - 4, headY - 6, 5, 3);
      } else {
        ctx.fillRect(-headW / 2 - 1, headY, headW + 2, 4);
      }

      // Active emotion for facial expression
      const emotion = state.currentSpeech?.emotion || (isShocked ? 'panic' : 'neutral');

      // Eyebrows based on emotion
      if (facing === 'down' || isJimGaze) {
        if (isJimGaze) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(-4, headY + 3, 3, 1);
          ctx.fillRect(2, headY + 4, 3, 1);
        } else if (emotion === 'angry') {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-5, headY + 3, 3, 1);
          ctx.fillRect(-3, headY + 4, 1, 1);
          ctx.fillRect(2, headY + 4, 1, 1);
          ctx.fillRect(3, headY + 3, 3, 1);
        } else if (emotion === 'panic' || emotion === 'shock' || isShocked) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-5, headY + 2, 3, 1);
          ctx.fillRect(2, headY + 2, 3, 1);
        } else if (emotion === 'happy' || emotion === 'proud') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(-4, headY + 3, 2, 1);
          ctx.fillRect(2, headY + 3, 2, 1);
        } else if (emotion === 'smirk' || emotion === 'smug') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(-4, headY + 4, 2, 1);
          ctx.fillRect(2, headY + 3, 3, 1);
        } else if (emotion === 'cry' || emotion === 'cringe') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(-5, headY + 4, 1, 1);
          ctx.fillRect(-4, headY + 3, 2, 1);
          ctx.fillRect(2, headY + 3, 2, 1);
          ctx.fillRect(4, headY + 4, 1, 1);
        } else if (emotion === 'confused') {
          ctx.fillStyle = '#334155';
          ctx.fillRect(-4, headY + 2, 3, 1);
          ctx.fillRect(2, headY + 4, 3, 1);
        } else {
          ctx.fillStyle = '#475569';
          ctx.fillRect(-4, headY + 4, 2, 1);
          ctx.fillRect(2, headY + 4, 2, 1);
        }

        // Eyes based on blinking & emotion
        if (!isBlinking) {
          if (emotion === 'panic' || emotion === 'shock' || isShocked) {
            // Wide open alarmed eyes with white sclera + black pupil
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-5, headY + 4, 3, 3);
            ctx.fillRect(2, headY + 4, 3, 3);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-4, headY + 5, 1, 1);
            ctx.fillRect(3, headY + 5, 1, 1);
          } else if (emotion === 'happy' || emotion === 'proud') {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-4, headY + 5, 2, 1);
            ctx.fillRect(-5, headY + 6, 1, 1);
            ctx.fillRect(-2, headY + 6, 1, 1);
            ctx.fillRect(2, headY + 5, 2, 1);
            ctx.fillRect(1, headY + 6, 1, 1);
            ctx.fillRect(4, headY + 6, 1, 1);
          } else if (emotion === 'cry') {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-5, headY + 5, 3, 1);
            ctx.fillRect(2, headY + 5, 3, 1);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-5, headY + 7, 1, 2);
            ctx.fillRect(4, headY + 7, 1, 2);
          } else {
            ctx.fillStyle = '#0f172a';
            const eyeXOffset = isJimGaze ? 1 : 0;
            ctx.fillRect(-4 + eyeXOffset, headY + 5, 2, 2);
            ctx.fillRect(2 + eyeXOffset, headY + 5, 2, 2);
          }
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-4, headY + 6, 2, 1);
          ctx.fillRect(2, headY + 6, 2, 1);
        }

        // Glasses for Dwight
        if (visual.glasses) {
          ctx.strokeStyle = visual.glassesColor || '#475569';
          ctx.lineWidth = 1;
          ctx.strokeRect(-5, headY + 4, 4, 4);
          ctx.strokeRect(1, headY + 4, 4, 4);
          ctx.fillRect(-1, headY + 5, 2, 1);
        }

        // Facial Hair
        if (visual.facialHair === 'mustache') {
          ctx.fillStyle = visual.hairColor || '#0f172a';
          ctx.fillRect(-4, headY + 8, 8, 2);
        } else if (visual.facialHair === 'stubble') {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.fillRect(-5, headY + 8, 10, 4);
          ctx.fillStyle = visual.skinColor;
          ctx.fillRect(-2, headY + 8, 4, 2);
        } else if (visual.facialHair === 'beard') {
          ctx.fillStyle = visual.hairColor || '#0f172a';
          ctx.fillRect(-5, headY + 8, 10, 5);
          ctx.fillRect(-4, headY + 13, 8, 2);
          ctx.fillRect(-5, headY + 5, 2, 4);
          ctx.fillRect(3, headY + 5, 2, 4);
        }
      } else if (facing === 'left') {
        if (!isBlinking) {
          if (emotion === 'happy' || emotion === 'proud') {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-4, headY + 5, 2, 1);
            ctx.fillRect(-5, headY + 6, 1, 1);
          } else if (emotion === 'panic' || emotion === 'shock' || isShocked) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-5, headY + 4, 3, 3);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-4, headY + 5, 1, 1);
          } else {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-4, headY + 5, 2, 2);
          }
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-4, headY + 6, 2, 1);
        }
        if (visual.glasses) {
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(-5, headY + 4, 3, 4);
        }
        if (visual.facialHair === 'mustache') {
          ctx.fillStyle = visual.hairColor || '#0f172a';
          ctx.fillRect(-5, headY + 8, 4, 2);
        } else if (visual.facialHair === 'stubble') {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.fillRect(-5, headY + 8, 5, 4);
        } else if (visual.facialHair === 'beard') {
          ctx.fillStyle = visual.hairColor || '#0f172a';
          ctx.fillRect(-5, headY + 7, 5, 6);
        }
      } else if (facing === 'right') {
        if (!isBlinking) {
          if (emotion === 'happy' || emotion === 'proud') {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(2, headY + 5, 2, 1);
            ctx.fillRect(4, headY + 6, 1, 1);
          } else if (emotion === 'panic' || emotion === 'shock' || isShocked) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(2, headY + 4, 3, 3);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(3, headY + 5, 1, 1);
          } else {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(2, headY + 5, 2, 2);
          }
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(2, headY + 6, 2, 1);
        }
        if (visual.glasses) {
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(2, headY + 4, 3, 4);
        }
        if (visual.facialHair === 'mustache') {
          ctx.fillStyle = visual.hairColor || '#0f172a';
          ctx.fillRect(1, headY + 8, 4, 2);
        } else if (visual.facialHair === 'stubble') {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.fillRect(0, headY + 8, 5, 4);
        } else if (visual.facialHair === 'beard') {
          ctx.fillStyle = visual.hairColor || '#0f172a';
          ctx.fillRect(0, headY + 7, 5, 6);
        }
      }

      // Mouth rendering (speaking animation, drinking, or resting expression)
      if (state.currentSpeech && !isJimGaze) {
        const isMouthOpen = Math.floor(now / 140) % 2 === 0;
        ctx.fillStyle = '#881337';
        if (facing === 'down') {
          if (emotion === 'angry') {
            ctx.fillRect(-3, headY + 9, 6, isMouthOpen ? 3 : 2);
          } else if (emotion === 'happy' || emotion === 'proud') {
            ctx.fillRect(-3, headY + 8, 6, 1);
            ctx.fillRect(-2, headY + 9, 4, isMouthOpen ? 2 : 1);
          } else if (emotion === 'panic' || emotion === 'shock' || isShocked) {
            ctx.fillRect(-2, headY + 8, 4, isMouthOpen ? 3 : 2);
          } else if (emotion === 'smirk' || emotion === 'smug') {
            ctx.fillRect(0, headY + 9, 3, isMouthOpen ? 2 : 1);
          } else if (emotion === 'cry' || emotion === 'cringe') {
            ctx.fillRect(-3, headY + 10, 6, 1);
            ctx.fillRect(-3, headY + 9, 1, 1);
            ctx.fillRect(2, headY + 9, 1, 1);
          } else {
            ctx.fillRect(-2, headY + 9, 4, isMouthOpen ? 2 : 1);
          }
        } else if (facing === 'left') {
          ctx.fillRect(-4, headY + 9, 2, isMouthOpen ? 2 : 1);
        } else if (facing === 'right') {
          ctx.fillRect(2, headY + 9, 2, isMouthOpen ? 2 : 1);
        }
      } else if (isJimGaze) {
        // Jim's classic raised smirk
        ctx.fillStyle = '#881337';
        ctx.fillRect(1, headY + 9, 3, 1);
      } else if (facing === 'down') {
        if (emotion === 'happy' || emotion === 'proud') {
          ctx.fillStyle = '#881337';
          ctx.fillRect(-2, headY + 9, 4, 1);
          ctx.fillRect(-3, headY + 8, 1, 1);
          ctx.fillRect(2, headY + 8, 1, 1);
        } else if (emotion === 'smirk' || emotion === 'smug') {
          ctx.fillStyle = '#881337';
          ctx.fillRect(0, headY + 9, 3, 1);
          ctx.fillRect(2, headY + 8, 1, 1);
        } else if (emotion === 'deadpan') {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(-2, headY + 9, 4, 1);
        }
      }
    }

    // 9. Floating Emote Bubble
    if (currentEmote) {
      CharacterRenderer.drawEmoteBubble(ctx, currentEmote.icon, 0, headY - 14, now);
    }

    // 10. Name Tag
    if (showNameTag && !isFallen) {
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      const displayName = character.nickname || character.name.split(' ')[0];
      const textMetrics = ctx.measureText(displayName);
      const tagW = textMetrics.width + 6;
      const tagY = headY - 8;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(-tagW / 2, tagY - 8, tagW, 10);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.strokeRect(-tagW / 2, tagY - 8, tagW, 10);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(displayName, 0, tagY);
    }

    ctx.restore();
  }

  // Draw floating animated emote bubble with smooth bounce
  private static drawEmoteBubble(
    ctx: CanvasRenderingContext2D,
    emote: EmoteIconType,
    x: number,
    y: number,
    now: number = Date.now()
  ) {
    const bounce = Math.sin(now / 120) * 2.5;
    const ey = y + bounce;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, ey, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    switch (emote) {
      case 'exclamation':
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('!', x, ey);
        break;
      case 'question':
        ctx.fillStyle = '#2563eb';
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
      case 'money':
        ctx.font = '10px serif';
        ctx.fillText('💰', x, ey);
        break;
      case 'lightbulb':
        ctx.font = '10px serif';
        ctx.fillText('💡', x, ey);
        break;
      default:
        ctx.font = '10px serif';
        ctx.fillText('✨', x, ey);
    }

    ctx.restore();
  }

  // Draw Held Inventory Items with optional cyclic drinking / eating animation
  public static drawHeldItem(
    ctx: CanvasRenderingContext2D,
    item: HoldableItemType,
    hx: number,
    hy: number,
    facing: Direction,
    now = Date.now()
  ) {
    ctx.save();

    switch (item) {
      case 'dundie_trophy': {
        // Golden Dundie Trophy held high!
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(hx - 1, hy - 8, 3, 7);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(hx - 2, hy - 11, 5, 3); // Figure
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(hx - 3, hy - 1, 7, 3); // Marble base
        break;
      }

      case 'coffee_mug': {
        // Ceramic Coffee Mug with steam
        // Every 3.5s, subtle sip animation
        const isSipping = (now % 3500) < 800;
        const sipY = isSipping ? hy - 4 : hy;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 2, sipY - 3, 5, 5);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(hx - 2, sipY - 3, 5, 1);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(hx - 1, sipY - 6, 2, 2);
        break;
      }

      case 'jello_stapler': {
        // Jello Mold with Stapler
        ctx.fillStyle = 'rgba(34, 197, 94, 0.85)';
        ctx.fillRect(hx - 3, hy - 5, 8, 7);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(hx - 1, hy - 3, 4, 3);
        break;
      }

      case 'pizza_box': {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(hx - 7, hy - 2, 14, 4);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(hx - 5, hy - 1, 10, 2);
        break;
      }

      case 'clipboard': {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(hx - 3, hy - 6, 7, 9);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 2, hy - 4, 5, 6);
        break;
      }

      case 'fire_extinguisher': {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(hx - 2, hy - 6, 5, 9);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(hx - 1, hy - 8, 3, 2);
        break;
      }

      case 'pretzel': {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(hx - 3, hy - 4, 6, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 2, hy - 3, 1, 1);
        ctx.fillRect(hx + 1, hy - 2, 1, 1);
        break;
      }

      case 'paper_sheet': {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 3, hy - 5, 6, 7);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(hx - 2, hy - 4, 4, 1);
        break;
      }
    }

    ctx.restore();
  }
}
