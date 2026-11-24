type Props = { world: string; title: string }

const scene = {
  viewBox: '0 0 320 220',
  role: 'img' as const,
  className: 'world-illustration',
  preserveAspectRatio: 'xMidYMid slice' as const,
}

/**
 * Field-guide scenes for the five worlds. Each drawing shares one horizon,
 * one ground line and one scale; buildings, plants and vehicles are planted on
 * that ground rather than floating. Important subjects stay inside the central
 * safe area so the slice crop never cuts a roof, wheel or canopy.
 */
export function WorldIllustration({ world, title }: Props) {
  const common = { ...scene, 'aria-label': `Ilustración del mundo ${title}` }

  if (world === 'energia') return <svg {...common}>
    <defs>
      <linearGradient id="world-energy-sky" x2="0" y2="1"><stop stopColor="#1e463e" /><stop offset="1" stopColor="#8fae9b" /></linearGradient>
      <linearGradient id="world-energy-ground" x2="0" y2="1"><stop stopColor="#4d705c" /><stop offset="1" stopColor="#1c3830" /></linearGradient>
      <radialGradient id="world-energy-sun"><stop stopColor="#f8dc9e" /><stop offset="1" stopColor="#d67f43" /></radialGradient>
    </defs>

    <rect width="320" height="220" fill="url(#world-energy-sky)" />
    <circle cx="264" cy="44" r="21" fill="url(#world-energy-sun)" className="art-pulse" />
    <path d="M0 130q46-26 90-6t84-10q40-18 78 4t68-6v54H0z" fill="#3d6353" />
    <path d="M0 157q56-18 118 2t106-6q48-12 96 6v61H0z" fill="url(#world-energy-ground)" />
    <path d="M0 157q56-18 118 2t106-6q48-12 96 6" fill="none" stroke="#7f9d86" strokeWidth="1.6" opacity=".55" />

    {/* Town: pitched roofs, windows and doors share a single baseline. */}
    <g stroke="#102b26" strokeWidth="2.2">
      <path d="M28 161v-41h52v41z" fill="#e9dcbd" />
      <path d="M23 120 54 98l31 22z" fill="#c07a4a" />
      <path d="M35 118 55 106l7 10-20 12z" fill="#4f7d86" />
      <path d="M43 122 55 115M39 125 51 118" stroke="#bcd8d6" strokeWidth="1" />
      <g fill="#e4b45d" stroke="none"><rect x="38" y="128" width="8" height="10" /><rect x="54" y="128" width="8" height="10" /><rect x="70" y="128" width="8" height="10" /></g>
      <rect x="48" y="146" width="12" height="15" fill="#54725e" stroke="none" />

      <path d="M92 161v-30h46v30z" fill="#e9dcbd" />
      <path d="M87 131 115 111l28 20z" fill="#b96d3a" />
      <path d="M97 129 116 117l7 10-19 12z" fill="#4f7d86" />
      <g fill="#e4b45d" stroke="none"><rect x="101" y="138" width="8" height="9" /><rect x="119" y="138" width="8" height="9" /></g>
      <rect x="109" y="149" width="9" height="12" fill="#54725e" stroke="none" />

      <path d="M146 161v-22h34v22z" fill="#e9dcbd" />
      <path d="M141 139 163 124l22 15z" fill="#c07a4a" />
      <rect x="155" y="147" width="8" height="10" fill="#e4b45d" stroke="none" />
    </g>

    {/* Transmission line: each pylon is planted on the ground, cables sag between crossarms. */}
    <g stroke="#f1e4c8" fill="none">
      <g strokeWidth="2.2"><path d="M190 161v-42M184 127h12M186 137h8M190 119v-8" /></g>
      <g strokeWidth="1.5" opacity=".75"><path d="M184 128q-18 10-38 4M196 128q18 10 36 2" /></g>
      <g strokeWidth="2.6"><path d="M238 161v-46M231 123h14M233 134h10M238 115v-8" /></g>
      <g strokeWidth="1.6" opacity=".8"><path d="M231 124q18 11 36 3M245 124q14 8 27 2" /></g>
    </g>

    {/* Wind farm on the ridge; towers reach the same ground line. */}
    <g transform="translate(276 158)">
      <path d="M0 0v-62" stroke="#f1e4c8" strokeWidth="3.4" />
      <g transform="translate(0 -62)">
        <g className="art-rotor" stroke="#f1e4c8" strokeWidth="3" fill="none"><circle r="22" fill="transparent" stroke="none" /><path d="M0 0v-22M0 0l19 11M0 0-19 11" /></g>
        <circle r="2.6" fill="#f1e4c8" />
      </g>
    </g>
    <g transform="translate(304 160)">
      <path d="M0 0v-44" stroke="#f1e4c8" strokeWidth="2.6" />
      <g transform="translate(0 -44)">
        <g className="art-rotor" stroke="#f1e4c8" strokeWidth="2.2" fill="none"><circle r="15" fill="transparent" stroke="none" /><path d="M0 0v-15M0 0l13 8M0 0-13 8" /></g>
        <circle r="2" fill="#f1e4c8" />
      </g>
    </g>

    <g stroke="#6f8f78" strokeWidth="1.2" fill="none" opacity=".4">
      <path d="M0 186q80-8 160 0t160-2M0 204q80-6 160 0t160-2" />
    </g>
  </svg>

  if (world === 'industria') return <svg {...common}>
    <defs>
      <linearGradient id="world-industry-sky" x2="0" y2="1"><stop stopColor="#e8dfca" /><stop offset="1" stopColor="#c9bb9b" /></linearGradient>
      <pattern id="world-industry-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0v24" fill="none" stroke="#8d7a58" strokeWidth=".6" opacity=".26" /></pattern>
    </defs>
    <rect width="320" height="220" fill="url(#world-industry-sky)" />
    <rect width="320" height="220" fill="url(#world-industry-grid)" />
    <path d="M0 164h320v56H0z" fill="#b2a384" />
    <path d="M0 164h320" stroke="#7d6a49" strokeWidth="1.8" />

    {/* Chimney behind the sawtooth roof; its base is hidden by the building. */}
    <g stroke="#213f36" strokeWidth="2.2">
      <path d="M150 164V74h15v90z" fill="#9f4735" />
      <path d="M146 68h23v6h-23z" fill="#7f3a2c" />
      <path d="M150 92h15M150 112h15M150 132h15" stroke="#7f3a2c" strokeWidth="1.2" />
    </g>

    {/* Main factory: eight sawtooth bays, aligned window rows and a reinforced door. */}
    <g stroke="#213f36" strokeWidth="2.2">
      <path d="M22 110 42 96l20 14 20-14 20 14 20-14 20 14 20-14 20 14v54H22z" fill="#617d70" />
      <path d="M22 110h160" stroke="#25443b" strokeWidth="1.4" opacity=".7" />
      <g fill="#e7c06b" stroke="none" className="art-pulse">
        <rect x="34" y="120" width="11" height="14" /><rect x="55" y="120" width="11" height="14" /><rect x="76" y="120" width="11" height="14" /><rect x="97" y="120" width="11" height="14" /><rect x="118" y="120" width="11" height="14" /><rect x="139" y="120" width="11" height="14" /><rect x="160" y="120" width="11" height="14" />
        <rect x="34" y="144" width="11" height="14" /><rect x="55" y="144" width="11" height="14" /><rect x="97" y="144" width="11" height="14" /><rect x="118" y="144" width="11" height="14" /><rect x="139" y="144" width="11" height="14" />
      </g>
      <rect x="76" y="146" width="17" height="18" fill="#25443b" />
      <path d="M80 146v18M89 146v18" stroke="#c7b58c" strokeWidth="1.1" />
    </g>

    <g transform="translate(157 66)">
      <g className="art-smoke" fill="#f4ead2" opacity=".76">
        <circle cy="-8" r="9" /><circle cx="10" cy="-19" r="7" /><circle cx="-8" cy="-25" r="6" />
      </g>
      <g className="art-smoke art-delay" fill="#efe3c8" opacity=".6">
        <circle cx="-4" cy="-12" r="6" /><circle cx="7" cy="-26" r="5" />
      </g>
    </g>

    {/* Warehouse with flat roof, dock door and pipe-connected silo. */}
    <g stroke="#213f36" strokeWidth="2.2">
      <path d="M192 164v-42h62v42z" fill="#879389" />
      <path d="M188 118h70v5h-70z" fill="#25443b" />
      <g fill="#e7c06b" stroke="none" className="art-pulse art-delay"><rect x="201" y="128" width="9" height="11" /><rect x="216" y="128" width="9" height="11" /><rect x="231" y="128" width="9" height="11" /></g>
      <rect x="204" y="146" width="22" height="18" fill="#25443b" />
      <rect x="235" y="146" width="12" height="18" fill="#25443b" />
      <path d="M204 155h22" stroke="#c7b58c" strokeWidth="1" />
    </g>

    <g stroke="#213f36" strokeWidth="2">
      <path d="M268 164V104a17 12 0 0 1 34 0v60z" fill="#d4c5a1" />
      <ellipse cx="285" cy="104" rx="17" ry="11" fill="#e6d9b8" />
      <path d="M268 126h34M268 146h34" stroke="#a08c66" strokeWidth="1.4" />
      <path d="M254 136h14v8h-14z" fill="#9a8a68" />
    </g>
    <g stroke="#e7c06b" strokeWidth="1.6" strokeDasharray="3 4" className="art-dash">
      <path d="M255 140h13M180 156h12" />
    </g>

    {/* Yard: crates and bollards sit on the paving, not in mid-air. */}
    <g fill="#8d7a58" opacity=".9">
      <rect x="24" y="178" width="20" height="18" /><rect x="47" y="172" width="15" height="24" />
      <rect x="24" y="174" width="20" height="4" fill="#c7b58c" /><rect x="47" y="168" width="15" height="4" fill="#c7b58c" />
    </g>
    <g fill="#c7b58c"><rect x="120" y="190" width="5" height="12" /><rect x="152" y="190" width="5" height="12" /><rect x="184" y="190" width="5" height="12" /></g>

    {/* Animated circular-economy loop centered cleanly above the warehouse and silo. */}
    <g transform="translate(248 48)">
      <circle r="24" fill="#f4ead238" stroke="#9b5f3d" strokeWidth="1" strokeOpacity=".35" />
      <circle r="21" fill="none" stroke="#9b5f3d" strokeWidth="2" strokeDasharray="5 5" className="art-dash" />
      <g className="art-rotor" fill="none" stroke="#25443b" strokeWidth="2" strokeLinecap="round">
        <circle r="15" fill="transparent" stroke="none" />
        <path d="M-12-6A13 13 0 0 1 10-8" stroke="#9b5f3d" />
        <path d="m7-11 4 3-4 4" stroke="#9b5f3d" />
        <path d="M12 6A13 13 0 0 1-10 8" stroke="#25443b" />
        <path d="m-7 11-4-3 4-4" stroke="#25443b" />
        <circle r="4.5" fill="#d4c5a1" stroke="#25443b" strokeWidth="1.6" />
      </g>
    </g>

    <g stroke="#7d6a49" strokeWidth="1.2" opacity=".5"><path d="M0 186h320M0 206h320" /></g>
  </svg>

  if (world === 'transporte') return <svg {...common}>
    <defs>
      <linearGradient id="world-transport-sky" x2="0" y2="1"><stop stopColor="#b9d8d3" /><stop offset="1" stopColor="#eee4c9" /></linearGradient>
      <linearGradient id="world-transport-road" x2="0" y2="1"><stop stopColor="#55625c" /><stop offset="1" stopColor="#283b36" /></linearGradient>
    </defs>
    <rect width="320" height="220" fill="url(#world-transport-sky)" />
    <circle cx="270" cy="42" r="20" fill="#e7b65d" className="art-pulse" />
    <path d="M0 108 40 84l30 12 42-34 34 30 36-15 48 30 40-16 50 24v23H0z" fill="#87a57d" />

    {/* Buildings and sidewalk share the same street line. */}
    <g stroke="#315448" strokeWidth="2">
      <path d="M22 144v-34h34v34z" fill="#e9e0c9" /><path d="M17 110 39 93l22 17z" fill="#b8704a" />
      <g fill="#d9b66c" stroke="none"><rect x="30" y="116" width="6" height="8" /><rect x="42" y="116" width="6" height="8" /></g>
      <rect x="36" y="132" width="8" height="12" fill="#55725f" stroke="none" />
      <path d="M66 144v-48h38v48z" fill="#e9e0c9" /><path d="M63 96h44v5H63z" fill="#b8704a" />
      <g fill="#d9b66c" stroke="none"><rect x="73" y="104" width="7" height="8" /><rect x="89" y="104" width="7" height="8" /><rect x="73" y="120" width="7" height="8" /><rect x="89" y="120" width="7" height="8" /></g>
      <path d="M114 144v-26h28v26z" fill="#e9e0c9" /><path d="M110 118 128 104l18 14z" fill="#b8704a" />
    </g>
    <rect y="144" width="320" height="14" fill="#d8cfb5" />
    <path d="M0 144h320M0 158h320" stroke="#a99a7c" strokeWidth="1.6" />

    {/* Road surface and animated lane markings. */}
    <path d="M0 158h320v62H0z" fill="url(#world-transport-road)" />
    <g stroke="#e9dfc9" strokeWidth="2.4" strokeDasharray="16 14" opacity=".7" className="art-dash"><path d="M0 190h320" /></g>

    {/* Bus on the far lane with cruise motion and spinning wheel hubs. */}
    <g className="art-vehicle">
      <g transform="translate(118 148)">
        <path d="M0 14q0-14 16-14h92q14 0 16 14v34H0z" fill="#d8a94f" stroke="#1f3a33" strokeWidth="2.2" />
        <g fill="#bcd8d1"><rect x="10" y="8" width="20" height="16" rx="2" /><rect x="36" y="8" width="20" height="16" rx="2" /><rect x="62" y="8" width="20" height="16" rx="2" /><rect x="88" y="8" width="16" height="16" rx="2" /></g>
        <path d="M6 30h114" stroke="#1f3a33" strokeWidth="1.6" />
        {[27, 96].map(cx => (
          <g key={cx} transform={`translate(${cx} 48)`}>
            <circle r="9" fill="#1c342e" />
            <g className="art-rotor" stroke="#d8cfb5" strokeWidth="1.4"><circle r="7" fill="transparent" stroke="none" /><path d="M-5.5 0h11M0-5.5v11" /></g>
            <circle r="3" fill="#e9dfc9" />
          </g>
        ))}
      </g>
    </g>

    {/* High-contrast bicycle and rider moving in the near lane. */}
    <g className="art-vehicle-alt">
      <g transform="translate(22 176)" fill="none">
        {[0, 42].map(cx => (
          <g key={cx} transform={`translate(${cx} 26)`}>
            <circle r="12" stroke="#e9dfc9" strokeWidth="2.6" />
            <g className="art-rotor" stroke="#e7b65d" strokeWidth="1.2"><circle r="10" fill="transparent" stroke="none" /><path d="M-9 0h18M0-9v18" /></g>
            <circle r="2" fill="#e9dfc9" />
          </g>
        ))}
        <path d="M0 26 14 8h16l12 18M14 8l9 18M23 26h19M30 8l5-7h9" stroke="#e7b65d" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="36" cy="-12" r="5.4" fill="#f1d9a7" />
        <path d="M36-6 32 8M33 2 46 7" stroke="#d87a4a" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M32 8 27 18M32 8l9 8M47 4l5-3" stroke="#e9dfc9" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </g>

    {/* Pedestrian on the sidewalk, feet on the pavement. */}
    <g transform="translate(178 144)" stroke="#24483e" fill="none" strokeWidth="2.2">
      <circle cy="-27" r="4.6" fill="#24483e" stroke="none" />
      <path d="M0-22v12M0-15-6-6M0-15l7-8M0-10l-5 10M0-10l6 10" />
    </g>

    {/* Street trees rooted in the sidewalk with gentle sway. */}
    <g stroke="#315448" strokeWidth="2">
      <g className="art-sway"><path d="M294 144v-24m0 0-11-10m11 10 10-11" /><circle cx="294" cy="112" r="7" fill="#5f8a5e" /></g>
      <g className="art-sway art-delay"><path d="M312 144v-18m0 0-8-8m8 8 8-8" /><circle cx="312" cy="118" r="5.5" fill="#6f9870" /></g>
    </g>

    <g stroke="#7f8f7e" strokeWidth="1.1" opacity=".4"><path d="M0 174h320M0 208h320" /></g>
  </svg>

  if (world === 'bosques') return <svg {...common}>
    <defs>
      <linearGradient id="world-forest-sky" x2="0" y2="1"><stop stopColor="#e4ecd8" /><stop offset="1" stopColor="#a9c298" /></linearGradient>
      <pattern id="world-forest-soil" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="4" cy="6" r="1.2" fill="#6f5436" /><circle cx="13" cy="12" r="1" fill="#8b6842" /></pattern>
    </defs>
    <rect width="320" height="220" fill="url(#world-forest-sky)" />
    <circle cx="262" cy="40" r="18" fill="#e6b95f" opacity=".95" />
    <g stroke="#527a5a" strokeWidth="1.6" fill="none" opacity=".55"><path d="M210 44q5-5 10 0M230 54q5-5 10 0M58 58q4-4 8 0" /></g>

    <path d="M0 122q44-24 84-4t76-8 74 4 86-4v44H0z" fill="#88a67c" />
    <path d="M0 148q48-16 90 2t84-6 72 4 74-2v16H0z" fill="#5b7f57" />

    {/* Ground surface and exposed soil section below it. */}
    <path d="M0 168h320v52H0z" fill="#7d603e" />
    <path d="M0 168h320v13H0z" fill="#456b45" />
    <rect y="181" width="320" height="39" fill="url(#world-forest-soil)" opacity=".6" />
    <path d="M0 168h320" stroke="#35553a" strokeWidth="1.6" />
    <g stroke="#5d462c" strokeWidth="1.2" opacity=".55"><path d="M0 190h320M0 208h320" /></g>

    {/* Mushrooms on the forest floor, rooted at the surface line. */}
    <g transform="translate(218 168)" stroke="#7a5c3c" strokeWidth="1.2">
      <path d="M-8 0q0-7 8-7t8 7z" fill="#e2c88f" />
      <path d="M0-7v7" fill="none" />
    </g>
    <g transform="translate(232 169)" stroke="#7a5c3c" strokeWidth="1">
      <path d="M-5 0q0-5 5-5t5 5z" fill="#d5b97d" />
      <path d="M0-5v5" fill="none" />
    </g>

    {/* Three rooted trees: canopies above ground, roots entering the soil. */}
    <g>
      <path d="M78 170V102" stroke="#654932" strokeWidth="9" />
      <path d="M78 170q-9 4-15 12m15-12q9 4 15 10M73 168q-3 15-1 26m6-26q5 13 3 24" stroke="#4b3522" strokeWidth="2.4" fill="none" />
      <g fill="#22624b"><circle cx="78" cy="84" r="34" /><circle cx="51" cy="98" r="21" /><circle cx="105" cy="96" r="20" /><circle cx="78" cy="56" r="18" /></g>
      <g fill="#2f7556"><circle cx="64" cy="78" r="13" /><circle cx="93" cy="88" r="11" /></g>
    </g>
    <g>
      <path d="M182 170v-58" stroke="#6c4d33" strokeWidth="7.5" />
      <path d="M182 170q-7 3-12 10m12-10q7 3 12 9M178 168q-3 13-1 22m5-22q4 12 2 21" stroke="#4b3522" strokeWidth="2" fill="none" />
      <g fill="#1f5e49"><circle cx="182" cy="92" r="27" /><circle cx="161" cy="103" r="17" /><circle cx="203" cy="101" r="18" /><circle cx="182" cy="72" r="15" /></g>
      <g fill="#3c815d"><circle cx="172" cy="89" r="10" /><circle cx="194" cy="97" r="9" /></g>
    </g>
    <g>
      <path d="M262 170v-40" stroke="#654932" strokeWidth="5.6" />
      <path d="M262 170q-5 3-9 9m9-9q6 3 10 8M259 168q-2 10-1 18m4-18q3 10 2 17" stroke="#4b3522" strokeWidth="1.6" fill="none" />
      <g fill="#2a6c50"><circle cx="262" cy="112" r="21" /><circle cx="246" cy="122" r="14" /><circle cx="278" cy="121" r="14" /></g>
      <g fill="#468b61"><circle cx="255" cy="108" r="8" /></g>
    </g>

    {/* Sapling, undergrowth and flowers on the same terrain. */}
    <g transform="translate(122 170)">
      <path d="M0 0v-24" stroke="#5d452c" strokeWidth="3" />
      <path d="M0-15q-9-8-13 1 7 4 13 2M0-19q8-9 13 1-7 4-13 2" fill="#4a8b5d" className="art-sway" />
    </g>
    <g fill="#3f7d58"><ellipse cx="42" cy="167" rx="17" ry="8" /><ellipse cx="222" cy="168" rx="15" ry="7" /><ellipse cx="302" cy="167" rx="16" ry="8" /></g>
    <g fill="#e9c36b"><circle cx="34" cy="165" r="2.4" /><circle cx="230" cy="164" r="2.2" /><circle cx="306" cy="164" r="2.4" /><circle cx="146" cy="166" r="2" /></g>

    {/* Soil life: mycelium and roots stay below the surface line. */}
    <g stroke="#e2c88f" strokeWidth="1.1" fill="none" opacity=".45">
      <path d="M64 186q24 9 42 2t38 8M40 204q28-8 52 1t56-3M206 188q22 7 40-1t48 7" />
    </g>
    <g fill="#e6c16a"><circle cx="58" cy="198" r="2" /><circle cx="104" cy="192" r="1.8" /><circle cx="214" cy="202" r="2" /><circle cx="286" cy="190" r="1.8" /><circle cx="158" cy="210" r="1.8" /></g>
  </svg>

  return <svg {...common}>
    <defs>
      <linearGradient id="world-farm-sky" x2="0" y2="1"><stop stopColor="#d6e7df" /><stop offset="1" stopColor="#f1e5c0" /></linearGradient>
      <linearGradient id="world-farm-pasture" x2="0" y2="1"><stop stopColor="#89ac6e" /><stop offset="1" stopColor="#65884f" /></linearGradient>
      <linearGradient id="world-farm-wheat" x2="0" y2="1"><stop stopColor="#dcb662" /><stop offset="1" stopColor="#bf9546" /></linearGradient>
      <linearGradient id="world-farm-soil" x2="0" y2="1"><stop stopColor="#936d45" /><stop offset="1" stopColor="#6d4e31" /></linearGradient>
    </defs>
    <rect width="320" height="220" fill="url(#world-farm-sky)" />
    <circle cx="262" cy="40" r="19" fill="#e9b95e" className="art-pulse" />
    <path d="M0 96 42 72l32 16 40-32 36 32 36-18 40 26 44-20 50 24v32H0z" fill="#8ea77c" />

    {/* Contoured agroecological terraces replacing the flat grid. */}
    <path d="M0 120q85-9 165-2t155 6v96H0z" fill="url(#world-farm-wheat)" />
    <path d="M0 140q90 9 175-4t145 5v79H0z" fill="url(#world-farm-pasture)" />
    <path d="M0 172q95-14 185 5t135-3v46H0z" fill="url(#world-farm-soil)" />
    <g stroke="#543b24" strokeWidth="1.2" fill="none" opacity=".42">
      <path d="M84 188q75 11 236 0M94 204q85 9 226-1" />
    </g>

    {/* Farmstead cluster: grain silo, rustic barn and farmhouse. */}
    <g transform="translate(12 94)" stroke="#533725" strokeWidth="1.6">
      <rect x="3" y="10" width="13" height="24" fill="#d8c7a3" />
      <path d="M3 10a6.5 5 0 0 1 13 0z" fill="#8d998d" />
      <path d="M20 34V15l12-7 12 7v19z" fill="#9f4735" />
      <rect x="26" y="22" width="11" height="12" fill="#e9dcb8" />
    </g>
    <g transform="translate(60 104)" stroke="#533725" strokeWidth="1.8">
      <path d="M0 28V10L16 1l16 9v18z" fill="#efe2c2" />
      <path d="M-4 11 16-2l20 13z" fill="#b96645" />
      <rect x="6" y="13" width="6" height="6" fill="#6f9790" stroke="none" />
      <rect x="20" y="13" width="6" height="6" fill="#6f9790" stroke="none" />
      <rect x="13" y="19" width="6" height="9" fill="#4f704e" stroke="none" />
    </g>

    {/* Agroforestry shade trees. */}
    <g transform="translate(116 136)">
      <g className="art-sway">
        <path d="M0 0v-18" stroke="#5c422a" strokeWidth="3" />
        <circle cx="0" cy="-24" r="11" fill="#3e724a" /><circle cx="-7" cy="-19" r="7" fill="#4d8456" /><circle cx="7" cy="-20" r="6" fill="#558d5e" />
      </g>
    </g>

    {/* Greenhouse on masonry plinth with green seedlings inside. */}
    <g transform="translate(226 118)" stroke="#3e626e" strokeWidth="1.8" fill="none">
      <rect x="-2" y="30" width="46" height="5" fill="#8b7d64" stroke="#533725" strokeWidth="1.2" />
      <path d="M0 30V14Q21-4 42 14v16z" fill="#d7ebe4" fillOpacity=".72" />
      <g fill="#5b8b4e" stroke="none"><circle cx="21" cy="25" r="3.5" /><circle cx="29" cy="24" r="4" /></g>
      <path d="M0 14h42M11 30V6M21 30V2M31 30V6" opacity=".82" />
      <path d="M6 30V20h8v10" fill="#bdd4cb" />
    </g>

    {/* High-contrast woolly sheep on the green meadow. */}
    {[
      { x: 148, y: 154, s: 0.6 },
      { x: 182, y: 162, s: 0.52 },
    ].map((sh, idx) => (
      <g key={idx} transform={`translate(${sh.x} ${sh.y}) scale(${sh.s})`}>
        <path d="M-8 8v8M-2 8v8M6 8v8M11 8v8" stroke="#352b24" strokeWidth="2.8" strokeLinecap="round" />
        <g fill="#f4ead2" stroke="#7d6a49" strokeWidth="1.4">
          <circle cx="-6" cy="0" r="7.5" /><circle cx="3" cy="-2" r="8.5" /><circle cx="10" cy="2" r="6.5" /><circle cx="-1" cy="4" r="7.5" />
        </g>
        <ellipse cx="16" cy="-2" rx="5.5" ry="4.5" fill="#352b24" />
      </g>
    ))}

    {/* Swaying wheat and leafy crops along cultivated soil contours. */}
    <g fill="none" strokeLinecap="round">
      {[
        { x: 102, y: 190, c: '#5c8c4a', d: '' },
        { x: 138, y: 204, c: '#d8a63c', d: ' art-delay' },
        { x: 178, y: 192, c: '#5c8c4a', d: '' },
        { x: 218, y: 206, c: '#d8a63c', d: ' art-delay' },
        { x: 264, y: 194, c: '#5c8c4a', d: '' },
        { x: 294, y: 206, c: '#d8a63c', d: ' art-delay' },
      ].map((p, idx) => (
        <g key={idx} transform={`translate(${p.x} ${p.y})`}>
          <g className={`art-sway${p.d}`} stroke={p.c} strokeWidth="2">
            <path d="M0 0v-18m0 11-5-5m5 2 6-6m-6 12-5-5m5 2 5-5" />
          </g>
        </g>
      ))}
    </g>

    {/* Irrigation pond at lower left with animated water ripples. */}
    <ellipse cx="44" cy="198" rx="38" ry="10" fill="#6f9ba0" stroke="#476e74" strokeWidth="1.2" />
    <ellipse cx="38" cy="197" rx="18" ry="3.2" fill="#c8e0dc" className="art-ripple" />
    <g stroke="#4a7441" strokeWidth="1.5" fill="none">
      <g transform="translate(14 198)"><g className="art-sway"><path d="M0 0v-14M-3 0q-1-7-5-10" /></g></g>
    </g>
  </svg>
}
