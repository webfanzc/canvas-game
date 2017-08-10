//继承 参数类型为 子对象 父对象
function inheritPrototype(subType, superType) {
    var Temp = Object.create(superType.prototype);
    Temp.constructor = subType;
    subType.prototype = Temp;
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
    var img = new Image();
    img.src = CONFIG.planeIcon;
    img.onload = function () {
        Plane.img = img;
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
}
inheritPrototype(Bullet, Elements);

Bullet.prototype.action = function () {
    if (this.hasPlaySound === false) {
        this.hasPlaySound = true;
        Sound.play('shoot');
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
    this.setImg();

};

inheritPrototype(Monster, Elements);

Monster.prototype.setImg = function () {
    var img1 = new Image();
    img1.src = CONFIG.enemyIcon;
    img1.onload = function () {
        Monster.img = img1;
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
    Sound.play('boom');
    this.status = 'beHitted';
    this.countFrame++;

    if (this.countFrame > 3) {
        this.status = 'died';
    }
}

