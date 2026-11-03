type Props = { factor: string; title: string }

const common = { viewBox: '0 0 640 420', role: 'img' as const, className: 'factor-illustration', preserveAspectRatio: 'xMidYMid meet' }

/**
 * Original vector scenes for the five factors. Every element shares one ground
 * line, one horizon and one scale; nothing floats or is cropped by the viewBox.
 */
export function FactorIllustration({ factor, title }: Props) {
  const label = `Ilustración editorial del factor ${title}`

  if (factor === 'energia') return <svg {...common} aria-label={label}>
    <defs>
      <linearGradient id="energy-sky" x2="0" y2="1"><stop stopColor="#1b443e" /><stop offset="1" stopColor="#789587" /></linearGradient>
      <linearGradient id="energy-ground" x2="0" y2="1"><stop stopColor="#3f5e4e" /><stop offset="1" stopColor="#162f29" /></linearGradient>
      <radialGradient id="energy-sun"><stop stopColor="#f9d996" /><stop offset="1" stopColor="#d6783f" /></radialGradient>
    </defs>

    <rect width="640" height="420" fill="url(#energy-sky)" />
    <circle cx="524" cy="84" r="42" fill="url(#energy-sun)" className="art-pulse" />
    <path d="M0 264q92-50 178-12t162-10q72-24 140 6t160-6v78H0z" fill="#33574a" />
    <path d="M0 296q118-32 232 2t206-8q88-18 202 10v120H0z" fill="url(#energy-ground)" />
    <path d="M0 296q118-32 232 2t206-8q88-18 202 10" fill="none" stroke="#78957f" strokeWidth="2" opacity=".55" />

    {/* Town: walls, roofs, doors and windows share the same baseline. */}
    <g stroke="#102b26" strokeWidth="3">
      <path d="M44 300v-54h62v54z" fill="#e9dcbd" />
      <path d="M38 246 75 214l37 32z" fill="#c07a4a" />
      <rect x="52" y="258" width="10" height="12" fill="#e4b45d" stroke="none" />
      <rect x="72" y="258" width="10" height="12" fill="#e4b45d" stroke="none" />
      <rect x="88" y="258" width="10" height="12" fill="#e4b45d" stroke="none" />
      <rect x="70" y="278" width="14" height="22" fill="#54725e" stroke="none" />

      <path d="M120 300v-84h54v84z" fill="#e9dcbd" />
      <path d="M118 216h58v8h-58z" fill="#b96d3a" />
      <g fill="#e4b45d" stroke="none"><rect x="128" y="228" width="10" height="12" /><rect x="146" y="228" width="10" height="12" /><rect x="128" y="250" width="10" height="12" /><rect x="146" y="250" width="10" height="12" /><rect x="128" y="272" width="10" height="12" /><rect x="146" y="272" width="10" height="12" /></g>

      <path d="M186 300v-48h48v48z" fill="#e9dcbd" />
      <path d="M180 252 210 226l30 26z" fill="#b96d3a" />
      <rect x="198" y="264" width="12" height="11" fill="#e4b45d" stroke="none" />
      <rect x="216" y="276" width="12" height="24" fill="#54725e" stroke="none" />
    </g>

    {/* Transmission line: each pylon is planted on the ground and the cables sag between crossarms. */}
    <g stroke="#f1e4c8" strokeWidth="2.4" fill="none" opacity=".95">
      <path d="M266 300 280 232l14 68M262 252h36M268 272h24M280 232v-12" />
      <path d="M378 300 392 232l14 68M374 252h36M380 272h24M392 232v-12" />
      <path d="M490 300 504 232l14 68M486 252h36M492 272h24M504 232v-12" />
    </g>
    <g stroke="#f1e4c8" strokeWidth="1.3" fill="none" opacity=".62">
      <path d="M298 252q40 20 76 0M298 272q40 18 76 0M410 252q40 20 76 0M410 272q40 18 76 0M238 250q11 10 24 2" />
    </g>

    {/* Wind farm on the ridge, with the towers anchored behind the town ground line. */}
    <g transform="translate(552 158)">
      <path d="M-3 0v136" stroke="#f1e4c8" strokeWidth="5" />
      <g className="art-rotor" stroke="#f1e4c8" strokeWidth="4" fill="none">
        <circle r="36" fill="none" stroke="none" />
        <path d="M0 0v-36M0 0l31 18M0 0-31 18" />
      </g>
      <circle r="4" fill="#f1e4c8" />
    </g>
    <g transform="translate(598 190)">
      <path d="M-2 0v104" stroke="#f1e4c8" strokeWidth="4" />
      <g className="art-rotor" stroke="#f1e4c8" strokeWidth="3" fill="none">
        <circle r="28" fill="none" stroke="none" />
        <path d="M0 0v-28M0 0l24 14M0 0-24 14" />
      </g>
      <circle r="3" fill="#f1e4c8" />
    </g>

    {/* Solar array in the foreground, its frame planted on the field. */}
    <g transform="translate(348 308)">
      <ellipse cx="46" cy="88" rx="58" ry="8" fill="#102b26" opacity=".2" />
      <g fill="#4f7d86" stroke="#102b26" strokeWidth="2">
        <path d="M0 22 76 2l16 30L16 52z" />
      </g>
      <g stroke="#bcd8d6" strokeWidth="1.1" opacity=".8">
        <path d="M18 18 34 46M35 14 51 42M52 10 68 38M69 6 85 34M9 24 25 52M58 36 74 64" />
      </g>
      <g stroke="#102b26" strokeWidth="3.2">
        <path d="M12 52v34M88 34v34M26 56v30M102 38v30" />
      </g>
    </g>

    <g stroke="#6f8f78" strokeWidth="1.5" fill="none" opacity=".5">
      <path d="M0 336q160-14 320 0t320-4M0 368q160-12 320 0t320-2M0 402q160-10 320 0t320-2" />
    </g>
  </svg>

  if (factor === 'industria') return <svg {...common} aria-label={label}>
    <defs>
      <linearGradient id="industry-bg" x2="1" y2="1"><stop stopColor="#e9dfc9" /><stop offset="1" stopColor="#c9ba98" /></linearGradient>
      <pattern id="industry-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0v28" fill="none" stroke="#8d7a58" strokeWidth=".6" opacity=".3" /></pattern>
    </defs>
    <rect width="640" height="420" fill="url(#industry-bg)" />
    <rect width="640" height="420" fill="url(#industry-grid)" />
    <path d="M0 340h640v80H0z" fill="#b9ab8c" />
    <path d="M0 340h640" stroke="#7d6a49" strokeWidth="2" />

    {/* Main factory: sawtooth roof, chimney integrated into the roof line, aligned openings. */}
    <g stroke="#213f36" strokeWidth="3">
      <path d="M54 340V218l46-34 46 34 46-34 46 34 46-34 46 34v122z" fill="#5d786b" />
      <path d="M296 218V112h30v106z" fill="#9f4735" />
      <path d="M291 104h40v8h-40z" fill="#7f3a2c" />
      <g fill="#e7c06b" stroke="none">
        <rect x="72" y="240" width="14" height="18" /><rect x="100" y="240" width="14" height="18" /><rect x="128" y="240" width="14" height="18" /><rect x="156" y="240" width="14" height="18" /><rect x="184" y="240" width="14" height="18" /><rect x="212" y="240" width="14" height="18" /><rect x="240" y="240" width="14" height="18" />
        <rect x="72" y="270" width="14" height="18" /><rect x="100" y="270" width="14" height="18" /><rect x="128" y="270" width="14" height="18" /><rect x="156" y="270" width="14" height="18" /><rect x="184" y="270" width="14" height="18" /><rect x="212" y="270" width="14" height="18" /><rect x="240" y="270" width="14" height="18" />
      </g>
      <rect x="96" y="298" width="42" height="42" fill="#25443b" />
      <rect x="220" y="306" width="34" height="34" fill="#25443b" />
      <path d="M104 298v42M130 298v42" stroke="#c7b58c" strokeWidth="1.4" />
    </g>

    <g transform="translate(311 104)">
      <g className="art-smoke" fill="#f4ead2" opacity=".72">
        <circle cx="0" cy="-12" r="14" /><circle cx="16" cy="-26" r="11" /><circle cx="-12" cy="-34" r="9" /><circle cx="6" cy="-46" r="7" />
      </g>
    </g>

    {/* Secondary workshop, flat roof, windows aligned to the facade. */}
    <g stroke="#213f36" strokeWidth="3">
      <path d="M356 340V248h120v92z" fill="#839087" />
      <path d="M350 240h132v8H350z" fill="#25443b" />
      <g fill="#e7c06b" stroke="none">
        <rect x="370" y="262" width="14" height="18" /><rect x="394" y="262" width="14" height="18" /><rect x="418" y="262" width="14" height="18" /><rect x="442" y="262" width="14" height="18" />
        <rect x="370" y="290" width="14" height="18" /><rect x="394" y="290" width="14" height="18" /><rect x="418" y="290" width="14" height="18" />
      </g>
      <rect x="442" y="290" width="26" height="50" fill="#25443b" />
    </g>

    {/* Storage silo and the pipe that physically connects it to the workshop. */}
    <g stroke="#213f36" strokeWidth="3">
      <path d="M496 340V214a30 18 0 0 1 60 0v126z" fill="#d4c5a1" />
      <ellipse cx="526" cy="214" rx="30" ry="18" fill="#e6d9b8" />
      <path d="M496 252h60M496 294h60" stroke="#a08c66" strokeWidth="2" />
      <path d="M476 302h20v14h-20z" fill="#9a8a68" />
      <path d="M476 322h20v12h-20z" fill="#9a8a68" />
    </g>

    {/* Contrails and reuse loop are signals, not objects: they sit in the sky. */}
    <g transform="translate(548 118)" fill="none" stroke="#9b5f3d" strokeWidth="3">
      <path d="M0 0a48 48 0 1 1-2 96" strokeDasharray="8 9" className="art-dash" />
      <path d="m-10 86 9 13 11-11" />
    </g>

    <g fill="#8d7a58" opacity=".8">
      <rect x="20" y="310" width="26" height="30" /><rect x="50" y="300" width="22" height="40" /><rect x="24" y="304" width="18" height="6" fill="#c7b58c" /><rect x="54" y="294" width="14" height="6" fill="#c7b58c" />
    </g>
    <g stroke="#7d6a49" strokeWidth="1.5" opacity=".6"><path d="M0 372h640M0 400h640" /></g>
  </svg>

  if (factor === 'transporte') return <svg {...common} aria-label={label}>
    <defs>
      <linearGradient id="transport-sky" x2="0" y2="1"><stop stopColor="#b9d8d3" /><stop offset="1" stopColor="#e9e0c7" /></linearGradient>
      <linearGradient id="transport-road" x2="0" y2="1"><stop stopColor="#4e5c57" /><stop offset="1" stopColor="#283b36" /></linearGradient>
    </defs>
    <rect width="640" height="420" fill="url(#transport-sky)" />
    <circle cx="524" cy="70" r="34" fill="#e7b65d" />
    <path d="M0 236 68 190l54 18 72-64 62 56 66-27 82 51 66-29 110 39v56H0z" fill="#7e9b78" />

    {/* Town behind the sidewalk, with windows and roofs on the same baseline. */}
    <g stroke="#315448" strokeWidth="2.5">
      <path d="M44 252v-42h46v42z" fill="#e9e0c9" /><path d="M38 210 67 188l29 22z" fill="#b8704a" />
      <rect x="52" y="218" width="8" height="9" fill="#d9b66c" stroke="none" /><rect x="68" y="218" width="8" height="9" fill="#d9b66c" stroke="none" /><rect x="60" y="234" width="10" height="18" fill="#55725f" stroke="none" />
      <path d="M104 252v-62h50v62z" fill="#e9e0c9" /><path d="M100 190h58v7h-58z" fill="#b8704a" />
      <rect x="112" y="202" width="10" height="11" fill="#d9b66c" stroke="none" /><rect x="130" y="202" width="10" height="11" fill="#d9b66c" stroke="none" /><rect x="112" y="222" width="10" height="11" fill="#d9b66c" stroke="none" /><rect x="130" y="222" width="10" height="11" fill="#d9b66c" stroke="none" />
      <path d="M174 252v-34h38v34z" fill="#e9e0c9" /><path d="M168 218 193 198l25 20z" fill="#b8704a" /><rect x="184" y="226" width="8" height="9" fill="#d9b66c" stroke="none" />
    </g>

    <rect y="252" width="640" height="48" fill="#d8cfb5" />
    <path d="M0 252h640M0 298h640" stroke="#a99a7c" strokeWidth="2" />
    <path d="M0 300h640v120H0z" fill="url(#transport-road)" />
    <g stroke="#7f8f7e" strokeWidth="1.5" opacity=".5"><path d="M0 330h640M0 370h640M0 408h640" /></g>

    {/* Crosswalk and bike lane, both on the road surface. */}
    <g fill="#e9dfc9" opacity=".72">
      <path d="M18 304h9l-6 110h-9zM38 304h9l-6 110h-9zM58 304h9l-6 110h-9z" />
    </g>
    <g stroke="#c9d9c0" strokeWidth="2" strokeDasharray="12 12" opacity=".7"><path d="M0 412h640" /></g>

    {/* Utility pole: base on the sidewalk, cables connected across the street. */}
    <g stroke="#24483e" strokeWidth="3" fill="none">
      <path d="M300 252V158M282 170h36M286 182h28" />
      <path d="M282 170q-84 20-170 6M318 170q92 22 196 4" opacity=".65" strokeWidth="1.6" />
      <circle cx="282" cy="168" r="3" fill="#24483e" /><circle cx="318" cy="168" r="3" fill="#24483e" />
    </g>

    {/* Bus in the far lane, wheels resting on the asphalt. */}
    <g transform="translate(330 286)">
      <path d="M0 20q0-20 20-20h146q20 0 20 20v46H0z" fill="#d8a94f" stroke="#1f3a33" strokeWidth="3" />
      <rect x="14" y="10" width="30" height="24" rx="2" fill="#bcd8d1" /><rect x="52" y="10" width="30" height="24" rx="2" fill="#bcd8d1" /><rect x="90" y="10" width="30" height="24" rx="2" fill="#bcd8d1" /><rect x="128" y="10" width="24" height="24" rx="2" fill="#bcd8d1" />
      <rect x="160" y="10" width="20" height="50" fill="#a3c3ba" />
      <path d="M8 44h172" stroke="#1f3a33" strokeWidth="2" />
      <circle cx="38" cy="66" r="13" fill="#1c342e" /><circle cx="158" cy="66" r="13" fill="#1c342e" />
      <circle cx="38" cy="66" r="5" fill="#d8cfb5" /><circle cx="158" cy="66" r="5" fill="#d8cfb5" />
    </g>

    {/* Car in the near lane, smaller than the bus and resting on the road. */}
    <g transform="translate(108 340)">
      <path d="M0 36q0-13 13-15l20-3 14-20h62l17 20 22 4q10 2 10 14v16H0z" fill="#5a8891" stroke="#1f3a33" strokeWidth="3" />
      <path d="M49 20h20v18H40zM77 20h22l15 18H77z" fill="#c4ded8" />
      <path d="M42 38h102" stroke="#1f3a33" strokeWidth="2" />
      <circle cx="32" cy="52" r="13" fill="#1c342e" /><circle cx="128" cy="52" r="13" fill="#1c342e" />
      <circle cx="32" cy="52" r="5" fill="#d8cfb5" /><circle cx="128" cy="52" r="5" fill="#d8cfb5" />
    </g>

    {/* Bicycle and rider, with both wheels on the near lane. */}
    <g transform="translate(536 352)" stroke="#24483e" fill="none" strokeWidth="4">
      <circle cx="0" cy="42" r="18" /><circle cx="64" cy="42" r="18" />
      <path d="M0 42 21 14h26l17 28M21 14l14 28M35 42h29M47 14l8-11h15" />
      <circle cx="55" cy="-10" r="8" fill="#24483e" stroke="none" />
      <path d="M55 0 50 20M52 8 72 16M50 20 42 34M50 20l14 12" strokeWidth="3" />
      <path d="M70 14l7-5" strokeWidth="3" />
    </g>

    {/* Pedestrian on the sidewalk, feet on the pavement. */}
    <g transform="translate(212 252)" stroke="#24483e" fill="none" strokeWidth="3">
      <circle cx="0" cy="-40" r="7" fill="#24483e" stroke="none" />
      <path d="M0-32v17M0-22-9-10M0-22l10-12M0-15l-8 15M0-15l9 15" />
    </g>

    <g stroke="#315448" strokeWidth="2.5">
      <path d="M588 252v-38m0 0-17-16m17 16 16-17" /><circle cx="588" cy="208" r="9" fill="#4f7d54" />
      <path d="M614 252v-30m0 0-13-13m13 13 13-13" /><circle cx="614" cy="214" r="7" fill="#5f8a5e" />
    </g>
  </svg>

  if (factor === 'bosques') return <svg {...common} aria-label={label}>
    <defs>
      <linearGradient id="forest-sky" x2="0" y2="1"><stop stopColor="#e2ead2" /><stop offset="1" stopColor="#9fb78f" /></linearGradient>
      <pattern id="forest-soil" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="5" cy="7" r="1.3" fill="#6f5436" /><circle cx="14" cy="13" r="1" fill="#8b6842" /></pattern>
    </defs>
    <rect width="640" height="420" fill="url(#forest-sky)" />
    <circle cx="516" cy="64" r="30" fill="#e6b95f" opacity=".9" />
    <g stroke="#527a5a" strokeWidth="2" fill="none" opacity=".6"><path d="M420 58q7-7 14 0M444 70q7-7 14 0M86 84q6-6 12 0" /></g>
    <path d="M0 244q88-48 170-8t150-14q86-38 150 6t170-6v62H0z" fill="#7a9a70" />
    <path d="M0 284q96-34 180 2t168-12q82-30 144 8t148-4v42H0z" fill="#557c53" />
    <path d="M0 320h640v100H0z" fill="#7b5f3d" />
    <path d="M0 320h640v20H0z" fill="#3c633f" />
    <rect y="340" width="640" height="80" fill="url(#forest-soil)" opacity=".55" />
    <path d="M0 340h640M0 372h640M0 402h640" stroke="#5d462c" strokeWidth="1.5" opacity=".55" />

    {/* Mushrooms on the forest floor, rooted at the surface line. */}
    <g transform="translate(204 320)" stroke="#7a5c3c" strokeWidth="1.6">
      <path d="M-11 0q0-9 11-9t11 9z" fill="#e2c88f" />
      <path d="M0-9v9" fill="none" />
    </g>
    <g transform="translate(224 323)" stroke="#7a5c3c" strokeWidth="1.2">
      <path d="M-7 0q0-6 7-6t7 6z" fill="#d5b97d" />
      <path d="M0-6v6" fill="none" />
    </g>

    {/* Three trees rooted at the surface line, with visible roots entering the soil. */}
    <g>
      <path d="M150 322V196" stroke="#654932" strokeWidth="15" />
      <path d="M150 322q-14 6-24 18m24-18q14 6 24 16M143 320q-6 22-2 38m9-38q8 20 6 36m-4-36v42" stroke="#4b3522" strokeWidth="3" fill="none" />
      <g fill="#22624b"><circle cx="150" cy="160" r="52" /><circle cx="111" cy="181" r="33" /><circle cx="190" cy="178" r="31" /><circle cx="150" cy="124" r="30" /></g>
      <g fill="#2f7556"><circle cx="128" cy="150" r="20" /><circle cx="172" cy="164" r="18" /></g>
    </g>
    <g>
      <path d="M330 322V208" stroke="#6c4d33" strokeWidth="12" />
      <path d="M330 322q-12 4-20 16m20-16q12 4 20 14M324 320q-5 18-1 32m7-32q6 16 4 30" stroke="#4b3522" strokeWidth="2.8" fill="none" />
      <g fill="#1f5e49"><circle cx="330" cy="180" r="42" /><circle cx="299" cy="196" r="26" /><circle cx="361" cy="194" r="27" /><circle cx="330" cy="148" r="24" /></g>
      <g fill="#3c815d"><circle cx="314" cy="176" r="16" /><circle cx="350" cy="188" r="14" /></g>
    </g>
    <g>
      <path d="M472 322V226" stroke="#654932" strokeWidth="9" />
      <path d="M472 322q-9 4-15 14m15-14q10 4 16 12M468 320q-4 15-1 26m7-26q5 14 3 25" stroke="#4b3522" strokeWidth="2.4" fill="none" />
      <g fill="#2a6c50"><circle cx="472" cy="202" r="33" /><circle cx="447" cy="214" r="21" /><circle cx="497" cy="213" r="21" /></g>
      <g fill="#468b61"><circle cx="461" cy="196" r="13" /></g>
    </g>

    {/* Sapling and undergrowth sit on the same terrain. */}
    <g transform="translate(238 322)">
      <path d="M0 0v-38" stroke="#5d452c" strokeWidth="4" />
      <path d="M0-24q-13-12-18 2 10 5 18 2M0-30q12-13 18 1-10 6-18 3" fill="#4a8b5d" className="art-sway" />
    </g>
    <g fill="#3f7d58"><ellipse cx="86" cy="318" rx="26" ry="12" /><ellipse cx="396" cy="320" rx="22" ry="10" /><ellipse cx="548" cy="318" rx="27" ry="12" /></g>
    <g fill="#e9c36b"><circle cx="72" cy="314" r="3.4" /><circle cx="412" cy="314" r="3" /><circle cx="562" cy="312" r="3.2" /><circle cx="208" cy="318" r="2.6" /></g>

    {/* Soil life: mycelium and roots remain below the surface. */}
    <g stroke="#e2c88f" strokeWidth="1.4" fill="none" opacity=".45">
      <path d="M132 352q36 14 62 4t58 12M92 386q42-12 76 2t84-4M352 360q34 10 60-2t70 10" />
    </g>
    <g fill="#e6c16a"><circle cx="120" cy="374" r="3" /><circle cx="196" cy="366" r="2.5" /><circle cx="368" cy="384" r="3" /><circle cx="512" cy="360" r="2.4" /><circle cx="286" cy="394" r="2.6" /></g>
    <g stroke="#6b5134" strokeWidth="2" fill="none" opacity=".8"><path d="M96 402q30-10 62 0M420 400q34-10 66 0M250 410q30-8 60 0" /></g>
  </svg>

  return <svg {...common} aria-label={label}>
    <defs>
      <linearGradient id="farm-sky" x2="0" y2="1"><stop stopColor="#cfe3dc" /><stop offset="1" stopColor="#f0e3bf" /></linearGradient>
      <linearGradient id="farm-field" x2="0" y2="1"><stop stopColor="#b79c63" /><stop offset="1" stopColor="#d3b678" /></linearGradient>
    </defs>
    <rect width="640" height="420" fill="url(#farm-sky)" />
    <circle cx="520" cy="66" r="32" fill="#e9b95e" />
    <path d="M0 190 88 146l61 30 79-62 69 62 72-34 76 52 83-40 112 46v58H0z" fill="#9bb189" />
    <path d="M0 232h640v188H0z" fill="url(#farm-field)" />

    {/* Perspective rows converge on a single vanishing point. */}
    <g stroke="#8a744a" strokeWidth="2" opacity=".55" fill="none">
      <path d="M320 232 0 420M320 232 80 420M320 232 160 420M320 232 240 420M320 232 320 420M320 232 400 420M320 232 480 420M320 232 560 420M320 232 640 420" />
      <path d="M0 274q320-14 640 0M0 310q320-16 640 0M0 362q320-18 640 0M0 410q320-22 640 0" />
    </g>

    {/* Farmhouse: roof, walls, door and windows aligned to one facade. */}
    <g transform="translate(54 214)" stroke="#6b4330" strokeWidth="3">
      <path d="M0 52V16L32 0l32 16v36z" fill="#e9dcb8" />
      <path d="M-8 18 32-8l40 26z" fill="#b96645" />
      <rect x="12" y="24" width="12" height="11" fill="#7fa39a" stroke="none" />
      <rect x="42" y="24" width="12" height="11" fill="#7fa39a" stroke="none" />
      <rect x="27" y="36" width="14" height="16" fill="#5c7b58" stroke="none" />
    </g>

    {/* Greenhouse on the right, its frame and legs touching the ground. */}
    <g transform="translate(430 240)" stroke="#4e7380" strokeWidth="3" fill="none">
      <path d="M0 60V28Q36-8 72 28v32z" fill="#d7e8df" fillOpacity=".55" />
      <path d="M0 60h72M0 28h72M18 60V12M36 60V4M54 60V12M0 28h72" opacity=".8" />
      <path d="M12 60V40h14v20" fill="#cfe0d6" />
    </g>

    {/* Crop plants follow the row lines, each anchored in the soil. */}
    <g fill="#5b8b4e">
      <g transform="translate(168 330)"><g className="art-sway"><path d="M0 0v-26m0 16-9-9m9 4 10-10m-10 19-8-8m8 3 9-9" stroke="#4d7842" strokeWidth="3" fill="none" /></g></g>
      <g transform="translate(226 366)"><g className="art-sway art-delay"><path d="M0 0v-30m0 18-10-10m10 4 11-11m-11 21-9-9m9 4 10-10" stroke="#4d7842" strokeWidth="3" fill="none" /></g></g>
      <g transform="translate(300 394)"><g className="art-sway"><path d="M0 0v-32m0 18-11-11m11 4 12-12m-12 22-10-9m10 4 11-11" stroke="#4d7842" strokeWidth="3" fill="none" /></g></g>
      <g transform="translate(492 392)"><g className="art-sway art-delay"><path d="M0 0v-30m0 17-10-10m10 4 11-11m-11 20-9-9m9 4 10-10" stroke="#4d7842" strokeWidth="3" fill="none" /></g></g>
      <g transform="translate(390 344) scale(.7)"><g className="art-sway"><path d="M0 0v-24m0 15-9-9m9 4 10-10m-10 18-8-8m8 3 9-9" stroke="#4d7842" strokeWidth="3" fill="none" /></g></g>
      <g transform="translate(556 370) scale(.9)"><g className="art-sway art-delay"><path d="M0 0v-28m0 17-9-9m9 4 10-10m-10 20-8-8m8 3 9-9" stroke="#4d7842" strokeWidth="3" fill="none" /></g></g>
    </g>

    {/* Sheep, hooves resting on their field row and scaled to the farmhouse. */}
    <g transform="translate(360 344) scale(.42)" fill="#314f3e">
      <ellipse cx="0" cy="0" rx="25" ry="14" /><circle cx="24" cy="-9" r="8" />
      <path d="M-8 12v16m16-16v16m-24-16v18m32-18v18" stroke="#314f3e" strokeWidth="4" />
    </g>
    <g transform="translate(410 372) scale(.38)" fill="#314f3e">
      <ellipse cx="0" cy="0" rx="19" ry="11" /><circle cx="18" cy="-8" r="7" />
      <path d="M-6 9v13m12-13v13m-18-13v15m24-15v15" stroke="#314f3e" strokeWidth="3" />
    </g>

    {/* Pond at the lower edge with a calm surface and a few reeds. */}
    <ellipse cx="78" cy="398" rx="72" ry="17" fill="#6f9ba0" opacity=".8" />
    <ellipse cx="62" cy="394" rx="34" ry="5" fill="#c8e0dc" opacity=".75" />
    <path d="M18 398q60 7 120 0" fill="none" stroke="#4e7a80" strokeWidth="1.6" opacity=".45" />
    <g stroke="#4d7842" strokeWidth="2.4" fill="none"><path d="M20 394v-16m0 8-6-6m6 2 6-6M132 400v-13m0 7-5-5m5 2 5-5" /></g>

    <g stroke="#8a744a" strokeWidth="1.5" opacity=".5"><path d="M0 402h640" /></g>
  </svg>
}
