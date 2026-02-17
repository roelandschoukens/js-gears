/// combines 2 curves: for each X coordinate, have the lowest Y coordinate of the two.
/// (approximately, we don't make up new points here).
/// both curves must be sorted by increasing X.
/// Returns:
///  - the combined curve
///  - the first point of points2, if any previous one was under points1 by more than the given tolerance.
function min_curve(points1, points2, tolerance) {
  var i1 = 0;
  var i2 = 0;
  var p2_first = undefined;
  var p2_dropped = false;
  var result = [];
  // non-overlapping region

  for (; i1 < points1.length && points1[i1].x < points2[0].x; ++i1){
    result.push(points1[i1]);
  }
  for (; i2 < points2.length && points2[i2].x < points1[0].x; ++i2){
    result.push(points2[i2]);
  }

  function intersect_y(p1, p2, x)
  {
    var t = (x - p1.x) / (p2.x - p1.x);
    return p1.y + t * (p2.y - p1.y);
  }
  
  // overlapping, take lowest Y
  while (i1 < points1.length && i2 < points2.length) {
    if (points1[i1].x < points2[i2].x) {
      var i2_1 = Math.max(0, i2 - 1);
      var y2 = intersect_y(points2[i2_1], points2[i2_1 + 1], points1[i1].x);
      if (points1[i1].y < y2) {
        result.push(points1[i1]);
      }
      ++i1;
    }
    else {
      var i1_1 = Math.max(0, i1 - 1);
      var y1 = intersect_y(points1[i1_1], points1[i1_1 + 1], points2[i2].x);
      if (points2[i2].y < y1) {
        result.push(points2[i2]);
        if (p2_dropped && p2_first == undefined) p2_first = points2[i2];
      }
      else if (points2[i2].y >= y1 + tolerance) {
        p2_dropped = true
      }
      ++i2;
    }
  }

  // non-overlapping region
  for (; i1 < points1.length; ++i1){
    result.push(points1[i1]);
  }
  for (; i2 < points2.length; ++i2){
    result.push(points2[i2]);
  }
  return {points: result, first_2: p2_first};
}