function setupCanvas(canvas, pixel_ratio)
{
    pixel_ratio ??= window.devicePixelRatio;
    // original (logical) size
    var w = canvas.dataset.width || canvas.width;
    var h = canvas.dataset.height || canvas.height;

    // store in dataset so we know the original size
    canvas.dataset.width ??= w;
    canvas.dataset.height ??= h;

    const ctx = canvas.getContext('2d');
    const scale = pixel_ratio;

    // size in actual pixels
    // canvas shall fit the original requested area
    canvas.width = Math.ceil(w * scale);
    canvas.height = Math.ceil(h * scale);

    // rescale the canvas with CSS. Use the scaled size because we
    // want to resize exactly
    canvas.style.width = `${canvas.width / scale}px`;
    canvas.style.height = `${canvas.height / scale}px`;

    // 3. Normalize the coordinate system so your drawing code stays the same
    ctx.resetTransform();
    ctx.scale(scale, scale);
}


function logicalCanvasSize(ctx) {
    return [ctx.canvas.dataset.width, ctx.canvas.dataset.height];
}