export function Globe() {
  return <svg viewBox="0 0 440 440" className="globe" aria-hidden="true">
    <defs><clipPath id="planet"><circle cx="220" cy="220" r="165" /></clipPath></defs>
    <circle cx="220" cy="220" r="207" fill="none" stroke="currentColor" strokeDasharray="2 9" opacity=".3" />
    <ellipse cx="220" cy="220" rx="215" ry="70" fill="none" stroke="currentColor" opacity=".4" transform="rotate(-27 220 220)" />
    <circle cx="220" cy="220" r="165" fill="#c6d9bb" />
    <g clipPath="url(#planet)">
      <path fill="#527c60" d="M55 140 95 97 151 77 178 105 165 138 194 151 174 179 143 178 130 213 103 206 84 170ZM144 219 177 210 205 237 202 267 181 287 178 328 155 355 143 304 122 269ZM246 66 299 79 337 111 377 128 391 191 355 207 327 174 294 183 273 163 247 180 220 151 227 121ZM243 190 283 184 308 217 290 259 265 287 242 266 228 224ZM325 289 357 271 385 295 372 323 337 327Z" />
      <g fill="none" stroke="#f0f4e7" opacity=".4"><ellipse cx="220" cy="220" rx="83" ry="165" /><ellipse cx="220" cy="220" rx="140" ry="165" /><path d="M55 220h330M75 147h290M75 293h290M220 55v330" /></g>
    </g>
    <circle cx="384" cy="139" r="7" fill="#dd8d54" /><circle cx="80" cy="337" r="5" fill="currentColor" />
  </svg>
}
