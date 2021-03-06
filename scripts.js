var FIRST_RIGHT_HAND_STAGE = 5;
var FIRST_LEFT_HAND_STAGE  = 6;
var RESTARTING_STAGE       = 8;
var WIDE_STAGE             = 10;
var TALL_STAGE             = 11;
var STOP_GROWING_STAGE     = 11;
var BATTLE_STAGE           = 12;
var STOP_SPEEDING_UP_STAGE = 12;
var TRAILBLAZIN_STAGE      = 13;
var DARKNESS_STAGE         = 14;
var REVERSE_STAGE          = 15;
var RESTARTING_STAGE_2     = 16;
var PIVOTING_STAGE         = 17;
var SPINNING_STAGE         = 18;
var TRICK_STAGE            = 19;
var HALF_PORTAL_STAGE      = 20;
var FOURTH_PORTAL_STAGE    = 21;
var THANKS_STAGE           = 22;
var LAST_STAGE             = 22;

var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;

var H = 72;
var J = 74;
var K = 75;
var L = 76;

var TIME_BEFORE_SHAKE = 500;
var PADDING_FROM_EDGE = 50;

function findTopCell(disjoint_set, cell) {
    var next_cell = disjoint_set[cell[0]][cell[1]];
    if (!next_cell) {
        return cell;
    }
    next_cell = findTopCell(disjoint_set, next_cell);
    disjoint_set[cell[0]][cell[1]] = next_cell;
    return next_cell;
}
function generateMaze(height, width) {
    var walls = [];
    var disjoint_set = [];
    var maze = [];
    for (var y = 0; y < height; y++) {
        disjoint_set[y] = [];
        maze[y] = [];
        for (var x = 0; x < width; x++) {
            disjoint_set[y][x] = null;
            maze[y][x] = [false, false];
            if (y + 1 < height) {
                walls.push([[y, x], [true, false]]);
            }
            if (x + 1 < width) {
                walls.push([[y, x], [false, true]]);
            }
        }
    }
    var walls_count = walls.length;
    for (var i = 0; i < walls_count; i++) {
        var h = Math.floor(Math.random() * walls.length);
        var wall = walls[h];
        walls.splice(h, 1);
        var cell_0 = wall[0];
        var cell_1 = [cell_0[0] + wall[1][0], cell_0[1] + wall[1][1]];
        var cell_0_top = findTopCell(disjoint_set, cell_0);
        var cell_1_top = findTopCell(disjoint_set, cell_1);
        if (cell_0_top[0] !== cell_1_top[0] || cell_0_top[1] !== cell_1_top[1]) {
            disjoint_set[cell_1_top[0]][cell_1_top[1]] = cell_0_top;
            var prev_val = maze[cell_0[0]][cell_0[1]];
            maze[cell_0[0]][cell_0[1]] = [prev_val[0] || wall[1][0], prev_val[1] || wall[1][1]];
        }
    }
    return maze;
}
function make_teleports(teleports, pos_0, pos_1, one_way) {
    teleports[pos_0[0]] = teleports[pos_0[0]] || [];
    teleports[pos_0[0]][pos_0[1]] = pos_1;
    if (!one_way) {
        teleports[pos_1[0]] = teleports[pos_1[0]] || [];
        teleports[pos_1[0]][pos_1[1]] = pos_0;
    }
}
function can_go(maze, pos, dir) {
    switch (dir) {
        case 'up':
            return (pos[0] !== 0) && maze[pos[0] - 1][pos[1]][0];
        case 'down':
            return (pos[0] !== maze.length - 1) && maze[pos[0]][pos[1]][0];
        case 'right':
            return (pos[1] !== maze[0].length - 1) && maze[pos[0]][pos[1]][1];
        case 'left':
            return (pos[1] !== 0) && maze[pos[0]][pos[1] - 1][1];
    }
    return false;
}
function go(pos, dir) {
    switch (dir) {
        case 'up':
            return [pos[0] - 1, pos[1]];
        case 'down':
            return [pos[0] + 1, pos[1]];
        case 'right':
            return [pos[0], pos[1] + 1];
        case 'left':
            return [pos[0], pos[1] - 1];
    }
    return pos;
}
function draw_maze(maze, maze_element, size, level) {
    for (var y = 0; y < maze.length; y++) {
        var maze_row = $('<div class="row"></div>')
            .appendTo(maze_element)
            .css('width', size * maze[y].length + 2 * (maze[y].length + 1));
        for (var x = 0; x < maze[y].length; x++) {
            var maze_cell = $('<div class="cell"></div>')
                .appendTo(maze_row)
                .css('height', size)
                .css('width', size);
            if (level !== TRAILBLAZIN_STAGE && level !== DARKNESS_STAGE) {
                maze_cell
                    .toggleClass('border-top', y === 0)
                    .toggleClass('border-left', x === 0)
                    .toggleClass('border-down', !can_go(maze, [y, x], 'down'))
                    .toggleClass('border-right', !can_go(maze, [y, x], 'right'));
            }
        }
    }
}
function draw_shapes(lines, height, width) {
    var open_spot = {};
    (lines || []).forEach(function(line) {
        switch (line[0]) {
            case 'x':
                for (var x = line[2]; x <= line[3]; x++) {
                    open_spot[line[1]] = open_spot[line[1]] || {};
                    open_spot[line[1]][x] = true;
                }
                break;
            case 'y':
                for (var y = line[2]; y <= line[3]; y++) {
                    open_spot[y] = open_spot[y] || {};
                    open_spot[y][line[1]] = true;
                }
                break;
        }
    });

    var maze = [];
    for (var y = 0; y < height; y++) {
        maze[y] = [];
        for (var x = 0; x < width; x++) {
            maze[y][x] = [(open_spot[y] && open_spot[y][x]) === (open_spot[y + 1] && open_spot[y + 1][x]),
                          (open_spot[y] && open_spot[y][x]) === (open_spot[y] && open_spot[y][x + 1])];
        }
    }
    return maze;
}
var counter_clockwise = { right: 'up', up: 'left', left: 'down', down: 'right' };
var clockwise = { up: 'right', left: 'up', down: 'left', right: 'down' };
function play_level(level, score) {
    window.location.hash = level;
    $('#score').text(score);
    $('#lost_overlay').hide();
    var height;
    var width;
    switch (level) {
        case TALL_STAGE:
            height = 39;
            width = 13;
            break;
        case WIDE_STAGE:
            height = 13;
            width = 52;
            break;
        case BATTLE_STAGE:
            height = 39;
            width = 53;
            break;
        case TRAILBLAZIN_STAGE:
            height = 18;
            width = 18;
            break;
        case DARKNESS_STAGE:
            height = 14;
            width = 14;
            break;
        case REVERSE_STAGE:
            height = 10;
            width = 10;
            break;
        case THANKS_STAGE:
            height = 13;
            width = 28;
            break;
        default:
            height = 4 + 2 * Math.min(STOP_GROWING_STAGE, level);
            width = 4 + 2 * Math.min(STOP_GROWING_STAGE, level);
            break;
    }
    var maze;
    var teleports = [];
    switch (level) {
        case HALF_PORTAL_STAGE:
            var mazes = [generateMaze(height, width / 2), generateMaze(height, width / 2)];
            maze = [];
            for (var y = 0; y < height; y++) {
                maze[y] = [];
                for (var x = 0; x < width; x++) {
                    maze[y][x] = mazes[0][y][x];
                }
                for (var x = width / 2; x < width; x++) {
                    maze[y][x] = mazes[1][y][x - width / 2];
                }
            }
            make_teleports(teleports, [height - 1, width / 2 - 1], [0, width / 2]);
            break;
        case FOURTH_PORTAL_STAGE:
            var mazes = [generateMaze(height / 2, width / 2),
                         generateMaze(height / 2, width / 2),
                         generateMaze(height / 2, width / 2),
                         generateMaze(height / 2, width / 2)];
            maze = [];
            for (var y = 0; y < height / 2; y++) {
                maze[y] = [];
                for (var x = 0; x < width / 2; x++) {
                    maze[y][x] = mazes[0][y][x];
                }
                for (var x = width / 2; x < width; x++) {
                    maze[y][x] = mazes[1][y][x - width / 2];
                }
            }
            for (var y = height / 2; y < height; y++) {
                maze[y] = [];
                for (var x = 0; x < width / 2; x++) {
                    maze[y][x] = mazes[2][y - height / 2][x];
                }
                for (var x = width / 2; x < width; x++) {
                    maze[y][x] = mazes[3][y - height / 2][x - width / 2];
                }
            }
            make_teleports(teleports, [height / 2 - 1, width / 2 - 1], [0, width / 2]);
            make_teleports(teleports, [height / 2 - 1, width - 1], [height / 2, 0]);
            make_teleports(teleports, [height - 1, width / 2 - 1], [height / 2, width / 2]);
            break;
        case THANKS_STAGE:
            maze = draw_shapes([['x', 1, 1, 5], ['y', 3, 1, 5],                                                         // T
                                ['y', 7, 1, 5], ['x', 3, 7, 10], ['y', 10, 1, 5],                                       // H
                                ['y', 12, 1, 5], ['x', 1, 13, 15], ['x', 3, 13, 15], ['y', 15, 1, 5],                   // A
                                ['y', 17, 1, 5], ['y', 18, 2, 3], ['y', 19, 3, 4], ['y', 20, 1, 5],                     // N
                                ['y', 22, 1, 5], ['y', 23, 3, 3], ['y', 24, 2, 4], ['y', 25, 1, 2], ['y', 25, 4, 5],    // K
                                ['y', 6, 7, 8], ['y', 7, 8, 9], ['y', 8, 9, 11], ['y', 9, 8, 9], ['y', 10, 7, 8],       // Y
                                ['y', 12, 7, 11], ['x', 7, 13, 15], ['x', 11, 13, 15], ['y', 15, 7, 11],                // O
                                ['y', 17, 7, 11], ['x', 11, 17, 20], ['y', 20, 7, 11],                                  // U
                                ['y', 22, 7, 9], ['y', 22, 11, 11]                                                      // !
                               ], height, width);
            make_teleports(teleports, [1, 5], [9, 8], true);
            make_teleports(teleports, [5, 3], [3, 23], true);
            make_teleports(teleports, [7, 10], [5, 15]);
            make_teleports(teleports, [1, 25], [5, 12]);
            make_teleports(teleports, [5, 25], [1, 3], true);
            make_teleports(teleports, [7, 6], [1, 3], true);
            make_teleports(teleports, [1, 1], [7, 17], true);
            make_teleports(teleports, [1, 12], [1, 3], true);
            make_teleports(teleports, [1, 15], [1, 3], true);
            make_teleports(teleports, [8, 17], [2, 13], true);
            make_teleports(teleports, [2, 14], [9, 17], true);
            make_teleports(teleports, [10, 17], [9, 13], true);
            make_teleports(teleports, [8, 13], [9, 8], true);
            make_teleports(teleports, [10, 14], [3, 23], true);
            make_teleports(teleports, [10, 13], [2, 14], true);
            make_teleports(teleports, [9, 14], [1, 3], true);
            make_teleports(teleports, [2, 13], [9, 14], true);
            make_teleports(teleports, [8, 14], [11, 17], true);
            make_teleports(teleports, [11, 19], [1, 3], true);
            make_teleports(teleports, [11, 20], [3, 23], true);
            make_teleports(teleports, [11, 17], [10, 20], true);
            make_teleports(teleports, [7, 20], [5, 17]);
            make_teleports(teleports, [1, 20], [1, 7], true);
            make_teleports(teleports, [3, 9], [1, 14]);
            make_teleports(teleports, [1, 13], [3, 10]);
            make_teleports(teleports, [1, 10], [1, 7], true);
            make_teleports(teleports, [5, 10], [7, 22]);
            make_teleports(teleports, [9, 22], [height - 1, width - 1], true);
            break;
        default:
            maze = generateMaze(height, width);
            break;
    }
    var size = Math.min(($(window).height() - 2 * PADDING_FROM_EDGE) / height, ($(window).width() - 2 * PADDING_FROM_EDGE) / width);
    if (level === SPINNING_STAGE) {
        size = (Math.min($(window).height(), $(window).width()) - 2 * PADDING_FROM_EDGE) / Math.max(height, width) / Math.sqrt(2);
    }
    var playing = true;
    var end = (level !== BATTLE_STAGE) ? [height - 1, width - 1] : [19, 26];
    switch (level) {
        case BATTLE_STAGE:
            end = [19, 26];
            break;
        case THANKS_STAGE:
            end = [0, 0];
            break;
        default:
            end = [height - 1, width - 1];
            break;
    }

    $('body')
        .removeClass('level-' + (level - 1))
        .addClass('level-' + level);

    var maze_element = $('#maze')
        .empty()
        .css('width', width * size)
        .removeClass('shake shake-constant')
        .toggleClass('spinning', level === SPINNING_STAGE)
        .removeClass('pivot-90')
        .removeClass('pivot-180')
        .removeClass('pivot-270');
    draw_maze(maze, maze_element, size, level);

    var end_grem = $('<div class="grem end-grem"></div>')
        .appendTo(maze_element)
        .css('height', size - 8)
        .css('width', size - 8)
        .css('transform', 'translate3d(' + (end[1] * size) + 'px, ' + (end[0] * size) + 'px, 0)');

    teleports.forEach(function(x_list, y) {
        x_list.forEach(function(spot, x) {
            teleport_grem = $('<div class="grem teleport-grem"></div>')
                .appendTo(maze_element)
                .css('height', size - 8)
                .css('width', size - 8)
                .css('transform', 'translate3d(' + (x * size) + 'px, ' + (y * size) + 'px, 0)');
        });
    });

    if (level >= FIRST_RIGHT_HAND_STAGE && level !== TRAILBLAZIN_STAGE && level !== DARKNESS_STAGE && level !== REVERSE_STAGE && level !== THANKS_STAGE) {
        var right_dir = 'right';
        var right_pos = (level !== BATTLE_STAGE) ? [0, 0] : [height - 1, width - 1];
        var right_grem = $('<div class="grem"></div>')
            .appendTo(maze_element)
            .addClass('bad-grem-' + Math.floor(6 * Math.random()))
            .css('height', size - 8)
            .css('width', size - 8)
            .css('transform', 'translate3d(' + (right_pos[1] * size) + 'px, ' + (right_pos[0] * size) + 'px, 0)');
        setInterval(function move_right_grem() {
            if (!playing) {
                clearInterval(move_right_grem);
                return;
            }
            right_dir = clockwise[right_dir];
            while (!can_go(maze, right_pos, right_dir)) {
                right_dir = counter_clockwise[right_dir];
            }
            right_pos = go(right_pos, right_dir)
            if (teleports[right_pos[0]] && teleports[right_pos[0]][right_pos[1]]) {
                right_pos = teleports[right_pos[0]][right_pos[1]];
            }
            window.requestAnimationFrame(function() {
                right_grem.css('transform', 'translate3d(' + (right_pos[1] * size) + 'px, ' + (right_pos[0] * size) + 'px, 0)');
            });
            if (right_pos[0] === end[0] && right_pos[1] === end[1]) {
                playing = false;
                ga('send', 'event', '/#' + level, 'lose', 'right hand grem');
                $('#lost_overlay').show();
                $('#lost_overlay').find('#reason').text('A Grem Beat You!');
                $('#lost_overlay').find('#start_over').one('click', function() {
                    play_level(level, score / 2);
                });
            }
        }, 150 - 10 * (Math.min(STOP_SPEEDING_UP_STAGE, level) - Math.min(FIRST_RIGHT_HAND_STAGE, FIRST_LEFT_HAND_STAGE)));
    }

    if (level >= FIRST_LEFT_HAND_STAGE && level !== TRAILBLAZIN_STAGE && level !== DARKNESS_STAGE && level !== REVERSE_STAGE && level !== THANKS_STAGE) {
        var left_dir = 'down';
        var left_pos = (level !== BATTLE_STAGE) ? [0, 0] : [height - 1, width - 1];
        var left_grem = $('<div class="grem"></div>')
            .appendTo(maze_element)
            .addClass('bad-grem-' + Math.floor(5 * Math.random()))
            .css('height', size - 8)
            .css('width', size - 8)
            .css('transform', 'translate3d(' + (left_pos[1] * size) + 'px, ' + (left_pos[0] * size) + 'px, 0)');
        setInterval(function move_left_grem() {
            if (!playing) {
                clearInterval(move_left_grem);
                return;
            }
            left_dir = counter_clockwise[left_dir];
            while (!can_go(maze, left_pos, left_dir)) {
                left_dir = clockwise[left_dir];
            }
            left_pos = go(left_pos, left_dir)
            if (teleports[left_pos[0]] && teleports[left_pos[0]][left_pos[1]]) {
                left_pos = teleports[left_pos[0]][left_pos[1]];
            }
            window.requestAnimationFrame(function() {
                left_grem.css('transform', 'translate3d(' + (left_pos[1] * size) + 'px, ' + (left_pos[0] * size) + 'px, 0)');
            });
            if (left_pos[0] === end[0] && left_pos[1] === end[1]) {
                playing = false;
                ga('send', 'event', '/#' + level, 'lose', 'left hand grem');
                $('#lost_overlay').show();
                $('#lost_overlay').find('#reason').text('A Grem Beat You!');
                $('#lost_overlay').find('#start_over').one('click', function() {
                    play_level(level, score / 2);
                });
            }
        }, 150 - 10 * (Math.min(STOP_SPEEDING_UP_STAGE, level) - Math.min(FIRST_RIGHT_HAND_STAGE, FIRST_LEFT_HAND_STAGE)));
    }

    if (level === RESTARTING_STAGE || level === RESTARTING_STAGE_2) {
        setTimeout(function() {
            if (!playing) {
                return;
            }
            maze_element.addClass('shake shake-constant')
            setTimeout(function() {
                if (!playing) {
                    return;
                }
                maze_element.removeClass('shake shake-constant')
                maze = generateMaze(height, width);
                maze_element.find('.row').remove();
                draw_maze(maze, maze_element, size);
                setInterval(function reset_level() {
                    if (!playing) {
                        clearInterval(reset_level);
                        return;
                    }
                    maze_element.addClass('shake shake-constant')
                    setTimeout(function() {
                        if (!playing) {
                            return;
                        }
                        maze_element.removeClass('shake shake-constant')
                        maze = generateMaze(height, width);
                        maze_element.find('.row').remove();
                        draw_maze(maze, maze_element, size);
                    }, TIME_BEFORE_SHAKE);
                }, ((level === RESTARTING_STAGE) ? 3000 : 10000) - TIME_BEFORE_SHAKE);
            }, TIME_BEFORE_SHAKE);
        }, 5000 - TIME_BEFORE_SHAKE);
    }

    if (level === TRAILBLAZIN_STAGE || level === DARKNESS_STAGE) {
        $($(maze_element
            .find('.row').get(0))
            .find('.cell').get(0))
            .toggleClass('border-top', 0 === 0)
            .toggleClass('border-left', 0 === 0)
            .toggleClass('border-down', !can_go(maze, [0, 0], 'down'))
            .toggleClass('border-right', !can_go(maze, [0, 0], 'right'));
    }
    var vision_timeouts;
    if (level === DARKNESS_STAGE) {
        vision_timeouts = [];
        for (var y = 0; y < height; y++) {
            vision_timeouts[y] = [];
            for (var x = 0; x < width; x++) {
                vision_timeouts[y][x] = null;
            }
        }
    }

    var key_offset = 0;
    if (level === PIVOTING_STAGE) {
        setTimeout(function() {
            if (!playing) {
                return;
            }
            maze_element.addClass('shake shake-constant')
            setTimeout(function() {
                if (!playing) {
                    return;
                }
                maze_element.removeClass('shake shake-constant');
                setTimeout(function() {
                    if (!playing) {
                        return;
                    }
                    key_offset++;
                    maze_element.addClass('pivot-90');
                    setTimeout(function() {
                        if (!playing) {
                            return;
                        }
                        key_offset++;
                        maze_element
                            .removeClass('pivot-90')
                            .addClass('pivot-180');
                        setTimeout(function() {
                            if (!playing) {
                                return;
                            }
                            key_offset++;
                            maze_element
                                .removeClass('pivot-180')
                                .addClass('pivot-270');
                            setTimeout(function() {
                                if (!playing) {
                                    return;
                                }
                                key_offset++;
                                maze_element.removeClass('pivot-270');
                            }, 15000);
                        }, 15000);
                    }, 15000);
                }, 50);
            }, TIME_BEFORE_SHAKE);
        }, 5000 - TIME_BEFORE_SHAKE - 50);
    }

    var pos = (level === THANKS_STAGE) ? [1, 3] : [0, 0];
    var good_grem = $('<div class="grem good-grem"></div>')
        .appendTo(maze_element)
        .css('height', size - 8)
        .css('width', size - 8)
        .css('transform', 'translate3d(' + (pos[1] * size) + 'px, ' + (pos[0] * size) + 'px, 0)');
    $(document).on('keydown', function(e) {
        if (!playing) {
            return;
        }
        var last_pos = [pos[0], pos[1]];
        switch (e.which) {
            case KEY_LEFT + ((KEY_LEFT + key_offset - KEY_LEFT) % 4):
            case H:
                e.preventDefault();
                if (!can_go(maze, pos, 'left')) {
                    return;
                }
                pos = go(pos, 'left')
                break;
            case KEY_LEFT + ((KEY_UP + key_offset - KEY_LEFT) % 4):
            case K:
                e.preventDefault();
                if (!can_go(maze, pos, 'up')) {
                    return;
                }
                pos = go(pos, 'up')
                break;
            case KEY_LEFT + ((KEY_RIGHT + key_offset - KEY_LEFT) % 4):
            case L:
                e.preventDefault();
                if (!can_go(maze, pos, 'right')) {
                    return;
                }
                pos = go(pos, 'right')
                break;
            case KEY_LEFT + ((KEY_DOWN + key_offset - KEY_LEFT) % 4):
            case J:
                e.preventDefault();
                if (!can_go(maze, pos, 'down')) {
                    return;
                }
                pos = go(pos, 'down')
                break;
            default:
                return;
        }
        if (level === DARKNESS_STAGE) {
            clearTimeout(vision_timeouts[pos[0]][pos[1]]);
            vision_timeouts[pos[0]][pos[1]] = null;
            vision_timeouts[last_pos[0]][last_pos[1]] = setTimeout(function() {
                if (!playing) {
                    return;
                }
                $($(maze_element
                    .find('.row').get(last_pos[0]))
                    .find('.cell').get(last_pos[1]))
                    .removeClass('border-top')
                    .removeClass('border-left')
                    .removeClass('border-down')
                    .removeClass('border-right');
                if (last_pos[0] !== 0 && !vision_timeouts[last_pos[0] - 1][last_pos[1]]) {
                    $($(maze_element
                        .find('.row').get(last_pos[0] - 1))
                        .find('.cell').get(last_pos[1]))
                        .removeClass('border-down');
                }
                if (last_pos[1] !== 0 && !vision_timeouts[last_pos[0]][last_pos[1] - 1]) {
                    $($(maze_element
                        .find('.row').get(last_pos[0]))
                        .find('.cell').get(last_pos[1] - 1))
                        .removeClass('border-right');
                }
            }, 7000);
        }
        if (teleports[pos[0]] && teleports[pos[0]][pos[1]]) {
            pos = teleports[pos[0]][pos[1]];
        }
        window.requestAnimationFrame(function() {
            good_grem.css('transform', 'translate3d(' + (pos[1] * size) + 'px, ' + (pos[0] * size) + 'px, 0)');
        });
        if (level === TRAILBLAZIN_STAGE || level === DARKNESS_STAGE) {
            $($(maze_element
                .find('.row').get(pos[0]))
                .find('.cell').get(pos[1]))
                .toggleClass('border-top', pos[0] === 0)
                .toggleClass('border-left', pos[1] === 0)
                .toggleClass('border-down', !can_go(maze, pos, 'down'))
                .toggleClass('border-right', !can_go(maze, pos, 'right'));
            if (pos[0] !== 0) {
                $($(maze_element
                    .find('.row').get(pos[0] - 1))
                    .find('.cell').get(pos[1]))
                    .toggleClass('border-down', !can_go(maze, [pos[0] - 1, pos[1]], 'down'));
            }
            if (pos[1] !== 0) {
                $($(maze_element
                    .find('.row').get(pos[0]))
                    .find('.cell').get(pos[1] - 1))
                    .toggleClass('border-right', !can_go(maze, [pos[0], pos[1] - 1], 'right'));
            }
        }
        if (pos[0] === end[0] && pos[1] === end[1]) {
            if (level === TRICK_STAGE && end[0] !== 0 && end[1] !== 0) {
                end = [0, 0];
                maze_element.addClass('shake shake-constant');
                setTimeout(function() {
                    if (!playing) {
                        return;
                    }
                    maze_element.removeClass('shake shake-constant');
                    end_grem.css('transform', 'translate3d(' + (end[1] * size) + 'px, ' + (end[0] * size) + 'px, 0)');
                }, TIME_BEFORE_SHAKE);
                return;
            }
            playing = false;
            var new_score = score + (level + 1) * Math.ceil(time_remaining);
            ga('send', 'pageview', { page: '/#' + (level + 1) });
            ga('send', 'event', '/#' + level, 'win', null, new_score);
            if (level === LAST_STAGE) {
                $('body').addClass('done');
                $('#score').text(new_score);
                return;
            }
            play_level(level + 1, new_score);
        }
    });

    var time_remaining_elem = $('#time_remaining');
    var level_elem = $('#level');
    var time_remainig = 60 * 1000;

    level_elem.text(level);
    $('#last_level').text(LAST_STAGE);

    var start;
    window.requestAnimationFrame(function updateStats(timestamp) {
        if (!start) start = timestamp;
        time_remaining = Math.max(0, (60 * 1000 + start - timestamp) / 1000);
        playing = (time_remaining > 0) && playing;
        time_remaining_elem
            .text(time_remaining.toFixed(2))
            .css('color', time_remaining < 31 ? (time_remaining < 11 ? 'red' : 'orange') : '');
        if (playing) {
            window.requestAnimationFrame(updateStats);
        } else if (time_remaining <= 0) {
            ga('send', 'event', '/#' + level, 'lose', 'time out');
            $('#lost_overlay').show();
            $('#lost_overlay').find('#reason').text('You Ran out of time!');
            $('#lost_overlay').find('#start_over').one('click', function() {
                play_level(level, score / 2);
            });
        }
    });
}
ga('send', 'pageview', { page: '/#' + (parseInt(window.location.hash.substr(1)) || 0) });
var level = parseInt(window.location.hash.substr(1)) || 0;
if (level < 0 || level > LAST_STAGE) {
    level = 0;
}
play_level(level, 0);
