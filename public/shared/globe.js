import { Mappo, GlobeRenderer, registerRenderer } from '../_turnkey/vendor/mappo/mappo.js';

// Keep Mappo's projection, interaction, momentum, and lifecycle intact.
// Only its land paint changes: one cached canvas gradient across the sphere.
class AltenarGlobeRenderer extends GlobeRenderer {
  _c(color) {
    if (color !== '#018dff' || !this.ctx || !this.side) return super._c(color);
    if (this.brandSide !== this.side) {
      this.brandSide = this.side;
      this.brandGradient = this.ctx.createLinearGradient(this.side * .1, 0, this.side * .9, 0);
      // Same blue-to-cyan as the buttons (navbar CTA), no green.
      this.brandGradient.addColorStop(0, '#018DFF');
      this.brandGradient.addColorStop(1, '#0BDAFF');
    }
    return this.brandGradient;
  }
}
registerRenderer('globe', AltenarGlobeRenderer);

export function mountGlobe(card, options = {}) {
  if (card.querySelector('.rd-interactive-globe')) return;
  card.classList.add('shared-globe-host');
  const surface = document.createElement('div');
  surface.className = 'rd-interactive-globe';
  surface.setAttribute('role', 'img');
  surface.setAttribute('aria-label', 'Interactive world globe. Drag to rotate.');
  surface.setAttribute('title', 'Drag to rotate the globe');
  card.prepend(surface);
  const globe = new Mappo(surface, {
    mode: 'globe', cols: 190, latMin: -90, latMax: 90,
    figure: 'dots', figureColor: '#018dff', dotShape: 'circle', dotSize: .45,
    groundColor: 'none', background: 'none', globeRing: false,
    tilt: 12, rotateSpeed: 3, focus: {lat: 15, lon: 15},
    interactive: true, cursor: 'grab', dotHoverScale: 1.65, dotHoverColor: '#dcf9ff',
    maxDpr: 1.5, reducedMotion: true, ...options,
  });
  // The supplied PNG remains a fallback until a rendered frame is available.
  requestAnimationFrame(() => card.classList.add('has-interactive-globe'));
  const dispose = () => {
    globe.destroy();
    surface.remove();
    card.classList.remove('has-interactive-globe');
  };
  // A back/forward cache restore keeps the live globe mounted.
  window.addEventListener('pagehide', (event) => { if (!event.persisted) dispose(); });
  return dispose;
}

const selector = '[data-ui-globe]';
const observer = new MutationObserver(setup);
function setup() {
  const host = document.querySelector(selector);
  if (!host) return;
  observer.disconnect();
  mountGlobe(host);
}
observer.observe(document.body, {childList:true, attributes:true, attributeFilter:['data-ui-globe'], subtree:true});
setup();
