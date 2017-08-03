//动画兼容性
window.requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (a) {
    window.setTimeout(a, 1000 / 30)
};
/**
 * 游戏相关配置
 * @type {Object}
 */
var CONFIG = {
    status: 'start', // 游戏开始默认为开始中
    level: 1, // 游戏默认等级
    totalLevel: 6, // 总共6关
    numPerLine: 7, // 游戏默认每行多少个怪兽
    canvasPadding: 30, // 默认画布的间隔
    bulletSize: 10, // 默认子弹长度
    bulletSpeed: 10, // 默认子弹的移动速度
    enemySpeed: 2, // 默认敌人移动距离
    enemySize: 50, // 默认敌人的尺寸
    enemyGap: 10,  // 默认敌人之间的间距
    enemyIcon: './img/enemy.png', // 怪兽的图像
    enemyBoomIcon: './img/boom.png', // 怪兽死亡的图像
    enemyDirection: 'right', // 默认敌人一开始往右移动
    planeSpeed: 5, // 默认飞机每一步移动的距离
    planeSize: {
        width: 60,
        height: 100
    }, // 默认飞机的尺寸,
    planeIcon: './img/plane.png'
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


//音频

function Sound() {
    this.soundFile = {};

}

//播放音频 参数为名字
Sound.prototype = {
    play: function (status) {
        var sound = this.soundFile[status];
        sound.play();
    },
    //读取音频
    load: function (id) {
        if(!this.soundFile[id]){
            this.soundFile[id] = new Audio('sound/' + id + '.mp3');
            this.soundOnload = true;
        };
    },
    pause: function (status) {
        var sound = this.soundFile[status];

        if (sound && !sound.paused) {
            sound.pause();
        }
    }

}
/*
 *游戏元素
 */
function Elements(opts) {
    //获取设置
    var option = opts || {};
    //设置x坐标
    this.x = option.x;
    //y坐标
    this.y = option.y;
    //速度
    this.speed = option.speed;
    //运动方向
}

/*
 *游戏元素通用方法
 */
Elements.prototype = {
    //移动 参数为移动距离
    move: function (x, y) {
        var x = x || 0;
        var y = y || 0;

        this.x += x;
        this.y += y;
    }

}

//键盘监听
function key() {
    this.left = false;
    this.right = false;
    this.space = false;
    document.onkeydown = this.keydown.bind(this);
    document.onkeyup = this.keyup.bind(this);
}

key.prototype = {
    keydown: function (key) {
        var keycode = key.keyCode;
        if (keycode === 32) {
            this.space = true;
        } else if (keycode === 37) {
            this.left = true;
            this.right = false;
        } else if (keycode === 39) {
            this.right = true;
            this.left = false;
        }
    },
    keyup: function (key) {
        var keycode = key.keyCode;
        if (keycode === 32) {
            this.space = false;
        } else if (keycode === 37) {
            this.left = false;
        } else if (keycode === 39) {
            this.right = false;
        }
    }
}

//继承 参数类型为 子对象 父对象
function inheritPrototype(subType, superType) {
    var Temp = Object.create(superType.prototype);
    Temp.constructor = subType;
    subType.prototype = Temp;
}

//飞机的数据
function Plane(opts) {
    var options = opts || {};
    Elements.call(this, options);
    this.size = CONFIG.planeSize;
    this.bullets = [];
    this.setImg();
}

inheritPrototype(Plane, Elements);

Plane.prototype.draw = function () {
    context.drawImage(Plane.img, this.x, this.y, this.size.width, this.size.height);

    //绘制子弹
    this.shootBullets();
};
// 读取图片
Plane.prototype.setImg = function () {
    if (!this.img) {
        var img = new Image();
        img.src = CONFIG.planeIcon;
        img.onload = function () {
            Plane.img = img;
        }
    }
}
//子弹相关属性
    Plane.prototype.shoot = function () {
        //子弹发射点
        var X = this.x + this.size.width / 2;
        this.bullets.push(new Bullet({
            x: X,
            y: this.y
        }))
    };
//发射子弹
    Plane.prototype.shootBullets = function () {

        this.bullets.forEach(function (t, i) {
            t.action();

            if (t.y <= 0) {
                GAME.plane.bullets.splice(i, 1);
            }
            t.draw();
        })
    }

//运动 参数为方向
    Plane.prototype.action = function (direction) {
        var step;
        //到达边界时 不能再移动
        if (direction === 'left') {
            step = this.x <= pd ? 0 : -this.speed;
        } else {
            step = this.x >= GAME.planeMaxX ? 0 : this.speed;
        }
        this.move(step, 0)
    }
//检测是否攻击到怪兽
    Plane.prototype.Hitted = function (monster) {
        //碰撞检测
        GAME.plane.bullets.forEach(function (item, i) {
            var X = monster.x < item.x && item.x < (monster.x + monster.size);
            var Y = monster.y < item.y && item.y < (monster.y + monster.size);
            if (X && Y) {
                GAME.plane.bullets.splice(i, 1);
                monster.status = "beHitted";

            }
        })

    }
//子弹
    var Bullet = function (opts) {
        var options = opts || {};
        Elements.call(this, options);
        this.hasPlaySound = false;
        this.sound = new Sound();
        this.sound.load('shoot');
    }
    inheritPrototype(Bullet, Elements);

    Bullet.prototype.action = function () {
        if (this.hasPlaySound === false) {
            this.hasPlaySound = true;
            this.sound.play('shoot');
        }
        this.move(0, -CONFIG.bulletSpeed);
    }

    Bullet.prototype.draw = function () {
        context.strokeStyle = "#fff";
        context.beginPath();
        context.moveTo(this.x, this.y);
        context.lineTo(this.x, this.y - CONFIG.bulletSize);
        context.closePath();
        context.stroke();
    };

//怪兽数据
    function Monster(opts) {
        var options = opts || {};
        Elements.call(this, options);
        this.size = options.size;
        this.status = 'live';
        this.countFrame = 0;
        this.sound = new Sound();
        this.setImg();
        this.sound.load('boom');

    };

    inheritPrototype(Monster, Elements);

    Monster.prototype.setImg = function () {
        if (!this.img) {
            var img1 = new Image();
            img1.src = CONFIG.enemyIcon;
            img1.onload = function () {
                Monster.img = img1;
                this.imgLoad = true;
            };
        }
        ;

        var img = new Image();
        img.src = CONFIG.enemyBoomIcon;
        img.onload = function () {
            Monster.boomImg = img;
        }
        ;
    }
    Monster.prototype.draw = function () {
        //如果没被击中 正常显示
        if (Monster.img && Monster.boomImg) {
            if (this.status === 'live') {
                context.drawImage(Monster.img, this.x, this.y, this.size, this.size);
            } else if (this.status === "beHitted") {
                context.drawImage(Monster.boomImg, this.x, this.y, this.size, this.size);
            }
        }
    }
//运动 参数为方向
    Monster.prototype.action = function (direction) {
        if (direction === 'left') {
            this.move(-this.speed, 0);
        } else {
            this.move(this.speed, 0);
        }
    }
    Monster.prototype.beHitted = function () {
        this.sound.play('boom');
        this.status = 'beHitted';
        this.countFrame++;

        if (this.countFrame > 3) {
            this.status = 'died';
        }
    }


//清除画布；
    function clean() {
        context.clearRect(0, 0, canvasW, canvasH);
    }

    /**
     * 整个游戏对象
     */
    var animation = null;
    var flag;
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
            this.sound = new Sound();
            this.sound.load('failed');
            this.sound.load('start');
            this.sound.load('stop');
            this.sound.load('success');
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
                if (self.sound.soundOnload && self.monsters[0].imgLoad){
                    self.play();
                }else {
                    alert('请等待资源加载完毕');
                }
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
                self.sound.play('stop');
                self.setStatus("stop");
            }
            returnBtn.onclick = function () {
                animation = requestAnimationFrame(self.update);
                self.setStatus("playing");
                self.sound.play('start');
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
            this.drawLevel();
            this.sound.soundFile.start.currentTime = 0;
            this.sound.play('start');

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
            console.log(GAME.level);
        },
        drawScore: function () {
            score.innerHTML = GAME.count;
        },
        update: function () {
            //标识是否到达边界

            var self = GAME;
            flag = false;
            //清除画布
            clean();
            //监听键盘
            if (self.key.left) {
                self.plane.action("left");
            }

            if (self.key.right) {
                self.plane.action("right");
            }

            if (self.key.space) {
                self.key.space = false;
                self.plane.shoot();
            }

            //到达边界时 转变方向
            var limit = self.getMinXAndMaxX(self.monsters);

            if (limit.minX < pd || limit.maxX > self.monstersMaxX) {
                CONFIG.enemyDirection = CONFIG.enemyDirection === "right" ? "left" : "right";
                flag = true;
            }

            self.monsters.forEach(function (item) {
                if (flag) {
                    item.move(0, item.size);
                }

                //怪兽运动
                item.action(CONFIG.enemyDirection);

            })

            //怪兽对应状态
            for (var i = self.monsters.length - 1; i >= 0; i--) {
                if (self.monsters[i].status === "live") {
                    if (GAME.plane.Hitted(self.monsters[i])) {
                        self.monsters[i].status === "beHitted";
                    }
                } else if (self.monsters[i].status === "beHitted") {
                    self.monsters[i].beHitted();
                } else if (self.monsters[i].status === "died") {
                    self.monsters.splice(i, 1);
                    self.count++;
                }
            }

            //渲染各个元素
            self.drawScore();
            self.draw();
            //刷新动画
            animation = requestAnimationFrame(self.update);
            //如果怪兽都死了
            if (self.monsters.length === 0) {
                GAME.sound.play('success');
                //判断是否通关
                if (self.level === CONFIG.totalLevel) {
                    clean();
                    GAME.setStatus("all-success");
                } else {
                    clean();
                    GAME.setStatus("success");
                }
            }

            //如果怪兽到达活动范围之外
            if (self.monsters.length > 0 && self.monsters[self.monsters.length - 1].y > self.monstersAreaY) {
                //游戏失败
                window.cancelAnimationFrame(animation);
                clean();
                GAME.sound.play('failed');
                GAME.setStatus("failed");
                totalScore.innerHTML = self.count;
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
