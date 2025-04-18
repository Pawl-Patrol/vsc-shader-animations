struct Uniforms {
    resolution: vec3f,
    mouse: vec4f,
    time: f32,
    frame: i32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> pointsInput: array<vec2f, 128>;
@group(0) @binding(2) var<storage, read_write> pointsOutput: array<vec2f, 128>;

const num_points = 128;
const num_bins = 64;
const window_length: i32 = 8;
const window_offset: f32 = 4.2;
const window_weights: array<f32, 8> = array(0.0, 0.3, 0.2, 0.75, -0.14, -0.11, 0.0, 0.0);

fn cubic(_t: f32) -> f32 {
    const a = -0.5;
    let t = abs(_t);
    let t3 = t * t * t;
    let t2 = t * t;
    if (t <= 1.0) {
        return (a + 2.0) * t3 - (a + 3.0) * t2 + 1.0;
    }
    if (t < 2.0) {
        return a * t3 - 5.0 * a * t2 + 8.0 * a * t - 4.0 * a;
    }
    return 0.0;
}

fn interpolate(p0: f32, p1: f32, p2: f32, p3: f32, t: f32) -> f32 {
    return p0 * cubic(t + 1.0) + p1 * cubic(t + 0.0) + p2 * cubic(t - 1.0) + p3 * cubic(t - 2.0);
}

fn line(p: vec2f, a: vec2f, b: vec2f) -> f32 {
    let ba = b - a;
    let pa = p - a;
    let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - h * ba);
}

fn palette(i: i32) -> vec3f {
    let t = f32(i) * 0.01;
    let a = vec3f(0.5, 0.5, 0.5);
    let b = vec3f(0.5, 0.5, 0.5);
    let c = vec3f(1.0, 1.0, 1.0);
    let d = vec3f(0.0, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}

fn window_lut(i: i32) -> f32 {
    if (i < 0 || i >= 8) {
        return 0.0;
    }
    return window_weights[i];
}

fn window(i: i32) -> f32 {
    let wf = fract(window_offset);
    return interpolate(window_lut(i - 1), window_lut(i - 0), window_lut(i + 1), window_lut(i + 2), wf);
}

fn get_mouse_or_whatever() -> vec2f {
    var previous: vec2f;
    if (uniforms.frame < 1) {
        previous = uniforms.resolution.xy * 0.5;
    }
    else {
        previous = pointsInput[0];
    }
    previous.x += (uniforms.mouse.x - previous.x) * 0.1;
    previous.y += (uniforms.mouse.y - previous.y) * 0.1;
    return previous;
}

fn get_point(i: i32) -> vec2f {
    return pointsInput[clamp(i, 0, num_points - 1)];
}

@compute @workgroup_size(256)
fn points_compute_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let g = 0.5 * (vec2f(cos(uniforms.time * 1.1), sin(uniforms.time * 1.1)) + 0.5) * uniforms.resolution.xy;
    let i = i32(global_id.x);
    if (uniforms.frame < 1 || i < 1) {
        pointsOutput[i] = get_mouse_or_whatever();
        return;
    }
    var fragColor = vec2f(0.0);
    var window_sum = 0.0;
    for (var j: i32 = 0; j < window_length; j++) {
        let w = window(j);
        window_sum += w;
        fragColor += w * get_point(i + j - i32(window_offset));
    }
    fragColor *= 1.0 / window_sum;
    fragColor += 0.001 * (g.xy - fragColor);
    pointsOutput[i] = fragColor;
}

const positions = array<vec2<f32>, 4>(
  vec2<f32>(-1.0, -1.0),
  vec2<f32>(1.0, -1.0),
  vec2<f32>(-1.0, 1.0),
  vec2<f32>(1.0, 1.0)
);

@vertex
fn image_vertex_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}

@fragment
fn image_fragment_main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
    var fragColor = vec4f(0.0);
    const bins_per_word = num_bins / 4;
    for (var w: i32 = 0; w < 4; w++) {
        for (var wo: i32 = 0; wo < bins_per_word; wo++) {
            let i = w * bins_per_word + wo;
            let start = i * num_points / num_bins;
            let end = (i + 1) * num_points / num_bins;

            var p0 = get_point(start - 2);
            var p1 = get_point(start - 1);
            var p2 = get_point(start - 0);
            for (var j: i32 = start; j < end; j++) {
                let p3 = get_point(j + 1);
                var trail = 2.0 / line(fragCoord.xy, p0, p1);
                let fade = 1.0 - smoothstep(0.75 * f32(num_points), f32(num_points), f32(j));
                trail = max(0.0, trail - 0.1);
                p0 = p1;
                p1 = p2;
                p2 = p3;
                fragColor = max(fragColor, vec4f(palette(j) * trail * fade, trail * fade));
            }
        }
    }

    return fragColor;
}