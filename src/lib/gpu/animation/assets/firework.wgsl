struct Uniforms {
    resolution: vec3f,
    time: f32,
}

const MAX_NUMBER_OF_EXPLOSIONS = 64;
const MAX_NUMBER_OF_PARTICLES = 32;
const EXPLOSION_DURATION = 1.5;
const EXPLOSION_RADIUS = 0.1;
const PARTICLY_RADIUS = 0.25;

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> explosions: array<vec4f, MAX_NUMBER_OF_EXPLOSIONS>;


fn randf(p: f32) -> f32 {
    // Hash function by Dave Hoskins
    // https://www.shadertoy.com/view/4djSRW
    var q = fract(p * 0.1031);
    q *= (q + 33.33);
    q *= (q + q);
    return fract(q);
}

@fragment
fn fragment_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    var col = vec4<f32>(0.0);
    let resMin = min(uniforms.resolution.x, uniforms.resolution.y);

    for (var i = 0; i < MAX_NUMBER_OF_EXPLOSIONS; i++) {
        let explosion = explosions[i];
        let center = (fragCoord.xy - explosion.xy) / resMin;
        var t = uniforms.time - explosion.z;
        if (t > EXPLOSION_DURATION) {
            continue;
        }
        t *= 2 / EXPLOSION_DURATION;
        let explosionHash = randf(f32(i) * explosion.x + explosion.y);
        let baseColor = vec3f(0.35 + sin(explosionHash * 321.21) * 0.25, 0.25 + cos(explosionHash*832.231)* 0.15, 0.15 + cos(explosionHash*3.53) * 0.05);

        for (var j = 0; j < MAX_NUMBER_OF_PARTICLES; j++) {
            let particleHash = randf(f32(j) * explosionHash * 895345.12312 + 765.423);
            var weight = (1.0 - 0.2 * particleHash);

            // Generate points uniformly on hemisphere
            // (see Total Compendium eq. (34))
            let f = f32(j) / MAX_NUMBER_OF_PARTICLES;
            let r = sqrt(1.0 - f * f) * EXPLOSION_RADIUS;
            var theta = 2.0 * 0.618033 * 3.14159 * f32(j); // Use Golden Ratio for a quasirandom sequence
            theta += particleHash * 3.0 * 6.28 / MAX_NUMBER_OF_PARTICLES;

            // Only take x and y coordinates
            var lpos = vec2<f32>(cos(theta), sin(theta)) * r;
            // Add some physics
            lpos *= (1.0 - exp(-3.0 * t / weight)) * weight; // explosion, easing out
            lpos.y -= t * 0.3 * weight - t * (1.0 - exp(-t * weight)) * 0.6 * weight; // vertical free-fall motion

            // out before next explosion
            var intensity = 2e-4;
            intensity *= exp(-2.0*t); // Fade out with time
            intensity *= (1.-0.5*particleHash); // Randomize per particle
            intensity *= (1.+10.*exp(-20.*t)); // Intensity burst at explosion
            intensity *= clamp(3.*t, 0., 1.); // Fade out before next explosion

            let q = center - lpos;
            let opacity = intensity / dot(q,q) * PARTICLY_RADIUS;
            col = max(col, vec4f(baseColor * opacity, opacity));
        }
    }

    return col;
}

@vertex
fn vertex_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    let positions = array<vec2<f32>, 4>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, 1.0)
    );
    return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}