import { CharacterDefinition, CharacterRuntimeState, HoldableItemType } from '../types/character';
import { Direction, EmoteIconType } from '../types/script';
import { spriteManager } from './SpriteManager';

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

    // 1. Idle Breathing & Walking Bob
    const idleBreathing = !isMoving ? Math.sin((now + charHash) / 380) * 0.8 : 0;
    const walkBob = isMoving ? (animFrame % 2 === 0 ? 0 : -2) : idleBreathing;
    const isJimGaze = state.currentAction === 'jim_stare';

    // 2. Eye Blinking (blink every ~3.5s for 140ms)
    const isBlinking = !isJimGaze && ((now + charHash) % 3600 < 140);

    // 3. Shadow beneath character
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 12, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Check if rich sprite asset is available from SpriteManager
    const spriteFrame = spriteManager.getCharacterFrame(
      character.id,
      facing,
      animFrame,
      isMoving,
      isSitting,
      state.currentAction
    );

    if (spriteFrame) {
      const { canvas, rect, scale } = spriteFrame;
      const destW = Math.round(rect.w * scale);
      const destH = Math.round(rect.h * scale);
      const destX = Math.round(-destW / 2);
      const destY = Math.round(-destH + 15 + walkBob + (isSitting ? 5 : 0));

      ctx.imageSmoothingEnabled = false;
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

      // Draw Held Item if present
      if (state.heldItem) {
        const itemX = facing === 'left' ? -11 : facing === 'right' ? 11 : 9;
        const itemY = 1 + walkBob;
        this.drawHeldItem(ctx, state.heldItem, itemX, itemY, facing);
      }

      // Draw Floating Emote Bubble
      const headY = destY + 5;
      if (currentEmote) {
        this.drawEmoteBubble(ctx, currentEmote.icon, 0, headY - 14, now);
      }

      // Draw Name Tag
      if (showNameTag) {
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

    // 4. Procedural Fallback Rendering (scaled to match sprite character proportion)
    ctx.scale(1.4, 1.4);

    // Legs & Shoes
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
      // Sitting legs (tucked seated posture)
      ctx.fillStyle = visual.pantsColor;
      ctx.fillRect(-5, 6, 10, 5);
      ctx.fillStyle = visual.shoesColor;
      ctx.fillRect(-6, 10, 12, 3);
    }

    // 5. Torso & Clothes
    const torsoY = -6 + walkBob;
    const bodyW = visual.bodyType === 'large' ? 16 : visual.bodyType === 'petite' ? 10 : 13;
    const bodyHalf = bodyW / 2;

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
      // Knit ribbed sweater texture
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(-bodyHalf, torsoY, bodyW, 2);
      ctx.fillRect(-bodyHalf, torsoY + 9, bodyW, 2);
    } else if (visual.tieColor && (facing === 'down' || facing === 'left' || facing === 'right')) {
      // Tie
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

    // 6. Arms & Hand Accessories
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

      // Michael holding his coffee mug when idle (if no other heldItem)
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
        CharacterRenderer.drawHeldItem(ctx, state.heldItem, itemX, itemY, facing);
      }
    } else {
      // Side arm
      const armSwing = isMoving ? (animFrame % 2 === 1 ? 2 : -2) : 0;
      ctx.fillRect(-2 + armSwing, armY, 4, 8);
      ctx.fillStyle = visual.skinColor;
      ctx.fillRect(-2 + armSwing, armY + 7, 4, 3);

      if (state.heldItem) {
        const itemX = facing === 'right' ? 3 : -6;
        const itemY = armY + 7 + armSwing;
        CharacterRenderer.drawHeldItem(ctx, state.heldItem, itemX, itemY, facing);
      }
    }

    // 7. Head
    const headY = -19 + walkBob;
    const headW = 12;
    const headH = 13;

    // Face skin
    ctx.fillStyle = visual.skinColor;
    ctx.fillRect(-headW / 2, headY, headW, headH);

    // 8. Hair & Facial Features
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
      if (visual.hairStyle === 'slicked') {
        ctx.fillRect(-headW / 2 - 1, headY - 2, headW + 2, headH);
      }
      if (visual.hairStyle === 'wild') {
        ctx.fillRect(-headW / 2 - 3, headY - 4, headW + 6, headH + 2);
      }
    } else {
      // Hair top
      ctx.fillRect(-headW / 2 - 1, headY - 2, headW + 2, 4);

      if (visual.hairStyle === 'middle_part') {
        // Dwight's center part
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
      } else if (visual.hairStyle === 'slicked') {
        // Gavin Belson / Don Draper slicked back hair
        ctx.fillRect(-headW / 2 - 1, headY - 3, headW + 2, 5);
        ctx.fillRect(-headW / 2 - 1, headY + 1, 3, 6);
        ctx.fillRect(headW / 2 - 2, headY + 1, 3, 6);
        // Glossy shine highlight line
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(-headW / 2 + 2, headY - 2, headW - 4, 1);
        ctx.fillStyle = visual.hairColor;
      } else if (visual.hairStyle === 'wild') {
        // Kramer / Erlich Bachman wild voluminous hair
        ctx.fillRect(-headW / 2 - 3, headY - 5, headW + 6, 6);
        ctx.fillRect(-headW / 2 - 3, headY - 1, 4, 8);
        ctx.fillRect(headW / 2 - 1, headY - 1, 4, 8);
        ctx.fillRect(-headW / 2 - 1, headY - 6, 5, 3);
        ctx.fillRect(headW / 2 - 4, headY - 6, 5, 3);
      } else {
        ctx.fillRect(-headW / 2 - 1, headY, headW + 2, 4);
      }

      // Active emotion for facial expression
      const emotion = state.currentSpeech?.emotion || 'neutral';

      // Eyebrows based on emotion
      if (facing === 'down' || isJimGaze) {
        if (isJimGaze) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(-4, headY + 3, 3, 1);
          ctx.fillRect(2, headY + 4, 3, 1);
        } else if (emotion === 'angry') {
          // Sharp V-angled fierce eyebrows
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-5, headY + 3, 3, 1);
          ctx.fillRect(-3, headY + 4, 1, 1);
          ctx.fillRect(2, headY + 4, 1, 1);
          ctx.fillRect(3, headY + 3, 3, 1);
        } else if (emotion === 'panic' || emotion === 'shock') {
          // High arched panic brows
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-5, headY + 2, 3, 1);
          ctx.fillRect(2, headY + 2, 3, 1);
        } else if (emotion === 'happy' || emotion === 'proud') {
          // Uplifted cheerful brows
          ctx.fillStyle = '#334155';
          ctx.fillRect(-4, headY + 3, 2, 1);
          ctx.fillRect(2, headY + 3, 2, 1);
        } else if (emotion === 'smirk' || emotion === 'smug') {
          // Asymmetric raised brow
          ctx.fillStyle = '#334155';
          ctx.fillRect(-4, headY + 4, 2, 1);
          ctx.fillRect(2, headY + 3, 3, 1);
        } else if (emotion === 'cry' || emotion === 'cringe') {
          // Sad furrowed brows
          ctx.fillStyle = '#334155';
          ctx.fillRect(-5, headY + 4, 1, 1);
          ctx.fillRect(-4, headY + 3, 2, 1);
          ctx.fillRect(2, headY + 3, 2, 1);
          ctx.fillRect(4, headY + 4, 1, 1);
        } else if (emotion === 'confused') {
          // One high, one low
          ctx.fillStyle = '#334155';
          ctx.fillRect(-4, headY + 2, 3, 1);
          ctx.fillRect(2, headY + 4, 3, 1);
        } else {
          // Neutral/deadpan brows
          ctx.fillStyle = '#475569';
          ctx.fillRect(-4, headY + 4, 2, 1);
          ctx.fillRect(2, headY + 4, 2, 1);
        }

        // Eyes based on blinking & emotion
        if (!isBlinking) {
          if (emotion === 'panic' || emotion === 'shock') {
            // Wide open alarmed eyes with white sclera + black pupil
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-5, headY + 4, 3, 3);
            ctx.fillRect(2, headY + 4, 3, 3);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-4, headY + 5, 1, 1);
            ctx.fillRect(3, headY + 5, 1, 1);
          } else if (emotion === 'happy' || emotion === 'proud') {
            // Cheerful squint eyes ^ ^
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-4, headY + 5, 2, 1);
            ctx.fillRect(-5, headY + 6, 1, 1);
            ctx.fillRect(-2, headY + 6, 1, 1);
            ctx.fillRect(2, headY + 5, 2, 1);
            ctx.fillRect(1, headY + 6, 1, 1);
            ctx.fillRect(4, headY + 6, 1, 1);
          } else if (emotion === 'cry') {
            // Closed weeping eyes with tears
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-5, headY + 5, 3, 1);
            ctx.fillRect(2, headY + 5, 3, 1);
            // Blue tears
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-5, headY + 7, 1, 2);
            ctx.fillRect(4, headY + 7, 1, 2);
          } else {
            // Standard eyes
            ctx.fillStyle = '#0f172a';
            const eyeXOffset = isJimGaze ? 1 : 0;
            ctx.fillRect(-4 + eyeXOffset, headY + 5, 2, 2);
            ctx.fillRect(2 + eyeXOffset, headY + 5, 2, 2);
          }
        } else {
          // Blinking eyes (horizontal slit)
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
          // 5 o'clock shadow
          ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.fillRect(-5, headY + 8, 10, 4);
          ctx.fillStyle = visual.skinColor;
          ctx.fillRect(-2, headY + 8, 4, 2); // clear mouth opening
        } else if (visual.facialHair === 'beard') {
          // Full thick beard
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
          } else if (emotion === 'panic' || emotion === 'shock') {
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
          } else if (emotion === 'panic' || emotion === 'shock') {
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

      // Mouth rendering (speaking animation or resting expression)
      if (state.currentSpeech && !isJimGaze) {
        const isMouthOpen = Math.floor(now / 140) % 2 === 0;
        ctx.fillStyle = '#881337';
        if (facing === 'down') {
          if (emotion === 'angry') {
            // Wide shouting mouth
            ctx.fillRect(-3, headY + 9, 6, isMouthOpen ? 3 : 2);
          } else if (emotion === 'happy' || emotion === 'proud') {
            // Cheerful open smile
            ctx.fillRect(-3, headY + 8, 6, 1);
            ctx.fillRect(-2, headY + 9, 4, isMouthOpen ? 2 : 1);
          } else if (emotion === 'panic' || emotion === 'shock') {
            // O-shaped gasp mouth
            ctx.fillRect(-2, headY + 8, 4, isMouthOpen ? 3 : 2);
          } else if (emotion === 'smirk' || emotion === 'smug') {
            // Sideways speaking
            ctx.fillRect(0, headY + 9, 3, isMouthOpen ? 2 : 1);
          } else if (emotion === 'cry' || emotion === 'cringe') {
            // Downturned mouth
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
        // Jim's raised smirk
        ctx.fillStyle = '#881337';
        ctx.fillRect(1, headY + 9, 3, 1);
      } else if (facing === 'down') {
        // Resting subtle mouth expression when not actively speaking
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
      this.drawEmoteBubble(ctx, currentEmote.icon, 0, headY - 14, now);
    }

    // 10. Name Tag
    if (showNameTag) {
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

  // Draw Held Inventory Items
  public static drawHeldItem(
    ctx: CanvasRenderingContext2D,
    item: HoldableItemType,
    hx: number,
    hy: number,
    facing: Direction
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
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 2, hy - 3, 5, 5);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(hx - 2, hy - 3, 5, 1);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(hx - 1, hy - 6, 2, 2);
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
        // Pizza Box
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(hx - 7, hy - 2, 14, 4);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(hx - 5, hy - 1, 10, 2);
        break;
      }

      case 'clipboard': {
        // Clipboard
        ctx.fillStyle = '#78350f';
        ctx.fillRect(hx - 3, hy - 6, 7, 9);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 2, hy - 4, 5, 6);
        break;
      }

      case 'fire_extinguisher': {
        // Red Extinguisher
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(hx - 2, hy - 6, 5, 9);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(hx - 1, hy - 8, 3, 2);
        break;
      }

      case 'pretzel': {
        // Soft Pretzel
        ctx.fillStyle = '#b45309';
        ctx.fillRect(hx - 3, hy - 4, 6, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 2, hy - 3, 1, 1);
        ctx.fillRect(hx + 1, hy - 2, 1, 1);
        break;
      }

      case 'paper_sheet': {
        // Paper Document
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
