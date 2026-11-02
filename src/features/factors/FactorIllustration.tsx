type Props = { factor: string; title: string }

const common = { viewBox: '0 0 640 420', role: 'img' as const, className: 'factor-illustration' }

/** Original vector scenes for the five factors; no stock imagery. */
export function FactorIllustration({ factor, title }: Props) {
  const label = `Ilustración editorial del factor ${title}`

  if (factor === 'energia') return <svg {...common} aria-label={label}>
    <defs>
      <linearGradient id="energy-sky" x2="0" y2="1"><stop stopColor="#173f3b" /><stop offset="1" stopColor="#50756a" /></linearGradient>
      <linearGradient id="energy-ground" x2="0" y2="1"><stop stopColor="#263f38" /><stop offset="1" stopColor="#122a26" /></linearGradient>
      <radialGradient id="energy-sun"><stop stopColor="#f5c46b" /><stop offset="1" stopColor="#d6783f" /></radialGradient>
    </defs>
    <rect width="640" height="420" fill="url(#energy-sky)" />
    <g opacity=".2" stroke="#f2e4c2" fill="none"><path d="M0 80h640M0 140h640M0 200h640" /><path d="M80 0v280M240 0v280M400 0v280M560 0v280" strokeDasharray="2 8" /></g>
    <circle cx="510" cy="82" r="46" fill="url(#energy-sun)" className="art-pulse" />
    <g transform="translate(100 76)" stroke="#f4e7c9" fill="none" strokeWidth="3">
      <path d="M0 0v150" /><path d="M0 0 58 27M0 0-40 44M0 0 8-57" className="art-sway" />
      <circle r="5" fill="#f4e7c9" stroke="none" />
    </g>
    <g transform="translate(196 122)" stroke="#f4e7c9" fill="none" strokeWidth="3">
      <path d="M0 0v104" /><path d="M0 0 44 21M0 0-31 34M0 0 4-44" className="art-sway art-delay" />
      <circle r="4" fill="#f4e7c9" stroke="none" />
    </g>
    <rect y="282" width="640" height="138" fill="url(#energy-ground)" />
    <g fill="#e9dcbd" stroke="#102b26" strokeWidth="3">
      <path d="M34 282v-86h58v86zm-8-86h74l-37-32z" />
      <path d="M106 282v-122h84v122h-15v-85h-22v85h-14v-58h-18v58z" />
      <path d="M211 282v-64h48v64z" />
      <path d="M473 282v-98h37v98zM521 282v-138h62v138h-14v-92h-18v92z" />
      <path d="M264 282v-45h30v45zm75 0v-74h50v74z" />
    </g>
    <g fill="#e4b45d">
      <path d="M48 216h10v11H48zm20 0h10v11H68zm20 0h10v11H88zM122 180h10v12h-10zm24 0h10v12h-10zm24 0h10v12h-10zm-48 30h10v12h-10zm24 0h10v12h-10zm24 0h10v12h-10zM225 240h8v10h-8zm12 0h8v10h-8zM285 245h9v10h-9zm24 0h9v10h-9zM489 204h9v10h-9zm14 0h9v10h-9zM539 170h9v12h-9zm18 0h9v12h-9zM539 194h9v12h-9zm18 0h9v12h-9z" />
    </g>
    <g fill="none" stroke="#e9bb62" strokeWidth="3" strokeDasharray="7 7">
      <path d="M100 270q95-22 170 0t179 0" />
      <path d="M196 270q110-16 210 0" />
    </g>
    <g fill="#f1e4c8" fontFamily="Georgia,serif" fontSize="12" letterSpacing="2.5">
      <text x="40" y="356">CIUDAD</text><text x="255" y="356">RED ELÉCTRICA</text><text x="490" y="356">GENERACIÓN</text>
    </g>
    <path d="M0 388h640" stroke="#9e7b4d" strokeWidth="2" />
    <text x="40" y="407" fill="#caa977" fontFamily="Arial,sans-serif" fontSize="10" letterSpacing="2">ENERGÍA · UNA CIUDAD NO SE APAGA, SE TRANSFORMA</text>
  </svg>

  if (factor === 'industria') return <svg {...common} aria-label={label}>
    <defs>
      <linearGradient id="industry-bg" x2="1" y2="1"><stop stopColor="#e6dcc4" /><stop offset="1" stopColor="#cbbd9d" /></linearGradient>
      <pattern id="industry-grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0v26" fill="none" stroke="#8d7a58" strokeWidth=".6" opacity=".35" /></pattern>
    </defs>
    <rect width="640" height="420" fill="url(#industry-bg)" />
    <rect width="640" height="420" fill="url(#industry-grid)" />
    <path d="M0 66h640v22H0z" fill="#23473d" />
    <text x="30" y="52" fill="#23473d" fontFamily="Georgia,serif" fontSize="13" letterSpacing="3">MATERIA · PROCESO · RETORNO</text>
    <g transform="translate(46 115)">
      <path d="M0 120h200v-58l-34 21V48l-34 21V32l-34 21V10L0 34z" fill="#536d61" stroke="#213f36" strokeWidth="3" />
      <g fill="#e7c06b"><rect x="26" y="62" width="13" height="17" /><rect x="48" y="62" width="13" height="17" /><rect x="82" y="70" width="13" height="17" /><rect x="104" y="70" width="13" height="17" /></g>
      <path d="M64 10V-22" stroke="#213f36" strokeWidth="4" />
      <g className="art-smoke" fill="#f4ead2" opacity=".7"><circle cx="64" cy="-30" r="15" /><circle cx="80" cy="-42" r="12" /><circle cx="50" cy="-48" r="10" /></g>
    </g>
    <g transform="translate(286 258)">
      <rect x="-8" y="0" width="320" height="58" rx="5" fill="#25443b" />
      <g className="art-conveyor" fill="#d7c39b" stroke="#1c3831" strokeWidth="2">
        <rect x="18" y="-34" width="42" height="34" /><rect x="86" y="-34" width="42" height="34" /><rect x="154" y="-34" width="42" height="34" /><rect x="222" y="-34" width="42" height="34" />
      </g>
      <g fill="#d9a74f"><circle cx="30" cy="56" r="7" /><circle cx="98" cy="56" r="7" /><circle cx="166" cy="56" r="7" /><circle cx="234" cy="56" r="7" /></g>
    </g>
    <g transform="translate(512 118)" fill="none" stroke="#9b5f3d" strokeWidth="3">
      <path d="M0 0a64 64 0 1 1-2 128" strokeDasharray="8 9" className="art-dash" />
      <path d="m-10 118 10 14 12-12" />
      <text x="-34" y="76" fill="#7c4d33" stroke="none" fontFamily="Arial,sans-serif" fontSize="11" letterSpacing="1.5">REUSO</text>
    </g>
    <g fill="#23473d" fontFamily="Georgia,serif" fontSize="12" letterSpacing="2">
      <text x="52" y="330">PLANTA</text><text x="300" y="368">CADENA DE MATERIALES</text><text x="382" y="110">CICLO</text>
    </g>
    <path d="M0 390h640" stroke="#7d6a49" strokeWidth="2" />
    <text x="30" y="410" fill="#3f5547" fontFamily="Arial,sans-serif" fontSize="10" letterSpacing="2">INDUSTRIA · NADA DESAPARECE, TODO SE TRANSFORMA</text>
  </svg>

  if (factor === 'transporte') return <svg {...common} aria-label={label}>
    <defs>
      <linearGradient id="transport-sky" x2="0" y2="1"><stop stopColor="#b9d8d3" /><stop offset="1" stopColor="#e9e0c7" /></linearGradient>
      <linearGradient id="transport-road" x2="0" y2="1"><stop stopColor="#4e5c57" /><stop offset="1" stopColor="#283b36" /></linearGradient>
    </defs>
    <rect width="640" height="420" fill="url(#transport-sky)" />
    <circle cx="520" cy="72" r="34" fill="#e7b65d" />
    <path d="M0 232 68 184l54 18 72-66 62 58 66-28 82 52 66-30 110 40v90H0z" fill="#7e9b78" />
    <g fill="#e9e0c9" stroke="#315448" strokeWidth="2">
      <path d="M88 214v-58h30v58zm40 0v-82h26v82z" /><path d="M442 220v-46h32v46z" />
    </g>
    <path d="M0 258q300 20 640-16v178H0z" fill="url(#transport-road)" />
    <path d="M0 330q300 16 640-12" fill="none" stroke="#f0dba9" strokeWidth="4" strokeDasharray="18 16" />
    <g transform="translate(214 286)">
      <path d="M0 20q0-20 19-20h89q18 0 25 20v54H0z" fill="#daae4d" stroke="#1f3a33" strokeWidth="3" />
      <rect x="18" y="6" width="31" height="22" rx="2" fill="#c4ded8" /><rect x="55" y="6" width="31" height="22" rx="2" fill="#c4ded8" />
      <circle cx="22" cy="76" r="12" fill="#1c342e" /><circle cx="112" cy="76" r="12" fill="#1c342e" />
      <path d="M42 34h43" stroke="#1f3a33" strokeWidth="3" />
    </g>
    <g transform="translate(436 250)" fill="none" stroke="#24483e" strokeWidth="4">
      <circle cx="0" cy="24" r="24" /><circle cx="56" cy="24" r="24" /><path d="m0 24 23-31 33 31H0l23-31 12-20h16" />
    </g>
    <g transform="translate(70 274)" stroke="#24483e" strokeWidth="4" fill="none">
      <path d="M-22 36h44M-16 36l13-44m16 44 8-31m-28 10h21" /><circle cx="-28" cy="40" r="6" fill="#24483e" /><circle cx="30" cy="40" r="6" fill="#24483e" />
    </g>
    <g transform="translate(126 206)" fill="#24483e" fontFamily="Arial,sans-serif" fontSize="10" letterSpacing="1.4">
      <text x="-32" y="-6">CAMINAR</text><text x="414" y="116">PEDALEAR</text>
    </g>
    <g stroke="#2f5b4b" strokeWidth="2.5" fill="none"><path d="M0 176h640" /><path d="M0 196h640" strokeDasharray="5 9" /></g>
    <text x="34" y="404" fill="#dfd3b2" fontFamily="Arial,sans-serif" fontSize="10" letterSpacing="2">MOVILIDAD · CADA VIAJE ES UNA DECISIÓN</text>
  </svg>

  if (factor === 'bosques') return <svg {...common} aria-label={label}>
    <defs>
      <linearGradient id="forest-sky" x2="0" y2="1"><stop stopColor="#dfe7cd" /><stop offset="1" stopColor="#9ab38c" /></linearGradient>
      <pattern id="forest-soil" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="4" cy="6" r="1.2" fill="#6f5436" /><circle cx="13" cy="12" r="1" fill="#8b6842" /></pattern>
    </defs>
    <rect width="640" height="420" fill="url(#forest-sky)" />
    <circle cx="512" cy="66" r="31" fill="#e6b95f" opacity=".9" />
    <path d="M0 202q90-50 174-6t153-15q88-38 152 8t161-4v120H0z" fill="#6d8f65" />
    <path d="M0 268q100-34 185 3t171-12q82-30 144 9t140-4v156H0z" fill="#4f714f" />
    <g fill="#1f5e49">
      <path d="M84 274v-88" stroke="#654932" strokeWidth="10" /><circle cx="84" cy="164" r="50" /><circle cx="48" cy="182" r="31" /><circle cx="119" cy="180" r="29" />
      <path d="M246 282v-116" stroke="#6c4d33" strokeWidth="11" /><circle cx="246" cy="142" r="57" /><circle cx="205" cy="161" r="34" /><circle cx="285" cy="158" r="31" />
      <path d="M414 278v-96" stroke="#654932" strokeWidth="9" /><circle cx="414" cy="158" r="44" /><circle cx="382" cy="174" r="27" /><circle cx="446" cy="173" r="26" />
    </g>
    <g fill="#e9c36b"><circle cx="62" cy="306" r="4" /><circle cx="172" cy="312" r="4" /><circle cx="332" cy="300" r="4" /><circle cx="512" cy="310" r="4" /></g>
    <path d="M0 330h640v90H0z" fill="#7b5f3d" />
    <path d="M0 330h640v24H0z" fill="#36573b" />
    <g stroke="#543f28" strokeWidth="3" fill="none" opacity=".9">
      <path d="M84 332v42m0-30-18 12m18-3 20 14m-20 4-15 12m15-8 18 11" />
      <path d="M246 332v36m0-26-22 11m22-3 23 12m-23 4-18 10m18-6 20 9" />
      <path d="M414 332v44m0-32-16 13m16-2 17 12m-17 2-13 13m13-9 16 12" />
    </g>
    <g transform="translate(520 326)" fill="none" stroke="#5b432b" strokeWidth="3" strokeDasharray="4 5"><path d="M0 0h54v54H0z" /><path d="m0 0 54 54m0-54L0 54" /></g>
    <g fill="#f0e6cc" fontFamily="Georgia,serif" fontSize="11" letterSpacing="2"><text x="40" y="384">SUELO VIVO</text><text x="470" y="384">CLARO</text></g>
    <text x="30" y="410" fill="#e9dcc0" fontFamily="Arial,sans-serif" fontSize="10" letterSpacing="2">BOSQUE · EL CARBONO TAMBIÉN VIVE BAJO TIERRA</text>
  </svg>

  return <svg {...common} aria-label={label}>
    <defs>
      <linearGradient id="farm-sky" x2="0" y2="1"><stop stopColor="#cfe3dc" /><stop offset="1" stopColor="#f0e3bf" /></linearGradient>
      <pattern id="farm-rows" width="44" height="22" patternUnits="userSpaceOnUse"><path d="M0 22h44" stroke="#8a744a" strokeWidth="4" opacity=".5" /></pattern>
    </defs>
    <rect width="640" height="420" fill="url(#farm-sky)" />
    <circle cx="512" cy="68" r="34" fill="#e9b95e" />
    <path d="M0 184 88 140l61 30 79-62 69 62 72-34 76 52 83-40 112 46v80H0z" fill="#9bb189" />
    <path d="M0 232h640v188H0z" fill="#c3a86d" />
    <path d="M0 232h640v188H0z" fill="url(#farm-rows)" />
    <g transform="translate(42 246)" stroke="#5d7b4b" strokeWidth="3" fill="none">
      <path d="M0 0h486M0 58h486M0 116h486" /><path d="M0 0v116m81-116v116m81-116v116m81-116v116m81-116v116m81-116v116m81-116v116" />
    </g>
    <g fill="#5b8b4e">
      <path d="M60 266v-20m0 10-8-8m8 4 9-9" /><path d="M141 266v-20m0 10-8-8m8 4 9-9" /><path d="M222 266v-20m0 10-8-8m8 4 9-9" /><path d="M384 266v-20m0 10-8-8m8 4 9-9" />
    </g>
    <g transform="translate(450 196)">
      <path d="M58 62V24L0 62z" fill="#b96645" stroke="#6b4330" strokeWidth="3" />
      <rect x="10" y="62" width="52" height="42" fill="#e9dcb8" stroke="#6b4330" strokeWidth="3" />
      <rect x="26" y="76" width="20" height="28" fill="#5c7b58" />
    </g>
    <g transform="translate(308 272)" fill="#314f3e">
      <ellipse cx="0" cy="0" rx="26" ry="15" /><circle cx="25" cy="-10" r="9" /><path d="M-7 12v20m16-18v18m-24-18v22m32-22v22" stroke="#314f3e" strokeWidth="4" />
    </g>
    <g transform="translate(378 284)" fill="#314f3e">
      <ellipse cx="0" cy="0" rx="19" ry="11" /><circle cx="18" cy="-8" r="7" /><path d="M-5 9v16m12-15v15m-18-14v18m24-18v18" stroke="#314f3e" strokeWidth="3" />
    </g>
    <g transform="translate(188 236)" fill="none" stroke="#4e7380" strokeWidth="3">
      <path d="M0 0h132" /><path d="M0 0v38" strokeDasharray="4 6" /><circle cx="72" cy="58" r="40" strokeDasharray="5 7" className="art-dash" />
    </g>
    <g fill="#375942" fontFamily="Georgia,serif" fontSize="11" letterSpacing="2"><text x="52" y="398">CULTIVO</text><text x="276" y="398">GANADO</text><text x="470" y="398">INVERNADERO</text></g>
    <text x="30" y="414" fill="#4a5d44" fontFamily="Arial,sans-serif" fontSize="9" letterSpacing="2">AGRICULTURA · ALIMENTAR TAMBIÉN ES CUIDAR EL SUELO</text>
  </svg>
}
