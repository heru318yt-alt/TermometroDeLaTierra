# World land contours

`world-land.json` contains SVG paths derived from Natural Earth 1:110m land polygons (127 features), downloaded 2026-10-31:
https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson

Natural Earth vector data are public domain: https://www.naturalearthdata.com/about/terms-of-use/

Illustrative projection (not an analytical geographic projection):
`x = 360 + longitude / 180 * 345 * sqrt(1 - (latitude / 110)^2)`;
`y = 190 - latitude / 90 * 165`. Coordinates rounded to 0.1 SVG unit.
Polygon rings are closed and rendered with even-odd fill. No political boundaries, regional climate values, or external requests at runtime.

The ocean uses a uniform global anomaly color. Land outlines are a constant decorative overlay. A future spatial layer must have its own validated geographic dataset; the global CSV cannot supply it.

The visualizer's ocean contour and SVG clip share the same projection envelope (347 × 167 instead of 345 × 165, giving the original land paths a 2-unit margin). Land geometry remains unchanged. The graticule and any future spatial layer use this same clip, with a unique React `useId` per mounted visualizer.
