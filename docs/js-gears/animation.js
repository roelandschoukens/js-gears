function animate(btn, callback, t0) {

    var t_ref = null;
    var t = t0 ?? 0;
    var playing = false;

    function on_frame(window_t) {
        if (playing) {
            if (!t_ref) t_ref = window_t - t;
            t = window_t - t_ref;
        }

        callback(t);

        if (playing) window.requestAnimationFrame(on_frame);
    };

    btn.innerHTML = STOP_SVG;
    btn.addEventListener("click", function (e) {
        var pressed = !(this.dataset.pressed == "1");
        this.dataset.pressed = pressed ? "1" : "0";
        this.innerHTML = pressed ? PLAY_SVG : STOP_SVG;
        playing = pressed;
        if (playing) window.requestAnimationFrame(on_frame);
        else { t_ref = null; }
    });
    callback(t0);
}
