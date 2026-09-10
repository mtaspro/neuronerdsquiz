/**
 * Vector Chapter — Scene asset configuration (Scenes 1–3).
 *
 * All character portraits (1:1) and background banners (16:9) are served
 * from the Cloudinary CDN with `f_auto,q_auto` transformation flags
 * (auto format + auto quality) for optimal delivery.
 *
 * Consumers: DotCrossChallengeModal (Scene 1), RainWindChallengeModal
 * (Scene 2), VectorCalculusChallengeModal (Scene 3).
 *
 * NOTE: character `name` values must exactly match the `speaker` strings
 * used in each scene's dialogue data (used for the speaker→avatar lookup).
 * `emoji` is the graceful fallback when a CDN image is missing or fails.
 */

export const VECTOR_SCENES = {
  scene1: {
    id: 'ancillary-sanctuary-gate',
    title: 'Ancillary Sanctuary Gate',
    bannerUrl:
      'https://res.cloudinary.com/dxqtqnfgf/image/upload/f_auto,q_auto/v1789010755/Gemini_Generated_Image__2_felmhr.jpg',
    characters: {
      guardian: {
        name: 'মন্দিরের রক্ষক',
        emoji: '🗿',
        avatarUrl:
          'https://res.cloudinary.com/dxqtqnfgf/image/upload/f_auto,q_auto/v1788973299/Gemini_Generated_Image_hjllvohjllvohjll_pgksqy.jpg',
      },
      player: {
        name: 'আপনি',
        emoji: '🧑‍🔬',
        avatarUrl:
          'https://res.cloudinary.com/dxqtqnfgf/image/upload/f_auto,q_auto/v1788973300/Gemini_Generated_Image__1_qtjivt.jpg',
      },
    },
  },

  scene2: {
    id: 'stormy-ridge-extraction',
    title: 'Stormy Ridge Extraction',
    bannerUrl:
      'https://res.cloudinary.com/dxqtqnfgf/image/upload/f_auto,q_auto/v1788973299/stormy_mountain_comic_tvxjze.jpg',
    characters: {
      pilot: {
        name: 'উদ্ধারকারী বৈমানিক',
        emoji: '🚁',
        avatarUrl:
          'https://res.cloudinary.com/dxqtqnfgf/image/upload/f_auto,q_auto/v1788973300/Gemini_Generated_Image__uxtqtl.jpg',
      },
      player: {
        name: 'আপনি',
        emoji: '🧑‍🔬',
        avatarUrl:
          'https://res.cloudinary.com/dxqtqnfgf/image/upload/f_auto,q_auto/v1788973342/running_shield_umbrella_x8avto.jpg',
      },
    },
  },

  scene3: {
    id: 'core-reactor-stabilization',
    title: 'Core Reactor Stabilization',
    bannerUrl:
      'https://res.cloudinary.com/dxqtqnfgf/image/upload/f_auto,q_auto/v1788973299/quantum_reactor_chamber_j0q7wv.jpg',
    characters: {
      aiCore: {
        name: 'এআই কোয়ান্টাম কোর (NeuraCore)',
        emoji: '🤖',
        avatarUrl:
          'https://res.cloudinary.com/dxqtqnfgf/image/upload/f_auto,q_auto/v1788973299/ai_core_hud_avatar_crcisz.jpg',
      },
      player: {
        name: 'আপনি',
        emoji: '🧑‍🔬',
        avatarUrl:
          'https://res.cloudinary.com/dxqtqnfgf/image/upload/f_auto,q_auto/v1789054730/references-to-lock-first-image-is-character-face-s_sm9wxo.jpg',
      },
    },
  },
};

export default VECTOR_SCENES;
