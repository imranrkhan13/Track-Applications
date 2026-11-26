import posthog from 'posthog-js';

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  initialized = true;

  posthog.init('phc_uhmr4g4f9nUHdCxhnAM5ritqrcQ7Fq6a3bpFb4mUMMaC', {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    loaded: (ph) => {
      if (import.meta.env.DEV) ph.opt_out_capturing();
    },
  });
}

export default posthog;
