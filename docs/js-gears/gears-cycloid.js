// Make a cycloid. If r2 is negative, the result is a hypocycloid.
// Stop if either we roll for a certain angle (th_max) or until we
// intersect with the line with a given slope (limit_slope)
// the cusp is at (r1, 0). If th_max is negative the generating
// circle will roll downwards.
function make_cycloid(r1, r2, th_max, limit_slope, N = 20) {
    var l = [];
    var has_point = false;
    const d_th = th_max / N;
    const sign = th_max < 0 ? -1 : 1;
    for (var step = 0; step <= N; ++step) {
        var th = step * d_th;
        var th_hc = th * r1 / r2;
        var p1 = r_th_to_p(r1 + r2, th);
        var p2 = r_th_to_p(r2, th + th_hc);
        var p = { x: p1.x - p2.x, y: p1.y - p2.y };
        if (sign * p.y > sign * limit_slope * p.x) {
            if (l.length) {
                has_point = true;
                p = intersect_segment(l[l.length - 1], p, limit_slope);
                l.push(p);
            }
            break;
        }
        else {
            l.push(p);
        }
    }
    return { points: l, has_point: has_point };
}


function make_undercut_circle(r1, r2, th_1_start, corner_p, slop, everything) {
    // make an undercut given a corner point where the undercut starts.
    // corner_p must be given relative to gear 1, and must be on the
    // line of action.
    // corner relative to gear 2
    const x2 = r1 + r2;
    const p0_c_2 = { x: corner_p.x - x2, y: -corner_p.y };
    var undercut = [];
    const t_max = everything ? 1.001 : .501;
    for (var t = 0; t < t_max; t += 0.02) {
        var th_1 = (1 - t) * th_1_start; // gear 1: max to 0
        var th_2 = t * th_1_start * r1 / r2;  // gear 2: 0 to max
        // rotation of gear 2
        var p = tr(make_rot(-th_2), p0_c_2);
        if (everything && p.y > 0) break;
        // make relative to gear 1
        p.x += x2;
        // undo rotation of gear 1
        p = tr(make_rot(th_1), p);
        // add slop
        p.x -= slop * t;
        p.y -= slop * t;
        if (!everything && p.y > 0) break;
        undercut.push(p);
    }
    undercut.reverse();
    return undercut;
}


// make a cycloid teeth curve. The curve is a combination of two cycloids (one inside, one
// outside the pitch circle). The curve crosses the pitch circle at Y = zero. The circles roll
// towards -Y.
// The undercut is is always assumed to start on the pitch circle, and it is shaped as a
// circular arc matching the lantern bars of the other gear.
// Strictly speaking, for small gears the undercut should be slightly higher, as there is a small
// amount of interference with the next tooth, but we do not take this into account.
//

/**
 * 
 * @param {number} rp pitch circle radius
 * @param {number} r_hc Radius of the wheel forming the hypocycloid, inside the pitch circle.
 *      Must be <= rp. Often set to rp / 2 so that the hypocycloid forms a straight line.
 * @param {number} r_ec Radius of the wheel forming the epicycloid, outside the pitch circle.
 *      Is equal to r_ec for the opposite gear. Often set to (other_rp / 2).
 * @param {number} dedendum
 * @param {number} addendum 
 * @param {number} teeth 
 * @param {number} other_teeth 
 * @param {number} round_undercut generate round undercut
 * @returns 
 */
