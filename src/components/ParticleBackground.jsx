import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { useCallback } from 'react';

export default function ParticleBackground() {
  const init = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="hero-particles"
      init={init}
      options={{
        background: { color: { value: 'transparent' } },
        fpsLimit: 60,
        particles: {
          color: { value: '#7C5CFC' },
          links: {
            color: '#7C5CFC',
            distance: 150,
            enable: true,
            opacity: 0.08,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.4,
            direction: 'none',
            random: true,
            outModes: { default: 'out' },
          },
          number: { value: 60, density: { enable: true, area: 800 } },
          opacity: { value: 0.15 },
          size: { value: { min: 1, max: 2 } },
        },
        detectRetina: true,
      }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
      }}
    />
  );
}
