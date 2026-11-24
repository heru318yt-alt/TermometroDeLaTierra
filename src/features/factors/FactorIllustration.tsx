import type { ReactNode } from 'react'

type Props = { factor: string; title: string }

type PlateSpec = {
  badge: string
  render: () => ReactNode
}

const PLATES: Record<string, PlateSpec> = {
  energia: {
    badge: '01 · ENERGÍA',
    render: () => (
      <g className="factor-scene factor-scene-energia">
        <rect width="640" height="420" fill="var(--sj-sky-a)" />
        <path d="M0 166Q200 144 400 164T640 154V420H0Z" fill="var(--sj-sky-b)" />
        <circle cx="518" cy="90" r="46" fill="var(--sj-sun)" className="art-pulse" />

        {/* Distant layered ridges */}
        <path d="M0 240L96 208L186 226L302 192L444 222L540 198L640 218V420H0Z" fill="var(--sj-far)" />
        <path d="M0 264H640V420H0Z" fill="var(--sj-water)" />
        <g fill="var(--sj-glow)" opacity=".45" className="art-ripple">
          <rect x="218" y="276" width="66" height="3" rx="1.5" />
          <rect x="272" y="290" width="84" height="3" rx="1.5" />
        </g>

        {/* Left Fossil Thermal Plant Plateau (Carbón / Gas y humo CO2) */}
        <path d="M0 248H188L230 330H0Z" fill="var(--sj-mid)" />
        <g transform="translate(24 190)">
          <rect x="0" y="34" width="116" height="36" fill="var(--sj-near)" />
          <polygon points="0,34 26,18 52,34 78,18 116,34" fill="var(--sj-near)" />
          <polygon points="16,34 30,34 26,-16 20,-16" fill="var(--sj-near)" />
          <polygon points="88,34 102,34 98,-8 92,-8" fill="var(--sj-near)" />
          <rect x="14" y="46" width="18" height="12" fill="var(--sj-accent)" className="art-pulse" />
          <rect x="44" y="46" width="18" height="12" fill="var(--sj-accent)" className="art-pulse art-delay" />
          <g transform="translate(23 -20)">
            <g className="art-smoke" fill="var(--sj-near)" opacity=".55">
              <circle cx="4" cy="-6" r="11" />
              <circle cx="20" cy="-16" r="15" />
              <circle cx="44" cy="-24" r="11" />
            </g>
          </g>
          <g transform="translate(95 -12)">
            <g className="art-smoke art-delay" fill="var(--sj-near)" opacity=".45">
              <circle cx="4" cy="-5" r="9" />
              <circle cx="18" cy="-14" r="12" />
            </g>
          </g>
        </g>

        {/* Right Clean Transition Ridge: Wind + Solar + Battery Storage */}
        <path d="M332 292Q468 258 640 278V420H300Z" fill="var(--sj-mid)" />

        {/* Three centered wind turbines planted solidly on right ridge */}
        {[
          { x: 432, y: 278, h: 112, r: 40, delay: ' art-delay' },
          { x: 508, y: 270, h: 138, r: 50, delay: '' },
          { x: 582, y: 280, h: 100, r: 36, delay: ' art-delay' },
        ].map(t => (
          <g key={t.x} transform={`translate(${t.x} ${t.y})`}>
            <polygon points={`-4.5,0 4.5,0 1.6,-${t.h} -1.6,-${t.h}`} fill="var(--sj-light)" />
            <g transform={`translate(0 -${t.h})`}>
              <g className={`art-rotor${t.delay}`}>
                <circle r={t.r} fill="transparent" />
                <polygon points={`-2.6,0 2.6,0 0,-${t.r}`} fill="var(--sj-light)" />
                <polygon points={`-2.6,0 2.6,0 0,-${t.r}`} fill="var(--sj-light)" transform="rotate(120)" />
                <polygon points={`-2.6,0 2.6,0 0,-${t.r}`} fill="var(--sj-light)" transform="rotate(240)" />
              </g>
              <circle r="4.2" fill="var(--sj-accent)" />
            </g>
          </g>
        ))}

        {/* Angled solar collector panels & battery storage container */}
        <g transform="translate(362 292)">
          <rect x="20" y="28" width="4" height="12" fill="var(--sj-near)" />
          <rect x="82" y="32" width="4" height="12" fill="var(--sj-near)" />
          <polygon points="0,28 54,10 86,20 32,38" fill="var(--sj-panel)" />
          <polygon points="56,32 110,14 142,24 88,42" fill="var(--sj-panel)" />
          <polygon points="10,27 50,14 60,18 20,31" fill="var(--sj-glow)" opacity=".5" className="art-pulse" />
        </g>

        {/* Grid Battery Storage Unit + Electrical Grid Pylons feeding foreground city */}
        <path d="M0 344Q190 318 390 346T640 338V420H0Z" fill="var(--sj-near)" />
        <g fill="none" strokeLinecap="round">
          <path d="M140 242Q156 286 172 305Q206 320 240 305Q257 316 274 321" stroke="var(--sj-light)" strokeOpacity=".35" strokeWidth="1.6" />
          <path d="M324 321Q353 326 382 324" stroke="var(--sj-light)" strokeOpacity=".35" strokeWidth="1.6" />
          <path d="M140 242Q156 286 172 305Q206 320 240 305Q257 316 274 321" stroke="var(--sj-sun)" strokeWidth="2.4" strokeDasharray="8 16" className="art-dash" />
          <path d="M324 321Q353 326 382 324" stroke="var(--sj-sun)" strokeWidth="2.4" strokeDasharray="8 16" className="art-dash" />
        </g>
        <g transform="translate(274 308)">
          <rect x="0" y="0" width="46" height="26" rx="4" fill="var(--sj-panel)" />
          <rect x="46" y="7" width="4" height="12" rx="1.5" fill="var(--sj-light)" />
          <rect x="7" y="6" width="8" height="14" rx="1.5" fill="var(--sj-sun)" className="art-pulse" />
          <rect x="19" y="6" width="8" height="14" rx="1.5" fill="var(--sj-sun)" className="art-pulse art-delay" />
          <rect x="31" y="6" width="8" height="14" rx="1.5" fill="var(--sj-glow)" className="art-pulse" />
        </g>
        {[172, 240].map(x => (
          <g key={x} transform={`translate(${x} 336)`}>
            <polygon points="-8,24 -1.5,-40 1.5,-40 8,24 4,24 0,-22 -4,24" fill="var(--sj-light)" opacity=".9" />
            <rect x="-12" y="-32" width="24" height="3" fill="var(--sj-light)" />
          </g>
        ))}

        {/* Town cottages lit cleanly along bottom terrace */}
        <g>
          <polygon points="56,404 114,404 114,376 85,352 56,376" fill="var(--sj-light)" />
          <polygon points="85,352 114,376 114,404 85,404" fill="var(--sj-accent)" />
          <rect x="67" y="380" width="10" height="12" fill="var(--sj-sun)" className="art-pulse" />
          <polygon points="134,410 182,410 182,386 158,366 134,386" fill="var(--sj-light)" />
          <polygon points="158,366 182,386 182,410 158,410" fill="var(--sj-accent)" />
          <rect x="144" y="390" width="9" height="10" fill="var(--sj-sun)" className="art-pulse art-delay" />
        </g>
      </g>
    ),
  },

  industria: {
    badge: '02 · INDUSTRIA',
    render: () => (
      <g className="factor-scene factor-scene-industria">
        <rect width="640" height="420" fill="var(--sj-sky-a)" />
        <path d="M0 170Q220 150 440 172L640 160V420H0Z" fill="var(--sj-sky-b)" />
        <circle cx="486" cy="88" r="40" fill="var(--sj-sun)" opacity=".85" />

        <path d="M0 236Q150 200 310 226Q460 192 640 220V420H0Z" fill="var(--sj-far)" />

        {/* Centered Circular Economy loop */}
        <g transform="translate(560 76)" opacity=".9">
          <g className="art-rotor" fill="none" strokeWidth="4" strokeLinecap="round">
            <circle r="24" fill="transparent" stroke="none" />
            <path d="M-18-8A20 20 0 0 1 16-10M11-16l6 6-7 5" stroke="var(--sj-accent)" />
            <path d="M18 8A20 20 0 0 1-16 10M-11 16l-6-6 7-5" stroke="var(--sj-near)" />
          </g>
        </g>

        {/* Continuous Industrial Ground Banks & River Channel */}
        <path d="M0 284H640V420H0Z" fill="var(--sj-water)" />
        <path d="M0 264H258L240 420H0Z" fill="var(--sj-near)" />
        <path d="M406 264H640V420H428Z" fill="var(--sj-near)" />

        {/* Bank-to-bank Concrete Arch Bridge (cemento & construcción urbana) */}
        <path
          d="M250 264H414V292H396a26 24 0 0 0-52 0H322a26 24 0 0 0-52 0H250Z"
          fill="var(--sj-mid)"
        />
        <g fill="var(--sj-glow)" opacity=".55" className="art-ripple">
          <rect x="266" y="338" width="84" height="4" rx="2" />
          <rect x="288" y="366" width="96" height="4" rx="2" />
          <rect x="256" y="392" width="72" height="3.5" rx="1.75" />
        </g>

        {/* Left Foundry, Cement Silos & Blast Furnace */}
        <polygon points="74,264 94,264 89,88 79,88" fill="var(--sj-near)" />
        <polygon points="122,264 138,264 134,116 126,116" fill="var(--sj-mid)" />
        <g transform="translate(84 80)">
          <g className="art-smoke" fill="var(--sj-light)" opacity=".74">
            <circle cx="4" cy="-6" r="14" />
            <circle cx="24" cy="-18" r="17" />
            <circle cx="52" cy="-28" r="12" />
          </g>
          <g className="art-smoke art-delay" fill="var(--sj-glow)" opacity=".5">
            <circle cx="14" cy="-12" r="10" />
            <circle cx="38" cy="-24" r="13" />
          </g>
        </g>
        <path d="M28 264V192L72 172V192L116 172V192L160 172V264Z" fill="var(--sj-mid)" />
        <g fill="var(--sj-sun)" className="art-pulse">
          <path d="M52 264V234a13 13 0 0 1 26 0v30Z" />
          <path d="M98 264V234a13 13 0 0 1 26 0v30Z" />
        </g>
        {/* Cement/limestone silos & conveyor feed */}
        <rect x="176" y="168" width="32" height="96" fill="var(--sj-light)" />
        <ellipse cx="192" cy="168" rx="16" ry="7" fill="var(--sj-sun)" />
        <rect x="218" y="182" width="28" height="82" fill="var(--sj-accent)" />
        <ellipse cx="232" cy="182" rx="14" ry="6" fill="var(--sj-sun)" />
        <path
          d="M158 178L192 168L232 182"
          fill="none"
          stroke="var(--sj-near)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M158 178L192 168L232 182"
          fill="none"
          stroke="var(--sj-glow)"
          strokeWidth="2.4"
          strokeDasharray="8 12"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="art-dash"
        />

        {/* Right Bank: Steel Urban Frame & Crane + Recycled Material Stack */}
        <g transform="translate(468 158)">
          {/* Building skeletal frame (acero + concreto) */}
          <rect x="0" y="0" width="96" height="106" fill="none" stroke="var(--sj-light)" strokeWidth="4" />
          <rect x="0" y="34" width="96" height="5" fill="var(--sj-light)" />
          <rect x="0" y="70" width="96" height="5" fill="var(--sj-light)" />
          <rect x="46" y="0" width="5" height="106" fill="var(--sj-light)" />
          <rect x="6" y="75" width="38" height="31" fill="var(--sj-accent)" />
          {/* Tower crane arm */}
          <rect x="-26" y="-42" width="10" height="148" fill="var(--sj-accent)" />
          <polygon points="-46,-42 84,-42 74,-52 -38,-52" fill="var(--sj-sun)" />
          <g transform="translate(56 -42)">
            <g className="art-pendulum">
              <rect x="-1.5" y="0" width="3" height="24" fill="var(--sj-light)" />
              <rect x="-18" y="24" width="36" height="6" fill="var(--sj-glow)" />
            </g>
          </g>
        </g>

        {/* Recycled steel beam yard on foreground left */}
        <g transform="translate(44 334)">
          <rect x="0" y="16" width="58" height="10" fill="var(--sj-light)" />
          <rect x="6" y="4" width="46" height="10" fill="var(--sj-accent)" />
          <rect x="76" y="10" width="52" height="16" fill="var(--sj-mid)" />
        </g>
      </g>
    ),
  },

  transporte: {
    badge: '03 · MOVILIDAD',
    render: () => (
      <g className="factor-scene factor-scene-transporte">
        <rect width="640" height="420" fill="var(--sj-sky-a)" />
        <path d="M0 132Q240 112 640 128V420H0Z" fill="var(--sj-sky-b)" />
        <circle cx="116" cy="74" r="34" fill="var(--sj-sun)" className="art-pulse" />

        {/* Aviation jet & geometric contrail */}
        <path
          d="M276 74Q402 52 522 34"
          fill="none"
          stroke="var(--sj-light)"
          strokeWidth="2.4"
          strokeDasharray="10 14"
          strokeLinecap="round"
          className="art-dash"
        />
        <polygon points="548,32 524,26 530,34 522,40" fill="var(--sj-light)" />

        {/* Distant hills */}
        <path d="M0 162L118 128L240 154L384 122L512 150L640 132V194H0Z" fill="var(--sj-far)" />

        {/* Elevated Rail Viaduct & Electric Train completely above the bay */}
        <path
          d="M0 168H640V196H560a30 26 0 0 0-60 0H420a30 26 0 0 0-60 0H280a30 26 0 0 0-60 0H140a30 26 0 0 0-60 0H0Z"
          fill="var(--sj-mid)"
        />
        <g transform="translate(138 148)">
          <g className="art-vehicle">
            <path d="M0 0H156Q182 0 192 20H0Z" fill="var(--sj-light)" />
            <rect x="12" y="5" width="134" height="6" fill="var(--sj-near)" />
            <rect x="0" y="14" width="184" height="4" fill="var(--sj-accent)" />
          </g>
        </g>

        {/* Open Coastal Bay cleanly below viaduct (y=196..296) */}
        <rect x="0" y="196" width="640" height="102" fill="var(--sj-water)" />
        <g fill="var(--sj-glow)" opacity=".55" className="art-ripple">
          <rect x="52" y="220" width="76" height="3.5" rx="1.75" />
          <rect x="180" y="254" width="92" height="3.5" rx="1.75" />
          <rect x="524" y="226" width="68" height="3" rx="1.5" />
        </g>
        {/* Cargo Ship floating cleanly in center-right open water (no viaduct overlap) */}
        <g transform="translate(454 246)">
          <g className="art-vehicle-alt">
            <polygon points="-58,0 58,0 44,20 -46,20" fill="var(--sj-near)" />
            <rect x="-36" y="-14" width="24" height="14" fill="var(--sj-accent)" />
            <rect x="-8" y="-14" width="24" height="14" fill="var(--sj-sun)" />
            <rect x="22" y="-22" width="16" height="22" fill="var(--sj-light)" />
            <rect x="-70" y="22" width="140" height="3" rx="1.5" fill="var(--sj-glow)" opacity=".68" />
          </g>
        </g>

        {/* Foreground Urban Boulevard & Bike Lane */}
        <rect x="0" y="294" width="640" height="24" fill="var(--sj-far)" />
        <rect x="0" y="318" width="640" height="64" fill="var(--sj-panel)" />
        <rect x="0" y="382" width="640" height="38" fill="var(--sj-near)" />
        <path
          d="M12 350H628"
          fill="none"
          stroke="var(--sj-sun)"
          strokeWidth="3.2"
          strokeDasharray="18 20"
          strokeLinecap="round"
          className="art-dash"
        />

        {/* Road Cargo Truck (left lane, subtle exhaust) */}
        <g transform="translate(88 308)">
          <g className="art-vehicle">
            <rect x="0" y="0" width="54" height="24" rx="2" fill="var(--sj-light)" />
            <polygon points="56,6 72,6 78,16 78,24 56,24" fill="var(--sj-accent)" />
            <rect x="60" y="9" width="11" height="7" fill="var(--sj-near)" />
            <circle cx="14" cy="24" r="5.5" fill="var(--sj-near)" />
            <circle cx="42" cy="24" r="5.5" fill="var(--sj-near)" />
            <circle cx="66" cy="24" r="5.5" fill="var(--sj-near)" />
            <g className="art-smoke" fill="var(--sj-light)" opacity=".58">
              <circle cx="-8" cy="18" r="4" />
              <circle cx="-18" cy="14" r="5" />
            </g>
          </g>
        </g>

        {/* Clean Electric City Bus on right lane */}
        <g transform="translate(274 344)">
          <g className="art-vehicle">
            <rect x="0" y="0" width="110" height="26" rx="8" fill="var(--sj-accent)" />
            <rect x="10" y="5" width="22" height="10" rx="2" fill="var(--sj-light)" />
            <rect x="38" y="5" width="22" height="10" rx="2" fill="var(--sj-light)" />
            <rect x="66" y="5" width="28" height="10" rx="2" fill="var(--sj-sun)" />
            <circle cx="24" cy="26" r="6.5" fill="var(--sj-near)" />
            <circle cx="86" cy="26" r="6.5" fill="var(--sj-near)" />
          </g>
        </g>

        {/* Protected Foreground Bike Lane + Cyclist Silhouette (ciclovía) */}
        <g transform="translate(476 384)">
          <g className="art-vehicle-alt" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="0" cy="20" r="10" stroke="var(--sj-light)" strokeWidth="2.6" />
            <circle cx="34" cy="20" r="10" stroke="var(--sj-light)" strokeWidth="2.6" />
            <path d="M0 20L12 8H25L34 20M12 8L18 20H0M25 8L27 3H32" stroke="var(--sj-sun)" strokeWidth="2.4" />
            <circle cx="24" cy="-6" r="4.5" fill="var(--sj-sun)" />
            <path d="M12 8L20 0L29 4M12 8L18 19" stroke="var(--sj-light)" strokeWidth="2.8" />
          </g>
        </g>
      </g>
    ),
  },

  bosques: {
    badge: '04 · BOSQUES',
    render: () => (
      <g className="factor-scene factor-scene-bosques">
        <rect width="640" height="420" fill="var(--sj-sky-a)" />
        <path d="M0 162Q280 140 640 164V420H0Z" fill="var(--sj-sky-b)" />
        <circle cx="486" cy="76" r="36" fill="var(--sj-sun)" />

        {/* Atmospheric diagonal sunbeams over intact primary forest (right) */}
        <polygon points="410,18 492,18 620,308 496,308" fill="var(--sj-sun)" opacity=".2" className="art-pulse" />
        <polygon points="344,18 402,18 524,302 426,302" fill="var(--sj-sun)" opacity=".14" className="art-pulse art-delay" />

        {/* Distant mountain ridges & forest horizon */}
        <path d="M0 240L96 186L184 222L286 174L398 228L512 182L640 218V420H0Z" fill="var(--sj-far)" />
        <path d="M0 268Q190 236 376 260Q516 244 640 256V420H0Z" fill="var(--sj-mid)" />

        {/* LEFT HALF: Cleared Deforestation Patch + Stumps + Burning Edge + Rising Carbon */}
        <path d="M0 258Q144 240 278 272L218 420H0Z" fill="var(--sj-accent)" opacity=".88" />
        {[
          { x: 48, y: 312, s: 1.1 },
          { x: 96, y: 294, s: 0.9 },
          { x: 146, y: 318, s: 1.05 },
          { x: 194, y: 298, s: 0.85 },
        ].map((stump, idx) => (
          <g key={idx} transform={`translate(${stump.x} ${stump.y}) scale(${stump.s})`}>
            <polygon points="-10,12 10,12 7,-6 -7,-6" fill="var(--sj-near)" />
            <ellipse cx="0" cy="-6" rx="7" ry="2.5" fill="var(--sj-sun)" />
          </g>
        ))}
        {/* Wildfire ember + released CO2 plume on cleared boundary */}
        <g transform="translate(226 284)">
          <path d="M0 0Q8-22 16 0Q24-28 32 0Z" fill="var(--sj-sun)" className="art-pulse" />
          <g className="art-smoke" fill="var(--sj-near)" opacity=".55">
            <circle cx="14" cy="-22" r="11" />
            <circle cx="24" cy="-42" r="14" />
            <circle cx="34" cy="-62" r="10" />
          </g>
        </g>

        {/* RIGHT HALF: Towering Primary Forest -> Foreground Meadow -> Unclipped Mountain Stream -> Ranger Outpost & Saplings */}
        {[
          { x: 422, y: 292, h: 152, w: 34, delay: '', c: 'var(--sj-near)' },
          { x: 478, y: 288, h: 186, w: 44, delay: ' art-delay', c: 'var(--sj-panel)' },
          { x: 538, y: 294, h: 162, w: 38, delay: '', c: 'var(--sj-near)' },
          { x: 590, y: 298, h: 136, w: 32, delay: ' art-delay', c: 'var(--sj-panel)' },
        ].map(tree => (
          <g key={tree.x} transform={`translate(${tree.x} ${tree.y})`}>
            <g className={`art-sway${tree.delay}`}>
              <polygon points={`0,-${tree.h} -${tree.w},0 ${tree.w},0`} fill={tree.c} />
            </g>
          </g>
        ))}

        {/* Foreground regenerated meadow drawn BEFORE stream so river carves smoothly without cutoff */}
        <path d="M290 332Q440 304 640 324V420H242Z" fill="var(--sj-panel)" />

        {/* Mountain stream dividing cleared slope from restored primary forest */}
        <path d="M354 252Q308 294 270 342T198 420H286Q328 352 374 254Z" fill="var(--sj-water)" />
        <path
          d="M364 254Q314 310 242 412"
          fill="none"
          stroke="var(--sj-glow)"
          strokeWidth="2.8"
          strokeDasharray="10 16"
          strokeLinecap="round"
          className="art-dash"
        />

        {/* Ranger lookout anchored squarely onto forest bank */}
        <g transform="translate(392 252)">
          <polygon points="0,34 42,34 42,14 21,-2 0,14" fill="var(--sj-light)" />
          <polygon points="21,-2 42,14 42,34 21,34" fill="var(--sj-near)" />
          <rect x="8" y="16" width="8" height="10" fill="var(--sj-sun)" className="art-pulse" />
        </g>

        {/* Planted saplings with ascending carbon-capture motes */}
        {[386, 446, 514, 574].map((x, idx) => (
          <g key={x} transform={`translate(${x} ${368 + (idx % 2) * 14})`}>
            <polygon points="0,-24 -10,0 10,0" fill="var(--sj-far)" className="art-sway" />
          </g>
        ))}
        <g className="art-smoke" fill="var(--sj-sun)" opacity=".82">
          <circle cx="404" cy="348" r="2.8" />
          <circle cx="468" cy="336" r="2.5" />
          <circle cx="536" cy="344" r="3" />
        </g>
        <g className="art-vehicle" stroke="var(--sj-near)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M352 68q6-6 12 0q6-6 12 0M384 82q5-5 10 0q5-5 10 0" />
        </g>
      </g>
    ),
  },

  agricultura: {
    badge: '05 · AGRICULTURA',
    render: () => (
      <g className="factor-scene factor-scene-agricultura">
        <rect width="640" height="420" fill="var(--sj-sky-a)" />
        <path d="M0 144Q320 124 640 148V420H0Z" fill="var(--sj-sky-b)" />
        <circle cx="496" cy="74" r="36" fill="var(--sj-sun)" className="art-pulse" />

        <g className="art-vehicle" fill="var(--sj-light)" opacity=".6">
          <path d="M74 64a14 14 0 0 1 28-4a18 18 0 0 1 34 2a12 12 0 0 1 18 10H74Z" />
          <path d="M254 46a10 10 0 0 1 20-3a14 14 0 0 1 24 4H254Z" />
        </g>

        {/* Grounded Ridge & Agricultural Contour Terraces */}
        <path d="M0 198Q190 166 380 186T640 174V420H0Z" fill="var(--sj-far)" />

        {/* Farmstead Barn, Silo & Masonry-Grounded Greenhouse planted cleanly on flat top pad */}
        <g transform="translate(88 148)">
          <rect x="-42" y="12" width="16" height="34" fill="var(--sj-light)" />
          <path d="M-42 12a8 6 0 0 1 16 0Z" fill="var(--sj-accent)" />
          <polygon points="-22,46 28,46 28,16 3,-4 -22,16" fill="var(--sj-accent)" />
          <polygon points="3,-4 28,16 28,46 3,46" fill="var(--sj-near)" />
          <rect x="-6" y="24" width="16" height="22" fill="var(--sj-light)" />
        </g>
        <g transform="translate(362 156)">
          <rect x="-4" y="28" width="76" height="6" fill="var(--sj-panel)" />
          <path d="M0 28V12Q34-8 68 12v16Z" fill="var(--sj-glow)" opacity=".86" className="art-pulse" />
          <rect x="14" y="18" width="12" height="10" fill="var(--sj-mid)" />
          <rect x="42" y="18" width="12" height="10" fill="var(--sj-mid)" />
        </g>

        {/* Pasture Terrace (left-center) with Cows & Methane wisps */}
        <path d="M0 202Q170 232 344 210Q496 194 640 214V420H0Z" fill="var(--sj-mid)" />

        {/* Rice paddy / Efficient drip-irrigation water terrace (right side) */}
        <path d="M356 226Q488 212 620 228L606 276Q472 288 340 272Z" fill="var(--sj-water)" />
        <g fill="none" stroke="var(--sj-glow)" strokeLinecap="round">
          <ellipse cx="484" cy="248" rx="64" ry="12" strokeWidth="1.8" className="art-ripple" />
          <ellipse cx="484" cy="248" rx="34" ry="6" strokeWidth="1.4" opacity=".8" className="art-ripple art-delay" />
        </g>
        <g stroke="var(--sj-sun)" strokeWidth="2" strokeLinecap="round">
          {[402, 434, 536, 568].map((x, idx) => (
            <g key={x} transform={`translate(${x} 254)`}>
              <path d="M0 0v-14" className={`art-sway${idx % 2 ? ' art-delay' : ''}`} />
            </g>
          ))}
        </g>

        {/* Three Minimalist Livestock Cows on Green Pasture (Ganadería · Metano) */}
        {[
          { x: 112, y: 244, s: 1.05 },
          { x: 192, y: 256, s: 0.92 },
          { x: 266, y: 246, s: 1.0 },
        ].map((cow, idx) => (
          <g key={idx} transform={`translate(${cow.x} ${cow.y}) scale(${cow.s})`}>
            <ellipse cx="-2" cy="16" rx="18" ry="3.5" fill="var(--sj-near)" opacity=".28" />
            <rect x="-18" y="-12" width="32" height="18" rx="4" fill="var(--sj-light)" />
            <rect x="-10" y="-10" width="12" height="9" rx="2" fill="var(--sj-near)" />
            <rect x="12" y="-16" width="10" height="11" rx="3" fill="var(--sj-light)" />
            <polygon points="12,-16 8,-20 14,-16" fill="var(--sj-sun)" />
            <rect x="-15" y="6" width="4" height="10" fill="var(--sj-near)" />
            <rect x="-4" y="6" width="4" height="10" fill="var(--sj-near)" />
            <rect x="7" y="6" width="4" height="10" fill="var(--sj-near)" />
          </g>
        ))}
        {/* Subtle methane/nitrous emission wisps ascending above cattle & fertilized rows */}
        <g className="art-smoke" fill="var(--sj-glow)" opacity=".56">
          <circle cx="118" cy="216" r="4" />
          <circle cx="196" cy="228" r="3.6" />
          <circle cx="270" cy="218" r="4" />
        </g>

        {/* Foreground Cultivated Contour Band & Living Soil Cross-section */}
        <path d="M0 296Q210 264 416 300T640 288V420H0Z" fill="var(--sj-near)" />
        <path
          d="M28 312Q210 284 416 318T618 308"
          fill="none"
          stroke="var(--sj-water)"
          strokeWidth="2.4"
          strokeDasharray="10 14"
          strokeLinecap="round"
          className="art-dash"
        />
        <path d="M0 364Q240 340 446 372T640 358V420H0Z" fill="var(--sj-panel)" />

        {/* Graceful Arched Golden Wheat / Crop Stalks (NOT stiff spears!) */}
        {[58, 122, 186, 250, 326, 404, 480, 558].map((x, idx) => (
          <g key={x} transform={`translate(${x} ${idx % 2 ? 356 : 344})`}>
            <g className={`art-sway${idx % 2 ? ' art-delay' : ''}`} fill="none" strokeLinecap="round">
              <path d="M0 0Q2-20 8-34" stroke="var(--sj-sun)" strokeWidth="2.4" />
              <ellipse cx="9" cy="-35" rx="6" ry="3" transform="rotate(28 9 -35)" fill="var(--sj-sun)" />
              <path d="M0-10Q-8-18-12-24" stroke="var(--sj-far)" strokeWidth="2" />
            </g>
          </g>
        ))}

        {/* Subsurface Organic Roots / Living Soil Nutrients */}
        <g fill="var(--sj-sun)" opacity=".6">
          <circle cx="104" cy="392" r="2.6" />
          <circle cx="218" cy="398" r="2.2" />
          <circle cx="332" cy="388" r="2.5" />
          <circle cx="452" cy="398" r="2.4" />
          <circle cx="548" cy="390" r="2.2" />
        </g>
      </g>
    ),
  },
}

/**
 * Editorial illustrations rendered as lineless minimalist geometric SVGs
 * inspired by Samurai Jack (flat layered depth planes, sharp silhouettes, zero ink outlines)
 * with centered rotations and domain-accurate climate factor visual concepts.
 */
export function FactorIllustration({ factor, title }: Props) {
  const plate = PLATES[factor] ?? PLATES.energia
  const label = `Ilustración editorial del factor ${title}`

  return <figure className="factor-plate">
    <svg className="factor-illustration" viewBox="0 0 640 420" role="img" aria-label={label}>
      {plate.render()}
    </svg>
    <span className="factor-plate-badge" aria-hidden="true">{plate.badge}</span>
  </figure>
}
