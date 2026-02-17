// make an involute teeth curve. The involute crosses the pitch circle at Y = modify_involute.
// and the "string" comes from the -Y direction.
function make_involute(rp, dedendum, addendum, modify, tooth_dth, pa) {
    // get the angle we have to roll our straight line to arrive at a certain
    // radius
    function rToTheta(rb, r1) {
        // length of our tangent line
        var len = Math.sqrt(r1 * r1 - rb * rb);
        // and apply radians definition
        return len / rb;
    }

    // base radius
    const rb = rp * Math.cos(pa);
    // start/end radius
    var r1 = Math.max(rp - dedendum, rb);
    const r2 = rp + addendum;
    // theta at pitch radius
    const thP = pa;
    // theta at start of involute curve
    // (may be below r1, should be th <= 0)
    const thAbs0 = pa - Math.sin(pa) * (rp + modify) / rb;

    if (Math.cos(pa) * rb < rp - dedendum) {
        // we may drop another part of the involute for large gears:
        // below the intersection between the pressure line and the addendum
        // line of a rack meshing with the gear. (actually, we assume for the
        // undercut that the rack addendum equals our dedendum).
        // If this intersect lies below the tangent point of the base circle and
        // the pressure line, we can drop the involute below this point.
        // That part will never touch an involute on any other gear, so instead
        // we may follow the the undercut curve.
        const intersect_y = dedendum * Math.tan(Math.PI * .5 - pa)
        r1 = Math.max(r1, Math.hypot(intersect_y, rp - dedendum));
    }

    // range of theta we have to cover (relative to thAbs0)
    const th1 = rToTheta(rb, r1);
    const th2 = rToTheta(rb, r2);
    // angle where we intersect with the next tooth
    const angle_slope = Math.tan(0.25 * tooth_dth);

    var l = [];
    const steps = 5 + Math.ceil((th2 - th1) / .03);
    const dTh = (th2 - th1) / steps;
    for (var i = 0; i <= steps; ++i) {
        const th = th1 + i * dTh;
        const thAbs = thAbs0 + th
        // tangent point
        var p = {
            x: Math.cos(thAbs) * rb,
            y: -Math.sin(thAbs) * rb
        };
        // arc length
        var len = rb * th;
        // and follow line segment
        p.x += len * Math.sin(thAbs);
        p.y += len * Math.cos(thAbs);
        // make sure the tooth doesn't intersect with the next tooth
        if (p.y < -angle_slope * p.x) {
            p = intersect_segment(l[l.length - 1], p, -angle_slope);
            l.push(p);
            break;
        }
        else {
            l.push(p);
        }
    }
    return { points: l, base: rb, root_angle: thAbs0 };
}


function get_involute_extra_rotation(gear_1, gear_2, between_axes) {
    if (gear_1.tooth_shape != "involute") return undefined;

    // loa depends on distance between axes, it is the line which touches both base circles
    // right triangle math
    var total_base = gear_1.base + gear_2.base;
    var cosPA = total_base / between_axes;
    var sinPA = Math.sqrt(1 - cosPA * cosPA);
    var modified_r = 1 / cosPA;

    // rotation from involute root to touch poing on LOA:
    // rotatet forward by actual pressure angle, rotate backwards by
    // angle between involute root and pitch point
    var actual_pa = Math.acos(cosPA);
    var rot_to_modified_r = actual_pa - Math.sqrt(modified_r * modified_r - 1);

    // to actually touch, the gears need slightly more rotation as they move further apart
    var rot_1_extra = -gear_2.involute_root_angle + rot_to_modified_r;
    var rot_2_extra = -gear_1.involute_root_angle + rot_to_modified_r;

    return {
        rot_extra: rot_1_extra + gear_1.tooth_count / gear_2.tooth_count * rot_2_extra,
        cosPA: cosPA,
        sinPA: sinPA
    };
}


function make_undercut_involute(pitch_radius, pressure_angle_rad, addendum, rack_addendum, rack_displace) {
    // A rack is the worst case for undercut, we calculate this curve by
    // tracing the upper corner of a tooth on the rack as it meshes with the gear.

    // start position is with a gear teeth perpendicular to a vertical rack.
    // pretend our dedendum is the addendum of the rack.
    // "modifying" a gear tooth shape refers to hobbing with the gear further from
    // the hob (usually) than normal.

    const tooth_angle_y = rack_addendum * Math.tan(pressure_angle_rad);
    const tooth_corner_0 = { x: pitch_radius - rack_addendum + rack_displace, y: tooth_angle_y };
    var undercut = []
    // angle we need to rotate until the rack is outside
    // our addendum circle.
    const rot_rad_unit = Math.acos((pitch_radius - rack_addendum + rack_displace) / (pitch_radius + addendum));

    for (var t = -1.0; t < 1.0; t += 0.02) {
        // movement of rack. If the tooth corner crosses Y = 0 we're done.
        var tooth_corner = { ...tooth_corner_0 };
        tooth_corner.y -= rot_rad_unit * -t * pitch_radius;
        if (tooth_corner.y > 0) break;
        // corner relative to rotating gear
        var M = make_rot(rot_rad_unit * -t);
        undercut.push(tr(M, tooth_corner));
    }
    undercut.reverse();
    return undercut;
}


class InvoluteGear extends Gear {

    constructor(settings) {

        super("involute", { pressure_angle: 20, modify_involute: 0 }, settings);

        const { tooth_count, pressure_angle, modify_involute } = this;
        if (tooth_count < 3) throw RangeError("must have at least 3 teeth");

        const tooth_angle = 2 * Math.PI / tooth_count;
        const radius = this.radius();

        // addendum and dedendum:
        // this is apparently a de facto standard:
        const ad = 1.00 + modify_involute; // equal to module
        const dd_unm = 1.16; // 16% over the addendum
        const dd = dd_unm - modify_involute;

        const pressure_angle_rad = Math.max(5, pressure_angle) * Math.PI / 180;
        const involute = make_involute(radius, dd, ad, modify_involute, tooth_angle, pressure_angle_rad);
        const undercut = make_undercut_involute(
            radius, pressure_angle_rad, ad, dd_unm, modify_involute);
        const combined = min_curve(undercut, involute.points, tooth_angle * 1e-5);
        this.undercut_radius = combined.first_2 && Math.hypot(combined.first_2.x, combined.first_2.y);
        Object.assign(this, {
            ad: ad, dd: dd, base: involute.base, involute_root_angle: involute.root_angle,
            tooth_profile: combined.points, tooth_no_uc: involute.points,
            pressure_angle_rad: pressure_angle_rad
        })
        this.loa = [
            { x: radius, y: 0 },
            r_th_to_p(this.base, -this.pressure_angle_rad)]
    }


    opposite_gear(settings) {
        return new InvoluteGear({...this.user_settings, ...settings})
    }
}
