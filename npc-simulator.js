function u32(x) {
    return x >>> 0;
}

function mul(a, b) {
    var a1 = a >>> 16, a2 = a & 0xffff;
    var b1 = b >>> 16, b2 = b & 0xffff;
    return u32(((a1 * b2 + a2 * b1) << 16) + a2 * b2);
}

function seed_make_const(n) {
    var A = 0x41c64e6d, B = 0x6073;
    var a = A, b = B;
    var c = 1, d = 0;
    while (n) {
        if (n & 1) {
            d = u32(mul(d, a) + b);
            c = mul(c, a);
        }
        b = u32(mul(b, a) + b);
        a = mul(a, a);
        n >>>= 1;
    }
    return { a: c, b: d };
}

function seed_stepper(n) {
    var c = seed_make_const(n);
    return function (seed) {
        return u32(mul(seed, c.a) + c.b);
    };
}

function seed_step(seed, n) {
    return seed_stepper(n)(seed);
}

var seed_next = seed_stepper(1);

var LCG = (function () {
    function LCG(seed) {
        this.seed = seed;
    }
    LCG.prototype.rand = function () {
        this.seed = seed_next(this.seed);
        return this.seed >>> 16;
    };

    LCG.prototype.step = function (n) {
    };
    return LCG;
})();

var NPCType;
(function (NPCType) {
    NPCType[NPCType["MOVABLE"] = 0] = "MOVABLE";
    NPCType[NPCType["NONMOVABLE"] = 1] = "NONMOVABLE";
})(NPCType || (NPCType = {}));

var Direction;
(function (Direction) {
    Direction[Direction["UP"] = 0] = "UP";
    Direction[Direction["DOWN"] = 1] = "DOWN";
    Direction[Direction["LEFT"] = 2] = "LEFT";
    Direction[Direction["RIGHT"] = 3] = "RIGHT";
})(Direction || (Direction = {}));

var DX = [0, 0, -1, 1];
var DY = [-1, 1, 0, 0];

function movable(npc) {
    var newX = npc.x + DX[npc.direction];
    var newY = npc.y + DY[npc.direction];
    return 0 <= newX && newX < npc.width && 0 <= newY && newY < npc.height;
}

function move(npc) {
    npc.x += DX[npc.direction];
    npc.y += DY[npc.direction];
}

function movableNpc(no, name, width, height, x, y, direction) {
    return {
        no: no,
        name: name,
        type: 0 /* MOVABLE */,
        width: width,
        height: height,
        allDirections: [0, 1, 2, 3],
        x: x,
        y: y,
        timer: 0,
        direction: direction,
        state: 0
    };
}

function nonmovableNpc(no, name, allDirections, direction) {
    return {
        no: no,
        name: name,
        type: 1 /* NONMOVABLE */,
        width: 0,
        height: 0,
        allDirections: allDirections,
        x: 0,
        y: 0,
        timer: 0,
        direction: direction,
        state: 0
    };
}

var NPCSimulator = (function () {
    function NPCSimulator(seed, npcs) {
        this.lcg = new LCG(seed);
        this.frame = 0;
        this.npcs = npcs;
        this.spendingLog = [];
        this.actionLog = [];
    }
    NPCSimulator.prototype.simulate = function (n) {
        this.init();
        this.incFrame(30);
        for (var i = 0; i < n; i++) {
            this.advance();
            this.incFrame(2);
        }
    };

    NPCSimulator.prototype.init = function () {
        var _this = this;
        this.npcs.forEach(function (npc) {
            if (npc.type == 1 /* NONMOVABLE */) {
                npc.timer = _this.randTime(npc);
            }
        });
    };

    NPCSimulator.prototype.advance = function () {
        var _this = this;
        this.npcs.forEach(function (npc) {
            _this.advanceNpc(npc);
        });
    };

    NPCSimulator.prototype.incFrame = function (n) {
        this.frame += n;
    };

    NPCSimulator.prototype.advanceNpc = function (npc) {
        if (npc.type == 1 /* NONMOVABLE */) {
            npc.timer -= 1;
            if (npc.timer == 0) {
                npc.timer = this.randTime(npc);
                var direction = this.randDirection(npc);
                if (npc.direction != direction) {
                    this.actionLog.push({ frame: this.frame + 6, npcNo: npc.no, direction: direction, isMove: false });
                }
                npc.direction = direction;
            }
        } else {
            switch (npc.state) {
                case 0:
                    npc.state = 1;
                    break;
                case 1:
                    npc.timer = this.randTime(npc) - 1;
                    npc.state = 2;
                    break;
                case 2:
                    npc.timer -= 1;
                    if (npc.timer == 0) {
                        var prevDirection = npc.direction;
                        npc.direction = this.randDirection(npc);
                        if (movable(npc)) {
                            this.actionLog.push({ frame: this.frame + 6, npcNo: npc.no, direction: npc.direction, isMove: true });
                            move(npc);
                            npc.state = 4;
                            npc.timer = 7;
                        } else {
                            if (npc.direction != prevDirection) {
                                this.actionLog.push({ frame: this.frame + 6, npcNo: npc.no, direction: npc.direction, isMove: false });
                            }
                            npc.state = 0;
                        }
                    }
                    break;
                case 4:
                    npc.timer -= 1;
                    if (npc.timer == 0) {
                        npc.state = 0;
                    }
                    break;
            }
        }
    };

    NPCSimulator.prototype.randTime = function (npc) {
        var time = 16 * (this.lcg.rand() % 4 + 1);
        this.spendingLog.push({ frame: this.frame, npcNo: npc.no, description: "time -> " + time });
        return time;
    };

    NPCSimulator.prototype.randDirection = function (npc) {
        var direction = npc.allDirections[this.lcg.rand() % npc.allDirections.length];
        this.spendingLog.push({ frame: this.frame, npcNo: npc.no, description: "direction -> " + direction });
        return direction;
    };
    return NPCSimulator;
})();
//# sourceMappingURL=npc-simulator.js.map
