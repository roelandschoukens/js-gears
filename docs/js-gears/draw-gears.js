function make_svg_gears(gear_canvas, settings) {
  const {gear_1, gear_2} = gear_canvas;
  const size_x = gear_1.tooth_count + gear_2.tooth_count + 4;
  const size_y = Math.max(gear_1.tooth_count, gear_2.tooth_count) + 4;
  const x1 = 2 + 0.5 * gear_1.tooth_count;
  const dx2 = (gear_1.tooth_count + gear_2.tooth_count) / 2 + get_involute_extra_dist(settings);
  const y = size_y / 2;

  var inv_rot_extra = get_involute_extra_rotation(gear_1, gear_2, dx2);
  var rot_extra = inv_rot_extra ? inv_rot_extra.rot_extra : 0;
  rot_extra *= 180 / Math.PI;
  rot_extra += 360 / gear_2.tooth_count * (gear_1.tooth_width + gear_2.tooth_width) / 2;
  const to_fixed = f => Number.parseFloat(f).toFixed(3);
  
  var path1 = "";
  gear_canvas.gear_1.iterate_points(p => path1 += `L${to_fixed(p.x)} ${to_fixed(p.y)}`);
  path1 = 'M' + path1.substring(1) + "z";

  var path2 = "";
  gear_canvas.gear_2.iterate_points(p => path2 += `L${to_fixed(p.x)} ${to_fixed(p.y)}`);
  path2 = 'M' + path2.substring(1) + "z";


  const zoom = Math.floor(Math.min(30, 2000 / size_x));
  const stroke_w = 1 / zoom;
  const dash_array = `${to_fixed(8 / zoom)} ${to_fixed(2 / zoom)} ${to_fixed(2 / zoom)} ${to_fixed(2 / zoom)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg"  width="${size_x * zoom}" height="${size_y * zoom}" viewBox="${-x1} ${-y} ${size_x} ${size_y}">
  <g id="gear-1" fill="#ccf" stroke="blue" stroke-width="${stroke_w}" >
    <path d="${path1}" />
    <circle cx="0" cy="0" r="${stroke_w}" fill="blue"/>
    <line stroke="black" stroke-width="${stroke_w*.7}" stroke-dasharray="${dash_array}" stroke-linecap="butt"
        x1="0" y1="${-gear_1.tooth_count/2 - 2}"
        x2="0" y2="${+gear_1.tooth_count/2 + 2}"/>
    <line stroke="black" stroke-width="${stroke_w*.7}" stroke-dasharray="${dash_array}" stroke-linecap="butt"
        x1="${-gear_1.tooth_count/2 - 2}" y1="0"
        x2="${gear_1.tooth_count/2 + 2}" y2="0"/>
  </g>
  <g id="gear-2" fill="#fcc" stroke="red" stroke-width="${stroke_w}" transform="translate(${dx2},0) rotate(${180 - rot_extra})">
    <path d="${path2}" />
    <circle cx="0" cy="0" r="${stroke_w}" fill="red"/>
    <line stroke="black" stroke-width="${stroke_w*.7}" stroke-dasharray="${dash_array}" stroke-linecap="butt"
        x1="0" y1="${-gear_2.tooth_count/2 - 2}"
        x2="0" y2="${+gear_2.tooth_count/2 + 2}"/>
    <line stroke="black" stroke-width="${stroke_w*.7}" stroke-dasharray="${dash_array}" stroke-linecap="butt"
        x1="${-gear_2.tooth_count/2 - 2}" y1="0"
        x2="${gear_2.tooth_count/2 + 2}" y2="0"/>
  </g>
</svg>`;
}