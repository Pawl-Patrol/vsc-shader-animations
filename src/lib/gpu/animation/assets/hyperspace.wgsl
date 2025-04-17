struct Uniforms {
    iResolution: vec2<f32>,
    iTime: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

const TAU: f32 = 6.28318;
const PI: f32 = 3.141592;

const NUM_SLICES: f32 = 125.0;
const MAX_SLICE_OFFSET: f32 = 0.4;
const T_ENTRY_MAX: f32 = 3.0;
const T_BETWEEN: f32 = 1.0;
const T_EXIT_MAX: f32 = 3.0;
const T_MAX: f32 = T_ENTRY_MAX + T_BETWEEN + T_EXIT_MAX;
const T_JUMP: f32 = 0.75;
const JUMP_SPEED: f32 = 15.0;
const BLUE_COL: vec3<f32> = vec3<f32>(0.3, 0.3, 0.5);
const WHITE_COL: vec3<f32> = vec3<f32>(0.85, 0.85, 0.9);
const FLARE_COL: vec3<f32> = vec3<f32>(0.9, 0.9, 1.4);

fn sdLine(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>, ring: f32) -> f32 {
    let pa = p - a;
    let ba = b - a;
    let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - ring;
}

fn rand(co: vec2<f32>) -> f32 {
    return fract(sin(dot(co, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

fn exit(t: f32, p: vec2<f32>) -> vec4<f32> {
    var color = vec4<f32>(0.0);
    
    let p_len = length(p);
    let v = vec3<f32>(p, 1.0);

    var trail_start: f32;
    var trail_end: f32;
    let fade = clamp(mix(0.1, 1.1, t * 2.0), 0.0, 2.0);

    for (var i: f32 = 0.0; i < 80.0; i += 1.0) {
        var trail_color = vec3<f32>(0.0);
        let angle = atan2(v.y, v.x) / PI / 2.0 + 0.13 * i;

        let slice = floor(angle * NUM_SLICES);
        let slice_fract = fract(angle * NUM_SLICES);

        let slice_offset = MAX_SLICE_OFFSET *
            rand(vec2<f32>(slice, 4.0 + i * 25.0)) - (MAX_SLICE_OFFSET / 2.0);

        let dist = 10.0 * rand(vec2<f32>(slice, 1.0 + i * 10.0)) - 5.0;
        let z = dist * v.z / length(v.xy);
        var f = sign(dist);
        if (f == 0.0) {
            f = 1.0;
        }

        let fspeed = f * (rand(vec2(slice, 1.0 + i * 0.1)) + i * 0.01);
        trail_end = 10.0 * rand(vec2(slice, i + 10.0)) - 5.0 - t * fspeed;

        trail_start = trail_end + f;
        trail_start = max(trail_end, trail_start - (t * fspeed) - mix(0.0, f * JUMP_SPEED, smoothstep(0.5, 1.0, t)));

        let trail_x = smoothstep(trail_start, trail_end, z);
        trail_color = mix(BLUE_COL, WHITE_COL, trail_x);

        let h = sdLine(
            vec2<f32>(slice_fract + slice_offset, z),
            vec2<f32>(0.5, trail_start),
            vec2<f32>(0.5, trail_end),
            mix(0.0, 0.015, t * z)
        );

        let threshold = mix(0.12, 0.0, smoothstep(0.5, 0.8, t));
        var h_weight = 0.85 * smoothstep(threshold, 0.0, abs(h));

        color = max(color, vec4<f32>(trail_color * fade * h_weight, fade * h_weight));
    }

    return color + mix(1.0, 0.0, smoothstep(0.0, T_JUMP, t));
}

fn entry(t: f32, p: vec2<f32>) -> vec4<f32> {
    var color = vec4<f32>(0.0);

    let p_len = length(p);
    let v = vec3<f32>(p, 1.0);

    var trail_start: f32;
    var trail_end: f32;
    let fade = clamp(mix(0.1, 1.1, t * 2.0), 0.0, 2.0);

    for (var i: f32 = 0.0; i < 80.0; i += 1.0) {
        var trail_color = vec3<f32>(0.0);
        let angle = atan2(v.y, v.x) / PI / 2.0 + 0.13 * i;

        let slice = floor(angle * NUM_SLICES);
        let slice_fract = fract(angle * NUM_SLICES);

        let slice_offset = MAX_SLICE_OFFSET *
            rand(vec2<f32>(slice, 4.0 + i * 25.0)) - (MAX_SLICE_OFFSET / 2.0);

        let dist = 10.0 * rand(vec2<f32>(slice, 1.0 + i * 10.0)) - 5.0;
        let z = dist * v.z / length(v.xy);
        var f = sign(dist);
        if (f == 0.0) {
            f = 1.0;
        }
        let fspeed = f * (0.1 * rand(vec2<f32>(slice, 1.0 + i * 10.0)) + i * 0.01);
        let fjump_speed = f * JUMP_SPEED;

        trail_start = 10.0 * rand(vec2<f32>(slice, 0.0 + i * 10.0)) - 5.0;
        trail_start = trail_start - mix(0.0, fjump_speed, smoothstep(T_JUMP, 1.0, t));

        trail_end = trail_start - t * fspeed;

        let trail_x = smoothstep(trail_start, trail_end, z);
        trail_color = mix(BLUE_COL, WHITE_COL, trail_x);

        let h = sdLine(
            vec2<f32>(slice_fract + slice_offset, z),
            vec2<f32>(0.5, trail_start),
            vec2<f32>(0.5, trail_end),
            mix(0.0, 0.015, t * z)
        );

        let threshold = 0.08; // mix(0.12, 0.0, smoothstep(0.5, 0.8, t));
        var h_weight = 0.85 * smoothstep(threshold, 0.0, abs(h));

        color = max(color, vec4<f32>(trail_color * fade * h_weight, fade * h_weight));
    }

    return color + mix(0.0, 1.0, smoothstep(T_JUMP, 1.0, t));
}

@fragment
fn fragment_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    let time = uniforms.iTime % T_MAX;
    let p = (2.0 * fragCoord.xy - uniforms.iResolution.xy) / min(uniforms.iResolution.x, uniforms.iResolution.y);

    if time < T_ENTRY_MAX {
        let t = time / T_ENTRY_MAX;
        return entry(t, p);
    } else if time < T_ENTRY_MAX + T_BETWEEN {
        return vec4<f32>(1.0, 1.0, 1.0, 1.0);
    } else {
        let t = (time - T_ENTRY_MAX - T_BETWEEN) / T_EXIT_MAX;
        return exit(t, p);
    }
}

const positions = array<vec2<f32>, 4>(
  vec2<f32>(-1.0, -1.0),
  vec2<f32>(1.0, -1.0),
  vec2<f32>(-1.0, 1.0),
  vec2<f32>(1.0, 1.0)
);

@vertex
fn vertex_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}