# World land contours

`world-land.json` contains SVG paths derived from Natural Earth 1:110m land polygons (127 features), downloaded 2026-10-31:
https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson

Natural Earth vector data are public domain: https://www.naturalearthdata.com/about/terms-of-use/

Illustrative source projection (not an analytical geographic projection):
`x = 360 + longitude / 180 * 345 * sqrt(1 - (latitude / 110)^2)`;
`y = 190 - latitude / 90 * 165`. Coordinates are rounded to 0.1 SVG unit. Polygon rings are closed and rendered with even-odd fill.

`InteractiveGlobe.tsx` rasterizes the local paths once, samples them back into a longitude/latitude mask using the inverse of this projection, then shades them on a rotatable sphere. The ocean fill is one uniform global anomaly for the selected date. Land outlines and graticule are visual references only; there are no political boundaries or regional climate values, and no external requests at runtime.

The CSV contains only global anomaly data. Any future regional climate layer needs its own validated geographic data, scale, legend, and source.
