// This creates a gear, the module of the gear is one unit.
class Gear {

    constructor(tooth_shape, default_settings, settings) {
        // our default settings
        Object.assign(this, { tooth_width: 0.5 });
        // our subclass default settings
        Object.assign(this, default_settings);
        // user settings
        Object.assign(this, settings);
        // tooth shape set by subclass
        this.tooth_shape = tooth_shape;
        // also keep user settings so we can generate opposite gears and copies
        this.user_settings = settings

        if (!this.tooth_count) throw RangeError("tooth_count is required");

        this.hole_size ??= 1;
        this.draw_hole = null;
        switch (this.hole_shape) {
            case "": break;
            case "mark": this.draw_hole = draw_mark_hole; break;
            case "round": this.draw_hole = draw_round_hole; break;
            case "square": this.draw_hole = draw_square_hole; break;
            case "keyed": this.draw_hole = draw_keyed_hole; break;
            case "cross-axle": this.draw_hole = draw_axle_hole; break;
        }
    }

    radius() {
        return 0.5 * this.tooth_count;
    }

    iterate_points(f, i_start = 0, i_end) {
        const { tooth_count } = this;
        i_end ??= tooth_count;
        const tooth_angle = 2 * Math.PI / tooth_count;
        const profile = this.tooth_profile;
        for (var i = i_start; i < i_end; ++i) {
            var m = make_rot(tooth_angle * (i - this.tooth_width / 2));
            profile.forEach(p => {
                var p1 = tr(m, { x: p.x, y: -p.y });
                f(p1);
            });

            var m = make_rot(tooth_angle * (i + this.tooth_width / 2));
            profile.slice().reverse().forEach(p => {
                var p1 = tr(m, p);
                f(p1);
            });
        }
    }

    draw_teeth(ctx, pixel_ratio, x, y, zoom, range, rot_rad) {
        const { tooth_count } = this;
        const [i_start, i_end] = range;
        const radius = tooth_count * 0.5;

        // set up transforms for this gear
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(zoom, zoom);
        ctx.rotate(rot_rad);

        // draw gear
        const angle_start = (i_start - .75) * Math.PI * 2 / tooth_count;
        const angle_end = (i_end - .75) * Math.PI * 2 / tooth_count;
        ctx.beginPath();
        var p = r_th_to_p(radius - this.dd - 2, angle_start);
        ctx.moveTo(p.x, p.y);
        p = r_th_to_p(radius - this.dd, angle_start);
        ctx.lineTo(p.x, p.y);

        this.iterate_points(p => ctx.lineTo(p.x, p.y), i_start, i_end);

        p = r_th_to_p(radius - this.dd, angle_end);
        ctx.lineTo(p.x, p.y);
        p = r_th_to_p(radius - this.dd - 2, angle_end);
        ctx.lineTo(p.x, p.y);
        ctx.closePath();

        const line_width = 2 / ((1 + pixel_ratio) * zoom);
        ctx.lineWidth = line_width;

        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();

        ctx.restore();
    }


    draw(ctx, pixel_ratio, x, y, zoom, show, rot_rad, rot_rad_guides) {
        const { tooth_count } = this;
        const radius = tooth_count * 0.5;
        const line_width = 2 / ((1 + pixel_ratio) * zoom);

        // set up transforms for this gear
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(zoom, zoom);
        // save before rotating
        ctx.save();
        ctx.rotate(rot_rad);

        // draw gear
        ctx.beginPath();
        this.iterate_points(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();

        if (this.draw_hole) {
            const max_hole_r = radius - this.dd - 0.4;
            this.draw_hole(ctx, this.hole_size, max_hole_r);
        }

        ctx.lineWidth = line_width;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();

        // draw other things
        if (show.includes("pitch")) {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, 2 * Math.PI, false);

            ctx.lineWidth = line_width;
            ctx.strokeStyle = "#000";
            ctx.setLineDash([2 * line_width, 6 * line_width]);
            ctx.stroke();
        }
        if (show.includes("axes")) {
            const x1 = radius + this.ad;
            ctx.beginPath();
            ctx.moveTo(0, -x1);
            ctx.lineTo(0, x1);
            ctx.moveTo(-x1, 0);
            ctx.lineTo(x1, 0);

            ctx.strokeStyle = this.color;
            ctx.lineWidth = line_width * .4;
            ctx.setLineDash([10 * line_width, 2 * line_width]);
            ctx.stroke();
        }

        // undo rotation
        ctx.restore();
        ctx.save();

        ctx.rotate(rot_rad_guides);

        if (this.base && show.includes("base")) {
            ctx.beginPath();
            ctx.arc(0, 0, this.base, 0, 2 * Math.PI, false);

            ctx.strokeStyle = "#095";
            ctx.lineWidth = line_width * .7;
            ctx.setLineDash([6 * line_width, 2 * line_width]);
            ctx.stroke();
        }
        if (this.undercut_radius && show.includes("uc")) {
            ctx.beginPath();
            ctx.arc(0, 0, this.undercut_radius, 0, 2 * Math.PI, false);

            ctx.strokeStyle = "#f0f";
            ctx.lineWidth = line_width * .7;
            ctx.setLineDash([6 * line_width, 2 * line_width]);
            ctx.stroke();
        }
        if (show.includes("ad_dd")) {
            ctx.beginPath();
            ctx.arc(0, 0, radius - this.dd, 0, 2 * Math.PI, false);

            ctx.strokeStyle = "#f80";
            ctx.lineWidth = line_width * .5;
            ctx.setLineDash([16 * line_width, 4 * line_width]);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, radius + this.ad, 0, 2 * Math.PI, false);
            ctx.stroke();
        }
        if (this.loa && show.includes("loa")) {
            const loa = this.loa;
            ctx.beginPath();
            ctx.moveTo(loa[0].x, loa[0].y);
            for (var i = 1; i < loa.length; ++i) {
                ctx.lineTo(loa[i].x, loa[i].y);
            }
            ctx.strokeStyle = "#095";
            ctx.lineWidth = line_width;
            ctx.setLineDash([]);
            ctx.stroke();
        }
        // undo rotation
        ctx.restore();
        // undo scale and offset
        ctx.restore();
    }


    // by default gears have the same opposite shape
    opposite_gear_shape() {
        return this.tooth_shape
    }


    // return the opposite gear
    // settings may be used to override some properties.
    // for most gear types the tooth shape depends on the tooth count
    // of the other gear, for such types the tooth count value in settings
    // is ignored.
    opposite_gear(settings) {
        throw new Error("opposite_gear() not implemnented")
    }
}
