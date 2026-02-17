// Make sort of, kind of, a cycloid. The curve is traced by
// the edge of a circle instead of a point.
// the curve isn't guaranteed to intersect the pitch circle at Z=0, instead
// it is based on a fixed start position of the lantern bar.
function make_lantern_cycloid(r_pitch, r_pitch_other, r_lantern, tooth_theta, limit_slope, N = 20) {
    var l = [];
    var loa = []
    var has_point = false;

    // initial position of lantern bar
    const th1_start = tooth_theta / 4;

    // we stop when the lantern centre reaches the addendum circle, plus
    // one lantern radius on the other pitch circle.
    // that is a bit approximate but good enough
    // First calculate the angles in our end state with the law of cosines.
    const ad = r_lantern * 2;
    var alpha = triangle_angle(r_pitch + ad, r_pitch_other, r_pitch + r_pitch_other) || Math.PI;
    var th1_end = r_pitch_other / r_pitch * (alpha + r_lantern / r_pitch_other);

    const d_th = (th1_end - th1_start) / N;

    // We rely here on a property of gears: the normal of the contact point
    // goes through the pitch point. For the lantern bar this means the contact
    // point is on the line between the lantern bar centre and the pitch point.
    var p_dist = r_pitch;
    var done = false;
    for (var step = 0; step <= N && !done; ++step) {
        var d_th1 = step * d_th;
        var th1 = th1_start + d_th1;
        var th2 = Math.PI - r_pitch / r_pitch_other * th1;
        // position of lantern bar
        var l_p = r_th_to_p(r_pitch_other, th2);
        l_p.x += r_pitch + r_pitch_other;
        // the touch point is on the line to the pitch point (r_pitch, 0)
        var loa_touch = { x: r_pitch - l_p.x, y: -l_p.y };
        var loa_touch_scale = r_lantern / Math.hypot(loa_touch.x, loa_touch.y);
        var p = {
            x: l_p.x + loa_touch.x * loa_touch_scale,
            y: l_p.y + loa_touch.y * loa_touch_scale
        };
        loa.push(p);
        p = tr(make_rot(tooth_theta / 4 - th1), p);
        const p_dist_prev = p_dist;
        p_dist = Math.hypot(p.x, p.y);
        if (p_dist > r_pitch + ad) {
            var t = (r_pitch + ad - p_dist_prev) / (p_dist - p_dist_prev);
            var p1 = l[l.length - 1];
            p = { x: p1.x * (1 - t) + p.x * t, y: p1.y * (1 - t) + p.y * t };
            done = true;
        }
        if (p.y < limit_slope * p.x) {
            has_point = true;
            p = intersect_segment(l[l.length - 1], p, limit_slope);
            done = true;
        }
        l.push(p);
    }
    return { points: l, has_point: has_point, loa: loa };
}


class LanternGear extends Gear {

    constructor(settings) {

        super("lantern", {}, settings);

        const { tooth_count, other_tooth_count } = this;
        if (tooth_count < 4) throw RangeError("must have at least 4 teeth");
        if (other_tooth_count < 4) throw RangeError("must have at least 4 teeth");

        const tooth_angle = 2 * Math.PI / tooth_count;
        const radius = this.radius();

        const l_radius = 0.25 * Math.PI; // 1/4 of the tooth pitch
        const l_c = r_th_to_p(radius, -tooth_angle / 4);
        const dd = 2.2 * l_radius;
        const N = 50;
        this.tooth_profile = [];

        // we draw a solid circle inside the lantern bars with lines
        // connecting them.
        {
            const N2 = 5;
            const r = radius - dd;
            const gap = Math.PI / N * l_radius / r;
            const th_max = -tooth_angle / 4 + gap;
            for (var i = -N2; i <= N2; ++i) {
                this.tooth_profile.push(r_th_to_p(r, i / N2 * th_max));
            }
        }
        {
            for (var i = 0.5; i < N / 2; ++i) {
                var p1 = r_th_to_p(l_radius, i / N * 2 * Math.PI + tooth_angle / 4);
                this.tooth_profile.push({ x: l_c.x - p1.x, y: l_c.y + p1.y });
            }
        }
        Object.assign(this, {
            ad: l_radius, dd: dd,
            undercut_radius: radius - l_radius
        });
    }


    opposite_gear_shape() {
        return "lantern-epicycloid";
    }


    opposite_gear(settings) {
        return new LanternEpicycloidGear({
            ...this.user_settings,
            ...settings,
            tooth_count: this.opposite_tooth_count, opposite_tooth_count: this.tooth_count
        })
    }
}


class LanternEpicycloidGear extends Gear {

    constructor(settings) {

        super("lantern", {}, settings);

        const { tooth_count, other_tooth_count } = this;
        if (tooth_count < 4) throw RangeError("must have at least 4 teeth");
        if (other_tooth_count < 4) throw RangeError("must have at least 4 teeth");

        const tooth_angle = 2 * Math.PI / tooth_count;
        const radius = this.radius();

        const l_radius = 0.25 * Math.PI; // 1/4 of the tooth pitch
        const dd = (settings.cycloid_round_bottom ? 1.05 : 1.2) * l_radius;
        this.tooth_profile = [];
        // undercut
        {
            const N = 30;
            const r1 = radius - dd + l_radius;
            const l_c = r_th_to_p(r1, tooth_angle / 4);
            const th_max = Math.acos(0.5 * l_radius / r1);
            if (settings.cycloid_round_bottom) {
                for (var i = .5; i < N; ++i) {
                    var p1 = r_th_to_p(l_radius, -i / N * th_max - tooth_angle / 4);
                    this.tooth_profile.push({ x: l_c.x - p1.x, y: l_c.y + p1.y });
                }
            }
            else {
                var p1 = r_th_to_p(l_radius / Math.cos(0.5 * th_max), -0.5 * th_max - tooth_angle / 4);
                this.tooth_profile.push({ x: l_c.x - p1.x, y: l_c.y + p1.y });
            }
        }

        const r_other = settings.opposite_tooth_count / tooth_count * radius;
        const lc = make_lantern_cycloid(radius, r_other, l_radius, tooth_angle, -Math.tan(tooth_angle / 4))
        lc.points.forEach(p => this.tooth_profile.push(p));
        Object.assign(this, {
            ad: 2 * l_radius, dd: dd,
            undercut_radius: radius, loa: lc.loa
        });
    }


    opposite_gear_shape() {
        return "lantern";
    }


    opposite_gear(settings) {
        return new LanternGear({
            ...this.user_settings,
            ...settings,
            tooth_count: this.opposite_tooth_count, opposite_tooth_count: this.tooth_count
        })
    }
}