function make_cycloid_tooth(rp, teeth, other_teeth, r_hc, r_ec, dedendum, addendum, round_undercut) {
    if (!teeth || !other_teeth) throw RangeError("must have non-zero amount of teeth");

    const rp_other = rp * other_teeth / teeth;

    // Calculate where the addendum of the other gear intersects
    // our line of action for the hypocycloid
    var x_intersect = intersect_circles(rp_other + r_hc, r_hc, rp_other + addendum);
    const hc_loa_end_th = Math.acos(Math.max(-1, x_intersect / r_hc));

    // tooth curve
    var tooth_angle = Math.PI * 0.5 / teeth;
    const angle_slope = Math.tan(tooth_angle);
    // if the dedendum has a flat bottom spanning the tooth angle,
    // and it touches the dedendum circle, this is the distance from the
    // centre to the corner points.
    const r_corner_dedendum = (rp - dedendum) / Math.cos(tooth_angle);
    var l = [];
    var has_undercut = false;
    if (Math.abs(r_hc - rp / 2) < 1e-4) {
        // parameter == 1 case:
        // The two circles we roll over our pitch circle
        // are half of the radius of the two gears. This results in straight lines
        // for the dedendum.
        if (!round_undercut) l.push({ x: r_corner_dedendum, y: 0 });
        has_undercut = round_undercut;
    }
    else {
        const dd_cos = rp - r_corner_dedendum;
        // we stop when p reaches the addendum circle.
        // First calculate the angles in our end state with the law of cosines.
        // A: centre of rolling circle, B: centre of gear, C: end point of cycloid

        var alpha = triangle_angle(rp - dd_cos, r_hc, rp - r_hc);
        // rolling angle is outside this triangle at vertex A
        var th_max_ad = r_hc / rp * (Math.PI - alpha) || Math.PI;
        var th_max = Math.min(r_hc / rp * hc_loa_end_th, th_max_ad);
        if (th_max != th_max_ad || round_undercut) {
            has_undercut = true;
        }
        const hc = make_cycloid(rp, -r_hc, th_max, angle_slope);
        if (!hc.has_point && !round_undercut) {
            var p_crease = intersect_segment(hc.points[hc.points.length - 2], hc.points[hc.points.length - 1], angle_slope);
            if (p_crease && p_crease.x > r_corner_dedendum && p_crease.x < rp) {
                hc.points.push(p_crease);
            }
            else {
                hc.points.push({
                    x: r_corner_dedendum,
                    y: hc.points.length ? hc.points[hc.points.length - 1].y : 0
                });
            }
        }
        hc.points.slice().reverse().forEach(p => l.push(p));
    }

    // we stop when p reaches the addendum circle.
    // First calculate the angles in our end state with the law of cosines.
    var alpha = triangle_angle(rp + addendum, r_ec, rp + r_ec) || Math.PI;
    var th_max = r_ec / rp * alpha;
    const ec = make_cycloid(rp, r_ec, -th_max, -angle_slope);
    ec.points.forEach(p => l.push(p));

    const l_no_uc = l;
    if (has_undercut) {
        // undercut curve
        const th_undercut_start = hc_loa_end_th * r_hc / rp;
        const undercut_corner = r_th_to_p(r_hc, hc_loa_end_th);
        undercut_corner.x += rp - r_hc;
        const slop = dedendum - addendum;
        const undercut = make_undercut_circle(
            rp, rp_other, th_undercut_start, undercut_corner, slop, round_undercut);
        if (undercut[0]) {
            l = min_curve(l, undercut, 0).points;
        }
        var i = 0;
        while (l[i].y > angle_slope * l[i].x) ++i;
        if (i > 0) {
            l.splice(0, i, intersect_segment(l[i - 1], l[i], angle_slope));
        }
    }

    return { points: l, points_no_uc: l_no_uc, r_ec: r_ec, r_hc: r_hc, loa_end_th: hc_loa_end_th };
}



class CycloidGear extends Gear {

    constructor(settings) {

        super("cycloid", { cycloid_round_bottom: false, param1: 1 }, settings);

        const {tooth_count, opposite_tooth_count, r_hc = tooth_count / 4, r_ec = opposite_tooth_count / 4} = this;

        if (tooth_count < 2) throw RangeError("must have at least 2 teeth");
        if (opposite_tooth_count < 2) throw RangeError("must have at least 2 teeth");
        if (r_ec < 0 || r_ec > opposite_tooth_count / 2) throw RangeError("r_ec must be between 0 and half the radius of the opposite gear.");
        if (r_hc < 0 || r_hc > tooth_count / 2) throw RangeError("r_hc must be between 0 and half the radius of the gear.");

        // these look a bit better with a slightly larger ad/dd.
        // in practical gears these aren't fixed ratios.
        const radius = this.radius();
        const dd = Math.min(1.40, radius * .85);
        const ad = 1.33;

        var cycloid = make_cycloid_tooth(radius, tooth_count, opposite_tooth_count,
            r_hc, r_ec, dd, ad, this.cycloid_round_bottom);

        Object.assign(this, {
            ad: ad, dd: dd, r_hc: r_hc, r_ec: r_ec,
            loa_end_th: cycloid.loa_end_th,
            tooth_no_uc: cycloid.points_no_uc, tooth_profile: cycloid.points
        });
        this.loa = [{ x: radius, y: 0 }];
        const th_max = cycloid.loa_end_th;
        for (var i = 0; i <= 20; ++i) {
            var th = th_max * (i + 0) / 20;
            var p1 = r_th_to_p(r_hc, th);
            this.loa.push({ x: radius - r_hc + p1.x, y: -p1.y });
        }
        var p1 = this.loa[this.loa.length - 1];
        this.undercut_radius = Math.hypot(p1.x, p1.y);
    }


    opposite_gear(settings) {
        return new CycloidGear({
            ...this.user_settings, ...settings,
            tooth_count: this.opposite_tooth_count, opposite_tooth_count: this.tooth_count,
            r_hc: this.r_ec, r_ec: this.r_hc
        })
    }
}
