/**
 * PF2e Words of Magic — Vocabulary Tables
 * All delivery words, element words, and supporting data.
 *
 * Formula: [Delivery Word] + [Element Word] = Full Incantation
 * Tier = Math.min(5, Math.ceil(castRank / 2))  — cantrip always tier 1
 */

// ── DELIVERY WORDS ────────────────────────────────────────────────────────────
// Keyed by PF2e area type or inferred delivery method.
export const DELIVERY = {
  touch:     { arcane: "ahfi",      primal: "raahm",     occult: "baghd",     divine: "tactum"  },
  ray:       { arcane: "arrah",     primal: "bur-ahm",   occult: "aha'gl",    divine: "radiem"  },
  emanation: { arcane: "arr-ain",   primal: "urr-ahz",   occult: "sh'tha",    divine: "spirem"  },
  self:      { arcane: "ah-si",     primal: "raahz",     occult: "ing-bahd",  divine: "meamet"  },
  burst:     { arcane: "ashaah",    primal: "shum-rahz", occult: "quach",     divine: "eruptem" },
  cone:      { arcane: "arr-ooosh", primal: "grr-ahz",   occult: "sahm'gl",   divine: "corntem" },
  line:      { arcane: "aefth",     primal: "shom-ruz",  occult: "ahag'law",  divine: "viatem"  },
  point:     { arcane: "aeshi",     primal: "shum",      occult: "bahd'tah",  divine: "punctem" },
  summon:    { arcane: "ahl-arrr",  primal: "krahh-um",  occult: "k'ahgl",    divine: "vocatem" },
};

