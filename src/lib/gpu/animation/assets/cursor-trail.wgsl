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


fn random(st: vec2<f32>) -> f32 {
    return fract(sin(dot(st, vec2<f32>(12.9898, 78.233))) * 43758.5453123);
}

// Based on Morgan McGuire's noise
fn noise(st: vec2<f32>) -> f32 {
    let i = floor(st);
    let f = fract(st);

    let a = random(i);
    let b = random(i + vec2<f32>(1.0, 0.0));
    let c = random(i + vec2<f32>(0.0, 1.0));
    let d = random(i + vec2<f32>(1.0, 1.0));

    let u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}

fn fbm(st_input: vec2<f32>) -> f32 {
    var st = st_input;
    var value = 0.0;
    var amplitude = 0.5;
    let shift = vec2<f32>(100.0, 100.0);
    let rot = mat2x2<f32>(
        cos(0.5), sin(0.5),
        -sin(0.5), cos(0.5)
    );

    for (var i = 0; i < 5; i = i + 1) {
        value = value + amplitude * noise(st);
        st = rot * st * 2.0 + shift;
        amplitude = amplitude * 0.5;
    }

    return value;
}

fn circle_sdf(p: vec2<f32>, r: f32) -> f32 {
    return length(p) - r;
}

fn smoke_blend(uv: vec2<f32>, tex_color: vec3<f32>, opacity: f32) -> vec4<f32> {
    var st = uv * 5.0;

    var color = vec3<f32>(0.0);

    var q = vec2<f32>(0.0);
    q.x = fbm(st + 0.00 * time * 0.001);
    q.y = fbm(st + vec2<f32>(1.0, 1.0));

    var r = vec2<f32>(0.0);
    r.x = fbm(st + 1.0 * q + vec2<f32>(1.7, 9.2) + 0.15 * time * 0.001);
    r.y = fbm(st + 1.0 * q + vec2<f32>(-0.260, -0.800) + 0.126 * time * 0.001);

    let f = fbm(st + r);

    color = mix(
        vec3<f32>(0.101961, 0.619608, 0.666667),
        vec3<f32>(0.666667, 0.666667, 0.498039),
        clamp(f * f * 4.0, 0.0, 0.976)
    );

    color = mix(
        color,
        vec3<f32>(0.0, 0.0, 0.164706),
        clamp(length(q), 0.0, 1.0)
    );

    color = mix(
        color,
        vec3<f32>(0.666667, 1.0, 1.0),
        clamp(abs(r.x), 0.0, 1.0)
    );

    color = mix(color, tex_color, 0.9);

    return vec4<f32>((f * f * f + 0.6 * f * f + 0.5 * f + 0.5) * color, max(opacity, 0.15));
}

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

    let alpha = min(${cursorTrailOpacity}, exp(-d * 50));
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