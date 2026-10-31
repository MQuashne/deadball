"use strict";

/**
 * @brief generates polyhedral dice with roll animation and result calculation
 * @author Anton Natarov aka Teal (original author)
 * @author Sarah Rosanna Busch (refactor, see changelog)
 * @date 10 Aug 2023
 * @version 1.1
 * @dependencies teal.js, cannon.js, three.js
 */

/**
 * CHANGELOG
 * - tweaked scaling to make dice look nice on mobile
 * - removed dice selector feature (separating UI from dice roller)
 * - file reorg (moving variable declarations to top, followed by public then private functions)
 * - removing true random option (was cool but not worth the extra dependencies or complexity)
 * - removing mouse event bindings (separating UI from dice roller)
 * - refactoring to module pattern and reducing publically available properties/methods
 * - removing dice notation getter callback in favour of setting dice to roll directly
 * - adding sound effect
 * - adding roll results to notation returned in after_roll callback
 * - adding 'd9' option (d10 to be added to d100 properly)
 * - fixed init/resize inside hidden containers: size-dependent setup (camera, light,
 *   barriers, desk) moved out of the constructor and into reinit(), which now no-ops
 *   until the container has real dimensions. Replaced the broken/non-functional
 *   'resize' event binding (elements don't fire native resize events, callback had
 *   wrong `this`, and `elem` was undefined) with a ResizeObserver that calls reinit()
 *   once the container becomes visible/sized. Added camera guards to __animate/render
 *   calls so nothing renders with an undefined camera.
 * - after a roll settles, dice are auto-lined-up along the top edge of the desk
 *   (line_up_dice) so the lower part of the canvas stays clear for a message/options
 *   UI. Configurable via vars.lineup_* and can be skipped by passing false to
 *   start_throw/roll's after_roll usage pattern (see line_up_dice).
 * - added reroll(notation_indices, before_reroll, after_reroll): re-throws only
 *   the selected dice (by stable notation_index) while every other die stays
 *   exactly where it's lined up; results merge back into last_notation and
 *   everyone is re-lined-up together once settled. Added set_dice_selected()
 *   for a tap-to-pick highlight, and fixed search_dice_by_mouse() (previously
 *   returned an always-empty userData object) so it now returns the tapped die
 *   mesh directly.
 * - increased the edge/corner chamfer on every die shape (d4/d6/d8/d10/d12/d20,
 *   which d9/d100 also inherit) so edges read as rounded rather than sharp.
 *   See the comment above create_d4_geometry for how the chamfer arg works;
 *   each shape's value can be tuned independently to taste.
 * - added stuck-roll recovery: constructor setup was split out into _build()
 *   so it can be re-run cleanly, and hard_reset() tears down + rebuilds the
 *   whole renderer/scene/world in place. A watchdog timer (_start_watchdog/
 *   _clear_watchdog) starts on every roll()/reroll() and auto-triggers
 *   hard_reset() if `rolling` is still true ~15s later — covers silent WebGL
 *   context loss (renderer.domElement now also listens for
 *   webglcontextlost/restored directly) and any other exception that could
 *   otherwise leave `rolling` stuck true forever, silently no-oping every
 *   future click. hard_reset() is a public method, so it also works as a
 *   manual "stuck? tap to reset" button from your own UI. Optional
 *   box.on_stuck callback fires after an automatic recovery so the UI can
 *   surface a toast/notice if desired.
 * - line_up_dice() now wraps into multiple rows instead of cramming every die
 *   into one row with shrinking spacing — high dice counts (e.g. 10) were
 *   ending up packed close enough to overlap. New vars.lineup_min_spacing_scale
 *   is the knob for this: the floor on how close together dice are allowed to
 *   get (as a multiple of vars.scale) before an extra row is added. Also added
 *   vars.lineup_row_spacing_scale for the vertical gap between rows.
 * - line_up_dice() now also spins each die around its up-face's own normal so
 *   the printed label reads upright toward the camera, instead of whatever
 *   yaw the physics tumble left it at. Derived exactly from the face's own
 *   UV data (compute_face_bitangent, standard tangent/bitangent construction)
 *   rather than guessed per-shape constants, so it should hold up for every
 *   face shape including d10's irregular kite faces. Skipped for d4 (its
 *   3-numbers-per-face / read-by-edge convention doesn't fit this model).
 *   Toggle via vars.upright_labels_enabled. NOTE: unverified against an
 *   actual render — if labels come out upside-down or mirrored, flip the
 *   sign at the "angle = -angle" comment in compute_upright_correction.
 * - added apply_mod(notation_index, delta, after_mod): nudges a single
 *   settled die's shown value (e.g. a "mod token" +1/-1 mechanic) by
 *   relabeling its already-up face via the same cyclic shift_dice_faces
 *   trick reroll() uses for forced results — no movement, no re-throw, just
 *   an instant relabel, kept in sync with last_notation. Clamps to the die's
 *   face range by default (see the comment at the clamp for how to wrap
 *   instead). vars.mod_pulse_enabled toggles a small cosmetic scale-pulse on
 *   the modded die.
 * - fixed the root cause behind occasional stuck/garbage rolls: cannon's
 *   solver can rarely go numerically unstable (NaN position/quaternion),
 *   which previously rode out check_if_throw_finished's own ~10s force-finish
 *   safety cap and then silently surfaced as get_dice_value returning -1 for
 *   every affected die — the _start_watchdog/hard_reset system never even
 *   saw a problem, since the throw "completed" (with garbage). __animate now
 *   checks for this every frame (dice_state_corrupted) and, on detection,
 *   signals failure via a null result instead of computing values from
 *   corrupted data. Both throw_dices and reroll() catch that null and
 *   auto-retry with a fresh random throw (never replaying the failed one, up
 *   to 2 retries) before a bad result can ever reach after_roll/after_reroll;
 *   before_roll/before_reroll are only ever invoked once per user-initiated
 *   call, not once per retry. Falls back to hard_reset() + box.on_stuck if
 *   still failing after 3 total attempts. Also dropped some inert dead code
 *   (the commented-out playSound loop's now-unused numDice calculation).
 *  * - per-die color palettes: box.setPalettes([...]) assigns a palette by notation position; dice without one use the
 *   shared defaults from set_color(). Materials are cached per (type + palette).
 */


