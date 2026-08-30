// ──────────────────────────────────────────────────────────
// CONSTANTES & TABELAS DE CONFIGURAÇÃO DO GTA VI
// ──────────────────────────────────────────────────────────

const CANVAS_W = 1920;
const CANVAS_H = 1080;

const FONT_URL = 'Fonts/Brother-1816-Black.woff2';
const PALM_COLOR_URL = 'assets/palm_tree_new.ebfbeb33.png';
const PALM_MONO_URL = 'assets/palm_tree_new_mono.d67dae70.png';

const FONT_FAMILY_LOGO = 'Brother-1816-Black';
const FALLBACK_FONT = 'system-ui, sans-serif';

const KERNING_MAP = {
  VA: -80, AV: -80, VO: -40, OV: -40, VC: -40, CV: -40,
  VG: -40, GV: -40, VQ: -40, QV: -40, VT: -40, TV: -25,
  VS: -25, SV: -25, VW: -20, WV: -20, VY: -20, YV: -20,
  IT: -10, TI: -10
};

// Gradientes Oficiais Extraídos da Identidade Visual do GTA VI
const GRADIENT_COLORFUL = [
  { stop: 1, color: '#FF964C' },
  { stop: 0.65, color: '#ff8192' },
  { stop: 0.40, color: '#f660bb' },
  { stop: 0, color: '#335fcf' }
];

const GRADIENT_STROKE_ROXO = [
  { stop: 1, color: '#7a0078' },
  { stop: 0, color: '#3e0062' }
];

const GRADIENT_STROKE_SECONDARY = [
  { stop: 1, color: '#7a0078' },
  { stop: 0.58, color: '#fd00a8' },
  { stop: 0.19, color: '#ff67d9' },
  { stop: 0, color: '#febf08' }
];

const GRADIENT_REFLEXO = [
  { stop: 0.07, color: 'rgba(255, 205, 114, 0.9)' },
  { stop: 0.15, color: 'rgba(255, 172, 68, 0.9)' },
  { stop: 0.30, color: 'rgba(255, 172, 68, 0.0)' }
];

// LISTA DE CENÁRIOS & BACKGROUNDS OFICIAIS
const BG_LIST = [
  { key: 'cover-2', label: 'Jason & Lucia', path: 'backgrounds/b74b36e2b61c3c2382e0a504f95e387651f406d72e68d278.jpg' },
  { key: '2026', label: 'JL Cover 3', path: 'backgrounds/2026-bg.jpg' },
  { key: 'key169', label: 'Key Art 16:9', path: 'backgrounds/gta6-artwork-1-background-16-9.jpg' },
  { key: 'keyp', label: 'Key Art', path: 'backgrounds/gta6-artwork-1-background.jpg' },
  { key: 'ambrosia', label: 'Ambrosia', path: 'backgrounds/places-ambrosia-background.jpg' },
  { key: 'grass', label: 'Grassrivers', path: 'backgrounds/places-grassrivers-background.jpg' },
  { key: 'leonida', label: 'Leonida Keys', path: 'backgrounds/places-leonidakeys-background.jpg' },
  { key: 'mt', label: 'Mt. Kalaga', path: 'backgrounds/places-mountkalaga-background.jpg' },
  { key: 'port', label: 'Port Gellhorn', path: 'backgrounds/places-portgellhorn-background.jpg' },
  { key: 'vc', label: 'Vice City', path: 'backgrounds/places-vicecity-background.jpg' },
  { key: 'boobie', label: 'Boobie Ike', path: 'backgrounds/Artwork-BoobieIkeBG-GTAVI.png' },
  { key: 'brian', label: 'Brian Heder', path: 'backgrounds/Artwork-BrianHederBG-GTAVI.png' },
  { key: 'cal', label: 'Cal Hampton', path: 'backgrounds/Artwork-CalHamptonBG-GTAVI.png' },
  { key: 'dre', label: 'Dre Quan', path: 'backgrounds/Artwork-DreQuanPriestBG-GTAVI.png' },
  { key: 'raul', label: 'Raul Bautista', path: 'backgrounds/Artwork-RaulBautistaBG-GTAVI.png' },
  { key: 'dimez', label: 'Real Dimez', path: 'backgrounds/Artwork-RealDimezBG-GTAVI.png' },
];