// ── ELEMENT WORDS — [tier 1..5][tradition] ────────────────────────────────────
// Index 0 is null (tiers are 1-based).
export const ELEMENTS = {
  fire: [
    null,
    { arcane: "ifrir",       primal: "eyusch",        occult: "vuur",             divine: "ignim"        },
    { arcane: "ifrigni",     primal: "eyuschum",      occult: "vuur'tah",         divine: "ignaim"       },
    { arcane: "ifrignir",    primal: "eyuschumfrah",  occult: "vuur'tachla",      divine: "ignael"       },
    { arcane: "ifrignar",    primal: "shririm",       occult: "vuur'tachsas",     divine: "vastignael"   },
    { arcane: "ahnfrir",     primal: "shririmfrah",   occult: "vur'sahth'tahs",   divine: "infernalis"   },
  ],
  water: [
    null,
    { arcane: "aqshi",       primal: "drrip",         occult: "shui",             divine: "undim"        },
    { arcane: "aqshaah",     primal: "drrip-uhm",     occult: "shui'tah",         divine: "undaim"       },
    { arcane: "aqshahr",     primal: "gurrum",        occult: "shui'tachla",      divine: "undaimnor"    },
    { arcane: "vazaqsh",     primal: "gurrum-frah",   occult: "shui'tachsas",     divine: "vastundim"    },
    { arcane: "ahnaqu",      primal: "maahrrumm",     occult: "shui'sahth'tahs",  divine: "fluminalis"   },
  ],
  cold: [
    null,
    { arcane: "cryssah",     primal: "brruhm",        occult: "bing",             divine: "gelim"        },
    { arcane: "cryssahn",    primal: "brruhzz",       occult: "bing'tah",         divine: "gelaim"       },
    { arcane: "cryssahnir",  primal: "brruhzzom",     occult: "bing'tachla",      divine: "gelaimnor"    },
    { arcane: "cryssahnar",  primal: "shrummbr",      occult: "bing'tachsas",     divine: "vastgelim"    },
    { arcane: "ahncryssah",  primal: "ommbrrug",      occult: "bing'sahth'tahs",  divine: "glacielis"    },
  ],
  electricity: [
    null,
    { arcane: "elaesh",      primal: "kzzup",         occult: "lei",              divine: "fulgim"       },
    { arcane: "elaeshir",    primal: "kzzupum",       occult: "lei'tah",          divine: "fulgaim"      },
    { arcane: "elaeshahr",   primal: "kzzupfrah",     occult: "lei'tachla",       divine: "fulgaimnor"   },
    { arcane: "vazelaesh",   primal: "snarrum",       occult: "lei'tachsas",      divine: "vastfulgim"   },
    { arcane: "ahnelaesh",   primal: "snarrumfrah",   occult: "lei'sahth'tahs",   divine: "tonitralis"   },
  ],
  earth: [
    null,
    { arcane: "terrshi",     primal: "gruud",         occult: "tu'gin",           divine: "saxim"        },
    { arcane: "terrshaah",   primal: "gruudum",       occult: "tu'gihnah",        divine: "saxaim"       },
    { arcane: "terrshahr",   primal: "gruudumfrah",   occult: "tu'gihnachla",     divine: "saxaimnor"    },
    { arcane: "vazterrsh",   primal: "rummgruu",      occult: "tu'sahchin",       divine: "vastsaxim"    },
    { arcane: "ahnterrsh",   primal: "rummgruufrah",  occult: "tu'sahchinaw",     divine: "terraqualis"  },
  ],
  air: [
    null,
    { arcane: "aershi",      primal: "hnnm",          occult: "feng",             divine: "spirim"       },
    { arcane: "aershaah",    primal: "hnnmum",        occult: "feng'tah",         divine: "spiraim"      },
    { arcane: "aershah",     primal: "whooshum",      occult: "feng'tachla",      divine: "spiraimnor"   },
    { arcane: "vazaersh",    primal: "whooshfrah",    occult: "feng'tachsas",     divine: "vastventim"   },
    { arcane: "ahnaersh",    primal: "grrahhm",       occult: "feng'sahth'tahs",  divine: "ventaqualis"  },
  ],
  acid: [
    null,
    { arcane: "oxyrr",       primal: "szzup",         occult: "suan",             divine: "vitriim"      },
    { arcane: "oxyrrahn",    primal: "szzupum",       occult: "suan'tah",         divine: "vitriaim"     },
    { arcane: "oxyrrshahr",  primal: "gorrupfrah",    occult: "suan'tachla",      divine: "vitriaimnor"  },
    { arcane: "vazoxyrrsh",  primal: "gorruphrumm",   occult: "suan'tachsas",     divine: "vastvitriel"  },
    { arcane: "ahnoxyrrr",   primal: "gorrphrahm",    occult: "suan'sahth'tahs",  divine: "corrosialis"  },
  ],
  force: [
    null,
    { arcane: "dynshi",      primal: "puhff",         occult: "li'gin",           divine: "virtim"       },
    { arcane: "dynshaah",    primal: "puhffum",       occult: "li'gihnah",        divine: "virtaim"      },
    { arcane: "dynshahr",    primal: "rummfff",       occult: "li'gihnachla",     divine: "virtaimnor"   },
    { arcane: "vazdynsh",    primal: "rummfffrah",    occult: "li'sahchin",       divine: "vastvirtim"   },
    { arcane: "ahndynsh",    primal: "vahrumfff",     occult: "li'sahchinaw",     divine: "visequalis"   },
  ],
  void: [
    null,
    { arcane: "vaecsh",      primal: "ghhhup",        occult: "xu",               divine: "nihilim"      },
    { arcane: "vaecshahn",   primal: "ghhhupum",      occult: "xu'tah",           divine: "nihilaim"     },
    { arcane: "vaecshahur",  primal: "ghhhupfrah",    occult: "xu'tachla",        divine: "nihilaimnor"  },
    { arcane: "vazvaecsh",   primal: "hollumgh",      occult: "xu'tachsas",       divine: "vastnihilim"  },
    { arcane: "ahnvaecsh",   primal: "hollumghfrah",  occult: "xu'sahth'tahs",    divine: "mortiqualis"  },
  ],
  vitality: [
    null,
    { arcane: "bioshi",      primal: "ommup",         occult: "yang",             divine: "salim"        },
    { arcane: "bioshaah",    primal: "ommupum",       occult: "yang'tah",         divine: "salaim"       },
    { arcane: "bioshahr",    primal: "ommupfrah",     occult: "yang'tachla",      divine: "salaimnor"    },
    { arcane: "vazbiosh",    primal: "hummmomm",      occult: "yang'tachsas",     divine: "vastsalim"    },
    { arcane: "ahnbiosh",    primal: "hummmommfrah",  occult: "yang'sahth'tahs",  divine: "resurrequalis"},
  ],
  mental: [
    null,
    { arcane: "psyshi",      primal: "mmmup",         occult: "xin",              divine: "mensim"       },
    { arcane: "psyshaah",    primal: "mmmupum",       occult: "xin'tah",          divine: "mensaim"      },
    { arcane: "psyshahr",    primal: "shhhfrah",      occult: "xin'tachla",       divine: "mensaimnor"   },
    { arcane: "vazpsysh",    primal: "rummshhhh",     occult: "xin'tachsas",      divine: "vastmensim"   },
    { arcane: "ahnpsysh",    primal: "rummshhhfrah",  occult: "xin'sahth'tahs",   divine: "mentiqualis"  },
  ],
  light: [
    null,
    { arcane: "phoshi",      primal: "shaahmup",      occult: "guang",            divine: "luxim"        },
    { arcane: "phoshaah",    primal: "shaahmupum",    occult: "guang'tah",        divine: "luxaim"       },
    { arcane: "phoshahr",    primal: "shaahmupfrah",  occult: "guang'tachla",     divine: "luxaimnor"    },
    { arcane: "vazphosh",    primal: "raahmshahm",    occult: "guang'tachsas",    divine: "vastluxim"    },
    { arcane: "ahnphosh",    primal: "raahmshahmfrah",occult: "guang'sahth'tahs", divine: "claritalis"   },
  ],
  darkness: [
    null,
    { arcane: "umbrshi",     primal: "grrumup",       occult: "xuan",             divine: "tenbrim"      },
    { arcane: "umbrshaah",   primal: "grrumupum",     occult: "xuan'tah",         divine: "tenbraim"     },
    { arcane: "umbrshahr",   primal: "grrumupfrah",   occult: "xuan'tachla",      divine: "tenbraimnor"  },
    { arcane: "vazumbrsh",   primal: "shommgrrm",     occult: "xuan'tachsas",     divine: "vasttenbrim"  },
    { arcane: "ahnumbrsh",   primal: "shommgrrmfrah", occult: "xuan'sahth'tahs",  divine: "tenebqualis"  },
  ],
  poison: [
    null,
    { arcane: "toxshi",      primal: "hissup",        occult: "du'gin",           divine: "venelim"      },
    { arcane: "toxshaah",    primal: "hissupum",      occult: "du'gihnah",        divine: "venelaim"     },
    { arcane: "toxshahr",    primal: "hissupfrah",    occult: "du'gihnachla",     divine: "venelaimnor"  },
    { arcane: "vaztoxsh",    primal: "gorrtoxhm",     occult: "du'sahchin",       divine: "vastvenlim"   },
    { arcane: "ahntoxsh",    primal: "gorrtoxfrah",   occult: "du'sahchinaw",     divine: "pestiqualis"  },
  ],
  sonic: [
    null,
    { arcane: "acoushi",     primal: "hummup",        occult: "sheng",            divine: "sonim"        },
    { arcane: "acoushaah",   primal: "hummupum",      occult: "sheng'tah",        divine: "sonaim"       },
    { arcane: "acoushahr",   primal: "rummomm",       occult: "sheng'tachla",     divine: "sonaimnor"    },
    { arcane: "vazacoush",   primal: "rummommfrah",   occult: "sheng'tachsas",    divine: "vastsonim"    },
    { arcane: "ahnacoush",   primal: "vahrummomm",    occult: "sheng'sahth'tahs", divine: "resonalis"    },
  ],
  metal: [
    null,
    { arcane: "metshi",      primal: "klingup",       occult: "jin",              divine: "ferrim"       },
    { arcane: "metshaah",    primal: "klingupum",     occult: "jin'tah",          divine: "feraim"       },
    { arcane: "metshahr",    primal: "klingupfrah",   occult: "jin'tachla",       divine: "feraimnor"    },
    { arcane: "vazmetsh",    primal: "skarrum",       occult: "jin'tachsas",      divine: "vastferrim"   },
    { arcane: "ahnmetsh",    primal: "skarrumfrah",   occult: "jin'sahth'tahs",   divine: "metallalis"   },
  ],
  wood: [
    null,
    { arcane: "xylshi",      primal: "krackup",       occult: "mu",               divine: "lignim"       },
    { arcane: "xylshaah",    primal: "krackupum",     occult: "mu'tah",           divine: "lignaim"      },
    { arcane: "xylshahr",    primal: "woodhm",        occult: "mu'tachla",        divine: "lignaimnor"   },
    { arcane: "vazxylsh",    primal: "woodhmfrah",    occult: "mu'tachsas",       divine: "vastlignim"   },
    { arcane: "ahnxylsh",    primal: "groveumfrah",   occult: "mu'sahth'tahs",    divine: "sylvalis"     },
  ],
  aether: [
    null,
    { arcane: "aethshi",     primal: "ommah",         occult: "ling",             divine: "aethim"       },
    { arcane: "aethshaah",   primal: "ommahum",       occult: "ling'tah",         divine: "aethaim"      },
    { arcane: "aethshahr",   primal: "ommahfrah",     occult: "ling'tachla",      divine: "aethaimnor"   },
    { arcane: "vazaethsh",   primal: "hummmah",       occult: "ling'tachsas",     divine: "vastaethim"   },
    { arcane: "ahnaethsh",   primal: "hummahfrah",    occult: "ling'sahth'tahs",  divine: "aetheralis"   },
  ],
};

