"use strict";

/**
 * @brief generates dice (d4, d6, d8, d10, d12, d20, d100) with roll animation and result calculation
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
 * - stripped down to support only d6 dice (removed d4, d8, d9, d10, d12, d20, d100)
 * - adding hold()/release() to support re-rolling a subset of dice
 * - desk_opacity defaults to 0; desk mesh is skipped entirely when transparent to avoid depth/shadow artifacts
 * - reinit() now invalidates shared geometry/material cache so multiple dice_box instances don't share a stale scale
 * - four-color dice texture: dice_color (face), label_color (number), stripe_color (pinstripe), outline_color (stroke around number)
 * - adding that.set_color() to update any color and bust the material cache from outside the module
 * - restored d4, d8, d10, d12, d20, d100 (d9 stays removed)
 * - per-die color palettes: box.setPalettes([...]) assigns a palette by notation position; dice without one use the
 *   shared defaults from set_color(). Materials are cached per (type + palette).
 * - fixed d6 label table (faces use material indices 2-7, so labels need a leading '0' entry)
 * - each box remembers its own scale and rebuilds the shared geometry cache if another box changed it
 * - added dispose() to release the WebGL context
 * - added DICE.percentile(tens, units)
 */

export const DICE = (function() {
    var that = {};

    var vars = { //todo: make these configurable on init
        frame_rate: 1 / 60,
        scale: 100, //dice size
        
        material_options: {
            specular: 0x172022,
            color: 0xf0f0f0,
            shininess: 40,
            shading: THREE.FlatShading,
        },
        label_color: '#aaaaaa',   // number fill
        dice_color: '#202020',    // face background
        stripe_color: '#202020',  // pinstripe lines over the face
        outline_color: '#ffffff', // stroke drawn around the number
        ambient_light_color: 0xf0f0f0,
        spot_light_color: 0xefefef,
        desk_color: '#101010', //canvas background (unused when desk_opacity is 0)
        desk_opacity: 0,
        use_shadows: true,
        use_adapvite_timestep: true //todo: setting this to false improves performace a lot. but the dice rolls don't look as natural...

    }

    const CONSTS = {
        known_types: ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'],
        dice_face_range: { 'd4': [1, 4], 'd6': [1, 6], 'd8': [1, 8], 'd10': [0, 9], 'd12': [1, 12], 'd20': [1, 20], 'd100': [0, 9] },
        dice_mass: { 'd4': 300, 'd6': 300, 'd8': 340, 'd10': 350, 'd12': 350, 'd20': 400, 'd100': 350 },
        dice_inertia: { 'd4': 5, 'd6': 13, 'd8': 10, 'd10': 9, 'd12': 8, 'd20': 6, 'd100': 9 },

        // Face materialIndex = face number + 1, and index 0 is the blank chamfer material,
        // so these start with ' ' then '0'. Only the first (range max + 2) entries are used per die.
        standart_d20_dice_face_labels: [' ', '0', '1', '2', '3', '4', '5', '6', '7', '8',
                '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
        standart_d100_dice_face_labels: [' ', '00', '10', '20', '30', '40', '50',
                '60', '70', '80', '90'],

        d4_labels: [
            [[], [0, 0, 0], [2, 4, 3], [1, 3, 4], [2, 1, 4], [1, 2, 3]],
            [[], [0, 0, 0], [2, 3, 4], [3, 1, 4], [2, 4, 1], [3, 2, 1]],
            [[], [0, 0, 0], [4, 3, 2], [3, 4, 1], [4, 2, 1], [3, 1, 2]],
            [[], [0, 0, 0], [4, 2, 3], [1, 4, 3], [4, 1, 2], [1, 3, 2]]
        ]
    }

    // DICE BOX OBJECT

    // @brief constructor; create a new instance of this to initialize the canvas
    // @param container element to contain canvas; canvas will fill container
    that.dice_box = function(container) {
        this.dices = [];
        this.scene = new THREE.Scene();
        this.world = new CANNON.World();
        this.diceToRoll = ''; //user input
        this.container = container;
        this.palettes = [];              // per-die color palettes, indexed by notation position
        this.held_indices = new Set();   // indices into last result to hold for next throw
        this._held_dice = [];            // [{index, die, value}] — held dice kept in scene
        this._full_dice_map = [];        // die objects indexed by result position

        this.renderer = window.WebGLRenderingContext
            ? new THREE.WebGLRenderer({ antialias: true, alpha: true })
            : new THREE.CanvasRenderer({ antialias: true, alpha: true });
        container.appendChild(this.renderer.domElement);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.setClearColor(0xffffff, 0); //color, alpha

        this.reinit(container);
        $t.bind(container, 'resize', function() {
            //todo: this doesn't work :(
            this.reinit(elem.canvas);
        });

        this.world.gravity.set(0, 0, -9.8 * 800);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 16;

        var ambientLight = new THREE.AmbientLight(vars.ambient_light_color);
        this.scene.add(ambientLight);

        this.dice_body_material = new CANNON.Material();
        var desk_body_material = new CANNON.Material();
        var barrier_body_material = new CANNON.Material();
        this.world.addContactMaterial(new CANNON.ContactMaterial(
                    desk_body_material, this.dice_body_material, 0.01, 0.5));
        this.world.addContactMaterial(new CANNON.ContactMaterial(
                    barrier_body_material, this.dice_body_material, 0, 1.0));
        this.world.addContactMaterial(new CANNON.ContactMaterial(
                    this.dice_body_material, this.dice_body_material, 0, 0.5));

        this.world.add(new CANNON.RigidBody(0, new CANNON.Plane(), desk_body_material));
        var barrier;
        barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
        barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        barrier.position.set(0, this.h * 0.93, 0);
        this.world.add(barrier);

        barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
        barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        barrier.position.set(0, -this.h * 0.93, 0);
        this.world.add(barrier);

        barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
        barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
        barrier.position.set(this.w * 0.93, 0, 0);
        this.world.add(barrier);

        barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
        barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
        barrier.position.set(-this.w * 0.93, 0, 0);
        this.world.add(barrier);

        this.last_time = 0;
        this.running = false;

        this.renderer.render(this.scene, this.camera);
    }

    // called on init and window resize
    that.dice_box.prototype.reinit = function(container) {
        // Invalidate the shared geometry/material cache — vars.scale is about to change,
        // so any geometry baked at the old scale must be rebuilt. This matters when two
        // dice_box instances exist at the same time (e.g. team-setup and game screens).
        reset_dice_cache();

        this.cw = container.clientWidth / 2;
        this.ch = container.clientHeight / 2;
        this.w = this.cw;
        this.h = this.ch;
        this.aspect = Math.min(this.cw / this.w, this.ch / this.h);
        vars.scale = Math.sqrt(this.w * this.w + this.h * this.h) / 8;
        this.scale = vars.scale; // remembered so create_dice can detect another box changing vars.scale
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
        this.light.shadowDarkness = 1.1;
        this.light.shadowMapWidth = 1024;
        this.light.shadowMapHeight = 1024;
        this.scene.add(this.light);

        // Only create the desk mesh when it will actually be visible.
        // Even with opacity:0, a THREE.js mesh still participates in depth sorting
        // and shadow passes, which can cause a dark bleed on the transparent canvas.
        if (this.desk) this.scene.remove(this.desk);
        if (vars.desk_opacity > 0) {
            this.desk = new THREE.Mesh(new THREE.PlaneGeometry(this.w * 2, this.h * 2, 1, 1),
                    new THREE.MeshPhongMaterial({ color: vars.desk_color, opacity: vars.desk_opacity, transparent: true }));
            this.desk.receiveShadow = vars.use_shadows;
            this.scene.add(this.desk);
        }

        this.renderer.render(this.scene, this.camera);
    }

    // @param diceToRoll (string), ex: "3d6" or "1d6+2"
    that.dice_box.prototype.setDice = function(diceToRoll) {
        this.diceToRoll = diceToRoll;
    }

    // @param indices - array of 0-based positions in the last roll result to hold for the next throw
    // @example box.hold([0, 2]) keeps dice at result positions 0 and 2; only the others re-roll
    that.dice_box.prototype.hold = function(indices) {
        this.held_indices = new Set(indices);
    }

    // release all holds; the next throw will re-roll every die
    that.dice_box.prototype.release = function() {
        this.held_indices = new Set();
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

    // release the WebGL context and remove the canvas. Call before discarding a box
    // (iOS only allows a handful of live WebGL contexts).
    that.dice_box.prototype.dispose = function() {
        this._disposed = true;
        this.running = false;
        this.clear();
        this._held_dice = [];
        this._full_dice_map = [];
        if (this.renderer) {
            var gl = this.renderer.getContext && this.renderer.getContext();
            var ext = gl && gl.getExtension && gl.getExtension('WEBGL_lose_context');
            if (ext) ext.loseContext();
            if (this.renderer.dispose) this.renderer.dispose();
            var canvas = this.renderer.domElement;
            if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        }
    }

    //call this to roll dice programatically or from click
    that.dice_box.prototype.start_throw = function(before_roll, after_roll) {
        var box = this;
        if (box.rolling) return;

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
        var uat = vars.use_adapvite_timestep;

        vector.x /= dist; vector.y /= dist;
        var notation = that.parse_notation(box.diceToRoll);
        if (notation.set.length == 0) return;

        // Determine whether held_indices applies to this throw.
        // Requires that the number of dice on the table matches the notation,
        // so stale holds after a setDice change are silently ignored.
        var hasHolds = box.held_indices.size > 0
            && box._full_dice_map.length === notation.set.length;

        // Reconcile _held_dice: keep entries whose index is still being held,
        // remove the rest from the scene now (they were kept out of box.dices).
        var nextHeldDice = [];
        for (var i = 0; i < box._held_dice.length; i++) {
            var entry = box._held_dice[i];
            if (hasHolds && box.held_indices.has(entry.index)) {
                nextHeldDice.push(entry);
            } else {
                box.scene.remove(entry.die);
                if (entry.die.body) box.world.remove(entry.die.body);
            }
        }
        box._held_dice = nextHeldDice;

        // Build heldValues map and move newly-held dice out of box.dices.
        // Dice removed from box.dices stay in the scene so they remain visible
        // while the other dice are rolling.
        var heldValues = {}; // { originalIndex: value }
        if (hasHolds) {
            var alreadyHeldSet = new Set(box._held_dice.map(function(e) { return e.index; }));
            box.held_indices.forEach(function(idx) {
                if (idx < 0 || idx >= notation.set.length) return;
                if (alreadyHeldSet.has(idx)) {
                    // Carried over from a previous re-roll
                    var existing = box._held_dice.find(function(e) { return e.index === idx; });
                    heldValues[idx] = existing.value;
                } else {
                    // Newly held this throw — die is in box.dices via _full_dice_map
                    var die = box._full_dice_map[idx];
                    var value = get_dice_value(die);
                    heldValues[idx] = value;
                    box._held_dice.push({ index: idx, die: die, value: value });
                    var pos = box.dices.indexOf(die);
                    if (pos !== -1) box.dices.splice(pos, 1);
                }
            });
        }

        // Build a sub-notation covering only the dice that will actually be thrown
        var rollSet = notation.set.filter(function(_, i) { return !heldValues.hasOwnProperty(i); });
        var rollSeeds = notation.result.filter(function(_, i) { return !heldValues.hasOwnProperty(i); });
        var activeNotation = {
            set: rollSet,
            constant: 0,
            result: rollSeeds,
            resultTotal: 0,
            resultString: '',
            error: notation.error
        };

        var vectors = box.generate_vectors(activeNotation, vector, boost);
        // Tag each vector with its position in the full notation so palettes follow the right die
        var rollIndices = [];
        for (var ri = 0; ri < notation.set.length; ri++) {
            if (!heldValues.hasOwnProperty(ri)) rollIndices.push(ri);
        }
        vectors.forEach(function(v, k) { v.notation_index = rollIndices[k]; });
        box.rolling = true;
        let request_results = null;

        let numDice = Math.min(vectors.length, 10);
        for (let i = 0; i < numDice; i++) {
            let volume = i / 10;
            if (volume <= 0) volume = 0.1;
            if (volume > 1) volume = 1;
            playSound(box.container, volume);
        }

        if (before_roll) {
            var fullRequest = before_roll(notation);
            if (fullRequest) {
                request_results = fullRequest.filter(function(_, i) { return !heldValues.hasOwnProperty(i); });
            }
        }
        roll(request_results);

        //@param request_results (optional) - pass in an array of desired roll results
        //todo: when this param is used, animation isn't as smooth (uat not used?)
        function roll(request_results) {
            // box.roll calls clear() internally, which removes what remains in box.dices
            // (the non-held dice from the last throw). Held dice are not in box.dices
            // so they are untouched and stay visible in the scene.
            box.roll(vectors, request_results || activeNotation.result, function(newResults) {
                // Reconstruct the full result preserving held values at their original positions
                var fullResult = new Array(notation.set.length);
                var newIdx = 0;
                for (var i = 0; i < notation.set.length; i++) {
                    fullResult[i] = heldValues.hasOwnProperty(i) ? heldValues[i] : newResults[newIdx++];
                }

                // Rebuild _full_dice_map so subsequent holds reference the right die objects
                var newDiceIdx = 0;
                box._full_dice_map = new Array(notation.set.length);
                for (var i = 0; i < notation.set.length; i++) {
                    if (heldValues.hasOwnProperty(i)) {
                        box._full_dice_map[i] = box._held_dice.find(function(e) { return e.index === i; }).die;
                    } else {
                        box._full_dice_map[i] = box.dices[newDiceIdx++];
                    }
                }

                notation.result = fullResult;
                var res = fullResult.join(' ');
                if (notation.constant) {
                    if (notation.constant > 0) res += ' +' + notation.constant;
                    else res += ' -' + Math.abs(notation.constant);
                }
                notation.resultTotal = fullResult.reduce(function(s, a) { return s + a; }, 0) + notation.constant;
                if (fullResult.length > 1 || notation.constant) {
                    res += ' = ' + notation.resultTotal;
                }
                notation.resultString = res;

                if (after_roll) after_roll(notation);

                box.rolling = false;
                box.held_indices = new Set(); // holds are consumed after each throw
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
            if (projector > 1.0) pos.y /= projector; else pos.x *= projector;
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

    that.dice_box.prototype.create_dice = function(type, pos, velocity, angle, axis, notation_index) {
        ensure_scale(this);
        var palette = resolve_palette(this.palettes[notation_index]);
        console.log(palette)
        var dice = threeD_dice.create(type, palette);
        dice.castShadow = true;
        dice.dice_type = type;
        dice.palette = palette;
        dice.notation_index = notation_index;
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
                var a = dice.body.angularVelocity, v = dice.body.velocity;
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
            if (this.callback) this.callback.call(this, get_dice_values(this.dices));
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

    that.dice_box.prototype.clear = function() {
        this.running = false;
        var dice;
        while (dice = this.dices.pop()) {
            this.scene.remove(dice); 
            if (dice.body) this.world.remove(dice.body);
        }
        if (this.pane) this.scene.remove(this.pane);
        this.renderer.render(this.scene, this.camera);
        var box = this;
        setTimeout(function() { if (!box._disposed) box.renderer.render(box.scene, box.camera); }, 100);
    }

    that.dice_box.prototype.prepare_dices_for_roll = function(vectors) {
        this.clear();
        this.iteration = 0;
        for (var i in vectors) {
            this.create_dice(vectors[i].set, vectors[i].pos, vectors[i].velocity,
                    vectors[i].angle, vectors[i].axis,
                    vectors[i].notation_index !== undefined ? vectors[i].notation_index : Number(i));
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

    that.dice_box.prototype.search_dice_by_mouse = function(ev) {
        var m = $t.get_mouse_coords(ev);
        var intersects = (new THREE.Raycaster(this.camera.position, 
                    (new THREE.Vector3((m.x - this.cw) / this.aspect,
                                       1 - (m.y - this.ch) / this.aspect, this.w / 9))
                    .sub(this.camera.position).normalize())).intersectObjects(this.dices);
        if (intersects.length) return intersects[0].object.userData;
    }


    // PUBLIC FUNCTIONS

    //validates dice notation input
    //notation should be in format "3d6" or "1d6+2d6+1"
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
        var dict = {}, notation = '';
        for (var i in nn.set) 
            if (!dict[nn.set[i]]) dict[nn.set[i]] = 1; else ++dict[nn.set[i]];
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
    
    // PRIVATE FUNCTIONS

    // dice geometries
    let threeD_dice = {};

    var GEOMETRY_BUILDERS = {
        d4:   function() { return create_d4_geometry(vars.scale * 1.2); },
        d6:   function() { return create_d6_geometry(vars.scale * 1.1); },
        d8:   function() { return create_d8_geometry(vars.scale); },
        d10:  function() { return create_d10_geometry(vars.scale * 0.9); },
        d12:  function() { return create_d12_geometry(vars.scale * 0.9); },
        d20:  function() { return create_d20_geometry(vars.scale); },
        d100: function() { return create_d10_geometry(vars.scale * 0.9); }
    };
    var LABEL_MARGIN = { d6: 0.9, d8: 1.4, d10: 1.0, d12: 1.0, d20: 1.2, d100: 1.5 };

    threeD_dice.geoms = {};
    var material_cache = {}; // key: type + palette -> THREE.MeshFaceMaterial

    // Geometry and face textures are sized from vars.scale, so they must be rebuilt when it changes.
    function reset_dice_cache() {
        threeD_dice.geoms = {};
        material_cache = {};
    }

    // vars.scale is shared by every box. If another box changed it, adopt this box's scale and rebuild.
    function ensure_scale(box) {
        if (box.scale && vars.scale !== box.scale) {
            vars.scale = box.scale;
            reset_dice_cache();
        }
    }

    // Accepts { dice, label, stripe, outline } or a uniform { jersey, text, stripe, outline }.
    // No palette at all -> the shared defaults. A partial palette: missing stripe/outline become the die color
    // (i.e. invisible); missing dice/label fall back to the shared defaults.
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

    function get_material(type, p) {
        var key = type + '|' + [p.dice, p.label, p.stripe, p.outline].join('|');
        if (!material_cache[key]) {
            var materials;
            if (type === 'd4') {
                materials = create_d4_materials(vars.scale / 2, vars.scale * 2, CONSTS.d4_labels[0], p);
            } else {
                var all = type === 'd100' ? CONSTS.standart_d100_dice_face_labels : CONSTS.standart_d20_dice_face_labels;
                var labels = all.slice(0, CONSTS.dice_face_range[type][1] + 2);
                materials = create_dice_materials(labels, vars.scale / 2, LABEL_MARGIN[type], p);
            }
            material_cache[key] = new THREE.MeshFaceMaterial(materials);
        }
        return material_cache[key];
    }

    threeD_dice.create = function(type, p) {
        var geoKey = type === 'd100' ? 'd10' : type; // d100 shares the d10 shape
        if (!this.geoms[geoKey]) this.geoms[geoKey] = GEOMETRY_BUILDERS[type]();
        return new THREE.Mesh(this.geoms[geoKey], get_material(type, p));
    }

    // base color + pinstripes, shared by the numbered faces and the d4 faces
    function paint_face_background(context, ts, p) {
        context.fillStyle = p.dice;
        context.fillRect(0, 0, ts, ts);
        if (p.stripe && p.stripe !== p.dice) {
            var stripePositions = [0.06, 0.36, 0.66, 0.96];
            var stripeW = Math.max(1, Math.round(ts * 0.015));
            context.save();
            context.globalAlpha = 0.627; // 160/255, same as the CSS hex 'a0' used by the 2D die-box
            context.fillStyle = p.stripe;
            stripePositions.forEach(function(pos) {
                context.fillRect(Math.round(ts * pos - stripeW / 2), 0, stripeW, ts);
            });
            context.restore();
        }
    }

    function create_dice_materials(face_labels, size, margin, p) {
        function create_face_texture(text) {
            if (text == undefined) return null;
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var ts = calc_texture_size(size + size * 2 * margin) * 2;
            canvas.width = canvas.height = ts;

            paint_face_background(context, ts, p);

            // Blank face (' ') gets background and stripes but no text
            if (text && text.trim() !== '') {
                var fontSize = ts / (1 + 2 * margin);
                context.font = fontSize + "pt Arial";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.lineJoin = 'round';
                context.lineWidth = Math.max(1, fontSize * 0.12);
                context.strokeStyle = p.outline;
                context.fillStyle = p.label;

                // outline first so the fill sits on top
                context.strokeText(text, canvas.width / 2, canvas.height / 2);
                context.fillText(text, canvas.width / 2, canvas.height / 2);
                if (text === '6' || text === '9') {
                    context.strokeText('  .', canvas.width / 2, canvas.height / 2);
                    context.fillText('  .', canvas.width / 2, canvas.height / 2);
                }
            }

            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }

        var materials = [];
        for (var i = 0; i < face_labels.length; ++i)
            materials.push(new THREE.MeshPhongMaterial($t.copyto(vars.material_options,
                        { map: create_face_texture(face_labels[i]) })));
        return materials;
    }

    function create_d4_materials(size, margin, labels, p) {
        function create_d4_text(text) {
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var ts = calc_texture_size(size + margin) * 2;
            canvas.width = canvas.height = ts;
            paint_face_background(context, ts, p);
            context.font = (ts - margin) * 0.5 + "pt Arial";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.lineJoin = 'round';
            context.lineWidth = Math.max(1, ts * 0.03);
            context.strokeStyle = p.outline;
            context.fillStyle = p.label;
            for (var i in text) {
                context.strokeText(text[i], canvas.width / 2, canvas.height / 2 - ts * 0.3);
                context.fillText(text[i], canvas.width / 2, canvas.height / 2 - ts * 0.3);
                context.translate(canvas.width / 2, canvas.height / 2);
                context.rotate(Math.PI * 2 / 3);
                context.translate(-canvas.width / 2, -canvas.height / 2);
            }
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }
        var materials = [];
        for (var i = 0; i < labels.length; ++i)
            materials.push(new THREE.MeshPhongMaterial($t.copyto(vars.material_options,
                        { map: create_d4_text(labels[i]) })));
        return materials;
    }

    function create_d4_geometry(radius) {
        var vertices = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
        var faces = [[1, 0, 2, 1], [0, 1, 3, 2], [0, 3, 2, 3], [1, 2, 3, 4]];
        return create_geom(vertices, faces, radius, -0.1, Math.PI * 7 / 6, 0.96);
    }

    function create_d6_geometry(radius) {
        var vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
        var faces = [[0, 3, 2, 1, 1], [1, 2, 6, 5, 2], [0, 1, 5, 4, 3],
                [3, 7, 6, 2, 4], [0, 4, 7, 3, 5], [4, 5, 6, 7, 6]];
        return create_geom(vertices, faces, radius, 0.1, Math.PI / 4, 0.96);
    }

    function create_d8_geometry(radius) {
        var vertices = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        var faces = [[0, 2, 4, 1], [0, 4, 3, 2], [0, 3, 5, 3], [0, 5, 2, 4], [1, 3, 4, 5],
                [1, 4, 2, 6], [1, 2, 5, 7], [1, 5, 3, 8]];
        return create_geom(vertices, faces, radius, 0, -Math.PI / 4 / 2, 0.965);
    }

    function create_d10_geometry(radius) {
        var a = Math.PI * 2 / 10, k = Math.cos(a), h = 0.105, v = -1;
        var vertices = [];
        for (var i = 0, b = 0; i < 10; ++i, b += a)
            vertices.push([Math.cos(b), Math.sin(b), h * (i % 2 ? 1 : -1)]);
        vertices.push([0, 0, -1]); vertices.push([0, 0, 1]);
        var faces = [[5, 7, 11, 0], [4, 2, 10, 1], [1, 3, 11, 2], [0, 8, 10, 3], [7, 9, 11, 4],
                [8, 6, 10, 5], [9, 1, 11, 6], [2, 0, 10, 7], [3, 5, 11, 8], [6, 4, 10, 9],
                [1, 0, 2, v], [1, 2, 3, v], [3, 2, 4, v], [3, 4, 5, v], [5, 4, 6, v],
                [5, 6, 7, v], [7, 6, 8, v], [7, 8, 9, v], [9, 8, 0, v], [9, 0, 1, v]];
        return create_geom(vertices, faces, radius, 0, Math.PI * 6 / 5, 0.945);
    }

    function create_d12_geometry(radius) {
        var p = (1 + Math.sqrt(5)) / 2, q = 1 / p;
        var vertices = [[0, q, p], [0, q, -p], [0, -q, p], [0, -q, -p], [p, 0, q],
                [p, 0, -q], [-p, 0, q], [-p, 0, -q], [q, p, 0], [q, -p, 0], [-q, p, 0],
                [-q, -p, 0], [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1],
                [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]];
        var faces = [[2, 14, 4, 12, 0, 1], [15, 9, 11, 19, 3, 2], [16, 10, 17, 7, 6, 3], [6, 7, 19, 11, 18, 4],
                [6, 18, 2, 0, 16, 5], [18, 11, 9, 14, 2, 6], [1, 17, 10, 8, 13, 7], [1, 13, 5, 15, 3, 8],
                [13, 8, 12, 4, 5, 9], [5, 4, 14, 9, 15, 10], [0, 12, 8, 10, 16, 11], [3, 19, 7, 17, 1, 12]];
        return create_geom(vertices, faces, radius, 0.2, -Math.PI / 4 / 2, 0.968);
    }

    function create_d20_geometry(radius) {
        var t = (1 + Math.sqrt(5)) / 2;
        var vertices = [[-1, t, 0], [1, t, 0 ], [-1, -t, 0], [1, -t, 0],
                [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
                [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
        var faces = [[0, 11, 5, 1], [0, 5, 1, 2], [0, 1, 7, 3], [0, 7, 10, 4], [0, 10, 11, 5],
                [1, 5, 9, 6], [5, 11, 4, 7], [11, 10, 2, 8], [10, 7, 6, 9], [7, 1, 8, 10],
                [3, 9, 4, 11], [3, 4, 2, 12], [3, 2, 6, 13], [3, 6, 8, 14], [3, 8, 9, 15],
                [4, 9, 5, 16], [2, 4, 11, 17], [6, 2, 10, 18], [8, 6, 7, 19], [9, 8, 1, 20]];
        return create_geom(vertices, faces, radius, -0.2, -Math.PI / 4 / 2, 0.955);
    }

    // HELPERS

    function rnd() {
        return Math.random();
    }

    function create_shape(vertices, faces, radius) {
        var cv = new Array(vertices.length), cf = new Array(faces.length);
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
            var ii = faces[i], fl = ii.length - 1;
            var aa = Math.PI * 2 / fl;
            for (var j = 0; j < fl - 2; ++j) {
                geom.faces.push(new THREE.Face3(ii[0], ii[j + 1], ii[j + 2], [geom.vertices[ii[0]],
                            geom.vertices[ii[j + 1]], geom.vertices[ii[j + 2]]], 0, ii[fl] + 1));
                geom.faceVertexUvs[0].push([
                        new THREE.Vector2((Math.cos(af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(af) + 1 + tab) / 2 / (1 + tab)),
                        new THREE.Vector2((Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab)),
                        new THREE.Vector2((Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab))]);
            }
        }
        geom.computeFaceNormals();
        geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
        return geom;
    }

    function chamfer_geom(vectors, faces, chamfer) {
        var chamfer_vectors = [], chamfer_faces = [], corner_faces = new Array(vectors.length);
        for (var i = 0; i < vectors.length; ++i) corner_faces[i] = [];
        for (var i = 0; i < faces.length; ++i) {
            var ii = faces[i], fl = ii.length - 1;
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
                var pairs = [], lastm = -1;
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
                        chamfer_faces[pairs[2][0]][pairs[2][1]], -1]);
            }
        }
        for (var i = 0; i < corner_faces.length; ++i) {
            var cf = corner_faces[i], face = [cf[0]], count = cf.length - 1;
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
    function get_dice_value(dice) {
        var vector = new THREE.Vector3(0, 0, dice.dice_type == 'd4' ? -1 : 1);
        var closest_face, closest_angle = Math.PI * 2;
        for (var i = 0, l = dice.geometry.faces.length; i < l; ++i) {
            var face = dice.geometry.faces[i];
            if (face.materialIndex == 0) continue;
            var angle = face.normal.clone().applyQuaternion(dice.body.quaternion).angleTo(vector);
            if (angle < closest_angle) {
                closest_angle = angle;
                closest_face = face;
            }
        }
        var matindex = closest_face ? closest_face.materialIndex - 1 : -1; //todo: bug thrown here, sometimes closest_face = undefined
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

    function shift_dice_faces(dice, value, res) {
        var r = CONSTS.dice_face_range[dice.dice_type];
        if (dice.dice_type == 'd10' && value == 10) value = 0;
        if (!(value >= r[0] && value <= r[1])) return;
        var num = value - res;
        var geom = dice.geometry.clone();
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
            dice.material = new THREE.MeshFaceMaterial(
                    create_d4_materials(vars.scale / 2, vars.scale * 2, CONSTS.d4_labels[num], dice.palette));
        }
        dice.geometry = geom;
    }

    //playSound function and audio file copied from 
    //https://github.com/chukwumaijem/roll-a-die
    function playSound(outerContainer, soundVolume) {
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

    // @param which (string) - 'dice' | 'label' | 'stripe' | 'outline'
    // @param value (string) - any CSS color string, e.g. '#E81828' or 'rgb(255,0,0)'
    // Updates the named color in vars and busts the material cache so the next
    // throw rebuilds the face textures at the new colors.
    // Because vars is module-level, this affects both dice_box instances.
    that.set_color = function(which, value) {
        const map = {
            dice:    'dice_color',
            label:   'label_color',
            stripe:  'stripe_color',
            outline: 'outline_color'
        };
        if (map[which]) {
            vars[map[which]] = value;
            material_cache = {}; // rebuilt lazily with the new defaults
        }
    }

    // Combine a d100 (tens, shown 00-90) and a d10 (units) into 1-100.
    // The d10 face "0" is reported as 10, and 00 + 0 counts as 100.
    that.percentile = function(tens, units) {
        var total = (tens % 100) + (units % 10);
        return total === 0 ? 100 : total;
    }

    return that;
}());

