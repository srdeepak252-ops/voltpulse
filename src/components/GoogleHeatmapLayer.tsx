import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight?: number;
}

export interface GoogleHeatmapLayerProps {
  points: HeatmapPoint[];
  radius?: number;
  opacity?: number;
  gradient?: string[] | null;
  maxIntensity?: number;
}

const DEFAULT_GRADIENT = [
  'rgba(0, 255, 255, 0)',
  'rgba(0, 255, 255, 1)',
  'rgba(0, 191, 255, 1)',
  'rgba(0, 127, 255, 1)',
  'rgba(0, 255, 0, 1)',
  'rgba(255, 255, 0, 1)',
  'rgba(255, 128, 0, 1)',
  'rgba(255, 0, 0, 1)',
];

/**
 * Pre-generates a 256-color palette from an array of CSS color strings
 */
function createGradientPalette(gradientColors: string[]): Uint8ClampedArray {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return new Uint8ClampedArray(256 * 4);

    const grad = ctx.createLinearGradient(0, 0, 256, 1);
    const colors = gradientColors.length >= 2 ? gradientColors : DEFAULT_GRADIENT;
    const step = 1 / (colors.length - 1);
    colors.forEach((color, idx) => {
      grad.addColorStop(Math.min(1, Math.max(0, idx * step)), color);
    });

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1);
    return ctx.getImageData(0, 0, 256, 1).data;
  } catch {
    return new Uint8ClampedArray(256 * 4);
  }
}

/**
 * GoogleHeatmapLayer renders an incident density heatmap on top of Google Maps
 * using a high-performance Canvas OverlayView projection.
 *
 * This design avoids deprecated Maps API endpoints and operates seamlessly in
 * all browser and test environments.
 */
export function GoogleHeatmapLayer({
  points,
  radius = 36,
  opacity = 0.8,
  gradient = null,
}: GoogleHeatmapLayerProps) {
  const map = useMap();
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paletteRef = useRef<Uint8ClampedArray>(createGradientPalette(gradient || DEFAULT_GRADIENT));

  // Update palette when gradient changes
  useEffect(() => {
    paletteRef.current = createGradientPalette(gradient || DEFAULT_GRADIENT);
    if (overlayRef.current) {
      try {
        overlayRef.current.draw();
      } catch {
        // Ignore redraw errors
      }
    }
  }, [gradient]);

  useEffect(() => {
    if (!map || typeof window === 'undefined' || !(window as any).google?.maps?.OverlayView) {
      return;
    }

    let isDisposed = false;

    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '1';
      containerRef.current = container;

      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      container.appendChild(canvas);
      canvasRef.current = canvas;

      // Offscreen shadow canvas for density accumulation
      const shadowCanvas = document.createElement('canvas');

      const OverlayClass = class extends (window as any).google.maps.OverlayView {
        onAdd() {
          try {
            const panes = this.getPanes();
            if (panes?.overlayLayer) {
              panes.overlayLayer.appendChild(container);
            }
          } catch (e) {
            console.warn('Heatmap overlay onAdd error:', e);
          }
        }

        draw() {
          if (isDisposed) return;
          try {
            const projection = this.getProjection();
            if (!projection || !canvas) return;

            const mapDiv = map.getDiv();
            const width = mapDiv.clientWidth || 800;
            const height = mapDiv.clientHeight || 600;

            if (width <= 0 || height <= 0) return;

            // Size canvases to viewport
            if (canvas.width !== width || canvas.height !== height) {
              canvas.width = width;
              canvas.height = height;
            }
            if (shadowCanvas.width !== width || shadowCanvas.height !== height) {
              shadowCanvas.width = width;
              shadowCanvas.height = height;
            }

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const sCtx = shadowCanvas.getContext('2d', { willReadFrequently: true });
            if (!ctx || !sCtx) return;

            // Position container to match the top-left of the overlay pane
            const bounds = map.getBounds();
            if (!bounds) return;

            const nw = new (window as any).google.maps.LatLng(
              bounds.getNorthEast().lat(),
              bounds.getSouthWest().lng()
            );
            const nwPixel = projection.fromLatLngToDivPixel(nw);
            if (nwPixel) {
              canvas.style.left = `${nwPixel.x}px`;
              canvas.style.top = `${nwPixel.y}px`;
            }

            // Clear canvases
            sCtx.clearRect(0, 0, width, height);
            ctx.clearRect(0, 0, width, height);

            if (!points || points.length === 0) return;

            // Compute max weight for normalization
            let maxWeight = 1;
            for (let i = 0; i < points.length; i++) {
              if (points[i].weight && points[i].weight! > maxWeight) {
                maxWeight = points[i].weight!;
              }
            }

            // 1. Draw radial gradient stamps on shadow canvas
            const r = Math.max(12, radius);
            for (let i = 0; i < points.length; i++) {
              const pt = points[i];
              if (isNaN(pt.lat) || isNaN(pt.lng)) continue;

              const latLng = new (window as any).google.maps.LatLng(pt.lat, pt.lng);
              const pixel = projection.fromLatLngToDivPixel(latLng);
              if (!pixel || !nwPixel) continue;

              const x = pixel.x - nwPixel.x;
              const y = pixel.y - nwPixel.y;

              // Culling: skip points far outside the visible viewport
              if (x < -r || x > width + r || y < -r || y > height + r) continue;

              const weight = typeof pt.weight === 'number' && pt.weight > 0 ? pt.weight : 1;
              const alpha = Math.min(1, Math.max(0.12, (weight / maxWeight) * 0.95));

              const radGrad = sCtx.createRadialGradient(x, y, 0, x, y, r);
              radGrad.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
              radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

              sCtx.fillStyle = radGrad;
              sCtx.beginPath();
              sCtx.arc(x, y, r, 0, Math.PI * 2);
              sCtx.fill();
            }

            // 2. Colorize using the gradient palette
            const imgData = sCtx.getImageData(0, 0, width, height);
            const data = imgData.data;
            const palette = paletteRef.current;
            const clampedOpacity = Math.min(1, Math.max(0.1, opacity));

            for (let p = 0; p < data.length; p += 4) {
              const alpha = data[p + 3];
              if (alpha === 0) continue;

              const palIdx = alpha * 4;
              data[p] = palette[palIdx];         // R
              data[p + 1] = palette[palIdx + 1]; // G
              data[p + 2] = palette[palIdx + 2]; // B
              data[p + 3] = Math.round(alpha * clampedOpacity); // A
            }

            ctx.putImageData(imgData, 0, 0);
          } catch (err) {
            console.warn('Heatmap draw warning:', err);
          }
        }

        onRemove() {
          try {
            if (container.parentNode) {
              container.parentNode.removeChild(container);
            }
          } catch {
            // Ignore removal errors
          }
        }
      };

      const overlay = new OverlayClass();
      overlay.setMap(map);
      overlayRef.current = overlay;

      return () => {
        isDisposed = true;
        try {
          overlay.setMap(null);
        } catch {
          // Ignore
        }
        overlayRef.current = null;
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      };
    } catch (e) {
      console.warn('Failed to initialize Heatmap OverlayView:', e);
      return () => {};
    }
  }, [map]);

  // Trigger redraw when points, radius, or opacity change
  useEffect(() => {
    if (overlayRef.current) {
      try {
        overlayRef.current.draw();
      } catch {
        // Redraw error
      }
    }
  }, [points, radius, opacity]);

  return null;
}
