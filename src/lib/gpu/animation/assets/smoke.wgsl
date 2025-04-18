struct Uniforms {
    resolution: vec3f,
    time: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

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

@fragment
fn fragment_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = fragCoord.xy / uniforms.resolution.xy;
    let st = uv * 3.0;

    var color = vec3<f32>(0.0);

    var q = vec2<f32>(0.0);
    q.x = fbm(st + 0.00 * uniforms.time * 0.001);
    q.y = fbm(st + vec2<f32>(1.0, 1.0));

    var r = vec2<f32>(0.0);
    r.x = fbm(st + 1.0 * q + vec2<f32>(1.7, 9.2) + 0.15 * uniforms.time * 0.001);
    r.y = fbm(st + 1.0 * q + vec2<f32>(-0.260, -0.800) + 0.126 * uniforms.time * 0.001);

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

    var opacity = (f * f * f + 0.6 * f * f + 0.5 * f) * ${config.smoke.opacity};
    return vec4f(color * opacity, opacity);
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