// LISTA DE ASSETS - PALMEIRAS RECORTADAS
const ASSET_LIST = [
  { key: "palm-1-c", label: "Palmeira 1", file: "assets/palms/palm_1_color.png" },
  { key: "palm-2-c", label: "Palmeira 2", file: "assets/palms/palm_2_color.png" },
  { key: "palm-3-c", label: "Palmeira 3", file: "assets/palms/palm_3_color.png" },
  { key: "palm-4-c", label: "Palmeira 4", file: "assets/palms/palm_4_color.png" },
  { key: "palm-5-c", label: "Palmeira 5", file: "assets/palms/palm_5_color.png" },
  { key: "palm-1-m", label: "Palmeira 1 Mono", file: "assets/palms/palm_1_mono.png" },
  { key: "palm-2-m", label: "Palmeira 2 Mono", file: "assets/palms/palm_2_mono.png" },
  { key: "palm-3-m", label: "Palmeira 3 Mono", file: "assets/palms/palm_3_mono.png" },
  { key: "palm-4-m", label: "Palmeira 4 Mono", file: "assets/palms/palm_4_mono.png" },
  { key: "palm-5-m", label: "Palmeira 5 Mono", file: "assets/palms/palm_5_mono.png" },
];

// LISTA DE PERSONAGENS LOCAIS (24) - GTA IV / V / VI
const CHAR_LIST = [
  // GTA IV
  { key: "niko",   label: "Niko",    file: "Characters/Grand Theft Auto IV/Niko.png" },
  { key: "roman",  label: "Roman",   file: "Characters/Grand Theft Auto IV/Roman.png" },
  // GTA V - Franklin
  { key: "franklin",  label: "Franklin",   file: "Characters/Grand Theft Auto V/Franklin.png" },
  { key: "franklin2", label: "Franklin 2",  file: "Characters/Grand Theft Auto V/Franklin2.png" },
  { key: "franklin3", label: "Franklin 3",  file: "Characters/Grand Theft Auto V/Franklin3.png" },
  // GTA V - Michael
  { key: "michael",  label: "Michael",   file: "Characters/Grand Theft Auto V/Micheal.png" },
  { key: "michael2", label: "Michael 2",  file: "Characters/Grand Theft Auto V/Micheal2.png" },
  { key: "michael3", label: "Michael 3",  file: "Characters/Grand Theft Auto V/Micheal3.png" },
  { key: "michael4", label: "Michael 4",  file: "Characters/Grand Theft Auto V/Micheal4.png" },
  { key: "michael5", label: "Michael 5",  file: "Characters/Grand Theft Auto V/Micheal5.png" },
  // GTA V - Trevor
  { key: "trevor",  label: "Trevor",   file: "Characters/Grand Theft Auto V/Trevor.png" },
  { key: "trevor2", label: "Trevor 2",  file: "Characters/Grand Theft Auto V/Trevor2.png" },
  { key: "trevor3", label: "Trevor 3",  file: "Characters/Grand Theft Auto V/Trevor3.png" },
  // GTA VI
  { key: "lucia-jason",  label: "Lucia & Jason",   file: "Characters/Grand Theft Auto VI/Lucia&Jason.png" },
  { key: "lucia-jason2", label: "Lucia & Jason 2",  file: "Characters/Grand Theft Auto VI/Lucia&Jason2.png" },
  { key: "lucia-jason3", label: "Lucia & Jason 3",  file: "Characters/Grand Theft Auto VI/Lucia&Jason3.png" },
  { key: "lucia-jason4", label: "Lucia & Jason 4",  file: "Characters/Grand Theft Auto VI/Lucia&Jason4.png" },
  { key: "lucia-jason5", label: "Lucia & Jason 5",  file: "Characters/Grand Theft Auto VI/Lucia&Jason5.png" },
  { key: "boobie",       label: "Boobie Ike",        file: "Characters/Grand Theft Auto VI/Boobie_Ike.png" },
  { key: "brian",        label: "Brian Heder",       file: "Characters/Grand Theft Auto VI/Brian_Heder.png" },
  { key: "cal",          label: "Cal Hampton",       file: "Characters/Grand Theft Auto VI/Cal_Hampton.png" },
  { key: "drequan",      label: "Dre'Quan Priest",   file: "Characters/Grand Theft Auto VI/Dre'Quan_Priest.png" },
  { key: "raul",         label: "Raul Bautista",     file: "Characters/Grand Theft Auto VI/Raul_Bautista.png" },
  { key: "dimez",        label: "Real Dimez",        file: "Characters/Grand Theft Auto VI/Real_Dimez.png" },
];
