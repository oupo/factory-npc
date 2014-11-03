/// <reference path="jquery.d.ts" />

function genNpcs() {
    return [
        nonmovableNpc(0, "短パン", [Direction.UP, Direction.RIGHT], Direction.RIGHT),
        movableNpc(1, "茶髪", 3, 2, 1, 1, Direction.LEFT),
        movableNpc(2, "警官", 2, 3, 1, 1, Direction.UP),
        movableNpc(3, "紳士", 3, 3, 1, 1, Direction.LEFT),
        nonmovableNpc(4, "婦人", [Direction.UP, Direction.RIGHT], Direction.LEFT),
    ];
}

function main2() {
    var form = <HTMLFormElement>document.forms["f"];
    var filterInput = <HTMLInputElement>form.elements["filter"];
    filterInput.addEventListener("keypress", (e) => {
        switch (e.key) {
        case "Up":
            filterInput.value += "↑";
            e.preventDefault();
            break;
        case "Down":
            filterInput.value += "↓";
            e.preventDefault();
            break;
        case "Left":
            filterInput.value += "←";
            e.preventDefault();
            break;
        case "Right":
            filterInput.value += "→";
            e.preventDefault();
            break;
        }
    });
    //form.addEventListener("submit");
}

function search(seed, spendingMin, spendingMax, filter) {
    var DIRECTION_NAME = ["↑", "↓", "←", "→"];
    var trs = [];
    for (var i = spendingMin; i <= spendingMax; i++) {
        var npcs = genNpcs();
        var simulator = new NPCSimulator(seed_step(seed, i), npcs);
        simulator.simulate(1000);
        var out = "";
        simulator.actionLog.forEach(function (log) {
            if (npcs[log.npcNo].name == "紳士") {
                out += DIRECTION_NAME[log.direction];
            }
        });
        out = out.slice(0, 20);
        var $tr = $("<tr>");
        $tr.append($("<th>").text(i));
        $tr.append($("<td>").text(out));
        trs.push($tr);
    }
    trs.unshift($("<tr><th>消費<th>結果</tr>"));
    $("#result").empty().append($("<table>").append(trs));
}

function main() {
    var DIRECTION_NAME = ["上", "下", "左", "右"];

    var npcs = genNpcs();
    var simulator = new NPCSimulator(0, npcs);
    simulator.simulate(1000);

    var canvas = <HTMLCanvasElement>document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

    var spending = new Array<number>();
    for (var i = 0; i < simulator.frame; i++) {
        spending[i] = 0;
    }
    simulator.spendingLog.forEach(function (log) {
        spending[log.frame] += 1;
    });

    var sc = 1 / 3;

    npcs.forEach(function (npc, i) {
        ctx.fillStyle = "black";
        ctx.textBaseline = "top";
        ctx.textAlign = "right";
        ctx.fillText(npc.name, 50 - 5, i * 50 + 100);
    });

    ctx.translate(50, 0);

    var prev = 0;
    var sum = 0;
    spending.forEach(function (n, i) {
        if (n == 0) return;
        if (i - prev >= 55) {
            ctx.fillStyle = "#d0d0d0";
            ctx.fillRect(prev * sc, 0, (i - prev) * sc, 500);
            ctx.fillStyle = "black";
            ctx.textBaseline = "top";
            ctx.textAlign = "center";
            ctx.fillText("消費" + sum, ((prev + i) / 2) * sc, 0);
        }
        prev = i;
        sum += n;
    });

    ctx.fillStyle = "black";
    spending.forEach(function (n, i) {
        ctx.fillRect(i * sc, 100 - n * 20, 0.5, n * 20);
    });


    var colors = ["#FFAA19", "#AA6F0F", "#2A54B7", "#8E8E8E", "#FF6DB3"];

    simulator.actionLog.forEach(function (log) {
        var no = log.npcNo;
        var npc = npcs[no];
        var color = colors[no];
        var frame = log.frame;
        ctx.fillStyle = color;
        ctx.fillRect(frame * sc, no * 50 + 100, log.isMove ? 14 * sc : 2, 50);
        ctx.fillStyle = "black";
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.fillText(DIRECTION_NAME[log.direction], frame * sc, no * 50 + 100);
    });
}

//window.onload = main; 