//import { FontLoader } from 'https://app.unpkg.com/three@0.160.0/files/examples/jsm/loaders/FontLoader.js';
//import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export const DICE = (function() {
    var that = {};
    
    var vars = { //todo: make these configurable on init
        frame_rate: 1 / 60,
        scale: 35, //dice size
        
        material_options: {
            specular: 0x172022,
            color: 0xf0f0f0,
            shininess: 30,
            shading: THREE.FlatShading,
        },
        label_color: '#E81828', //numbers on dice
        outline_color: '#ffffff',
        dice_color: '#ffffff',
        stripe_color: '#E81828',
        ambient_light_color: 0xf0f0f0,
        spot_light_color: 0x404040,
        desk_color: '#101010', //canvas background
        desk_opacity: 0,
        use_shadows: true,
        use_adapvite_timestep: true, //todo: setting this to false improves performace a lot. but the dice rolls don't look as natural...
        
        // Where settled dice get tucked after a roll, as a fraction of the desk's
        // half-height/half-width (0 = center, 1 = edge/barrier). y_fraction > 0 is
        // the upper half of the desk, < 0 is the lower half.
        lineup_enabled: true,
        lineup_y_fraction: 0.72,
        lineup_max_spacing_scale: 2.5, //cap spacing at N * vars.scale so few dice don't spread edge-to-edge
        // Floor on center-to-center spacing, as a multiple of vars.scale (the
        // die's world-space size). This is the actual knob for "dice overlap
        // with high counts": once a single row can't fit everyone at least
        // this far apart, line_up_dice() wraps into additional rows instead of
        // continuing to shrink the gap between them. Raise this for more
        // breathing room per die (fewer per row, more rows); lower it to pack
        // more dice into each row before wrapping.
        lineup_min_spacing_scale: 1.35,
        lineup_row_spacing_scale: 1.5, //vertical gap between rows, as a multiple of vars.scale
        lineup_duration_ms: 500,
        
        // Spin each die's up-face around its own normal (during line_up_dice)
        // so the printed label reads upright toward the camera, rather than
        // whatever random yaw the physics tumble left it at. Doesn't apply to
        // d4 (see compute_upright_correction). Set false to disable and leave
        // the settled spin exactly as physics left it.
        upright_labels_enabled: true,
        
        // Brief scale-pulse played on a die when apply_mod() changes its value,
        // so a mod token spend reads as an event rather than an instant jump-cut.
        // Purely cosmetic — set false to disable.
        mod_pulse_enabled: true
    }
    //const loader=new FontLoader();
    const CONSTS = {
        known_types: ['d4', 'd6', 'd8', 'd9', 'd10', 'd12', 'd20', 'd100'],
        dice_face_range: {
            'd4': [1, 4],
            'd6': [1, 6],
            'd8': [1, 8],
            'd9': [0, 9],
            'd10': [0, 9],
            'd12': [1, 12],
            'd20': [1, 20],
            'd100': [0, 9]
        },
        dice_mass: { 'd4': 300, 'd6': 300, 'd8': 340, 'd9': 350, 'd10': 350, 'd12': 350, 'd20': 400, 'd100': 350 },
        dice_inertia: { 'd4': 5, 'd6': 13, 'd8': 10, 'd9': 9, 'd10': 9, 'd12': 8, 'd20': 6, 'd100': 9 },
        
        standart_d20_dice_face_labels: [' ', '0', '1', '2', '3', '4', '5', '6', '7', '8',
            '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'
        ],
        standart_d100_dice_face_labels: [' ', '00', '10', '20', '30', '40', '50',
            '60', '70', '80', '90'
        ],
        
        d4_labels: [
            [
                [],
                [0, 0, 0],
                [2, 4, 3],
                [1, 3, 4],
                [2, 1, 4],
                [1, 2, 3]
            ],
            [
                [],
                [0, 0, 0],
                [2, 3, 4],
                [3, 1, 4],
                [2, 4, 1],
                [3, 2, 1]
            ],
            [
                [],
                [0, 0, 0],
                [4, 3, 2],
                [3, 4, 1],
                [4, 2, 1],
                [3, 1, 2]
            ],
            [
                [],
                [0, 0, 0],
                [4, 2, 3],
                [1, 4, 3],
                [4, 1, 2],
                [1, 3, 2]
            ]
        ]
    }
    
    // DICE BOX OBJECT
    
    // @brief constructor; create a new instance of this to initialize the canvas
    // @param container element to contain canvas; canvas will fill container
    that.dice_box = function(container) {
        this.dices = [];
        this.palettes = [];
        //per-die color palettes, indexed by notation position
        this.diceToRoll = ''; //user input
        this.container = container;
        this._build(container);
    }
    
    // @brief does the actual scene/renderer/world/camera/barrier setup. Split
    // out from the constructor so hard_reset() can tear everything down and
    // call this again to get a fully clean instance — same entry point,
    // reused for both first-time init and recovery.
    that.dice_box.prototype._build = function(container) {
        this.scene = new THREE.Scene();
        this.world = new CANNON.World();
        
        this.renderer = window.WebGLRenderingContext ?
            new THREE.WebGLRenderer({ antialias: true, alpha: true }) :
            new THREE.CanvasRenderer({ antialias: true, alpha: true });
        // Without this, HiDPI/retina screens render at CSS pixel size and get
        // upscaled by the browser, which is a major source of overall blurriness.
        this.renderer.setPixelRatio(window.devicePixelRatio || 1);
        container.appendChild(this.renderer.domElement);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.setClearColor(0xffffff, 0); //color, alpha
        // Used by the face-label texture generators (create_dice_materials /
        // create_d4_materials) so numbers stay sharp when a die face is viewed
        // at a steep angle. getMaxAnisotropy() is the r73-era API name.
        that.renderer_max_anisotropy = this.renderer.getMaxAnisotropy ?
            this.renderer.getMaxAnisotropy() : 1;
        
        // Mobile browsers (iOS Safari especially) can silently kill the WebGL
        // context under memory pressure or after backgrounding — with no error,
        // no exception, renderer.render() just becomes a no-op afterward, which
        // looks exactly like "roll triggered, nothing happens, forever." Listen
        // for both ends so we can recover automatically instead of staying dead.
        var box = this;
        this.renderer.domElement.addEventListener('webglcontextlost', function(ev) {
            ev.preventDefault();
            console.warn('[dice] WebGL context lost.');
            box._context_lost = true;
        }, false);
        this.renderer.domElement.addEventListener('webglcontextrestored', function() {
            console.warn('[dice] WebGL context restored — rebuilding dice box.');
            box._context_lost = false;
            box.hard_reset();
        }, false);
        
        this.world.gravity.set(0, 0, -9.8 * 800);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 16;
        
        var ambientLight = new THREE.AmbientLight(vars.ambient_light_color);
        this.scene.add(ambientLight);
        
        this.dice_body_material = new CANNON.Material();
        this.desk_body_material = new CANNON.Material();
        this.barrier_body_material = new CANNON.Material();
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            this.desk_body_material, this.dice_body_material, 0.01, 0.5));
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            this.barrier_body_material, this.dice_body_material, 0, 1.0));
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            this.dice_body_material, this.dice_body_material, 0, 0.5));
        
        this.world.add(new CANNON.RigidBody(0, new CANNON.Plane(), this.desk_body_material));
        
        // NOTE: barriers used to be created here using this.w/this.h, but those are
        // only known once reinit() has real container dimensions. They're now
        // (re)created inside reinit() itself, alongside the camera/light/desk.
        this.barriers = [];
        
        this.reinit(container);
        
        // Replaces the old, non-functional:
        //   $t.bind(container, 'resize', function() { this.reinit(elem.canvas); });
        // Plain elements never fire a native 'resize' event, `this` inside that
        // callback wasn't the dice_box instance, and `elem` was never defined.
        // ResizeObserver correctly fires when a hidden (0x0) container becomes
        // visible and gets real dimensions, which is exactly when we need to
        // (re)build the camera/light/barriers/desk.
        if (window.ResizeObserver) {
            this._resizeObserver = new ResizeObserver(function(entries) {
                var rect = entries[0].contentRect;
                if (rect.width === 0 || rect.height === 0) return;
                // Defer the actual reinit work to the next animation frame rather
                // than running it synchronously inside the observer callback.
                // Doing size-changing work (renderer.setSize, DOM/layout reads)
                // directly inside a ResizeObserver callback is what commonly
                // triggers "ResizeObserver loop completed with undelivered
                // notifications" — the browser can't finish delivering this
                // notification if handling it causes another resize in the same
                // pass. The _reinitScheduled guard avoids stacking up redundant
                // reinit calls if multiple resize notifications land before the
                // next frame runs.
                if (box._reinitScheduled) return;
                box._reinitScheduled = true;
                requestAnimationFrame(function() {
                    box._reinitScheduled = false;
                    box.reinit(container);
                });
            });
            this._resizeObserver.observe(container);
        }
        
        this.last_time = 0;
        this.running = false;
        this.rolling = false;
        
        // Only render here if reinit() already managed to set up a camera
        // (i.e. the container had a real size at construction time). Otherwise
        // this is a no-op until ResizeObserver triggers reinit().
        if (this.camera) this.renderer.render(this.scene, this.camera);
    }
    
    // @brief tears down the current renderer/scene/world/camera entirely and
    // rebuilds a fresh one in the same container, discarding any in-flight
    // roll/reroll/lineup state. This is the "reinitialize the box" recovery
    // path: called automatically by the stuck-roll watchdog and by the
    // webglcontextrestored handler above, and safe to call directly from a
    // manual "dice stuck? tap to reset" button in your UI too.
    that.dice_box.prototype.hard_reset = function() {
        this._clear_watchdog();
        this._lineup_id = (this._lineup_id || 0) + 1; // cancel any in-flight line-up tween
        this.running = false;
        this.rolling = false;
        this.dices = [];
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = undefined;
        }
        if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        this.camera = undefined; // so nothing tries to render mid-rebuild
        clear_material_cache(); 
        this._build(this.container);
    }
    
    // @brief starts (or restarts) the stuck-roll watchdog. If `rolling` is
    // still true after `timeout_ms`, something broke mid-roll (a thrown
    // exception, a dropped WebGL context that didn't fire its event, a browser
    // throttling rAF into oblivion, etc.) — auto-recover via hard_reset()
    // rather than leaving the box permanently unresponsive to further clicks.
    // 15s default gives headroom over check_if_throw_finished's own ~10s cap.
    that.dice_box.prototype._start_watchdog = function(timeout_ms) {
        var box = this;
        this._clear_watchdog();
        this._watchdog = setTimeout(function() {
            if (box.rolling) {
                console.warn('[dice] roll watchdog fired — dice appear stuck, recovering.');
                box.hard_reset();
                if (typeof box.on_stuck === 'function') box.on_stuck();
            }
        }, timeout_ms || 15000);
    }
    
    that.dice_box.prototype._clear_watchdog = function() {
        if (this._watchdog) {
            clearTimeout(this._watchdog);
            this._watchdog = undefined;
        }
    }
    
    
    // called on init and window resize
    that.dice_box.prototype.reinit = function(container) {
        this.cw = container.clientWidth / 2;
        this.ch = container.clientHeight / 2;
        
        // Container is still hidden/zero-sized (e.g. display:none). Bail out
        // cleanly; ResizeObserver will call reinit() again once it has a real
        // size, and nothing here should run against NaN/zero dimensions.
        if (this.cw === 0 || this.ch === 0) return;
        
        this.w = this.cw;
        this.h = this.ch;
        this.aspect = Math.min(this.cw / this.w, this.ch / this.h);
        //vars.scale = Math.sqrt(this.w * this.w + this.h * this.h) / 9;
        //console.log('scale = ' + vars.scale);
        
        this.renderer.setSize(this.cw * 2, this.ch * 2);
        
        this.wh = this.ch / this.aspect / Math.tan(10 * Math.PI / 180);
        if (this.camera) this.scene.remove(this.camera);
        this.camera = new THREE.PerspectiveCamera(20, this.cw / this.ch, 1, this.wh * 1.3);
        this.camera.position.z = this.wh;
        
        var mw = Math.max(this.w, this.h);
        if (this.light) this.scene.remove(this.light);
        this.light = new THREE.SpotLight(vars.spot_light_color, 2.0);
        this.light.position.set(-mw / 2, mw / 2, mw * 2);
        this.light.target.position.set(0, 0, 0);
        this.light.distance = mw * 5;
        this.light.castShadow = true;
        this.light.shadowCameraNear = mw / 10;
        this.light.shadowCameraFar = mw * 5;
        this.light.shadowCameraFov = 50;
        this.light.shadowBias = 0.001;
        this.light.shadowDarkness = 0.9;
        this.light.shadowMapWidth = 1024;
        this.light.shadowMapHeight = 1024;
        this.scene.add(this.light);
        
        // (Re)build barriers now that w/h are known/updated. These used to live
        // in the constructor keyed off this.w/this.h before those existed.
        var box = this;
        if (this.barriers && this.barriers.length) {
            this.barriers.forEach(function(b) { box.world.remove(b); });
        }
        this.barriers = [];
        var barrier_defs = [
            { axis: new CANNON.Vec3(1, 0, 0), angle: Math.PI / 2, pos: [0, this.h * 0.93, 0] },
            { axis: new CANNON.Vec3(1, 0, 0), angle: -Math.PI / 2, pos: [0, -this.h * 0.93, 0] },
            { axis: new CANNON.Vec3(0, 1, 0), angle: -Math.PI / 2, pos: [this.w * 0.93, 0, 0] },
            { axis: new CANNON.Vec3(0, 1, 0), angle: Math.PI / 2, pos: [-this.w * 0.93, 0, 0] }
        ];
        barrier_defs.forEach(function(def) {
            var barrier = new CANNON.RigidBody(0, new CANNON.Plane(), box.barrier_body_material);
            barrier.quaternion.setFromAxisAngle(def.axis, def.angle);
            barrier.position.set(def.pos[0], def.pos[1], def.pos[2]);
            box.world.add(barrier);
            box.barriers.push(barrier);
        });
        
        if (this.desk) this.scene.remove(this.desk);
        /*
        new THREE.TextureLoader().load('./public/assets/baseballfield.jpeg', function(deskTexture) {
            
            deskTexture.needsUpdate = true;
            
            // IMPORTANT for r73 stability
            
            deskTexture.generateMipmaps = false;
            
            deskTexture.minFilter = THREE.LinearFilter;
            
            deskTexture.magFilter = THREE.LinearFilter
            
            
            
            
            box.desk = new THREE.Mesh(
                new THREE.PlaneGeometry(box.w * 2, box.h * 2, 1, 1),
                new THREE.MeshPhongMaterial({
                    map: deskTexture,
                    side: THREE.DoubleSide,
                    shininess: 20
                })
            );
            box.desk.receiveShadow = vars.use_shadows;
            box.scene.add(box.desk);
            if (box.camera) box.renderer.render(box.scene, box.camera);
        });
        */
        if (this.camera) this.renderer.render(this.scene, this.camera);
    }
    
    // @param diceToRoll (string), ex: "1d100+1d10+1d4+1d6+1d8+1d12+1d20"
    that.dice_box.prototype.setDice = function(diceToRoll) {
        this.diceToRoll = diceToRoll;
    }
    
    // @param palettes - array indexed by notation position (the same index hold() uses).
    // Each entry is { dice, label, stripe, outline } or a uniform object { jersey, text, stripe, outline };
    // null/undefined entries use the shared defaults from DICE.set_color().
    // @example box.setDice("1d100+1d10+1d12");
    //          box.setPalettes([homeUni, homeUni, awayUni]);
    that.dice_box.prototype.setPalettes = function(palettes) {
        this.palettes = palettes ? palettes.slice() : [];
    }
    
    // set the palette for a single notation position
    that.dice_box.prototype.setPalette = function(index, palette) {
        this.palettes[index] = palette;
    }
    
    
    //call this to roll dice programatically or from click
    that.dice_box.prototype.start_throw = function(before_roll, after_roll) {
        var box = this;
        if (box.rolling) return;
        if (!box.camera) return; // container still hidden/unsized; nothing to render into yet
        
        var vector = { x: (rnd() * 2 - 1) * box.w, y: -(rnd() * 2 - 1) * box.h };
        var dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        var boost = (rnd() + 3) * dist;
        throw_dices(box, vector, boost, dist, before_roll, after_roll);
    }
    
    //call this to roll dice from swipe (will throw dice in direction swiped)
    that.dice_box.prototype.bind_swipe = function(container, before_roll, after_roll) {
        let box = this;
        $t.bind(container, ['mousedown', 'touchstart'], function(ev) {
            ev.preventDefault();
            box.mouse_time = (new Date()).getTime();
            box.mouse_start = $t.get_mouse_coords(ev);
        });
        $t.bind(container, ['mouseup', 'touchend'], function(ev) {
            if (box.rolling) return;
            if (box.mouse_start == undefined) return;
            var m = $t.get_mouse_coords(ev);
            var vector = { x: m.x - box.mouse_start.x, y: -(m.y - box.mouse_start.y) };
            box.mouse_start = undefined;
            var dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
            if (dist < Math.sqrt(box.w * box.h * 0.01)) return;
            var time_int = (new Date()).getTime() - box.mouse_time;
            if (time_int > 2000) time_int = 2000;
            var boost = Math.sqrt((2500 - time_int) / 2500) * dist * 2;
            throw_dices(box, vector, boost, dist, before_roll, after_roll);
        });
    }
    
    function throw_dices(box, vector, boost, dist, before_roll, after_roll) {
        var notation = that.parse_notation(box.diceToRoll);
        if (notation.set.length == 0) return;
        
        // Computed once, outside the retry loop below, so before_roll (which
        // may have side effects like consuming a resource, or picking forced
        // values) never runs more than once per user-initiated throw, even if
        // an attempt has to be silently retried.
        var request_results = before_roll ? before_roll(notation) : null;
        
        attempt(vector, boost, dist, 0);
        
        //@param request_results (optional) - pass in an array of desired roll results
        //todo: when this param is used, animation isn't as smooth (uat not used?)
        function attempt(vector, boost, dist, retry_count) {
            var uat = vars.use_adapvite_timestep;
            vector.x /= dist;
            vector.y /= dist;
            //TODO: how do large numbers of vectors affect performance?
            var vectors = box.generate_vectors(notation, vector, boost);
            
            // Tag each vector with its position in the full notation so palettes follow the right die
            var rollIndices = [];
            for (var ri = 0; ri < notation.set.length; ri++) {
                //if (!heldValues.hasOwnProperty(ri))
                rollIndices.push(ri);
            }
            vectors.forEach(function(v, k) { v.notation_index = rollIndices[k]; });
            
            box.rolling = true;
            box._start_watchdog();
            
            box.clear();
            box.roll(vectors, request_results || notation.result, function(result) {
                if (result === null) {
                    // __animate detected the physics went numerically unstable
                    // (NaN) mid-throw — see dice_state_corrupted. Retry with a
                    // fresh random throw rather than replaying the failed one,
                    // since replaying identical inputs risks reproducing the
                    // exact same instability. Bounded so a persistently-broken
                    // notation can't retry forever.
                    box.rolling = false;
                    box._clear_watchdog();
                    vars.use_adapvite_timestep = uat;
                    if (retry_count < 2) {
                        console.warn('[dice] retrying roll after physics corruption (attempt', retry_count + 2, 'of 3)');
                        var v2 = { x: (rnd() * 2 - 1) * box.w, y: -(rnd() * 2 - 1) * box.h };
                        var d2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
                        var b2 = (rnd() + 3) * d2;
                        attempt(v2, b2, d2, retry_count + 1);
                    }
                    else {
                        console.error('[dice] roll kept failing after 3 attempts — giving up and hard-resetting.');
                        box.hard_reset();
                        if (typeof box.on_stuck === 'function') box.on_stuck();
                    }
                    return;
                }
                
                notation.result = result;
                finalize_notation(notation);
                
                // Stash so reroll() can find this die set again later, and tuck
                // the settled dice into a row (top of the desk by default) so
                // the rest of the canvas is free for a result message / options
                // UI to be layered on top without covering the dice themselves.
                box.last_notation = notation;
                if (vars.lineup_enabled) box.line_up_dice();
                
                if (after_roll) after_roll(notation);
                
                box.rolling = false;
                box._clear_watchdog();
                vars.use_adapvite_timestep = uat;
            });
        }
    }
    
    //todo: the rest of these don't need to be public, but need to read the this properties
    that.dice_box.prototype.generate_vectors = function(notation, vector, boost) {
        var vectors = [];
        for (var i in notation.set) {
            var vec = make_random_vector(vector);
            var pos = {
                x: this.w * (vec.x > 0 ? -1 : 1) * 0.9,
                y: this.h * (vec.y > 0 ? -1 : 1) * 0.9,
                z: rnd() * 200 + 200
            };
            var projector = Math.abs(vec.x / vec.y);
            if (projector > 1.0) pos.y /= projector;
            else pos.x *= projector;
            var velvec = make_random_vector(vector);
            var velocity = { x: velvec.x * boost, y: velvec.y * boost, z: -10 };
            var inertia = CONSTS.dice_inertia[notation.set[i]];
            var angle = {
                x: -(rnd() * vec.y * 5 + inertia * vec.y),
                y: rnd() * vec.x * 5 + inertia * vec.x,
                z: 0
            };
            var axis = { x: rnd(), y: rnd(), z: rnd(), a: rnd() };
            vectors.push({ set: notation.set[i], pos: pos, velocity: velocity, angle: angle, axis: axis });
        }
        return vectors;
    }
    
    // @param notation_index (optional) stable position of this die within the
    // overall notation (e.g. for "2d6", the first die is 0, the second is 1).
    // Used by reroll() to know which die is which independent of array order,
    // and by search_dice_by_mouse/set_dice_selected so a UI can let the player
    // tap dice to pick which ones to reroll.
    that.dice_box.prototype.create_dice = function(type, pos, velocity, angle, axis, notation_index) {
        var palette = resolve_palette(this.palettes[notation_index]);
        //TODO COME BACK HERE 
        var dice = threeD_dice['create_' + type](palette);
        dice.castShadow = true;
        dice.dice_type = type;
        dice.palette = palette;
        dice.notation_index = notation_index;
        dice.userData = { notation_index: notation_index, dice_type: type };
        dice.body = new CANNON.RigidBody(CONSTS.dice_mass[type],
            dice.geometry.cannon_shape, this.dice_body_material);
        dice.body.position.set(pos.x, pos.y, pos.z);
        dice.body.quaternion.setFromAxisAngle(new CANNON.Vec3(axis.x, axis.y, axis.z), axis.a * Math.PI * 2);
        dice.body.angularVelocity.set(angle.x, angle.y, angle.z);
        dice.body.velocity.set(velocity.x, velocity.y, velocity.z);
        dice.body.linearDamping = 0.1;
        dice.body.angularDamping = 0.1;
        this.scene.add(dice);
        this.dices.push(dice);
        this.world.add(dice.body);
    }
    
    that.dice_box.prototype.check_if_throw_finished = function() {
        var res = true;
        var e = 6;
        if (this.iteration < 10 / vars.frame_rate) {
            for (var i = 0; i < this.dices.length; ++i) {
                var dice = this.dices[i];
                if (dice.dice_stopped === true) continue;
                var a = dice.body.angularVelocity,
                    v = dice.body.velocity;
                if (Math.abs(a.x) < e && Math.abs(a.y) < e && Math.abs(a.z) < e &&
                    Math.abs(v.x) < e && Math.abs(v.y) < e && Math.abs(v.z) < e) {
                    if (dice.dice_stopped) {
                        if (this.iteration - dice.dice_stopped > 3) {
                            dice.dice_stopped = true;
                            continue;
                        }
                    }
                    else dice.dice_stopped = this.iteration;
                    res = false;
                }
                else {
                    dice.dice_stopped = undefined;
                    res = false;
                }
            }
        }
        return res;
    }
    
    that.dice_box.prototype.emulate_throw = function() {
        while (!this.check_if_throw_finished()) {
            ++this.iteration;
            this.world.step(vars.frame_rate);
        }
        return get_dice_values(this.dices);
    }
    
    that.dice_box.prototype.__animate = function(threadid) {
        if (!this.camera) return; // guard: nothing valid to render into yet
        var time = (new Date()).getTime();
        var time_diff = (time - this.last_time) / 1000;
        if (time_diff > 3) time_diff = vars.frame_rate;
        ++this.iteration;
        if (vars.use_adapvite_timestep) {
            while (time_diff > vars.frame_rate * 1.1) {
                this.world.step(vars.frame_rate);
                time_diff -= vars.frame_rate;
            }
            this.world.step(time_diff);
        }
        else {
            this.world.step(vars.frame_rate);
        }
        
        // Cannon's solver can occasionally blow up numerically — extreme
        // launch velocities, many simultaneous contacts (more likely with
        // larger dice pools) — leaving a body's position/quaternion NaN. Left
        // undetected, a corrupted die never satisfies check_if_throw_finished's
        // per-frame velocity check (NaN comparisons are always false), so it
        // rides out that function's own ~10s force-finish safety cap; THEN
        // get_dice_value's face-angle search also silently fails (NaN angle
        // comparisons are also always false) and returns -1 — for every die
        // whose contacts touched the corrupted one, not just that one die.
        // Checking here, every frame, catches it within a frame or two instead
        // of 10 seconds later as a garbage -1 result. Signals failure to the
        // roll/reroll callback via a null result so they can retry with a
        // fresh throw (see throw_dices/reroll) rather than a real one ever
        // reaching the caller's after_roll/after_reroll.
        if (this.running == threadid && dice_state_corrupted(this.dices)) {
            this.running = false;
            console.error('[dice] physics went unstable (NaN) mid-roll — signaling failure for retry.');
            if (this.callback) this.callback.call(this, null);
            return;
        }
        
        for (var i in this.scene.children) {
            var interact = this.scene.children[i];
            if (interact.body != undefined) {
                interact.position.copy(interact.body.position);
                interact.quaternion.copy(interact.body.quaternion);
            }
        }
        this.renderer.render(this.scene, this.camera);
        this.last_time = this.last_time ? time : (new Date()).getTime();
        if (this.running == threadid && this.check_if_throw_finished()) {
            this.running = false;
            // get_dice_values / the user callback are the riskiest code on this
            // path (see the closest_face guard in get_dice_value for one known
            // failure mode). If anything in here throws, `rolling` would
            // otherwise stay stuck true forever with no further recovery —
            // every future click silently no-ops at the `if (box.rolling) return`
            // guard. Catch and hard-reset instead of letting that happen.
            try {
                if (this.callback) this.callback.call(this, get_dice_values(this.dices));
            }
            catch (err) {
                console.error('[dice] error finishing roll, recovering:', err);
                this.rolling = false;
                this.hard_reset();
                return;
            }
        }
        if (this.running == threadid) {
            (function(t, tid, uat) {
                if (!uat && time_diff < vars.frame_rate) {
                    setTimeout(function() { requestAnimationFrame(function() { t.__animate(tid); }); },
                        (vars.frame_rate - time_diff) * 1000);
                }
                else requestAnimationFrame(function() { t.__animate(tid); });
            })(this, threadid, vars.use_adapvite_timestep);
        }
    }
    
    // @brief slides the currently settled dice into row(s) so the rest of the
    // desk is free for a message/options UI to sit on top of the canvas, and
    // also spins each die around its up-face's own normal so that face's
    // label reads upright to the camera (see compute_upright_correction).
    // Never changes WHICH face is up — only x/y/z position and the in-plane
    // spin around the up-face normal — so the roll result never changes, only
    // its legibility. (Skipped for d4, whose result-reading convention
    // doesn't fit this model — see compute_upright_correction.)
    // Runs its own short rAF loop independent of the physics world (which has
    // already stopped by the time a roll finishes), so it won't fight gravity.
    // Wraps into additional rows once a single row can't fit every die at
    // least vars.lineup_min_spacing_scale * vars.scale apart — that's the knob
    // to adjust if dice with high counts are packed too close together.
    // @param opts (optional) { y_fraction, duration_ms } to override vars.lineup_*
    // for a single call, e.g. box.line_up_dice({ y_fraction: -0.72 }) to line up
    // along the bottom edge instead of the top.
    that.dice_box.prototype.line_up_dice = function(opts) {
        var box = this;
        var n = this.dices.length;
        if (!n || !this.camera) return;
        opts = opts || {};
        var y_fraction = opts.y_fraction != undefined ? opts.y_fraction : vars.lineup_y_fraction;
        var duration_ms = opts.duration_ms != undefined ? opts.duration_ms : vars.lineup_duration_ms;
        
        // this.w is the desk's HALF-width (barriers sit at ~0.93 * this.w on
        // either side of center — see reinit()'s barrier_defs), so the actual
        // usable span across the whole desk is close to 2 * this.w, not this.w.
        // 1.8 mirrors that (with a little margin short of the barriers).
        var available_w = this.w * 1.8;
        var min_spacing = vars.scale * vars.lineup_min_spacing_scale;
        var max_spacing = vars.scale * vars.lineup_max_spacing_scale;
        
        // How many dice fit in one row before they'd be packed closer than
        // min_spacing? At least 1, so a lone huge die never divides-by-zero.
        var per_row = Math.max(1, Math.floor(available_w / min_spacing) + 1);
        var rows = Math.ceil(n / per_row);
        // Spread dice as evenly as possible across however many rows that took,
        // rather than stuffing every row but the last completely full.
        per_row = Math.ceil(n / rows);
        
        var row_spacing = vars.scale * vars.lineup_row_spacing_scale;
        var restZ = vars.scale * 0.6; //small hover above the desk plane
        var starts = this.dices.map(function(d) { return d.position.clone(); });
        var targets = [];
        for (var i = 0; i < n; ++i) {
            var row = Math.floor(i / per_row);
            var col = i % per_row;
            var items_in_row = Math.min(per_row, n - row * per_row);
            var spacing = Math.min(available_w / Math.max(items_in_row, 1), max_spacing);
            var rowWidth = spacing * (items_in_row - 1);
            var x = -rowWidth / 2 + col * spacing;
            // Center the whole block of rows on y_fraction rather than always
            // starting the first row there, so it doesn't creep further off
            // the desk as more rows get added.
            var y = this.h * y_fraction - (row - (rows - 1) / 2) * row_spacing;
            targets.push(new THREE.Vector3(x, y, restZ));
        }
        
        // Capture each die's current spin and compute where it should end up
        // (upright label toward camera) up front, WITHOUT mutating anything
        // yet — the tween below slerps from one to the other each frame, same
        // as it lerps position. compute_upright_correction returns null for
        // d4 or anything it can't sanely correct, in which case the die's
        // rotation is simply left alone (quat_targets[i] === quat_starts[i]).
        var quat_starts = this.dices.map(function(d) { return d.quaternion.clone(); });
        var quat_targets = this.dices.map(function(d, i) {
            if (!vars.upright_labels_enabled) return quat_starts[i].clone();
            var correction = compute_upright_correction(d);
            return correction ? correction.multiply(quat_starts[i].clone()) : quat_starts[i].clone();
        });
        
        // Stop the dice reacting to the physics world while they glide into place.
        this.dices.forEach(function(d) {
            if (d.body) {
                d.body.velocity.set(0, 0, 0);
                d.body.angularVelocity.set(0, 0, 0);
            }
        });
        
        var lineup_id = (this._lineup_id = (this._lineup_id || 0) + 1);
        var startTime = null;
        
        function ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; } //easeInOutQuad
        
        function step(ts) {
            if (box._lineup_id !== lineup_id) return; // a newer roll/line-up superseded this one
            if (!startTime) startTime = ts;
            var t = Math.min(1, (ts - startTime) / duration_ms);
            var e = ease(t);
            for (var i = 0; i < box.dices.length; ++i) {
                var dice = box.dices[i];
                dice.position.lerpVectors(starts[i], targets[i], e);
                // slerpQuaternions(qa, qb, t) is a newer three.js API (~r109+);
                // this build is old enough that only the two-arg instance form
                // (copy qa, then slerp toward qb by t) is available.
                dice.quaternion.copy(quat_starts[i]).slerp(quat_targets[i], e);
                // NOTE: intentionally NOT using dice.body.position.copy(dice.position) here.
                // THREE.Vector3.copy(v) sets `this` to `v`'s values, but CANNON.Vec3.copy(target)
                // does the opposite — it writes `this`'s values INTO `target` and returns it.
                if (dice.body) {
                    dice.body.position.set(dice.position.x, dice.position.y, dice.position.z);
                    dice.body.quaternion.set(dice.quaternion.x, dice.quaternion.y, dice.quaternion.z, dice.quaternion.w);
                }
            }
            if (box.camera) box.renderer.render(box.scene, box.camera);
            if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }
    
    
    that.dice_box.prototype.clear = function() {
        this.running = false;
        this._lineup_id = (this._lineup_id || 0) + 1; // cancel any in-flight line-up animation
        var dice;
        while (dice = this.dices.pop()) {
            this.scene.remove(dice);
            release_dice(dice)
            if (dice.body) this.world.remove(dice.body);
        }
        if (this.pane) this.scene.remove(this.pane);
        if (this.camera) this.renderer.render(this.scene, this.camera);
        var box = this;
        setTimeout(function() { if (box.camera) box.renderer.render(box.scene, box.camera); }, 100);
    }
    
    that.dice_box.prototype.prepare_dices_for_roll = function(vectors) {
        this.clear();
        this.iteration = 0;
        for (var i in vectors) {
            // vectors is built by generate_vectors() by iterating notation.set in
            // order, so its index i IS that die's notation_index for a full roll.
            this.create_dice(vectors[i].set, vectors[i].pos, vectors[i].velocity,
                vectors[i].angle, vectors[i].axis, Number(i));
        }
    }
    
    // @brief remove specific dice (identified by notation_index) from the scene
    // and physics world, leaving every other die exactly where it is. Used by
    // reroll() to clear out just the dice being re-thrown.
    that.dice_box.prototype.remove_dice_by_index = function(notation_indices) {
        var box = this;
        var kept = [];
        this.dices.forEach(function(d) {
            if (notation_indices.indexOf(d.notation_index) !== -1) {
                box.scene.remove(d);
                release_dice(dice)
                if (d.body) box.world.remove(d.body);
            }
            else kept.push(d);
        });
        this.dices = kept;
    }
    
    // @brief zero out velocity and detach every current die's body from the
    // physics world (without touching its mesh/position or removing it from
    // the scene). Call this before stepping the world for a reroll so the dice
    // that are staying put don't also react to gravity/collisions during that
    // step — world.step() only simulates bodies still added to the world.
    that.dice_box.prototype.freeze_dice = function() {
        var box = this;
        this.dices.forEach(function(d) {
            if (d.body) {
                d.body.velocity.set(0, 0, 0);
                d.body.angularVelocity.set(0, 0, 0);
                box.world.remove(d.body);
            }
        });
    }
    
    // @brief mark/unmark a die as selected (e.g. for reroll picking) by giving
    // it a thin glowing outline that moves and rotates with it automatically
    // (added as a child object). Purely visual — has no effect on physics or
    // results.
    that.dice_box.prototype.set_dice_selected = function(dice, selected) {
        if (!dice) return;
        if (selected && !dice._selection_outline) {
            var outline = new THREE.Mesh(dice.geometry,
                new THREE.MeshBasicMaterial({ color: 0xffd000, side: THREE.BackSide }));
            outline.scale.multiplyScalar(1.2);
            dice.add(outline);
            dice._selection_outline = outline;
        }
        else if (!selected && dice._selection_outline) {
            dice.remove(dice._selection_outline);
            dice._selection_outline = undefined;
        }
        dice.selected = !!selected;
        if (this.camera) this.renderer.render(this.scene, this.camera);
    }
    
    // @brief nudge a single settled die's shown value by `delta` (e.g. +1/-1
    // for a "mod token" spend), updating the on-screen die AND last_notation
    // together so the canvas stays the single source of truth — no separate
    // reroll/relabel is needed and no other die is touched.
    //
    // Reuses shift_dice_faces (the same cyclic materialIndex-relabel trick
    // used to force reroll results): since it just changes which numeral the
    // ALREADY-up face shows, the die doesn't move or re-animate at all — a
    // mod token spend is instant, not another physics throw.
    //
    // @param notation_index which die (same stable index reroll() uses)
    // @param delta how much to add, e.g. +1 or -1
    // @param after_mod (optional) fn(notation) called after last_notation and
    //        the on-screen die are both updated
    // @returns the die's new value, or null if notation_index wasn't found,
    //          a roll/reroll is currently in flight, or delta was falsy
    that.dice_box.prototype.apply_mod = function(notation_index, delta, after_mod) {
        if (this.rolling || !delta) return null;
        var dice = this.dices.filter(function(d) { return d.notation_index === notation_index; })[0];
        if (!dice) return null;
        
        var range = CONSTS.dice_face_range[dice.dice_type];
        var current = get_dice_value(dice);
        var target = current + delta;
        // Clamp rather than wrap by default — most mod-token mechanics don't
        // let a d6 push past 6 back around to 1. For wrap-instead behavior,
        // replace this clamp with a modulo into [range[0], range[1]].
        target = Math.max(range[0], Math.min(range[1], target));
        if (target === current) return current; // already at the limit; nothing to change
        
        var raw_current = current,
            raw_target = target;
        // shift_dice_faces expects the raw 0-9 "tens digit" for d100, not the
        // x10 display value get_dice_value returns (e.g. 40, not 4) — convert
        // so d100 mods land on the right face. d10's "10 displays as 0" quirk
        // is already handled inside shift_dice_faces itself.
        if (dice.dice_type === 'd100') {
            raw_current = current / 10;
            raw_target = target / 10;
        }
        shift_dice_faces(dice, raw_target, raw_current);
        
        if (this.last_notation) {
            this.last_notation.result[notation_index] = target;
            finalize_notation(this.last_notation);
        }
        
        if (vars.mod_pulse_enabled) pulse_dice(this, dice);
        if (this.camera) this.renderer.render(this.scene, this.camera);
        if (after_mod) after_mod(this.last_notation);
        return target;
    }
    
    // @brief re-roll a subset of the dice from the most recently completed
    // roll, identified by notation_index (0-based position within the original
    // notation string, e.g. "3d6" -> indices 0, 1, 2). Dice NOT included are
    // left exactly where they are on the desk; only the selected ones are
    // thrown again, and once everything has settled the FULL set (kept +
    // rerolled) is lined up together again.
    // @param notation_indices array of indices to reroll
    // @param before_reroll (optional) fn(types) -> optionally return an array
    //        of forced result values for the rerolled dice, same convention as
    //        start_throw's before_roll
    // @param after_reroll (optional) fn(notation) called once settled & lined
    //        up; notation is the same object returned by earlier rolls, with
    //        result/resultTotal/resultString updated in place
    that.dice_box.prototype.reroll = function(notation_indices, before_reroll, after_reroll) {
        var box = this;
        if (box.rolling || !box.last_notation || !box.camera) return;
        notation_indices = Array.from(new Set(notation_indices)).filter(function(i) {
            return box.last_notation.set[i] !== undefined;
        });
        if (!notation_indices.length) return;
        
        var reroll_set = notation_indices.map(function(i) { return box.last_notation.set[i]; });
        // Computed once, outside the retry loop below, so before_reroll never
        // runs more than once per user-initiated reroll even if an attempt
        // has to be silently retried.
        var request_results = before_reroll ? before_reroll(reroll_set.slice()) : null;
        
        attempt(0);
        
        function attempt(retry_count) {
            box.rolling = true;
            box._start_watchdog();
            var uat = vars.use_adapvite_timestep;
            
            // Freeze everyone first (so the physics step below only ever
            // affects the dice we're about to spawn), then pull just the
            // selected ones out. On a retry this also cleans up the previous
            // (failed) attempt's dice, since they carry the same notation_index.
            box.freeze_dice();
            box.remove_dice_by_index(notation_indices);
            
            var vector = { x: (rnd() * 2 - 1) * box.w, y: -(rnd() * 2 - 1) * box.h };
            var dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
            var boost = (rnd() + 3) * dist;
            vector.x /= dist;
            vector.y /= dist;
            var vectors = box.generate_vectors({ set: reroll_set }, vector, boost);
            
            function spawn() {
                for (var k = 0; k < vectors.length; ++k) {
                    box.create_dice(vectors[k].set, vectors[k].pos, vectors[k].velocity,
                        vectors[k].angle, vectors[k].axis, notation_indices[k]);
                }
            }
            
            box.iteration = 0;
            spawn();
            
            if (request_results && request_results.length) {
                // Same trick roll() uses for forced results: fast-forward physics
                // to see how the dice would naturally land, throw that away,
                // respawn at the original thrown state, then relabel faces so
                // the *visible* animated roll lands on the requested values.
                vars.use_adapvite_timestep = false;
                var res = box.emulate_throw();
                box.remove_dice_by_index(notation_indices);
                spawn();
                var new_dice = box.dices.slice(box.dices.length - vectors.length);
                var natural = res.slice(res.length - vectors.length);
                for (var k = 0; k < new_dice.length; ++k) {
                    shift_dice_faces(new_dice[k], request_results[k], natural[k]);
                }
            }
            
            box.callback = function(result) {
                if (result === null) {
                    // __animate detected physics corruption (NaN) mid-reroll —
                    // same failure mode as a full roll, see dice_state_corrupted.
                    // Retry with a fresh random throw rather than replaying the
                    // failed one.
                    box.rolling = false;
                    box._clear_watchdog();
                    vars.use_adapvite_timestep = uat;
                    if (retry_count < 2) {
                        console.warn('[dice] retrying reroll after physics corruption (attempt', retry_count + 2, 'of 3)');
                        attempt(retry_count + 1);
                    }
                    else {
                        console.error('[dice] reroll kept failing after 3 attempts — giving up and hard-resetting.');
                        box.hard_reset();
                        if (typeof box.on_stuck === 'function') box.on_stuck();
                    }
                    return;
                }
                
                box.dices.sort(function(a, b) { return a.notation_index - b.notation_index; });
                box.last_notation.result = get_dice_values(box.dices);
                finalize_notation(box.last_notation);
                
                box.line_up_dice();
                if (after_reroll) after_reroll(box.last_notation);
                box.rolling = false;
                box._clear_watchdog();
                vars.use_adapvite_timestep = uat;
            };
            box.running = (new Date()).getTime();
            box.last_time = 0;
            box.__animate(box.running);
        }
    }
    
    that.dice_box.prototype.roll = function(vectors, values, callback) {
        this.prepare_dices_for_roll(vectors);
        if (values != undefined && values.length) {
            vars.use_adapvite_timestep = false;
            var res = this.emulate_throw();
            this.prepare_dices_for_roll(vectors);
            for (var i in res)
                shift_dice_faces(this.dices[i], values[i], res[i]);
        }
        this.callback = callback;
        this.running = (new Date()).getTime();
        this.last_time = 0;
        this.__animate(this.running);
    }
    
    that.dice_box.prototype.search_dice_by_mouse = function(ev, rect) {
        var m = $t.get_mouse_coords(ev);
        var intersects = (new THREE.Raycaster(this.camera.position,
            (new THREE.Vector3((m.x - this.cw - rect.x) / this.aspect,
                1 - (m.y - this.ch - rect.y) / this.aspect, this.w / 9))
            .sub(this.camera.position).normalize())).intersectObjects(this.dices);
        // Returns the actual die mesh (not just userData) so a UI layer can
        // pass it straight into set_dice_selected()/reroll(). dice.notation_index
        // and dice.dice_type are also readable directly off the returned object.
        
        if (intersects.length) return intersects[0].object;
    }
    
    // @brief stop observing container resizes and release the observer. Call
    // this if you ever destroy/remove a dice_box instance to avoid leaks.
    that.dice_box.prototype.destroy = function() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = undefined;
        }
    }
    
    
    // PUBLIC FUNCTIONS
    
    //validates dice notation input
    //notation should be in format "1d4+2d6"
    that.parse_notation = function(notation) {
        var no = notation.split('@');
        var dr0 = /\s*(\d*)([a-z]+)(\d+)(\s*(\+|\-)\s*(\d+)){0,1}\s*(\+|$)/gi;
        var dr1 = /(\b)*(\d+)(\b)*/gi;
        var ret = {
            set: [], //set of dice to roll
            constant: 0, //modifier to add to result
            result: [], //array of results of each die
            resultTotal: 0, //dice results + constant
            resultString: '', //printable result
            error: false //input errors are ignored gracefully
        };
        var res;
        //looks at each peice of the notation and adds dice and constants to results
        while (res = dr0.exec(no[0])) {
            var command = res[2];
            if (command != 'd') { ret.error = true; continue; }
            var count = parseInt(res[1]);
            if (res[1] == '') count = 1;
            var type = 'd' + res[3];
            if (CONSTS.known_types.indexOf(type) == -1) { ret.error = true; continue; }
            while (count--) ret.set.push(type);
            if (res[5] && res[6]) {
                if (res[5] == '+') ret.constant += parseInt(res[6]);
                else ret.constant -= parseInt(res[6]);
            }
        }
        while (res = dr1.exec(no[1])) {
            ret.result.push(parseInt(res[2]));
        }
        return ret;
    }
    
    that.stringify_notation = function(nn) {
        var dict = {},
            notation = '';
        for (var i in nn.set)
            if (!dict[nn.set[i]]) dict[nn.set[i]] = 1;
            else ++dict[nn.set[i]];
        for (var i in dict) {
            if (notation.length) notation += ' + ';
            notation += (dict[i] > 1 ? dict[i] : '') + i;
        }
        if (nn.constant) {
            if (nn.constant > 0) notation += ' + ' + nn.constant;
            else notation += ' - ' + Math.abs(nn.constant);
        }
        return notation;
    }
    
    that.set_color = function(type, hex) {
        if (type === 'dice') vars.dice_color = hex;
        else if (type === 'label') vars.label_color = hex;
        else if (type === 'stripe') vars.stripe_color = hex;
        else if (type === 'outline') vars.outline_color = hex;
        // force regeneration on next roll
        clear_material_cache();
        
    }
    
    
    // PRIVATE FUNCTIONS
    
    // dice geometries
    let threeD_dice = {};
    
    function resolve_palette(p) {
        if (!p) return { dice: vars.dice_color, label: vars.label_color, stripe: vars.stripe_color, outline: vars.outline_color };
        var dice = p.dice || p.jersey || vars.dice_color;
        return {
            dice: dice,
            label: p.label || p.text || vars.label_color,
            stripe: p.stripe || dice,
            outline: p.outline || dice
        };
    }
    
    var geom_cache = {},
        material_cache = {};
    
    function palette_key(p) { return [p.dice, p.label, p.stripe, p.outline].join('|'); }
    
    function cached_geometry(name, build) {
        return geom_cache[name] || (geom_cache[name] = build());
    }
    
    function cached_materials(key, build) {
        return material_cache[key] || (material_cache[key] = new THREE.MeshFaceMaterial(build()));
    }
    
    function clear_material_cache() {
        for (var k in material_cache) {
            (material_cache[k].materials || []).forEach(function(m) {
                if (m.map) m.map.dispose();
                m.dispose();
            });
        }
        material_cache = {};
    }
    
    function release_dice(d) {
        if (d.geometry && d.geometry._owned) d.geometry.dispose(); // per-die clones from shift_dice_faces
        if (d._selection_outline && d._selection_outline.material) d._selection_outline.material.dispose();
    }
    
    function make_standard(type, geom_name, geom_fn, labels, margin, p) {
        var geom = cached_geometry(geom_name, geom_fn);
        var mat = cached_materials(type + '|' + palette_key(p), function() {
            return create_dice_materials(labels, vars.scale / 2, margin, p);
        });
        return new THREE.Mesh(geom, mat);
    }
    
    threeD_dice.create_d4 = function(p) {
        var geom = cached_geometry('d4', function() { return create_d4_geometry(vars.scale * 1.2); });
        var mat = cached_materials('d4|0|' + palette_key(p), function() {
            return create_d4_materials(vars.scale / 2, vars.scale * 2, CONSTS.d4_labels[0], p);
        });
        return new THREE.Mesh(geom, mat);
    };
    var L20 = CONSTS.standart_d20_dice_face_labels;
    threeD_dice.create_d6 = function(p) { return make_standard('d6', 'd6', function() { return create_d6_geometry(vars.scale * 1.1); }, L20, 0.9, p); };
    threeD_dice.create_d8 = function(p) { return make_standard('d8', 'd8', function() { return create_d8_geometry(vars.scale); }, L20, 1.4, p); };
    threeD_dice.create_d9 = function(p) { return make_standard('d9', 'd10', function() { return create_d10_geometry(vars.scale * 0.9); }, L20, 1.0, p); };
    threeD_dice.create_d10 = function(p) { return make_standard('d10', 'd10', function() { return create_d10_geometry(vars.scale * 0.9); }, L20, 1.0, p); };
    threeD_dice.create_d12 = function(p) { return make_standard('d12', 'd12', function() { return create_d12_geometry(vars.scale * 0.9); }, L20, 1.0, p); };
    threeD_dice.create_d20 = function(p) { return make_standard('d20', 'd20', function() { return create_d20_geometry(vars.scale); }, L20, 1.2, p); };
    threeD_dice.create_d100 = function(p) { return make_standard('d100', 'd10', function() { return create_d10_geometry(vars.scale * 0.9); }, CONSTS.standart_d100_dice_face_labels, 1.5, p); };
    
    //pinstripes
    function draw_pinstripes(context, size, base_color, stripe_color) {
        context.fillStyle = base_color;
        context.fillRect(0, 0, size, size);
        context.save();
        context.strokeStyle = `${stripe_color}80`;
        context.lineWidth = size * 0.02;
        context.translate(size / 2, size / 2);
        //context.rotate(Math.PI / 4); // 45° pinstripes
        var diag = size * 1.5;
        for (var x = -diag; x < diag; x += size * 0.2) {
            context.beginPath();
            context.moveTo(x, -diag);
            context.lineTo(x, diag);
            context.stroke();
        }
        context.restore();
    }
    
    
    function create_dice_materials(face_labels, size, margin, p) {
        
        function create_text_texture(text, color, back_color) {
            if (text == undefined) return null;
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            // Bumped from *2 to *4, and now decoupled from vars.scale via
            // calc_label_resolution (see HELPERS section) so small dice scales
            // don't produce fuzzy low-res label textures.
            var ts = calc_label_resolution(size + size * 2 * margin, 4);
            canvas.width = canvas.height = ts;
            context.font = ts / (1 + 2 * margin) + "pt BaseballClubSolid";
            //context.fillStyle = back_color;
            //context.fillRect(0, 0, canvas.width, canvas.height);
            //draw_pinstripes(context, canvas.width, back_color, vars.stripe_color);
            draw_pinstripes(context, canvas.width, p.dice, p.stripe);
            context.textAlign = "center";
            context.textBaseline = "middle";
            //context.fillStyle = color;
            context.fillStyle = p.label;
            //context.strokeStyle = vars.outline_color;
            context.strokeStyle = p.outline;
            context.lineWidth = Math.max(8, ts / 34); // scales with the resolution above instead of a fixed value
            context.strokeText(text, canvas.width / 2, canvas.height / 2);
            context.fillText(text, canvas.width / 2, canvas.height / 2);
            if (text == '6' || text == '9') {
                context.fillText('  .', canvas.width / 2, canvas.height / 2);
            }
            var texture = new THREE.Texture(canvas);
            texture.anisotropy = that.renderer_max_anisotropy || 1;
            texture.needsUpdate = true;
            return texture;
        }
        var materials = [];
        for (var i = 0; i < face_labels.length; ++i)
            materials.push(new THREE.MeshPhongMaterial($t.copyto(vars.material_options, { map: create_text_texture(face_labels[i], vars.label_color, vars.dice_color) })));
        return materials;
    }
    
    function create_d4_materials(size, margin, labels, p) {
        function create_d4_text(text, color, back_color) {
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            // Bumped from *2 to *4, and decoupled from vars.scale via
            // calc_label_resolution — same fix as create_text_texture.
            var ts = calc_label_resolution(size + margin, 4);
            canvas.width = canvas.height = ts;
            context.font = (ts - margin) * 0.5 + "pt BaseballClubSolid";
            context.fillStyle = p.dice;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = p.label;
            for (var i in text) {
                context.fillText(text[i], canvas.width / 2,
                    canvas.height / 2 - ts * 0.3);
                context.translate(canvas.width / 2, canvas.height / 2);
                context.rotate(Math.PI * 2 / 3);
                context.translate(-canvas.width / 2, -canvas.height / 2);
            }
            var texture = new THREE.Texture(canvas);
            texture.anisotropy = that.renderer_max_anisotropy || 1;
            texture.needsUpdate = true;
            return texture;
        }
        var materials = [];
        for (var i = 0; i < labels.length; ++i)
            materials.push(new THREE.MeshPhongMaterial($t.copyto(vars.material_options, {
                map: create_d4_text(labels[i], vars.label_color, vars.dice_color)
                
            })));
        return materials;
    }
    
    function create_d4_geometry(radius) {
        var vertices = [
            [1, 1, 1],
            [-1, -1, 1],
            [-1, 1, -1],
            [1, -1, -1]
        ];
        var faces = [
            [1, 0, 2, 1],
            [0, 1, 3, 2],
            [0, 3, 2, 3],
            [1, 2, 3, 4]
        ];
        // Last arg is the chamfer factor: how far each edge/corner is cut into
        // its own small flat face before the geometry is built. 1 = pure sharp
        // cube/prism edges; lower = bigger bevel faces = more rounded-looking
        // edges. Tune per-shape to taste.
        return create_geom(vertices, faces, radius, -0.1, Math.PI * 7 / 6, 0.90);
    }
    
    function create_d6_geometry(radius) {
        var vertices = [
            [-1, -1, -1],
            [1, -1, -1],
            [1, 1, -1],
            [-1, 1, -1],
            [-1, -1, 1],
            [1, -1, 1],
            [1, 1, 1],
            [-1, 1, 1]
        ];
        var faces = [
            [0, 3, 2, 1, 1],
            [1, 2, 6, 5, 2],
            [0, 1, 5, 4, 3],
            [3, 7, 6, 2, 4],
            [0, 4, 7, 3, 5],
            [4, 5, 6, 7, 6]
        ];
        return create_geom(vertices, faces, radius, 0.1, Math.PI / 4, 0.88);
    }
    
    function create_d8_geometry(radius) {
        var vertices = [
            [1, 0, 0],
            [-1, 0, 0],
            [0, 1, 0],
            [0, -1, 0],
            [0, 0, 1],
            [0, 0, -1]
        ];
        var faces = [
            [0, 2, 4, 1],
            [0, 4, 3, 2],
            [0, 3, 5, 3],
            [0, 5, 2, 4],
            [1, 3, 4, 5],
            [1, 4, 2, 6],
            [1, 2, 5, 7],
            [1, 5, 3, 8]
        ];
        return create_geom(vertices, faces, radius, 0, -Math.PI / 4 / 2, 0.92);
    }
    
    function create_d10_geometry(radius) {
        var a = Math.PI * 2 / 10,
            k = Math.cos(a),
            h = 0.105,
            v = -1;
        var vertices = [];
        for (var i = 0, b = 0; i < 10; ++i, b += a)
            vertices.push([Math.cos(b), Math.sin(b), h * (i % 2 ? 1 : -1)]);
        vertices.push([0, 0, -1]);
        vertices.push([0, 0, 1]);
        var faces = [
            [5, 7, 11, 0],
            [4, 2, 10, 1],
            [1, 3, 11, 2],
            [0, 8, 10, 3],
            [7, 9, 11, 4],
            [8, 6, 10, 5],
            [9, 1, 11, 6],
            [2, 0, 10, 7],
            [3, 5, 11, 8],
            [6, 4, 10, 9],
            [1, 0, 2, v],
            [1, 2, 3, v],
            [3, 2, 4, v],
            [3, 4, 5, v],
            [5, 4, 6, v],
            [5, 6, 7, v],
            [7, 6, 8, v],
            [7, 8, 9, v],
            [9, 8, 0, v],
            [9, 0, 1, v]
        ];
        return create_geom(vertices, faces, radius, 0, Math.PI * 6 / 5, 0.90);
    }
    
    function create_d12_geometry(radius) {
        var p = (1 + Math.sqrt(5)) / 2,
            q = 1 / p;
        var vertices = [
            [0, q, p],
            [0, q, -p],
            [0, -q, p],
            [0, -q, -p],
            [p, 0, q],
            [p, 0, -q],
            [-p, 0, q],
            [-p, 0, -q],
            [q, p, 0],
            [q, -p, 0],
            [-q, p, 0],
            [-q, -p, 0],
            [1, 1, 1],
            [1, 1, -1],
            [1, -1, 1],
            [1, -1, -1],
            [-1, 1, 1],
            [-1, 1, -1],
            [-1, -1, 1],
            [-1, -1, -1]
        ];
        var faces = [
            [2, 14, 4, 12, 0, 1],
            [15, 9, 11, 19, 3, 2],
            [16, 10, 17, 7, 6, 3],
            [6, 7, 19, 11, 18, 4],
            [6, 18, 2, 0, 16, 5],
            [18, 11, 9, 14, 2, 6],
            [1, 17, 10, 8, 13, 7],
            [1, 13, 5, 15, 3, 8],
            [13, 8, 12, 4, 5, 9],
            [5, 4, 14, 9, 15, 10],
            [0, 12, 8, 10, 16, 11],
            [3, 19, 7, 17, 1, 12]
        ];
        return create_geom(vertices, faces, radius, 0.2, -Math.PI / 4 / 2, 0.93);
    }
    
    function create_d20_geometry(radius) {
        var t = (1 + Math.sqrt(5)) / 2;
        var vertices = [
            [-1, t, 0],
            [1, t, 0],
            [-1, -t, 0],
            [1, -t, 0],
            [0, -1, t],
            [0, 1, t],
            [0, -1, -t],
            [0, 1, -t],
            [t, 0, -1],
            [t, 0, 1],
            [-t, 0, -1],
            [-t, 0, 1]
        ];
        var faces = [
            [0, 11, 5, 1],
            [0, 5, 1, 2],
            [0, 1, 7, 3],
            [0, 7, 10, 4],
            [0, 10, 11, 5],
            [1, 5, 9, 6],
            [5, 11, 4, 7],
            [11, 10, 2, 8],
            [10, 7, 6, 9],
            [7, 1, 8, 10],
            [3, 9, 4, 11],
            [3, 4, 2, 12],
            [3, 2, 6, 13],
            [3, 6, 8, 14],
            [3, 8, 9, 15],
            [4, 9, 5, 16],
            [2, 4, 11, 17],
            [6, 2, 10, 18],
            [8, 6, 7, 19],
            [9, 8, 1, 20]
        ];
        return create_geom(vertices, faces, radius, -0.2, -Math.PI / 4 / 2, 0.92);
    }
    
    // HELPERS
    
    // @brief true if any die's physics body has gone numerically unstable
    // (NaN position or quaternion). See the usage site in __animate for why
    // this matters and what it looks like left undetected.
    function dice_state_corrupted(dices) {
        for (var i = 0; i < dices.length; ++i) {
            var body = dices[i].body;
            if (!body) continue;
            var p = body.position,
                q = body.quaternion;
            if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.z) ||
                !isFinite(q.x) || !isFinite(q.y) || !isFinite(q.z) || !isFinite(q.w)) {
                return true;
            }
        }
        return false;
    }
    
    // Builds resultTotal/resultString from notation.result + notation.constant.
    // Shared by both a full roll's finish callback and reroll()'s, so the two
    // never drift out of sync with each other.
    function finalize_notation(notation) {
        var res = notation.result.join(' ');
        if (notation.constant) {
            if (notation.constant > 0) res += ' +' + notation.constant;
            else res += ' -' + Math.abs(notation.constant);
        }
        notation.resultTotal = notation.result.reduce(function(s, a) { return s + a; }, 0) + notation.constant;
        if (notation.result.length > 1 || notation.constant) {
            res += ' = ' + notation.resultTotal;
        }
        notation.resultString = res;
    }
    
    // @brief brief scale up-then-back-down pulse on a single die, purely to
    // give a mod-token spend some visual weight instead of an instant
    // jump-cut. Runs its own short rAF loop (independent of any line_up_dice
    // tween that might also be touching this die) and always ends by
    // explicitly resetting scale to 1, so it can't leave a die stuck enlarged
    // even if interrupted.
    function pulse_dice(box, dice, duration_ms) {
        duration_ms = duration_ms || 220;
        var startTime = null;
        
        function step(ts) {
            if (!startTime) startTime = ts;
            var t = Math.min(1, (ts - startTime) / duration_ms);
            var s = 1 + 0.15 * Math.sin(t * Math.PI); // up then back down to 1
            // setScalar is a newer three.js convenience method; this build only
            // has the three-arg .set(x, y, z) form, same story as the quaternion
            // slerp fix earlier.
            dice.scale.set(s, s, s);
            if (box.camera) box.renderer.render(box.scene, box.camera);
            if (t < 1) requestAnimationFrame(step);
            else dice.scale.set(1, 1, 1);
        }
        requestAnimationFrame(step);
    }
    
    function rnd() {
        return Math.random();
    }
    
    
    function create_shape(vertices, faces, radius) {
        var cv = new Array(vertices.length),
            cf = new Array(faces.length);
        for (var i = 0; i < vertices.length; ++i) {
            var v = vertices[i];
            cv[i] = new CANNON.Vec3(v.x * radius, v.y * radius, v.z * radius);
        }
        for (var i = 0; i < faces.length; ++i) {
            cf[i] = faces[i].slice(0, faces[i].length - 1);
        }
        return new CANNON.ConvexPolyhedron(cv, cf);
    }
    
    function make_geom(vertices, faces, radius, tab, af) {
        var geom = new THREE.Geometry();
        for (var i = 0; i < vertices.length; ++i) {
            var vertex = vertices[i].multiplyScalar(radius);
            vertex.index = geom.vertices.push(vertex) - 1;
        }
        for (var i = 0; i < faces.length; ++i) {
            var ii = faces[i],
                fl = ii.length - 1;
            var aa = Math.PI * 2 / fl;
            for (var j = 0; j < fl - 2; ++j) {
                geom.faces.push(new THREE.Face3(ii[0], ii[j + 1], ii[j + 2], [geom.vertices[ii[0]],
                    geom.vertices[ii[j + 1]], geom.vertices[ii[j + 2]]
                ], 0, ii[fl] + 1));
                geom.faceVertexUvs[0].push([
                    new THREE.Vector2((Math.cos(af) + 1 + tab) / 2 / (1 + tab),
                        (Math.sin(af) + 1 + tab) / 2 / (1 + tab)),
                    new THREE.Vector2((Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
                        (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab)),
                    new THREE.Vector2((Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
                        (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab))
                ]);
            }
        }
        geom.computeFaceNormals();
        geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
        return geom;
    }
    
    function chamfer_geom(vectors, faces, chamfer) {
        var chamfer_vectors = [],
            chamfer_faces = [],
            corner_faces = new Array(vectors.length);
        for (var i = 0; i < vectors.length; ++i) corner_faces[i] = [];
        for (var i = 0; i < faces.length; ++i) {
            var ii = faces[i],
                fl = ii.length - 1;
            var center_point = new THREE.Vector3();
            var face = new Array(fl);
            for (var j = 0; j < fl; ++j) {
                var vv = vectors[ii[j]].clone();
                center_point.add(vv);
                corner_faces[ii[j]].push(face[j] = chamfer_vectors.push(vv) - 1);
            }
            center_point.divideScalar(fl);
            for (var j = 0; j < fl; ++j) {
                var vv = chamfer_vectors[face[j]];
                vv.subVectors(vv, center_point).multiplyScalar(chamfer).addVectors(vv, center_point);
            }
            face.push(ii[fl]);
            chamfer_faces.push(face);
        }
        for (var i = 0; i < faces.length - 1; ++i) {
            for (var j = i + 1; j < faces.length; ++j) {
                var pairs = [],
                    lastm = -1;
                for (var m = 0; m < faces[i].length - 1; ++m) {
                    var n = faces[j].indexOf(faces[i][m]);
                    if (n >= 0 && n < faces[j].length - 1) {
                        if (lastm >= 0 && m != lastm + 1) pairs.unshift([i, m], [j, n]);
                        else pairs.push([i, m], [j, n]);
                        lastm = m;
                    }
                }
                if (pairs.length != 4) continue;
                chamfer_faces.push([chamfer_faces[pairs[0][0]][pairs[0][1]],
                    chamfer_faces[pairs[1][0]][pairs[1][1]],
                    chamfer_faces[pairs[3][0]][pairs[3][1]],
                    chamfer_faces[pairs[2][0]][pairs[2][1]], -1
                ]);
            }
        }
        for (var i = 0; i < corner_faces.length; ++i) {
            var cf = corner_faces[i],
                face = [cf[0]],
                count = cf.length - 1;
            while (count) {
                for (var m = faces.length; m < chamfer_faces.length; ++m) {
                    var index = chamfer_faces[m].indexOf(face[face.length - 1]);
                    if (index >= 0 && index < 4) {
                        if (--index == -1) index = 3;
                        var next_vertex = chamfer_faces[m][index];
                        if (cf.indexOf(next_vertex) >= 0) {
                            face.push(next_vertex);
                            break;
                        }
                    }
                }
                --count;
            }
            face.push(-1);
            chamfer_faces.push(face);
        }
        return { vectors: chamfer_vectors, faces: chamfer_faces };
    }
    
    function create_geom(vertices, faces, radius, tab, af, chamfer) {
        var vectors = new Array(vertices.length);
        for (var i = 0; i < vertices.length; ++i) {
            vectors[i] = (new THREE.Vector3).fromArray(vertices[i]).normalize();
        }
        var cg = chamfer_geom(vectors, faces, chamfer);
        var geom = make_geom(cg.vectors, cg.faces, radius, tab, af);
        //var geom = make_geom(vectors, faces, radius, tab, af); // Without chamfer
        geom.cannon_shape = create_shape(vectors, faces, radius);
        return geom;
    }
    
    function calc_texture_size(approx) {
        return Math.pow(2, Math.floor(Math.log(approx) / Math.log(2)));
    }
    
    // Face-label canvases were sized proportionally to vars.scale (the dice's
    // world-space size), which has no reliable relationship to how many actual
    // screen pixels a face occupies. On setups where vars.scale ends up small
    // (e.g. ~20), that produced ~64-128px textures that looked fuzzy once
    // magnified by a high devicePixelRatio. This floors the resolution and
    // scales it up for HiDPI screens instead, independent of vars.scale.
    function calc_label_resolution(approx, multiplier) {
        var target = calc_texture_size(approx) * multiplier;
        target = Math.max(target, 256); // floor: never go below a reasonably crisp size
        target *= (window.devicePixelRatio || 1);
        target = Math.min(target, 1024); // cap: avoid excessive texture memory per face
        // Multiplying by a non-integer/odd devicePixelRatio (e.g. 3) can knock
        // the result off power-of-two (256 * 3 = 768). This renderer's texture
        // path requires POT and otherwise silently resizes + warns on every
        // material build, so round up to the nearest POT ourselves instead.
        return Math.pow(2, Math.ceil(Math.log(target) / Math.log(2)));
    }
    
    function make_random_vector(vector) {
        var random_angle = rnd() * Math.PI / 5 - Math.PI / 5 / 2;
        var vec = {
            x: vector.x * Math.cos(random_angle) - vector.y * Math.sin(random_angle),
            y: vector.x * Math.sin(random_angle) + vector.y * Math.cos(random_angle)
        };
        if (vec.x == 0) vec.x = 0.01;
        if (vec.y == 0) vec.y = 0.01;
        return vec;
    }
    
    //determines which face is up after roll animation
    // @brief finds the face (of a settled die) closest to facing "up" — the
    // read/result face. Shared by get_dice_value (which face) and
    // compute_upright_correction (which way that face's label should turn).
    function find_up_face(dice) {
        var vector = new THREE.Vector3(0, 0, dice.dice_type == 'd4' ? -1 : 1);
        var closest_face, closest_index = -1,
            closest_angle = Math.PI * 2;
        for (var i = 0, l = dice.geometry.faces.length; i < l; ++i) {
            var face = dice.geometry.faces[i];
            if (face.materialIndex == 0) continue;
            var angle = face.normal.clone().applyQuaternion(dice.body.quaternion).angleTo(vector);
            if (angle < closest_angle) {
                closest_angle = angle;
                closest_face = face;
                closest_index = i;
            }
        }
        return { face: closest_face, index: closest_index };
    }
    
    function get_dice_value(dice) {
        var found = find_up_face(dice);
        var matindex = found.face ? found.face.materialIndex - 1 : -1;
        if (!found.face) console.warn('[dice] no face found facing up for a', dice.dice_type, '— returning -1');
        if (dice.dice_type == 'd100') matindex *= 10;
        if (dice.dice_type == 'd10' && matindex == 0) matindex = 10;
        return matindex;
    }
    
    function get_dice_values(dices) {
        var values = [];
        for (var i = 0, l = dices.length; i < l; ++i) {
            values.push(get_dice_value(dices[i]));
        }
        return values;
    }
    
    // @brief the in-plane 3D direction (local/object space) along which a
    // face's texture V-coordinate increases — i.e. which way is "up" for
    // whatever's painted on that face, derived from the SAME UV data
    // create_geom() already computed (geom.faceVertexUvs), via the standard
    // tangent/bitangent construction (identical technique used for normal-map
    // tangent bases). Works for irregular faces (e.g. d10's kite shape) as
    // well as regular ones, since it reads the actual stored UVs rather than
    // assuming even angular spacing.
    function compute_face_bitangent(geometry, faceIndex) {
        var face = geometry.faces[faceIndex];
        var uvs = geometry.faceVertexUvs[0] && geometry.faceVertexUvs[0][faceIndex];
        if (!face || !uvs) return null;
        var pa = geometry.vertices[face.a],
            pb = geometry.vertices[face.b],
            pc = geometry.vertices[face.c];
        var e1 = new THREE.Vector3().subVectors(pb, pa);
        var e2 = new THREE.Vector3().subVectors(pc, pa);
        var du1 = uvs[1].x - uvs[0].x,
            dv1 = uvs[1].y - uvs[0].y;
        var du2 = uvs[2].x - uvs[0].x,
            dv2 = uvs[2].y - uvs[0].y;
        var denom = du1 * dv2 - du2 * dv1;
        if (Math.abs(denom) < 1e-8) return null; //degenerate UV triangle, nothing sane to derive
        var r = 1 / denom;
        // Bitangent = the in-plane direction along which V increases. Canvas
        // textures here use three.js's default flipY=true, under which
        // increasing V corresponds to visual "up" in the source canvas —
        // i.e. the top of the printed numeral. If labels come out upside-down
        // after testing, that assumption is the thing to flip (see the sign
        // note in compute_upright_correction below) rather than this formula.
        return new THREE.Vector3(
            (du1 * e2.x - du2 * e1.x) * r,
            (du1 * e2.y - du2 * e1.y) * r,
            (du1 * e2.z - du2 * e1.z) * r
        ).normalize();
    }
    
    // @brief computes the extra world-space rotation (around the settled die's
    // up-face normal) needed to spin its label upright toward the camera.
    // Returns a THREE.Quaternion to be combined with the die's current
    // orientation — does NOT mutate the die itself, so callers can blend it
    // into a tween (see line_up_dice). Returns null if there's nothing sane
    // to correct (d4's per-edge label scheme doesn't fit this model at all;
    // no up face found; or a degenerate/edge-on face).
    function compute_upright_correction(dice) {
        if (dice.dice_type === 'd4') return null; // d4 reads via 3 per-face numbers keyed to which edge points at the viewer, not a single upright "top" label — this model doesn't apply
        var found = find_up_face(dice);
        if (!found.face || found.index < 0) return null;
        var local_up = compute_face_bitangent(dice.geometry, found.index);
        if (!local_up) return null;
        
        var world_normal = found.face.normal.clone().applyQuaternion(dice.quaternion).normalize();
        var world_up = local_up.applyQuaternion(dice.quaternion).normalize();
        
        var screen_up = new THREE.Vector3(0, 1, 0);
        screen_up.sub(world_normal.clone().multiplyScalar(screen_up.dot(world_normal)));
        if (screen_up.lengthSq() < 1e-6) return null; // face is edge-on to the camera's up axis, nothing sane to align
        screen_up.normalize();
        
        world_up.sub(world_normal.clone().multiplyScalar(world_up.dot(world_normal))).normalize();
        
        var angle = Math.atan2(
            world_normal.dot(new THREE.Vector3().crossVectors(world_up, screen_up)),
            world_up.dot(screen_up)
        );
        // If testing shows labels landing upside-down or mirrored, uncomment:
        //   angle = -angle;
        // — that's the one sign this can't be verified without rendering it.
        return new THREE.Quaternion().setFromAxisAngle(world_normal, angle);
    }
    
    function shift_dice_faces(dice, value, res) {
        var r = CONSTS.dice_face_range[dice.dice_type];
        if (dice.dice_type == 'd10' && value == 10) value = 0;
        if (!(value >= r[0] && value <= r[1])) return;
        var num = value - res;
        var geom = dice.geometry.clone();
        geom._owned = true;
        for (var i = 0, l = geom.faces.length; i < l; ++i) {
            var matindex = geom.faces[i].materialIndex;
            if (matindex == 0) continue;
            matindex += num - 1;
            while (matindex > r[1]) matindex -= r[1];
            while (matindex < r[0]) matindex += r[1];
            geom.faces[i].materialIndex = matindex + 1;
        }
        if (dice.dice_type == 'd4' && num != 0) {
            if (num < 0) num += 4;
            dice.material = cached_materials('d4|' + num + '|' + palette_key(dice.palette), function() {
                return create_d4_materials(vars.scale / 2, vars.scale * 2, CONSTS.d4_labels[num], dice.palette);
            });
        }
        if (dice.geometry._owned) dice.geometry.dispose();
        dice.geometry = geom;
    }
    
    //playSound function and audio file copied from 
    //https://github.com/chukwumaijem/roll-a-die
    /*    function playSound(outerContainer, soundVolume) {
            if (soundVolume === 0) return;
            const audio = document.createElement('audio');
            outerContainer.appendChild(audio);
            audio.src = 'assets/nc93322.mp3'; //todo: make this configurable
            audio.volume = soundVolume;
            audio.play();
            audio.onended = () => {
              audio.remove();
            };
        }
    */
    return that;
}());