// ── TIER NAMES — human-readable label per element per tier ────────────────────
export const TIER_NAMES = {
  fire:        ["Spark",    "Ember",     "Flame",       "Blaze",    "Inferno"    ],
  water:       ["Drizzle",  "Haze",      "Rain",        "Storm",    "Tsunami"    ],
  cold:        ["Frost",    "Freeze",    "Frozen",      "Blizzard", "Glacial"    ],
  electricity: ["Zap",      "Crackle",   "Bolt",        "Thunder",  "Tempest"    ],
  earth:       ["Pebble",   "Stone",     "Boulder",     "Tremor",   "Quake"      ],
  air:         ["Wisp",     "Breeze",    "Gust",        "Squall",   "Cyclone"    ],
  acid:        ["Spot",     "Drip",      "Splash",      "Spray",    "Deluge"     ],
  force:       ["Nudge",    "Push",      "Shove",       "Blast",    "Wave"       ],
  void:        ["Decay",    "Drain",     "Wither",      "Siphon",   "Annihilate" ],
  vitality:    ["Mend",     "Tend",      "Restore",     "Renew",    "Resurrect"  ],
  mental:      ["Whisper",  "Murmur",    "Echo",        "Shout",    "Scream"     ],
  light:       ["Glimmer",  "Shine",     "Flash",       "Flare",    "Radiance"   ],
  darkness:    ["Dim",      "Shadow",    "Shade",       "Umbra",    "Abyss"      ],
  poison:      ["Prick",    "Taint",     "Seep",        "Surge",    "Plague"     ],
  sonic:       ["Hum",      "Drone",     "Reverberate", "Roar",     "Resonance"  ],
  metal:       ["Chip",     "Shard",     "Blade",       "Barrage",  "Shrapnel"   ],
  wood:        ["Sliver",   "Splinter",  "Branch",      "Grove",    "Blight"     ],
  aether:      ["Trace",    "Weave",     "Flux",        "Current",  "Torrent"    ],
};

