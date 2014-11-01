function u32(x: number): number {
    return x >>> 0;
}

function mul(a: number, b: number): number {
    var a1 = a >>> 16, a2 = a & 0xffff;
    var b1 = b >>> 16, b2 = b & 0xffff;
    return u32(((a1 * b2 + a2 * b1) << 16) + a2 * b2);
}

class LCG {
    seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    rand(): number {
        this.seed = u32(mul(this.seed, 0x41c64e6d) + 0x6073);
        return this.seed >>> 16;
    }
}

interface SpendingLog {
    frame: number;
    npcNo: number;
    description: string;
}

interface ActionLog {
    frame: number;
    npcNo: number;
    direction: Direction;
    isMove: boolean;
}

enum NPCType {
    MOVABLE,
    NONMOVABLE
}

enum Direction {
    UP = 0,
    DOWN,
    LEFT,
    RIGHT
}

interface NPC {
    no: number;
    name: string;
    type: NPCType;
    width: number;
    height: number;
    allDirections: Array<number>;
    x: number;
    y: number;
    timer: number;
    direction: Direction;
    state: number;
}

var DX = [0, 0, -1, 1];
var DY = [-1, 1, 0, 0];

function movable(npc: NPC): boolean {
    var newX = npc.x + DX[npc.direction];
    var newY = npc.y + DY[npc.direction];
    return 0 <= newX && newX < npc.width && 0 <= newY && newY < npc.height;
}

function move(npc: NPC) {
    npc.x += DX[npc.direction];
    npc.y += DY[npc.direction];
}

function movableNpc(no: number, name: string, width: number, height: number, x: number, y: number, direction: Direction): NPC {
    return {
        no: no,
        name: name,
        type: NPCType.MOVABLE,
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

function nonmovableNpc(no: number, name: string, allDirections: Array<Direction>, direction: Direction): NPC {
    return {
        no: no,
        name: name,
        type: NPCType.NONMOVABLE,
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

class Context {
    lcg: LCG;
    frame: number;
    npcs: Array<NPC>;
    spendingLog: Array<SpendingLog>;
    actionLog: Array<ActionLog>;

    constructor(seed: number, npcs: Array<NPC>) {
        this.lcg = new LCG(seed);
        this.frame = 0;
        this.npcs = npcs;
        this.spendingLog = [];
        this.actionLog = [];
    }

    init() {
        this.npcs.forEach((npc) => {
            if (npc.type == NPCType.NONMOVABLE) {
                npc.timer = this.randTime(npc);
            }  
        });
    }

    advance() {
        this.npcs.forEach((npc) => {
            this.advanceNpc(npc);
        });
    }

    incFrame(n: number) {
        this.frame += n;
    }

    advanceNpc(npc: NPC) {
        if (npc.type == NPCType.NONMOVABLE) {
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
    }

    randTime(npc: NPC): number {
        var time = 16 * (this.lcg.rand() % 4 + 1);
        this.spendingLog.push({ frame: this.frame, npcNo: npc.no, description: "time -> " + time });
        return time;
    }

    randDirection(npc: NPC): number {
        var direction = npc.allDirections[this.lcg.rand() % npc.allDirections.length];
        this.spendingLog.push({ frame: this.frame, npcNo: npc.no, description: "direction -> " + direction });
        return direction;
    }
}

function main() {
    var npcs = [
        nonmovableNpc(0, "短パン", [Direction.UP, Direction.RIGHT], Direction.RIGHT),
        movableNpc(1, "茶髪", 3, 2, 1, 1, Direction.LEFT),
        movableNpc(2, "警官", 2, 3, 1, 1, Direction.UP),
        movableNpc(3, "紳士", 3, 3, 1, 1, Direction.LEFT),
        nonmovableNpc(4, "婦人", [Direction.UP, Direction.RIGHT], Direction.LEFT),
    ];
    var DIRECTION_NAME = ["上", "下", "左", "右"];

    var context = new Context(0, npcs);
    context.init();
    context.incFrame(30);
    for (var i = 0; i < 500; i++) {
        context.advance();
        context.incFrame(2);
    }
    context.actionLog.forEach(function (action) {
        console.log(action.frame + " " + npcs[action.npcNo].name + "が" + DIRECTION_NAME[action.direction] + (action.isMove ? "に移動" : "を向く"));
    });
}