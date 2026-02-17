function gcd(a, b) {
    if (b > a) [a, b] = [b, a];
    while (true) {
        if (b == 0) return a;
        a %= b;
        if (a == 0) return b;
        b %= a;
    }
}

function lcm(a, b) {
    return a * b / gcd(a, b);
}


function intersect_segment(p1, p2, slope) {
  var dy1 = slope * p1.x - p1.y;
  var dy2 = slope * p2.x - p2.y;
  var t = -dy1 / (dy2 - dy1);
  var x = p1.x + (p2.x - p1.x) * t;
  return {x: x, y: slope * x};
}


function intersect_circles(d, r1, r2) {
  var x_intersect = (d*d + r1*r1 - r2*r2) / (2 * d);
  return x_intersect;
}


function triangle_angle(a, b, c) {
  return Math.acos((b*b + c*c - a*a) / (2 * b * c));
}


function r_th_to_p(r, th) {
  var ct = Math.cos(th);
  var st = Math.sin(th);
  return {x: ct * r, y: st * r};
}


/// Make a rotation matrix
function make_rot(th) {
    var ct = Math.cos(th);
    var st = Math.sin(th);
    return   {a:  ct, c: -st, e: 0,
              b:  st, d:  ct, f: 0};
}

// Affine transformation to a point
/// ⎡a c⎤ ⎡p.x⎤     ⎡e⎤
/// ⎣b d⎦ ⎣p.y⎦  +  ⎣f⎦
///
function tr(matrix, point) {
  return {
    x: matrix.a * point.x + matrix.c * point.y + matrix.e,
    y: matrix.b * point.x + matrix.d * point.y + matrix.f,
  }
}