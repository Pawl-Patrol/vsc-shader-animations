@group(0) @binding(0) var<uniform> time: f32;
@group(0) @binding(1) var<uniform> progress: f32;
@group(0) @binding(2) var<uniform> sourceRect: vec4<f32>;
@group(0) @binding(3) var<uniform> targetRect: vec4<f32>;
@group(0) @binding(4) var<uniform> canvasRect: vec4<f32>;
@group(0) @binding(5) var text: texture_2d<f32>;
@group(0) @binding(6) var samp: sampler;

const N: u32 = 6;

fn easingFunction(x: f32) -> f32 {
    return x * x;
}

fn sdPolygon(v: array<vec2<f32>, N>, p: vec2<f32>) -> f32 {
    var d = dot(p - v[0], p - v[0]);
    var s = 1.0;

    for (var i = 0u; i < N; i = i + 1u) {
        let j = (i + N - 1u) % N;

        let e = v[j] - v[i];
        let w = p - v[i];
        let h = clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
        let b = w - e * h;

        d = min(d, dot(b, b));

        let c0 = p.y >= v[i].y;
        let c1 = p.y < v[j].y;
        let c2 = (e.x * w.y) > (e.y * w.x);

        if (c0 && c1 && c2) || (!c0 && !c1 && !c2) {
            s = s * - 1.0;
        }
    }

    return s * sqrt(d);
}

var<private> positions: array<vec2<f32>, 6>;

@fragment
fn fragment_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    let rect1 = 2.0 * (sourceRect - vec4<f32>(canvasRect.xy, canvasRect.xy)) / vec4<f32>(canvasRect.zw, canvasRect.zw) - 1.0;
    let rect2 = 2.0 * (targetRect - vec4<f32>(canvasRect.xy, canvasRect.xy)) / vec4<f32>(canvasRect.zw, canvasRect.zw) - 1.0;

    let easedProgress = easingFunction(progress);
    let progress1 = max(0.0, 1.5 * easedProgress - 0.5);
    let progress2 = min(1.0, 1.5 * easedProgress);

    let rectA = mix(rect1, rect2, progress1);
    let rectB = mix(rect1, rect2, progress2);

    if rect1.x < rect2.x && rect1.y < rect2.y {
        positions = array(rectA.xy, rectA.xw, rectB.xw, rectB.zw, rectB.zy, rectA.zy);
    }
    else if rect1.x > rect2.x && rect1.y < rect2.y {
        positions = array(rectB.xw, rectB.zw, rectA.zw, rectA.zy, rectA.xy, rectB.xy);
    }
    else if rect1.x < rect2.x && rect1.y > rect2.y {
        positions = array(rectA.xw, rectA.zw, rectB.zw, rectB.zy, rectB.xy, rectA.xy);
    }
    else {
        positions = array(rectB.xy, rectB.xw, rectA.xw, rectA.zw, rectA.zy, rectB.zy);
    }

    let d = sdPolygon(positions, fragCoord.xy / canvasRect.zw * 2.0 - 1.0);
    let uv = fragCoord.xy / canvasRect.zw;
    let textureColor = textureSample(text, samp, uv);

    let alpha = min(${config.cursorTransition.opacity}, exp(-d * 100 / ${config.cursorTransition.bloom}) * textureColor.a);
    return vec4f(textureColor.rgb * alpha, alpha);
}

@vertex
fn vertex_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  // render one big square
    let positions = array<vec2<f32>, 4>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, 1.0)
    );
    return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}