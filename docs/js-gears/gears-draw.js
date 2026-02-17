


//---------------------------------------------------------------
// Holes

function draw_round_hole(ctx, scale, max_radius) {
  const r = Math.min(scale, max_radius);
  ctx.moveTo(r, 0);
  ctx.arc(0, 0, r, 2 * Math.PI, 0, true);
}


function draw_square_hole(ctx, scale, max_radius) {
  // for a hole optically the same size as the circle hole, we need a bit less than 1 times that radius as the side.
  const r = Math.min(1.25 * scale, max_radius);
  ctx.moveTo(0, r);
  ctx.lineTo(r, 0);
  ctx.lineTo(0, -r);
  ctx.lineTo(-r, 0);
  ctx.closePath();
}


function draw_mark_hole(ctx, scale, max_radius) {
  const r = Math.min(.5 * scale, max_radius);
  ctx.moveTo(r, 0);
  ctx.lineTo(-r, 0);
  ctx.moveTo(0, r);
  ctx.lineTo(0, -r);
}


function draw_axle_hole(ctx, scale, max_radius) {
  // cross shaped axle, the size corresponds to that of axles in
  // certain construction brick sets, assuming gears with a module
  // of 1mm (aka 1/8th stud).
  const rHole = Math.min(2.39 * scale, max_radius);
  const x1 = 0.89 * scale; // half width of one arm
  const r2 = 0.5 * scale; // radius for rounding between arms
  const x2 = x1 + r2; // centre of the circle for that rounding
  ctx.moveTo(rHole, 0);
  if (rHole < x2 + r2)
  {
    ctx.arc(0, 0, rHole, 2 * Math.PI, 0, true);
  }
  else {
    const a1 = Math.asin(x1 / rHole); // end angle for outer circle arc segments
    const a90 = Math.PI / 2;
    ctx.arc(0, 0, rHole, 0, -a1, true);
    
    ctx.arc(x2, -x2, r2, a90, 2 * a90, false);
    ctx.arc(0, 0, rHole, -a90 + a1, -a90 - a1, true);
    
    ctx.arc(-x2, -x2, r2, 0, a90, false);
    ctx.arc(0, 0, rHole, -2 * a90 + a1, -2 * a90 - a1, true);
    
    ctx.arc(-x2, x2, r2, -a90, 0, false);
    ctx.arc(0, 0, rHole, -3 * a90 + a1, -3 * a90 - a1, true);
    
    ctx.arc(x2, x2, r2, -2 * a90, -a90, false);
    ctx.arc(0, 0, rHole, -4 * a90 + a1, -4 * a90, true);
    ctx.closePath();
  }
}


function draw_keyed_hole(ctx, scale, max_radius) {
  // circular hole with square keys
  if (max_radius < 1.1 * scale)
  {
    const r = Math.min(scale, max_radius);
    ctx.moveTo(r, 0);
    ctx.arc(0, 0, r, 2 * Math.PI, 0, true);
  }
  else {
     // x and y coordinates for the intersection fo the arc and the square
    const y1 = .2 * scale;
    const x1 = Math.sqrt(scale*scale - y1*y1);
     // x coorinate for the depth of the key
    const x2 = Math.min(1.2 * scale, Math.sqrt(max_radius * max_radius - y1 * y1));
    // start and end angle for the arc
    const a1 = Math.asin(y1);
    ctx.moveTo(x2, -y1);
    ctx.lineTo(x1, -y1);
    ctx.arc(0, 0, 1, 2 * Math.PI - a1, Math.PI + a1, true);
    ctx.lineTo(-x1, -y1);
    ctx.lineTo(-x2, -y1);
    ctx.lineTo(-x2, y1);
    ctx.lineTo(-x1, y1);
    ctx.arc(0, 0, 1, Math.PI - a1, a1, true);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y1);
    ctx.closePath();
  }
}