// ── TRADITION DISPLAY ─────────────────────────────────────────────────────────
export const TRADITION_COLORS = {
  arcane: "#9B59B6",
  primal: "#27AE60",
  occult: "#2471A3",
  divine: "#D4AC0D",
};

export const TRADITION_LABELS = {
  arcane: "Arcane",
  primal: "Primal",
  occult: "Occult",
  divine: "Divine",
};

export const DELIVERY_LABELS = {
  touch:     "Touch",
  ray:       "Ray",
  emanation: "Emanation",
  self:      "Self",
  burst:     "Burst",
  cone:      "Cone",
  line:      "Line",
  point:     "Point",
  summon:    "Summon",
};

// ── SUMMON LOOKUP ─────────────────────────────────────────────────────────────
// Keyed by the item ID portion of the UUID (last segment after final ".").
// This allows matching both compendium ("Compendium.pf2e.spells-srd.Item.XXXX")
// and world item ("Item.XXXX") UUIDs.
// element: "variable" means a sub-type picker dialog must be shown.
export const SUMMON_LOOKUP = {
  "yvs1zN5Pai5U4CJX": { element: "aether",   tier: 1, name: "Summon Instrument"          },
  "4YnON9JHYqtLzccu": { element: "aether",   tier: 1, name: "Summon Animal"               },
  "9WGeBwIIbbUuWKq0": { element: "void",     tier: 1, name: "Summon Undead"               },
  "B0FZLkoHsiRgw7gv": { element: "aether",   tier: 1, name: "Summon Lesser Servitor"      },
  "hs7h8f4Z1ZNdUt3s": { element: "aether",   tier: 1, name: "Summon Fey"                  },
  "jSRAyd57kd4WZ4yE": { element: "wood",     tier: 1, name: "Summon Plant or Fungus"       },
  "lKcsmeOrgHtK4xQa": { element: "force",    tier: 1, name: "Summon Construct"             },
  "BcqJqxIKYE0aoDiS": { element: "aether",   tier: 1, name: "Bee-Man's Summons"            },
  "O1ZLfeOJpHbG9G6B": { element: "void",     tier: 2, name: "Manifestation of Spirits"    },
  "U7415tttUO8JLvpf": { element: "aether",   tier: 1, name: "Buzzing Servants"             },
  "cwXiKPkZrIupjwlQ": { element: "aether",   tier: 1, name: "Summoner's Precaution"        },
  "lpT6LotUaQPfinjj": { element: "variable", tier: 3, name: "Summon Elemental",
    options: ["fire", "water", "air", "earth", "metal", "wood"] },
  "vb2dFNtbofJ7A9BW": { element: "aether",   tier: 1, name: "Summoner's Visage"            },
  "0JWyMwVnLxX9CDYQ": { element: "void",     tier: 2, name: "Rouse Skeletons"              },
  "FQd6Jc3CU6wiS2U7": { element: "force",    tier: 2, name: "Conjured Conveyance"          },
  "y5amezSt82FYu9HG": { element: "aether",   tier: 2, name: "Horde of Underlings"          },
  "29ytKctjg7qSW2ff": { element: "void",     tier: 3, name: "Summon Fiend"                 },
  "3r897dYO8oYvuyn5": { element: "vitality", tier: 3, name: "Summon Healing Servitor"      },
  "ZbEHglw5tkJ3grQZ": { element: "aether",   tier: 3, name: "Summon Monitor"               },
  "ba12fO37w7O37gim": { element: "force",    tier: 3, name: "Summon Axiom"                 },
  "e9UJoVYUd5kJWUpi": { element: "earth",    tier: 3, name: "Summon Giant"                 },
  "i1TvBID5QLyXrUCa": { element: "aether",   tier: 3, name: "Summon Entity"                },
  "kghwmH3tQjMIhdH1": { element: "variable", tier: 3, name: "Summon Dragon",
    options: ["fire", "cold", "acid", "electricity", "poison"] },
  "lTDixrrNKaCvLKwX": { element: "vitality", tier: 3, name: "Summon Celestial"             },
  "n8ckecJpatSBEp7M": { element: "aether",   tier: 3, name: "Summon Anarch"                },
  "y1dcR5unn2UwlUR9": { element: "void",     tier: 3, name: "Skeleton Army"                },
  "XWqxMJpCT95A0dZs": { element: "earth",    tier: 4, name: "Summon Stampede"              },
  "4ONjK2hoMBmuAAyk": { element: "aether",   tier: 4, name: "Summon Irii"                  },
  "JAaETUBg0xlttpCH": { element: "aether",   tier: 4, name: "Summon Archmage"              },
  "kIRWUBxocERjIBni": { element: "vitality", tier: 4, name: "Summon Deific Herald"         },
  "kVNo3ga0lwLKPrem": { element: "aether",   tier: 4, name: "Summon Elemental Herald"      },
  "l2YoqVPoFE7jpTLe": { element: "wood",     tier: 4, name: "Summon Warden of the Wild"    },
  "2EIUqc8TCTQimggQ": { element: "aether",   tier: 4, name: "Summon Draconic Legion"       },
  "i6GUJCWdNu2278oA": { element: "void",     tier: 4, name: "Call Fluxwraith"              },
  "tgJTm276cikEL8vU": { element: "void",     tier: 4, name: "Summon Ancient Fleshforged"   },
  "AuIiqc7jjiy1GZ75": { element: "aether",   tier: 5, name: "Manifestation"                },
  "WRP8TDf36hqHyGv1": { element: "earth",    tier: 5, name: "Summon Kaiju"                 },
  "Ywe64VHwcBOAWBtq": { element: "aether",   tier: 5, name: "Summon Oliphaunt of Jandelay" },
  "hvKtmoHwekDZ5iOH": { element: "darkness", tier: 5, name: "Shadow Army"                  },
  "ion3VOiLan6ga3QC": { element: "aether",   tier: 5, name: "Conquering Soldiers"          },
  "pmP8HhXvvEKP3LqU": { element: "aether",   tier: 5, name: "Primal Herd"                  },
};

