//动画兼容性
window.requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (a) {
    window.setTimeout(a, 1000 / 30)
};

var container = document.getElementById('game');
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var canvasW = canvas.width;
var canvasH = canvas.height;
var level = document.querySelector(".game-level");
var nextLevel = document.querySelector(".game-next-level");
var score = document.querySelector(".game-score .score-rt");
var totalScore = document.querySelector(".game-failed .score");
var pd = CONFIG.canvasPadding;
var planeW = CONFIG.planeSize.width;
var planeH = CONFIG.planeSize.height;
var animation = null;
var flag;
//清除画布；
function clean() {
    context.clearRect(0, 0, canvasW, canvasH);
}

/**
 * 整个游戏对象
 */

var GAME = {
    /**
     * 初始化函数,这个函数只执行一次
     * @param  {object} opts
     * @return {[type]}      [description]
     */
    init: function (opts) {
        this.status = 'start';
        this.level = CONFIG.level;
        this.count = 0;
        this.planeMaxX = canvasW - pd - planeW;
        this.planeX = (canvasW - planeW) / 2;
        this.monsters = [];
        this.monstersMaxX = canvasW - pd - CONFIG.enemySize;
        this.monstersAreaY = canvasH - planeH - pd * 2;
        this.key = new key();
        this.plane = new Plane({
            x: this.planeX,
            y: canvasH - pd - CONFIG.planeSize.height,
            size: CONFIG.planeSize,
            minX: pd,
            maxX: this.planeMaxX,
            speed: CONFIG.planeSpeed
        });
        this.drawLevel();
        this.bindEvent();
    },
    bindEvent: function () {
        var self = this;
        var playBtn = document.querySelector('.js-play');
        var replayBtn = document.querySelectorAll('.js-replay');
        var nextBtn = document.querySelector('.js-next');
        var stopBtn = document.querySelector('.js-stop');
        var returnBtn = document.querySelector(".js-return");
        playBtn.onclick = function () {
            self.play();
        };

        //重新开始
        replayBtn.forEach(function (item) {
            item.onclick = function () {
                clean();
                self.level = 1;
                self.count = 0;
                self.monsters = [];
                self.play();
                self.drawScore();
            }
        });

        //下一关
        nextBtn.onclick = function () {
            clean();
            self.level++;
            self.play();
        }
        //暂停
        stopBtn.onclick = function () {
            clean();
            cancelAnimationFrame(animation);
            Sound.play('stop');
            self.setStatus("stop");
        }
        returnBtn.onclick = function () {
            animation = requestAnimationFrame(function () {
                self.update();
            });
            self.setStatus("playing");
            Sound.play('start');
        }
    },
    /**
     * 更新游戏状态，分别有以下几种状态：
     * start  游戏前
     * playing 游戏中
     * failed 游戏失败
     * success 游戏成功
     * stop 游戏暂停
     */
    setStatus: function (status) {
        this.status = status;
        container.setAttribute("data-status", status);
    },
    play: function () {
        this.plane.bullets = [];
        this.setStatus('playing');
        this.initMonsters();
        this.update();
        this.drawScore();
        this.drawLevel();
        Sound.play('start');
    },
    draw: function () {
        this.plane.draw();
        this.monsters.forEach(function (item) {
            item.draw();
        });
    },
    drawLevel: function () {
        level.innerHTML = "当前Level：" + GAME.level;
        nextLevel.innerHTML = "下一个Level： " + (GAME.level + 1);
    },
    drawScore: function () {
        score.innerHTML = GAME.count;
    },
    keyListen: function () {
        //监听键盘
        if (this.key.left) {
            this.plane.action("left");
        }

        if (this.key.right) {
            this.plane.action("right");
        }

        if (this.key.space) {
            this.key.space = false;
            this.plane.shoot();
        }

    },
    monsterListen: function () {
        //到达边界时 转变方向
        if (this.monsters.length !== 0) {
            var limit = this.getMinXAndMaxX(this.monsters);

            if (limit.minX < pd || limit.maxX > this.monstersMaxX) {
                CONFIG.enemyDirection = CONFIG.enemyDirection === "right" ? "left" : "right";
                flag = true;
            }

        }
        //到达边界时向下运动
        this.monsters.forEach(function (item) {
            if (flag) {
                item.move(0, item.size);
            }

            //怪兽运动
            item.action(CONFIG.enemyDirection);

        })

        //怪兽对应状态
        for (var i = this.monsters.length - 1; i >= 0; i--) {
            if (this.monsters[i].status === "live") {
                if (this.plane.Hitted(this.monsters[i])) {
                    this.monsters[i].status === "beHitted";
                }
            } else if (this.monsters[i].status === "beHitted") {
                this.monsters[i].beHitted();
            } else if (this.monsters[i].status === "died") {
                this.count++;
                this.drawScore();
                this.monsters.splice(i, 1);
            }
        }
    },
    update: function () {
        //标识是否到达边界

        var self = GAME;
        flag = false;
        //清除画布
        clean();
        this.keyListen();
        this.monsterListen();
        //渲染各个元素
        this.draw();
        //刷新动画
        animation = requestAnimationFrame(function () {
            self.update();
        });
        //如果怪兽都死了
        if (this.monsters.length === 0) {
            Sound.play('success');
            //判断是否通关
            if (this.level === CONFIG.totalLevel) {
                clean();
                this.setStatus("all-success");
            } else {
                clean();
                this.setStatus("success");
            }

            window.cancelAnimationFrame(animation);
            return;
        }

        //如果怪兽到达活动范围之外
        if (this.monsters.length > 0 && this.monsters[this.monsters.length - 1].y > this.monstersAreaY) {
            //游戏失败
            window.cancelAnimationFrame(animation);
            clean();
            Sound.play('failed');
            this.setStatus("failed");
            totalScore.innerHTML = this.count;
        }


    },
    //初始化怪兽
    initMonsters: function () {
        var size = CONFIG.enemySize;
        var gap = CONFIG.enemyGap;
        //循环添加怪兽
        for (var i = 0; i < this.level; i++) {
            for (var j = 0; j < CONFIG.numPerLine; j++) {
                var monster = new Monster({
                    x: pd + j * (gap + size),
                    y: pd + i * (gap + size),
                    size: size,
                    speed: CONFIG.enemySpeed
                });
                this.monsters.push(monster);
            }
        }
    },
//获取边界
    getMinXAndMaxX: function (item) {
        var minX = item[0].x;
        var maxX = item[item.length - 1].x;
        item.forEach(function (t) {
            if (t.x < minX) {
                minX = t.x
            }
            if (t.x > maxX) {
                maxX = t.x
            }
        });
        return {
            minX: minX,
            maxX: maxX
        }
    }

};


// 初始化
GAME.init();
