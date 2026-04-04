import {
  Component,
  inject,
  OnDestroy,
  effect,
  signal,
  HostListener,
  ElementRef,
} from '@angular/core';
import { TourService } from '../../../core/services/tour.service';

@Component({
  selector: 'app-tour-overlay',
  standalone: true,
  template: `
    @if (tourService.isActive() && tourService.currentStep) {
      <!-- Backdrop with spotlight cutout -->
      <div class="tour-overlay" (click)="onOverlayClick($event)">
        <!-- SVG mask for spotlight -->
        <svg class="tour-svg">
          <defs>
            <mask id="tour-spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                [attr.x]="spotlightX()"
                [attr.y]="spotlightY()"
                [attr.width]="spotlightW()"
                [attr.height]="spotlightH()"
                rx="12"
                ry="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.65)"
            mask="url(#tour-spotlight-mask)"
          />
        </svg>

        <!-- Spotlight border glow -->
        <div
          class="tour-spotlight-ring"
          [style.left.px]="spotlightX() - 4"
          [style.top.px]="spotlightY() - 4"
          [style.width.px]="spotlightW() + 8"
          [style.height.px]="spotlightH() + 8"
        ></div>

        <!-- Tooltip -->
        <div
          class="tour-tooltip"
          [style.left.px]="tooltipX()"
          [style.top.px]="tooltipY()"
          [class.tour-tooltip-appear]="true"
        >
          <!-- Arrow -->
          <div
            class="tour-arrow"
            [class.tour-arrow-top]="arrowPosition() === 'top'"
            [class.tour-arrow-bottom]="arrowPosition() === 'bottom'"
            [class.tour-arrow-left]="arrowPosition() === 'left'"
            [class.tour-arrow-right]="arrowPosition() === 'right'"
          ></div>

          <div class="tour-tooltip-content">
            <div class="tour-tooltip-header">
              <h3 class="tour-tooltip-title">{{ tourService.currentStep.title }}</h3>
              <button
                class="tour-tooltip-close"
                (click)="tourService.skipTour()"
                title="Skip tour"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p class="tour-tooltip-desc">{{ tourService.currentStep.description }}</p>

            <div class="tour-tooltip-footer">
              <span class="tour-tooltip-counter">
                {{ tourService.currentStepIndex() + 1 }} of {{ tourService.currentSteps().length }}
              </span>
              <div class="tour-tooltip-actions">
                @if (tourService.currentStepIndex() > 0) {
                  <button class="tour-btn-secondary" (click)="tourService.previousStep()">
                    Back
                  </button>
                }
                <button class="tour-btn-primary" (click)="tourService.nextStep()">
                  {{ tourService.currentStepIndex() === tourService.currentSteps().length - 1 ? 'Got it!' : 'Next' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tour-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: auto;
    }

    .tour-svg {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .tour-spotlight-ring {
      position: fixed;
      border-radius: 16px;
      border: 2px solid rgba(99, 102, 241, 0.6);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15), 0 0 20px rgba(99, 102, 241, 0.2);
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      animation: tour-pulse 2s ease-in-out infinite;
    }

    @keyframes tour-pulse {
      0%, 100% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15), 0 0 20px rgba(99, 102, 241, 0.2); }
      50% { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.25), 0 0 30px rgba(99, 102, 241, 0.3); }
    }

    .tour-tooltip {
      position: fixed;
      width: 340px;
      max-width: calc(100vw - 32px);
      z-index: 10000;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: auto;
    }

    .tour-tooltip-appear {
      animation: tour-fade-in 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes tour-fade-in {
      from { opacity: 0; transform: translateY(8px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .tour-tooltip-content {
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark) .tour-tooltip-content {
      background: #1f2937;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    }

    .tour-tooltip-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .tour-tooltip-title {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    :host-context(.dark) .tour-tooltip-title {
      color: #f3f4f6;
    }

    .tour-tooltip-close {
      padding: 4px;
      border-radius: 8px;
      color: #9ca3af;
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .tour-tooltip-close:hover {
      color: #6b7280;
      background: #f3f4f6;
    }

    :host-context(.dark) .tour-tooltip-close:hover {
      color: #d1d5db;
      background: #374151;
    }

    .tour-tooltip-desc {
      font-size: 13px;
      line-height: 1.6;
      color: #6b7280;
      margin: 0 0 16px 0;
    }

    :host-context(.dark) .tour-tooltip-desc {
      color: #9ca3af;
    }

    .tour-tooltip-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .tour-tooltip-counter {
      font-size: 12px;
      font-weight: 500;
      color: #9ca3af;
    }

    :host-context(.dark) .tour-tooltip-counter {
      color: #6b7280;
    }

    .tour-tooltip-actions {
      display: flex;
      gap: 8px;
    }

    .tour-btn-secondary {
      padding: 6px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      background: #f3f4f6;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
    }

    .tour-btn-secondary:hover {
      background: #e5e7eb;
      color: #374151;
    }

    :host-context(.dark) .tour-btn-secondary {
      background: #374151;
      color: #d1d5db;
    }

    :host-context(.dark) .tour-btn-secondary:hover {
      background: #4b5563;
      color: #f3f4f6;
    }

    .tour-btn-primary {
      padding: 6px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      border: none;
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
    }

    .tour-btn-primary:hover {
      background: linear-gradient(135deg, #818cf8, #6366f1);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
      transform: translateY(-1px);
    }

    /* Arrow styles */
    .tour-arrow {
      position: absolute;
      width: 12px;
      height: 12px;
      background: white;
      transform: rotate(45deg);
    }

    :host-context(.dark) .tour-arrow {
      background: #1f2937;
    }

    .tour-arrow-top {
      top: -6px;
      left: 30px;
    }

    .tour-arrow-bottom {
      bottom: -6px;
      left: 30px;
    }

    .tour-arrow-left {
      left: -6px;
      top: 20px;
    }

    .tour-arrow-right {
      right: -6px;
      top: 20px;
    }
  `],
})
export class TourOverlayComponent implements OnDestroy {
  tourService = inject(TourService);