// ── SIGNATURE SYLLABLES — per-spell variation word (3rd word in incantation) ──
// Derived deterministically from the spell's item ID so the same spell always
// produces the same signature. 20 options per tradition keeps variety high
// while staying phonetically coherent with each tradition's character.
//
// Arcane: short Latin/Greek fragments — scholarly, crisp
// Primal: guttural one-syllable punches — instinctive, physical
// Occult: apostrophe-glottal fragments — alien, slippery
// Divine: Latin suffixes/particles — ceremonial, weighted
export const SIGNATURES = {
  arcane: [
    "vael",  "shan",  "orth",  "reth",  "avar",
    "yss",   "keth",  "imar",  "olm",   "syr",
    "drev",  "zhan",  "uth",   "ferr",  "corel",
    "nyx",   "thar",  "vorn",  "essh",  "quelm",
  ],
  primal: [
    "brum",  "ghuh",  "razz",  "hukk",  "omm",
    "shrr",  "grak",  "duum",  "murr",  "bzzk",
    "raww",  "hrnk",  "urgg",  "skrr",  "phrr",
    "wumm",  "drukk", "thumm", "krzz",  "vugg",
  ],
  occult: [
    "p'tah", "f'tah", "s'gin", "n'glaw","ah'gul",
    "tch'il","q'vex", "zh'an", "uh'gl", "kh'tul",
    "m'reth","v'shal","d'zhen","b'rox", "f'saan",
    "l'goth","r'nach","y'xul", "g'shin","x'paad",
  ],
  divine: [
    "demis", "portum","veras", "caelum","ferens",
    "sancte","iter",  "visum", "donum", "iubar",
    "solum", "maris", "mortis","vitae", "regum",
    "lucem", "teneat","vocis", "datis", "finem",
  ],
};

// ── SUMMON DETECTION — spells resolved as Summon delivery by name/trait ───────
// These supplement the UUID lookup for edge cases and future spells.
export const SUMMON_NAME_FRAGMENTS = [
  "summon", "conjure", "animate dead", "rouse skeleton", "skeleton army",
  "shadow army", "conquering soldiers", "primal herd", "horde of underlings",
  "bee-man", "buzzing servants", "call fluxwraith", "manifestation of spirits",
];