  spotlightX = signal(0);
  spotlightY = signal(0);
  spotlightW = signal(0);
  spotlightH = signal(0);
  tooltipX = signal(0);
  tooltipY = signal(0);
  arrowPosition = signal<'top' | 'bottom' | 'left' | 'right'>('top');

  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      if (this.tourService.isActive()) {
        const step = this.tourService.currentStep;
        const idx = this.tourService.currentStepIndex();
        if (step) {
          this.positionSpotlight(step.elementId, step.position);
        }
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.tourService.isActive() && this.tourService.currentStep) {
      this.positionSpotlight(
        this.tourService.currentStep.elementId,
        this.tourService.currentStep.position
      );
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.tourService.isActive() && this.tourService.currentStep) {
      this.positionSpotlight(
        this.tourService.currentStep.elementId,
        this.tourService.currentStep.position
      );
    }
  }

  private positionSpotlight(elementId: string, preferredPosition: string): void {
    const el = document.getElementById(elementId);
    if (!el) {
      // Element not found — center the tooltip
      this.spotlightX.set(-100);
      this.spotlightY.set(-100);
      this.spotlightW.set(0);
      this.spotlightH.set(0);
      this.tooltipX.set(Math.max(16, (window.innerWidth - 340) / 2));
      this.tooltipY.set(window.innerHeight / 3);
      return;
    }

    // Scroll element into view if needed
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Small delay after scroll
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const padding = 8;

      this.spotlightX.set(rect.left - padding);
      this.spotlightY.set(rect.top - padding);
      this.spotlightW.set(rect.width + padding * 2);
      this.spotlightH.set(rect.height + padding * 2);

      this.computeTooltipPosition(rect, preferredPosition);
    }, 100);
  }

  private computeTooltipPosition(rect: DOMRect, preferred: string): void {
    const tooltipWidth = 340;
    const tooltipHeight = 200;
    const gap = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = 0;
    let y = 0;
    let arrow: 'top' | 'bottom' | 'left' | 'right' = 'top';

    if (preferred === 'bottom' && rect.bottom + gap + tooltipHeight < vh) {
      x = rect.left;
      y = rect.bottom + gap;
      arrow = 'top';
    } else if (preferred === 'top' && rect.top - gap - tooltipHeight > 0) {
      x = rect.left;
      y = rect.top - gap - tooltipHeight;
      arrow = 'bottom';
    } else if (preferred === 'right' && rect.right + gap + tooltipWidth < vw) {
      x = rect.right + gap;
      y = rect.top;
      arrow = 'left';
    } else if (preferred === 'left' && rect.left - gap - tooltipWidth > 0) {
      x = rect.left - gap - tooltipWidth;
      y = rect.top;
      arrow = 'right';
    } else {
      // Fallback: try below, then above, then center
      if (rect.bottom + gap + tooltipHeight < vh) {
        x = rect.left;
        y = rect.bottom + gap;
        arrow = 'top';
      } else if (rect.top - gap - tooltipHeight > 0) {
        x = rect.left;
        y = rect.top - gap - tooltipHeight;
        arrow = 'bottom';
      } else {
        x = (vw - tooltipWidth) / 2;
        y = vh / 3;
        arrow = 'top';
      }
    }

    // Clamp X within viewport
    x = Math.max(16, Math.min(x, vw - tooltipWidth - 16));
    // Clamp Y within viewport
    y = Math.max(16, Math.min(y, vh - tooltipHeight - 16));

    this.tooltipX.set(x);
    this.tooltipY.set(y);
    this.arrowPosition.set(arrow);
  }

  onOverlayClick(event: MouseEvent): void {
    // Only close if clicking the dark overlay area, not the tooltip
    const target = event.target as HTMLElement;
    if (target.classList.contains('tour-overlay') || target.tagName === 'svg' || target.tagName === 'rect') {
      // Don't close on overlay click, just ignore
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
